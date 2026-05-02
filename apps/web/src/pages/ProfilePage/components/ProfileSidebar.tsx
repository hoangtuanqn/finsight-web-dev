import { motion } from 'framer-motion';
import {
  BarChart2,
  Calendar,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPercent, formatVND } from '../../../utils/calculations';
import { GOAL_LABEL, HORIZON_LABEL, RISK_META } from '../constants';

interface ProfileSidebarProps {
  user: any;
  hasCompletedQuiz: boolean;
}

export function ProfileSidebar({ user, hasCompletedQuiz }: ProfileSidebarProps) {
  const riskLevel = user?.investorProfile?.riskLevel || 'MEDIUM';
  const riskMeta = RISK_META[riskLevel as keyof typeof RISK_META];
  const RiskIcon = riskMeta.Icon;
  const riskScore = user?.investorProfile?.riskScore;
  const lastUpdated = user?.investorProfile?.lastUpdated
    ? new Date(user.investorProfile.lastUpdated).toLocaleDateString('vi-VN')
    : null;

  const initials = (user?.fullName || 'U')
    .split(' ')
    .map((w: string) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const summaryRows = [
    {
      icon: DollarSign,
      label: 'Thu nhập / tháng',
      value: formatVND(user?.monthlyIncome || 0),
      color: '#10b981',
    },
    {
      icon: TrendingDown,
      label: 'Trả nợ thêm / tháng',
      value: formatVND(user?.extraBudget || 0),
      color: '#f59e0b',
    },
    {
      icon: Wallet,
      label: 'Tổng vốn',
      value: formatVND(user?.investorProfile?.capital || 0),
      color: '#3b82f6',
    },
    {
      icon: TrendingUp,
      label: 'Lãi ngân hàng',
      value: formatPercent(user?.investorProfile?.savingsRate ?? 6.0),
      color: '#06b6d4',
    },
    {
      icon: TrendingDown,
      label: 'Mức lạm phát',
      value: formatPercent(user?.investorProfile?.inflationRate ?? 3.5),
      color: '#ef4444',
    },
  ];

  const strategyRows = [
    {
      icon: Target,
      label: 'Mục tiêu',
      value: GOAL_LABEL[user?.investorProfile?.goal || 'GROWTH'],
      color: '#8b5cf6',
    },
    {
      icon: Clock,
      label: 'Thời hạn',
      value: HORIZON_LABEL[user?.investorProfile?.horizon || 'MEDIUM'],
      color: '#06b6d4',
    },
    {
      icon: RiskIcon,
      label: 'Khẩu vị',
      value: riskMeta.label,
      color: riskMeta.color,
    },
    ...(hasCompletedQuiz
      ? [
          {
            icon: BarChart2,
            label: 'Điểm quiz',
            value: `${riskScore}/100`,
            color: riskMeta.color,
          },
        ]
      : []),
    ...(lastUpdated
      ? [
          {
            icon: Calendar,
            label: 'Cập nhật',
            value: lastUpdated,
            color: '#64748b',
          },
        ]
      : []),
  ];

  const quickLinks = [
    {
      to: '/risk-assessment',
      icon: Zap,
      label: hasCompletedQuiz ? 'Cập nhật rủi ro' : 'Đánh giá ngay',
      color: '#f59e0b',
    },
    {
      to: '/investment',
      icon: TrendingUp,
      label: 'Phân bổ AI',
      color: '#3b82f6',
    },
    {
      to: '/debts',
      icon: CreditCard,
      label: 'Quản lý nợ',
      color: '#ef4444',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-3xl border p-8 text-center overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-80" />
        <div
          className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-3xl font-black mx-auto mb-5 text-white ring-8 ring-[var(--color-bg-secondary)]"
          style={{
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            boxShadow: '0 12px 30px rgba(59,130,246,0.25)',
          }}
        >
          {initials}
        </div>
        <p className="font-black text-[var(--color-text-primary)] text-xl tracking-tight">
          {user?.fullName || 'Người dùng ẩn danh'}
        </p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1 font-medium">{user?.email || '-'}</p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: `${riskMeta.color}15`,
              color: riskMeta.color,
              border: `1px solid ${riskMeta.color}30`,
            }}
          >
            <RiskIcon size={14} /> {riskMeta.label}
          </div>
          {user?.isTwoFactorEnabled && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <ShieldCheck size={14} /> 2FA
            </div>
          )}
        </div>
      </motion.div>

      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border p-6 hover:border-[var(--color-text-muted)] transition-colors"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
          <DollarSign size={14} /> Tóm tắt tài sản
        </p>
        <div className="space-y-3">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 group">
              <span className="text-sm text-[var(--color-text-secondary)] font-medium flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${row.color}15`, color: row.color }}
                >
                  <row.icon size={14} />
                </div>
                {row.label}
              </span>
              <span className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">{row.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Strategy Section */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border p-6 hover:border-[var(--color-text-muted)] transition-colors"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-4 flex items-center gap-2">
          <Target size={14} /> Chiến lược
        </p>
        <div className="space-y-3">
          {strategyRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-1.5 group">
              <span className="text-sm text-[var(--color-text-secondary)] font-medium flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${row.color}15`, color: row.color }}
                >
                  <row.icon size={14} />
                </div>
                {row.label}
              </span>
              <span className="text-sm font-bold tracking-tight" style={{ color: row.color }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl border p-6"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-4">
          Thao tác nhanh
        </p>
        <div className="grid grid-cols-1 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:text-white hover:border-transparent transition-all group"
              style={{
                background: 'var(--color-bg-secondary)',
                boxShadow: '0 2px 10px rgba(0,0,0,0)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${link.color}15`, color: link.color }}
              >
                <link.icon size={14} />
              </div>
              <span className="flex-1">{link.label}</span>
              <ChevronRight
                size={16}
                className="text-[var(--color-text-muted)] group-hover:translate-x-1 group-hover:text-blue-500 transition-all"
              />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
