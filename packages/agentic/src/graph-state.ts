import { type UiSignal } from './ui-signal.js';

// ─── Intent taxonomy (Task 2.3 authoritative list) ───────────────────────────

export const AgentIntent = {
  DEBT_EXTRACTION: 'DEBT_EXTRACTION',
  REPAYMENT_SETUP: 'REPAYMENT_SETUP',
  INVESTMENT_ADVICE: 'INVESTMENT_ADVICE',
  DEBT_SUMMARY: 'DEBT_SUMMARY',
  DEBT_LIST_QUERY: 'DEBT_LIST_QUERY',
  SIMULATION: 'SIMULATION',
  MARKET_OVERVIEW: 'MARKET_OVERVIEW',
  MARKET_SPECIFIC: 'MARKET_SPECIFIC',
  KNOWLEDGE: 'KNOWLEDGE',
  GENERAL_CHAT: 'GENERAL_CHAT',
} as const;

export type AgentIntent = (typeof AgentIntent)[keyof typeof AgentIntent];

// ─── Legacy intent aliases (maps old intents to new taxonomy) ────────────────

export const LEGACY_INTENT_MAP: Record<string, AgentIntent> = {
  DATA_ENTRY: AgentIntent.DEBT_EXTRACTION,
  PERSONAL_QUERY: AgentIntent.DEBT_SUMMARY,
  WHAT_IF: AgentIntent.SIMULATION,
};

export function normalizeIntent(raw: string): AgentIntent {
  const upper = raw.trim().toUpperCase();
  if (upper in AgentIntent) return upper as AgentIntent;
  if (upper in LEGACY_INTENT_MAP) return LEGACY_INTENT_MAP[upper]!;
  return AgentIntent.GENERAL_CHAT;
}

// ─── Compact message record used inside graph state ──────────────────────────

export interface CompactMessage {
  role: 'user' | 'assistant' | 'system';
  /** Sanitized content – never raw payload JSON or sensitive data. */
  content: string;
}

// ─── Graph state (Task 2.1) ───────────────────────────────────────────────────

/**
 * Minimal state object threaded through the orchestration pipeline.
 *
 * Rules:
 * - Do NOT put full Prisma entities here; only the data needed for reasoning.
 * - `uiSignal` starts as undefined; workers set it to a validated UiSignal or null.
 * - `errors` accumulates non-fatal issues (e.g. memory compressor failure).
 */
export interface AgentGraphState {
  /** Authenticated user. */
  userId: string;

  /** Current or newly-created session. */
  sessionId: string;

  /** Raw user input for this turn. */
  input: string;

  /**
   * Compressed summary of messages older than the sliding window.
   * Empty string when there is nothing to summarize.
   */
  summary: string;

  /**
   * Sliding-window messages (≤ WINDOW_SIZE most recent).
   * Already sanitized – no raw popup/payload JSON.
   */
  recentMessages: CompactMessage[];

  /**
   * Optional additional context injected by the memory compressor
   * (e.g. "user confirmed debt X in previous turn").
   */
  activeContext: string;

  /** Classified intent for this turn. */
  intent: AgentIntent;

  /**
   * Worker identifier selected by the router.
   * Matches keys in the worker registry.
   */
  worker: string;

  /** Final text response to stream to the client. */
  textResponse: string;

  /**
   * Validated UI signal to emit after the text stream.
   * `null` means text-only response.
   * `undefined` means the worker has not run yet.
   */
  uiSignal: UiSignal | null | undefined;

  /** Accumulated non-fatal error messages for observability. */
  errors: string[];
}

/** Factory – create a fresh state with safe defaults. */
export function createInitialState(userId: string, sessionId: string, input: string): AgentGraphState {
  return {
    userId,
    sessionId,
    input,
    summary: '',
    recentMessages: [],
    activeContext: '',
    intent: AgentIntent.GENERAL_CHAT,
    worker: 'general',
    textResponse: '',
    uiSignal: undefined,
    errors: [],
  };
}
