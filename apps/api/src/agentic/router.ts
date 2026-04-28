import { getChatModel } from './llm-provider';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { INTENT_ROUTER_PROMPT } from './prompts';

const ROUTER_TIMEOUT_MS = 5000;

const KEYWORD_ROUTES = [
  { keywords: ['đã xác nhận', 'lưu thành công', 'đã lưu', 'xác nhận thành công',
               'đã hoàn tất', 'cảm ơn', 'ok cảm ơn', 'được rồi', 'tuyệt vời',
               'đã hiểu', 'rõ rồi', 'ok thanks'], intent: 'GENERAL_CHAT' },
  { keywords: ['dti là gì', 'ear là gì', 'apr là gì', 'snowball là', 'avalanche là', 'khái niệm', 'giải thích', 'là gì'], intent: 'KNOWLEDGE' },
  { keywords: ['vay mới', 'khai báo', 'tôi vừa vay', 'mới vay', 'fe credit', 'tín chấp', 'trả góp mới', 'thêm nợ', 'thêm khoản nợ', 'thêm khoản vay', 'tôi vay'], intent: 'DATA_ENTRY' },
  { keywords: ['nếu tôi', 'giả sử', 'what if', 'nếu vay thêm', 'giả lập', 'mô phỏng'], intent: 'WHAT_IF' },
  { keywords: ['giá vàng', 'bitcoin', 'crypto', 'cổ phiếu', 'nên đầu tư', 'phân bổ', 'danh mục', 'mua vàng', 'thị trường'], intent: 'INVESTMENT_ADVICE' },
  { keywords: ['nợ bao nhiêu', 'tháng này trả', 'tình trạng nợ', 'khoản nợ của tôi', 'dti của tôi'], intent: 'PERSONAL_QUERY' },
];

function fastRouteByKeyword(query: string): string | null {
  const lowerQ = query.toLowerCase();
  let bestMatch: string | null = null;
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

export const routeIntent = async (query: string): Promise<string> => {
  const fastResult = fastRouteByKeyword(query);
  if (fastResult) return fastResult;

  try {
    const model = getChatModel({ temperature: 0.1, streaming: false });
    const promptText = INTENT_ROUTER_PROMPT.replace('{query}', query);

    const response = await Promise.race([
      model.invoke([
        new SystemMessage(promptText),
        new HumanMessage("Phân tích intent của câu trên.")
      ]),
      new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('ROUTER_TIMEOUT')), ROUTER_TIMEOUT_MS)
      ),
    ]);

    const result = response.content.trim().toUpperCase();

    const validIntents = [
      "DATA_ENTRY", "PERSONAL_QUERY", "WHAT_IF",
      "INVESTMENT_ADVICE", "KNOWLEDGE", "OFF_TOPIC", "GENERAL_CHAT"
    ];

    if (validIntents.includes(result)) {
      return result;
    }

    return "PERSONAL_QUERY";
  } catch (err: any) {
    if (err.message === 'ROUTER_TIMEOUT') {
      console.warn("[Router] LLM fallback timed out after", ROUTER_TIMEOUT_MS, "ms");
    } else {
      console.error("Router error:", err.message || err);
    }
    return "PERSONAL_QUERY";
  }
};
