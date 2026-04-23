import prisma from "../lib/prisma.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

/**
 * Lấy phiên trò chuyện hiện tại hoặc tạo mới nếu chưa có.
 * @param {string} userId - ID người dùng.
 * @param {string|null} sessionId - ID phiên (nếu người dùng đang chat trong phiên cũ).
 * @returns {Promise<Object>} - Đối tượng Session từ Database.
 */
export const getOrCreateSession = async (userId, sessionId = null) => {
  if (sessionId) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });
    // Tránh trường hợp người khác lấy Session ID của mình
    if (session && session.userId === userId) return session;
  }

  // Nếu không có session cũ hoặc session id không hợp lệ -> Tạo mới
  return prisma.chatSession.create({
    data: { userId, title: "Cuộc trò chuyện mới" },
  });
};

/**
 * Lưu một tin nhắn (của user hoặc của AI) vào Database.
 * Kèm theo các metadata đặc biệt (nếu có) như actionType để trigger sự kiện trên UI.
 */
export const saveMessage = async (sessionId, role, content, actionType = null, payload = null) => {
  return prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      actionType,
      payload
    }
  });
};

/**
 * Lấy lịch sử trò chuyện để nạp vào Context Window của AI (Kỹ thuật Memory).
 * Giới hạn số lượng tin nhắn (Mặc định 10) để tránh tràn token và tiết kiệm chi phí.
 * @returns {Promise<Array>} - Mảng các Message class của LangChain.
 */
export const getSessionHistory = async (sessionId, limit = 10) => {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' }, // Xếp theo thứ tự thời gian từ cũ đến mới
    take: limit, // Lấy N tin nhắn gần nhất
  });

  // Chuyển đổi định dạng DB sang định dạng Message object của LangChain
  return messages.map(m => {
    if (m.role === 'user') return new HumanMessage(m.content);
    if (m.role === 'assistant') return new AIMessage(m.content);
    if (m.role === 'system') return new SystemMessage(m.content);
    return new HumanMessage(m.content); // Default fallback
  });
};

/**
 * Cập nhật tên của phiên trò chuyện (được gọi sau tin nhắn đầu tiên của user).
 */
export const updateSessionTitle = async (sessionId, title) => {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
};
