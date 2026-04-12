import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import EARBreakdown from '../../components/debt/EARBreakdown';
import { formatVND, formatPercent } from '../../utils/calculations';

export default function EarAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    debtAPI.getEarAnalysis()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 500));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-3xl mb-3">📊</p>
      <p className="text-slate-500">Không có dữ liệu phân tích</p>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">📊 Phân tích EAR toàn bộ</h1>
        <p className="text-slate-500 text-sm mt-1">So sánh lãi suất quảng cáo vs chi phí thực tế của từng khoản nợ</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {[
          { label: 'APR trung bình', value: formatPercent(data.summary.averageAPR), color: '#3b82f6', desc: 'Lãi suất quảng cáo' },
          { label: 'EAR trung bình', value: formatPercent(data.summary.averageEAR), color: '#ef4444', desc: 'Chi phí thực tế' },
          { label: 'Chi phí ẩn', value: `+${formatPercent(data.summary.totalHiddenCost)}`, color: '#f59e0b', desc: 'Chênh lệch APR vs EAR' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card text-center py-5"
          >
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[11px] text-slate-600 mt-1">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Highlight */}
      {data.summary.totalHiddenCost > 0 && (
        <div className="bg-amber-500/6 border border-amber-500/15 rounded-xl px-4 py-3 mb-6">
          <p className="text-sm text-amber-400">
            💡 Tổng chi phí ẩn trung bình <span className="font-bold">+{formatPercent(data.summary.totalHiddenCost)}</span> — khoản nợ của bạn đắt hơn {Math.round(data.summary.totalHiddenCost / (data.summary.averageAPR || 1) * 100)}% so với lãi suất quảng cáo.
          </p>
        </div>
      )}

      {/* Per-debt EAR */}
      <div className="space-y-6">
        {data.debts.map((debt, i) => (
          <motion.div
            key={debt.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{debt.name}</h3>
                <p className="text-[12px] text-slate-500">{debt.platform} • Dư nợ: {formatVND(debt.balance)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  APR <span className="text-blue-400 font-medium">{formatPercent(debt.earBreakdown?.apr || 0)}</span>
                  {' → '}
                  EAR <span className="text-red-400 font-bold">{formatPercent(debt.earBreakdown?.totalEAR || debt.ear || 0)}</span>
                </p>
              </div>
            </div>
            <EARBreakdown breakdown={debt.earBreakdown} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
