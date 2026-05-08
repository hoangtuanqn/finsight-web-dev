import { useCallback, useRef, useState } from 'react';
import { deleteSession, getSessionMessages, getSessions, streamChatTyped } from '../api/agentic';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant' as const,
  content:
    'Xin chào! Tôi là **FinSight AI Advisor** - trợ lý tài chính thông minh của bạn. Hãy hỏi tôi về:\n- Tình trạng nợ & DTI\n- Chiến lược trả nợ (Avalanche / Snowball)\n- Thị trường & đầu tư\n- Khai báo khoản nợ mới\n- Upload ảnh hóa đơn/hợp đồng vay để thêm nợ tự động',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Shape of a validated UiSignal from the backend.
 * Kept intentionally loose so the dispatcher decides how to render each action.
 */
export interface UiSignal {
  type: 'SHOW_POPUP' | 'SHOW_INTERACTIVE_CARD' | 'REDIRECT' | 'NONE';
  action: string;
  data?: unknown;
}

export function useAgenticChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  /** Legacy debt-form action (kept for backward compat with DebtConfirmModal) */
  const [pendingAction, setPendingAction] = useState<any>(null);
  /** New typed UI signal dispatched by the server */
  const [pendingUiSignal, setPendingUiSignal] = useState<UiSignal | null>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string, ocrText: string | null = null, overrideDisplay: string | null = null, isSilent = false) => {
      if (!text.trim() || isStreaming) return;

      if (isSilent) {
        // Silent confirm/cancel — no backend call, but we still append a local AI message.
        // The user action (save/cancel) was already handled by the UI component.
        setMessages((prev) => [...prev, { id: `sys-${Date.now()}`, role: 'assistant', content: text }]);
        return;
      }

      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '' };

      const displayContent = overrideDisplay || text;
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: displayContent,
      };
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);
      setToolStatus('Đang suy nghĩ...');
      abortRef.current = false;

      await streamChatTyped(
        text,
        sessionId,
        {
          onToken: (token) => {
            if (abortRef.current) return;
            setToolStatus(null);
            setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, content: m.content + token } : m)));
          },

          onStatus: (status) => {
            if (abortRef.current) return;
            setToolStatus(status);
          },

          // Typed UI signal — dispatched before `done`
          onUiSignal: (signal) => {
            if (abortRef.current) return;
            const s = signal as UiSignal;
            if (!s?.type || s.type === 'NONE') return;
            setPendingUiSignal(s);
          },

          onDone: (meta: any) => {
            setIsStreaming(false);
            setToolStatus(null);
            if (meta.sessionId) setSessionId(meta.sessionId);

            // Legacy: form_population path still triggers DebtConfirmModal
            if (meta.actionType === 'form_population' && meta.triggerPayload) {
              setPendingAction(meta.triggerPayload);
            }

            // If server bundled uiSignal inside done (fallback), hydrate it
            if (meta.uiSignal?.type && meta.uiSignal.type !== 'NONE') {
              setPendingUiSignal(meta.uiSignal as UiSignal);
            }
          },

          onError: (err) => {
            setIsStreaming(false);
            setToolStatus(null);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === aiMsgId ? { ...m, content: `${err || 'Đã xảy ra lỗi. Vui lòng thử lại.'}` } : m,
              ),
            );
          },
        },
        ocrText,
      );
    },
    [isStreaming, sessionId],
  );

  const loadSessions = useCallback(async () => {
    try {
      const res = await getSessions();
      if (res.success) setSessions(res.data.sessions);
    } catch {
      /* ignore */
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const res = await getSessionMessages(id);
      if (res.success) {
        setSessionId(id);
        const history = res.data.session.messages.map((m: any) => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
        setMessages([WELCOME_MESSAGE, ...history]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const removeSession = useCallback(
    async (id: string) => {
      try {
        await deleteSession(id);
        if (sessionId === id) {
          setSessionId(null);
          setMessages([WELCOME_MESSAGE]);
        }
        await loadSessions();
      } catch {
        /* ignore */
      }
    },
    [sessionId, loadSessions],
  );

  const newChat = useCallback(() => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setPendingAction(null);
    setPendingUiSignal(null);
    setToolStatus(null);
  }, []);

  const dismissAction = useCallback(() => setPendingAction(null), []);
  const dismissUiSignal = useCallback(() => {
    setPendingUiSignal(null);
    setPendingAction(null); // Clear legacy payload to prevent duplicate modals
  }, []);

  return {
    messages,
    isStreaming,
    sessionId,
    sessions,
    /** @deprecated use pendingUiSignal + UiSignalDispatcher instead */
    pendingAction,
    pendingUiSignal,
    toolStatus,
    sendMessage,
    loadSession,
    loadSessions,
    removeSession,
    newChat,
    dismissAction,
    dismissUiSignal,
    setToolStatus,
    setIsStreaming,
    setMessages,
  };
}
