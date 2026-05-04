import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { AlertCircle, Calendar, CheckCircle2, CreditCard, DollarSign, FileText, Hash, X } from 'lucide-react';
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

      if (amount > debt.outstanding) {
        throw new Error(
          `Số tiền thanh toán không được vượt quá dư nợ hiện tại (${debt.outstanding.toLocaleString()}đ)`,
        );
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-emerald-500/10">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-linear-to-r from-slate-900 to-slate-800/50">
          <div>
            <h2 className="text-xl font-black text-white">Ghi Nhận Thanh Toán</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-widest">
              Hồ sơ: {debt.internalCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Quick Info */}
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Dư nợ hiện tại</p>
              <p className="text-lg font-black text-emerald-400 font-mono">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(debt.outstanding)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Đối tác</p>
              <p className="text-sm font-bold text-white">{debt.party?.name}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                Số tiền thanh toán
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <DollarSign size={18} />
                </div>
                <Input
                  required
                  type="number"
                  placeholder="0.00"
                  className="pl-12 bg-slate-950/50 border-slate-800 rounded-2xl h-12 text-white font-mono focus:border-emerald-500/50 transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                  Ngày thanh toán
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <Calendar size={18} />
                  </div>
                  <Input
                    required
                    type="date"
                    className="pl-12 bg-slate-950/50 border-slate-800 rounded-2xl h-12 text-white focus:border-emerald-500/50 transition-all"
                    value={formData.paidAt}
                    onChange={(e) => setFormData({ ...formData, paidAt: e.target.value })}
                  />
                </div>
              </div>

              {/* Method */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                  Phương thức
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <select
                    className="w-full pl-12 pr-4 bg-slate-950/50 border border-slate-800 rounded-2xl h-12 text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all appearance-none"
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
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">
                Số tham chiếu (Mã GD/Số phiếu)
              </label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <Hash size={18} />
                </div>
                <Input
                  placeholder="Ví dụ: FT230123456"
                  className="pl-12 bg-slate-950/50 border-slate-800 rounded-2xl h-12 text-white focus:border-emerald-500/50 transition-all"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-1">Ghi chú</label>
              <div className="relative group">
                <div className="absolute left-4 top-4 text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                  <FileText size={18} />
                </div>
                <textarea
                  placeholder="Thông tin thêm về thanh toán..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl min-h-[100px] text-sm text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
            >
              Hủy bỏ
            </Button>
            <Button
              disabled={isSubmitting}
              className="flex-1 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Xác nhận
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
