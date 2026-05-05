import { runAgenticChat, SSE_HEADERS, SseWriter } from '@repo/agentic';
import { Response } from 'express';
import OpenAI from 'openai';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

export async function chatWithAgent(req: AuthenticatedRequest, res: Response) {
  const { message, sessionId, ocrText } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return error(res, 'Message is required', 400);
  }

  // --- AI REQUEST LIMIT CHECK ---
  const user = await (prisma as any).user.findUnique({
    where: { id: req.userId },
    select: { level: true, aiRequestCount: true, aiRequestResetAt: true },
  });

  if (!user) return error(res, 'User not found', 404);

  let currentCount = user.aiRequestCount;
  const now = new Date();
  const resetAt = new Date(user.aiRequestResetAt);

  // Reset count if it's a new month
  if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
    currentCount = 0;
    await (prisma as any).user.update({
      where: { id: req.userId },
      data: { aiRequestCount: 0, aiRequestResetAt: now },
    });
  }

  // Determine limit
  const limit = user.level === 'BASIC' ? 5 : user.level === 'PRO' ? 100 : Infinity;

  if (currentCount >= limit) {
    return error(
      res,
      user.level === 'BASIC'
        ? 'Bạn đã hết lượt hỏi AI trong tháng này (5/5). Vui lòng nâng cấp gói Pro để tiếp tục.'
        : 'Bạn đã hết lượt hỏi AI trong tháng này. Vui lòng quay lại vào tháng sau hoặc nâng cấp gói cao hơn.',
      403,
    );
  }
  // -------------------------------

  // OCR requests carry a larger payload — allow up to 20 000 chars for the combined message.
  const maxMessageLen = ocrText ? 20_000 : 2_000;
  if (message.length > maxMessageLen) {
    return error(res, `Message too long (max ${maxMessageLen} characters)`, 400);
  }

  // Flush SSE headers — after this point all errors must go through SSE event: error.
  Object.entries(SSE_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.flushHeaders();

  const writer = new SseWriter(res, { legacyCompat: false, heartbeatMs: 15_000 });
  writer.startHeartbeat();

  let clientDisconnected = false;
  req.on('close', () => {
    clientDisconnected = true;
    writer.close();
    console.log('[SSE] Client disconnected, writer closed');
  });

  try {
    let finalMessage = message.trim();

    if (ocrText) {
      finalMessage = `[Nội dung tài liệu đính kèm (OCR):\n${ocrText}]\n\nYêu cầu của tôi: ${message.trim()}`;
    }

    // Increment AI request count
    const updatedUser = await (prisma as any).user.update({
      where: { id: req.userId },
      data: { aiRequestCount: { increment: 1 } },
      select: { aiRequestCount: true },
    });

    const result = await runAgenticChat(
      req.userId as string,
      finalMessage,
      sessionId || null,

      // onTokenStream → event: message (+ legacy data: { token })
      (token: string) => {
        if (clientDisconnected) return;
        writer.sendToken(token);
      },

      // onToolStatus → event: status (+ legacy data: { status })
      (status: string | null) => {
        if (clientDisconnected) return;
        if (status) {
          writer.sendStatus(status);
        } else {
          writer.clearStatus();
        }
      },

      // isAborted
      () => clientDisconnected,
    );

    if (!clientDisconnected) {
      // Emit ui_signal as a dedicated event before done when present.
      if (result.triggerPayload) {
        writer.sendUiSignal(result.triggerPayload);
      }

      // event: done always carries sessionId, actionType, uiSignal.
      writer.sendDone({
        sessionId: result.sessionId,
        actionType: result.actionType ?? null,
        uiSignal: null,
        triggerPayload: result.triggerPayload ?? null,
        aiRequestCount: updatedUser.aiRequestCount, // Send updated count back
      });
    }
  } catch (err) {
    console.error('[chatWithAgent] error after SSE headers:', err);
    // Must NOT use res.status() here — headers already flushed.
    if (!clientDisconnected) {
      writer.sendError('Hệ thống gặp sự cố, vui lòng thử lại sau.');
    }
  } finally {
    writer.close();
    res.end();
  }
}

export async function getSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const sessions = await (prisma as any).chatSession.findMany({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });

    return success(res, { sessions });
  } catch (err) {
    console.error('getSessions error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getSessionMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const session = await (prisma as any).chatSession.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            actionType: true,
            payload: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) return error(res, 'Session not found', 404);

    return success(res, { session });
  } catch (err) {
    console.error('getSessionMessages error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteSession(req: AuthenticatedRequest, res: Response) {
  try {
    const deleted = await (prisma as any).chatSession.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });

    if (deleted.count === 0) return error(res, 'Session not found', 404);

    return success(res, { message: 'Session deleted' });
  } catch (err) {
    console.error('deleteSession error:', err);
    return error(res, 'Internal server error');
  }
}

const openaiClient = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: 'https://mkp-api.fptcloud.com/v1',
});

export async function extractOcr(req: AuthenticatedRequest, res: Response) {
  const { base64Image } = req.body;
  if (!base64Image || typeof base64Image !== 'string') {
    return error(res, 'Missing base64Image', 400);
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'FPT.AI-KIE-v1.7',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all the text in this image accurately. Respond with only the extracted text.',
            },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
          ],
        },
      ],
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_k: 40,
    } as any);

    const text = response.choices[0]?.message?.content || '';
    if (!text || text.trim().length === 0) {
      return error(res, 'Không thể đọc chữ từ ảnh', 400);
    }
    return success(res, { text: text.trim() });
  } catch (err) {
    console.error('[OCR Error]', err);
    return error(res, 'Lỗi server khi parse ảnh');
  }
}
