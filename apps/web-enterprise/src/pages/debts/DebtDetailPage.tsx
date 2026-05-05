import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, FileSpreadsheet, Info, Layers, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';
import DebtAuditTrail from '../../components/debts/DebtAuditTrail';
import DebtStatusActions from '../../components/debts/DebtStatusActions';
import { RecordPaymentModal } from '../../components/debts/RecordPaymentModal';
import { RepaymentScheduleTable } from '../../components/debts/RepaymentScheduleTable';
import { TransactionHistoryList } from '../../components/debts/TransactionHistoryList';
import { exportDebtToExcel } from '../../utils/excelExport';

export default function DebtDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [debt, setDebt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReversing, setIsReversing] = useState<string | null>(null);

  useEffect(() => {
    fetchDebt();
  }, [id]);

  const fetchDebt = async () => {
    try {
      const res = await (enterpriseAuthAPI as any).getDebt(id);
      if (res.data.success) {
        setDebt(res.data.data);
      }
    } catch (err) {
      toast.error('Không thể tải chi tiết khoản nợ');
      navigate('/debts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReverse = async (transactionId: string) => {
    const reason = window.prompt('Nhập lý do đảo ngược giao dịch:');
    if (!reason) return;

    setIsReversing(transactionId);
    try {
      await enterpriseAuthAPI.reverseTransaction(transactionId, reason);
      toast.success('Đã đảo ngược giao dịch');
      fetchDebt();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Thao tác thất bại');
    } finally {
      setIsReversing(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (isLoading) return <div className="p-20 text-center text-slate-500">Đang tải chi tiết hồ sơ...</div>;
  if (!debt) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-20 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/debts')}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">
              <span>Hồ sơ nợ</span>
              <ChevronRight size={10} />
              <span className="text-emerald-500">{debt.internalCode}</span>
            </div>
            <h1 className="text-2xl font-black text-white">{debt.party?.name}</h1>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                debt.status === 'ACTIVE'
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  : debt.status === 'OVERDUE'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : debt.status === 'PAID'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : debt.status === 'DISPUTED'
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
              }`}
            >
              {debt.status}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportDebtToExcel(debt)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" /> Xuất Excel
          </button>
          {['ACTIVE', 'PARTIAL', 'OVERDUE'].includes(debt.status) && (
            <button
              onClick={() => setIsPaymentModalOpen(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-xs font-black rounded-xl hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
            >
              Ghi nhận thanh toán
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left Content: Summary & Schedule ── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Dư nợ gốc còn lại</p>
              <h3 className="text-xl font-black text-white font-mono">{formatCurrency(debt.outstanding)}</h3>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                Phạt chưa thanh toán
              </p>
              <h3
                className={`text-xl font-black font-mono ${debt.unpaidPenalty > 0 ? 'text-rose-500' : 'text-slate-500'}`}
              >
                {formatCurrency(debt.unpaidPenalty)}
              </h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gốc ban đầu</p>
                  <h3 className="text-xl font-black text-white font-mono">{formatCurrency(debt.principal)}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                    Phương thức lãi
                  </p>
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-tight">{debt.interestMethod}</h3>
                </div>
              </div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 flex justify-between items-center">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                  Tổng phạt tích lũy
                </p>
                <h3 className="text-xl font-black text-white font-mono">{formatCurrency(debt.totalPenaltyAccrued)}</h3>
              </div>
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl">
                <Info size={20} />
              </div>
            </div>
          </div>

          {/* Debt Actions */}
          <DebtStatusActions debt={debt} onUpdate={fetchDebt} onRecordPayment={() => setIsPaymentModalOpen(true)} />

          {/* Repayment Schedule */}
          <RepaymentScheduleTable schedules={debt.schedules} formatCurrency={formatCurrency} />

          <DebtAuditTrail debtId={debt.id} />
        </div>

        {/* ── Right Content: Party & Transactions ── */}
        <div className="space-y-8">
          {/* Party Info */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <User size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Đối tác</h2>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tên tổ chức</p>
                <p className="text-sm font-bold text-white">{debt.party?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Mã định danh</p>
                <p className="text-sm font-mono text-slate-300">{debt.party?.internalCode}</p>
              </div>
              {debt.guarantor && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Layers size={12} /> Bên bảo lãnh
                  </p>
                  <p className="text-xs font-bold text-amber-200/80">{debt.guarantor.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transaction History */}
          <TransactionHistoryList
            transactions={debt.transactions}
            formatCurrency={formatCurrency}
            onReverse={handleReverse}
            isReversing={isReversing}
            canReverse={true}
          />
        </div>
      </div>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        debt={debt}
        onSuccess={fetchDebt}
      />
    </motion.div>
  );
}
