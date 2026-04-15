import { useState, useCallback, useRef } from 'react';
import { streamChat, getSessions, getSessionMessages, deleteSession } from '../api/agentic.js';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content: 'Xin chào! Tôi là **FinSight AI Advisor** — trợ lý tài chính thông minh của bạn. Hãy hỏi tôi về:\n- 📊 Tình trạng nợ & DTI\n- 💡 Chiến lược trả nợ (Avalanche / Snowball)\n- 📈 Thị trường & đầu tư\n- 🏦 Khai báo khoản nợ mới',
};

export function useAgenticChat() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [toolStatus, setToolStatus] = useState(null); // Agent tool status text
  const abortRef = useRef(false);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isStreaming) return;

    const userMsg = { id: `user-${Date.now()}`, role: 'user', content: text };
    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg = { id: aiMsgId, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);
    setToolStatus('🤔 Đang suy nghĩ...');
    abortRef.current = false;

    await streamChat(
      text,
      sessionId,
      // onToken
      (token) => {
        if (abortRef.current) return;
        setToolStatus(null); // Clear tool status when text starts arriving
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + token } : m)
        );
      },
      // onDone
      (meta) => {
        setIsStreaming(false);
        setToolStatus(null);
        if (meta.sessionId) setSessionId(meta.sessionId);
        if (meta.actionType === 'form_population' && meta.triggerPayload) {
          setPendingAction(meta.triggerPayload);
        }
      },
      // onError
      (err) => {
        setIsStreaming(false);
        setToolStatus(null);
        setMessages(prev =>
          prev.map(m => m.id === aiMsgId
            ? { ...m, content: `⚠️ ${err || 'Đã xảy ra lỗi. Vui lòng thử lại.'}` }
            : m
          )
        );
      },
      // onStatus (tool execution status)
      (status) => {
        setToolStatus(status);
      }
    );
  }, [isStreaming, sessionId]);

  const loadSessions = useCallback(async () => {
    try {
      const res = await getSessions();
      if (res.success) setSessions(res.data.sessions);
    } catch { /* ignore */ }
  }, []);

  const loadSession = useCallback(async (id) => {
    try {
      const res = await getSessionMessages(id);
      if (res.success) {
        setSessionId(id);
        const history = res.data.session.messages.map(m => ({
          id: m.id,
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));
        setMessages([WELCOME_MESSAGE, ...history]);
      }
    } catch { /* ignore */ }
  }, []);

  const removeSession = useCallback(async (id) => {
    try {
      await deleteSession(id);
      if (sessionId === id) {
        setSessionId(null);
        setMessages([WELCOME_MESSAGE]);
      }
      await loadSessions();
    } catch { /* ignore */ }
  }, [sessionId, loadSessions]);

  const newChat = useCallback(() => {
    setSessionId(null);
    setMessages([WELCOME_MESSAGE]);
    setPendingAction(null);
    setToolStatus(null);
  }, []);

  const dismissAction = useCallback(() => setPendingAction(null), []);

  return {
    messages, isStreaming, sessionId, sessions, pendingAction, toolStatus,
    sendMessage, loadSession, loadSessions, removeSession, newChat, dismissAction,
  };
}
