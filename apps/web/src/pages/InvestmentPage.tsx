import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Sparkles,
  Zap,
  ChevronRight,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { investmentAPI, marketAPI } from "../api/index";
import { useAuth } from "../context/AuthContext";
import { PageSkeleton } from "../components/common/LoadingSpinner";
import {
  normalizeAllocationAnalysis,
  normalizeStrategy,
} from "../utils/investmentAdvisorAdapter";

// Modular Components (giữ nguyên)
import MarketLivePulse from '../components/investment/MarketLivePulse';
import PortfolioHealthMetrics from '../components/investment/PortfolioHealthMetrics';
import AllocationEngine from '../components/investment/AllocationEngine';
import SmartAssetGuide from '../components/investment/SmartAssetGuide';
import WealthProjection from '../components/investment/WealthProjection';

import EconomicNewsFeed from '../components/investment/EconomicNewsFeed';

import IncompleteProfile from '../components/investment/IncompleteProfile';
import SentimentGauge from '../components/investment/SentimentGauge';
import AssetFilterPanel from '../components/investment/AssetFilterPanel';
import GenerateStrategyPopup from '../components/investment/GenerateStrategyPopup';
import NoStrategyPopup from '../components/investment/NoStrategyPopup';
import ApplyStrategyModal from '../components/investment/ApplyStrategyModal';

import {
  ASSET_LABELS,
} from "../components/investment/InvestmentConstants";
import { calcFV } from "../components/investment/InvestmentUtils";

// ─── Sentiment label mapping ──────────────────────────────────
const SENTIMENT_LABEL_VI: Record<string, string> = {
  EXTREME_FEAR: "Sợ hãi cực độ",
  FEAR: "Sợ hãi",
  NEUTRAL: "Trung lập",
  GREED: "Tham lam",
  EXTREME_GREED: "Tham lam cực độ",
};


// [LEGACY] Client-side projection fallback for old strategy records.
// Runtime analytics should come from investmentAdvisorAdapter.js.
function buildRenderData(allocation: any, profile: any) {
  const capital = profile?.capital || 0;
  const savingsRate = profile?.savingsRate || 6.0;
  const inflationRate =
    profile?.inflationRate !== undefined ? profile.inflationRate / 100 : 0.035;
  const rates = {
    savings: savingsRate / 100,
    gold: 0.08,
    stocks: 0.12,
    bonds: 0.042,
    crypto: 0.15,
  };

  const weightedReturn =
    (allocation.savings * rates.savings +
      allocation.gold * rates.gold +
      allocation.stocks * rates.stocks +
      allocation.bonds * rates.bonds +
      allocation.crypto * rates.crypto) /
    100;


  const realReturn = weightedReturn - inflationRate;
  const optReturn = weightedReturn * 1.3 - inflationRate;
  const pessReturn = Math.max(-0.5, weightedReturn * 0.5 - inflationRate);

  const portfolioBreakdown = [
    { asset: 'Tiết kiệm',   percentage: allocation.savings, amount: capital * allocation.savings / 100 },
    { asset: 'Vàng',        percentage: allocation.gold,    amount: capital * allocation.gold    / 100 },
    { asset: 'Cổ phiếu VN', percentage: allocation.stocks,  amount: capital * allocation.stocks  / 100 },
    { asset: 'Trái phiếu',  percentage: allocation.bonds,   amount: capital * allocation.bonds   / 100 },
    { asset: 'Crypto',      percentage: allocation.crypto,  amount: capital * allocation.crypto  / 100 },
  ];

  const pieData = Object.entries(allocation)
    .filter(([_, val]) => (val as number) > 0)
    .map(([key, val]) => ({
      name: ASSET_LABELS[key as keyof typeof ASSET_LABELS] || key,
      value: val,
    }));

  const projectionBase = {
    "1y": Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 1)),
    "3y": Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 3)),
    "5y": Math.round(calcFV(capital, profile?.monthlyAdd || 0, realReturn, 5)),
    "10y": Math.round(
      calcFV(capital, profile?.monthlyAdd || 0, realReturn, 10),
    ),
  };

  const projectionData = [
    {
      year: "Hiện tại",
      base: capital,
      optimistic: capital,
      pessimistic: capital,
      savings: capital,
    },
    ...[1, 3, 5, 10].map((years) => ({
      year: `${years} năm`,
      base: Math.round(
        calcFV(capital, profile?.monthlyAdd || 0, realReturn, years),
      ),
      optimistic: Math.round(
        calcFV(capital, profile?.monthlyAdd || 0, optReturn, years),
      ),
      pessimistic: Math.round(
        calcFV(capital, profile?.monthlyAdd || 0, pessReturn, years),
      ),
      savings: Math.round(
        calcFV(
          capital,
          profile?.monthlyAdd || 0,
          rates.savings - inflationRate,
          years,
        ),
      ),
    })),
  ];

  return { portfolioBreakdown, pieData, projectionBase, projectionData };
}

// ─── Main Page ────────────────────────────────────────────────
export default function InvestmentPage() {
  const { user } = useAuth() as any;
  const navigate = useNavigate();

  const [strategies, setStrategies] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [quota, setQuota] = useState(0);
  const [cryptoPrices, setCryptoPrices] = useState<any>(null);
  const [goldPrice, setGoldPrice] = useState<any>(null);
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [advisorAnalysis, setAdvisorAnalysis] = useState<any>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [advisorError, setAdvisorError] = useState<any>(null);
  const [showNoStrategyPopup, setShowNoStrategyPopup] = useState(false);
  const [applyTarget, setApplyTarget] = useState<any>(null);
  const [activeStrategyIndex, setActiveStrategyIndex] = useState(0);
  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 10;
  // excludedAssets only used internally via popup — persisted to localStorage
  const [excludedAssets, setExcludedAssets] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('finsight_excluded_assets') || '[]');
    } catch {
      return [];
    }
  });
  // Persist excluded assets selection across page reloads
  useEffect(() => {
    localStorage.setItem('finsight_excluded_assets', JSON.stringify(excludedAssets));
  }, [excludedAssets]);

  const isProfileIncomplete =
    !user?.fullName ||
    !user?.email ||
    !user?.monthlyIncome ||
    !user?.investorProfile?.capital;
  const advisorProfile = useMemo(
    () => ({
      ...user?.investorProfile,
      capital: user?.investorProfile?.capital || 0,
    }),
    [user?.investorProfile],
  );

  const refreshAdvisorAnalysis = useCallback(async (excluded: string[] = []) => {
    setAdvisorLoading(true);
    setAdvisorError(null);
    try {
      const params = excluded.length > 0
        ? { excludedAssets: excluded.join(',') }
        : undefined;
      const res = await investmentAPI.getAllocation(params);
      const analysis = normalizeAllocationAnalysis(
        res.data.data,
        advisorProfile,
      );
      setAdvisorAnalysis(analysis);
      return analysis;
    } catch (err) {
      setAdvisorAnalysis(null);
      setAdvisorError(err);
      return null;
    } finally {
      setAdvisorLoading(false);
    }
  }, [advisorProfile]);

  // ── Initial load ──────────────────────────────────────────
  useEffect(() => {
    if (isProfileIncomplete) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [strategiesRes, portfolioRes, cryptoRes] = await Promise.all([
          investmentAPI.getStrategies().catch(() => ({ data: { data: [] } })),
          investmentAPI.getPortfolio().catch(() => ({ data: { data: null } })),
          marketAPI.getCryptoPrices().catch(() => ({ data: { data: {} } })),
        ]);

        const loadedStrategies = (strategiesRes as any).data.data || [];
        setStrategies(loadedStrategies);
        setPortfolio((portfolioRes as any).data.data);
        setCryptoPrices((cryptoRes as any).data.data);
        setQuota(user.strategyQuota ?? 0);

        // Hiển thị trang ngay — không chờ getAllocation nữa
        setLoading(false);

        // Tải vàng + tin tức sau khi trang đã hiển thị
        marketAPI.getGoldPrice()
          .then(res => setGoldPrice(res.data.data?.gold || null))
          .catch(() => {});
        marketAPI.getNews()
          .then(res => setMarketNews(res.data.data?.articles || []))
          .catch(() => {});

        if (loadedStrategies.length === 0) {
          setShowNoStrategyPopup(true);
        } else {
          // getAllocation chạy nền — advisorLoading spinner hiện riêng trong các component
          const savedExcluded = (() => {
            try {
              return JSON.parse(localStorage.getItem('finsight_excluded_assets') || '[]');
            } catch { return []; }
          })();
          refreshAdvisorAnalysis(savedExcluded);
        }
      } catch (e) {
        console.error("InvestmentPage load error:", e);
        setLoading(false);
      }
    };

    load();
  }, [isProfileIncomplete, refreshAdvisorAnalysis, user?.strategyQuota]);

  // ── Generate chiến lược mới ───────────────────────────────
  const handleGenerate = useCallback(async (newExcludedAssets: string[] = []) => {
    setGenerating(true);
    setShowGeneratePopup(false);
    setShowNoStrategyPopup(false);
    setExcludedAssets(newExcludedAssets);
    try {
      const res = await investmentAPI.generateStrategy(newExcludedAssets);
      const { strategy, remainingQuota } = res.data.data;
      setStrategies((prev) => [strategy, ...prev]);
      setQuota(remainingQuota);
      setActiveStrategyIndex(0);
      await refreshAdvisorAnalysis(newExcludedAssets);
      toast.success("Chiến lược đầu tư mới đã được tạo!");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Không thể tạo chiến lược. Vui lòng thử lại.";
      if (err.response?.status === 403) {
        toast.error(msg, {
          action: {
            label: "Nâng cấp",
            onClick: () => (window.location.href = "/upgrade"),
          },
        });
      } else {
        toast.error(msg);
      }
    } finally {
      setGenerating(false);
    }
  }, [refreshAdvisorAnalysis]);

  // ── Lưu / cập nhật UserPortfolio ─────────────────────────
  const handleUpsertPortfolio = useCallback(
    async (data: any) => {
      try {
        await investmentAPI.upsertPortfolio(data);
        setApplyTarget(null);
        toast.success("Đã áp dụng chiến lược! Đang chuyển sang trang của bạn…");
        // Chuyển sang trang chiến lược cá nhân sau 600ms để toast kịp hiển thị
        setTimeout(() => navigate("/investment/my-portfolio"), 600);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lưu thất bại");
      }
    },
    [navigate],
  );

  const handleUpdatePortfolio = useCallback(async (data: any) => {
    try {
      const res = await investmentAPI.updatePortfolio(data);
      setPortfolio(res.data.data);
      toast.success("Đã cập nhật chiến lược!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    }
  }, []);

  // ── Guards ────────────────────────────────────────────────
  if (loading) return <PageSkeleton />;
  if (isProfileIncomplete) return <IncompleteProfile />;

  // ── Dữ liệu render từ chiến lược đang xem ────────────────
  const activeStrategy = strategies[activeStrategyIndex] || null;

  const mockProfile = advisorProfile;
  const legacyViewModel = activeStrategy
    ? normalizeStrategy(activeStrategy, mockProfile)
    : null;
  const viewModel =
    advisorAnalysis && activeStrategyIndex === 0
      ? advisorAnalysis
      : legacyViewModel;
  const sentimentValue =
    viewModel?.sentimentData?.value || activeStrategy?.sentimentValue || 50;

  const activeAllocation = viewModel?.allocation || {
    savings: 20,
    gold: 20,
    stocks: 20,
    bonds: 20,
    crypto: 20,
  };

  const { portfolioBreakdown, pieData, projectionBase, projectionData } =
    viewModel || buildRenderData(activeAllocation, mockProfile);

  return (
    <>
      {/* ── Popup khi chưa có chiến lược ── */}
      <AnimatePresence>
        {showNoStrategyPopup && (
          <NoStrategyPopup
            quota={quota}
            onGenerate={() => setShowGeneratePopup(true)}
            generating={generating}
            onClose={() => setShowNoStrategyPopup(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Popup chọn tài sản + tạo chiến lược ── */}
      <AnimatePresence>
        {showGeneratePopup && (
          <GenerateStrategyPopup
            quota={quota}
            generating={generating}
            riskLevel={advisorProfile?.riskLevel}
            onGenerate={handleGenerate}
            onClose={() => setShowGeneratePopup(false)}
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
              Cố vấn đầu tư Cá nhân hóa
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">
              Phân bổ danh mục thông minh theo tâm lý thị trường thực tế
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Quota badge */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
              <Zap
                size={13}
                className={quota > 3 ? "text-amber-400" : "text-red-400"}
              />
              <span className="text-xs font-bold text-slate-300">
                Còn{" "}
                <span
                  className={`font-black ${quota > 3 ? "text-amber-400" : "text-red-400"}`}
                >
                  {quota}
                </span>{" "}
                lượt tạo
              </span>
            </div>

            {/* Nút tạo chiến lược mới → mở popup chọn tài sản */}
            <button
              onClick={() => setShowGeneratePopup(true)}
              disabled={generating || quota <= 0}
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] text-white"
            >
              {generating ? (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles
                  size={14}
                  className="group-hover:scale-110 transition-transform"
                />
              )}
              <span className="text-xs font-bold uppercase tracking-wide">
                {generating ? "Đang phân tích..." : "Tạo chiến lược mới"}
              </span>
            </button>

            <Link
              to="/investment/my-portfolio"
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-[var(--color-bg-card)] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 rounded-full shadow-sm"
            >
              <User
                size={14}
                className="text-emerald-400 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
                Chiến lược của tôi
              </span>
            </Link>

            <Link
              to="/risk-assessment"
              className="group flex items-center gap-2.5 px-5 py-2.5 bg-[var(--color-bg-card)] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 rounded-full shadow-sm"
            >
              <Target
                size={14}
                className="text-blue-400 group-hover:scale-110 transition-transform"
              />
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
                Hồ sơ rủi ro
              </span>
            </Link>
          </div>
        </header>

        {/* ── Tài sản trong chiến lược hiện tại (read-only) ── */}
        {(() => {
          const EXCLUDABLE = ['gold', 'stocks', 'bonds', 'crypto'] as const;
          const lockedExcluded = strategies.length > 0
            ? EXCLUDABLE.filter(a => !(activeAllocation[a] > 0))
            : excludedAssets; // fallback khi chưa có chiến lược
          return (
            <AssetFilterPanel
              excludedAssets={lockedExcluded}
              onChange={() => {}} // no-op: locked
              riskLevel={advisorProfile?.riskLevel}
              locked={true}
            />
          );
        })()}

        {/* ── Market Pulse ── */}
        <MarketLivePulse prices={{ ...cryptoPrices, gold: goldPrice }} />

        {/* ── Nếu chưa có strategy, không render phần phân tích ── */}
        {strategies.length > 0 && activeStrategy && (
          <>
            {/* ── Hiển thị chiến lược AI đang xem ── */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sentiment */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 relative z-10">
                    Tâm lý thị trường
                  </h3>
                  <div className="relative z-10 scale-110">
                    <SentimentGauge value={sentimentValue} />
                  </div>
                  <div className="mt-10 w-full space-y-3 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400">
                        Trạng thái
                      </span>
                      <span className="text-sm font-bold text-white">
                        {viewModel?.sentimentData?.labelVi ||
                          SENTIMENT_LABEL_VI[viewModel?.sentimentData?.label] ||
                          SENTIMENT_LABEL_VI[activeStrategy.sentimentLabel] ||
                          activeStrategy.sentimentLabel}
                      </span>
                    </div>
                    <div className="w-full h-px bg-white/5" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-400">
                        Điểm số
                      </span>
                      <span className="text-base font-bold text-blue-400">
                        {sentimentValue}/100
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 h-full">
                  <PortfolioHealthMetrics
                    allocation={activeAllocation}
                    projection={projectionBase}
                    profile={mockProfile}
                  />
                </div>
              </div>



              {(advisorLoading || advisorError) &&
                activeStrategyIndex === 0 && (
                  <div
                    className={`px-4 py-2 rounded-2xl border text-xs font-bold ${
                      advisorError
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
                        : "bg-blue-500/10 border-blue-500/20 text-blue-300"
                    }`}
                  >
                    {advisorError
                      ? "Đang hiển thị dữ liệu chiến lược cũ vì phân tích nâng cao chưa sẵn sàng."
                      : "Đang cập nhật phân tích nâng cao..."}
                  </div>
                )}

              <AllocationEngine
                pieData={pieData}
                portfolioBreakdown={portfolioBreakdown}
                history={[]}
              />
              <SmartAssetGuide
                allocation={activeAllocation}
                riskLevel={mockProfile?.riskLevel || "MEDIUM"}
              />
              <WealthProjection
                projectionData={projectionData}
                monteCarloData={viewModel?.monteCarloData}
                mockProfile={mockProfile}
              />
            </div>

            {/* ── Bảng lịch sử chiến lược AI ── */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                  Lịch sử chiến lược
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          #
                        </th>
                        <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Ngày tạo
                        </th>
                        <th className="text-left px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Tâm lý TT
                        </th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Tiết kiệm
                        </th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Vàng
                        </th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          CK
                        </th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          TP
                        </th>
                        <th className="text-right px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Crypto
                        </th>
                        <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {strategies.slice(historyPage * HISTORY_PAGE_SIZE, (historyPage + 1) * HISTORY_PAGE_SIZE).map((s, i) => {
                        const globalIndex = historyPage * HISTORY_PAGE_SIZE + i;
                        return (
                          <tr
                            key={s.id}
                            className={`border-b border-white/5 transition-colors cursor-pointer ${activeStrategyIndex === globalIndex ? "bg-blue-500/5" : "hover:bg-white/2"}`}
                            onClick={() => setActiveStrategyIndex(globalIndex)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {activeStrategyIndex === globalIndex && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                )}
                                <span className="text-slate-400 font-medium">
                                  {globalIndex + 1}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-300 whitespace-nowrap">
                              <div className="text-sm">{new Date(s.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{new Date(s.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</div>
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
                                onClick={(e) => { e.stopPropagation(); setApplyTarget(s); }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-bold transition-colors whitespace-nowrap"
                              >
                                <ChevronRight size={12} />
                                Áp dụng
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {strategies.length > HISTORY_PAGE_SIZE && (
                  <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/5">
                    <span className="text-[11px] text-slate-500">
                      {historyPage * HISTORY_PAGE_SIZE + 1}–{Math.min((historyPage + 1) * HISTORY_PAGE_SIZE, strategies.length)} / {strategies.length} chiến lược
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                        disabled={historyPage === 0}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        ← Trước
                      </button>
                      {Array.from({ length: Math.ceil(strategies.length / HISTORY_PAGE_SIZE) }, (_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setHistoryPage(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${historyPage === idx ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-500 hover:text-white hover:bg-white/5"}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setHistoryPage(p => Math.min(Math.ceil(strategies.length / HISTORY_PAGE_SIZE) - 1, p + 1))}
                        disabled={historyPage >= Math.ceil(strategies.length / HISTORY_PAGE_SIZE) - 1}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        Sau →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <EconomicNewsFeed news={marketNews} />
          </>
        )}

        {/* ── Footer ── */}
        <footer className="pt-12 border-t border-white/5 text-center flex flex-col items-center">
          <div className="w-12 h-1 rounded-full bg-white/10 mb-6" />
          <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-4xl">
            Tuyên bố miễn trừ trách nhiệm: Các phân bổ và dự phóng tài sản trên
            chỉ mang tính chất mô phỏng kỹ thuật dựa trên dữ liệu quá khứ và hồ
            sơ rủi ro. Thị trường tài chính luôn biến động. Sự suy giảm vốn hoàn
            toàn có thể xảy ra ở kịch bản tiêu cực. FinSight và Golden Hands
            không chịu trách nhiệm cho bất kỳ tổn thất tài chính nào phát sinh
            từ việc sử dụng công cụ này.
          </p>
        </footer>
      </motion.div>
    </>
  );
}
