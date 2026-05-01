import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { type AgentGraphState } from './graph-state.js';
import { getChatModel } from './llm-provider.js';
import { type UiSignal } from './ui-signal.js';
import { debtExtractionWorker } from './workers/debt-extraction.worker.js';
import { debtSummaryWorker } from './workers/debt-summary.worker.js';
import { investmentWorker } from './workers/investment.worker.js';
import { marketWorker } from './workers/market.worker.js';
import { ragWorker } from './workers/rag.worker.js';
import { repaymentWorker } from './workers/repayment.worker.js';
import { simulationWorker } from './workers/simulation.worker.js';

// ─── Tool event (status updates streamed to the client) ───────────────────────

export interface WorkerToolEvent {
  /** Tool identifier (e.g. `parse_debt_from_text`). */
  toolName: string;
  /** Human-readable label to show in the chat UI. */
  statusLabel: string;
  /** `start` when tool begins, `end` when it finishes. */
  phase: 'start' | 'end';
}

// ─── Worker output ────────────────────────────────────────────────────────────

/**
 * Typed return value from every worker.
 *
 * Rules:
 * - `text`: the final assistant response; must never be empty.
 * - `uiSignal`: validated UiSignal, or `null` for text-only responses.
 *   Workers MUST NOT leave this `undefined`.
 * - `toolEvents`: optional ordered list of tool status events to replay.
 * - Workers MUST NOT write to the database.  Memory persistence is the
 *   orchestrator's responsibility.
 * - Workers MUST NOT format SSE.  That is the API controller's responsibility.
 */
export interface WorkerOutput {
  text: string;
  uiSignal: UiSignal | null;
  toolEvents?: WorkerToolEvent[];
}

// ─── Worker interface ─────────────────────────────────────────────────────────

/**
 * Contract that every agent worker must implement.
 *
 * Acceptance criteria (Task 2.4):
 * - Input is `AgentGraphState`; output is `WorkerOutput`.
 * - Workers can be tested in isolation using mock tools.
 * - Workers return `uiSignal: null` for text-only responses.
 * - Workers never write to DB; orchestrator handles persistence.
 * - Workers never produce SSE; controller handles streaming.
 */
export interface AgentWorker {
  /** Unique identifier (must match value in `INTENT_TO_WORKER`). */
  readonly id: string;

  /**
   * Execute the worker logic.
   *
   * @param state  - Current graph state (contains userId, intent, memory, etc.)
   * @param onToken - Callback to stream tokens to the client in real time.
   * @param onToolStatus - Callback to send tool status strings (or null to clear).
   * @param isAborted - Optional abort check; return true when the request was cancelled.
   */
  run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput>;
}

// ─── Worker registry ──────────────────────────────────────────────────────────

/**
 * Simple registry: map worker id → worker instance.
 *
 * Workers are registered lazily; the orchestrator resolves the active worker
 * via `state.worker`.
 */
export class WorkerRegistry {
  private readonly _workers = new Map<string, AgentWorker>();

  register(worker: AgentWorker): this {
    this._workers.set(worker.id, worker);
    return this;
  }

  resolve(workerId: string): AgentWorker | undefined {
    return this._workers.get(workerId);
  }

  has(workerId: string): boolean {
    return this._workers.has(workerId);
  }

  get ids(): string[] {
    return [...this._workers.keys()];
  }
}

// ─── Fallback / stub workers ──────────────────────────────────────────────────

/** Placeholder text response used by stub workers during incremental rollout. */
const STUB_RESPONSE =
  'Tính năng này đang được phát triển. Vui lòng thử lại sau hoặc hỏi câu khác liên quan đến tài chính.';

/** Max-length refusal worker. */
export const maxLengthWorker: AgentWorker = {
  id: 'max_length',
  async run(_state, onToken) {
    const reply = 'Tin nhắn quá dài. Vui lòng rút gọn câu hỏi (tối đa 2000 ký tự) để tôi hỗ trợ tốt hơn.';
    onToken(reply);
    return { text: reply, uiSignal: null };
  },
};

/**
 * Create a stub worker that returns a standard "in development" message.
 * Used as placeholder until the real worker is wired up.
 */
export function createStubWorker(id: string): AgentWorker {
  return {
    id,
    async run(_state, onToken) {
      onToken(STUB_RESPONSE);
      return { text: STUB_RESPONSE, uiSignal: null };
    },
  };
}

const GENERAL_CHAT_SYSTEM = `Bạn là FinSight Advisor trong các lượt hội thoại chung.
Nhiệm vụ:
1. Trả lời tự nhiên, ngắn gọn, thân thiện bằng tiếng Việt.
2. Dùng cho lời cảm ơn, xác nhận, small talk, hoặc câu hỏi không khớp các luồng nghiệp vụ tài chính.
3. Nếu câu hỏi không thuộc phạm vi tài chính cá nhân/quản lý nợ/đầu tư, không chặn cứng; hãy phản hồi lịch sự và gợi ý cách bạn có thể hỗ trợ nếu người dùng muốn quay lại chủ đề tài chính.
4. Không gọi tool, không hứa tạo dữ liệu, không nhắc tới intent/worker/router, không gắn popup/card.`;

/** General-chat worker – handles acknowledgements and soft fallback replies. */
export const generalChatWorker: AgentWorker = {
  id: 'general',
  async run(state, onToken, _onToolStatus, isAborted) {
    const recentCtx = state.recentMessages
      .slice(0, -1) // exclude last item (current user message already in state.input)
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');
    const contextBlock = state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}\n\n${recentCtx}` : recentCtx;
    const userContent = contextBlock ? `${contextBlock}\n\nNgười dùng: ${state.input}` : state.input;

    const llm = getChatModel({ streaming: true, temperature: 0.4, maxTokens: 320 });
    let fullText = '';

    try {
      const stream = await llm.stream([new SystemMessage(GENERAL_CHAT_SYSTEM), new HumanMessage(userContent)]);
      for await (const chunk of stream) {
        if (isAborted?.()) break;
        const token = typeof chunk.content === 'string' ? chunk.content : '';
        if (token) {
          fullText += token;
          onToken(token);
        }
      }
    } catch (err: any) {
      console.error('[GeneralChatWorker] stream error:', err.message);
    }

    if (isAborted?.()) {
      return { text: fullText, uiSignal: null };
    }

    if (!fullText.trim()) {
      fullText = 'Tôi đã ghi nhận. Bạn muốn tôi hỗ trợ tiếp phần nào về tài chính cá nhân hoặc các khoản nợ?';
      onToken(fullText);
    }

    return { text: fullText, uiSignal: null };
  },
};

// ─── Default registry (stubs for all workers, replaced by real implementations) ─

export function buildDefaultWorkerRegistry(): WorkerRegistry {
  const registry = new WorkerRegistry();

  registry
    .register(maxLengthWorker)
    .register(generalChatWorker)
    .register(debtExtractionWorker) // Task 2.5 — real implementation
    .register(repaymentWorker) // Task 2.6 — real implementation
    .register(investmentWorker) // Task 2.7 — real implementation
    .register(debtSummaryWorker) // Task 2.8 — real implementation
    .register(simulationWorker) // Task 2.9 — real implementation
    .register(marketWorker) // Task 2.10 — real implementation
    .register(createStubWorker('debt_list'))
    .register(ragWorker); // Task 2.11 — real implementation

  return registry;
}
