import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { runAgenticChat } from '../agentic/agent.js';

/**
 * POST /api/agentic/chat
 * Cổng giao tiếp chính của Chatbot. Sử dụng Server-Sent Events (SSE) để stream
 * dữ liệu từng chữ về cho Client, tạo hiệu ứng AI đang gõ phím chân thực.
 */
export async function chatWithAgent(req, res) {
  const { message, sessionId, ocrText } = req.body;

  // Kiểm tra tính hợp lệ của tin nhắn
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return error(res, 'Message is required', 400);
  }

  if (message.length > 2000) {
    return error(res, 'Message too long (max 2000 characters)', 400);
  }

  // Cấu hình Headers cho kết nối SSE (Streaming)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Tắt buffer của Nginx nếu có
  res.flushHeaders();

  // Tạo nhịp đập (Heartbeat) mỗi 15 giây để giữ kết nối SSE không bị ngắt bởi trình duyệt
  const heartbeat = setInterval(() => {
    res.write(`:ping\n\n`);
  }, 15000);

  try {
    let finalMessage = message.trim();
    
    // Nếu Client có gửi kèm text bóc tách từ hình ảnh (OCR)
    // -> Gộp nội dung OCR vào chung với câu hỏi của người dùng để làm ngữ cảnh cho AI
    if (ocrText) {
      finalMessage = `[Nội dung tài liệu đính kèm (OCR):\n${ocrText}]\n\nYêu cầu của tôi: ${message.trim()}`;
      console.log(`[OCR] Browser extracted ${ocrText.length} chars, injected into prompt.`);
    }

    // Chạy Agent cốt lõi
    const result = await runAgenticChat(
      req.userId,
      finalMessage,
      sessionId || null,
      
      // Callback 1: Nhận từng từ (token) từ LLM và đẩy thẳng về Client
      (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
      
      // Callback 2: Cập nhật trạng thái công cụ (Ví dụ: "Đang tính DTI...")
      (status) => {
        res.write(`data: ${JSON.stringify({ status })}\n\n`);
      }
    );

    // Gửi sự kiện "done" khi AI đã trả lời xong toàn bộ
    // Kèm theo metadata để UI hiển thị chức năng (như bật Popup thêm nợ)
    res.write(`data: ${JSON.stringify({
      done: true,
      sessionId: result.sessionId,
      actionType: result.actionType,
      triggerPayload: result.triggerPayload || null,
    })}\n\n`);

  } catch (err) {
    console.error('chatWithAgent error:', err);
    // Báo lỗi cho Client nếu luồng stream bị hỏng
    res.write(`data: ${JSON.stringify({
      done: true,
      error: 'Hệ thống gặp sự cố, vui lòng thử lại sau.',
    })}\n\n`);
  } finally {
    clearInterval(heartbeat); // Dừng nhịp đập khi kết thúc
    res.end(); // Đóng luồng kết nối HTTP
  }
}

/**
 * GET /api/agentic/sessions
 * Lấy danh sách toàn bộ các đoạn hội thoại cũ của User này.
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
 * Lấy chi tiết toàn bộ tin nhắn trong một đoạn hội thoại cụ thể.
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
 * Xóa một đoạn hội thoại và toàn bộ tin nhắn bên trong (Cascade Delete).
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
