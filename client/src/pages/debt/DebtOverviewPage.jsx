import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { formatVND, formatPercent } from '../../utils/calculations';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { CreditCard, BarChart2, ClipboardList, Plus, AlertOctagon, AlertTriangle, PartyPopper, FileText, Home, TrendingUp } from 'lucide-react';

const PLATFORM_ICONS = {
  SPAYLATER: '🟠', LAZPAYLATER: '🔵', CREDIT_CARD: <CreditCard size={18} />,
  HOME_CREDIT: <Home size={18} />, FE_CREDIT: '🏦', MOMO: '🟣', OTHER: <FileText size={18} />,
};

export default function DebtOverviewPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDebts = () => {
    debtAPI.getAll()
      .then(res => setData(res.data.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchDebts();
    const timer = setTimeout(() => setLoading(false), 500);

    const handleUpdate = () => fetchDebts();
    window.addEventListener('Finsight:DebtUpdated', handleUpdate);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('Finsight:DebtUpdated', handleUpdate);
    };
  }, []);

  if (loading) return <PageSkeleton />;

  const debts = data?.debts || [];
  const summary = data?.summary || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-white flex items-center gap-2"><CreditCard size={20} /> Quản lý nợ</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng quan các khoản nợ của bạn</p>
        </div>
        <div className="flex gap-2">
          <Link to="/debts/ear-analysis" className="btn-ghost text-[12px] flex items-center gap-1"><BarChart2 size={13} /> Phân tích EAR</Link>
          <Link to="/debts/dti" className="btn-ghost text-[12px] flex items-center gap-1"><TrendingUp size={13} /> Phân tích DTI</Link>
          <Link to="/debts/repayment" className="btn-ghost text-[12px] flex items-center gap-1"><ClipboardList size={13} /> Kế hoạch trả nợ</Link>
          <Link to="/debts/add" className="btn-primary text-[13px] py-2 px-4 flex items-center gap-1"><Plus size={14} /> Thêm nợ</Link>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Tổng dư nợ', value: formatVND(summary.totalBalance || 0), color: '#ef4444' },
          { label: 'Trả/tháng tối thiểu', value: formatVND(summary.totalMinPayment || 0), color: '#f59e0b' },
          { label: 'EAR trung bình', value: formatPercent(summary.averageEAR || 0), color: '#8b5cf6' },
          { label: 'Nợ/Thu nhập (DTI)', value: formatPercent(summary.debtToIncomeRatio || 0), color: (summary.debtToIncomeRatio || 0) > 50 ? '#ef4444' : (summary.debtToIncomeRatio || 0) > 35 ? '#f97316' : (summary.debtToIncomeRatio || 0) > 20 ? '#f59e0b' : '#10b981', desc: (summary.debtToIncomeRatio || 0) > 50 ? 'Khủng hoảng' : (summary.debtToIncomeRatio || 0) > 35 ? 'Nguy hiểm' : (summary.debtToIncomeRatio || 0) > 20 ? 'Cẩn thận' : 'An toàn' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card text-center py-4"
          >
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
            <p className="text-xl font-bold" style={{ color: item.color }}>{item.value}</p>
            {item.desc && <p className="text-[10px] mt-0.5" style={{ color: item.color }}>{item.desc}</p>}
          </motion.div>
        ))}
      </div>

      {/* Domino alerts */}
      {summary.dominoAlerts?.map((a, i) => (
        <div key={i} className={`mb-3 px-4 py-3 rounded-xl border text-sm ${a.severity === 'DANGER' ? 'bg-red-500/8 border-red-500/20 text-red-400 pulse-danger' : 'bg-amber-500/8 border-amber-500/20 text-amber-400'}`}>
          {a.severity === 'DANGER' ? <AlertOctagon size={15} className="shrink-0" /> : <AlertTriangle size={15} className="shrink-0" />} {a.message}
        </div>
      ))}

      {/* Debt Cards */}
      {debts.length === 0 ? (
        <div className="glass-card text-center py-16">
          <p className="text-4xl mb-3"><PartyPopper size={40} className="mx-auto text-amber-400" /></p>
          <p className="text-slate-400 mb-4">Bạn chưa có khoản nợ nào. Tuyệt vời!</p>
          <Link to="/debts/add" className="btn-primary">+ Thêm khoản nợ đầu tiên</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {debts.map((debt, index) => (
            <motion.div
              key={debt.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Link to={`/debts/${debt.id}`} className="glass-card block group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg flex items-center justify-center">{PLATFORM_ICONS[debt.platform] || <FileText size={18} />}</span>
                    <div>
                      <p className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors">{debt.name}</p>
                      <p className="text-[11px] text-slate-600">{debt.platform}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${debt.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400' : 'bg-green-500/15 text-green-400'}`}>
                    {debt.status === 'ACTIVE' ? 'Đang vay' : 'Đã trả'}
                  </span>
                </div>

                <p className="text-xl font-bold text-red-400 mb-3">{formatVND(debt.balance)}</p>

                <div className="space-y-1.5 mb-3">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">APR</span>
                    <span className="text-blue-400 font-medium">{formatPercent(debt.apr)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">EAR thực tế</span>
                    <span className="text-red-400 font-medium">{formatPercent(debt.ear)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">Trả/tháng</span>
                    <span className="text-slate-300">{formatVND(debt.minPayment)}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-slate-500">Đáo hạn</span>
                    <span className="text-slate-300">Ngày {debt.dueDay}</span>
                  </div>
                  {summary.debtToIncomeRatio > 0 && (
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">Đóng góp DTI</span>
                      <span className="text-amber-400 font-medium">
                        {((debt.minPayment / (summary.totalMinPayment || 1)) * summary.debtToIncomeRatio).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(3, ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  {((debt.originalAmount - debt.balance) / debt.originalAmount * 100).toFixed(0)}% đã trả
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
