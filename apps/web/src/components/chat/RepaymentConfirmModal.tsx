import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, TrendingDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { agenticAPI } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { useUpdateProfile } from '../../hooks/useAuthQuery';

interface RepaymentConfirmModalProps {
  data: unknown;
  onDismiss: () => void;
  onFeedback?: (status: 'confirmed' | 'cancelled' | 'failed', reason?: string) => void;
}

type Strategy = 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM';

const STRATEGY_LABELS: Record<Strategy, { label: string; desc: string; color: string }> = {
  AVALANCHE: {
    label: 'Avalanche',
    desc: 'Trả nợ lãi suất cao nhất trước',
    color: '#f97316',
  },
  SNOWBALL: {
    label: 'Snowball',
    desc: 'Trả khoản nợ nhỏ nhất trước',
    color: '#06b6d4',
  },
  CUSTOM: {
    label: 'Tùy chỉnh',
    desc: 'Thiết lập thứ tự trả nợ riêng',
    color: '#8b5cf6',
  },
};

export default function RepaymentConfirmModal({ data, onDismiss, onFeedback }: RepaymentConfirmModalProps) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth() as any;
  const updateProfile = useUpdateProfile();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse incoming data (supports both raw object and nested)
  const src: Record<string, any> = typeof data === 'object' && data !== null ? (data as Record<string, any>) : {};

  const [form, setForm] = useState({
    extraBudget: '',
    targetDate: '',
    strategy: '' as Strategy | '',
  });

  useEffect(() => {
    setForm({
      extraBudget: src.extraBudget != null ? String(src.extraBudget) : '',
      targetDate: src.targetDate ?? '',
      strategy: (src.strategy as Strategy) ?? '',
    });
  }, [src.extraBudget, src.targetDate, src.strategy]);

  const formatVND = (v: string) => {
    const num = Number(v);
    return isNaN(num) || num === 0 ? '' : num.toLocaleString('vi-VN') + 'đ';
  };

  const validate = (): string | null => {
    if (!+form.extraBudget || +form.extraBudget <= 0) return 'Số tiền trả thêm mỗi tháng phải lớn hơn 0.';
    if (form.targetDate && isNaN(Date.parse(form.targetDate))) return 'Ngày mong muốn kết thúc không hợp lệ.';
    if (form.targetDate && new Date(form.targetDate) <= new Date()) return 'Ngày mong muốn kết thúc phải ở tương lai.';
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
      // 1. Update the repayment plan setup
      await agenticAPI.repaymentSetup({
        extraBudget: +form.extraBudget,
        targetDate: form.targetDate || null,
        strategy: (form.strategy as Strategy) || null,
      });

      // 2. Sync to user profile so it reflects in CustomRepaymentPlanPage and other places
      const res = await updateProfile.mutateAsync({
        extraBudget: +form.extraBudget,
      });

      // 3. Update global auth state
      const updatedUser = res.data.data.user || res.data.user || res.data.data;
      setUser((prev: any) => ({ ...prev, ...updatedUser }));

      onFeedback?.('confirmed');
      onDismiss();
      // Navigate with slight delay so user sees the modal close
      setTimeout(() => {
        navigate('/debts/repayment');
      }, 300);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Lỗi khi lưu kế hoạch trả nợ. Vui lòng thử lại.';
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
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-500/10">
                <TrendingDown className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ color: 'var(--color-text-primary)' }}>
                  Xác nhận kế hoạch trả nợ
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Kiểm tra và điều chỉnh trước khi lưu
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
              {/* Extra budget */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Số tiền trả thêm mỗi tháng (VNĐ) <span className="text-rose-400">*</span>
                </label>
                <input
                  id="repayment-extra-budget"
                  type="number"
                  value={form.extraBudget}
                  onChange={(e) => setForm((p) => ({ ...p, extraBudget: e.target.value }))}
                  placeholder="VD: 2000000"
                  min="0"
                  className={inputCls}
                  style={inputStyle}
                />
                {+form.extraBudget > 0 && (
                  <p className="text-[10px] mt-1 text-emerald-400">{formatVND(form.extraBudget)}</p>
                )}
              </div>

              {/* Target date (optional) */}
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                  Ngày mong muốn kết thúc{' '}
                  <span style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>(không bắt buộc)</span>
                </label>
                <input
                  id="repayment-target-date"
                  type="date"
                  value={form.targetDate}
                  min={new Date(Date.now() + 86_400_000).toISOString().split('T')[0]}
                  onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
                  className={inputCls}
                  style={inputStyle}
                />
              </div>

              {/* Strategy (optional) */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Chiến lược trả nợ{' '}
                  <span style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>(không bắt buộc)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(STRATEGY_LABELS) as [Strategy, (typeof STRATEGY_LABELS)[Strategy]][]).map(
                    ([key, { label, desc, color }]) => {
                      const active = form.strategy === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, strategy: active ? '' : key }))}
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

              {/* Info note */}
              <div
                className="p-3 rounded-xl text-xs"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                💡 Sau khi xác nhận, bạn sẽ được chuyển đến trang kế hoạch trả nợ để xem chi tiết mô phỏng.
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
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-medium bg-cyan-600 hover:bg-cyan-700 text-white transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Xác nhận kế hoạch
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
