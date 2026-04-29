import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, PieChart as PieChartIcon, List, ChevronLeft, ChevronRight,
  Wallet, TrendingUp, TrendingDown, BarChart2
} from 'lucide-react';
import { useExpenseQuery, useExpenseStats, useExpenseCategories } from '../../hooks/useExpenseQuery';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseStats } from './components/ExpenseStats';
import { TransactionList } from './components/TransactionList';
import { WalletSection } from './components/WalletSection';
import { PendingTransactionList } from './components/PendingTransactionList';
import { useBankSyncQuery } from '../../hooks/useBankSyncQuery';
import { BellRing } from 'lucide-react';

export default function ExpensePage() {
  const [activeTab, setActiveTab] = useState<'TRANSACTIONS' | 'REPORTS' | 'PENDING'>('TRANSACTIONS');
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthRange = (date: Date) => ({
    startDate: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
    endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  });

  const { startDate, endDate } = getMonthRange(currentDate);
  const queryParams = {
    ...(typeFilter !== 'ALL' && { type: typeFilter }),
    startDate,
    endDate,
  };

  const { data: expenses, isLoading: loadingExpenses } = useExpenseQuery(queryParams);
  const { data: stats, isLoading: loadingStats } = useExpenseStats({ startDate, endDate });
  const { data: categories } = useExpenseCategories();
  const { data: pendingTxs, isLoading: loadingPending } = useBankSyncQuery(selectedWalletId);

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();

  const handleEdit = (expense: any) => { setEditingExpense(expense); setIsFormOpen(true); };
  const closeForm = () => { setIsFormOpen(false); setEditingExpense(null); };

  const formatCompact = (n: number) => {
    if (n < 1000000) {
      return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
    }
    return new Intl.NumberFormat('vi-VN', { 
      notation: 'compact', 
      maximumFractionDigits: 1 
    }).format(n).replace('tr', ' Tr').replace('tỷ', ' Tỷ') + 'đ';
  };

  const summaryCards = [
    {
      label: 'Tổng thu',
      value: formatCompact(stats?.totalIncome || 0),
      color: '#10b981',
      gradient: 'from-emerald-500 to-teal-400',
      bg: 'rgba(16,185,129,0.08)',
      icon: TrendingUp,
    },
    {
      label: 'Tổng chi',
      value: formatCompact(stats?.totalExpense || 0),
      color: '#ef4444',
      gradient: 'from-red-500 to-rose-400',
      bg: 'rgba(239,68,68,0.08)',
      icon: TrendingDown,
    },
    {
      label: 'Số dư ròng',
      value: formatCompact(Math.abs(stats?.balance || 0)),
      color: (stats?.balance || 0) >= 0 ? '#3b82f6' : '#f97316',
      gradient: (stats?.balance || 0) >= 0 ? 'from-blue-500 to-indigo-400' : 'from-orange-500 to-red-400',
      bg: 'rgba(59,130,246,0.08)',
      icon: BarChart2,
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-12 space-y-8">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 pt-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Wallet size={14} /> Quản lý thu chi
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Sổ thu chi
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base mt-2">
            Theo dõi dòng tiền ra vào, quản lý ví và phân tích chi tiêu theo tháng.
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
        >
          <Plus size={18} /> Thêm giao dịch
        </button>
      </div>

      {/* Wallet Section */}
      <WalletSection />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-5">
        {summaryCards.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative rounded-3xl p-6 border overflow-hidden"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: `${item.color}25`,
              boxShadow: `0 4px 24px ${item.color}08`,
            }}
          >
            <div className="absolute top-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-20" style={{ background: item.color }} />

            <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">{item.label}</p>
            {loadingStats ? (
              <div className="h-8 w-24 bg-[var(--color-bg-secondary)] animate-pulse rounded-xl" />
            ) : (
              <p className={`text-2xl md:text-3xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-tight`}>
                {item.value}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Month Navigation + Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Month Nav */}
        <div className="flex items-center gap-1 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-1">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors">
            <ChevronLeft size={16} className="text-[var(--color-text-muted)]" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-colors ${isCurrentMonth ? 'text-blue-500' : 'text-[var(--color-text-primary)]'}`}
          >
            Tháng {currentDate.getMonth() + 1}/{currentDate.getFullYear()}
            {isCurrentMonth && (
              <span className="ml-2 text-[10px] font-black bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full border border-blue-500/20">
                Hiện tại
              </span>
            )}
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-[var(--color-bg-secondary)] rounded-xl transition-colors">
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-xl border border-[var(--color-border)] gap-1">
          {[
            { id: 'TRANSACTIONS', label: 'Giao dịch', icon: List },
            { id: 'REPORTS', label: 'Báo cáo', icon: PieChartIcon },
            { 
              id: 'PENDING', 
              label: selectedWalletId ? 'Chi tiết GD ví' : 'Chờ duyệt', 
              icon: BellRing,
              badge: pendingTxs?.length > 0 ? pendingTxs.length : null
            },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id !== 'PENDING') setSelectedWalletId(undefined);
              }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--color-bg-card)] text-blue-500 shadow-sm border border-blue-500/20'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <tab.icon size={15} /> {tab.label}
              {tab.badge && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full ring-2 ring-[var(--color-bg-secondary)]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Type Filter Chips — only on Transactions tab */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="flex gap-2">
          {[
            { value: 'ALL', label: 'Tất cả' },
            { value: 'EXPENSE', label: '💸 Chi phí' },
            { value: 'INCOME', label: '💰 Thu nhập' },
          ].map(t => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                typeFilter === t.value
                  ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-blue-500/40 hover:text-[var(--color-text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'TRANSACTIONS' ? (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <TransactionList
              expenses={expenses || []}
              loading={loadingExpenses}
              onEdit={handleEdit}
            />
          </motion.div>
        ) : activeTab === 'PENDING' ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PendingTransactionList
              transactions={pendingTxs || []}
              loading={loadingPending}
              categories={categories || []}
              walletId={selectedWalletId}
              onClearFilter={() => setSelectedWalletId(undefined)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ExpenseStats stats={stats} loading={loadingStats} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <ExpenseForm
            onClose={closeForm}
            expense={editingExpense}
            categories={categories || []}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
