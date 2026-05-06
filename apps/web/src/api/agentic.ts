const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('finsight_token');
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

// Internal bridge — overwritten by streamChatTyped so onUiSignal events
// route to callers without breaking the legacy untyped signature.
let _onUiSignalBridge: ((signal: unknown) => void) | undefined;

/**
 * Stream chat with the agentic AI via SSE (POST + ReadableStream).
 *
 * Supports both:
 *  - Named SSE frames: event: message | status | ui_signal | done | error
 *  - Legacy frames:    data: { token | status | done | error }
 *
 * @param message    User message text
 * @param sessionId  Existing session ID or null for a new session
 * @param onToken    Called with each streamed text token
 * @param onDone     Called with final metadata (sessionId, actionType, uiSignal…)
 * @param onError    Called on controlled error string
 * @param onStatus   Called with tool-execution status text (null = clear indicator)
 * @param ocrText    Optional OCR text extracted browser-side from an image
 */
export async function streamChat(message, sessionId, onToken, onDone, onError, onStatus, ocrText = null) {
  try {
    const payload: Record<string, unknown> = { message, sessionId };
    if (ocrText) payload.ocrText = ocrText;

    const res = await fetch(`${API_URL}/agentic/chat`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      onError?.(errText || 'Lỗi kết nối server');
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by blank lines (\n\n).
      // Keep the trailing incomplete chunk in the buffer.
      const frames = buffer.split('\n\n');
      buffer = frames.pop() ?? '';

      for (const frame of frames) {
        const trimmed = frame.trim();
        // Skip blank frames and SSE comment/heartbeat lines (e.g. ":ping")
        if (!trimmed || trimmed.startsWith(':')) continue;

        const eventMatch = trimmed.match(/^event:\s*(\S+)/m);
        const dataMatch = trimmed.match(/^data:\s*(.+)/m);

        // ── Named-event frame ──────────────────────────────────────────
        if (eventMatch && dataMatch) {
          let json: Record<string, unknown>;
          try {
            json = JSON.parse(dataMatch[1]);
          } catch {
            continue; // malformed JSON — skip, never crash
          }

          switch (eventMatch[1]) {
            case 'message':
              if (json.token) onToken?.(json.token as string);
              break;

            case 'status':
              // Empty string from SseWriter.clearStatus() means "clear the indicator"
              onStatus?.((json.status as string | null) ?? null);
              break;

            case 'ui_signal':
              if (json.uiSignal) {
                if (_onUiSignalBridge) {
                  _onUiSignalBridge(json.uiSignal);
                } else {
                  console.debug('[SSE] ui_signal received (no handler registered):', json.uiSignal);
                }
              }
              break;

            case 'done':
              onDone?.(json);
              break;

            case 'error':
              onError?.((json.error as string) || 'Lỗi không xác định từ server.');
              break;

            default:
              // Unknown named event — ignore safely
              break;
          }
          continue;
        }

        // ── Legacy frame: "data: <json>" without event: line ──────────
        if (dataMatch) {
          let json: Record<string, unknown>;
          try {
            json = JSON.parse(dataMatch[1]);
          } catch {
            continue;
          }

          if (json.done) {
            onDone?.(json);
          } else if (json.token) {
            onToken?.(json.token as string);
          } else if (json.status !== undefined) {
            onStatus?.(json.status as string | null);
          } else if (json.uiSignal) {
            if (_onUiSignalBridge) _onUiSignalBridge(json.uiSignal);
          } else if (json.error) {
            onError?.(json.error as string);
          }
        }
      }
    }
  } catch (err: any) {
    onError?.(err?.message || 'Không thể kết nối đến server');
  }
}

/**
 * Typed wrapper for streamChat that adds first-class `onUiSignal` support.
 * Prefer this over the bare streamChat going forward.
 */
export async function streamChatTyped(
  message: string,
  sessionId: string | null,
  callbacks: {
    onToken?: (token: string) => void;
    onStatus?: (status: string | null) => void;
    onUiSignal?: (signal: unknown) => void;
    onDone?: (meta: unknown) => void;
    onError?: (err: string) => void;
  },
  ocrText: string | null = null,
) {
  _onUiSignalBridge = callbacks.onUiSignal;
  try {
    await streamChat(
      message,
      sessionId,
      callbacks.onToken,
      callbacks.onDone,
      callbacks.onError,
      callbacks.onStatus,
      ocrText,
    );
  } finally {
    _onUiSignalBridge = undefined;
  }
}

/**
 * Get all chat sessions for current user.
 */
export async function getSessions() {
  const res = await fetch(`${API_URL}/agentic/sessions`, { headers: authHeaders() });
  return res.json();
}

/**
 * Get messages for a specific session.
 */
export async function getSessionMessages(sessionId) {
  const res = await fetch(`${API_URL}/agentic/sessions/${sessionId}`, { headers: authHeaders() });
  return res.json();
}

/**
 * Delete a chat session.
 */
export async function deleteSession(sessionId) {
  const res = await fetch(`${API_URL}/agentic/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}
