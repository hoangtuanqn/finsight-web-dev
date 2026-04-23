import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Save, CheckCircle2, AlertCircle, ArrowLeft,
  BookOpen, TrendingUp, Wallet, StickyNote, Edit3, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { investmentAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { formatVND, formatPercent } from '../utils/calculations';
import { PageSkeleton } from '../components/common/LoadingSpinner';

const FIELDS = [
  { key: 'savings', label: 'Tiết kiệm',   color: '#10b981', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  { key: 'gold',    label: 'Vàng',         color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'   },
  { key: 'stocks',  label: 'Chứng khoán',  color: '#3b82f6', bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400'    },
  { key: 'bonds',   label: 'Trái phiếu',   color: '#8b5cf6', bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400'  },
  { key: 'crypto',  label: 'Crypto',       color: '#ec4899', bg: 'bg-pink-500/10',    border: 'border-pink-500/20',    text: 'text-pink-400'    },
];

export default function MyPortfolioPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [portfolio, setPortfolio] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState(false);
  const [values,    setValues]    = useState(null);
  const [notes,     setNotes]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const capital = user?.investorProfile?.capital || 0;

  // Load portfolio
  useEffect(() => {
    investmentAPI.getPortfolio()
      .then(res => {
        const p = res.data.data;
        setPortfolio(p);
        if (p) {
          setValues({ savings: p.savings, gold: p.gold, stocks: p.stocks, bonds: p.bonds, crypto: p.crypto });
          setNotes(p.notes || '');
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total   = values ? Object.values(values).reduce((a, b) => a + Number(b), 0) : 0;
  const isValid = Math.abs(total - 100) <= 0.5;

  const handleSave = useCallback(async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const res = await investmentAPI.updatePortfolio({ ...values, notes });
      setPortfolio(res.data.data);
      setEditing(false);
      toast.success('Đã cập nhật chiến lược!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  }, [isValid, values, notes]);

  if (loading) return <PageSkeleton />;

  // ── Chưa có portfolio ──────────────────────────────────────────
  if (!portfolio) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto py-24 flex flex-col items-center text-center gap-6"
      >
        <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-white/5 flex items-center justify-center">
          <BookOpen size={36} className="text-slate-500" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white mb-2">Chưa có chiến lược cá nhân</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Bạn chưa áp dụng chiến lược AI nào.
            <br />Vào trang <strong>Cố vấn đầu tư</strong>, chọn một chiến lược từ lịch sử rồi bấm <strong>"Áp dụng"</strong>.
          </p>
        </div>
        <Link
          to="/investment"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full transition-colors"
        >
          <TrendingUp size={15} />
          Đi tới Cố vấn đầu tư
        </Link>
      </motion.div>
    );
  }

  const displayValues = values || { savings: 0, gold: 0, stocks: 0, bonds: 0, crypto: 0 };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto pb-24 space-y-8"
    >
      {/* ── Header ── */}
      <header className="pt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <Link
            to="/investment"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs font-bold mb-3 transition-colors"
          >
            <ArrowLeft size={13} /> Cố vấn đầu tư
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-3">
            <Target size={11} /> Chiến lược cá nhân
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white">
            Chiến lược của tôi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Cập nhật {new Date(portfolio.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            {portfolio.sourceStrategy && (
              <> · Dựa trên AI ngày {new Date(portfolio.sourceStrategy.createdAt).toLocaleDateString('vi-VN')}</>
            )}
          </p>
        </div>
        <button
          onClick={() => { setEditing(!editing); if (editing) { setValues({ savings: portfolio.savings, gold: portfolio.gold, stocks: portfolio.stocks, bonds: portfolio.bonds, crypto: portfolio.crypto }); setNotes(portfolio.notes || ''); } }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-sm font-bold transition-colors"
        >
          {editing ? <><X size={14} /> Huỷ</> : <><Edit3 size={14} /> Chỉnh sửa</>}
        </button>
      </header>

      {/* ── Phân bổ chính — Cards % + số tiền ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {FIELDS.map(({ key, label, color, bg, border, text }) => {
          const pct    = displayValues[key] ?? 0;
          const amount = capital * pct / 100;
          return (
            <div
              key={key}
              className={`relative rounded-2xl border ${border} ${bg} p-4 flex flex-col gap-3 overflow-hidden`}
            >
              {/* Progress bar nền */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: color }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-400">{label}</span>
              <div>
                <div className={`text-3xl font-black ${text}`}>{pct}%</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  {capital > 0 ? formatVND(amount) : '—'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tổng quan danh mục ── */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <Wallet size={14} className="text-blue-400" /> Tổng quan danh mục
        </h2>
        <div className="space-y-3">
          {FIELDS.map(({ key, label, color, text }) => {
            const pct    = displayValues[key] ?? 0;
            const amount = capital * pct / 100;
            return (
              <div key={key} className="flex items-center gap-4">
                {/* Bar */}
                <div className="flex-1 flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-20 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                </div>
                {/* % */}
                <span className={`text-sm font-black w-12 text-right ${text}`}>{pct}%</span>
                {/* Số tiền */}
                <span className="text-xs text-slate-400 w-32 text-right font-medium">
                  {capital > 0 ? formatVND(amount) : '—'}
                </span>
              </div>
            );
          })}

          {/* Tổng vốn */}
          {capital > 0 && (
            <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Tổng vốn đầu tư</span>
              <span className="text-base font-black text-white">{formatVND(capital)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Ghi chú ── */}
      {portfolio.notes && !editing && (
        <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-5 flex items-start gap-3">
          <StickyNote size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-300 italic leading-relaxed">"{portfolio.notes}"</p>
        </div>
      )}

      {/* ── Form chỉnh sửa ── */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit3 size={14} className="text-blue-400" /> Chỉnh sửa phân bổ
              </h3>

              {FIELDS.map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm text-slate-300 w-28">{label}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={values?.[key] ?? 0}
                    onChange={e => setValues(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-right focus:outline-none focus:border-blue-500/50 transition-colors"
                  />
                  <span className="text-sm text-slate-400 w-6">%</span>
                  <span className="text-xs text-slate-500 w-28 text-right">
                    {capital > 0 ? formatVND(capital * (values?.[key] ?? 0) / 100) : ''}
                  </span>
                </div>
              ))}

              {/* Live sum */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {isValid
                  ? <CheckCircle2 size={14} className="text-emerald-400" />
                  : <AlertCircle  size={14} className="text-red-400" />
                }
                <span className={`text-xs font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  Tổng: {total.toFixed(1)}% {isValid ? '✓' : '— phải bằng 100%'}
                </span>
              </div>

              <textarea
                placeholder="Ghi chú cá nhân (tuỳ chọn)..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none transition-colors"
              />

              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <Save size={14} />
                }
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
