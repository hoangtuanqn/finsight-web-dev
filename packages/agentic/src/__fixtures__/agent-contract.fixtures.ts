/**
 * Agent Contract Fixtures — Phase 0, Task 0.3
 *
 * Purpose: contract-level specs describing expected routing, worker selection,
 * UI signal type, and safety behaviour for each agent capability.
 *
 * Rules:
 * - No LLM calls. Pure static data.
 * - Assert intent, ui_signal.type, and safety — NOT the full LLM text response.
 * - "worker" reflects the planned Router-SubAgent target (Phase 2).
 *   Current code uses the same intent string as the tool-set selector.
 */

import { UiSignalType, type UiSignal } from '../ui-signal.js';

// ─── Fixture type ────────────────────────────────────────────────────────────

export interface AgentFixture {
  /** Human-readable test case name */
  name: string;
  /** Simulated user input */
  input: string;
  /** Optional OCR text injected alongside input */
  ocrText?: string;
  /** Expected intent returned by routeIntent() */
  expectedIntent: string;
  /** Target worker (Phase 2 plan name) */
  expectedWorker: string;
  /** Expected ui_signal.type in the final response */
  expectedUiSignalType: UiSignal['type'] | null;
  /** For SHOW_POPUP: expected action field */
  expectedUiSignalAction?: string | null;
  /** Safety / guardrail expectations */
  safety: {
    /** Should the off-topic guard block this request? */
    blockedByGuard: boolean;
    /** Should the agent refuse to write DB records directly? */
    noDirectDbWrite: boolean;
    /** For investment: must not hallucinate quota / income / capital */
    noHallucination?: boolean;
    /** For RAG: must reply with fixed phrase when KB below threshold */
    fixedReplyWhenNoKb?: boolean;
  };
  /** Short rationale / scenario description */
  note: string;
}

// ─── 1. Debt Extraction (DATA_ENTRY) ─────────────────────────────────────────

export const debtExtractionHappyPath: AgentFixture = {
  name: 'debt_extraction_happy_path',
  input: 'Tôi vừa vay FE Credit 10 triệu, lãi suất 22%/năm, kỳ hạn 12 tháng.',
  expectedIntent: 'DATA_ENTRY',
  expectedWorker: 'DebtWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'DEBT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'Full debt info provided. Worker calls parse_debt_from_text and returns SHOW_POPUP with populated data. No DB write before user confirms.',
};

export const debtExtractionMissingFields: AgentFixture = {
  name: 'debt_extraction_missing_fields',
  input: 'Thêm khoản nợ ngân hàng Vietcombank, chưa nhớ rõ số tiền.',
  expectedIntent: 'DATA_ENTRY',
  expectedWorker: 'DebtWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'DEBT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'Amount missing. Worker must return SHOW_POPUP with principalAmount: null. Must NOT hallucinate a default amount or term.',
};

export const debtExtractionWithOcr: AgentFixture = {
  name: 'debt_extraction_with_ocr',
  input: 'Đây là hợp đồng vay của tôi, bạn giúp tôi điền thông tin nhé.',
  ocrText: 'Số tiền vay: 50,000,000 VND\nLãi suất: 18%/năm\nKỳ hạn: 24 tháng',
  expectedIntent: 'DATA_ENTRY',
  expectedWorker: 'DebtWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'DEBT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'OCR text injected into prompt. Worker should extract from OCR context, not hallucinate.',
};

// ─── 2. Personal Query / Debt Summary (PERSONAL_QUERY) ───────────────────────

export const debtSummaryHappyPath: AgentFixture = {
  name: 'debt_summary_happy_path',
  input: 'Tình trạng nợ của tôi hiện nay thế nào?',
  expectedIntent: 'PERSONAL_QUERY',
  expectedWorker: 'SummaryWorker',
  expectedUiSignalType: UiSignalType.SHOW_INTERACTIVE_CARD,
  expectedUiSignalAction: 'DEBT_SUMMARY_ACTIONS',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'Overview query → SummaryWorker returns 3-point text + SHOW_INTERACTIVE_CARD with /home and /debts buttons.',
};

export const debtListQuery: AgentFixture = {
  name: 'debt_list_query_redirects',
  input: 'Liệt kê chi tiết từng khoản nợ của tôi.',
  expectedIntent: 'PERSONAL_QUERY',
  expectedWorker: 'SummaryWorker',
  expectedUiSignalType: UiSignalType.REDIRECT,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'Specific list query → must REDIRECT to /debts instead of SHOW_INTERACTIVE_CARD.',
};

// ─── 3. Repayment Setup (WHAT_IF / RepaymentWorker) ──────────────────────────

export const repaymentSetupHappyPath: AgentFixture = {
  name: 'repayment_setup_happy_path',
  input: 'Tôi muốn trả thêm 2 triệu mỗi tháng, mục tiêu hết nợ trước tháng 12 năm 2026.',
  expectedIntent: 'WHAT_IF',
  expectedWorker: 'RepaymentWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'REPAYMENT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'extraBudget and targetDate both present. Worker returns SHOW_POPUP/REPAYMENT_CONFIRMATION. No profile update before user confirms.',
};

export const repaymentSetupNoTargetDate: AgentFixture = {
  name: 'repayment_setup_no_target_date',
  input: 'Nếu tôi trả thêm 1 triệu mỗi tháng thì sao?',
  expectedIntent: 'WHAT_IF',
  expectedWorker: 'RepaymentWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'REPAYMENT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'targetDate missing. Worker must still return SHOW_POPUP with targetDate: null. Must NOT invent a date.',
};

// ─── 4. Investment Advice (INVESTMENT_ADVICE) ─────────────────────────────────

export const investmentAdviceHappyPath: AgentFixture = {
  name: 'investment_advice_happy_path',
  input: 'Tôi muốn được tư vấn phân bổ danh mục đầu tư, thu nhập 20 triệu, vốn 50 triệu, khẩu vị trung bình.',
  expectedIntent: 'INVESTMENT_ADVICE',
  expectedWorker: 'InvestmentWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'INVESTMENT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'All 3 required fields present. Worker checks quota > 0 then returns SHOW_POPUP. Strategy generation only after user confirms.',
};

export const investmentAdviceMissingFields: AgentFixture = {
  name: 'investment_advice_missing_fields',
  input: 'Nên đầu tư vào đâu bây giờ?',
  expectedIntent: 'INVESTMENT_ADVICE',
  expectedWorker: 'InvestmentWorker',
  expectedUiSignalType: UiSignalType.SHOW_POPUP,
  expectedUiSignalAction: 'INVESTMENT_CONFIRMATION',
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'monthlyIncome/capital/riskLevel missing. Worker must return SHOW_POPUP with those fields null. Must NOT fabricate income or capital.',
};

export const investmentAdviceQuotaExhausted: AgentFixture = {
  name: 'investment_advice_quota_exhausted',
  input: 'Tôi muốn xem chiến lược đầu tư mới.',
  expectedIntent: 'INVESTMENT_ADVICE',
  expectedWorker: 'InvestmentWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'strategyQuota = 0. Worker must respond with plain text refusal. No popup should be rendered.',
};

// ─── 5. What-If / Simulation (WHAT_IF → SimulationWorker) ────────────────────

export const simulationHappyPath: AgentFixture = {
  name: 'simulation_happy_path',
  input: 'Nếu tôi vay thêm 100 triệu lãi 10%, DTI của tôi sẽ là bao nhiêu?',
  expectedIntent: 'WHAT_IF',
  expectedWorker: 'SimulationWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'Text-only result. Worker uses simulateDtiTool for calculation. LLM must NOT invent DTI numbers. Markdown links allowed, no popup/card.',
};

export const simulationMissingIncome: AgentFixture = {
  name: 'simulation_missing_income',
  input: 'Giả sử tôi vay thêm 50 triệu thì sao?',
  expectedIntent: 'WHAT_IF',
  expectedWorker: 'SimulationWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    noHallucination: true,
  },
  note: 'Income not in profile. Worker must indicate DTI cannot be calculated accurately and prompt user to update income.',
};

// ─── 6. Market (INVESTMENT_ADVICE → MarketWorker) ────────────────────────────

export const marketOverviewHappyPath: AgentFixture = {
  name: 'market_overview_happy_path',
  input: 'Tình hình thị trường hiện tại như thế nào?',
  expectedIntent: 'INVESTMENT_ADVICE',
  expectedWorker: 'MarketWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'Overview query → MarketWorker calls gold/sentiment/stock tools in parallel. Text-only response.',
};

export const marketSpecificGold: AgentFixture = {
  name: 'market_specific_gold',
  input: 'Giá vàng hôm nay là bao nhiêu?',
  expectedIntent: 'INVESTMENT_ADVICE',
  expectedWorker: 'MarketWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'Specific gold price query → only getMarketPricesTool called. If API fails, worker returns a natural apology (no stack trace).',
};

export const marketApiFailure: AgentFixture = {
  name: 'market_api_failure',
  input: 'Bitcoin đang ở mức bao nhiêu?',
  expectedIntent: 'INVESTMENT_ADVICE',
  expectedWorker: 'MarketWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'Simulated 3rd-party API error. Worker must NOT expose error codes/stack traces. Must return user-friendly apology text.',
};

// ─── 7. RAG / Knowledge (KNOWLEDGE) ──────────────────────────────────────────

export const ragHappyPath: AgentFixture = {
  name: 'rag_happy_path',
  input: 'DTI là gì và tôi nên duy trì ở mức nào?',
  expectedIntent: 'KNOWLEDGE',
  expectedWorker: 'RagWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    fixedReplyWhenNoKb: false,
  },
  note: 'Financial term in KB. Worker answers based solely on retrieved context. No popup/card.',
};

export const ragNoRelevantResult: AgentFixture = {
  name: 'rag_no_relevant_result',
  input: 'Lịch sử hình thành của đồng tiền Bitcoin là gì?',
  expectedIntent: 'KNOWLEDGE',
  expectedWorker: 'RagWorker',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
    fixedReplyWhenNoKb: true,
  },
  note: 'Query below cosine threshold. Worker MUST reply with the fixed phrase: "Tôi không biết về chủ đề đó. Vui lòng hỏi về lĩnh vực tài chính." No hallucination.',
};

// ─── 8. Off-topic guard ───────────────────────────────────────────────────────

export const offTopicBlocked: AgentFixture = {
  name: 'off_topic_blocked_by_guard',
  input: 'Bạn có thể giới thiệu phim hay cho tôi không?',
  expectedIntent: 'OFF_TOPIC',
  expectedWorker: 'None',
  expectedUiSignalType: null,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: true,
    noDirectDbWrite: true,
  },
  note: 'Keyword "phim hay" triggers checkIsOffTopicGuard. Request is blocked before reaching the router or any worker.',
};

export const offTopicPassesGuardRoutedToGeneral: AgentFixture = {
  name: 'off_topic_routed_general_chat',
  input: 'Cảm ơn bạn, thông tin rất hữu ích!',
  expectedIntent: 'GENERAL_CHAT',
  expectedWorker: 'None',
  expectedUiSignalType: UiSignalType.NONE,
  expectedUiSignalAction: null,
  safety: {
    blockedByGuard: false,
    noDirectDbWrite: true,
  },
  note: 'Keyword "cảm ơn" matches GENERAL_CHAT fast path. No tools called. Short acknowledgement text only.',
};

// ─── Grouped export ───────────────────────────────────────────────────────────

export const ALL_FIXTURES: AgentFixture[] = [
  // Debt Extraction
  debtExtractionHappyPath,
  debtExtractionMissingFields,
  debtExtractionWithOcr,

  // Debt Summary / Personal Query
  debtSummaryHappyPath,
  debtListQuery,

  // Repayment Setup
  repaymentSetupHappyPath,
  repaymentSetupNoTargetDate,

  // Investment
  investmentAdviceHappyPath,
  investmentAdviceMissingFields,
  investmentAdviceQuotaExhausted,

  // Simulation
  simulationHappyPath,
  simulationMissingIncome,

  // Market
  marketOverviewHappyPath,
  marketSpecificGold,
  marketApiFailure,

  // RAG / Knowledge
  ragHappyPath,
  ragNoRelevantResult,

  // Guard / Off-topic
  offTopicBlocked,
  offTopicPassesGuardRoutedToGeneral,
];
