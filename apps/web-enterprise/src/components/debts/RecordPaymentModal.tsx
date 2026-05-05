import { Button } from '@repo/ui/button';
import { AlertCircle, Calendar, CheckCircle2, CreditCard, DollarSign, FileText, Hash, Info, X } from 'lucide-react';
import React, { useState } from 'react';
import { enterpriseAuthAPI } from '../../api';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: any;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, debt, onSuccess }) => {
  const [formData, setFormData] = useState({
    amount: '',
    paidAt: new Date().toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    reference: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Số tiền thanh toán phải lớn hơn 0');
      }

      const totalObligation = (debt.outstanding || 0) + (debt.unpaidPenalty || 0);

      if (amount > totalObligation + 0.01) {
        throw new Error(`Số tiền thanh toán không được vượt quá tổng nghĩa vụ (${totalObligation.toLocaleString()}đ)`);
      }

      await enterpriseAuthAPI.recordPayment(debt.id, {
        ...formData,
        amount,
        paidAt: new Date(formData.paidAt),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-emerald-500/10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-linear-to-r dark:from-slate-900 dark:to-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Ghi Nhận Thanh Toán</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-black uppercase tracking-widest">
              HỒ SƠ: {debt.internalCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 dark:text-rose-400 text-sm font-bold animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Quick Info */}
          <div className="p-5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest">
                Dư nợ gốc
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                {formatCurrency(debt.outstanding)}
              </p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest">
                Phạt chưa trả
              </p>
              <p
                className={`text-sm font-black font-mono ${debt.unpaidPenalty > 0 ? 'text-rose-500' : 'text-slate-400'}`}
              >
                {formatCurrency(debt.unpaidPenalty || 0)}
              </p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black uppercase tracking-widest">
                Tổng cần trả
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-500 font-mono">
                {formatCurrency((debt.outstanding || 0) + (debt.unpaidPenalty || 0))}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <Info size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
            </div>
            <p className="text-[11px] text-blue-600 dark:text-blue-400/80 leading-relaxed font-semibold">
              Hệ thống áp dụng cơ chế <b className="text-blue-700 dark:text-blue-300">Waterfall</b>: Tiền thanh toán sẽ
              ưu tiên trừ vào <b className="text-blue-700 dark:text-blue-300">Phạt</b> trước, sau đó mới đến{' '}
              <b className="text-blue-700 dark:text-blue-300">Gốc</b>.
            </p>
          </div>

          <div className="space-y-5">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest ml-1">
                Số tiền thanh toán
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                  <DollarSign size={18} />
                </div>
                <input
                  required
                  type="number"
                  placeholder="0.00"
                  className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-mono text-lg focus:border-blue-500 focus:outline-none transition-all shadow-inner"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest ml-1">
                  Ngày thanh toán
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none">
                    <Calendar size={18} />
                  </div>
                  <input
                    required
                    type="date"
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all"
                    value={formData.paidAt}
                    onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  />
                </div>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest ml-1">
                  Phương thức
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors pointer-events-none">
                    <CreditCard size={18} />
                  </div>
                  <select
                    className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all appearance-none"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="OFFSET">Bù trừ công nợ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest ml-1">
                Số tham chiếu (Mã GD/Số phiếu)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                  <Hash size={18} />
                </div>
                <input
                  placeholder="Ví dụ: FT230123456"
                  className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 dark:text-slate-500 font-black uppercase tracking-widest ml-1">
                Ghi chú
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors">
                  <FileText size={18} />
                </div>
                <textarea
                  placeholder="Thông tin thêm về thanh toán..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[100px] text-sm text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none transition-all resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95"
            >
              HỦY BỎ
            </button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  XÁC NHẬN
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
