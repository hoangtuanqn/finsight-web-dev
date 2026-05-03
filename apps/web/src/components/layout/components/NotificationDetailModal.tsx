import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Flame, Info, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface NotificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: any;
  onMarkRead: (id: string) => void;
}

const severityConfig: any = {
  INFO: {
    icon: Info,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  WARNING: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  DANGER: {
    icon: Flame,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
};

export default function NotificationDetailModal({
  isOpen,
  onClose,
  notification,
  onMarkRead,
}: NotificationDetailModalProps) {
  if (!notification) return null;

  const config = severityConfig[notification.severity] || severityConfig.INFO;
  const Icon = config.icon;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-2xl dark:bg-[#0f172a]"
          >
            {/* Header Area with Icon Background */}
            <div className={`relative h-32 w-full ${config.bg} flex items-center justify-center`}>
              <div className="absolute top-4 right-4">
                <button
                  onClick={onClose}
                  className="rounded-full bg-black/20 p-2 text-white/60 hover:bg-black/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className={`rounded-2xl p-4 bg-black/20 backdrop-blur-sm border ${config.border}`}>
                <Icon size={40} className={config.color} />
              </div>
            </div>

            {/* Content Body */}
            <div className="p-8">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${config.border} ${config.color}`}
                  >
                    {notification.type || 'HỆ THỐNG'}
                  </span>
                  <span className="text-white/40 text-[10px] font-medium">
                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white leading-tight mb-4">{notification.title}</h2>
                <div className="space-y-4">
                  <p className="text-white/70 text-base leading-relaxed whitespace-pre-wrap">{notification.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                {!notification.isRead && (
                  <button
                    onClick={() => {
                      onMarkRead(notification.id);
                      onClose();
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                  >
                    <CheckCircle size={18} />
                    Đánh dấu đã đọc
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`flex-1 px-6 py-3 rounded-xl font-bold border transition-all ${
                    notification.isRead
                      ? 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Đóng
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
