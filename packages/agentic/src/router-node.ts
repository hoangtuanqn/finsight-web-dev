import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AgentIntent, normalizeIntent, type AgentGraphState } from './graph-state.js';
import { getChatModel } from './llm-provider.js';

export { AgentIntent };

// ─── Router constants ─────────────────────────────────────────────────────────

const ROUTER_TIMEOUT_MS = 5_000;
/** Max quota allowed before investment pre-check refuses routing to investment worker. */
const INVESTMENT_PRECHECK_KEYWORD = ['tư vấn đầu tư', 'chiến lược đầu tư', 'đầu tư ngay', 'sinh lời'];

// ─── Intent ↔ worker mapping ─────────────────────────────────────────────────

export const INTENT_TO_WORKER: Record<AgentIntent, string> = {
  [AgentIntent.DEBT_EXTRACTION]: 'debt_extraction',
  [AgentIntent.REPAYMENT_SETUP]: 'repayment',
  [AgentIntent.INVESTMENT_ADVICE]: 'investment',
  [AgentIntent.DEBT_SUMMARY]: 'debt_summary',
  [AgentIntent.DEBT_LIST_QUERY]: 'debt_list',
  [AgentIntent.SIMULATION]: 'simulation',
  [AgentIntent.MARKET_OVERVIEW]: 'market',
  [AgentIntent.MARKET_SPECIFIC]: 'market',
  [AgentIntent.KNOWLEDGE]: 'rag',
  [AgentIntent.GENERAL_CHAT]: 'general',
};

// ─── Keyword fast-path rules ─────────────────────────────────────────────────

interface KeywordRoute {
  keywords: string[];
  intent: AgentIntent;
}

const KEYWORD_ROUTES: KeywordRoute[] = [
  {
    keywords: [
      'đã xác nhận',
      'lưu thành công',
      'đã lưu',
      'xác nhận thành công',
      'đã hoàn tất',
      'cảm ơn',
      'ok cảm ơn',
      'được rồi',
      'tuyệt vời',
      'đã hiểu',
      'rõ rồi',
      'ok thanks',
    ],
    intent: AgentIntent.GENERAL_CHAT,
  },
  {
    keywords: [
      'dti là gì',
      'ear là gì',
      'apr là gì',
      'snowball là',
      'avalanche là',
      'khái niệm',
      'giải thích',
      'là gì',
      'định nghĩa',
    ],
    intent: AgentIntent.KNOWLEDGE,
  },
  {
    keywords: [
      'vay mới',
      'khai báo',
      'tôi vừa vay',
      'mới vay',
      'fe credit',
      'tín chấp',
      'trả góp mới',
      'thêm nợ',
      'thêm khoản nợ',
      'thêm khoản vay',
      'tôi vay',
    ],
    intent: AgentIntent.DEBT_EXTRACTION,
  },
  {
    keywords: ['trả thêm', 'trả thêm mỗi tháng', 'kế hoạch trả nợ', 'muốn trả sớm', 'chiến lược trả nợ'],
    intent: AgentIntent.REPAYMENT_SETUP,
  },
  {
    keywords: [
      'nếu tôi',
      'giả sử',
      'what if',
      'nếu vay thêm',
      'nếu thu nhập giảm',
      'nếu tôi chi thêm',
      'nếu giảm thu nhập',
      'giả lập',
      'mô phỏng',
      'tình huống giả định',
      'kịch bản',
    ],
    intent: AgentIntent.SIMULATION,
  },
  // Market specific must come before generic investment keywords to avoid misrouting
  {
    keywords: [
      'giá vàng hôm nay',
      'btc hôm nay',
      'giá bitcoin hôm nay',
      'giá eth hôm nay',
      'chỉ số vn-index',
      'giá ethereum',
      'vàng sjc giá bao nhiêu',
    ],
    intent: AgentIntent.MARKET_SPECIFIC,
  },
  {
    keywords: [
      'thị trường hôm nay',
      'tổng quan thị trường',
      'fear and greed',
      'chỉ số thị trường',
      'giá vàng',
      'giá bitcoin',
      'bitcoin',
      'crypto hôm nay',
      'ethereum',
    ],
    intent: AgentIntent.MARKET_OVERVIEW,
  },
  {
    keywords: ['tư vấn đầu tư', 'chiến lược đầu tư', 'đầu tư ngay', 'sinh lời', 'nên đầu tư', 'phân bổ danh mục'],
    intent: AgentIntent.INVESTMENT_ADVICE,
  },
  {
    keywords: ['tình trạng nợ', 'sức khỏe tài chính', 'tổng nợ', 'tôi đang nợ', 'overview nợ'],
    intent: AgentIntent.DEBT_SUMMARY,
  },
  {
    keywords: ['danh sách nợ', 'liệt kê khoản nợ', 'các khoản nợ của tôi', 'bao nhiêu khoản nợ'],
    intent: AgentIntent.DEBT_LIST_QUERY,
  },
];

function fastRouteByKeyword(query: string): AgentIntent | null {
  const lowerQ = query.toLowerCase();
  let best: AgentIntent | null = null;
  let bestScore = 0;

  for (const route of KEYWORD_ROUTES) {
    let score = 0;
    for (const kw of route.keywords) {
      if (lowerQ.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = route.intent;
    }
  }

  return bestScore > 0 ? best : null;
}

// ─── LLM router prompt ───────────────────────────────────────────────────────

const ROUTER_SYSTEM_PROMPT = `Bạn là AI Classifier phân loại thông điệp người dùng thành ĐÚNG MỘT intent sau:

DEBT_EXTRACTION   – Người dùng khai báo khoản nợ/vay mới.
REPAYMENT_SETUP   – Người dùng muốn thiết lập kế hoạch/chiến lược trả nợ, trả thêm.
INVESTMENT_ADVICE – Hỏi tư vấn đầu tư, phân bổ danh mục, chiến lược sinh lời.
DEBT_SUMMARY      – Hỏi tổng quan/sức khỏe tài chính nợ (DTI, tổng dư nợ, overview).
DEBT_LIST_QUERY   – Hỏi liệt kê cụ thể từng khoản nợ.
SIMULATION        – Giả lập "nếu vay thêm / nếu giảm thu nhập / what-if".
MARKET_OVERVIEW   – Hỏi tổng quan thị trường tài chính.
MARKET_SPECIFIC   – Hỏi giá cụ thể (vàng, BTC, cổ phiếu riêng lẻ, chỉ số).
KNOWLEDGE         – Hỏi khái niệm/định nghĩa tài chính.
GENERAL_CHAT      – Xác nhận, cảm ơn, phản hồi ngắn, hoặc câu hỏi ngoài các luồng thao tác tài chính đang hỗ trợ.

Chỉ trả về ĐÚNG MỘT TỪ (ví dụ: DEBT_EXTRACTION). Không giải thích.`;

// ─── Guard helpers ────────────────────────────────────────────────────────────

function checkMaxLength(query: string): boolean {
  return query.length > 2000;
}

function investmentPrecheck(query: string, strategyQuota: number | null | undefined): boolean {
  if (strategyQuota == null) return false;
  if (strategyQuota > 0) return false;
  const lower = query.toLowerCase();
  return INVESTMENT_PRECHECK_KEYWORD.some((kw) => lower.includes(kw));
}

// ─── Router node (Task 2.3) ───────────────────────────────────────────────────

/**
 * Determines intent and worker for the current turn.
 *
 * Pipeline:
 * 1. Max-length guard  → max_length worker.
 * 2. Keyword fast-path (no LLM call).
 * 3. LLM fallback (timeout 5 s).
 * 4. Investment quota pre-check (re-routes to GENERAL_CHAT when quota = 0
 *    and intent is clearly investment-related).
 */
export async function routerNode(
  state: AgentGraphState,
  /** Optional quota read from personal-data helper; null means unknown. */
  strategyQuota?: number | null,
): Promise<Pick<AgentGraphState, 'intent' | 'worker' | 'errors'>> {
  const errors = [...state.errors];
  const query = state.input;

  // OCR messages are intentionally large — skip the length guard for them.
  const isOcrMessage = query.startsWith('[Nội dung tài liệu đính kèm (OCR):');

  // 1. Max length guard (skip for OCR)
  if (!isOcrMessage && checkMaxLength(query)) {
    return { intent: AgentIntent.GENERAL_CHAT, worker: 'max_length', errors };
  }

  // OCR document → always debt extraction, skip keyword/LLM routing entirely
  if (isOcrMessage) {
    console.log('[Router] 📷 OCR message detected → pinned to DEBT_EXTRACTION');
    return { intent: AgentIntent.DEBT_EXTRACTION, worker: 'debt_extraction', errors };
  }

  // 2. Keyword fast-path
  let intent = fastRouteByKeyword(query);

  // 3. LLM fallback
  if (!intent) {
    try {
      const model = getChatModel({ temperature: 0.1, streaming: false });
      const response = await Promise.race([
        model.invoke([new SystemMessage(ROUTER_SYSTEM_PROMPT), new HumanMessage(query)]),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('ROUTER_TIMEOUT')), ROUTER_TIMEOUT_MS)),
      ]);

      intent = normalizeIntent((response.content as string).trim());
    } catch (err: any) {
      if (err.message === 'ROUTER_TIMEOUT') {
        console.warn('[Router] LLM fallback timed out after', ROUTER_TIMEOUT_MS, 'ms');
      } else {
        console.error('[Router] LLM error:', err.message);
      }
      errors.push(`router_llm_error: ${err.message}`);
      intent = AgentIntent.GENERAL_CHAT; // safe fallback
    }
  }

  // 4. Investment quota pre-check guard
  if (intent === AgentIntent.INVESTMENT_ADVICE && investmentPrecheck(query, strategyQuota)) {
    intent = AgentIntent.GENERAL_CHAT;
  }

  const worker = INTENT_TO_WORKER[intent];
  console.log(`[Router] intent=${intent} → worker=${worker}`);

  return { intent, worker, errors };
}
