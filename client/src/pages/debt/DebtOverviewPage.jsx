import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDebts } from '../../hooks/useDebtQuery';
import { formatVND, formatPercent } from '../../utils/calculations';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import ExportReportModal from '../../components/debt/ExportReportModal';
import {
  CreditCard, BarChart2, ClipboardList, Plus,
  AlertOctagon, AlertTriangle, PartyPopper, FileText, Home, TrendingUp, ChevronRight, LayoutGrid, List
} from 'lucide-react';

const PLATFORM_ICONS = {
  SPAYLATER:   <span className="text-orange-400 text-base font-black">S</span>,
  LAZPAYLATER: <span className="text-blue-400 text-base font-black">L</span>,
  CREDIT_CARD: <CreditCard size={18} />,
  HOME_CREDIT: <Home size={18} />,
  FE_CREDIT:   <span className="text-emerald-400 text-base font-black">F</span>,
  MOMO:        <span className="text-purple-400 text-base font-black">M</span>,
  OTHER:       <FileText size={18} />,
};

const SUMMARY_CARDS = (summary) => [
  { label: 'Tổng dư nợ',       value: formatVND(summary.totalBalance || 0),      color: '#ef4444', gradient: 'from-red-500 to-rose-400',       bg: 'rgba(239,68,68,0.08)'    },
  { label: 'Trả / tháng',      value: formatVND(summary.totalMinPayment || 0),   color: '#f59e0b', gradient: 'from-amber-500 to-orange-400',    bg: 'rgba(245,158,11,0.08)'   },
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

const getProgressStyle = (percent) => {
  if (percent < 30) return { bg: 'from-red-500 via-rose-500 to-pink-500', shadow: 'rgba(244,63,94,0.4)', text: 'text-rose-500' };
  if (percent < 70) return { bg: 'from-amber-400 via-orange-400 to-orange-500', shadow: 'rgba(245,158,11,0.4)', text: 'text-orange-500' };
  return { bg: 'from-emerald-400 via-teal-400 to-teal-500', shadow: 'rgba(16,185,129,0.4)', text: 'text-emerald-500' };
};

export default function DebtOverviewPage() {
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const { data, isLoading } = useDebts(statusFilter);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('finsight_debt_view') || 'grid');

  useEffect(() => {
    localStorage.setItem('finsight_debt_view', viewMode);
  }, [viewMode]);

  if (isLoading) return <PageSkeleton />;

  const debts   = data?.debts   || [];
  const summary = data?.summary || {};

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest mb-4">
            <CreditCard size={14} /> Quản lý khoản nợ
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
              Danh sách khoản nợ
            </h1>
          </div>
          <p className="text-[var(--color-text-secondary)] text-base mt-2">Tổng quan và theo dõi các khoản nợ của bạn một cách trực quan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/debts/ear-analysis" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer bg-[var(--color-bg-card)]">
            <BarChart2 size={16} /> EAR
          </Link>
          <Link to="/debts/dti" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer bg-[var(--color-bg-card)]">
            <TrendingUp size={16} /> DTI
          </Link>
          <Link to="/debts/repayment" className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all cursor-pointer bg-[var(--color-bg-card)]">
            <ClipboardList size={16} /> Kế hoạch
          </Link>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-secondary)] hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer bg-[var(--color-bg-card)]"
          >
            <FileText size={16} /> Xuất báo cáo
          </button>
          <Link to="/debts/add" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer">
            <Plus size={18} /> Thêm khoản nợ
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {SUMMARY_CARDS(summary).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative rounded-3xl p-6 border overflow-hidden cursor-default transition-all duration-300 hover:shadow-xl"
            style={{ background: 'var(--color-bg-card)', borderColor: `${item.color}25`, boxShadow: `0 4px 24px ${item.color}08` }}
          >
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-25" style={{ background: item.color }} />
            
            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
              {item.label}
            </p>
            <p className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-tight`}>
              {item.value}
            </p>
            {item.desc && (
              <p className="text-xs mt-2 font-semibold" style={{ color: item.color }}>
                {item.desc}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {summary.dominoAlerts?.length > 0 && (
        <div className="space-y-3">
          {summary.dominoAlerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm font-medium relative overflow-hidden"
              style={{
                background:  a.severity === 'DANGER' ? 'rgba(239,68,68,0.08)'  : 'rgba(245,158,11,0.08)',
                borderColor: a.severity === 'DANGER' ? 'rgba(239,68,68,0.3)'   : 'rgba(245,158,11,0.3)',
              }}>
              <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: a.severity === 'DANGER' ? '#ef4444' : '#f59e0b' }} />
              <span className="mt-0.5" style={{ color: a.severity === 'DANGER' ? '#f87171' : '#fbbf24' }}>
                {a.severity === 'DANGER' ? <AlertOctagon size={18} /> : <AlertTriangle size={18} />}
              </span>
              <span className="leading-relaxed" style={{ color: a.severity === 'DANGER' ? '#fca5a5' : '#fde68a' }}>
                {a.message}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">Chi tiết khoản nợ</h2>
          
          <div className="flex items-center bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-1 shadow-sm overflow-x-auto">
            {[
              { id: 'ACTIVE', label: 'Đang nợ' },
              { id: 'PAID', label: 'Đã tất toán' },
              { id: 'TRASH', label: 'Thùng rác' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex-shrink-0 px-4 py-1.5 text-sm font-bold rounded-lg transition-colors ${
                  statusFilter === tab.id 
                    ? 'bg-[var(--color-bg-card)] text-blue-500 shadow-sm border border-[var(--color-border)]/50' 
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                {tab.id === 'TRASH' && statusFilter === tab.id ? '🗑️ ' : ''}{tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {debts.length > 0 && (
          <div className="hidden sm:flex items-center bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
              title="Xem dạng lưới"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'}`}
              title="Xem dạng danh sách"
            >
              <List size={18} />
            </button>
          </div>
        )}
      </div>

      {debts.length === 0 ? (
        <div className="rounded-3xl border border-[var(--color-border)] p-12 md:p-20 text-center" style={{ background: 'var(--color-bg-card)' }}>
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
            <PartyPopper size={36} className="text-blue-400" />
          </div>
          <h3 className="text-xl md:text-2xl text-[var(--color-text-primary)] font-bold mb-2">Bạn chưa có khoản nợ nào</h3>
          <p className="text-[var(--color-text-muted)] text-base mb-8">Hãy thêm khoản nợ đầu tiên để bắt đầu hành trình quản lý tài chính</p>
          <Link to="/debts/add" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer">
            <Plus size={18} /> Thêm khoản nợ đầu tiên
          </Link>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6" 
          : "flex flex-col gap-4"}>
          {debts.map((debt, index) => {
            const progressPercent = ((debt.originalAmount - debt.balance) / debt.originalAmount) * 100;
            const progressStyle = getProgressStyle(progressPercent);

            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  to={`/debts/${debt.id}`}
                  className={`block rounded-[24px] border transition-all duration-300 group cursor-pointer relative overflow-hidden ${viewMode === 'grid' ? 'p-6 md:p-7' : 'p-5 md:p-6'}`}
                  style={{
                    background:  'var(--color-bg-card)',
                    borderColor: 'rgba(239,68,68,0.15)',
                    boxShadow:   '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                >
                  <div className="absolute top-0 left-6 right-6 h-[1.5px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-15 bg-red-500 transition-opacity duration-500" />

                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0 text-[var(--color-text-secondary)] shadow-inner">
                            {PLATFORM_ICONS[debt.platform] || <FileText size={20} />}
                          </div>
                          <div>
                            <p className="font-bold text-base md:text-lg text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors leading-snug">{debt.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5 uppercase tracking-wide">{debt.platform}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 ml-2 ${debt.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'}`}>
                          {debt.status === 'ACTIVE' ? 'Đang vay' : 'Đã trả'}
                        </span>
                      </div>

                      <div className="mb-6">
                        <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">Số dư hiện tại</p>
                        <p className="text-3xl font-black bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                          {formatVND(debt.balance)}
                        </p>
                      </div>

                      <div className="space-y-3 mb-6 bg-[var(--color-bg-secondary)] rounded-2xl p-4 border border-[var(--color-border)]">
                        {[
                          { label: 'APR', value: formatPercent(debt.apr), color: 'text-blue-400' },
                          { label: 'EAR thực tế', value: formatPercent(debt.ear), color: 'text-red-400' },
                          { label: 'Trả / tháng', value: formatVND(debt.minPayment), color: 'text-[var(--color-text-primary)]' },
                          { label: 'Đáo hạn', value: `Ngày ${debt.dueDay}`, color: 'text-[var(--color-text-primary)]' },
                          ...(summary.debtToIncomeRatio > 0 ? [{ label: 'Đóng góp DTI', value: `${((debt.minPayment / (summary.totalMinPayment || 1)) * summary.debtToIncomeRatio).toFixed(1)}%`, color: 'text-amber-400' }] : []),
                        ].map(({ label, value, color }) => (
                          <div key={label} className="flex justify-between items-center text-sm">
                            <span className="text-[var(--color-text-muted)] font-medium">{label}</span>
                            <span className={`font-bold ${color}`}>{value}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)]">Tiến độ trả nợ</p>
                          <p className={`text-xs font-bold ${progressStyle.text}`}>
                            {progressPercent.toFixed(0)}%
                          </p>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden border border-[var(--color-border)]/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, progressPercent)}%` }}
                            transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
                            className={`h-full rounded-full bg-gradient-to-r ${progressStyle.bg}`}
                            style={{ boxShadow: `0 0 10px ${progressStyle.shadow}` }}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-xs font-semibold text-blue-400">Xem chi tiết khoản nợ</span>
                        <ChevronRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col xl:flex-row xl:items-center gap-5 w-full">
                      <div className="flex flex-1 items-start xl:items-center gap-4 xl:min-w-[280px]">
                        <div className="w-12 h-12 rounded-2xl bg-[var(--color-bg-secondary)] flex items-center justify-center shrink-0 shadow-inner text-[var(--color-text-secondary)] border border-[var(--color-border)]/50">
                          {PLATFORM_ICONS[debt.platform] || <FileText size={22} />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-lg text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors leading-snug">{debt.name}</p>
                          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                            <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">{debt.platform}</span>
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${debt.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                              {debt.status === 'ACTIVE' ? 'Đang vay' : 'Đã trả'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col md:flex-row md:items-center gap-6 xl:gap-8 flex-[2] bg-[var(--color-bg-secondary)]/40 xl:bg-transparent p-4 xl:p-0 rounded-2xl">
                        <div className="md:w-[200px] shrink-0">
                          <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">Số dư hiện tại</p>
                          <p className="text-2xl md:text-3xl font-black bg-gradient-to-br from-red-400 via-rose-500 to-pink-600 bg-clip-text text-transparent">
                            {formatVND(debt.balance)}
                          </p>
                        </div>

                        <div className="flex-1 flex gap-4 md:gap-8 justify-between xl:justify-start">
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">Trả / tháng</p>
                            <p className="font-bold text-sm text-[var(--color-text-primary)]">{formatVND(debt.minPayment)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">EAR thực tế</p>
                            <p className="font-bold text-sm text-red-400">{formatPercent(debt.ear)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium mb-1">Đáo hạn</p>
                            <p className="font-bold text-sm text-[var(--color-text-primary)]">Ngày {debt.dueDay}</p>
                          </div>
                        </div>
                      </div>

                      <div className="xl:w-[220px] shrink-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[var(--color-text-primary)]">Tiến độ trả nợ</p>
                          <p className={`text-xs font-bold ${progressStyle.text}`}>{progressPercent.toFixed(0)}%</p>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden border border-[var(--color-border)]/50">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(2, progressPercent)}%` }}
                            transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
                            className={`h-full rounded-full bg-gradient-to-r ${progressStyle.bg}`}
                            style={{ boxShadow: `0 0 10px ${progressStyle.shadow}` }}
                          />
                        </div>
                      </div>
                      
                      <div className="hidden xl:flex shrink-0 w-8 justify-end border-l border-[var(--color-border)] pl-4">
                        <ChevronRight size={20} className="text-[var(--color-text-muted)] group-hover:text-blue-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      <ExportReportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
      />
    </motion.div>
  );
}
