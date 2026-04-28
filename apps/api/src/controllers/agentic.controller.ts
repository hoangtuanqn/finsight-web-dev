import { Response } from 'express';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { runAgenticChat } from '../agentic/agent';
import { AuthenticatedRequest } from '../types';

export async function chatWithAgent(req: AuthenticatedRequest, res: Response) {
  const { message, sessionId, ocrText } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return error(res, 'Message is required', 400);
  }

  if (message.length > 2000) {
    return error(res, 'Message too long (max 2000 characters)', 400);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); 
  res.flushHeaders();

  const heartbeat = setInterval(() => {
    res.write(`:ping\n\n`);
  }, 15000);

  try {
    let finalMessage = message.trim();
    
    let clientDisconnected = false;
    req.on('close', () => {
      clientDisconnected = true;
      console.log('[SSE] Client disconnected, suppressing further writes');
    });

    if (ocrText) {
      finalMessage = `[Nội dung tài liệu đính kèm (OCR):\n${ocrText}]\n\nYêu cầu của tôi: ${message.trim()}`;
      console.log(`[OCR] Browser extracted ${ocrText.length} chars, injected into prompt.`);
    }

    const result = await runAgenticChat(
      req.userId as string,
      finalMessage,
      sessionId || null,
      
      (token: string) => {
        if (clientDisconnected) return; 
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      
      (status: string | null) => {
        if (clientDisconnected || !status) return; 
        res.write(`data: ${JSON.stringify({ status })}\n\n`);
      },

      () => clientDisconnected
    );

    res.write(`data: ${JSON.stringify({
      done: true,
      sessionId: result.sessionId,
      actionType: result.actionType,
      triggerPayload: result.triggerPayload || null,
    })}\n\n`);

  } catch (err) {
    console.error('chatWithAgent error:', err);
    res.write(`data: ${JSON.stringify({
      done: true,
      error: 'Hệ thống gặp sự cố, vui lòng thử lại sau.',
    })}\n\n`);
  } finally {
    clearInterval(heartbeat); 
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
