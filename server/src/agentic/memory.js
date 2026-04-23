import prisma from "../lib/prisma.js";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { getChatModel } from "./llm-provider.js";

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
 * Tóm tắt lịch sử hội thoại cũ bằng LLM.
 * Giúp giữ ngữ cảnh quan trọng khi cửa sổ nhớ bị giới hạn.
 * 
 * @param {Array} oldMessages - Mảng các DB message objects cần tóm tắt.
 * @returns {Promise<string>} - Bản tóm tắt ngắn gọn.
 */
async function summarizeOldHistory(oldMessages) {
  try {
    const model = getChatModel({ temperature: 0.1, streaming: false, maxTokens: 256 });

    // Tạo transcript từ các tin nhắn cũ
    const transcript = oldMessages.map(m => {
      const role = m.role === 'user' ? 'Người dùng' : 'AI';
      // Cắt nội dung dài để tiết kiệm token cho summarization
      const content = m.content.length > 200
        ? m.content.substring(0, 200) + '...'
        : m.content;
      return `${role}: ${content}`;
    }).join('\n');

    const response = await model.invoke([
      new SystemMessage(
        `Bạn là trợ lý tóm tắt. Hãy tóm tắt cuộc hội thoại sau thành 2-3 câu ngắn gọn bằng tiếng Việt. 
Tập trung vào: thông tin khoản nợ đã khai báo, số liệu quan trọng, và các quyết định đã thực hiện.
CHỈ trả về bản tóm tắt, không thêm lời giải thích.`
      ),
      new HumanMessage(transcript),
    ]);

    return response.content.trim();
  } catch (err) {
    console.error('[Memory] Summarization failed:', err.message);
    // Fallback: tóm tắt thô nếu LLM lỗi
    return oldMessages.map(m => {
      const role = m.role === 'user' ? '[User]' : '[AI]';
      return `${role}: ${m.content.substring(0, 80)}...`;
    }).join('\n');
  }
}

/**
 * Lấy lịch sử trò chuyện để nạp vào Context Window của AI (Kỹ thuật Memory).
 * Giới hạn số lượng tin nhắn (Mặc định 10) để tránh tràn token và tiết kiệm chi phí.
 * 
 * Khi lịch sử quá dài (>= 8 messages), tự động tóm tắt phần cũ bằng LLM
 * và chỉ giữ nguyên 4 tin nhắn gần nhất, đảm bảo Agent luôn có đủ ngữ cảnh.
 * 
 * @param {string} sessionId - ID phiên trò chuyện.
 * @param {number} limit - Số lượng tin nhắn tối đa lấy từ DB.
 * @param {boolean} summarize - Có bật tóm tắt LLM khi history quá dài không.
 * @returns {Promise<Array>} - Mảng các Message class của LangChain.
 */
export const getSessionHistory = async (sessionId, limit = 10, summarize = true) => {
  // Lấy N tin nhắn MỚI NHẤT bằng cách sắp xếp desc rồi đảo ngược lại
  // để đảm bảo Agent luôn nhận được ngữ cảnh gần đây nhất thay vì tin cũ nhất
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' }, // Lấy tin mới nhất trước
    take: limit,
  });

  // Đảo ngược lại thứ tự thời gian (cũ → mới) để LLM đọc đúng trình tự hội thoại
  messages.reverse();

  // --- LLM SUMMARIZATION ---
  // Khi history >= 8 messages, tóm tắt phần cũ để giữ context mà không tràn token
  if (summarize && messages.length >= 8) {
    const oldMessages = messages.slice(0, messages.length - 4); // Phần cũ → tóm tắt
    const recentMessages = messages.slice(messages.length - 4); // 4 tin gần nhất → giữ nguyên

    const summary = await summarizeOldHistory(oldMessages);
    console.log('[Memory] Summarized', oldMessages.length, 'old messages');

    return [
      // Tóm tắt lịch sử cũ dưới dạng SystemMessage
      new SystemMessage(`[Tóm tắt hội thoại trước đó]:\n${summary}`),
      // 4 tin nhắn gần nhất giữ nguyên
      ...recentMessages.map(m => mapDbMessageToLangChain(m)),
    ];
  }

  // Chuyển đổi định dạng DB sang định dạng Message object của LangChain
  return messages.map(m => mapDbMessageToLangChain(m));
};

/**
 * Chuyển đổi một DB message sang LangChain Message object.
 * Bảo toàn actionType trong metadata để Agent biết context tool calls trước đó.
 * @param {Object} m - Message từ database.
 * @returns {HumanMessage|AIMessage|SystemMessage}
 */
function mapDbMessageToLangChain(m) {
  if (m.role === 'user') return new HumanMessage(m.content);
  if (m.role === 'assistant') {
    const msg = new AIMessage(m.content);
    // Bảo toàn actionType trong metadata để Agent biết đã từng trigger form
    if (m.actionType) {
      msg.additional_kwargs = { ...msg.additional_kwargs, actionType: m.actionType };
    }
    return msg;
  }
  if (m.role === 'system') return new SystemMessage(m.content);
  return new HumanMessage(m.content); // Default fallback
}

/**
 * Cập nhật tên của phiên trò chuyện (được gọi sau tin nhắn đầu tiên của user).
 */
export const updateSessionTitle = async (sessionId, title) => {
  return prisma.chatSession.update({
    where: { id: sessionId },
    data: { title },
  });
};
