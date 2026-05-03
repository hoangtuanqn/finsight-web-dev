import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart3, CheckCircle2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useUpdateProfile } from '../../hooks/useAuthQuery';

interface InvestmentConfirmModalProps {
  data: unknown;
  onDismiss: () => void;
  onFeedback?: (status: 'confirmed' | 'cancelled' | 'failed', reason?: string) => void;
}

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

const RISK_LABELS: Record<RiskLevel, { label: string; desc: string; color: string }> = {
  LOW: { label: 'Thấp', desc: 'An toàn, ưu tiên bảo toàn vốn', color: '#22c55e' },
  MEDIUM: { label: 'Trung bình', desc: 'Cân bằng tăng trưởng & an toàn', color: '#f59e0b' },
  HIGH: { label: 'Cao', desc: 'Chấp nhận rủi ro, tối đa lợi nhuận', color: '#ef4444' },
};

function formatVND(v: number | null | undefined): string {
  if (v == null) return '';
  return v.toLocaleString('vi-VN') + 'đ';
}

export default function InvestmentConfirmModal({ data, onDismiss, onFeedback }: InvestmentConfirmModalProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const src: Record<string, any> = typeof data === 'object' && data !== null ? (data as Record<string, any>) : {};

  const { user, setUser } = useAuth() as any;
  const updateProfile = useUpdateProfile();

  const [form, setForm] = useState({
    monthlyIncome: '',
    capital: '',
    riskLevel: '' as RiskLevel | '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm({
      monthlyIncome: src.monthlyIncome != null ? String(src.monthlyIncome) : '',
      capital: src.capital != null ? String(src.capital) : '',
      riskLevel: (src.riskLevel as RiskLevel) ?? '',
    });
  }, [src.monthlyIncome, src.capital, src.riskLevel]);

  const quota: number | null = src.strategyQuotaRemaining ?? null;

  const validate = (): string | null => {
    if (!+form.monthlyIncome || +form.monthlyIncome <= 0) return 'Vui lòng nhập thu nhập hàng tháng hợp lệ.';
    if (!+form.capital || +form.capital <= 0) return 'Vui lòng nhập số vốn đầu tư hợp lệ.';
    if (!form.riskLevel) return 'Vui lòng chọn khẩu vị rủi ro.';
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
      const res = await updateProfile.mutateAsync({
        monthlyIncome: +form.monthlyIncome,
        capital: +form.capital,
        riskLevel: form.riskLevel,
      });

      // Update global auth state to sync across pages (like ProfilePage)
      const updatedUser = res.data.data.user || res.data.user || res.data.data;
      setUser((prev: any) => ({ ...prev, ...updatedUser }));

      // Quota is NOT decremented here — that's backend's job when generating.
      onFeedback?.('confirmed');
      onDismiss();
      setTimeout(() => {
        navigate('/investment');
      }, 300);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Lỗi khi cập nhật hồ sơ. Vui lòng thử lại.';
      setError(msg);
      const safeReason = msg.length > 120 ? msg.slice(0, 120) : msg;
      onFeedback?.('failed', safeReason);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    onFeedback?.('cancelled');
    onDismiss();
  };

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all';
  const inputStyle = {
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text-primary)',
    border: '1px solid var(--color-border)',
  };

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
          style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-5 flex items-center justify-between border-b flex-shrink-0"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                  Xác nhận tư vấn đầu tư
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Kiểm tra thông tin trước khi xem chiến lược
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-full hover:bg-slate-500/10 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
            <div className="space-y-4">
              {/* Quota badge */}
              {quota != null && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                  style={{
                    background: quota > 0 ? 'var(--color-bg-secondary)' : 'rgba(239,68,68,0.08)',
                    border: `1px solid ${quota > 0 ? 'var(--color-border)' : 'rgba(239,68,68,0.25)'}`,
                    color: quota > 0 ? 'var(--color-text-secondary)' : '#ef4444',
                  }}
                >
                  {quota > 0 ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      <span>
                        Còn <strong className="text-emerald-400">{quota}</strong> lượt tạo chiến lược AI
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Đã hết lượt tạo chiến lược. Nâng cấp tài khoản để nhận thêm lượt.</span>
                    </>
                  )}
                </div>
              )}

              {/* Monthly income */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Thu nhập hàng tháng (VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="investment-monthly-income"
                  type="number"
                  value={form.monthlyIncome}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyIncome: e.target.value }))}
                  placeholder="VD: 20000000"
                  min="0"
                  className={inputCls}
                  style={inputStyle}
                />
                {+form.monthlyIncome > 0 && (
                  <p className="text-[10px] mt-1 text-emerald-400">{formatVND(+form.monthlyIncome)}</p>
                )}
              </div>

              {/* Capital */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Số vốn đầu tư (VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="investment-capital"
                  type="number"
                  value={form.capital}
                  onChange={(e) => setForm((p) => ({ ...p, capital: e.target.value }))}
                  placeholder="VD: 50000000"
                  min="0"
                  className={inputCls}
                  style={inputStyle}
                />
                {+form.capital > 0 && <p className="text-[10px] mt-1 text-emerald-400">{formatVND(+form.capital)}</p>}
              </div>

              {/* Risk level */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Khẩu vị rủi ro <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(RISK_LABELS) as [RiskLevel, (typeof RISK_LABELS)[RiskLevel]][]).map(
                    ([key, { label, desc, color }]) => {
                      const active = form.riskLevel === key;
                      return (
                        <button
                          key={key}
                          id={`investment-risk-${key.toLowerCase()}`}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, riskLevel: key }))}
                          className="px-2 py-2.5 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1 border"
                          style={{
                            borderColor: active ? color : 'transparent',
                            background: active ? `${color}18` : 'var(--color-bg-secondary)',
                            color: active ? color : 'var(--color-text-secondary)',
                          }}
                        >
                          <span className="font-semibold">{label}</span>
                          <span className="text-[9px] font-normal opacity-70 text-center leading-tight">{desc}</span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Disclaimer */}
              <div
                className="p-3 rounded-xl text-xs"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                ⚠️ Chiến lược đầu tư AI là gợi ý tham khảo, không phải lời khuyên tài chính chính thức. Bạn chịu trách
                nhiệm về quyết định đầu tư của mình.
              </div>
            </div>

            {error && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 pt-0 flex gap-3 flex-shrink-0">
            <button
              onClick={handleDismiss}
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Hủy bỏ
            </button>
            <button
              id="investment-confirm-btn"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Xem chiến lược
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
