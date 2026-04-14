import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, ScanLine, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function AIChatbotModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'Xin chào! Tôi là trợ lý AI của FinSight. Bạn muốn thêm khoản nợ thủ công hay chụp ảnh hợp đồng để tôi trích xuất tự động?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const newMsg = { id: Date.now(), sender: 'user', text: inputValue };
    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          id: Date.now() + 1, 
          sender: 'ai', 
          text: 'Chức năng này đang được phát triển ở phiên bản demo. Bạn có thể thử tính năng Xử lý Ảnh (OCR) bằng nút Scan bên dưới nhé!' 
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleMockOCRScan = () => {
    // Add user message "Upload image"
    setMessages(prev => [
      ...prev, 
      { id: Date.now(), sender: 'user', text: '[Đã tải ảnh hóa đơn vay.jpg lên]', isImage: true }
    ]);
    setIsTyping(true);

    // Mock OCR processing
    setTimeout(() => {
      setIsTyping(false);
      
      const ocrResultMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        isOCR: true,
        text: 'Tôi đã phân tích hình ảnh hợp đồng thành công. Dưới đây là thông tin trích xuất:',
        extractedData: {
          name: 'Vay tiêu dùng FE Credit',
          amount: '15,000,000',
          apr: '35%',
          term: '12 tháng',
          nextDueDate: '15/05/2026'
        }
      };
      
      setMessages(prev => [...prev, ocrResultMsg]);
    }, 2500);
  };

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
            className="mb-4 w-[380px] h-[550px] flex flex-col shadow-2xl overflow-hidden"
            style={{ 
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: '24px'
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
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Đang hoạt động</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {msg.sender === 'ai' ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-700 border border-slate-600">
                        <User className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-[75%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed relative
                        ${msg.sender === 'user' 
                          ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                          : 'shadow-sm rounded-tl-sm'
                        }`}
                      style={msg.sender === 'ai' ? { background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' } : {}}
                    >
                      {msg.isImage ? (
                        <div className="flex items-center gap-2 italic opacity-90">
                          <ImageIcon className="w-4 h-4" /> {msg.text}
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>

                    {/* OCR Structured Result Card */}
                    {msg.isOCR && msg.extractedData && (
                      <div 
                        className="mt-2 p-3 rounded-xl border w-full animate-fade-in-up"
                        style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                      >
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">Dữ liệu bóc tách</span>
                        </div>
                        <ul className="space-y-1.5 text-xs">
                          <li className="flex justify-between" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="opacity-70">Tên quỹ:</span> <span className="font-medium">{msg.extractedData.name}</span>
                          </li>
                          <li className="flex justify-between" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="opacity-70">Số nợ:</span> <span className="font-bold text-rose-400">{msg.extractedData.amount} đ</span>
                          </li>
                          <li className="flex justify-between" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="opacity-70">Lãi suất APR:</span> <span className="font-medium">{msg.extractedData.apr}</span>
                          </li>
                          <li className="flex justify-between" style={{ color: 'var(--color-text-primary)' }}>
                            <span className="opacity-70">Ngày đáo hạn:</span> <span className="font-medium">{msg.extractedData.nextDueDate}</span>
                          </li>
                        </ul>
                        <button className="w-full mt-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-sm">
                          Xác nhận lưu khoản nợ
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 flex-row">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-indigo-500/10 border border-indigo-500/20">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t flex flex-col gap-2" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleMockOCRScan}
                  disabled={isTyping}
                  className="p-2.5 rounded-xl hover:bg-slate-500/10 transition-colors text-indigo-500 flex-shrink-0 relative group"
                  title="Quét hợp đồng / hóa đơn (OCR)"
                >
                  <ScanLine className="w-5 h-5" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    Quét OCR Hóa đơn
                  </span>
                </button>

                <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Nhập yêu cầu hoặc câu hỏi..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:text-slate-500"
                    style={{ 
                      background: 'var(--color-bg-secondary)', 
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)'
                    }}
                    disabled={isTyping}
                  />
                  <button 
                    type="submit"
                    disabled={!inputValue.trim() || isTyping}
                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            </div>
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
          color: 'white'
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageSquare className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Glow behind button */}
        <div className="absolute inset-0 rounded-full bg-blue-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity -z-10"></div>
        
        {/* Notification dot (optional visual) */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 border-2 border-[var(--color-bg-primary)] rounded-full animate-pulse"></span>
        )}
      </motion.button>
    </div>
  );
}
