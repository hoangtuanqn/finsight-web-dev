import { motion } from 'framer-motion';
import { useEarAnalysis } from '../../hooks/useDebtQuery';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import EARBreakdown from '../../components/debt/EARBreakdown';
import { formatVND, formatPercent } from '../../utils/calculations';
import { BarChart2, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react';

export default function EarAnalysisPage() {
  const { data, isLoading: loading } = useEarAnalysis();

  if (loading) return <PageSkeleton />;

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center">
        <BarChart2 size={28} className="text-slate-500" />
      </div>
      <p className="text-[var(--color-text-muted)] font-medium">Không có dữ liệu phân tích</p>
    </div>
  );

  const SUMMARY = [
    { label: 'APR trung bình', value: formatPercent(data.summary.averageAPR), color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400', desc: 'Lãi suất quảng cáo', icon: TrendingUp },
    { label: 'EAR trung bình', value: formatPercent(data.summary.averageEAR), color: '#ef4444', gradient: 'from-red-500 to-rose-400',  desc: 'Chi phí thực tế',  icon: BarChart2   },
    { label: 'Chi phí ẩn',     value: `+${formatPercent(data.summary.totalHiddenCost)}`, color: '#f59e0b', gradient: 'from-amber-500 to-orange-400', desc: 'Chênh lệch APR vs EAR', icon: AlertCircle },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/20 bg-purple-500/8 text-purple-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <BarChart2 size={11} /> Phân tích lãi suất
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Phân tích EAR toàn bộ</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">So sánh lãi suất quảng cáo vs chi phí thực tế từng khoản nợ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUMMARY.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-3xl p-6 border overflow-hidden cursor-default"
            style={{ background: 'var(--color-bg-card)', borderColor: `${item.color}20`, boxShadow: `0 4px 20px ${item.color}08` }}
          >
            <div className="absolute top-0 left-5 right-5 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-15" style={{ background: item.color }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{item.label}</span>
              </div>
              <p className={`text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent mb-1`}>{item.value}</p>
              <p className="text-[11px] text-[var(--color-text-muted)]">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {data.summary.totalHiddenCost > 0 && (
        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/6 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-500 to-orange-400" />
          <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5 ml-1" />
          <p className="text-[13px] text-amber-300 leading-relaxed">
            Tổng chi phí ẩn trung bình{' '}
            <span className="font-black text-amber-200">+{formatPercent(data.summary.totalHiddenCost)}</span>
            {' '}— khoản nợ đắt hơn{' '}
            <span className="font-black text-amber-200">{Math.round(data.summary.totalHiddenCost / (data.summary.averageAPR || 1) * 100)}%</span>
            {' '}so với lãi suất quảng cáo.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {data.debts.map((debt, i) => (
          <motion.div
            key={debt.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="rounded-3xl border p-5 relative overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(139,92,246,0.12)' }}
          >
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h3 className="font-black text-[var(--color-text-primary)] tracking-tight">{debt.name}</h3>
                <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{debt.platform} • Dư nợ: {formatVND(debt.balance)}</p>
              </div>
              <div className="flex items-center gap-2 text-[13px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400">APR {formatPercent(debt.earBreakdown?.apr || 0)}</span>
                <span className="text-[var(--color-text-muted)]">→</span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400">EAR {formatPercent(debt.earBreakdown?.totalEAR || debt.ear || 0)}</span>
              </div>
            </div>
            <EARBreakdown breakdown={debt.earBreakdown} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
