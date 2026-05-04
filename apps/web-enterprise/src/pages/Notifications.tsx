import dayjs from 'dayjs';
import 'dayjs/locale/vi.js';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Info,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';

dayjs.locale('vi');

const CATEGORY_MAP: any = {
  OVERDUE: { label: 'Quá hạn', color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle },
  PENALTY: { label: 'Tiền phạt', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  PAYMENT: { label: 'Thanh toán', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  NEW_DEBT: { label: 'Nợ mới', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Info },
  ESCALATION: { label: 'Leo thang', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: AlertCircle },
  LIMIT_BREACH: { label: 'Vượt hạn mức', color: 'text-rose-500', bg: 'bg-rose-500/10', icon: AlertTriangle },
};

export default function NotificationsPage() {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, acknowledge, snooze } =
    useNotifications();

  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetchNotifications(filter === 'ALL' ? {} : { category: filter });
  }, [filter, fetchNotifications]);

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-[var(--color-text-primary)] flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500">
              <Bell size={24} />
            </div>
            Trung tâm Thông báo
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">
            Theo dõi các cập nhật quan trọng và nhắc nhở nợ doanh nghiệp
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] hover:border-emerald-500/50 transition-all cursor-pointer"
        >
          <CheckCheck size={16} className="text-emerald-500" />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 custom-scrollbar">
        <div className="p-1.5 rounded-xl bg-[var(--color-bg-secondary)] flex items-center gap-1">
          {['ALL', 'OVERDUE', 'PAYMENT', 'NEW_DEBT', 'ESCALATION'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === f
                  ? 'bg-white text-black shadow-sm'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {f === 'ALL' ? 'Tất cả' : CATEGORY_MAP[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-50">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-4" />
            <p className="text-sm font-medium">Đang tải thông báo...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center bg-[var(--color-bg-secondary)] rounded-3xl border border-dashed border-[var(--color-border)]">
            <div className="p-4 rounded-full bg-slate-500/5 text-slate-500 mb-4">
              <Bell size={40} strokeWidth={1} />
            </div>
            <p className="text-lg font-bold text-[var(--color-text-primary)]">Hộp thư trống</p>
            <p className="text-sm text-[var(--color-text-muted)]">Bạn không có thông báo nào vào lúc này.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((n) => {
              const cat = CATEGORY_MAP[n.category] || {
                label: n.category,
                color: 'text-slate-500',
                bg: 'bg-slate-500/5',
                icon: Bell,
              };
              const Icon = cat.icon;

              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                    n.isRead
                      ? 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] opacity-80'
                      : 'bg-white border-emerald-500/20 shadow-sm'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon & Status */}
                    <div className="shrink-0 relative">
                      <div className={`w-12 h-12 rounded-xl ${cat.bg} ${cat.color} flex items-center justify-center`}>
                        <Icon size={24} />
                      </div>
                      {!n.isRead && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-white" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${cat.bg} ${cat.color}`}
                          >
                            {cat.label}
                          </span>
                          {n.priority === 'URGENT' && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-red-500 text-white">
                              Khẩn cấp
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] flex items-center gap-1">
                          <Clock size={10} />
                          {dayjs(n.createdAt).fromNow()}
                        </span>
                      </div>

                      <h3
                        className={`text-sm font-bold mb-1 ${n.isRead ? 'text-[var(--color-text-primary)]' : 'text-black'}`}
                      >
                        {n.title}
                      </h3>
                      <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{n.content}</p>

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2">
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[11px] font-bold hover:bg-emerald-600 transition-colors cursor-pointer"
                          >
                            <Eye size={12} />
                            Đánh dấu đã đọc
                          </button>
                        )}

                        {n.debtRecordId && (
                          <a
                            href={`/debts/${n.debtRecordId}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-primary)] hover:border-emerald-500 transition-all"
                          >
                            <ExternalLink size={12} />
                            Chi tiết khoản nợ
                          </a>
                        )}

                        {!n.acknowledgedAt && (
                          <button
                            onClick={() => acknowledge(n.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={12} />
                            Xác nhận xử lý
                          </button>
                        )}

                        <button
                          onClick={() => snooze(n.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent border border-dashed border-[var(--color-border)] text-[11px] font-bold text-[var(--color-text-muted)] hover:text-orange-500 hover:border-orange-500/50 transition-all cursor-pointer"
                        >
                          <Clock size={12} />
                          Tạm hoãn 3 ngày
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
