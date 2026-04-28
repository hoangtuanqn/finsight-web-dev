import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Eye, EyeOff, MoreHorizontal, Trash2, Edit2, Wallet } from 'lucide-react';
import { useWallets, useWalletBalance, useWalletMutations } from '../../../hooks/useWalletQuery';
import { WalletForm } from './WalletForm';

const WALLET_TYPE_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK: 'Ngân hàng',
  EWALLET: 'Ví điện tử',
  OTHER: 'Khác',
};

const WALLET_TYPE_COLORS: Record<string, string> = {
  CASH: '#f59e0b',
  BANK: '#3b82f6',
  EWALLET: '#8b5cf6',
  OTHER: '#64748b',
};

export function WalletSection() {
  const [hideBalance, setHideBalance] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data: wallets, isLoading } = useWallets();
  const { data: balanceData } = useWalletBalance();
  const { deleteWallet } = useWalletMutations();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleEdit = (wallet: any) => {
    setEditingWallet(wallet);
    setIsFormOpen(true);
    setOpenMenu(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Xóa ví này? Các giao dịch liên quan sẽ không bị ảnh hưởng.')) {
      deleteWallet.mutate(id);
    }
    setOpenMenu(null);
  };

  const totalBalance = balanceData?.total || 0;

  return (
    <>
      <div
        className="relative rounded-3xl p-6 border overflow-hidden"
        style={{
          background: 'var(--color-bg-card)',
          borderColor: 'rgba(59,130,246,0.2)',
          boxShadow: '0 4px 24px rgba(59,130,246,0.06)',
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)' }} />
        {/* Soft glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-10 bg-blue-500 pointer-events-none" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-blue-400" />
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-muted)]">Tổng tài sản</p>
              <button
                onClick={() => setHideBalance(v => !v)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                {hideBalance ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-blue-500 to-indigo-400 bg-clip-text text-transparent">
              {hideBalance ? '••••••••' : formatCurrency(totalBalance)}
            </p>
          </div>
          <button
            onClick={() => { setEditingWallet(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all bg-[var(--color-bg-secondary)]"
          >
            <Plus size={16} /> Thêm ví
          </button>
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {isLoading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="h-28 bg-[var(--color-bg-secondary)] animate-pulse rounded-2xl" />
            ))
          ) : (
            wallets?.map((wallet: any) => {
              const accentColor = wallet.color || WALLET_TYPE_COLORS[wallet.type] || '#3b82f6';
              return (
                <motion.div
                  key={wallet.id}
                  whileHover={{ y: -3 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                  className="relative rounded-2xl p-4 border overflow-hidden cursor-default group"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderColor: `${accentColor}25`,
                    boxShadow: `0 2px 12px ${accentColor}08`,
                  }}
                >
                  {/* Micro accent */}
                  <div className="absolute top-0 left-3 right-3 h-px" style={{ background: `linear-gradient(90deg,transparent,${accentColor}80,transparent)` }} />

                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                      style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
                    >
                      {wallet.icon || '💳'}
                    </div>
                    <button
                      onClick={() => setOpenMenu(openMenu === wallet.id ? null : wallet.id)}
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all p-1 rounded-lg hover:bg-[var(--color-bg-primary)]"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>

                  <p className="text-[13px] font-bold text-[var(--color-text-primary)] truncate">{wallet.name}</p>
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">{WALLET_TYPE_LABELS[wallet.type]}</p>
                  <p className="text-[15px] font-black" style={{ color: accentColor }}>
                    {hideBalance ? '••••' : formatCurrency(wallet.balance)}
                  </p>

                  {/* Context menu */}
                  <AnimatePresence>
                    {openMenu === wallet.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -4 }}
                        className="absolute top-12 right-2 z-20 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-2xl overflow-hidden min-w-[130px]"
                      >
                        <button
                          onClick={() => handleEdit(wallet)}
                          className="flex items-center gap-2 w-full px-4 py-3 text-[13px] font-bold hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-primary)]"
                        >
                          <Edit2 size={13} className="text-blue-400" /> Sửa ví
                        </button>
                        <div className="h-px bg-[var(--color-border)]" />
                        <button
                          onClick={() => handleDelete(wallet.id)}
                          className="flex items-center gap-2 w-full px-4 py-3 text-[13px] font-bold text-red-500 hover:bg-red-500/5 transition-colors"
                        >
                          <Trash2 size={13} /> Xóa ví
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <WalletForm
            wallet={editingWallet}
            onClose={() => { setIsFormOpen(false); setEditingWallet(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
