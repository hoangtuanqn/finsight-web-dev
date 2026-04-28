import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebts } from '../../hooks/useDebtQuery';
import { formatVND, formatPercent } from '../../utils/calculations';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import ExportReportModal from '../../components/debt/ExportReportModal';
import {
  CreditCard, BarChart2, ClipboardList, Plus,
  AlertOctagon, AlertTriangle, PartyPopper, FileText, Home, TrendingUp, ChevronRight, LayoutGrid, List, Filter, X
} from 'lucide-react';

const PLATFORM_ICONS = {
  SPAYLATER: <span className="text-orange-400 text-base font-black">S</span>,
  LAZPAYLATER: <span className="text-blue-400 text-base font-black">L</span>,
  CREDIT_CARD: <CreditCard size={18} />,
  HOME_CREDIT: <Home size={18} />,
  FE_CREDIT: <span className="text-emerald-400 text-base font-black">F</span>,
  MOMO: <span className="text-purple-400 text-base font-black">M</span>,
  OTHER: <FileText size={18} />,
};

const SUMMARY_CARDS = (summary) => [
  { label: 'Tổng dư nợ', value: formatVND(summary.totalBalance || 0), color: '#ef4444', gradient: 'from-red-500 to-rose-400', bg: 'rgba(239,68,68,0.08)' },
  { label: 'Trả / tháng', value: formatVND(summary.totalMinPayment || 0), color: '#f59e0b', gradient: 'from-amber-500 to-orange-400', bg: 'rgba(245,158,11,0.08)' },
  { label: 'EAR trung bình', value: formatPercent(summary.averageEAR || 0), color: '#8b5cf6', gradient: 'from-purple-500 to-violet-400', bg: 'rgba(139,92,246,0.08)' },
  {
    label: 'DTI Ratio',
    value: formatPercent(summary.debtToIncomeRatio || 0),
    desc: (summary.debtToIncomeRatio || 0) > 50 ? 'Khủng hoảng' : (summary.debtToIncomeRatio || 0) > 35 ? 'Nguy hiểm' : (summary.debtToIncomeRatio || 0) > 20 ? 'Cẩn thận' : 'An toàn',
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
  const [filters, setFilters] = useState({
    platform: '',
    amountRange: '',
    dueInDays: '',
    status: 'ACTIVE'
  });
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading } = useDebts(filters);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('finsight_debt_view') || 'grid');

  useEffect(() => {
    localStorage.setItem('finsight_debt_view', viewMode);
  }, [viewMode]);

  const debtsData = data?.debts || [];
  const summary = data?.summary || {};

  const filteredDebts = useMemo(() => {
    if (!data?.debts) return [];
    return debtsData.filter(debt => {
      // Client-side search
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const matchesName = debt.name.toLowerCase().includes(s);
        const matchesPlatform = debt.platform.toLowerCase().includes(s);
        const matchesNotes = debt.notes?.toLowerCase().includes(s);
        if (!matchesName && !matchesPlatform && !matchesNotes) return false;
      }

      // Client-side EAR range
      if (filters.earRange) {
        const ear = debt.ear;
        if (filters.earRange === 'low' && ear >= 15) return false;
        if (filters.earRange === 'mid' && (ear < 15 || ear > 30)) return false;
        if (filters.earRange === 'high' && ear <= 30) return false;
      }

      return true;
    });
  }, [debtsData, filters.search, filters.earRange]);

  const hasActiveFilters = !!(
    filters.platform || 
    filters.amountRange || 
    filters.dueInDays || 
    filters.status !== 'ACTIVE' ||
    filters.search ||
    filters.earRange
  );

  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    if (showFilters) {
      setTempFilters(filters);
    }
  }, [showFilters, filters]);

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    const resetState = { platform: '', amountRange: '', dueInDays: '', status: 'ACTIVE', search: '', earRange: '' };
    setTempFilters(resetState);
    setFilters(resetState);
  };

  if (isLoading) return <PageSkeleton />;

  const STATUS_TABS = [
    { id: 'ACTIVE', label: 'Đang nợ' },
    { id: 'PAID', label: 'Đã tất toán' },
    { id: 'TRASH', label: 'Thùng rác' },
  ];

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
                background: a.severity === 'DANGER' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                borderColor: a.severity === 'DANGER' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
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

      {(filteredDebts.length > 0 || hasActiveFilters) && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pt-2 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-extrabold text-[var(--color-text-primary)]">Chi tiết khoản nợ</h2>
            <div className="hidden lg:flex bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border)]">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilters(f => ({ ...f, status: tab.id }))}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    filters.status === tab.id
                      ? 'bg-[var(--color-bg-card)] text-blue-500 shadow-sm border border-blue-500/20'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="lg:hidden flex-1 flex bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border)]">
              {STATUS_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilters(f => ({ ...f, status: tab.id }))}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filters.status === tab.id
                      ? 'bg-[var(--color-bg-card)] text-blue-500 shadow-sm border border-blue-500/20'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(true)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all font-bold text-sm ${
                  hasActiveFilters 
                    ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' 
                    : 'bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-blue-500/40'
                }`}
              >
                <Filter size={16} />
                <span>Bộ lọc</span>
                {hasActiveFilters && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[var(--color-bg-primary)]">
                    !
                  </span>
                )}
              </button>

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
            </div>
          </div>
        </div>
      )}

      {/* Filter Drawer Overlay */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[var(--color-bg-primary)] shadow-2xl z-[101] border-l border-[var(--color-border)] flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Filter size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[var(--color-text-primary)]">Bộ lọc nâng cao</h3>
                    <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-widest">Tối ưu hoá danh sách</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors text-[var(--color-text-muted)]"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                {/* Search */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-blue-500">Tìm kiếm</label>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={16} />
                    <input 
                      type="text"
                      placeholder="Tên khoản nợ, nền tảng..."
                      value={tempFilters.search || ''}
                      onChange={(e) => setTempFilters(f => ({ ...f, search: e.target.value }))}
                      className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-blue-500">Nền tảng / Danh mục</label>
                  <select
                    value={tempFilters.platform}
                    onChange={(e) => setTempFilters(f => ({ ...f, platform: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer appearance-none"
                  >
                    <option value="">Tất cả</option>
                    <option value="CREDIT_CARD">Thẻ tín dụng</option>
                    <option value="HOME_CREDIT">Home Credit</option>
                    <option value="FE_CREDIT">FE Credit</option>
                    <option value="MOMO">Ví trả sau MoMo</option>
                    <option value="SPAYLATER">SPayLater</option>
                    <option value="LAZPAYLATER">LazPayLater</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Amount Range */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-blue-500">Hạn mức nợ</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '', label: 'Mọi hạn mức' },
                      { id: '<10000000', label: 'Dưới 10tr' },
                      { id: '10000000-50000000', label: '10tr - 50tr' },
                      { id: '>50000000', label: 'Trên 50tr' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTempFilters(f => ({ ...f, amountRange: opt.id }))}
                        className={`px-4 py-3 rounded-2xl text-[13px] font-bold transition-all border ${
                          tempFilters.amountRange === opt.id
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-500/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EAR Range */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-blue-500">Lãi suất thực tế (EAR)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: '', label: 'Mọi lãi suất' },
                      { id: 'low', label: 'Thấp (< 15%)' },
                      { id: 'mid', label: 'Trung bình (15-30%)' },
                      { id: 'high', label: 'Cao (> 30%)' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => setTempFilters(f => ({ ...f, earRange: opt.id }))}
                        className={`px-4 py-3 rounded-2xl text-[13px] font-bold transition-all border ${
                          tempFilters.earRange === opt.id
                            ? 'bg-red-600 text-white border-red-500 shadow-md'
                            : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-red-500/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-3">
                  <label className="text-xs font-black uppercase tracking-widest text-blue-500">Đáo hạn</label>
                  <select
                    value={tempFilters.dueInDays}
                    onChange={(e) => setTempFilters(f => ({ ...f, dueInDays: e.target.value }))}
                    className="w-full px-4 py-3.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm font-bold text-[var(--color-text-primary)] outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Mọi thời hạn</option>
                    <option value="7">Trong 7 ngày</option>
                    <option value="14">Trong 14 ngày</option>
                    <option value="30">Trong 30 ngày</option>
                  </select>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 grid grid-cols-2 gap-4">
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-4 rounded-2xl border border-[var(--color-border)] text-sm font-black text-[var(--color-text-muted)] hover:bg-white hover:text-red-500 transition-all uppercase tracking-widest"
                >
                  Xoá hết
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-6 py-4 rounded-2xl bg-blue-600 text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all"
                >
                  Áp dụng
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

          {filteredDebts.length === 0 ? (
            hasActiveFilters ? (
              <div className="rounded-3xl border border-[var(--color-border)] p-12 md:p-20 text-center" style={{ background: 'var(--color-bg-card)' }}>
                <div className="w-20 h-20 rounded-full bg-slate-500/10 border border-slate-500/20 flex items-center justify-center mx-auto mb-6">
                  <Filter size={36} className="text-slate-400" />
                </div>
                <h3 className="text-xl md:text-2xl text-[var(--color-text-primary)] font-bold mb-2">Không tìm thấy khoản nợ phù hợp</h3>
                <p className="text-[var(--color-text-muted)] text-base mb-8">Thử thay đổi hoặc xóa bộ lọc để xem các khoản nợ khác</p>
                <button
                  onClick={() => setFilters({ platform: '', amountRange: '', dueInDays: '', status: 'ACTIVE', search: '', earRange: '' })}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
                >
                  <X size={18} /> Xóa bộ lọc
                </button>
              </div>
            ) : (
              <div className="rounded-3xl border border-[var(--color-border)] p-12 md:p-20 text-center" style={{ background: 'var(--color-bg-card)' }}>
                <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                  <PartyPopper size={36} className="text-blue-400" />
                </div>
                <h3 className="text-xl md:text-2xl text-[var(--color-text-primary)] font-bold mb-2">Không có khoản nợ nào cần theo dõi</h3>
                <p className="text-[var(--color-text-muted)] text-base">Tuyệt vời! Bạn đang quản lý tài chính rất tốt, hãy tiếp tục phát huy nhé.</p>
              </div>
            )
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6"
              : "flex flex-col gap-4"}>
              {filteredDebts.map((debt, index) => {
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
                        background: 'var(--color-bg-card)',
                        borderColor: 'rgba(239,68,68,0.15)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
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
