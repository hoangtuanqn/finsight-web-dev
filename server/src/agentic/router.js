import { getChatModel } from './llm-provider.js';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { INTENT_ROUTER_PROMPT } from './prompts.js';

const ROUTER_TIMEOUT_MS = 5000; // 5s timeout cho LLM fallback router

/**
 * Lớp định tuyến nhanh (Fast Router) dựa trên từ khóa.
 * Giúp phân loại mục đích câu hỏi (Intent) ngay lập tức mà không cần gọi AI,
 * từ đó tiết kiệm chi phí (token) và giảm độ trễ (latency ~ 0ms).
 */
const KEYWORD_ROUTES = [
  // GENERAL_CHAT đặt ĐẦU TIÊN — ưu tiên bắt các câu xác nhận/phản hồi
  // trước khi chúng bị match nhầm vào DATA_ENTRY bởi keyword chung như "khoản nợ"
  { keywords: ['đã xác nhận', 'lưu thành công', 'đã lưu', 'xác nhận thành công',
               'đã hoàn tất', 'cảm ơn', 'ok cảm ơn', 'được rồi', 'tuyệt vời',
               'đã hiểu', 'rõ rồi', 'ok thanks'], intent: 'GENERAL_CHAT' },
  { keywords: ['dti là gì', 'ear là gì', 'apr là gì', 'snowball là', 'avalanche là', 'khái niệm', 'giải thích', 'là gì'], intent: 'KNOWLEDGE' },
  { keywords: ['vay mới', 'khai báo', 'tôi vừa vay', 'mới vay', 'fe credit', 'tín chấp', 'trả góp mới', 'thêm nợ', 'thêm khoản nợ', 'thêm khoản vay', 'tôi vay'], intent: 'DATA_ENTRY' },
  { keywords: ['nếu tôi', 'giả sử', 'what if', 'nếu vay thêm', 'giả lập', 'mô phỏng'], intent: 'WHAT_IF' },
  { keywords: ['giá vàng', 'bitcoin', 'crypto', 'cổ phiếu', 'nên đầu tư', 'phân bổ', 'danh mục', 'mua vàng', 'thị trường'], intent: 'INVESTMENT_ADVICE' },
  { keywords: ['nợ bao nhiêu', 'tháng này trả', 'tình trạng nợ', 'khoản nợ của tôi', 'dti của tôi'], intent: 'PERSONAL_QUERY' },
];

/**
 * Hàm kiểm tra câu hỏi bằng SCORING thay vì first-match.
 * Đếm số keywords match cho mỗi route, chọn route có score cao nhất.
 * Giải quyết xung đột kiểu "Tôi vừa vay, APR là gì?" → KNOWLEDGE (2 match) > DATA_ENTRY (1 match).
 * 
 * @param {string} query - Câu hỏi của người dùng.
 * @returns {string|null} - Trả về Intent có score cao nhất, null nếu không match.
 */
function fastRouteByKeyword(query) {
  const lowerQ = query.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  for (const route of KEYWORD_ROUTES) {
    let score = 0;
    for (const kw of route.keywords) {
      if (lowerQ.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = route.intent;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

/**
 * Hàm chính để phân tích Intent (Mục đích) của câu hỏi.
 * Sử dụng chiến lược 2 lớp (Layer 1: Keyword Scoring, Layer 2: LLM Fallback với timeout).
 * @param {string} query - Câu hỏi của người dùng.
 * @returns {Promise<string>} - Intent cuối cùng được xác định.
 */
export const routeIntent = async (query) => {
  // --- LỚP 1: Định tuyến bằng scoring từ khóa (Tốc độ cực nhanh, không tốn chi phí AI) ---
  const fastResult = fastRouteByKeyword(query);
  if (fastResult) return fastResult;

  // --- LỚP 2: Phân loại bằng AI (Sử dụng nếu bước 1 không tìm thấy) ---
  try {
    // Khởi tạo model với temperature thấp (0.1) để câu trả lời có tính ổn định, ít bay bổng
    const model = getChatModel({ temperature: 0.1, streaming: false });

    // Gắn câu hỏi vào prompt mẫu đã được chuẩn bị sẵn trong prompts.js
    const promptText = INTENT_ROUTER_PROMPT.replace('{query}', query);

    // Yêu cầu AI phân tích VỚI TIMEOUT 5s để tránh block pipeline
    const response = await Promise.race([
      model.invoke([
        new SystemMessage(promptText), // Hệ thống đưa ra luật phân loại
        new HumanMessage("Phân tích intent của câu trên.") // Yêu cầu từ user ảo
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('ROUTER_TIMEOUT')), ROUTER_TIMEOUT_MS)
      ),
    ]);

    // Chuẩn hóa kết quả trả về từ AI (xóa khoảng trắng thừa, viết hoa toàn bộ)
    const result = response.content.trim().toUpperCase();

    // Danh sách các Intent hợp lệ mà hệ thống hỗ trợ
    const validIntents = [
      "DATA_ENTRY", "PERSONAL_QUERY", "WHAT_IF",
      "INVESTMENT_ADVICE", "KNOWLEDGE", "OFF_TOPIC", "GENERAL_CHAT"
    ];

    // Nếu AI trả về đúng một trong các Intent hợp lệ thì sử dụng
    if (validIntents.includes(result)) {
      return result;
    }

    // Nếu AI trả về kết quả lạ, mặc định coi như người dùng đang hỏi về tài khoản cá nhân
    return "PERSONAL_QUERY";
  } catch (err) {
    // Bắt lỗi nếu có sự cố (VD: rớt mạng, lỗi API key, timeout)
    if (err.message === 'ROUTER_TIMEOUT') {
      console.warn("[Router] LLM fallback timed out after", ROUTER_TIMEOUT_MS, "ms");
    } else {
      console.error("Router error:", err.message || err);
    }
    return "PERSONAL_QUERY"; // Fallback an toàn nhất
  }
};
