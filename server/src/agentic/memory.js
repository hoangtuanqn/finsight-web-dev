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

// =====================================================================
// Compact History — Sliding Window 8 messages + LLM Summary
// =====================================================================
// Mục đích: Cung cấp NGỮ CẢNH cho LLM để trả lời follow-up questions,
// nhưng KHÔNG cho phép LLM sao chép câu trả lời cũ.
//
// Kỹ thuật chính: Content Sanitization
// - AI response bị thay thế hoàn toàn bằng tag ngắn mô tả HÀNH ĐỘNG
// - VD: "Tôi đã trích xuất..." → "[AI: phân tích khoản nợ → form xác nhận]"
// - LLM biết context (đã làm gì) nhưng không có text để copy
// =====================================================================

const WINDOW_SIZE = 8;       // Số messages giữ nguyên trong sliding window
const DB_FETCH_LIMIT = 16;   // Buffer lấy từ DB (2x window để có phần tóm tắt)

/**
 * Sanitize nội dung AI response thành tag context ngắn gọn.
 * Mục đích: LLM biết AI đã làm gì, nhưng KHÔNG CÓ TEXT ĐỂ COPY.
 *
 * @param {Object} msg - Message object từ DB (có .content, .actionType, .role)
 * @returns {string} - Nội dung đã sanitize, tối đa ~80 chars
 */
function sanitizeAIContent(msg) {
  const content = msg.content || '';
  const actionType = msg.actionType || null;

  // ⚠️ QUAN TRỌNG: KHÔNG dùng dấu ngoặc vuông [], dấu ngoặc nhọn, hay format đặc biệt
  // vì LLM sẽ bắt chước pattern đó trong response của nó.
  // Chỉ dùng câu mô tả ngắn gọn, thuần text.

  // Case 1: Tool đã được gọi (form_population = parse_debt)
  if (actionType === 'form_population') {
    return '(Trợ lý đã gọi tool phân tích khoản nợ và hiển thị form xác nhận.)';
  }

  // Case 2: Phát hiện pattern canned response về khoản nợ
  if (content.includes('trích xuất thông tin khoản nợ') || content.includes('bấm **Xác nhận**')) {
    return '(Trợ lý đã trích xuất khoản nợ, chờ user xác nhận trên form.)';
  }

  // Case 3: Phát hiện pattern yêu cầu cung cấp thêm thông tin
  if (content.includes('vui lòng cung cấp') || content.includes('thông tin còn thiếu')) {
    return '(Trợ lý đã hỏi user bổ sung thông tin còn thiếu.)';
  }

  // Case 4: Phát hiện pattern lỗi/fallback
  if (content.includes('Xin lỗi') && content.includes('thử lại')) {
    return '(Trợ lý gặp lỗi, yêu cầu user thử lại.)';
  }

  // Case 5: Response bình thường — rút gọn thành 1 câu mô tả
  const firstSentence = content.split(/[.\n]/)[0].trim();
  const truncated = firstSentence.length > 80
    ? firstSentence.substring(0, 77) + '...'
    : firstSentence;
  return `(Trợ lý đã trả lời: ${truncated})`;
}

/**
 * Lấy lịch sử compact cho Agent — trả về 1 SystemMessage duy nhất.
 *
 * THIẾT KẾ QUAN TRỌNG:
 * - KHÔNG trả về AIMessage/HumanMessage riêng lẻ (LLM sẽ bắt chước format)
 * - Gom toàn bộ history thành 1 SystemMessage chứa transcript ngắn gọn
 * - AI response bị sanitize thành mô tả hành động, không có text để copy
 * - LLM chỉ thấy "đã xảy ra gì" chứ không thấy "đã nói gì"
 *
 * @param {string} sessionId - ID phiên trò chuyện
 * @returns {Promise<Array>} - Mảng chứa tối đa 1 SystemMessage (hoặc rỗng)
 */
export const getCompactHistory = async (sessionId) => {
  const messages = await prisma.chatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
    take: DB_FETCH_LIMIT,
  });

  messages.reverse();

  if (messages.length === 0) return [];

  console.log(`[Memory] getCompactHistory: ${messages.length} messages fetched from DB`);

  // --- Xây dựng transcript ---
  // Chia thành phần cũ (tóm tắt bằng LLM) + phần mới (giữ chi tiết)
  let summaryPart = '';
  let detailMessages = messages;

  if (messages.length > WINDOW_SIZE) {
    const oldPart = messages.slice(0, messages.length - WINDOW_SIZE);
    detailMessages = messages.slice(messages.length - WINDOW_SIZE);

    console.log(`[Memory] Splitting: ${oldPart.length} old (→ summary) + ${detailMessages.length} recent`);
    summaryPart = await summarizeOldHistory(oldPart);
    console.log(`[Memory] Summary: "${summaryPart.substring(0, 100)}..."`);
  }

  // --- Build transcript từ detailMessages ---
  const lines = detailMessages.map(m => {
    if (m.role === 'user') {
      // User message: giữ nguyên nhưng cắt OCR dài
      let content = m.content;
      if (content.length > 300) {
        const ocrMatch = content.match(/Yêu cầu của tôi:\s*(.+)/s);
        if (ocrMatch) {
          content = `(ảnh đính kèm) ${ocrMatch[1].trim().substring(0, 200)}`;
        } else {
          content = content.substring(0, 300) + '...';
        }
      }
      return `- Người dùng: ${content}`;
    }
    if (m.role === 'assistant') {
      // AI response: CHỈ mô tả hành động, KHÔNG giữ nội dung
      return `- Hệ thống: ${sanitizeAIContent(m)}`;
    }
    return null;
  }).filter(Boolean);

  // --- Ghép thành 1 SystemMessage duy nhất ---
  let contextBlock = '=== NGỮ CẢNH HỘI THOẠI (chỉ để tham khảo, KHÔNG sao chép) ===\n';

  if (summaryPart) {
    contextBlock += `Tóm tắt phần trước: ${summaryPart}\n---\n`;
  }

  contextBlock += `Các lượt trao đổi gần đây:\n${lines.join('\n')}`;
  contextBlock += '\n=== HẾT NGỮ CẢNH ===';

  console.log(`[Memory] Context block: ${contextBlock.length} chars, ${lines.length} exchanges`);

  return [new SystemMessage(contextBlock)];
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
