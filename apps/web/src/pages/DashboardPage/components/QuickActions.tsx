import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, ClipboardList, Target, TrendingUp, Search, User } from 'lucide-react';

const QUICK_ACTIONS = [
  { to: '/debts/add',          icon: Plus,          label: 'Thêm nợ',        desc: 'Nhập nợ mới',           gradient: 'from-blue-500 to-cyan-400',      glow: '#3b82f6' },
  { to: '/debts/repayment',    icon: ClipboardList, label: 'Kế hoạch',       desc: 'Avalanche/Snowball',    gradient: 'from-emerald-500 to-teal-400',   glow: '#10b981' },
  { to: '/risk-assessment',    icon: Target,        label: 'Rủi ro',         desc: '10 câu hỏi nhanh',       gradient: 'from-purple-500 to-violet-400',  glow: '#8b5cf6' },
  { to: '/investment',         icon: TrendingUp,    label: 'Đầu tư',         desc: 'Tư vấn AI',             gradient: 'from-cyan-500 to-sky-400',       glow: '#06b6d4' },
  { to: '/debts/ear-analysis', icon: Search,        label: 'EAR',            desc: 'Chi phí ẩn',            gradient: 'from-amber-500 to-orange-400',   glow: '#f59e0b' },
  { to: '/debts/dti',          icon: TrendingUp,    label: 'DTI',            desc: 'Nợ/Thu nhập',           gradient: 'from-rose-500 to-pink-400',      glow: '#f43f5e' },
  { to: '/profile',            icon: User,          label: 'Hồ sơ',          desc: 'Cập nhật thu nhập',     gradient: 'from-slate-500 to-slate-400',    glow: '#64748b' },
];

const EXPORT_ACTION = { icon: FileText, label: 'Báo cáo', desc: 'Xuất PDF/Excel', gradient: 'from-blue-600 to-cyan-500', glow: '#06b6d4' };

import { FileText } from 'lucide-react';

export default function QuickActions({ onExportClick }: { onExportClick: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <span className="text-[11px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.25em]">
          Thao tác nhanh
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
        {QUICK_ACTIONS.map((action, i) => (
          <motion.div
            key={action.to}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <Link
              to={action.to}
              className="relative flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border text-center group overflow-hidden cursor-pointer"
              style={{
                background:  'var(--color-bg-card)',
                borderColor: `${action.glow}25`,
                boxShadow:   `0 2px 12px ${action.glow}10`,
              }}
            >
              {/* Hover glow fill */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${action.glow}15, transparent 70%)` }}
              />

              {/* Icon */}
              <div
                className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shrink-0 shadow-lg`}
                style={{ boxShadow: `0 4px 16px ${action.glow}40` }}
              >
                <action.icon size={18} className="text-white" />
              </div>

              {/* Text */}
              <div className="relative">
                <p className="text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">
                  {action.label}
                </p>
                <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5 hidden sm:block leading-tight">
                  {action.desc}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}

        {/* Special Export Action */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 13 * 0.05 }}
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          <button
            onClick={onExportClick}
            className="w-full relative flex flex-col items-center gap-2.5 p-3.5 rounded-2xl border text-center group overflow-hidden cursor-pointer"
            style={{
              background:  'var(--color-bg-card)',
              borderColor: `${EXPORT_ACTION.glow}25`,
              boxShadow:   `0 2px 12px ${EXPORT_ACTION.glow}10`,
            }}
          >
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: `radial-gradient(circle at 50% 0%, ${EXPORT_ACTION.glow}15, transparent 70%)` }}
            />
            <div
              className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${EXPORT_ACTION.gradient} flex items-center justify-center shrink-0 shadow-lg`}
              style={{ boxShadow: `0 4px 16px ${EXPORT_ACTION.glow}40` }}
            >
              <EXPORT_ACTION.icon size={18} className="text-white" />
            </div>
            <div className="relative">
              <p className="text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">
                {EXPORT_ACTION.label}
              </p>
              <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5 hidden sm:block leading-tight">
                {EXPORT_ACTION.desc}
              </p>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
