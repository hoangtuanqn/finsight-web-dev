import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, BookOpen, CheckCircle2, Save, Target } from 'lucide-react';
import { useEffect, useState } from 'react';

const FIELDS = [
  { key: 'savings', label: 'Tiết kiệm', color: '#10b981' },
  { key: 'gold', label: 'Vàng', color: '#f59e0b' },
  { key: 'stocks', label: 'Cổ phiếu VN', color: '#3b82f6' },
  { key: 'stocks_us', label: 'Cổ phiếu Mỹ', color: '#ef4444' },
  { key: 'bonds', label: 'Trái phiếu', color: '#8b5cf6' },
  { key: 'crypto', label: 'Crypto', color: '#f97316' },
];

interface MyPortfolioSectionProps {
  portfolio: any;
  onUpdate: (data: any) => Promise<void>;
}

export default function MyPortfolioSection({ portfolio, onUpdate }: MyPortfolioSectionProps) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (portfolio) {
      setValues({
        savings: portfolio.savings,
        gold: portfolio.gold,
        stocks: portfolio.stocks,
        stocks_us: portfolio.stocks_us || 0,
        bonds: portfolio.bonds,
        crypto: portfolio.crypto,
      });
      setNotes(portfolio.notes || '');
    }
  }, [portfolio]);

  const total = values ? (Object.values(values).reduce((a, b) => (a as number) + Number(b), 0) as number) : 0;
  const isValid = Math.abs(total - 100) <= 0.5;

  if (!portfolio) {
    return (
      <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-8 text-center">
        <BookOpen size={32} className="mx-auto mb-3 text-slate-500" />
        <p className="text-slate-400 text-sm mb-1 font-medium">Chưa có chiến lược cá nhân</p>
        <p className="text-slate-500 text-xs">Nhấn "Áp dụng" trên một chiến lược AI để bắt đầu</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await onUpdate({ ...values, notes });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 shadow-[0_4px_30px_rgba(59,130,246,0.08)]">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-black text-white text-sm flex items-center gap-2">
            <Target size={16} className="text-blue-400" />
            Chiến lược của tôi
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cập nhật {new Date(portfolio.updatedAt).toLocaleDateString('vi-VN')}
            {portfolio.sourceStrategy && (
              <> • Dựa trên AI ngày {new Date(portfolio.sourceStrategy.createdAt).toLocaleDateString('vi-VN')}</>
            )}
          </p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="px-3 py-1.5 text-xs font-bold rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 transition-colors"
        >
          {editing ? 'Huỷ' : 'Chỉnh sửa'}
        </button>
      </div>

      <div className="grid grid-cols-5 gap-2 mb-4">
        {FIELDS.map(({ key, label, color }) => (
          <div key={key} className="text-center">
            <div className="w-full h-1.5 rounded-full mb-2" style={{ background: `${color}30` }}>
              <div className="h-full rounded-full" style={{ background: color, width: `${values?.[key] || 0}%` }} />
            </div>
            <div className="font-black text-lg" style={{ color }}>
              {values?.[key] || 0}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 pt-4 space-y-3">
              {FIELDS.map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs text-slate-400 w-24">{label}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={values?.[key] || 0}
                    onChange={(e) =>
                      setValues((prev: any) => ({
                        ...prev,
                        [key]: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-blue-500/50"
                  />
                  <span className="text-xs text-slate-400 w-4">%</span>
                </div>
              ))}

              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
              >
                {isValid ? (
                  <CheckCircle2 size={13} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={13} className="text-red-400" />
                )}
                <span className={`text-xs font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  Tổng: {total.toFixed(1)}% {isValid ? '' : '- phải bằng 100%'}
                </span>
              </div>

              <textarea
                placeholder="Ghi chú cá nhân..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
              />

              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {portfolio.notes && !editing && (
        <p className="mt-3 text-xs text-slate-400 italic border-t border-white/5 pt-3">"{portfolio.notes}"</p>
      )}
    </div>
  );
}
