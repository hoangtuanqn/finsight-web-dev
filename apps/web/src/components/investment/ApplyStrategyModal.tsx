import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Save, X } from 'lucide-react';
import { useState } from 'react';

const SENTIMENT_LABEL_VI: Record<string, string> = {
  EXTREME_FEAR: 'Sợ hãi cực độ',
  FEAR: 'Sợ hãi',
  NEUTRAL: 'Trung lập',
  GREED: 'Tham lam',
  EXTREME_GREED: 'Tham lam cực độ',
};

const FIELDS = [
  { key: 'savings', label: 'Tiết kiệm', color: '#10b981' },
  { key: 'gold', label: 'Vàng', color: '#f59e0b' },
  { key: 'stocks', label: 'Cổ phiếu VN', color: '#3b82f6' },
  { key: 'stocks_us', label: 'Cổ phiếu Mỹ', color: '#ef4444' },
  { key: 'bonds', label: 'Trái phiếu', color: '#8b5cf6' },
  { key: 'crypto', label: 'Crypto', color: '#f97316' },
];

interface ApplyStrategyModalProps {
  strategy: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function ApplyStrategyModal({ strategy, onClose, onSave }: ApplyStrategyModalProps) {
  const [values, setValues] = useState<any>({
    savings: strategy.savings,
    gold: strategy.gold,
    stocks: strategy.stocks,
    stocks_us: strategy.stocks_us || 0,
    bonds: strategy.bonds,
    crypto: strategy.crypto,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const total = Object.values(values).reduce((a, b) => (a as number) + Number(b), 0) as number;
  const isValid = Math.abs(total - 100) <= 0.5;

  const handleChange = (key: string, val: string) => {
    setValues((prev: any) => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await onSave({ ...values, notes, sourceStrategyId: strategy.id });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-black text-white text-base">Áp dụng vào chiến lược của tôi</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Chiến lược AI ngày {new Date(strategy.createdAt).toLocaleDateString('vi-VN')} •{' '}
          {SENTIMENT_LABEL_VI[strategy.sentimentLabel] || strategy.sentimentLabel}
        </p>

        <div className="space-y-3 mb-4">
          {FIELDS.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm text-slate-300 w-28">{label}</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-sm text-slate-400 w-6">%</span>
            </div>
          ))}
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 ${isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
        >
          {isValid ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <AlertCircle size={14} className="text-red-400" />
          )}
          <span className={`text-xs font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
            Tổng: {total.toFixed(1)}% {isValid ? '✓' : '- phải bằng 100%'}
          </span>
        </div>

        <textarea
          placeholder="Ghi chú cá nhân (tuỳ chọn)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Lưu chiến lược của tôi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
