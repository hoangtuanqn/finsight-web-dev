import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

interface StatusActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'warning' | 'info';
  placeholder?: string;
  isLoading?: boolean;
}

export default function StatusActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = 'info',
  placeholder = 'Nhập lý do hoặc ghi chú...',
  isLoading = false,
}: StatusActionModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      button: 'bg-red-600 hover:bg-red-500 hover:shadow-red-500/30',
      glow: 'shadow-red-500/20',
    },
    warning: {
      icon: <AlertCircle className="w-6 h-6 text-amber-500" />,
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      button: 'bg-amber-600 hover:bg-amber-500 hover:shadow-amber-500/30',
      glow: 'shadow-amber-500/20',
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      button: 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30',
      glow: 'shadow-blue-500/20',
    },
  };

  const style = variantStyles[confirmVariant];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>

          <div className="p-8">
            {/* Icon Header */}
            <div
              className={`w-14 h-14 ${style.bg} ${style.border} border rounded-2xl flex items-center justify-center mb-6`}
            >
              {style.icon}
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{description}</p>

            {/* Reason Input */}
            <div className="mb-8">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Lý do thực hiện
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[100px] p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-black rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                HỦY BỎ
              </button>
              <button
                onClick={() => onConfirm(reason)}
                disabled={isLoading || !reason.trim()}
                className={`flex-1 px-6 py-3.5 ${style.button} text-white text-xs font-black rounded-xl shadow-lg ${style.glow} transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none disabled:scale-100`}
              >
                {isLoading ? 'ĐANG XỬ LÝ...' : confirmLabel.toUpperCase()}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
