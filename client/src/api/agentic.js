const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('finsight_token');
}

function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Stream chat with the agentic AI via SSE (POST + ReadableStream).
 * @param {string} message
 * @param {string|null} sessionId
 * @param {function} onToken - called with each text token
 * @param {function} onDone - called with final metadata
 * @param {function} onError - called on error
 * @param {function} onStatus - called with tool execution status text
 * @param {string|null} ocrText - optional OCR text extracted from image
 */
export async function streamChat(message, sessionId, onToken, onDone, onError, onStatus, ocrText = null) {
  try {
    const payload = { message, sessionId };
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

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE lines: "data: {...}\n\n"
      const lines = buffer.split('\n\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));

          if (json.done) {
            onDone?.(json);
          } else if (json.token) {
            onToken?.(json.token);
          } else if (json.status !== undefined) {
            onStatus?.(json.status);
          } else if (json.error) {
            onError?.(json.error);
          }
        } catch { /* skip malformed JSON */ }
      }
    }
  } catch (err) {
    onError?.(err.message || 'Không thể kết nối đến server');
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
