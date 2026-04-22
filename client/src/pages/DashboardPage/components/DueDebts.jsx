import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, PartyPopper, ChevronRight } from 'lucide-react';
import { CardHeader } from './Card';
import { formatVND } from '../../../utils/calculations';

function nextDueDateLabel(dueDay) {
  const today = new Date();
  const due   = new Date(today.getFullYear(), today.getMonth(), dueDay);
  if (due < today) due.setMonth(due.getMonth() + 1);
  return due.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' });
}

const URGENCY = {
  danger:  { gradient: 'from-red-500 to-rose-400',    text: 'text-red-400',    glow: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
  warning: { gradient: 'from-amber-500 to-orange-400', text: 'text-amber-400',  glow: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
  normal:  { gradient: 'from-slate-500 to-slate-400',  text: 'text-slate-400',  glow: '#64748b', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.1)' },
};

function getUrgency(daysUntil) {
  if (daysUntil <= 3) return { level: 'danger',  label: daysUntil === 0 ? 'Hôm nay!' : `${daysUntil}n` };
  if (daysUntil <= 7) return { level: 'warning', label: `${daysUntil} ngày` };
  return                     { level: 'normal',  label: `${daysUntil} ngày` };
}

export default function DueDebts({ dueThisWeek = [] }) {
  return (
    <div
      className="relative rounded-3xl p-6 h-full flex flex-col overflow-hidden border"
      style={{
        background:  'var(--color-bg-card)',
        borderColor: 'rgba(245,158,11,0.15)',
        boxShadow:   '0 4px 30px rgba(245,158,11,0.06), 0 1px 0 rgba(245,158,11,0.15) inset',
      }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-amber-500/8 blur-3xl pointer-events-none" />

      <CardHeader
        icon={<Calendar size={16} />}
        title="Đáo hạn sắp tới"
        subtitle="30 ngày tới"
        action={
          <Link
            to="/debts"
            className="flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors shrink-0 group"
          >
            Xem tất cả <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        }
      />

      <div className="flex-1 flex flex-col">
        {dueThisWeek.length > 0 ? (
          <div className="space-y-2">
            {dueThisWeek.map((d, i) => {
              const { level, label } = getUrgency(d.daysUntil);
              const u = URGENCY[level];
              return (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={`/debts/${d.id}`}
                    className="flex items-center justify-between px-3.5 py-3 rounded-2xl border transition-all group cursor-pointer hover:-translate-y-0.5 duration-200"
                    style={{ background: u.bg, borderColor: u.border }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-black bg-gradient-to-r ${u.gradient} text-white shadow-md`}
                        style={{ boxShadow: `0 2px 8px ${u.glow}40` }}
                      >
                        {label}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-[var(--color-text-primary)] truncate">
                          {d.name}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{nextDueDateLabel(d.dueDay)}</p>
                      </div>
                    </div>
                    <p
                      className="text-[13px] font-black shrink-0 ml-3"
                      style={{ color: u.glow }}
                    >
                      {formatVND(d.minPayment)}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
              <PartyPopper size={28} className="text-amber-400" />
            </div>
            <p className="text-[13px] font-bold text-[var(--color-text-primary)]">Không có nợ đáo hạn</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">Trong vòng 30 ngày tới — tốt lắm!</p>
          </div>
        )}
      </div>
    </div>
  );
}
