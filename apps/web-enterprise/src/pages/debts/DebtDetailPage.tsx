import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, ChevronRight, CreditCard, Download, History, Info, Layers, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../../api';
import DebtAuditTrail from '../../components/debts/DebtAuditTrail';
import DebtStatusActions from '../../components/debts/DebtStatusActions';
import { RecordPaymentModal } from '../../components/debts/RecordPaymentModal';

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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-bold hover:bg-slate-800 transition-all">
            <Download size={16} /> Xuất PDF
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
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Calendar size={20} />
                </div>
                <h2 className="text-lg font-bold text-white">Lịch trình thanh toán</h2>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                {debt.schedules?.length} kỳ hạn
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-950/30 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-4 text-left">Kỳ</th>
                    <th className="px-8 py-4 text-left">Ngày đến hạn</th>
                    <th className="px-8 py-4 text-left">Gốc</th>
                    <th className="px-8 py-4 text-left">Lãi</th>
                    <th className="px-8 py-4 text-left">Tổng</th>
                    <th className="px-8 py-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {debt.schedules?.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-8 py-4 text-xs font-bold text-slate-500">{s.period}</td>
                      <td className="px-8 py-4 text-xs font-medium text-slate-300">
                        {new Date(s.dueDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-8 py-4 text-xs font-mono text-slate-300">
                        {formatCurrency(s.principalAmount)}
                      </td>
                      <td className="px-8 py-4 text-xs font-mono text-slate-300">{formatCurrency(s.interestAmount)}</td>
                      <td className="px-8 py-4 text-xs font-black text-white">{formatCurrency(s.totalAmount)}</td>
                      <td className="px-8 py-4 text-right">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${
                            s.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                <History size={20} />
              </div>
              <h2 className="text-lg font-bold text-white">Lịch sử giao dịch</h2>
            </div>
            <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
              {debt.transactions?.length > 0 ? (
                debt.transactions.map((t: any) => (
                  <div
                    key={t.id}
                    className={`p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl relative transition-all group ${
                      t.type === 'REVERSAL' ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          t.type === 'PAYMENT'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : t.type === 'REVERSAL'
                              ? 'bg-red-500/10 text-red-500'
                              : t.type === 'PENALTY'
                                ? 'bg-rose-500/10 text-rose-500'
                                : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {t.type === 'PENALTY' ? <Info size={14} /> : <CreditCard size={14} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">{t.type}</p>
                          <span className="text-[10px] text-slate-500 font-medium font-mono">
                            {new Date(t.paidAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          className={`text-sm font-black font-mono ${
                            t.type === 'REVERSAL'
                              ? 'text-red-400'
                              : t.type === 'PENALTY'
                                ? 'text-rose-400'
                                : 'text-white'
                          }`}
                        >
                          {t.type === 'PENALTY' ? '+' : ''}
                          {formatCurrency(t.amount)}
                        </p>
                        <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                            {t.type === 'PENALTY' ? 'Nợ gốc duy trì' : 'Dư nợ sau GD'}
                          </p>
                          <p className="text-[10px] text-emerald-500 font-mono font-bold">
                            {formatCurrency(t.balanceSnapshot)}
                          </p>
                        </div>
                        {t.notes && <p className="text-[10px] text-slate-500 mt-2 italic line-clamp-2">"{t.notes}"</p>}

                        {/* Action buttons on hover */}
                        {t.type === 'PAYMENT' &&
                          !debt.transactions.some((rt: any) => rt.reversesTransactionId === t.id) && (
                            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                              <button
                                onClick={() => handleReverse(t.id)}
                                disabled={isReversing === t.id}
                                className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10 transition-colors"
                              >
                                {isReversing === t.id ? 'Đang xử lý...' : 'Đảo bút toán'}
                              </button>
                            </div>
                          )}
                        {t.type === 'REVERSAL' && (
                          <div className="mt-2 text-[8px] text-red-500/70 font-black uppercase tracking-widest bg-red-500/5 inline-block px-2 py-0.5 rounded border border-red-500/10">
                            Đã hủy giao dịch gốc
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center">
                  <Info size={24} className="mx-auto text-slate-800 mb-2" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chưa có giao dịch</p>
                </div>
              )}
            </div>
          </div>
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
