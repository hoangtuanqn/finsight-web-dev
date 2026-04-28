import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Wallet } from 'lucide-react';
import { useWalletMutations } from '../../../hooks/useWalletQuery';
import { INPUT_CLASSES, LABEL_CLASSES, SELECT_CLASSES } from '../constants';

const WALLET_ICONS = ['👛', '💰', '🏦', '💳', '📱', '🏧', '💵', '🪙'];
const WALLET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#64748b'];

interface WalletFormProps {
  wallet?: any;
  onClose: () => void;
}

export function WalletForm({ wallet, onClose }: WalletFormProps) {
  const { createWallet, updateWallet } = useWalletMutations();
  const [form, setForm] = useState({
    name: wallet?.name || '',
    type: wallet?.type || 'CASH',
    icon: wallet?.icon || '👛',
    color: wallet?.color || '#3b82f6',
    balance: wallet?.balance?.toString() || '0',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, balance: parseFloat(form.balance) || 0 };
    if (wallet) {
      updateWallet.mutate({ id: wallet.id, data }, { onSuccess: onClose });
    } else {
      createWallet.mutate(data, { onSuccess: onClose });
    }
  };

  const isPending = createWallet.isPending || updateWallet.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="relative w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-black flex items-center gap-2">
            <Wallet size={20} className="text-blue-500" />
            {wallet ? 'Sửa ví' : 'Thêm ví mới'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Icon & Color Picker */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className={LABEL_CLASSES}>Biểu tượng</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {WALLET_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon }))}
                    className={`w-10 h-10 text-xl rounded-xl flex items-center justify-center transition-all ${form.icon === icon ? 'ring-2 ring-blue-500 bg-blue-500/10 scale-110' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)]'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Màu sắc</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {WALLET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, color }))}
                    className={`w-7 h-7 rounded-full transition-all ${form.color === color ? 'ring-2 ring-offset-2 ring-[var(--color-text-primary)] scale-110' : ''}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={LABEL_CLASSES}>Tên ví</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Bóp tiền mặt, TPBank..."
              required
              className={INPUT_CLASSES}
            />
          </div>

          {/* Type */}
          <div>
            <label className={LABEL_CLASSES}>Loại ví</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'CASH', label: '💵 Tiền mặt' },
                { value: 'BANK', label: '🏦 Ngân hàng' },
                { value: 'EWALLET', label: '📱 Ví điện tử' },
                { value: 'OTHER', label: '🪙 Khác' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`px-3 py-3 rounded-2xl text-[13px] font-bold transition-all border ${
                    form.type === opt.value
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-blue-500/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className={LABEL_CLASSES}>Số dư ban đầu</label>
            <div className="relative">
              <input
                type="number"
                value={form.balance}
                onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
                className={INPUT_CLASSES + ' pr-10'}
                placeholder="0"
                min="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-bold">đ</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-4 rounded-2xl bg-blue-600 text-white font-black text-[15px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-60"
          >
            {isPending ? 'Đang lưu...' : wallet ? 'Cập nhật ví' : 'Thêm ví'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
