import { getUserDebtsTool, parseDebtFromTextTool } from './debt.tools';
import { getUserProfileTool, simulateDtiTool } from './finance.tools';
import { getMarketPricesTool, getMarketSentimentTool } from './market.tools';
import { knowledgeSearchTool } from './rag.tools';
export { createBoundTools } from './bind-tools';

export const ALL_TOOLS = [
  getUserDebtsTool,
  parseDebtFromTextTool,
  getUserProfileTool,
  simulateDtiTool,
  getMarketPricesTool,
  getMarketSentimentTool,
  knowledgeSearchTool,
];

export const TOOLS_BY_INTENT: Record<string, any[]> = {
  GENERAL_CHAT: [],
  DATA_ENTRY: [parseDebtFromTextTool],
  PERSONAL_QUERY: [getUserDebtsTool, getUserProfileTool, simulateDtiTool],
  WHAT_IF: [getUserDebtsTool, getUserProfileTool, simulateDtiTool],
  INVESTMENT_ADVICE: [getMarketPricesTool, getMarketSentimentTool, getUserProfileTool, knowledgeSearchTool],
  KNOWLEDGE: [knowledgeSearchTool],
  OFF_TOPIC: [],
};

export function getToolsByIntent(intent: string) {
  return TOOLS_BY_INTENT[intent] || ALL_TOOLS;
}

export const toolsByName = Object.fromEntries(ALL_TOOLS.map((t) => [t.name, t]));
