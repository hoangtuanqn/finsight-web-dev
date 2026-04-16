import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, History, Paperclip, ImageIcon } from 'lucide-react';
import { useAgenticChat } from '../../hooks/useAgenticChat.js';
import { runOCR } from '../../utils/ocr.js';
import MessageRenderer from './MessageRenderer.jsx';
import ChatHistory from './ChatHistory.jsx';
import DebtConfirmModal from './DebtConfirmModal.jsx';

export default function AIChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { file, preview, base64 }
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    messages, isStreaming, sessionId, sessions, pendingAction, toolStatus,
    sendMessage, loadSession, loadSessions, removeSession, newChat, dismissAction,
    setToolStatus, setIsStreaming, setMessages
  } = useAgenticChat();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, toolStatus]);

  // Load sessions when history panel opens
  useEffect(() => {
    if (showHistory) loadSessions();
  }, [showHistory, loadSessions]);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || isStreaming) return;

    const text = inputValue.trim();
    const imageInfo = selectedImage;
    
    // Clear input state immediately for UX
    setInputValue('');
    setSelectedImage(null);

    // If no image, just send normally
    if (!imageInfo) {
      sendMessage(text);
      return;
    }

    // --- HAS IMAGE: RUN FRONTEND OCR ---
    setIsStreaming(true);
    setToolStatus('📷 Đang khởi tạo bộ đọc OCR...');

    // Show optimistic user message right now
    const displayContent = text ? `📷 [Ảnh đính kèm]\n${text}` : `📷 [Ảnh đính kèm]`;
    setMessages(prev => [...prev, { id: `user-temp-${Date.now()}`, role: 'user', content: displayContent }]);

    const ocrResult = await runOCR(imageInfo.base64, (progress) => {
      setToolStatus(`📷 Đang quét ảnh... ${progress}%`);
    });

    if (!ocrResult.success) {
      // OCR failed
      setIsStreaming(false);
      setToolStatus(null);
      setMessages(prev => [
        ...prev,
        { id: `sys-err-${Date.now()}`, role: 'assistant', content: `⚠️ Lỗi đọc ảnh: ${ocrResult.error}` }
      ]);
      return;
    }

    // OCR success! Now construct the final request.
    // Clean up the temporary user message from state first, since sendMessage adds one.
    setMessages(prev => prev.filter(m => !m.id.startsWith('user-temp-')));
    setIsStreaming(false);

    // Send the actual text + OCR to the backend
    const finalUserPrompt = text || 'Phân tích tài liệu đính kèm và trích xuất khoản nợ';
    sendMessage(finalUserPrompt, ocrResult.text, displayContent);
  };

  const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Chỉ hỗ trợ ảnh PNG, JPG, WEBP');
      return;
    }
    // Validate size
    if (file.size > MAX_IMAGE_SIZE) {
      alert('Ảnh quá lớn (tối đa 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target.result;
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Optimal for OCR speed vs quality
        
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Output compressed JPEG
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        
        setSelectedImage({
          file,
          preview: URL.createObjectURL(file),
          base64: compressedBase64,
        });
      };
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleSelectSession = (id) => {
    loadSession(id);
    setShowHistory(false);
  };

  // Determine status display text
  const statusText = isStreaming
    ? (toolStatus || '🤔 Đang suy nghĩ...')
    : 'Sẵn sàng';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 flex flex-col shadow-2xl overflow-hidden relative"
            style={{
              width: showHistory ? '520px' : '400px',
              height: '580px',
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '24px',
              transition: 'width 0.3s ease',
            }}
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>FinSight AI Advisor</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {statusText}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-full transition-colors ${showHistory ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-slate-500/10'}`}
                  style={!showHistory ? { color: 'var(--color-text-secondary)' } : {}}
                  title="Lịch sử trò chuyện"
                >
                  <History className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body: Sidebar + Messages */}
            <div className="flex-1 flex overflow-hidden">
              {/* History Sidebar */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 160, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-shrink-0 overflow-hidden"
                  >
                    <ChatHistory
                      sessions={sessions}
                      currentSessionId={sessionId}
                      onSelect={handleSelectSession}
                      onDelete={removeSession}
                      onNew={() => { newChat(); setShowHistory(false); }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.role === 'assistant' ? (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                          <Bot className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-700 border border-slate-600">
                          <User className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                            : 'shadow-sm rounded-tl-sm'
                        }`}
                        style={msg.role === 'assistant' ? {
                          background: 'var(--color-bg-elevated)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                        } : {}}
                      >
                        {msg.role === 'assistant' ? (
                          <>
                            <MessageRenderer content={msg.content} />
                            {/* Streaming cursor */}
                            {isStreaming && msg.id === messages[messages.length - 1]?.id && msg.content && (
                              <span className="inline-block w-1.5 h-4 bg-blue-400 rounded-sm ml-0.5 animate-pulse" style={{ verticalAlign: 'text-bottom' }} />
                            )}
                          </>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Tool Status / Typing Indicator */}
                {isStreaming && messages[messages.length - 1]?.role === 'assistant' && !messages[messages.length - 1]?.content && (
                  <div className="flex gap-2.5 flex-row">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                      <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <div
                      className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2"
                      style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}
                    >
                      {toolStatus ? (
                        /* Tool status with animated dots */
                        <span className="text-xs flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          {toolStatus}
                        </span>
                      ) : (
                        /* Default bouncing dots */
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
              {/* Image Preview */}
              {selectedImage && (
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                  <img
                    src={selectedImage.preview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      📷 {selectedImage.file.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {(selectedImage.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedImage(null)}
                    className="p-1 rounded-full hover:bg-slate-500/20 transition-colors"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Attach button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming}
                  className="w-10 h-10 flex items-center justify-center rounded-xl transition-colors hover:bg-slate-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  style={{ color: selectedImage ? '#3b82f6' : 'var(--color-text-secondary)' }}
                  title="Đính kèm ảnh hóa đơn / hợp đồng vay"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={selectedImage ? 'Thêm ghi chú hoặc bấm Gửi...' : 'Hỏi về nợ, DTI, đầu tư...'}
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:text-slate-500"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                  }}
                  disabled={isStreaming}
                />
                <button
                  type="submit"
                  disabled={(!inputValue.trim() && !selectedImage) || isStreaming}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>

            {/* Debt Confirmation Modal Overlay */}
            {pendingAction && (
              <DebtConfirmModal
                data={pendingAction}
                onConfirm={() => {
                  dismissAction();
                  sendMessage('Tôi đã xác nhận lưu khoản nợ thành công.');
                }}
                onDismiss={dismissAction}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 relative group"
        style={{
          background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
          color: 'white',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Glow behind button */}
        <div className="absolute inset-0 rounded-full bg-blue-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity -z-10"></div>

        {/* Notification dot */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-[var(--color-bg-primary)] rounded-full animate-pulse"></span>
        )}
      </motion.button>
    </div>
  );
}
