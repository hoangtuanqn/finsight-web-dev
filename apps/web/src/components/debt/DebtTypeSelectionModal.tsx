import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CreditCard, Landmark, ShieldCheck, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

interface DebtTypeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DebtTypeSelectionModal({ isOpen, onClose }: DebtTypeSelectionModalProps) {
  const navigate = useNavigate();

  const handleSelect = (type: 'INSTALLMENT' | 'CREDIT_CARD') => {
    onClose();
    navigate(`/debts/add?type=${type}`);
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md"
            style={{ width: '100vw', height: '100vh' }}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-[2rem] shadow-2xl shadow-black/50 overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="relative p-6 sm:p-8 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 text-[var(--color-text-muted)] hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest mb-4">
                  <ShieldCheck size={14} /> Phân loại nợ
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary)]">
                  Bạn muốn thêm loại nợ nào?
                </h2>
                <p className="text-[var(--color-text-secondary)] mt-2 text-sm sm:text-base">
                  Việc phân loại đúng giúp AI tính toán lãi suất (EAR) và xây dựng lộ trình trả nợ chính xác 100%.
                </p>
              </div>

              {/* Options */}
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Option 1: Installment */}
                <button
                  onClick={() => handleSelect('INSTALLMENT')}
                  className="group relative flex flex-col items-start p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-blue-500/5 hover:border-blue-500/30 transition-all text-left overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />

                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Landmark size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-blue-400 transition-colors">
                    Vay Trả Góp
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mb-6 flex-1">
                    Mua điện thoại, mua xe, vay tiền mặt FE Credit, Home Credit, trả góp SPayLater... Có thời hạn rõ
                    ràng.
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-blue-400 mt-auto">
                    Chọn loại này <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Option 2: Credit Card */}
                <button
                  onClick={() => handleSelect('CREDIT_CARD')}
                  className="group relative flex flex-col items-start p-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-purple-500/5 hover:border-purple-500/30 transition-all text-left overflow-hidden cursor-pointer"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors" />

                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <CreditCard size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2 group-hover:text-purple-400 transition-colors">
                    Thẻ Tín Dụng
                  </h3>
                  <p className="text-sm text-[var(--color-text-muted)] mb-6 flex-1">
                    Thẻ Visa/Mastercard ngân hàng, hạn mức chi tiêu trước trả sau, nợ xoay vòng không kỳ hạn.
                  </p>

                  <div className="flex items-center gap-2 text-sm font-bold text-purple-400 mt-auto">
                    Chọn loại này <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
