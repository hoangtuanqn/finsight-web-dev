import { getChatModel } from './llm-provider.js';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { INTENT_ROUTER_PROMPT } from './prompts.js';

// Keyword-based fast router to save LLM tokens
const KEYWORD_ROUTES = [
  { keywords: ['dti là gì', 'ear là gì', 'apr là gì', 'snowball là', 'avalanche là', 'khái niệm', 'giải thích'], intent: 'KNOWLEDGE' },
  { keywords: ['vay mới', 'khai báo', 'tôi vừa vay', 'mới vay', 'fe credit', 'tín chấp', 'trả góp mới'], intent: 'DATA_ENTRY' },
  { keywords: ['nếu tôi', 'giả sử', 'what if', 'nếu vay thêm', 'giả lập', 'mô phỏng'], intent: 'WHAT_IF' },
  { keywords: ['giá vàng', 'bitcoin', 'crypto', 'cổ phiếu', 'nên đầu tư', 'phân bổ', 'danh mục', 'mua vàng', 'thị trường'], intent: 'INVESTMENT_ADVICE' },
  { keywords: ['nợ bao nhiêu', 'tháng này trả', 'tình trạng nợ', 'khoản nợ của tôi', 'dti của tôi'], intent: 'PERSONAL_QUERY' },
];

function fastRouteByKeyword(query) {
  const lowerQ = query.toLowerCase();
  for (const route of KEYWORD_ROUTES) {
    for (const kw of route.keywords) {
      if (lowerQ.includes(kw)) return route.intent;
    }
  }
  return null; // No confident match → fall through to LLM
}

export const routeIntent = async (query) => {
  // Layer 1: Fast keyword-based routing (~0ms, no LLM cost)
  const fastResult = fastRouteByKeyword(query);
  if (fastResult) return fastResult;

  // Layer 2: LLM-based classification (fallback)
  try {
    const model = getChatModel({ temperature: 0.1, streaming: false });
    const promptText = INTENT_ROUTER_PROMPT.replace('{query}', query);
    
    const response = await model.invoke([
      new SystemMessage(promptText),
      new HumanMessage("Phân tích intent của câu trên.")
    ]);

    const result = response.content.trim().toUpperCase();
    
    const validIntents = [
      "DATA_ENTRY", "PERSONAL_QUERY", "WHAT_IF", 
      "INVESTMENT_ADVICE", "KNOWLEDGE", "OFF_TOPIC"
    ];
    
    if (validIntents.includes(result)) {
      return result;
    }
    
    return "PERSONAL_QUERY"; 
  } catch (err) {
    console.error("Router error:", err);
    return "PERSONAL_QUERY";
  }
};
