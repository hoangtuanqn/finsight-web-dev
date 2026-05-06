import { runAgenticChat, SSE_HEADERS, SseWriter } from '@repo/agentic';
import { Response } from 'express';
import OpenAI, { toFile } from 'openai';
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

const openaiClient = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: 'https://mkp-api.fptcloud.com',
});

export async function extractOcr(req: AuthenticatedRequest, res: Response) {
  const { base64Image } = req.body;
  if (!base64Image || typeof base64Image !== 'string') {
    return error(res, 'Missing base64Image', 400);
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gemma-4-26B-A4B-it',
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
      temperature: 0.1,
      max_tokens: 1024,
    });

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

/** POST /api/agentic/voice — Transcribe audio file via FPT Whisper STT */
export async function transcribeVoice(req: AuthenticatedRequest, res: Response) {
  if (!req.file) {
    return error(res, 'Không tìm thấy file audio', 400);
  }

  const { buffer, originalname } = req.file;

  if (buffer.length === 0) {
    return error(res, 'File audio rỗng', 400);
  }

  try {
    console.log(`[Voice STT] Processing ${buffer.length} bytes via FPT Cloud Whisper...`);

    // Use standard .webm extension as produced by browser
    const audioFile = await toFile(buffer, 'recording.webm', { type: 'audio/webm' });

    const transcription = await openaiClient.audio.transcriptions.create({
      file: audioFile,
      model: 'FPT.AI-whisper-large-v3-turbo',
      language: 'vi',
      response_format: 'json',
    });

    const text = transcription.text?.trim() ?? '';

    if (!text) {
      return error(res, 'Không nhận diện được giọng nói, vui lòng thử lại.', 422);
    }

    console.log(`[Voice STT] Success → "${text.substring(0, 60)}..."`);
    return success(res, { text });
  } catch (err: any) {
    // Safer logging without JSON.stringify circular risk
    const errorMessage = err.message || 'Unknown error';
    const errorData = err.response?.data || err.error || null;

    console.error('[Voice STT Error]:', errorMessage);
    if (errorData) console.error('[Voice STT Error Data]:', errorData);

    const status = err?.status || 500;
    return error(res, `Lỗi chuyển đổi giọng nói (Mã lỗi: ${status}). Vui lòng thử lại sau.`);
  }
}
