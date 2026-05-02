import { useCallback, useRef, useState } from 'react';
import { deleteSession, getSessionMessages, getSessions, streamChat } from '../api/agentic';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant' as const,
  content:
    'Xin chào! Tôi là **FinSight AI Advisor** - trợ lý tài chính thông minh của bạn. Hãy hỏi tôi về:\n- 📊 Tình trạng nợ & DTI\n- 💡 Chiến lược trả nợ (Avalanche / Snowball)\n- 📈 Thị trường & đầu tư\n- 🏦 Khai báo khoản nợ mới\n- 📷 Upload ảnh hóa đơn/hợp đồng vay để thêm nợ tự động',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useAgenticChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [toolStatus, setToolStatus] = useState<string | null>(null); // Agent tool status text
  const abortRef = useRef(false);

  const sendMessage = useCallback(
    async (text: string, ocrText: string | null = null, overrideDisplay: string | null = null) => {
      if (!text.trim() || isStreaming) return;

      const displayContent = overrideDisplay || text;
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: displayContent,
      };
      const aiMsgId = `ai-${Date.now()}`;
      const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '' };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);
      setToolStatus('🤔 Đang suy nghĩ...');
      abortRef.current = false;

      await streamChat(
        text,
        sessionId,
        // onToken
        (token: string) => {
          if (abortRef.current) return;
          setToolStatus(null);
          setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? { ...m, content: m.content + token } : m)));
        },
        // onDone
        (meta: any) => {
          setIsStreaming(false);
          setToolStatus(null);
          if (meta.sessionId) setSessionId(meta.sessionId);
          if (meta.actionType === 'form_population' && meta.triggerPayload) {
            setPendingAction(meta.triggerPayload);
          }
        },
        // onError
        (err: any) => {
          setIsStreaming(false);
          setToolStatus(null);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    content: `⚠️ ${err || 'Đã xảy ra lỗi. Vui lòng thử lại.'}`,
                  }
                : m,
            ),
          );
        },
        // onStatus (tool execution status)
        (status: string) => {
          setToolStatus(status);
        },
        // ocrText extracted directly on the browser
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
    setToolStatus(null);
  }, []);

  const dismissAction = useCallback(() => setPendingAction(null), []);

  return {
    messages,
    isStreaming,
    sessionId,
    sessions,
    pendingAction,
    toolStatus,
    sendMessage,
    loadSession,
    loadSessions,
    removeSession,
    newChat,
    dismissAction,
    setToolStatus,
    setIsStreaming,
    setMessages,
  };
}
