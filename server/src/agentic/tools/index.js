import { getUserDebtsTool, parseDebtFromTextTool } from "./debt.tools.js";
import { getUserProfileTool, simulateDtiTool } from "./finance.tools.js";
import { getMarketPricesTool, getMarketSentimentTool } from "./market.tools.js";
import { knowledgeSearchTool } from "./rag.tools.js";
export { createBoundTools } from "./bind-tools.js";

/**
 * TẬP HỢP TẤT CẢ CÔNG CỤ (ALL_TOOLS)
 * - Đây là danh sách các "kỹ năng" mà Agent AI được phép sử dụng.
 * - Khi AI nhận được yêu cầu từ người dùng, nó sẽ quét qua mô tả (description) 
 *   của từng công cụ trong mảng này để quyết định xem có cần gọi công cụ nào không.
 */
export const ALL_TOOLS = [
  getUserDebtsTool,       // Lấy danh sách nợ
  parseDebtFromTextTool,  // Bóc tách nợ mới từ văn bản/OCR
  getUserProfileTool,     // Lấy hồ sơ tài chính & mức độ rủi ro
  simulateDtiTool,        // Tính toán DTI (What-If)
  getMarketPricesTool,    // Lấy giá Vàng, Bitcoin, Ethereum
  getMarketSentimentTool, // Lấy chỉ số Fear & Greed thị trường
  knowledgeSearchTool,    // Tìm kiếm kiến thức (RAG) từ Knowledge Base
];

/**
 * HARD-FILTER: Bản đồ Intent → Danh sách Tools được phép sử dụng.
 * Agent CHỈ nhận được tools phù hợp với intent, giúp:
 * - Tiết kiệm token (bớt tool descriptions trong prompt)
 * - Tăng độ chính xác (Agent không bị phân tâm bởi tools không liên quan)
 * - Giảm latency (ít tool choices → LLM quyết định nhanh hơn)
 */
export const TOOLS_BY_INTENT = {
  GENERAL_CHAT: [], // Tin nhắn xác nhận, cảm ơn — không cần tool, LLM trả lời tự nhiên
  DATA_ENTRY: [parseDebtFromTextTool],
  PERSONAL_QUERY: [getUserDebtsTool, getUserProfileTool, simulateDtiTool],
  WHAT_IF: [getUserDebtsTool, getUserProfileTool, simulateDtiTool],
  INVESTMENT_ADVICE: [getMarketPricesTool, getMarketSentimentTool, getUserProfileTool, knowledgeSearchTool],
  KNOWLEDGE: [knowledgeSearchTool],
  OFF_TOPIC: [], // Không cần tool nào
};

/**
 * Lấy danh sách tools phù hợp theo intent.
 * Nếu intent không xác định, trả về tất cả tools (fallback an toàn).
 * @param {string} intent - Intent đã được phân loại bởi router.
 * @returns {Array} - Mảng tools tương ứng.
 */
export function getToolsByIntent(intent) {
  return TOOLS_BY_INTENT[intent] || ALL_TOOLS;
}

/**
 * Đối tượng hỗ trợ tra cứu công cụ theo tên (toolsByName)
 * Giúp hệ thống dễ dàng truy xuất thông tin của một tool cụ thể khi cần.
 */
export const toolsByName = Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t]));
