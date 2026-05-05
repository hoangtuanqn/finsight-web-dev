import { type AgentGraphState } from './graph-state.js';
import { type UiSignal } from './ui-signal.js';

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

/** Off-topic refusal worker. */
export const offTopicWorker: AgentWorker = {
  id: 'off_topic',
  async run(_state, onToken) {
    const reply =
      'Xin lỗi, tôi là FinSight Advisor chuyên về quản lý nợ và tài chính cá nhân. Tôi không thể hỗ trợ các chủ đề ngoài phạm vi chuyên môn. Bạn có thắc mắc về DTI, lãi suất, hay đầu tư không?';
    onToken(reply);
    return { text: reply, uiSignal: null };
  },
};

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

/** General-chat worker – echoes a short acknowledgement. */
export const generalChatWorker: AgentWorker = {
  id: 'general',
  async run(_state, onToken) {
    const reply = 'Tôi đã ghi nhận. Bạn có thắc mắc gì về tài chính hoặc khoản nợ không?';
    onToken(reply);
    return { text: reply, uiSignal: null };
  },
};

// ─── Default registry (stubs for all workers, replaced by real implementations) ─

export function buildDefaultWorkerRegistry(): WorkerRegistry {
  const registry = new WorkerRegistry();

  registry
    .register(offTopicWorker)
    .register(maxLengthWorker)
    .register(generalChatWorker)
    .register(createStubWorker('debt_extraction'))
    .register(createStubWorker('repayment'))
    .register(createStubWorker('investment'))
    .register(createStubWorker('debt_summary'))
    .register(createStubWorker('debt_list'))
    .register(createStubWorker('simulation'))
    .register(createStubWorker('market'))
    .register(createStubWorker('rag'));

  return registry;
}
