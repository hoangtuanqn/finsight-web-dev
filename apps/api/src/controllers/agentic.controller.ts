import { runAgenticChat, SSE_HEADERS, SseWriter } from '@repo/agentic';
import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

export async function chatWithAgent(req: AuthenticatedRequest, res: Response) {
  const { message, sessionId, ocrText } = req.body;

  // Validate before SSE headers are flushed — can still use HTTP error codes here.
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return error(res, 'Message is required', 400);
  }

  if (message.length > 2000) {
    return error(res, 'Message too long (max 2000 characters)', 400);
  }

  // Flush SSE headers — after this point all errors must go through SSE event: error.
  Object.entries(SSE_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.flushHeaders();

  const writer = new SseWriter(res, { legacyCompat: true, heartbeatMs: 15_000 });
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
      console.log(`[OCR] Browser extracted ${ocrText.length} chars, injected into prompt.`);
    }

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
