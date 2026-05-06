import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { Bot, Maximize2, MessageSquare, Minimize2, Paperclip, Send, Sparkles, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAgenticChat } from '../../hooks/useAgenticChat';
import { runOCR } from '../../utils/ocr';
import ChatHistory from './ChatHistory';
import DebtConfirmModal from './DebtConfirmModal';
import DebtSummaryCard from './DebtSummaryCard';
import MessageRenderer from './MessageRenderer';
import UiSignalDispatcher from './UiSignalDispatcher';

export default function AIChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState(null); // { file, preview, base64 }
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    messages,
    isStreaming,
    sessionId,
    sessions,
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
  } = useAgenticChat();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      const container = messagesEndRef.current.parentElement;
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: isStreaming ? 'auto' : 'smooth',
        });
      }
    }
  }, [messages, isStreaming, toolStatus]);

  // Load sessions when history panel opens
  useEffect(() => {
    if (showHistory || isMaximized) loadSessions();
  }, [showHistory, isMaximized, loadSessions]);

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
    setMessages((prev) => [...prev, { id: `user-temp-${Date.now()}`, role: 'user', content: displayContent }]);

    const ocrResult = await runOCR(imageInfo.base64, (progress) => {
      setToolStatus(`📷 Đang quét ảnh... ${progress}%`);
    });

    if (!ocrResult.success) {
      // OCR failed
      setIsStreaming(false);
      setToolStatus(null);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Lỗi đọc ảnh: ${ocrResult.error}`,
        },
      ]);
      return;
    }

    // OCR success! Now construct the final request.
    // Clean up the temporary user message from state first, since sendMessage adds one.
    setMessages((prev) => prev.filter((m) => !m.id.startsWith('user-temp-')));
    setIsStreaming(false);

    // Send the actual text + OCR to the backend
    const finalUserPrompt = text || 'Phân tích tài liệu đính kèm và trích xuất khoản nợ';
    sendMessage(finalUserPrompt, ocrResult.text, displayContent);
  };

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

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
      alert('Ảnh quá lớn (tối đa 10MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.src = (ev.target?.result as string) || '';
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
    if (!isMaximized) setShowHistory(false);
  };

  // Determine status display text
  const statusText = isStreaming ? toolStatus || '🤔 Đang suy nghĩ...' : 'Sẵn sàng';

  // Modal dimensions & positioning logic
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const modalVariants: Variants = {
    closed: {
      opacity: 0,
      scale: 0.8,
      x: 0,
      y: 120,
      width: showHistory ? (isMobile ? '100vw' : '520px') : isMobile ? '95vw' : '420px',
      height: isMobile ? '80vh' : 'min(640px, calc(100vh - 160px))',
      right: isMobile ? '2.5vw' : '24px',
      bottom: isMobile ? '100px' : '110px',
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 400,
        mass: 0.8,
      },
    },
    minimized: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      width: showHistory ? (isMobile ? '100vw' : '520px') : isMobile ? '95vw' : '420px',
      height: isMobile ? '80vh' : 'min(600px, calc(100vh - 160px))',
      right: isMobile ? '0' : '24px',
      bottom: isMobile ? '100px' : '110px',
      left: 'auto',
      top: 'auto',
      borderRadius: '24px',
      transition: { type: 'spring', damping: 25, stiffness: 200 },
    },
    maximized: {
      opacity: 1,
      scale: 1,
      x: '-50%',
      y: '-50%',
      left: '50%',
      top: '50%',
      right: 'auto',
      bottom: 'auto',
      width: 'min(1280px, 95vw)',
      height: '88vh',
      borderRadius: '32px',
      transition: { type: 'spring', damping: 30, stiffness: 200 },
    },
  };

  return (
    <>
      {/* Background Overlay when Maximized */}
      <AnimatePresence>
        {isOpen && isMaximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60]"
            onClick={() => setIsMaximized(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Chat Interface */}
      <div className="fixed inset-0 pointer-events-none z-[70]">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={modalVariants}
              initial="closed"
              animate={isMaximized ? 'maximized' : 'minimized'}
              exit="closed"
              className="fixed flex flex-col shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto border border-white/10"
              style={{
                background: 'rgba(10, 15, 28, 0.92)',
                backdropFilter: 'blur(32px) saturate(200%)',
                transformOrigin: 'bottom right',
              }}
            >
              {/* Premium Glow Effect */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-blue-600/15 blur-[120px] pointer-events-none" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-indigo-600/15 blur-[120px] pointer-events-none" />

              {/* Header - Fixed Height */}
              <div className="h-16 px-6 flex items-center justify-between border-b border-white/5 bg-slate-900/50 backdrop-blur-xl flex-none">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 shadow-lg shadow-blue-600/20">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-[15px] text-white leading-none">FinSight AI Advisor</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                      {statusText}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsMaximized(!isMaximized)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:bg-rose-500/20 hover:text-rose-400 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Body Container */}
              <div className="flex-1 flex min-h-0 overflow-hidden relative">
                {/* History Sidebar */}
                <AnimatePresence>
                  {(showHistory || isMaximized) && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: isMaximized ? 300 : 220, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="flex-shrink-0 border-r border-white/5 bg-black/30 backdrop-blur-sm"
                    >
                      <ChatHistory
                        sessions={sessions}
                        currentSessionId={sessionId}
                        onSelect={handleSelectSession}
                        onDelete={removeSession}
                        onNew={() => {
                          newChat();
                          if (!isMaximized) setShowHistory(false);
                        }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Messages List Area */}
                <div
                  className={`flex-1 flex flex-col min-w-0 overflow-hidden ${
                    isMaximized ? 'max-w-5xl mx-auto w-full' : ''
                  }`}
                >
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 scroll-smooth scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    {messages.map((msg, idx) => (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={msg.id}
                        className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 mt-0.5">
                          {msg.role === 'assistant' ? (
                            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                              <Bot className="w-5 h-5 text-blue-400" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-slate-800/50 border border-white/10 shadow-lg text-slate-400">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        {/* Message Bubble Container */}
                        <div
                          className={`flex flex-col min-w-0 max-w-[85%] ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed relative ${
                              msg.role === 'user'
                                ? 'rounded-tr-none bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20'
                                : 'rounded-tl-none bg-white/[0.04] border border-white/10 text-slate-100 shadow-sm'
                            }`}
                          >
                            {msg.role === 'assistant' ? (
                              <div className="prose prose-invert prose-sm max-w-none break-words">
                                <MessageRenderer content={msg.content} />
                                {isStreaming && msg.id === messages[messages.length - 1]?.id && msg.content && (
                                  <span className="inline-block w-2 h-4.5 bg-blue-500 rounded-full ml-1.5 animate-pulse align-middle" />
                                )}
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap break-words font-medium">{msg.content}</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Suggested Questions */}
                    {messages.length === 1 && !isStreaming && (
                      <div className="flex flex-col gap-4 mt-2 px-1">
                        <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2 uppercase tracking-[0.2em]">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Khám phá tiềm năng
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                          {['DTI là gì?', 'Tư vấn trả nợ', 'Phân tích tài chính', 'Kiểm tra nợ xấu'].map((q) => (
                            <motion.button
                              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                              whileTap={{ scale: 0.98 }}
                              key={q}
                              onClick={() => sendMessage(q)}
                              className="px-5 py-2.5 rounded-2xl text-[13px] font-semibold text-slate-300 bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all cursor-pointer shadow-sm"
                            >
                              {q}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Typed UI Signal Dispatcher — handles SHOW_POPUP and REDIRECT */}
                    {pendingUiSignal?.type !== 'SHOW_INTERACTIVE_CARD' && (
                      <UiSignalDispatcher
                        signal={pendingUiSignal}
                        onDismiss={dismissUiSignal}
                        isModalOpen={!!pendingAction}
                        onFeedback={(status, reason) => {
                          const action = pendingUiSignal?.action || 'DEBT_CONFIRMATION';
                          if (status === 'confirmed') {
                            if (action === 'REPAYMENT_CONFIRMATION') {
                              sendMessage(
                                'Tôi đã cập nhật kế hoạch phân bổ mới, mời bạn xem chi tiết trên màn hình.',
                                null,
                                null,
                                true,
                              );
                            } else {
                              sendMessage('Tôi đã xác nhận lưu khoản nợ thành công.', null, null, true);
                            }
                          } else if (status === 'cancelled') {
                            sendMessage('Tôi đã hủy bỏ thao tác.', null, null, true);
                          } else if (status === 'failed') {
                            const actionName = action === 'REPAYMENT_CONFIRMATION' ? 'kế hoạch' : 'khoản nợ';
                            const msg = reason
                              ? `Lưu ${actionName} thất bại: ${reason}`
                              : `Lưu ${actionName} thất bại, vui lòng thử lại.`;
                            sendMessage(msg, null, null, true);
                          }
                        }}
                      />
                    )}
                    {/* Streaming Indicator */}
                    {isStreaming &&
                      messages[messages.length - 1]?.role === 'assistant' &&
                      !messages[messages.length - 1]?.content && (
                        <div className="flex gap-4 flex-row items-start">
                          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center bg-blue-500/10 border border-blue-500/20">
                            <Bot className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="px-6 py-4 rounded-2xl rounded-tl-none bg-white/[0.04] border border-white/10 flex items-center gap-4 shadow-xl">
                            {toolStatus ? (
                              <div className="flex items-center gap-3">
                                <div className="relative w-2 h-2">
                                  <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-75"></span>
                                  <span className="relative block w-2 h-2 rounded-full bg-amber-500"></span>
                                </div>
                                <span className="text-[13px] font-bold text-slate-300 tracking-wide">{toolStatus}</span>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                {[0, 150, 300].map((delay) => (
                                  <motion.div
                                    key={delay}
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: delay / 1000 }}
                                    className="w-2 h-2 rounded-full bg-blue-500/60"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Interactive Card */}
                    {pendingUiSignal?.type === 'SHOW_INTERACTIVE_CARD' &&
                      pendingUiSignal.action === 'DEBT_SUMMARY_ACTIONS' && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mx-auto w-full max-w-2xl mt-2"
                        >
                          <DebtSummaryCard
                            buttons={(pendingUiSignal as any).buttons ?? []}
                            onNavigated={dismissUiSignal}
                          />
                        </motion.div>
                      )}

                    <div ref={messagesEndRef} className="h-4" />
                  </div>
                </div>
              </div>

              {/* Input Control Area */}
              <div className="px-6 py-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-2xl shrink-0">
                <div className={`mx-auto ${isMaximized ? 'max-w-4xl' : 'w-full'} flex flex-col gap-4`}>
                  {/* Image Preview Container */}
                  <AnimatePresence>
                    {selectedImage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.05] border border-white/10 ring-1 ring-blue-500/10 shadow-lg"
                      >
                        <img
                          src={selectedImage.preview}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover ring-2 ring-blue-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">📷 {selectedImage.file.name}</p>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                            {(selectedImage.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSend} className="relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <div className="flex items-center gap-3 p-1.5 rounded-[22px] bg-white/[0.04] border border-white/10 transition-all duration-300 focus-within:border-blue-500/50 focus-within:bg-white/[0.06] focus-within:ring-4 focus-within:ring-blue-500/5 group shadow-inner">
                      {/* Attach Icon */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isStreaming}
                        className={`w-11 h-11 flex items-center justify-center rounded-[18px] transition-all ${
                          selectedImage
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        } disabled:opacity-30 shrink-0`}
                        title="Đính kèm"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={selectedImage ? 'Thêm mô tả về ảnh...' : 'Hỏi bất kỳ điều gì về tài chính...'}
                        maxLength={2000}
                        className="flex-1 px-2 py-3 text-[15px] bg-transparent border-none outline-none text-white placeholder:text-slate-500/70"
                        disabled={isStreaming}
                      />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={(!inputValue.trim() && !selectedImage) || isStreaming}
                        className="w-11 h-11 flex items-center justify-center rounded-[18px] bg-gradient-to-tr from-blue-500 to-indigo-600 text-white transition-all shadow-lg shadow-blue-900/40 hover:shadow-blue-500/40 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 shrink-0"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Trigger Button Container */}
        <div className="fixed bottom-8 right-8 z-[80] pointer-events-auto">
          <motion.button
            whileHover={{ scale: 1.08, rotate: 2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(!isOpen)}
            className="w-18 h-18 rounded-[24px] flex items-center justify-center shadow-[0_20px_50px_rgba(59,130,246,0.4)] relative group overflow-hidden border border-white/10"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
              color: 'white',
            }}
          >
            {/* Animated Gloss */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" />

            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                >
                  <X className="w-7 h-7" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  className="flex items-center justify-center"
                >
                  <MessageSquare className="w-7 h-7" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing Aura */}
            <div className="absolute inset-0 rounded-2xl bg-blue-400 blur-2xl opacity-0 group-hover:opacity-40 transition-all duration-500 -z-10"></div>

            {!isOpen && (
              <span className="absolute top-3 right-3 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border-2 border-white/20"></span>
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* External Components (Modals/Dispatchers) */}
      <div className="fixed inset-0 pointer-events-none z-[100]">
        <div className="pointer-events-auto">
          {pendingAction && !pendingUiSignal && (
            <DebtConfirmModal
              data={pendingAction}
              onConfirm={() => {
                dismissAction();
                sendMessage('Tôi đã xác nhận lưu khoản nợ thành công.', null, null, true);
              }}
              onDismiss={dismissAction}
            />
          )}

          {pendingUiSignal?.type !== 'SHOW_INTERACTIVE_CARD' && (
            <UiSignalDispatcher
              signal={pendingUiSignal}
              onDismiss={dismissUiSignal}
              isModalOpen={!!pendingAction}
              onConfirmed={(sig) => {
                dismissUiSignal();
                if (sig.action === 'DEBT_CONFIRMATION') {
                  sendMessage('Tôi đã xác nhận lưu khoản nợ thành công.', null, null, true);
                }
              }}
              onFeedback={(status, reason) => {
                const action = pendingUiSignal?.action || 'DEBT_CONFIRMATION';
                if (status === 'confirmed') {
                  if (action === 'REPAYMENT_CONFIRMATION') {
                    sendMessage(
                      'Tôi đã cập nhật kế hoạch phân bổ mới, mời bạn xem chi tiết trên màn hình.',
                      null,
                      null,
                      true,
                    );
                  } else {
                    sendMessage('Tôi đã xác nhận lưu khoản nợ thành công.', null, null, true);
                  }
                } else if (status === 'cancelled') {
                  sendMessage('Tôi đã hủy bỏ thao tác.', null, null, true);
                } else if (status === 'failed') {
                  const actionName = action === 'REPAYMENT_CONFIRMATION' ? 'kế hoạch' : 'khoản nợ';
                  const msg = reason
                    ? `Lưu ${actionName} thất bại: ${reason}`
                    : `Lưu ${actionName} thất bại, vui lòng thử lại.`;
                  sendMessage(msg, null, null, true);
                }
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
