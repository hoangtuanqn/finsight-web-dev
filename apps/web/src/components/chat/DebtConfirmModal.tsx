import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { debtAPI } from '../../api/index';

export default function DebtConfirmModal({ data, onConfirm, onDismiss }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFees, setShowFees] = useState(false);

  // Parse incoming data
  const parsed = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;
  const debtInfo = parsed?.parsedData || parsed || {};

  // Editable form state — initialized from AI-parsed data
  const [form, setForm] = useState({
    name: '',
    originalAmount: '',
    balance: '',
    apr: '',
    termMonths: '',
    minPayment: '',
    startDate: '',
    dueDay: '',
    feeProcessing: '0',
    feeInsurance: '0',
    feeManagement: '0',
    rateType: 'REDUCING',
    notes: '',
  });

  // Initialize form from debtInfo on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const amt = debtInfo.originalAmount || 0;
    const term = debtInfo.termMonths || 12;

    setForm({
      name: debtInfo.name || '',
      originalAmount: amt ? String(amt) : '',
      balance: debtInfo.balance ? String(debtInfo.balance) : (amt ? String(amt) : ''),
      apr: debtInfo.apr !== undefined && debtInfo.apr !== null ? String(debtInfo.apr) : '',
      termMonths: term ? String(term) : '',
      minPayment: debtInfo.minPayment ? String(debtInfo.minPayment) : (amt && term ? String(Math.round(amt / term)) : ''),
      startDate: debtInfo.startDate || today,
      dueDay: debtInfo.dueDay ? String(debtInfo.dueDay) : '15',
      feeProcessing: debtInfo.feeProcessing ? String(debtInfo.feeProcessing) : '0',
      feeInsurance: debtInfo.feeInsurance ? String(debtInfo.feeInsurance) : '0',
      feeManagement: debtInfo.feeManagement ? String(debtInfo.feeManagement) : '0',
      rateType: debtInfo.rateType || 'REDUCING',
      notes: debtInfo.notes || '',
    });
  }, []);

  const updateField = (field, value) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-calculate minPayment when originalAmount or termMonths changes
      if (field === 'originalAmount' || field === 'termMonths') {
        const amt = field === 'originalAmount' ? +value : +prev.originalAmount;
        const term = field === 'termMonths' ? +value : +prev.termMonths;
        if (amt > 0 && term > 0 && !prev._manualMinPayment) {
          next.minPayment = String(Math.round(amt / term));
        }
      }
      // Auto-sync balance with originalAmount if balance hasn't been manually edited
      if (field === 'originalAmount' && !prev._manualBalance) {
        next.balance = value;
      }
      return next;
    });
  };

  // Validation
  const validate = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên tổ chức tín dụng.';
    if (!+form.originalAmount || +form.originalAmount <= 0) return 'Số tiền gốc phải lớn hơn 0.';
    if (!+form.balance || +form.balance <= 0) return 'Dư nợ hiện tại phải lớn hơn 0.';
    if (+form.balance > +form.originalAmount) return 'Dư nợ không được lớn hơn số tiền gốc.';
    if (form.apr === '' || +form.apr < 0) return 'Lãi suất APR không hợp lệ.';
    if (+form.apr > 100) return 'Lãi suất APR không được vượt quá 100%.';
    if (!+form.termMonths || +form.termMonths <= 0) return 'Kỳ hạn phải lớn hơn 0.';
    if (!+form.minPayment || +form.minPayment <= 0) return 'Số tiền trả tối thiểu/tháng phải lớn hơn 0.';
    if (+form.minPayment > +form.balance) return 'Số tiền trả tối thiểu không được lớn hơn dư nợ.';
    if (!form.startDate) return 'Vui lòng chọn ngày vay.';
    if (new Date(form.startDate) > new Date()) return 'Ngày vay không được ở tương lai.';
    if (!+form.dueDay || +form.dueDay < 1 || +form.dueDay > 31) return 'Ngày đáo hạn phải từ 1 đến 31.';
    return null;
  };

  const handleConfirm = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await debtAPI.create({
        name: form.name.trim(),
        originalAmount: +form.originalAmount,
        balance: +form.balance,
        apr: +form.apr,
        termMonths: +form.termMonths,
        minPayment: +form.minPayment,
        startDate: form.startDate,
        dueDay: +form.dueDay,
        platform: form.name.trim(),
        feeProcessing: +form.feeProcessing || 0,
        feeInsurance: +form.feeInsurance || 0,
        feeManagement: +form.feeManagement || 0,
        rateType: form.rateType,
        notes: form.notes || null,
      });
      window.dispatchEvent(new Event('Finsight:DebtUpdated'));
      onConfirm?.();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Lỗi khi lưu khoản nợ. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (v) => {
    const num = Number(v);
    return isNaN(num) || num === 0 ? '' : num.toLocaleString('vi-VN') + 'đ';
  };

  if (!data) return null;

  // Render as portal to escape chat window constraints
  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-amber-500/10">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>Xác nhận khoản nợ mới</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Kiểm tra và chỉnh sửa trước khi lưu</p>
              </div>
            </div>
            <button onClick={onDismiss} className="p-2 rounded-full hover:bg-slate-500/10 transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="space-y-4">
              {/* Tên tổ chức tín dụng */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Tên tổ chức tín dụng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="VD: Vietcombank, FE Credit..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Row: Số tiền gốc + Dư nợ */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Số tiền gốc (VNĐ) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.originalAmount}
                    onChange={(e) => updateField('originalAmount', e.target.value)}
                    placeholder="10000000"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                  {+form.originalAmount > 0 && (
                    <p className="text-[10px] mt-1 text-emerald-400">{formatVND(form.originalAmount)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Dư nợ hiện tại (VNĐ) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.balance}
                    onChange={(e) => {
                      updateField('balance', e.target.value);
                      setForm(prev => ({ ...prev, _manualBalance: true }));
                    }}
                    placeholder="10000000"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                  {+form.balance > 0 && (
                    <p className="text-[10px] mt-1 text-emerald-400">{formatVND(form.balance)}</p>
                  )}
                </div>
              </div>

              {/* Row: APR + Kỳ hạn */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Lãi suất APR (%) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.apr}
                    onChange={(e) => updateField('apr', e.target.value)}
                    placeholder="12"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Kỳ hạn (tháng) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.termMonths}
                    onChange={(e) => updateField('termMonths', e.target.value)}
                    placeholder="12"
                    min="1"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              {/* Row: Min payment + Ngày đáo hạn */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Trả tối thiểu/tháng (VNĐ) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.minPayment}
                    onChange={(e) => {
                      updateField('minPayment', e.target.value);
                      setForm(prev => ({ ...prev, _manualMinPayment: true }));
                    }}
                    placeholder="833333"
                    min="0"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                  {+form.minPayment > 0 && (
                    <p className="text-[10px] mt-1 text-emerald-400">{formatVND(form.minPayment)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                    Ngày đáo hạn (1-31) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={form.dueDay}
                    onChange={(e) => updateField('dueDay', e.target.value)}
                    placeholder="15"
                    min="1"
                    max="31"
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>

              {/* Ngày vay */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Ngày bắt đầu vay <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              </div>

              {/* Loại lãi suất */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('rateType', 'REDUCING')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 border ${form.rateType === 'REDUCING' ? 'border-emerald-500 bg-emerald-500/10' : 'border-transparent bg-slate-500/10'}`}
                  style={{ color: form.rateType === 'REDUCING' ? '#34d399' : 'var(--color-text-secondary)' }}
                >
                  <span className={form.rateType === 'REDUCING' ? 'text-emerald-400 font-bold' : ''}>Dư nợ giảm dần</span>
                  <span className="text-[10px] opacity-60 font-normal">REDUCING</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('rateType', 'FLAT')}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 border ${form.rateType === 'FLAT' ? 'border-amber-500 bg-amber-500/10' : 'border-transparent bg-slate-500/10'}`}
                  style={{ color: form.rateType === 'FLAT' ? '#fbbf24' : 'var(--color-text-secondary)' }}
                >
                  <span className={form.rateType === 'FLAT' ? 'text-amber-400 font-bold' : ''}>Lãi suất phẳng</span>
                  <span className="text-[10px] opacity-60 font-normal">FLAT</span>
                </button>
              </div>

              {/* Collapsible: Phí ẩn */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  onClick={() => setShowFees(!showFees)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-xs font-medium transition-colors hover:opacity-80"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  <span>📋 Phí ẩn (không bắt buộc)</span>
                  {showFees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <AnimatePresence>
                  {showFees && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 space-y-3" style={{ background: 'var(--color-bg-secondary)' }}>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phí xử lý (%)</label>
                            <input
                              type="number"
                              value={form.feeProcessing}
                              onChange={(e) => updateField('feeProcessing', e.target.value)}
                              min="0" max="100" step="0.1"
                              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                              style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phí bảo hiểm (%)</label>
                            <input
                              type="number"
                              value={form.feeInsurance}
                              onChange={(e) => updateField('feeInsurance', e.target.value)}
                              min="0" max="100" step="0.1"
                              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                              style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phí quản lý (%)</label>
                            <input
                              type="number"
                              value={form.feeManagement}
                              onChange={(e) => updateField('feeManagement', e.target.value)}
                              min="0" max="100" step="0.1"
                              className="w-full px-2 py-1.5 rounded-lg text-xs outline-none"
                              style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Ghi chú
                </label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Ghi chú thêm (không bắt buộc)"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                  style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 pt-0 flex gap-3 flex-shrink-0">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Xác nhận lưu</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  // 5.6: Render qua Portal để thoát khỏi khung chat 400x580px
  return createPortal(modalContent, document.body);
}
