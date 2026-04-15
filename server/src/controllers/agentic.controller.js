import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { runAgenticChat } from '../agentic/agent.js';

/**
 * POST /api/agentic/chat
 * SSE streaming chat endpoint with tool status events
 */
export async function chatWithAgent(req, res) {
  const { message, sessionId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return error(res, 'Message is required', 400);
  }

  if (message.length > 2000) {
    return error(res, 'Message too long (max 2000 characters)', 400);
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // SSE heartbeat to keep connection alive (every 15s)
  const heartbeat = setInterval(() => {
    res.write(`:ping\n\n`);
  }, 15000);

  try {
    const result = await runAgenticChat(
      req.userId,
      message.trim(),
      sessionId || null,
      // onToken callback — stream each token chunk
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      // onToolStatus callback — stream tool execution status
      (status) => {
        res.write(`data: ${JSON.stringify({ status })}\n\n`);
      }
    );

    // Send final "done" event with metadata
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

/**
 * GET /api/agentic/sessions
 * List all chat sessions for current user
 */
export async function getSessions(req, res) {
  try {
    const sessions = await prisma.chatSession.findMany({
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

/**
 * GET /api/agentic/sessions/:id
 * Get message history for a specific session
 */
export async function getSessionMessages(req, res) {
  try {
    const session = await prisma.chatSession.findFirst({
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

/**
 * DELETE /api/agentic/sessions/:id
 * Delete a chat session and all its messages (cascade)
 */
export async function deleteSession(req, res) {
  try {
    const deleted = await prisma.chatSession.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });

    if (deleted.count === 0) return error(res, 'Session not found', 404);

    return success(res, { message: 'Session deleted' });
  } catch (err) {
    console.error('deleteSession error:', err);
    return error(res, 'Internal server error');
  }
}
