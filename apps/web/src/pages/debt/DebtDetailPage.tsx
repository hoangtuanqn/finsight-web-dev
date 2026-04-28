import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebt, useDebtMutations } from '../../hooks/useDebtQuery';
import { formatVND, formatPercent } from '../../utils/calculations';
import EARBreakdown from '../../components/debt/EARBreakdown';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { Pencil, FileText, DollarSign, CheckCircle, ArrowLeft, Search, Trash2, ChevronRight, Calendar, AlertTriangle } from 'lucide-react';
import { generateGoogleCalendarLink } from '../../utils/calendar';
import DebtFluctuationChart from '../../components/debt/DebtFluctuationChart';

const paymentSchema = z.object({
  amount: z.number().positive('Số tiền phải lớn hơn 0 ₫'),
  notes: z.string().optional()
});

export default function DebtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useDebt(id!) as { data: any, isLoading: boolean };
  const { deleteDebt, restoreDebt, logPayment, isDeleting, isRestoring, isLogging } = useDebtMutations() as any;

  const [paySuccess, setPaySuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: { amount: 0, notes: '' } as any
  });

  const handleDelete = async (reason: string | undefined, isCommitted: boolean | undefined) => {
    try {
      await deleteDebt({ id: id!, data: { reason, isCommitted } });
      navigate('/debts');
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmDelete(false);
    }
  };

  const onPaymentSubmit = async (formData: any) => {
    if (formData.amount > data.debt.balance) {
      toast.error(`Số tiền không được vượt quá ${formatVND(data.debt.balance)}`);
      return;
    }

    try {
      await logPayment({ id: id!, data: formData });
      reset();
      setPaySuccess(true);
      setTimeout(() => setPaySuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <PageSkeleton />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center">
        <Search size={28} className="text-slate-500" />
      </div>
      <p className="text-[var(--color-text-muted)] font-medium">Không tìm thấy khoản nợ</p>
      <Link to="/debts" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all cursor-pointer">
        <ArrowLeft size={15} /> Quay lại
      </Link>
    </div>
  );

  const { debt, earBreakdown, paymentHistory } = data;
  const paidPercent = ((debt.originalAmount - debt.balance) / debt.originalAmount * 100).toFixed(0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setConfirmDelete(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm rounded-3xl border overflow-hidden text-center p-7"
            style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(239,68,68,0.25)' }}
            onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 20px rgba(239,68,68,0.2)' }}>
              <Trash2 size={24} className="text-red-400" />
            </div>
            <h3 className="text-[16px] font-black text-[var(--color-text-primary)] mb-2">Chuyển vào thùng rác?</h3>
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-4 leading-relaxed">
              Khoản nợ <strong className="text-[var(--color-text-primary)]">"{debt.name}"</strong> sẽ được chuyển vào thùng rác và tự động xoá vĩnh viễn sau 30 ngày.
            </p>

            {debt.balance > 0 && (
              <div className="text-left mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Lý do xoá khoản nợ này?"
                  className="w-full px-3 py-2 rounded-lg text-sm border bg-[var(--color-bg-secondary)] border-[var(--color-border)] outline-none focus:border-red-500/50"
                  id="deleteReason"
                />
                <label className="flex items-start gap-2 text-xs text-[var(--color-text-muted)] cursor-pointer">
                  <input type="checkbox" id="deleteCommit" className="mt-0.5" />
                  <span>Tôi hiểu việc xoá khoản nợ đang vay sẽ làm sai lệch phân tích DTI và EAR.</span>
                </label>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2.5 rounded-xl text-[13px] font-bold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer">Hủy</button>
              <button onClick={() => {
                const reason = document.getElementById('deleteReason')?.value;
                const isCommitted = document.getElementById('deleteCommit')?.checked;
                
                if (debt.balance > 0 && (!reason || !isCommitted)) {
                  toast.error('Vui lòng nhập lý do và xác nhận rủi ro');
                  return;
                }
                
                handleDelete(reason, isCommitted);
              }} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl text-[13px] font-black bg-red-500 hover:bg-red-400 text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                {isDeleting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</> : <><Trash2 size={14} /> Xoá nợ</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[12px] font-medium pt-2">
        <Link to="/debts" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer">Quản lý nợ</Link>
        <ChevronRight size={13} className="text-[var(--color-border)]" />
        <span className="text-[var(--color-text-primary)]">{debt.name}</span>
      </div>

      {debt.deletedAt && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-sm font-semibold text-amber-500">
          <AlertTriangle size={18} />
          Khoản nợ này đang nằm trong thùng rác và sẽ bị xóa vĩnh viễn sau 30 ngày.
        </div>
      )}

      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/8 text-red-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <FileText size={11} /> Chi tiết khoản nợ
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">{debt.name}</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">{debt.platform} • {debt.rateType === 'FLAT' ? 'Lãi phẳng' : 'Dư nợ giảm dần'}</p>
        </div>
        <div className="flex items-center gap-2">
          {debt.deletedAt ? (
            <button onClick={async () => {
              await restoreDebt(id);
              toast.success('Đã khôi phục khoản nợ');
            }}
              disabled={isRestoring}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-amber-500 hover:bg-amber-400 text-white transition-all cursor-pointer">
              {isRestoring ? 'Đang khôi phục...' : 'Khôi phục khoản nợ'}
            </button>
          ) : (
            <>
              <a
                href={generateGoogleCalendarLink({
                  name: debt.name,
                  amount: debt.minPayment,
                  dueDay: debt.dueDay,
                  platform: debt.platform,
                  id: debt.id
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold border border-blue-500/20 bg-blue-500/5 text-blue-400 hover:bg-blue-500/10 transition-all cursor-pointer"
                title="Thêm nhắc nhở vào Google Calendar"
              >
                <Calendar size={14} /> Đặt lịch nhắc nợ
              </a>
              <Link to={`/debts/${id}/edit`}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all cursor-pointer">
                <Pencil size={14} /> Chỉnh sửa
              </Link>
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 transition-all cursor-pointer">
                <Trash2 size={14} /> Xóa
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Dư nợ', value: formatVND(debt.balance), color: '#ef4444', gradient: 'from-red-500 to-rose-400' },
              { label: 'APR', value: formatPercent(debt.apr), color: '#3b82f6', gradient: 'from-blue-500 to-cyan-400' },
              { label: 'EAR thực tế', value: formatPercent(debt.ear), color: '#ef4444', gradient: 'from-red-500 to-rose-400' },
              { label: 'Còn lại', value: `${debt.remainingTerms} kỳ`, color: '#94a3b8', gradient: 'from-slate-400 to-slate-500' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="relative rounded-2xl p-4 border overflow-hidden text-center"
                style={{ background: 'var(--color-bg-card)', borderColor: `${item.color}20`, boxShadow: `0 4px 16px ${item.color}06` }}>
                <div className="absolute top-0 left-3 right-3 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}50,transparent)` }} />
                <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">{item.label}</p>
                <p className={`text-base font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl border p-5 relative overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}>
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="flex justify-between items-center mb-3">
              <span className="text-[13px] font-black text-[var(--color-text-primary)]">Tiến trình trả nợ</span>
              <span className="text-[13px] font-black text-blue-400">{paidPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, paidPercent)}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
            </div>
            <div className="flex justify-between text-[11px] text-[var(--color-text-muted)] mt-2">
              <span>Đã trả: {formatVND(debt.originalAmount - debt.balance)}</span>
              <span>Gốc: {formatVND(debt.originalAmount)}</span>
            </div>
          </div>

          <EARBreakdown breakdown={earBreakdown} />
          
          <DebtFluctuationChart data={data.chartData} />

          <div className="rounded-3xl border p-5" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <FileText size={15} className="text-blue-400" /> Lịch sử thanh toán
            </h3>
            {paymentHistory?.length > 0 ? (
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {paymentHistory.map(p => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-[13px] font-black text-emerald-400">{formatVND(p.amount)}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">{new Date(p.paidAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    {p.notes && <p className="text-[12px] text-[var(--color-text-secondary)]">{p.notes}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có thanh toán nào</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-3xl border p-5 sticky top-24 relative overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(16,185,129,0.15)' }}>
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              <DollarSign size={15} className="text-emerald-400" /> Ghi nhận thanh toán
            </h3>

            {paySuccess && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-[12px] font-bold text-emerald-400 mb-4">
                <CheckCircle size={14} /> Ghi nhận thành công!
              </div>
            )}

            {debt.deletedAt ? (
              <div className="py-6 text-center">
                <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">
                  Bạn không thể ghi nhận thanh toán cho khoản nợ trong thùng rác.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onPaymentSubmit)} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">Số tiền</label>
                  <input
                    type="number"
                    placeholder="0"
                    className={`w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-sm outline-none focus:border-emerald-500/60 transition-colors ${errors.amount ? 'border-red-500/60 focus:border-red-500' : 'border-[var(--color-border)]'}`}
                    {...register('amount', { valueAsNumber: true })}
                  />
                  {errors.amount && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.amount.message}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5">Ghi chú</label>
                  <input
                    placeholder="Tuỳ chọn"
                    className="w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] text-sm outline-none focus:border-emerald-500/60 transition-colors"
                    {...register('notes')}
                  />
                </div>
                <button type="submit" disabled={isLogging}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition-all shadow-lg shadow-emerald-500/25 cursor-pointer disabled:opacity-60">
                  {isLogging ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang xử lý...</> : 'Ghi nhận'}
                </button>
              </form>
            )}

            <div className="h-px my-5" style={{ background: 'var(--color-border)' }} />

            <div className="space-y-2.5">
              {[
                { label: 'Gốc ban đầu', value: formatVND(debt.originalAmount), vColor: 'var(--color-text-primary)' },
                { label: 'Đã trả', value: formatVND(debt.originalAmount - debt.balance), vColor: '#34d399' },
                { label: 'Ngày đáo hạn', value: `Ngày ${debt.dueDay} hàng tháng`, vColor: 'var(--color-text-primary)' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-[12px]">
                  <span className="text-[var(--color-text-muted)]">{r.label}</span>
                  <span className="font-bold" style={{ color: r.vColor }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
