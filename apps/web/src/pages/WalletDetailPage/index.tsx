import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Wallet, RefreshCw, AlertCircle } from 'lucide-react';
import { useWalletDetail } from '../../hooks/useWalletQuery';
import { useBankSyncQuery, useBankSyncMutations } from '../../hooks/useBankSyncQuery';
import { useExpenseCategories } from '../../hooks/useExpenseQuery';
import { PendingTransactionList } from '../ExpensePage/components/PendingTransactionList';
import { toast } from 'sonner';

export default function WalletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: wallet, isLoading: loadingWallet } = useWalletDetail(id);
  const { data: pendingTxs, isLoading: loadingPending } = useBankSyncQuery(id);
  const { data: categories } = useExpenseCategories();
  const { fetch } = useBankSyncMutations();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const handleManualSync = async () => {
    if (!id) return;
    fetch.mutate(id);
  };

  if (loadingWallet) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-black text-[var(--color-text-primary)]">Không tìm thấy ví</h2>
        <p className="text-[var(--color-text-muted)] mt-2">Ví này không tồn tại hoặc bạn không có quyền truy cập.</p>
        <button onClick={() => navigate('/expenses')} className="mt-6 text-blue-500 font-bold flex items-center gap-2">
          <ChevronLeft size={16} /> Quay lại
        </button>
      </div>
    );
  }

  const accentColor = wallet.color || '#3b82f6';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Back Navigation */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate('/expenses')}
          className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors font-bold text-sm"
        >
          <ChevronLeft size={18} /> Quay lại Sổ thu chi
        </button>
        
        {wallet.sepayToken && (
          <button
            onClick={handleManualSync}
            disabled={fetch.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-sm font-black hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
          >
            <RefreshCw size={16} className={fetch.isPending ? 'animate-spin' : ''} />
            {fetch.isPending ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
          </button>
        )}
      </div>

      {/* Wallet Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-6 border bg-[var(--color-bg-card)] relative overflow-hidden"
            style={{ borderColor: `${accentColor}30` }}
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-10" style={{ backgroundColor: accentColor }} />
            
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm" style={{ background: `${accentColor}15`, border: `1px solid ${accentColor}25` }}>
              {wallet.icon || '💳'}
            </div>
            
            <h1 className="text-2xl font-black text-[var(--color-text-primary)] mb-1">{wallet.name}</h1>
            <p className="text-sm font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-6">
              {wallet.type === 'BANK' ? 'Ngân hàng' : wallet.type}
            </p>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Số dư hiện tại</p>
                <p className="text-2xl font-black" style={{ color: accentColor }}>
                  {formatCurrency(wallet.balance)}
                </p>
              </div>
              
              {wallet.bankAccountNumber && (
                <div>
                  <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Số tài khoản</p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">{wallet.bankAccountNumber}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{wallet.bankBrandName}</p>
                </div>
              )}

              <div className="pt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight ${
                  wallet.sepayToken ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${wallet.sepayToken ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                  {wallet.sepayToken ? 'Đã bật đồng bộ SePay' : 'Chưa bật đồng bộ'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Transactions Section */}
        <div className="md:col-span-2">
          <div className="bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] p-6 min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-[var(--color-text-primary)]">Giao dịch chờ duyệt</h2>
                <p className="text-sm font-bold text-[var(--color-text-muted)] mt-1">Phân loại các giao dịch mới nhất từ tài khoản ngân hàng của bạn</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-secondary)] flex items-center justify-center text-blue-500">
                <RefreshCw size={20} />
              </div>
            </div>

            <PendingTransactionList
              transactions={pendingTxs || []}
              loading={loadingPending}
              categories={categories || []}
              walletId={id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
