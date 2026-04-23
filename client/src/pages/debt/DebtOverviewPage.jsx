import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { formatVND, formatPercent } from '../../utils/calculations';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import {
  CreditCard, BarChart2, ClipboardList, Plus,
  AlertOctagon, AlertTriangle, PartyPopper, FileText, Home, TrendingUp, ChevronRight,
} from 'lucide-react';

const PLATFORM_ICONS = {
  SPAYLATER:   <span className="text-orange-400 text-sm font-black">S</span>,
  LAZPAYLATER: <span className="text-blue-400 text-sm font-black">L</span>,
  CREDIT_CARD: <CreditCard size={16} />,
  HOME_CREDIT: <Home size={16} />,
  FE_CREDIT:   <span className="text-emerald-400 text-sm font-black">F</span>,
  MOMO:        <span className="text-purple-400 text-sm font-black">M</span>,
  OTHER:       <FileText size={16} />,
};

const SUMMARY_CARDS = (summary) => [
  { label: 'Tổng dư nợ',       value: formatVND(summary.totalBalance || 0),      color: '#ef4444', gradient: 'from-red-500 to-rose-400',       bg: 'rgba(239,68,68,0.08)'    },
  { label: 'Trả/tháng',        value: formatVND(summary.totalMinPayment || 0),   color: '#f59e0b', gradient: 'from-amber-500 to-orange-400',    bg: 'rgba(245,158,11,0.08)'   },
  { label: 'EAR trung bình',   value: formatPercent(summary.averageEAR || 0),    color: '#8b5cf6', gradient: 'from-purple-500 to-violet-400',   bg: 'rgba(139,92,246,0.08)'   },
  {
    label: 'DTI Ratio',
    value: formatPercent(summary.debtToIncomeRatio || 0),
    desc:  (summary.debtToIncomeRatio || 0) > 50 ? 'Khủng hoảng' : (summary.debtToIncomeRatio || 0) > 35 ? 'Nguy hiểm' : (summary.debtToIncomeRatio || 0) > 20 ? 'Cẩn thận' : 'An toàn',
    color: (summary.debtToIncomeRatio || 0) > 50 ? '#ef4444' : (summary.debtToIncomeRatio || 0) > 35 ? '#f97316' : (summary.debtToIncomeRatio || 0) > 20 ? '#f59e0b' : '#10b981',
    gradient: (summary.debtToIncomeRatio || 0) > 35 ? 'from-red-500 to-orange-400' : 'from-emerald-500 to-teal-400',
    bg: 'rgba(59,130,246,0.08)',
  },
];

export default function DebtOverviewPage() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDebts = () => {
    debtAPI.getAll()
      .then(res => setData(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchDebts();
    const timer = setTimeout(() => setLoading(false), 500);
    window.addEventListener('Finsight:DebtUpdated', fetchDebts);
    return () => { clearTimeout(timer); window.removeEventListener('Finsight:DebtUpdated', fetchDebts); };
  }, []);

  if (loading) return <PageSkeleton />;

  const debts   = data?.debts   || [];
  const summary = data?.summary || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/8 text-red-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <CreditCard size={11} /> Quản lý nợ
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
            Danh sách khoản nợ
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">Tổng quan tất cả các khoản nợ của bạn</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/debts/ear-analysis" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 transition-all cursor-pointer">
            <BarChart2 size={13} /> EAR
          </Link>
          <Link to="/debts/dti" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 transition-all cursor-pointer">
            <TrendingUp size={13} /> DTI
          </Link>
          <Link to="/debts/repayment" className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--color-border)] text-[12px] font-bold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 transition-all cursor-pointer">
            <ClipboardList size={13} /> Kế hoạch
          </Link>
          <Link to="/debts/add" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-[13px] font-bold hover:bg-blue-500 transition-all cursor-pointer shadow-lg shadow-blue-500/25">
            <Plus size={14} /> Thêm nợ
          </Link>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {SUMMARY_CARDS(summary).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative rounded-2xl p-5 border overflow-hidden cursor-default"
            style={{ background: 'var(--color-bg-card)', borderColor: `${item.color}20`, boxShadow: `0 4px 20px ${item.color}08` }}
          >
            <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: item.color }} />
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">{item.label}</p>
            <p className={`text-xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-tight`}>{item.value}</p>
            {item.desc && <p className="text-[10px] mt-1 font-bold" style={{ color: item.color }}>{item.desc}</p>}
          </motion.div>
        ))}
      </div>

      {/* ── Domino Alerts ── */}
      {summary.dominoAlerts?.map((a, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl border text-[13px] font-bold relative overflow-hidden"
          style={{
            background:  a.severity === 'DANGER' ? 'rgba(239,68,68,0.06)'  : 'rgba(245,158,11,0.06)',
            borderColor: a.severity === 'DANGER' ? 'rgba(239,68,68,0.25)'  : 'rgba(245,158,11,0.25)',
          }}>
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: a.severity === 'DANGER' ? '#ef4444' : '#f59e0b' }} />
          <span className="ml-2" style={{ color: a.severity === 'DANGER' ? '#f87171' : '#fbbf24' }}>
            {a.severity === 'DANGER' ? <AlertOctagon size={16} /> : <AlertTriangle size={16} />}
          </span>
          <span style={{ color: a.severity === 'DANGER' ? '#fca5a5' : '#fde68a' }}>{a.message}</span>
        </div>
      ))}

      {/* ── Debt Cards ── */}
      {debts.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border)] p-16 text-center" style={{ background: 'var(--color-bg-card)' }}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <PartyPopper size={28} className="text-amber-400" />
          </div>
          <p className="text-[var(--color-text-primary)] font-bold mb-1">Bạn chưa có khoản nợ nào</p>
          <p className="text-[var(--color-text-muted)] text-sm mb-5">Thêm khoản nợ đầu tiên để bắt đầu theo dõi</p>
          <Link to="/debts/add" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer">
            <Plus size={15} /> Thêm khoản nợ đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {debts.map((debt, index) => (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <Link
                to={`/debts/${debt.id}`}
                className="block rounded-3xl border p-5 transition-all group cursor-pointer relative overflow-hidden"
                style={{
                  background:  'var(--color-bg-card)',
                  borderColor: 'rgba(239,68,68,0.12)',
                  boxShadow:   '0 2px 16px rgba(0,0,0,0.06)',
                }}
              >
                <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-15 bg-red-500 transition-opacity duration-500" />

                {/* Name row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)]">
                      {PLATFORM_ICONS[debt.platform] || <FileText size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-[13px] text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">{debt.name}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-medium">{debt.platform}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${debt.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {debt.status === 'ACTIVE' ? 'Đang vay' : 'Đã trả'}
                  </span>
                </div>

                {/* Balance */}
                <p className="text-2xl font-black bg-gradient-to-r from-red-400 to-rose-500 bg-clip-text text-transparent mb-4">
                  {formatVND(debt.balance)}
                </p>

                {/* Details */}
                <div className="space-y-1.5 mb-4">
                  {[
                    { label: 'APR', value: formatPercent(debt.apr), color: 'text-blue-400' },
                    { label: 'EAR thực tế', value: formatPercent(debt.ear), color: 'text-red-400' },
                    { label: 'Trả/tháng', value: formatVND(debt.minPayment), color: 'text-[var(--color-text-primary)]' },
                    { label: 'Đáo hạn', value: `Ngày ${debt.dueDay}`, color: 'text-[var(--color-text-primary)]' },
                    ...(summary.debtToIncomeRatio > 0 ? [{ label: 'Đóng góp DTI', value: `${((debt.minPayment / (summary.totalMinPayment || 1)) * summary.debtToIncomeRatio).toFixed(1)}%`, color: 'text-amber-400' }] : []),
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex justify-between text-[12px]">
                      <span className="text-[var(--color-text-muted)]">{label}</span>
                      <span className={`font-bold ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden mb-1.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(3, ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                    style={{ boxShadow: '0 0 6px rgba(59,130,246,0.4)' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {((debt.originalAmount - debt.balance) / debt.originalAmount * 100).toFixed(0)}% đã trả
                  </p>
                  <ChevronRight size={13} className="text-[var(--color-text-muted)] group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
