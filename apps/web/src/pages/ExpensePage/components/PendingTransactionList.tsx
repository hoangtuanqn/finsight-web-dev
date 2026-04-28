import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, X, Building2, Calendar, 
  ArrowUpRight, ArrowDownLeft, Info, Search
} from 'lucide-react';
import { useBankSyncMutations } from '../../../hooks/useBankSyncQuery';

interface PendingTransactionListProps {
  transactions: any[];
  categories: any[];
  loading: boolean;
}

export function PendingTransactionList({ transactions, categories, loading }: PendingTransactionListProps) {
  const { approve, reject } = useBankSyncMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');

  const fmt = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const handleApprove = (tx: any) => {
    if (!categoryId) return;
    approve.mutate({ id: tx.id, categoryId, description: description || tx.description });
    setSelectedId(null);
    setCategoryId('');
    setDescription('');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 w-full bg-[var(--color-bg-card)] animate-pulse rounded-3xl border border-[var(--color-border)]" />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-[var(--color-bg-card)] rounded-3xl border border-dashed border-[var(--color-border)]">
        <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 text-blue-500">
          <Check size={32} />
        </div>
        <h3 className="text-lg font-black text-[var(--color-text-primary)]">Sạch bóng!</h3>
        <p className="text-[var(--color-text-muted)] text-center max-w-xs mt-1">
          Không có giao dịch ngân hàng nào đang chờ duyệt. Mọi thứ đã được sắp xếp gọn gàng.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <p className="text-sm font-bold text-[var(--color-text-muted)]">
          Cần xử lý <span className="text-blue-500">{transactions.length}</span> giao dịch
        </p>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => (
          <motion.div
            key={tx.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`group relative overflow-hidden rounded-3xl border transition-all ${
              selectedId === tx.id 
                ? 'border-blue-500/50 bg-[var(--color-bg-secondary)] ring-4 ring-blue-500/5 shadow-xl' 
                : 'border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-blue-500/30'
            }`}
          >
            {/* Top indicator bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${tx.type === 'INCOME' ? 'bg-emerald-500/40' : 'bg-red-500/40'}`} />

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {tx.type === 'INCOME' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]">
                        {tx.wallet?.name || 'Ngân hàng'}
                      </span>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-medium flex items-center gap-1">
                        <Calendar size={10} /> {new Date(tx.transactionDate).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="font-bold text-[var(--color-text-primary)] leading-snug">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                      <Building2 size={11} /> {tx.bankBrandName} • {tx.accountNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-black ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}{fmt(tx.amount)}
                  </p>
                  
                  {selectedId !== tx.id && (
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button 
                        onClick={() => {
                          setSelectedId(tx.id);
                          setDescription(tx.description);
                          // Tự động tìm category gợi ý nếu có (về sau có thể dùng AI)
                          setCategoryId('');
                        }}
                        className="p-2 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-500/20"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Bạn có chắc muốn bỏ qua giao dịch này?')) {
                            reject.mutate(tx.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-500/20"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expansion Area for Approval */}
              <AnimatePresence>
                {selectedId === tx.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 pt-5 border-t border-[var(--color-border)] space-y-4">
                      <div>
                        <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block">
                          Ghi chú & Tên giao dịch
                        </label>
                        <input 
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-2 block">
                          Chọn danh mục chi tiêu/thu nhập
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {categories
                            .filter(c => c.type === tx.type)
                            .map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setCategoryId(cat.id)}
                                className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                                  categoryId === cat.id
                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-500/40'
                                }`}
                              >
                                <span className="text-lg">{cat.icon}</span>
                                <span className="truncate">{cat.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleApprove(tx)}
                          disabled={!categoryId || approve.isPending}
                          className="flex-1 py-3.5 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                        >
                          {approve.isPending ? 'Đang duyệt...' : 'Duyệt giao dịch'}
                        </button>
                        <button
                          onClick={() => setSelectedId(null)}
                          className="px-6 py-3.5 rounded-2xl bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] font-bold text-sm border border-[var(--color-border)] hover:bg-[var(--color-bg-primary)] transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
