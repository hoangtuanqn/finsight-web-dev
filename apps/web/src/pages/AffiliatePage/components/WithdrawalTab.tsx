import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { referralAPI } from '../../../api';
import { useKycStatus } from '../../../hooks/useKycQuery';

function formatVND(amount: number) {
  return amount.toLocaleString('vi-VN') + 'đ';
}

function WithdrawalStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; icon: any; className: string }> = {
    PENDING: { label: 'Chờ xử lý', icon: Clock, className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    APPROVED: {
      label: 'Đã duyệt',
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    },
    REJECTED: { label: 'Bị từ chối', icon: X, className: 'bg-rose-500/10 text-rose-500 border-rose-500/20' },
  };
  const c = config[status] || config['PENDING'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${c.className}`}
    >
      <c.icon size={11} /> {c.label}
    </span>
  );
}

interface WithdrawalTabProps {
  stats: any;
}

export default function WithdrawalTab({ stats }: WithdrawalTabProps) {
  const queryClient = useQueryClient();
  const [showAddBank, setShowAddBank] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isBankFocused, setIsBankFocused] = useState(false);

  const { data: kyc } = useKycStatus();

  const { data: banksData } = useQuery({
    queryKey: ['banks-list'],
    queryFn: async () => {
      const res = await referralAPI.getBanks();
      return res.data.data.banks as any[];
    },
    staleTime: Infinity,
  });

  const { data: bankAccountsData, isLoading: loadingAccounts } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const res = await referralAPI.getBankAccounts();
      return res.data.data.bankAccounts as any[];
    },
  });

  const { data: withdrawalsData, isLoading: loadingWithdrawals } = useQuery({
    queryKey: ['withdrawal-history'],
    queryFn: async () => {
      const res = await referralAPI.getWithdrawalHistory();
      return res.data.data.withdrawals as any[];
    },
  });

  const addBankMutation = useMutation({
    mutationFn: (data: any) => referralAPI.addBankAccount(data),
    onSuccess: () => {
      toast.success('Đã thêm tài khoản ngân hàng!');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      setShowAddBank(false);
      setSelectedBankCode('');
      setAccountNumber('');
      setAccountName('');
      setBankSearch('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Không thể thêm tài khoản');
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: (id: string) => referralAPI.deleteBankAccount(id),
    onSuccess: () => {
      toast.success('Đã xóa tài khoản ngân hàng');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Không thể xóa');
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => referralAPI.setDefaultBankAccount(id),
    onSuccess: () => {
      toast.success('Đã đặt làm tài khoản mặc định');
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (data: any) => referralAPI.requestWithdrawal(data),
    onSuccess: () => {
      toast.success('Đã gửi yêu cầu rút tiền! Hệ thống sẽ xử lý trong 1–3 ngày làm việc.');
      queryClient.invalidateQueries({ queryKey: ['withdrawal-history'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-stats-v2'] });
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      setSelectedBankAccountId('');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Không thể gửi yêu cầu rút tiền');
    },
  });

  const filteredBanks = (banksData || []).filter(
    (b: any) =>
      b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
      b.code.toLowerCase().includes(bankSearch.toLowerCase()),
  );

  const selectedBank = (banksData || []).find((b: any) => b.code === selectedBankCode);
  const availableBalance = stats?.availableBalance || 0;
  const bankAccounts = bankAccountsData || [];
  const withdrawals = withdrawalsData || [];

  return (
    <div className="space-y-8">
      {/* KYC Banner */}
      {kyc?.kycStatus !== 'VERIFIED' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="text-sm font-bold text-amber-500">Yêu cầu xác minh danh tính</h4>
              <p className="text-[13px] text-amber-500/80 mt-1">
                Bạn cần hoàn thành xác minh danh tính (eKYC) trước khi có thể thêm tài khoản ngân hàng và rút tiền.
              </p>
            </div>
          </div>
          <Link
            to="/kyc"
            className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl whitespace-nowrap hover:bg-amber-600 transition-colors"
          >
            Xác minh ngay
          </Link>
        </div>
      )}

      <div
        className="relative rounded-3xl p-6 border overflow-hidden"
        style={{ background: 'var(--color-bg-card)', borderColor: '#3b82f620' }}
      >
        <div
          className="absolute top-0 left-6 right-6 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,#3b82f660,transparent)' }}
        />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">
              Số dư khả dụng
            </p>
            <p className="text-4xl font-black text-blue-500">{formatVND(availableBalance)}</p>
            {(stats?.pendingWithdrawalAmount || 0) > 0 && (
              <p className="text-[12px] text-amber-500 font-bold mt-1 flex items-center gap-1">
                <Clock size={12} /> {formatVND(stats.pendingWithdrawalAmount)} đang chờ xử lý
              </p>
            )}
          </div>
          <button
            onClick={() => setShowWithdrawForm(true)}
            disabled={availableBalance < 50000 || bankAccounts.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Banknote size={18} /> Yêu cầu rút tiền
          </button>
        </div>
        {availableBalance < 50000 && (
          <div className="mt-4 flex items-center gap-2 text-[12px] text-[var(--color-text-muted)] font-medium bg-[var(--color-bg-secondary)] px-4 py-2.5 rounded-xl border border-[var(--color-border)]">
            <AlertCircle size={14} className="text-amber-500 shrink-0" />
            Số dư tối thiểu để rút là 50.000đ
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-black text-[var(--color-text-primary)] flex items-center gap-2">
            <CreditCard size={18} className="text-blue-500" /> Tài khoản ngân hàng
          </h3>
          <button
            onClick={() => setShowAddBank(!showAddBank)}
            disabled={kyc?.kycStatus !== 'VERIFIED'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-[12px] font-black hover:bg-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Thêm tài khoản
          </button>
        </div>

        <AnimatePresence>
          {showAddBank && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="bg-[var(--color-bg-card)] border border-blue-500/30 rounded-2xl p-6 space-y-4">
                <h4 className="font-black text-sm text-[var(--color-text-primary)]">Thêm tài khoản ngân hàng mới</h4>

                <div>
                  <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">
                    Chọn ngân hàng
                  </label>
                  <div className="relative mb-2">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
                    />
                    <input
                      type="text"
                      value={bankSearch}
                      onFocus={() => setIsBankFocused(true)}
                      onBlur={() => setTimeout(() => setIsBankFocused(false), 200)}
                      onChange={(e) => setBankSearch(e.target.value)}
                      placeholder="Chọn hoặc tìm ngân hàng..."
                      className=" w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-text-muted)]">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>

                  {/* Bank dropdown list - Show when focused and no bank selected */}
                  {isBankFocused && !selectedBankCode && (
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl divide-y divide-[var(--color-border)] z-10 relative">
                      {filteredBanks.map((bank: any) => (
                        <button
                          key={bank.code}
                          onClick={() => {
                            setSelectedBankCode(bank.code);
                            setBankSearch(bank.shortName);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500/5 transition-colors text-left group"
                        >
                          <div className="w-10 h-10 bg-white rounded-lg p-1 border border-[var(--color-border)] group-hover:border-blue-500/30 transition-all shrink-0 flex items-center justify-center">
                            <img
                              src={bank.logo}
                              alt={bank.shortName}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[var(--color-text-primary)] truncate">
                              {bank.shortName}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">{bank.name}</p>
                          </div>
                        </button>
                      ))}
                      {filteredBanks.length === 0 && (
                        <p className="px-4 py-6 text-sm text-[var(--color-text-muted)] text-center italic font-medium">
                          Không tìm thấy ngân hàng
                        </p>
                      )}
                    </div>
                  )}

                  {selectedBank && (
                    <div className="flex items-center gap-3 mt-2 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 animate-in fade-in slide-in-from-top-1 duration-300">
                      <div className="w-10 h-10 bg-white rounded-lg p-1 border border-blue-500/20 shrink-0 flex items-center justify-center">
                        <img
                          src={selectedBank.logo}
                          alt={selectedBank.shortName}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-blue-500 truncate">{selectedBank.shortName}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] truncate">{selectedBank.name}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedBankCode('');
                          setBankSearch('');
                        }}
                        className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">
                      Số tài khoản
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="VD: 1234567890"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">
                      Tên chủ tài khoản
                    </label>
                    <input
                      type="text"
                      value={kyc?.kycName || ''}
                      disabled
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-mono text-[var(--color-text-primary)] outline-none transition-colors uppercase opacity-70 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() =>
                      addBankMutation.mutate({ bankCode: selectedBankCode, accountNumber, accountName: kyc?.kycName })
                    }
                    disabled={!selectedBankCode || !accountNumber || !kyc?.kycName || addBankMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all disabled:opacity-50"
                  >
                    {addBankMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Lưu tài khoản
                  </button>
                  <button
                    onClick={() => setShowAddBank(false)}
                    className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loadingAccounts ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : bankAccounts.length === 0 ? (
          <div className="text-center py-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)]">
            <CreditCard className="w-10 h-10 text-[var(--color-text-muted)] opacity-20 mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)] font-bold text-sm">
              Chưa có tài khoản ngân hàng nào. Thêm để có thể rút tiền!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bankAccounts.map((acc: any) => (
              <motion.div
                key={acc.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  acc.isDefault
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-card)]'
                }`}
              >
                {acc.bankLogo && (
                  <img
                    src={acc.bankLogo}
                    alt={acc.bankShortName}
                    className="w-10 h-10 object-contain rounded-xl shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-black text-sm text-[var(--color-text-primary)]">{acc.bankShortName}</p>
                    {acc.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase tracking-wider">
                        <Star size={9} fill="currentColor" /> Mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-mono text-[var(--color-text-secondary)]">{acc.accountNumber}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase">{acc.accountName}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!acc.isDefault && (
                    <button
                      onClick={() => setDefaultMutation.mutate(acc.id)}
                      disabled={setDefaultMutation.isPending}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-black border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-blue-500 hover:border-blue-500/30 transition-all"
                    >
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    onClick={() => deleteBankMutation.mutate(acc.id)}
                    disabled={deleteBankMutation.isPending}
                    className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showWithdrawForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowWithdrawForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[var(--color-bg-card)] rounded-3xl p-8 border border-[var(--color-border)] w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-[var(--color-text-primary)]">Yêu cầu rút tiền</h3>
                <button
                  onClick={() => setShowWithdrawForm(false)}
                  className="p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">
                    Tài khoản nhận
                  </label>
                  <select
                    value={selectedBankAccountId}
                    onChange={(e) => setSelectedBankAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="">-- Chọn tài khoản --</option>
                    {bankAccounts.map((acc: any) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankShortName} · {acc.accountNumber} ({acc.accountName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2 block">
                    Số tiền rút (khả dụng: <span className="text-blue-500">{formatVND(availableBalance)}</span>)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Tối thiểu 50.000đ"
                    min={50000}
                    max={availableBalance}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-text-primary)] outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-[12px] text-[var(--color-text-secondary)] leading-relaxed font-medium">
                  ⏱️ Yêu cầu rút tiền sẽ được xử lý trong <strong>1–3 ngày làm việc</strong>.
                </div>

                <button
                  onClick={() =>
                    withdrawMutation.mutate({
                      bankAccountId: selectedBankAccountId,
                      amount: parseFloat(withdrawAmount),
                    })
                  }
                  disabled={
                    !selectedBankAccountId ||
                    !withdrawAmount ||
                    parseFloat(withdrawAmount) < 50000 ||
                    withdrawMutation.isPending
                  }
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
                  Gửi yêu cầu rút {withdrawAmount ? formatVND(parseFloat(withdrawAmount)) : ''}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h3 className="font-black text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
          <Banknote size={18} className="text-blue-500" /> Lịch sử rút tiền
        </h3>
        {loadingWithdrawals ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)]">
            <Banknote className="w-10 h-10 text-[var(--color-text-muted)] opacity-20 mx-auto mb-3" />
            <p className="text-[var(--color-text-muted)] font-bold text-sm italic">Chưa có yêu cầu rút tiền nào</p>
          </div>
        ) : (
          <div className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--color-bg-secondary)]/50 border-b border-[var(--color-border)]">
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                    Ngân hàng
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                    Số tiền
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-right">
                    Ngày gửi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-[var(--color-bg-secondary)]/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {w.bankAccount?.bankLogo && (
                          <img src={w.bankAccount.bankLogo} alt="" className="w-8 h-8 object-contain rounded" />
                        )}
                        <div>
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">
                            {w.bankAccount?.bankShortName}
                          </p>
                          <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                            {w.bankAccount?.accountNumber}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-[var(--color-text-primary)]">
                      {formatVND(w.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <WithdrawalStatusBadge status={w.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-[11px] text-[var(--color-text-muted)] font-medium">
                      {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
