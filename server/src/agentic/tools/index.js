import { getUserDebtsTool, parseDebtFromTextTool } from "./debt.tools.js";
import { getUserProfileTool, simulateDtiTool } from "./finance.tools.js";
import { getMarketPricesTool, getMarketSentimentTool } from "./market.tools.js";
import { knowledgeSearchTool } from "./rag.tools.js";

// Export một mảng các công cụ đã đăng ký
export const ALL_TOOLS = [
  getUserDebtsTool,
  parseDebtFromTextTool,
  getUserProfileTool,
  simulateDtiTool,
  getMarketPricesTool,
  getMarketSentimentTool,
  knowledgeSearchTool,
];

// Helper để tạo Map cho dễ gọi name (tùy chọn)
export const toolsByName = Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t]));
