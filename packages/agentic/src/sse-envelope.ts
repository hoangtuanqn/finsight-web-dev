import { type UiSignal, safeParseUiSignal } from './ui-signal.js';

// ─── SSE event names ────────────────────────────────────────────────

export const SSE_EVENT = {
  MESSAGE: 'message',
  STATUS: 'status',
  UI_SIGNAL: 'ui_signal',
  DONE: 'done',
  ERROR: 'error',
} as const;

export type SseEventName = (typeof SSE_EVENT)[keyof typeof SSE_EVENT];

// ─── Payload types ──────────────────────────────────────────────────

export interface SseMessagePayload {
  token: string;
}

export interface SseStatusPayload {
  status: string;
}

export interface SseUiSignalPayload {
  uiSignal: UiSignal;
}

export interface SseDonePayload {
  done: true;
  sessionId: string;
  actionType: string | null;
  uiSignal: UiSignal | null;
  /** @deprecated use uiSignal — kept for legacy clients */
  triggerPayload?: unknown;
}

export interface SseErrorPayload {
  done: true;
  error: string;
}

// ─── Low-level formatter ────────────────────────────────────────────

/**
 * Format a single SSE frame.
 * Named events use `event:` + `data:`.
 * Heartbeat comments use `:ping`.
 */
function formatSseFrame(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

// ─── Writer interface ───────────────────────────────────────────────

/**
 * Minimal writable interface — compatible with Express `Response`
 * and any object that exposes `.write(chunk: string): boolean`.
 * No Express dependency.
 */
export interface SseWritable {
  write(chunk: string): boolean;
}

// ─── SSE Writer class ───────────────────────────────────────────────

export interface SseWriterOptions {
  /**
   * Emit legacy `data: { ... }\n\n` alongside named events
   * so the old client parser keeps working.
   * Set to `false` once the client is upgraded.
   * @default true
   */
  legacyCompat?: boolean;
  /** Heartbeat interval in ms. @default 15_000 */
  heartbeatMs?: number;
}

/**
 * High-level SSE helper that writes well-typed events
 * to an Express-like response. No Express import required.
 *
 * Usage:
 * ```ts
 * const writer = new SseWriter(res);
 * writer.startHeartbeat();
 * writer.sendToken('Hello');
 * writer.sendUiSignal(validatedSignal);
 * writer.sendDone({ sessionId, actionType, uiSignal });
 * writer.close();
 * ```
 */
export class SseWriter {
  private res: SseWritable;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private legacyCompat: boolean;
  private heartbeatMs: number;

  constructor(res: SseWritable, opts?: SseWriterOptions) {
    this.res = res;
    this.legacyCompat = opts?.legacyCompat ?? true;
    this.heartbeatMs = opts?.heartbeatMs ?? 15_000;
  }

  // ── Heartbeat ───────────────────────────────────────────────────

  startHeartbeat(): void {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.closed) return;
      this.res.write(`:ping\n\n`);
    }, this.heartbeatMs);
  }

  // ── Token text ──────────────────────────────────────────────────

  sendToken(token: string): void {
    if (this.closed) return;
    const payload: SseMessagePayload = { token };
    const json = JSON.stringify(payload);

    this.res.write(formatSseFrame(SSE_EVENT.MESSAGE, json));

    if (this.legacyCompat) {
      this.res.write(`data: ${json}\n\n`);
    }
  }

  // ── Tool / worker status ────────────────────────────────────────

  sendStatus(status: string): void {
    if (this.closed) return;
    const payload: SseStatusPayload = { status };
    const json = JSON.stringify(payload);

    this.res.write(formatSseFrame(SSE_EVENT.STATUS, json));

    if (this.legacyCompat) {
      this.res.write(`data: ${json}\n\n`);
    }
  }

  clearStatus(): void {
    if (this.closed) return;
    const payload: SseStatusPayload = { status: '' };
    const json = JSON.stringify(payload);

    this.res.write(formatSseFrame(SSE_EVENT.STATUS, json));

    if (this.legacyCompat) {
      this.res.write(`data: ${JSON.stringify({ status: null })}\n\n`);
    }
  }

  // ── UI Signal (validated before send) ───────────────────────────

  /**
   * Validate and send a complete UI Signal.
   * Returns `false` if validation fails — the signal is NOT sent.
   */
  sendUiSignal(raw: unknown): boolean {
    if (this.closed) return false;

    const result = safeParseUiSignal(raw);
    if (!result.success) {
      console.error('[SseWriter] ui_signal validation failed:', result.error);
      return false;
    }

    const payload: SseUiSignalPayload = { uiSignal: result.data };
    this.res.write(formatSseFrame(SSE_EVENT.UI_SIGNAL, JSON.stringify(payload)));
    return true;
  }

  // ── Done ────────────────────────────────────────────────────────

  sendDone(meta: {
    sessionId: string;
    actionType: string | null;
    uiSignal?: UiSignal | null;
    triggerPayload?: unknown;
  }): void {
    if (this.closed) return;
    const payload: SseDonePayload = {
      done: true,
      sessionId: meta.sessionId,
      actionType: meta.actionType,
      uiSignal: meta.uiSignal ?? null,
      triggerPayload: meta.triggerPayload ?? null,
    };
    const json = JSON.stringify(payload);

    this.res.write(formatSseFrame(SSE_EVENT.DONE, json));

    if (this.legacyCompat) {
      this.res.write(`data: ${json}\n\n`);
    }
  }

  // ── Error ───────────────────────────────────────────────────────

  sendError(message: string): void {
    if (this.closed) return;
    const payload: SseErrorPayload = { done: true, error: message };
    const json = JSON.stringify(payload);

    this.res.write(formatSseFrame(SSE_EVENT.ERROR, json));

    if (this.legacyCompat) {
      this.res.write(`data: ${json}\n\n`);
    }
  }

  // ── Lifecycle ───────────────────────────────────────────────────

  close(): void {
    if (this.closed) return;
    this.closed = true;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

// ─── SSE response headers helper ────────────────────────────────────

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
} as const;
