import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X, AlertTriangle } from 'lucide-react';
import { debtAPI } from '../../api/index.js';

export default function DebtConfirmModal({ data, onConfirm, onDismiss }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!data) return null;

  const parsed = typeof data === 'string' ? (() => { try { return JSON.parse(data); } catch { return null; } })() : data;

  const debtInfo = parsed?.parsedData || parsed || {};

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await debtAPI.create({
        name: debtInfo.name || 'Khoản vay mới',
        originalAmount: debtInfo.originalAmount || 0,
        balance: debtInfo.originalAmount || 0,
        apr: debtInfo.apr || 0,
        termMonths: debtInfo.termMonths || 12,
        remainingTerms: debtInfo.termMonths || 12,
        minPayment: Math.round((debtInfo.originalAmount || 0) / (debtInfo.termMonths || 12)),
        platform: debtInfo.name || 'Khác',
        dueDay: 15,
      });
      window.dispatchEvent(new Event('Finsight:DebtUpdated')); // Trigger refresh across components
      onConfirm?.();
    } catch (err) {
      setError('Lỗi khi lưu khoản nợ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const formatVND = (v) => {
    const num = Number(v);
    return isNaN(num) ? v : num.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-[90%] max-w-sm rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
        >
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Xác nhận khoản nợ mới</h3>
            </div>
            <button onClick={onDismiss} className="p-1.5 rounded-full hover:bg-slate-500/10 transition-colors" style={{ color: 'var(--color-text-secondary)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4">
            <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              AI đã trích xuất thông tin sau từ tin nhắn của bạn. Vui lòng kiểm tra và xác nhận:
            </p>

            <div className="space-y-2.5 p-3 rounded-xl" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
              {debtInfo.name && (
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  <span className="opacity-70">Tổ chức tín dụng:</span>
                  <span className="font-semibold">{debtInfo.name}</span>
                </div>
              )}
              {debtInfo.originalAmount && (
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  <span className="opacity-70">Số tiền vay:</span>
                  <span className="font-bold text-rose-400">{formatVND(debtInfo.originalAmount)}</span>
                </div>
              )}
              {debtInfo.apr && (
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  <span className="opacity-70">Lãi suất APR:</span>
                  <span className="font-semibold">{debtInfo.apr}%</span>
                </div>
              )}
              {debtInfo.termMonths && (
                <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-primary)' }}>
                  <span className="opacity-70">Kỳ hạn:</span>
                  <span className="font-semibold">{debtInfo.termMonths} tháng</span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-rose-400 mt-2">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 pt-0 flex gap-2">
            <button
              onClick={onDismiss}
              className="flex-1 py-2 rounded-xl text-xs font-medium transition-colors"
              style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2 rounded-xl text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Xác nhận lưu</>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
