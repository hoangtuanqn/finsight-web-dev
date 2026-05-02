import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Building2, Calendar, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useBankSyncMutations } from '../../../hooks/useBankSyncQuery';
import { CategoryPicker } from './CategoryPicker';

interface PendingTransactionListProps {
  transactions: any[];
  categories: any[];
  loading: boolean;
  walletId?: string;
  onClearFilter?: () => void;
}

export function PendingTransactionList({
  transactions,
  categories,
  loading,
  walletId,
  onClearFilter,
}: PendingTransactionListProps) {
  const { approve, reject } = useBankSyncMutations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [localType, setLocalType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const handleApprove = (tx: any) => {
    if (!categoryId) return;
    approve.mutate({
      id: tx.id,
      categoryId,
      description: description || tx.description,
      type: localType,
    });
    setSelectedId(null);
    setCategoryId('');
    setDescription('');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 w-full bg-[var(--color-bg-card)] animate-pulse rounded-3xl border border-[var(--color-border)]"
          />
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-xl font-black text-[var(--color-text-primary)]">
            {walletId ? 'Giao dịch mới của ví' : 'Giao dịch chờ duyệt'}
          </h2>
          <p className="text-sm font-bold text-[var(--color-text-muted)] mt-1">
            {walletId
              ? `Đang hiển thị ${transactions.length} giao dịch cần xử lý của ví này`
              : `Cần xử lý ${transactions.length} giao dịch từ ngân hàng`}
          </p>
        </div>

        {walletId && (
          <button
            onClick={onClearFilter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-xs font-black hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
          >
            Xem tất cả ví
          </button>
        )}
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
            <div
              className={`absolute top-0 left-0 right-0 h-1 ${tx.type === 'INCOME' ? 'bg-emerald-500/40' : 'bg-red-500/40'}`}
            />

            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      tx.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
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
                    <p className="font-bold text-[var(--color-text-primary)] leading-snug">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                      <Building2 size={11} /> {tx.bankBrandName} • {tx.accountNumber}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-black ${tx.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {fmt(tx.amount)}
                  </p>

                  {selectedId !== tx.id && (
                    <div className="flex items-center justify-end gap-2 mt-3">
                      <button
                        onClick={() => {
                          setSelectedId(tx.id);
                          setDescription(tx.description);
                          setLocalType(tx.type as any);
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
                    <div className="mt-5 pt-5 border-t border-[var(--color-border)] space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest flex items-center gap-2">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${localType === 'INCOME' ? 'bg-emerald-500' : 'bg-red-500'}`}
                            />
                            Chọn danh mục {localType === 'INCOME' ? 'thu nhập' : 'chi tiêu'}
                          </label>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${localType === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}
                          >
                            {localType === 'INCOME' ? 'Tiền cộng vào' : 'Tiền trừ đi'}
                          </span>
                        </div>
                        <CategoryPicker
                          categories={categories}
                          selectedId={categoryId}
                          type={localType}
                          onSelect={(id) => setCategoryId(id)}
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleApprove(tx)}
                          disabled={!categoryId || approve.isPending}
                          className={`flex-1 py-3.5 rounded-2xl text-white font-black text-sm transition-all shadow-lg active:scale-95 disabled:opacity-50 ${
                            localType === 'INCOME'
                              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                              : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
                          }`}
                        >
                          {approve.isPending
                            ? 'Đang duyệt...'
                            : `Duyệt ${localType === 'INCOME' ? 'thu nhập' : 'chi tiêu'}`}
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
