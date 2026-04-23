import { getUserDebtsTool, parseDebtFromTextTool } from "./debt.tools.js";
import { getUserProfileTool, simulateDtiTool } from "./finance.tools.js";
import { getMarketPricesTool, getMarketSentimentTool } from "./market.tools.js";
import { knowledgeSearchTool } from "./rag.tools.js";

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
 * Đối tượng hỗ trợ tra cứu công cụ theo tên (toolsByName)
 * Giúp hệ thống dễ dàng truy xuất thông tin của một tool cụ thể khi cần.
 */
export const toolsByName = Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t]));
