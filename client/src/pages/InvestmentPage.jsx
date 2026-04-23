import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Target, Bot, Sparkles, Zap, BookOpen, ChevronRight, X, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { investmentAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { getAllocation, formatVND, formatPercent } from '../utils/calculations';

// Modular Components (giữ nguyên)
import MarketLivePulse from '../components/investment/MarketLivePulse';
import PortfolioHealthMetrics from '../components/investment/PortfolioHealthMetrics';
import AllocationEngine from '../components/investment/AllocationEngine';
import AIRationalPanel from '../components/investment/AIRationalPanel';
import SmartAssetGuide from '../components/investment/SmartAssetGuide';
import WealthProjection from '../components/investment/WealthProjection';
import EconomicNewsFeed from '../components/investment/EconomicNewsFeed';
import IncompleteProfile from '../components/investment/IncompleteProfile';
import SentimentGauge from '../components/investment/SentimentGauge';

import { ASSET_LABELS, COLORS } from '../components/investment/InvestmentConstants.js';
import { calcFV } from '../components/investment/InvestmentUtils.jsx';

// ─── Sentiment label mapping ──────────────────────────────────
const SENTIMENT_LABEL_VI = {
  EXTREME_FEAR: 'Sợ hãi cực độ',
  FEAR: 'Sợ hãi',
  NEUTRAL: 'Trung lập',
  GREED: 'Tham lam',
  EXTREME_GREED: 'Tham lam cực độ',
};

// ─── Helper: build projection & pie data từ allocation object ─
function buildRenderData(allocation, profile) {
  const capital     = profile?.capital || 0;
  const savingsRate = profile?.savingsRate || 6.0;
  const inflationRate = profile?.inflationRate !== undefined ? profile.inflationRate / 100 : 0.035;
  const rates = { savings: savingsRate / 100, gold: 0.08, stocks: 0.12, bonds: 0.07, crypto: 0.15 };

  const weightedReturn = (
    allocation.savings * rates.savings +
    allocation.gold    * rates.gold    +
    allocation.stocks  * rates.stocks  +
    allocation.bonds   * rates.bonds   +
    allocation.crypto  * rates.crypto
  ) / 100;

  const realReturn = weightedReturn - inflationRate;
  const optReturn  = weightedReturn * 1.3 - inflationRate;
  const pessReturn = Math.max(-0.5, weightedReturn * 0.5 - inflationRate);

  const portfolioBreakdown = [
    { asset: 'Tiết kiệm',   percentage: allocation.savings, amount: capital * allocation.savings / 100 },
    { asset: 'Vàng',        percentage: allocation.gold,    amount: capital * allocation.gold    / 100 },
    { asset: 'Chứng khoán', percentage: allocation.stocks,  amount: capital * allocation.stocks  / 100 },
    { asset: 'Trái phiếu',  percentage: allocation.bonds,   amount: capital * allocation.bonds   / 100 },
    { asset: 'Crypto',      percentage: allocation.crypto,  amount: capital * allocation.crypto  / 100 },
  ];

  const pieData = Object.entries(allocation)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: ASSET_LABELS[key] || key, value: val }));

  const projectionBase = {
    '1y':  Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 1)),
    '3y':  Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 3)),
    '5y':  Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 5)),
    '10y': Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 10)),
  };

  const projectionData = [
    { year: 'Hiện tại', base: capital, optimistic: capital, pessimistic: capital, savings: capital },
    ...[1, 3, 5, 10].map(years => ({
      year: `${years} năm`,
      base:        Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, years)),
      optimistic:  Math.round(calcFV(capital, profile?.monthlyAdd || 0, optReturn, years)),
      pessimistic: Math.round(calcFV(capital, profile?.monthlyAdd || 0, pessReturn, years)),
      savings:     Math.round(calcFV(capital, profile?.monthlyAdd || 0, rates.savings - inflationRate, years)),
    })),
  ];

  return { portfolioBreakdown, pieData, projectionBase, projectionData };
}

// ─── Component: Popup khi chưa có chiến lược nào ─────────────
function NoStrategyPopup({ quota, onGenerate, generating, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Bot size={32} className="text-blue-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Bạn chưa có chiến lược đầu tư nào</h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Hệ thống sẽ phân tích thị trường hiện tại và hồ sơ rủi ro của bạn để đưa ra chiến lược phân bổ danh mục tối ưu.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8">
            <Zap size={14} className="text-amber-400" />
            <span className="text-sm text-slate-300">
              Bạn còn <span className="font-black text-amber-400">{quota}</span> lượt tạo chiến lược
            </span>
          </div>

          <button
            onClick={onGenerate}
            disabled={generating || quota <= 0}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Đang phân tích thị trường...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Tạo chiến lược theo thị trường hiện tại
              </>
            )}
          </button>

          {quota <= 0 && (
            <p className="mt-3 text-xs text-red-400">
              Hết lượt. <Link to="/upgrade" className="underline text-blue-400">Nâng cấp tài khoản</Link> để nhận thêm lượt.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Component: Modal áp dụng chiến lược AI vào portfolio ─────
function ApplyStrategyModal({ strategy, onClose, onSave }) {
  const [values, setValues] = useState({
    savings: strategy.savings,
    gold:    strategy.gold,
    stocks:  strategy.stocks,
    bonds:   strategy.bonds,
    crypto:  strategy.crypto,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const total = Object.values(values).reduce((a, b) => a + Number(b), 0);
  const isValid = Math.abs(total - 100) <= 0.5;

  const handleChange = (key, val) => {
    setValues(prev => ({ ...prev, [key]: parseFloat(val) || 0 }));
  };

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    await onSave({ ...values, notes, sourceStrategyId: strategy.id });
    setSaving(false);
  };

  const FIELDS = [
    { key: 'savings', label: 'Tiết kiệm',    color: '#10b981' },
    { key: 'gold',    label: 'Vàng',          color: '#f59e0b' },
    { key: 'stocks',  label: 'Chứng khoán',   color: '#3b82f6' },
    { key: 'bonds',   label: 'Trái phiếu',    color: '#8b5cf6' },
    { key: 'crypto',  label: 'Crypto',        color: '#ec4899' },
  ];

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
                onChange={e => handleChange(key, e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-sm text-slate-400 w-6">%</span>
            </div>
          ))}
        </div>

        {/* Live sum */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl mb-4 ${isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
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
            {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            Lưu chiến lược của tôi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Component: Khu vực UserPortfolio ─────────────────────────
function MyPortfolioSection({ portfolio, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (portfolio) {
      setValues({
        savings: portfolio.savings,
        gold:    portfolio.gold,
        stocks:  portfolio.stocks,
        bonds:   portfolio.bonds,
        crypto:  portfolio.crypto,
      });
      setNotes(portfolio.notes || '');
    }
  }, [portfolio]);

  const total = values ? Object.values(values).reduce((a, b) => a + Number(b), 0) : 0;
  const isValid = Math.abs(total - 100) <= 0.5;

  const FIELDS = [
    { key: 'savings', label: 'Tiết kiệm',   color: '#10b981' },
    { key: 'gold',    label: 'Vàng',         color: '#f59e0b' },
    { key: 'stocks',  label: 'Chứng khoán',  color: '#3b82f6' },
    { key: 'bonds',   label: 'Trái phiếu',   color: '#8b5cf6' },
    { key: 'crypto',  label: 'Crypto',       color: '#ec4899' },
  ];

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
            <div className="font-black text-lg" style={{ color }}>{values?.[key] || 0}%</div>
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
                    type="number" min="0" max="100" step="0.5"
                    value={values?.[key] || 0}
                    onChange={e => setValues(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white text-right focus:outline-none focus:border-blue-500/50"
                  />
                  <span className="text-xs text-slate-400 w-4">%</span>
                </div>
              ))}

              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {isValid
                  ? <CheckCircle2 size={13} className="text-emerald-400" />
                  : <AlertCircle  size={13} className="text-red-400" />
                }
                <span className={`text-xs font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                  Tổng: {total.toFixed(1)}% {isValid ? '' : '— phải bằng 100%'}
                </span>
              </div>

              <textarea
                placeholder="Ghi chú cá nhân..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
              />

              <button
                onClick={handleSave}
                disabled={!isValid || saving}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white transition-colors flex items-center justify-center gap-2"
              >
                {saving ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                Lưu thay đổi
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {portfolio.notes && !editing && (
        <p className="mt-3 text-xs text-slate-400 italic border-t border-white/5 pt-3">
          "{portfolio.notes}"
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function InvestmentPage() {
  const { user } = useAuth();

  const [strategies,           setStrategies]           = useState([]);
  const [portfolio,            setPortfolio]            = useState(null);
  const [quota,                setQuota]                = useState(0);
  const [marketSummary,        setMarketSummary]        = useState(null);
  const [loading,              setLoading]              = useState(true);
  const [generating,           setGenerating]           = useState(false);
  const [showNoStrategyPopup,  setShowNoStrategyPopup]  = useState(false);
  const [applyTarget,          setApplyTarget]          = useState(null); // strategy sedang mo modal
  const [activeStrategyIndex,  setActiveStrategyIndex]  = useState(0);

  const isProfileIncomplete = !user?.fullName || !user?.email || !user?.monthlyIncome || !user?.investorProfile?.capital;

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    if (isProfileIncomplete) { setLoading(false); return; }

    const load = async () => {
      try {
        const [strategiesRes, portfolioRes, marketRes] = await Promise.all([
          investmentAPI.getStrategies().catch(() => ({ data: { data: [] } })),
          investmentAPI.getPortfolio().catch(() => ({ data: { data: null } })),
          marketAPI.getSummary().catch(() => ({ data: { data: {} } })),
        ]);

        const loadedStrategies = strategiesRes.data.data || [];
        setStrategies(loadedStrategies);
        setPortfolio(portfolioRes.data.data);
        setMarketSummary(marketRes.data.data);
        setQuota(user.strategyQuota ?? 0);

        if (loadedStrategies.length === 0) {
          setShowNoStrategyPopup(true);
        }
      } catch (e) {
        console.error('InvestmentPage load error:', e);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    };

    load();
  }, [isProfileIncomplete]);

  // ── Generate chiến lược mới ───────────────────────────────
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await investmentAPI.generateStrategy();
      const { strategy, remainingQuota } = res.data.data;
      setStrategies(prev => [strategy, ...prev]);
      setQuota(remainingQuota);
      setActiveStrategyIndex(0);
      setShowNoStrategyPopup(false);
      toast.success('Chiến lược đầu tư mới đã được tạo!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể tạo chiến lược. Vui lòng thử lại.';
      if (err.response?.status === 403) {
        toast.error(msg, { action: { label: 'Nâng cấp', onClick: () => window.location.href = '/upgrade' } });
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  }, []);

  // ── Lưu / cập nhật UserPortfolio ─────────────────────────
  const handleUpsertPortfolio = useCallback(async (data) => {
    try {
      const res = await investmentAPI.upsertPortfolio(data);
      setPortfolio(res.data.data);
      setApplyTarget(null);
      toast.success('Đã lưu chiến lược của bạn!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lưu thất bại');
    }
  }, []);

  const handleUpdatePortfolio = useCallback(async (data) => {
    try {
      const res = await investmentAPI.updatePortfolio(data);
      setPortfolio(res.data.data);
      toast.success('Đã cập nhật chiến lược!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại');
    }
  }, []);

  // ── Guards ────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;
  if (isProfileIncomplete) return <IncompleteProfile />;

  // ── Dữ liệu render từ chiến lược đang xem ────────────────
  const activeStrategy = strategies[activeStrategyIndex] || null;

  const mockProfile   = { ...user?.investorProfile, capital: user?.investorProfile?.capital || 0 };
  const sentimentValue = activeStrategy?.sentimentValue || 50;

  const activeAllocation = activeStrategy
    ? { savings: activeStrategy.savings, gold: activeStrategy.gold, stocks: activeStrategy.stocks, bonds: activeStrategy.bonds, crypto: activeStrategy.crypto }
    : { savings: 20, gold: 20, stocks: 20, bonds: 20, crypto: 20 };

  const { portfolioBreakdown, pieData, projectionBase, projectionData } = buildRenderData(activeAllocation, mockProfile);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  };

  return (
    <>
      {/* ── Popup khi chưa có chiến lược ── */}
      <AnimatePresence>
        {showNoStrategyPopup && (
          <NoStrategyPopup
            quota={quota}
            onGenerate={handleGenerate}
            generating={generating}
            onClose={() => setShowNoStrategyPopup(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Modal áp dụng chiến lược AI ── */}
      <AnimatePresence>
        {applyTarget && (
          <ApplyStrategyModal
            strategy={applyTarget}
            onClose={() => setApplyTarget(null)}
            onSave={handleUpsertPortfolio}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-10 pb-24"
      >
        {/* ── Header ── */}
        <header className="pt-2 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
              <Sparkles size={11} /> Chiến lược đầu tư
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
              Cố vấn đầu tư AI
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              Phân bổ danh mục thông minh theo tâm lý thị trường thực tế
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Quota badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <Zap size={13} className={quota > 3 ? 'text-amber-400' : 'text-red-400'} />
              <span className="text-xs font-bold text-slate-300">
                Còn <span className={`font-black ${quota > 3 ? 'text-amber-400' : 'text-red-400'}`}>{quota}</span> lượt tạo
              </span>
            </div>

            {/* Nút tạo chiến lược mới */}
            <button
              onClick={handleGenerate}
              disabled={generating || quota <= 0}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white"
            >
              {generating
                ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <Sparkles size={14} className="group-hover:scale-110 transition-transform" />
              }
              <span className="text-xs font-bold uppercase tracking-wide">
                {generating ? 'Đang phân tích...' : 'Tạo chiến lược mới'}
              </span>
            </button>

            <Link
              to="/risk-assessment"
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-[var(--color-bg-card)] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 rounded-full shadow-sm"
            >
              <Target size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
                Hồ sơ rủi ro
              </span>
            </Link>
          </div>
        </header>

        {/* ── Market Pulse ── */}
        <MarketLivePulse prices={marketSummary?.prices} />

        {/* ── Nếu chưa có strategy, không render phần phân tích ── */}
        {strategies.length > 0 && activeStrategy && (
          <>
            {/* ── Hiển thị chiến lược AI đang xem ── */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sentiment */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 relative z-10">Tâm lý thị trường</h3>
                  <div className="relative z-10 scale-110">
                    <SentimentGauge value={sentimentValue} />
                  </div>
                  <div className="mt-10 w-full space-y-3 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400">Trạng thái</span>
                      <span className="text-sm font-bold text-white">
                        {SENTIMENT_LABEL_VI[activeStrategy.sentimentLabel] || activeStrategy.sentimentLabel}
                      </span>
                    </div>
                    <div className="w-full h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400">Điểm số</span>
                      <span className="text-base font-bold text-blue-400">{sentimentValue}/100</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 h-full">
                  <PortfolioHealthMetrics allocation={activeAllocation} projection={projectionBase} profile={mockProfile} />
                </div>
              </div>

              {/* AI Recommendation */}
              {activeStrategy.recommendation && (
                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-5 shadow-[0_0_30px_rgba(59,130,246,0.1)] group">
                  <div className="p-2.5 rounded-full bg-blue-500/20 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                    <Bot size={20} className="text-blue-400" />
                  </div>
                  <p className="text-base font-medium text-blue-100 leading-relaxed">
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-1">Khuyến nghị chiến lược:</span>
                    "{activeStrategy.recommendation}"
                  </p>
                </div>
              )}

              <AllocationEngine pieData={pieData} portfolioBreakdown={portfolioBreakdown} history={[]} />
              <AIRationalPanel allocation={activeAllocation} profile={mockProfile} sentimentValue={sentimentValue} portfolioBreakdown={portfolioBreakdown} />
              <WealthProjection projectionData={projectionData} mockProfile={mockProfile} />
              <SmartAssetGuide allocation={activeAllocation} riskLevel={mockProfile?.riskLevel || 'MEDIUM'} />
            </div>

            {/* ── UserPortfolio — Chiến lược của tôi ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Danh mục cá nhân</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <MyPortfolioSection portfolio={portfolio} onUpdate={handleUpdatePortfolio} />
            </section>

            {/* ── Bảng lịch sử chiến lược AI ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Lịch sử chiến lược AI</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">#</th>
                        <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Ngày tạo</th>
                        <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Tâm lý TT</th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Tiết kiệm</th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Vàng</th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">CK</th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">TP</th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Crypto</th>
                        <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategies.map((s, i) => (
                        <tr
                          key={s.id}
                          className={`border-b border-white/5 transition-colors cursor-pointer ${activeStrategyIndex === i ? 'bg-blue-500/5' : 'hover:bg-white/2'}`}
                          onClick={() => setActiveStrategyIndex(i)}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {activeStrategyIndex === i && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
                              <span className="text-slate-400 font-medium">{i + 1}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                            {new Date(s.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-300">
                              {SENTIMENT_LABEL_VI[s.sentimentLabel] || s.sentimentLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-400">{s.savings}%</td>
                          <td className="px-4 py-3.5 text-right font-bold text-amber-400">{s.gold}%</td>
                          <td className="px-4 py-3.5 text-right font-bold text-blue-400">{s.stocks}%</td>
                          <td className="px-4 py-3.5 text-right font-bold text-purple-400">{s.bonds}%</td>
                          <td className="px-4 py-3.5 text-right font-bold text-pink-400">{s.crypto}%</td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={e => { e.stopPropagation(); setApplyTarget(s); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold transition-colors whitespace-nowrap"
                            >
                              <ChevronRight size={12} />
                              Áp dụng
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <EconomicNewsFeed news={marketSummary?.news} />
          </>
        )}

        {/* ── Footer ── */}
        <footer className="pt-12 border-t border-white/5 text-center flex flex-col items-center">
          <div className="w-12 h-1 rounded-full bg-white/10 mb-6" />
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-4xl">
            Tuyên bố miễn trừ trách nhiệm: Các phân bổ và dự phóng tài sản trên chỉ mang tính chất mô phỏng kỹ thuật dựa trên dữ liệu quá khứ và hồ sơ rủi ro.
            Thị trường tài chính luôn biến động. Sự suy giảm vốn hoàn toàn có thể xảy ra ở kịch bản tiêu cực.
            FinSight và Golden Hands không chịu trách nhiệm cho bất kỳ tổn thất tài chính nào phát sinh từ việc sử dụng công cụ này.
          </p>
        </footer>
      </motion.div>
    </>
  );
}
