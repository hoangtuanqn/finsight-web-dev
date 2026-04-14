import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { formatVND, formatPercent } from '../../utils/calculations';
import EARBreakdown from '../../components/debt/EARBreakdown';
import { PageSkeleton } from '../../components/common/LoadingSpinner';

export default function DebtDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payForm, setPayForm] = useState({ amount: 0, notes: '' });
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  const load = () => {
    setLoading(true);
    debtAPI.getById(id)
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  };

  useEffect(() => { load(); }, [id]);

  const handlePayment = async (e) => {
    e.preventDefault();
    setPaying(true);
    setPaySuccess(false);
    try {
      await debtAPI.logPayment(id, payForm);
      setPayForm({ amount: 0, notes: '' });
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!data) return (
    <div className="text-center py-20">
      <p className="text-3xl mb-3">😕</p>
      <p className="text-slate-500">Không tìm thấy khoản nợ</p>
      <Link to="/debts" className="btn-primary mt-4 inline-block">← Quay lại</Link>
    </div>
  );

  const { debt, earBreakdown, paymentHistory } = data;
  const paidPercent = ((debt.originalAmount - debt.balance) / debt.originalAmount * 100).toFixed(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/debts" className="text-slate-500 hover:text-slate-300 transition-colors">Quản lý nợ</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">{debt.name}</span>
      </div>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-white">{debt.name}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {debt.platform} • {debt.rateType === 'FLAT' ? 'Lãi phẳng' : 'Dư nợ giảm dần'}
          </p>
        </div>
        
        <Link 
          to={`/debts/${id}/edit`} 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[13px] font-medium text-slate-300 hover:bg-white/[0.1] hover:text-white transition-all shadow-sm"
        >
          <span>✏️</span> Chỉnh sửa
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Dư nợ', value: formatVND(debt.balance), color: '#ef4444' },
              { label: 'APR', value: formatPercent(debt.apr), color: '#3b82f6' },
              { label: 'EAR thực tế', value: formatPercent(debt.ear), color: '#ef4444' },
              { label: 'Còn lại', value: `${debt.remainingTerms} kỳ`, color: '#94a3b8' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card text-center py-3"
              >
                <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
                <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Progress */}
          <div className="glass-card">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400">Tiến trình trả nợ</span>
              <span className="text-sm font-semibold text-blue-400">{paidPercent}%</span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(2, paidPercent)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600 mt-2">
              <span>Đã trả: {formatVND(debt.originalAmount - debt.balance)}</span>
              <span>Gốc: {formatVND(debt.originalAmount)}</span>
            </div>
          </div>

          {/* EAR Breakdown */}
          <EARBreakdown breakdown={earBreakdown} />

          {/* Payment History */}
          <div className="glass-card">
            <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <span>📜</span> Lịch sử thanh toán
            </h3>
            {paymentHistory?.length > 0 ? (
              <div className="space-y-1">
                {paymentHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                    <div>
                      <p className="text-sm font-medium text-green-400">{formatVND(p.amount)}</p>
                      <p className="text-[11px] text-slate-600">{new Date(p.paidAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    {p.notes && <p className="text-[12px] text-slate-500">{p.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600 text-center py-4">Chưa có thanh toán nào</p>
            )}
          </div>
        </div>

        {/* Sidebar — Payment */}
        <div>
          <div className="glass-card sticky top-8">
            <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <span>💰</span> Ghi nhận thanh toán
            </h3>

            {paySuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 mb-4 text-sm text-green-400">
                ✅ Ghi nhận thành công!
              </div>
            )}

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="input-label">Số tiền</label>
                <input type="number" className="input-field" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: +e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">Ghi chú</label>
                <input className="input-field" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Tuỳ chọn" />
              </div>
              <button type="submit" disabled={paying} className="btn-primary w-full">
                {paying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang xử lý...
                  </span>
                ) : 'Ghi nhận'}
              </button>
            </form>

            <div className="h-px bg-white/[0.06] my-5" />

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Gốc ban đầu</span>
                <span className="text-slate-300">{formatVND(debt.originalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Đã trả</span>
                <span className="text-green-400">{formatVND(debt.originalAmount - debt.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ngày đáo hạn</span>
                <span className="text-slate-300">Ngày {debt.dueDay} hàng tháng</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
