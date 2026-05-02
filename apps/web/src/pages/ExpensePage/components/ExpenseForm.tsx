import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Check, ChevronDown, FileText, Plus, Save, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useExpenseMutations } from '../../../hooks/useExpenseQuery';
import { useWallets } from '../../../hooks/useWalletQuery';
import { EXPENSE_TYPES } from '../constants';
import { CategoryPicker } from './CategoryPicker';
import { WalletForm } from './WalletForm';

interface ExpenseFormProps {
  onClose: () => void;
  expense?: any;
  categories: any[];
}

export function ExpenseForm({ onClose, expense, categories }: ExpenseFormProps) {
  const { createExpense, updateExpense } = useExpenseMutations();
  const { data: wallets } = useWallets();

  const [type, setType] = useState<'EXPENSE' | 'INCOME'>(expense?.type || 'EXPENSE');
  const [amount, setAmount] = useState(expense?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(expense?.categoryId || '');
  const [walletId, setWalletId] = useState(expense?.walletId || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [date, setDate] = useState(
    expense ? new Date(expense.date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(!expense);
  const [selectedCategoryDisplay, setSelectedCategoryDisplay] = useState<any>(expense?.category || null);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const formatAmount = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? parseInt(num).toLocaleString('vi-VN') : '';
  };
  const parseAmount = (val: string) => parseInt(val.replace(/\./g, '').replace(/,/g, '')) || 0;

  const handleCategorySelect = (id: string, cat: any) => {
    setCategoryId(id);
    setSelectedCategoryDisplay(cat);
    setShowCategoryPicker(false);
  };

  const isPending = createExpense.isPending || updateExpense.isPending;

  const [showWalletForm, setShowWalletForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      alert('Vui lòng chọn danh mục');
      return;
    }
    if (parseAmount(amount) <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    const data = {
      amount: parseAmount(amount),
      type,
      categoryId,
      walletId: walletId || null,
      description,
      date: new Date(date).toISOString(),
    };
    if (expense) {
      updateExpense.mutate({ id: expense.id, data }, { onSuccess: onClose });
    } else {
      createExpense.mutate(data, { onSuccess: onClose });
    }
  };

  const selectedWallet = wallets?.find((w: any) => w.id === walletId);

  const isExpense = type === 'EXPENSE';
  const accentColor = isExpense ? '#ef4444' : '#10b981';
  const accentGradient = isExpense ? 'from-red-500 to-rose-400' : 'from-emerald-500 to-teal-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="relative w-full max-w-lg flex flex-col max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)` }}
        />

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}
              >
                {expense ? (
                  <Save size={16} style={{ color: accentColor }} />
                ) : (
                  <Plus size={16} style={{ color: accentColor }} />
                )}
              </div>
              <h2 className="text-lg font-black text-[var(--color-text-primary)]">
                {expense ? 'Cập nhật giao dịch' : 'Thêm giao dịch mới'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Type Toggle */}
          <div className="flex bg-[var(--color-bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)] gap-1">
            {EXPENSE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setType(t.value as any);
                  setCategoryId('');
                  setSelectedCategoryDisplay(null);
                  setShowCategoryPicker(true);
                }}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
                  type === t.value
                    ? 'bg-[var(--color-bg-card)] shadow-sm border border-[var(--color-border)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
                style={type === t.value ? { color: t.color } : {}}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
          <div className="px-6 py-5 space-y-5 flex-1">
            {/* Amount */}
            <div
              className="rounded-2xl p-5 text-center border"
              style={{ background: `${accentColor}06`, borderColor: `${accentColor}20` }}
            >
              <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: accentColor }}>
                Số tiền
              </p>
              <div className="flex items-center justify-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatAmount(amount)}
                  onChange={(e) => setAmount(e.target.value.replace(/\./g, '').replace(/,/g, ''))}
                  placeholder="0"
                  className={`bg-transparent text-4xl md:text-5xl font-black text-center outline-none w-full caret-current`}
                  style={{ color: accentColor }}
                  autoFocus
                />
                <span className="text-2xl font-black" style={{ color: `${accentColor}80` }}>
                  đ
                </span>
              </div>
            </div>

            {/* Category */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-blue-500">Danh mục</p>
                {selectedCategoryDisplay && !showCategoryPicker && (
                  <button
                    type="button"
                    onClick={() => setShowCategoryPicker(true)}
                    className="text-[12px] font-bold text-[var(--color-text-muted)] hover:text-blue-500 flex items-center gap-1 transition-colors"
                  >
                    Thay đổi <ChevronDown size={13} />
                  </button>
                )}
              </div>

              {/* Collapsed: show selected */}
              {selectedCategoryDisplay && !showCategoryPicker && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="button"
                  onClick={() => setShowCategoryPicker(true)}
                  className="flex items-center gap-3 w-full p-4 rounded-2xl border transition-all"
                  style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                >
                  <span className="text-2xl">{selectedCategoryDisplay.icon}</span>
                  <div className="text-left flex-1">
                    <div className="text-[14px] font-bold text-[var(--color-text-primary)]">
                      {selectedCategoryDisplay.name}
                    </div>
                    {selectedCategoryDisplay.parent && (
                      <div className="text-[11px] text-[var(--color-text-muted)] font-medium mt-0.5">
                        {selectedCategoryDisplay.parent.name}
                      </div>
                    )}
                  </div>
                  <Check size={16} style={{ color: accentColor }} />
                </motion.button>
              )}

              {/* Expanded picker */}
              <AnimatePresence>
                {showCategoryPicker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="p-3 rounded-2xl border"
                      style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                    >
                      <CategoryPicker
                        categories={categories}
                        selectedId={categoryId}
                        onSelect={handleCategorySelect}
                        type={type}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Details grid */}
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-widest text-blue-500">Chi tiết</p>

              {/* Note */}
              <div
                className="flex items-start gap-3 p-4 rounded-2xl border focus-within:border-blue-500/50 transition-all"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
              >
                <FileText size={16} className="text-[var(--color-text-muted)] mt-0.5 shrink-0" />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú..."
                  rows={2}
                  className="bg-transparent text-[14px] font-medium outline-none w-full resize-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                />
              </div>

              {/* Date */}
              <div
                className="flex items-center gap-3 p-4 rounded-2xl border focus-within:border-blue-500/50 transition-all"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
              >
                <CalendarDays size={16} className="text-[var(--color-text-muted)] shrink-0" />
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent text-[14px] font-medium outline-none w-full text-[var(--color-text-primary)]"
                />
              </div>

              {/* Wallet — Custom Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowWalletPicker((v) => !v)}
                  className="flex items-center gap-3 p-4 w-full rounded-2xl border text-left transition-all"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderColor: showWalletPicker ? 'rgba(59,130,246,0.5)' : 'var(--color-border)',
                  }}
                >
                  <Wallet size={16} className="text-[var(--color-text-muted)] shrink-0" />
                  <span className="flex-1 text-[14px] font-medium text-[var(--color-text-primary)]">
                    {selectedWallet ? (
                      <span className="flex items-center gap-2">
                        <span>{selectedWallet.icon}</span>
                        <span>{selectedWallet.name}</span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">Chọn ví (tùy chọn)</span>
                    )}
                  </span>
                  <ChevronDown
                    size={16}
                    className="text-[var(--color-text-muted)] transition-transform"
                    style={{ transform: showWalletPicker ? 'rotate(180deg)' : 'rotate(0)' }}
                  />
                </button>

                <AnimatePresence>
                  {showWalletPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      className="absolute left-0 right-0 mt-2 z-20 rounded-2xl border shadow-2xl overflow-hidden"
                      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                    >
                      {/* No wallet option */}
                      <button
                        type="button"
                        onClick={() => {
                          setWalletId('');
                          setShowWalletPicker(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-bold transition-colors hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]"
                      >
                        <span className="w-7 h-7 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-base border border-[var(--color-border)]">
                          —
                        </span>
                        Không chọn ví
                        {!walletId && <Check size={14} className="ml-auto text-blue-500" />}
                      </button>
                      <div className="h-px mx-3" style={{ background: 'var(--color-border)' }} />
                      {wallets?.map((w: any) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => {
                            setWalletId(w.id);
                            setShowWalletPicker(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-bold transition-colors hover:bg-[var(--color-bg-secondary)]"
                        >
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-base"
                            style={{
                              background: `${w.color || '#3b82f6'}15`,
                              border: `1px solid ${w.color || '#3b82f6'}25`,
                            }}
                          >
                            {w.icon || '💳'}
                          </span>
                          <div className="flex-1 text-left">
                            <div className="text-[var(--color-text-primary)]">{w.name}</div>
                            <div className="text-[11px] text-[var(--color-text-muted)] font-medium">
                              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(w.balance)}
                            </div>
                          </div>
                          {walletId === w.id && <Check size={14} className="text-blue-500" />}
                        </button>
                      ))}
                      <div className="h-px mx-3" style={{ background: 'var(--color-border)' }} />
                      <button
                        type="button"
                        onClick={() => {
                          setShowWalletForm(true);
                          setShowWalletPicker(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3.5 text-[13px] font-bold transition-colors hover:bg-blue-500/5 text-blue-500"
                      >
                        <Plus size={16} /> Thêm ví mới
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="submit"
              disabled={isPending || !categoryId || parseAmount(amount) <= 0}
              className={`relative w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black text-[15px] transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]`}
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${isExpense ? '#f43f5e' : '#14b8a6'})`,
                boxShadow: `0 8px 24px ${accentColor}30`,
              }}
            >
              {isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : expense ? (
                <>
                  <Save size={18} /> Lưu thay đổi
                </>
              ) : (
                <>
                  <Plus size={18} /> Thêm giao dịch
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Inline Wallet Form */}
      <AnimatePresence>{showWalletForm && <WalletForm onClose={() => setShowWalletForm(false)} />}</AnimatePresence>
    </div>
  );
}
