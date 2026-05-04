import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Clock, CreditCard, Landmark, Plus, ShieldCheck, X } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

interface DebtTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DebtTypeSelectionModal({ isOpen, onClose }: DebtTypeSelectionModalProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<'INSTALLMENT' | 'CREDIT_CARD' | null>(null);

  const handleClose = () => {
    setStep(1);
    setSelectedType(null);
    onClose();
  };

  const handleSelectType = (type: 'INSTALLMENT' | 'CREDIT_CARD') => {
    if (type === 'CREDIT_CARD') {
      navigate(`/debts/add?type=CREDIT_CARD`);
      handleClose();
    } else {
      setSelectedType(type);
      setStep(2);
    }
  };

  const handleSelectStatus = (status: 'NEW' | 'EXISTING') => {
    navigate(`/debts/add?type=${selectedType}&status=${status}`);
    handleClose();
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md"
            style={{ width: '100vw', height: '100vh' }}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="relative p-8 sm:p-10 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <button
                  onClick={handleClose}
                  className="absolute top-8 right-8 p-2 rounded-full hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  <X size={20} />
                </button>

                {step === 2 && (
                  <button
                    onClick={() => setStep(1)}
                    className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                  >
                    <ArrowLeft size={14} /> Quay lại
                  </button>
                )}

                <div className="flex flex-col items-center text-center mt-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                    <ShieldCheck size={14} /> Bước {step}/2: {step === 1 ? 'Phân loại nợ' : 'Trạng thái vay'}
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-black text-[var(--color-text-primary)] tracking-tighter">
                    {step === 1 ? 'Thêm khoản nợ mới' : 'Bạn bắt đầu từ khi nào?'}
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mt-3 text-sm sm:text-base max-w-md">
                    {step === 1
                      ? 'Chọn đúng loại nợ để AI giúp bạn tối ưu lãi suất và kế hoạch trả dở chính xác nhất.'
                      : 'Xác định trạng thái giúp hệ thống hiển thị các trường nhập liệu phù hợp cho bạn.'}
                  </p>
                </div>
              </div>

              {/* Options */}
              <div className="p-8 sm:p-10">
                {step === 1 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Option 1: Installment */}
                    <button
                      onClick={() => handleSelectType('INSTALLMENT')}
                      className="group relative flex flex-col items-start p-7 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-blue-500/5 hover:border-blue-500/30 transition-all text-left overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />

                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Landmark size={32} />
                      </div>
                      <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-3 group-hover:text-blue-400 transition-colors">
                        Vay Trả Góp
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] mb-8 flex-1 leading-relaxed">
                        Mua điện thoại, xe, vay tiền mặt FE Credit, Home Credit, trả góp SPayLater... Có kỳ hạn cố định.
                      </p>

                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 mt-auto">
                        Tiếp theo <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    {/* Option 2: Credit Card */}
                    <button
                      onClick={() => handleSelectType('CREDIT_CARD')}
                      className="group relative flex flex-col items-start p-7 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-left overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />

                      <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <CreditCard size={32} />
                      </div>
                      <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-3 group-hover:text-purple-400 transition-colors">
                        Thẻ Tín Dụng
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] mb-8 flex-1 leading-relaxed">
                        Thẻ Visa/Mastercard, hạn mức chi trước trả sau, nợ xoay vòng, lãi suất tính theo ngày.
                      </p>

                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 mt-auto">
                        Tạo khoản vay <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Option: NEW */}
                    <button
                      onClick={() => handleSelectStatus('NEW')}
                      className="group relative flex flex-col items-start p-7 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all text-left overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors" />

                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                      </div>
                      <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-3 group-hover:text-emerald-400 transition-colors">
                        Vừa mới vay
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] mb-8 flex-1 leading-relaxed">
                        Bạn vừa giải ngân xong hoặc đang chuẩn bị ký hợp đồng. Hệ thống sẽ tính lịch trả nợ từ đầu.
                      </p>

                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-400 mt-auto">
                        Tạo khoản vay{' '}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>

                    {/* Option: EXISTING */}
                    <button
                      onClick={() => handleSelectStatus('EXISTING')}
                      className="group relative flex flex-col items-start p-7 rounded-[2rem] border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-amber-500/5 hover:border-amber-500/30 transition-all text-left overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors" />

                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Clock size={32} />
                      </div>
                      <h3 className="text-xl font-black text-[var(--color-text-primary)] mb-3 group-hover:text-amber-400 transition-colors">
                        Đang trả dở
                      </h3>
                      <p className="text-sm text-[var(--color-text-muted)] mb-8 flex-1 leading-relaxed">
                        Khoản vay đã trả được một số kỳ. Bạn cần nhập thêm số tiền gốc còn lại và số kỳ đã đóng.
                      </p>

                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-400 mt-auto">
                        Tiếp tục quản lý{' '}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
