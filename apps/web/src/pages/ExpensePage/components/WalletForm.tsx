import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Building2, Link2, Key, ChevronDown, Info, Check, Search, Zap } from 'lucide-react';
import { useWalletMutations } from '../../../hooks/useWalletQuery';
import { INPUT_CLASSES, LABEL_CLASSES } from '../constants';

const WALLET_ICONS = ['👛','💰','🏦','💳','📱','🏧','💵','🪙'];
const WALLET_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#64748b'];

const WALLET_TYPES = [
  { value: 'CASH',    label: 'Tiền mặt',   emoji: '💵', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  { value: 'BANK',    label: 'Ngân hàng',  emoji: '🏦', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
  { value: 'EWALLET', label: 'Ví điện tử', emoji: '📱', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  { value: 'OTHER',   label: 'Khác',       emoji: '🪙', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
];

const VIETNAM_BANKS = [
  { code:'Vietcombank',       name:'Vietcombank',        fullName:'Ngân hàng TMCP Ngoại thương VN' },
  { code:'VietinBank',        name:'VietinBank',         fullName:'Ngân hàng TMCP Công Thương VN' },
  { code:'BIDV',              name:'BIDV',               fullName:'Ngân hàng TMCP Đầu tư & Phát triển VN' },
  { code:'Agribank',          name:'Agribank',           fullName:'Ngân hàng Nông nghiệp & PTNT VN' },
  { code:'TPBank',            name:'TPBank',             fullName:'Ngân hàng TMCP Tiên Phong' },
  { code:'Techcombank',       name:'Techcombank',        fullName:'Ngân hàng TMCP Kỹ Thương VN' },
  { code:'MBBank',            name:'MB Bank',            fullName:'Ngân hàng TMCP Quân đội' },
  { code:'ACB',               name:'ACB',                fullName:'Ngân hàng TMCP Á Châu' },
  { code:'VPBank',            name:'VPBank',             fullName:'Ngân hàng TMCP VN Thịnh Vượng' },
  { code:'Sacombank',         name:'Sacombank',          fullName:'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code:'HDBank',            name:'HDBank',             fullName:'Ngân hàng TMCP Phát triển TP.HCM' },
  { code:'VIB',               name:'VIB',                fullName:'Ngân hàng TMCP Quốc tế VN' },
  { code:'SHB',               name:'SHB',                fullName:'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { code:'SeABank',           name:'SeABank',            fullName:'Ngân hàng TMCP Đông Nam Á' },
  { code:'MSB',               name:'MSB',                fullName:'Ngân hàng TMCP Hàng Hải VN' },
  { code:'OCB',               name:'OCB',                fullName:'Ngân hàng TMCP Phương Đông' },
  { code:'LienVietPostBank',  name:'LienVietPostBank',   fullName:'Ngân hàng TMCP Bưu điện Liên Việt' },
  { code:'NamABank',          name:'Nam A Bank',         fullName:'Ngân hàng TMCP Nam Á' },
  { code:'ABBank',            name:'ABBank',             fullName:'Ngân hàng TMCP An Bình' },
  { code:'Eximbank',          name:'Eximbank',           fullName:'Ngân hàng TMCP Xuất Nhập khẩu VN' },
  { code:'Shinhan',           name:'Shinhan Bank',       fullName:'Ngân hàng Shinhan Việt Nam' },
  { code:'HSBC',              name:'HSBC',               fullName:'Ngân hàng TNHH MTV HSBC VN' },
  { code:'CAKE',              name:'CAKE',               fullName:'Ngân hàng số CAKE by VPBank' },
  { code:'Timo',              name:'Timo',               fullName:'Timo Digital Bank' },
  { code:'Ubank',             name:'Ubank',              fullName:'Ubank by VPBank' },
];

const fmt = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

interface WalletFormProps { wallet?: any; onClose: () => void; }

export function WalletForm({ wallet, onClose }: WalletFormProps) {
  const { createWallet, updateWallet } = useWalletMutations();
  const [form, setForm] = useState({
    name: wallet?.name || '',
    type: wallet?.type || 'CASH',
    icon: wallet?.icon || '👛',
    color: wallet?.color || '#3b82f6',
    balance: wallet?.balance?.toString() || '0',
    bankName: wallet?.bankName || '',
    bankAccountNumber: wallet?.bankAccountNumber || '',
    sepayToken: wallet?.sepayToken || '',
  });
  const [syncEnabled, setSyncEnabled] = useState(!!wallet?.sepayToken);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const isBank = form.type === 'BANK';
  const activeType = WALLET_TYPES.find(t => t.value === form.type)!;
  const selectedBank = VIETNAM_BANKS.find(b => b.code === form.bankName);
  const filteredBanks = bankSearch.trim()
    ? VIETNAM_BANKS.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.fullName.toLowerCase().includes(bankSearch.toLowerCase()))
    : VIETNAM_BANKS;

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleTypeChange = (type: string) => {
    set('type', type);
    if (type !== 'BANK') { setSyncEnabled(false); setForm(f => ({ ...f, type, bankName: '', bankAccountNumber: '', sepayToken: '' })); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, balance: parseFloat(form.balance) || 0, bankName: isBank ? form.bankName || null : null, bankAccountNumber: isBank ? form.bankAccountNumber || null : null, sepayToken: isBank && syncEnabled ? form.sepayToken || null : null };
    wallet ? updateWallet.mutate({ id: wallet.id, data }, { onSuccess: onClose }) : createWallet.mutate(data, { onSuccess: onClose });
  };

  const isPending = createWallet.isPending || updateWallet.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative w-full max-w-md flex flex-col max-h-[92vh] rounded-3xl overflow-hidden"
        style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' }}
      >
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${form.color}, transparent)` }} />
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-32 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: form.color }} />

        {/* ── Header ── */}
        <div className="shrink-0 px-6 pt-6 pb-5 border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-inner" style={{ background: `${form.color}20`, border: `1px solid ${form.color}30` }}>
                {form.icon}
              </div>
              <div>
                <h2 className="text-[15px] font-black text-[var(--color-text-primary)]">{wallet ? 'Chỉnh sửa ví' : 'Thêm ví mới'}</h2>
                <p className="text-[11px] text-[var(--color-text-muted)] font-medium">{activeType.emoji} {activeType.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all">
              <X size={16} />
            </button>
          </div>

          {/* Live wallet preview card */}
          <motion.div
            animate={{ borderColor: `${form.color}40`, boxShadow: `0 4px 24px ${form.color}15` }}
            transition={{ duration: 0.3 }}
            className="relative rounded-2xl p-4 overflow-hidden border"
            style={{ background: `${form.color}08` }}
          >
            <div className="absolute top-0 left-4 right-4 h-px" style={{ background: `linear-gradient(90deg,transparent,${form.color}60,transparent)` }} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: `${form.color}99` }}>Xem trước</p>
                <p className="text-[15px] font-black text-[var(--color-text-primary)]">{form.name || 'Tên ví của bạn'}</p>
                {isBank && selectedBank && <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{selectedBank.name}</p>}
              </div>
              <div className="text-right">
                <p className="text-[18px] font-black" style={{ color: form.color }}>{fmt(parseFloat(form.balance) || 0)}</p>
                {syncEnabled && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 mt-0.5"><Zap size={9} />Đồng bộ</span>}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Scrollable body ── */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Icon & Color */}
          <div className="flex gap-5">
            <div className="flex-1">
              <label className={LABEL_CLASSES}>Biểu tượng</label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {WALLET_ICONS.map(icon => (
                  <button key={icon} type="button" onClick={() => set('icon', icon)}
                    className={`w-10 h-10 text-lg rounded-xl flex items-center justify-center transition-all duration-200 ${form.icon === icon ? 'scale-110' : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] opacity-60 hover:opacity-100'}`}
                    style={form.icon === icon ? { background: `${form.color}20`, border: `2px solid ${form.color}60` } : {}}
                  >{icon}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Màu</label>
              <div className="flex flex-col gap-1.5 mt-1.5">
                {[WALLET_COLORS.slice(0,4), WALLET_COLORS.slice(4)].map((row, ri) => (
                  <div key={ri} className="flex gap-1.5">
                    {row.map(color => (
                      <button key={color} type="button" onClick={() => set('color', color)}
                        className="w-7 h-7 rounded-full transition-all duration-200 hover:scale-110"
                        style={{ background: color, outline: form.color === color ? `2px solid ${color}` : 'none', outlineOffset: 2 }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className={LABEL_CLASSES}>Tên ví</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: TPBank, Bóp tiền mặt..." required className={INPUT_CLASSES} />
          </div>

          {/* Type selector */}
          <div>
            <label className={LABEL_CLASSES}>Loại ví</label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {WALLET_TYPES.map(opt => (
                <button key={opt.value} type="button" onClick={() => handleTypeChange(opt.value)}
                  className="flex flex-col items-center gap-1.5 py-3 rounded-2xl text-[11px] font-bold transition-all border"
                  style={form.type === opt.value
                    ? { background: opt.bg, borderColor: `${opt.color}50`, color: opt.color }
                    : { background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  <span className="text-xl">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bank fields */}
          <AnimatePresence>
            {isBank && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-4">

                {/* SePay sync card — FIRST */}
                <motion.div
                  animate={{ borderColor: syncEnabled ? 'rgba(59,130,246,0.35)' : 'var(--color-border)', background: syncEnabled ? 'rgba(59,130,246,0.06)' : 'var(--color-bg-secondary)' }}
                  transition={{ duration: 0.25 }}
                  className="rounded-2xl p-4 border"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ background: syncEnabled ? 'rgba(59,130,246,0.15)' : 'var(--color-bg-primary)' }}>
                        <Link2 size={15} className={syncEnabled ? 'text-blue-500' : 'text-[var(--color-text-muted)]'} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[var(--color-text-primary)]">Đồng bộ giao dịch</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">Tự động cập nhật qua SePay</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setSyncEnabled(v => !v); if (syncEnabled) set('sepayToken', ''); }}
                      className="relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0"
                      style={{ background: syncEnabled ? '#3b82f6' : 'var(--color-border)' }}
                    >
                      <motion.div animate={{ x: syncEnabled ? 24 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {syncEnabled && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4 space-y-3">

                        {/* Bank picker */}
                        <div>
                          <label className={LABEL_CLASSES}><Building2 size={10} className="inline mr-1" />Ngân hàng</label>
                          <div className="relative">
                            <button type="button" onClick={() => setShowBankDropdown(v => !v)}
                              className={`${INPUT_CLASSES} flex items-center justify-between text-left`}
                              style={showBankDropdown ? { borderColor: 'rgba(59,130,246,0.5)' } : {}}
                            >
                              <span className={selectedBank ? 'text-[var(--color-text-primary)] font-bold' : 'text-[var(--color-text-muted)]/40'}>
                                {selectedBank?.name ?? 'Chọn ngân hàng...'}
                              </span>
                              <ChevronDown size={15} className="text-[var(--color-text-muted)] transition-transform" style={{ transform: showBankDropdown ? 'rotate(180deg)' : '' }} />
                            </button>
                            <AnimatePresence>
                              {showBankDropdown && (
                                <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }}
                                  className="absolute left-0 right-0 mt-2 z-30 rounded-2xl border shadow-2xl overflow-hidden"
                                  style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)', maxHeight: 260 }}
                                >
                                  <div className="p-2 border-b border-[var(--color-border)] flex items-center gap-2 px-3">
                                    <Search size={13} className="text-[var(--color-text-muted)] shrink-0" />
                                    <input autoFocus value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="Tìm ngân hàng..."
                                      className="flex-1 bg-transparent text-[13px] font-medium outline-none placeholder:text-[var(--color-text-muted)]/40" />
                                  </div>
                                  <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
                                    {filteredBanks.map(bank => (
                                      <button key={bank.code} type="button" onClick={() => { setForm(f => ({ ...f, bankName: bank.code })); setShowBankDropdown(false); setBankSearch(''); }}
                                        className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-[var(--color-bg-secondary)] transition-colors"
                                      >
                                        <div className="text-left">
                                          <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{bank.name}</p>
                                          <p className="text-[10px] text-[var(--color-text-muted)]">{bank.fullName}</p>
                                        </div>
                                        {form.bankName === bank.code && <Check size={13} className="text-blue-500 shrink-0 ml-2" />}
                                      </button>
                                    ))}
                                    {filteredBanks.length === 0 && <p className="text-center text-[12px] text-[var(--color-text-muted)] py-6">Không tìm thấy ngân hàng</p>}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Account number */}
                        <div>
                          <label className={LABEL_CLASSES}>Số tài khoản</label>
                          <input value={form.bankAccountNumber} onChange={e => set('bankAccountNumber', e.target.value)} placeholder="Số tài khoản ngân hàng..." className={INPUT_CLASSES} />
                        </div>

                        {/* Token */}
                        <div>
                          <label className={LABEL_CLASSES}><Key size={10} className="inline mr-1" />API Token SePay</label>
                          <input value={form.sepayToken} onChange={e => set('sepayToken', e.target.value)} type="password" autoComplete="off"
                            placeholder="Dán token từ my.sepay.vn..." className={INPUT_CLASSES} />
                        </div>

                        {/* Guide */}
                        <div className="rounded-xl border border-blue-500/20 overflow-hidden" style={{ background: 'rgba(59,130,246,0.05)' }}>
                          <button type="button" onClick={() => setShowGuide(v => !v)} className="flex items-center gap-2 w-full px-3 py-2.5 text-left">
                            <Info size={13} className="text-blue-400 shrink-0" />
                            <span className="text-[12px] font-bold text-blue-400 flex-1">Cách lấy Token SePay</span>
                            <ChevronDown size={13} className="text-blue-400 transition-transform" style={{ transform: showGuide ? 'rotate(180deg)' : '' }} />
                          </button>
                          <AnimatePresence>
                            {showGuide && (
                              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                <div className="px-3 pb-3 space-y-1.5">
                                  {[
                                    <>Truy cập <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold">my.sepay.vn</a> và đăng nhập.</>,
                                    <>Vào <span className="font-bold text-[var(--color-text-primary)]">Cài đặt → API Token</span>.</>,
                                    <>Nhấn <span className="font-bold text-[var(--color-text-primary)]">"Tạo token mới"</span> và liên kết tài khoản ngân hàng.</>,
                                    <>Sao chép token và dán vào ô trên. Hệ thống đồng bộ mỗi <span className="font-bold text-blue-400">10 giây</span>.</>,
                                  ].map((step, i) => (
                                    <div key={i} className="flex items-start gap-2">
                                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                                      <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{step}</p>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Balance */}
          <div>
            <label className={LABEL_CLASSES}>{isBank && syncEnabled ? 'Số dư (tự động cập nhật)' : 'Số dư ban đầu'}</label>
            <div className="relative">
              <input type="number" value={form.balance} onChange={e => set('balance', e.target.value)} placeholder="0"
                min="0" readOnly={isBank && syncEnabled && !!wallet?.sepayToken}
                className={INPUT_CLASSES + ' pr-10'} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] text-sm font-black">đ</span>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isPending}
            className="relative w-full py-4 rounded-2xl text-white font-black text-[14px] overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${form.color}, ${form.color}cc)`, boxShadow: `0 8px 24px ${form.color}35` }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isPending
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                : wallet ? '✓ Cập nhật ví' : '+ Thêm ví'}
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  );
}
