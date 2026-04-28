import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  DollarSign,
  TrendingDown,
  Wallet,
  TrendingUp,
  Target,
  Clock,
  BarChart2,
  Calendar,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { formatPercent, formatVND } from "../../../utils/calculations";
import { RISK_META, GOAL_LABEL, HORIZON_LABEL } from "../constants";

interface ProfileSidebarProps {
  user: any;
  hasCompletedQuiz: boolean;
}

export function ProfileSidebar({
  user,
  hasCompletedQuiz,
}: ProfileSidebarProps) {
  const riskLevel = user?.investorProfile?.riskLevel || "MEDIUM";
  const riskMeta = RISK_META[riskLevel as keyof typeof RISK_META];
  const RiskIcon = riskMeta.Icon;
  const riskScore = user?.investorProfile?.riskScore;
  const lastUpdated = user?.investorProfile?.lastUpdated
    ? new Date(user.investorProfile.lastUpdated).toLocaleDateString("vi-VN")
    : null;

  const initials = (user?.fullName || "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  const summaryRows = [
    {
      icon: DollarSign,
      label: "Thu nhập / tháng",
      value: formatVND(user?.monthlyIncome || 0),
      color: "#10b981",
    },
    {
      icon: TrendingDown,
      label: "Trả nợ thêm / tháng",
      value: formatVND(user?.extraBudget || 0),
      color: "#f59e0b",
    },
    {
      icon: Wallet,
      label: "Tổng vốn",
      value: formatVND(user?.investorProfile?.capital || 0),
      color: "#3b82f6",
    },
    {
      icon: TrendingUp,
      label: "Lãi gửi ngân hàng",
      value: formatPercent(user?.investorProfile?.savingsRate ?? 6.0),
      color: "#06b6d4",
    },
    {
      icon: TrendingDown,
      label: "Mức lạm phát",
      value: formatPercent(user?.investorProfile?.inflationRate ?? 3.5),
      color: "#ef4444",
    },
  ];

  const strategyRows = [
    {
      icon: Target,
      label: "Mục tiêu",
      value: GOAL_LABEL[user?.investorProfile?.goal || "GROWTH"],
      color: "#8b5cf6",
    },
    {
      icon: Clock,
      label: "Thời hạn",
      value: HORIZON_LABEL[user?.investorProfile?.horizon || "MEDIUM"],
      color: "#06b6d4",
    },
    {
      icon: RiskIcon,
      label: "Khẩu vị",
      value: riskMeta.label,
      color: riskMeta.color,
    },
    ...(hasCompletedQuiz
      ? [
          {
            icon: BarChart2,
            label: "Điểm quiz",
            value: `${riskScore}/100`,
            color: riskMeta.color,
          },
        ]
      : []),
    ...(lastUpdated
      ? [
          {
            icon: Calendar,
            label: "Cập nhật",
            value: lastUpdated,
            color: "#64748b",
          },
        ]
      : []),
  ];

  const quickLinks = [
    {
      to: "/risk-assessment",
      icon: Target,
      label: hasCompletedQuiz ? "Làm lại quiz rủi ro" : "Đánh giá rủi ro ngay",
      color: "#8b5cf6",
    },
    {
      to: "/investment",
      icon: TrendingUp,
      label: "Phân bổ đầu tư AI",
      color: "#3b82f6",
    },
    {
      to: "/debts",
      icon: CreditCard,
      label: "Quản lý khoản nợ",
      color: "#ef4444",
    },
    {
      to: "/debts/dti",
      icon: BarChart2,
      label: "Phân tích DTI",
      color: "#10b981",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-3xl border p-6 text-center overflow-hidden shadow-lg shadow-blue-500/5"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "rgba(59,130,246,0.15)",
        }}
      >
        <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-2xl font-black mx-auto mb-4 text-white ring-4 ring-blue-500/10"
          style={{
            background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
            boxShadow: "0 12px 24px rgba(59,130,246,0.3)",
          }}
        >
          {initials}
        </div>
        <p className="font-black text-[var(--color-text-primary)] text-lg tracking-tight">
          {user?.fullName || "-"}
        </p>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-1 font-medium">
          {user?.email || "-"}
        </p>
        <div
          className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ring-1 ring-inset"
          style={{
            background: `${riskMeta.color}10`,
            color: riskMeta.color,
            boxShadow: `inset 0 0 0 1px ${riskMeta.color}30`,
          }}
        >
          <RiskIcon size={12} /> {riskMeta.label}
        </div>
      </motion.div>

      {/* Summary Section */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl border p-6 shadow-sm"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-4">
          Tóm tắt hồ sơ
        </p>
        <div className="space-y-3">
          {summaryRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-1"
            >
              <span className="text-[13px] text-[var(--color-text-secondary)] font-medium flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <row.icon size={13} style={{ color: row.color }} />
                </div>
                {row.label}
              </span>
              <span className="text-[13px] font-bold text-[var(--color-text-primary)] tabular-nums">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Strategy Section */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl border p-6 shadow-sm"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-4">
          Chiến lược của bạn
        </p>
        <div className="space-y-3">
          {strategyRows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-1"
            >
              <span className="text-[13px] text-[var(--color-text-secondary)] font-medium flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <row.icon size={13} style={{ color: row.color }} />
                </div>
                {row.label}
              </span>
              <span
                className="text-[13px] font-bold tracking-tight"
                style={{ color: row.color }}
              >
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
        className="rounded-3xl border p-6 shadow-sm"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-4">
          Thao tác nhanh
        </p>
        <div className="grid grid-cols-1 gap-2">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-bold text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]/50 hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
            >
              <link.icon size={15} style={{ color: link.color }} />
              <span className="flex-1">{link.label}</span>
              <ChevronRight
                size={14}
                className="text-[var(--color-text-muted)] group-hover:translate-x-1 group-hover:text-blue-500 transition-all"
              />
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
