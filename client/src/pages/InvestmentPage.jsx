import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Bot, Sparkles } from 'lucide-react';
import { investmentAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { getAllocation } from '../utils/calculations';

// New Modular Components
import MarketLivePulse from '../components/investment/MarketLivePulse';
import PortfolioHealthMetrics from '../components/investment/PortfolioHealthMetrics';
import AllocationEngine from '../components/investment/AllocationEngine';
import AIRationalPanel from '../components/investment/AIRationalPanel';
import SmartAssetGuide from '../components/investment/SmartAssetGuide';
import WealthProjection from '../components/investment/WealthProjection';
import EconomicNewsFeed from '../components/investment/EconomicNewsFeed';
import IncompleteProfile from '../components/investment/IncompleteProfile';
import SentimentGauge from '../components/investment/SentimentGauge';

// Constants & Utils
import { ASSET_LABELS } from '../components/investment/InvestmentConstants.js';
import { calcFV } from '../components/investment/InvestmentUtils.jsx';

export default function InvestmentPage() {
  const { user } = useAuth();
  const [allocationData, setAllocationData] = useState(null);
  const [marketSummary, setMarketSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mockSentiment, setMockSentiment] = useState(null);

  const isProfileIncomplete = !user?.fullName || !user?.email || !user?.monthlyIncome || !user?.investorProfile?.capital;

  const loadAllocation = useCallback(async (mock) => {
    if (isProfileIncomplete) return;
    try {
      const params = mock !== null && mock !== undefined ? { mockSentiment: mock } : {};
      const res = await investmentAPI.getAllocation(params);
      setAllocationData(res.data.data);
    } catch (e) {
      console.error(e);
    }
  }, [isProfileIncomplete]);

  useEffect(() => {
    if (isProfileIncomplete) { setLoading(false); return; }

    const load = async () => {
      try {
        const [_, marketRes, historyRes] = await Promise.all([
          loadAllocation(window.__MOCK_SENTIMENT__),
          marketAPI.getSummary().catch(() => ({ data: { data: {} } })),
          investmentAPI.getHistory().catch(() => ({ data: { data: [] } })),
        ]);
        setMarketSummary(marketRes.data.data);
        setHistory(historyRes.data.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    load();

    const handleMock = (e) => {
      if (e.detail.active) { setMockSentiment(e.detail.value); loadAllocation(e.detail.value); }
      else { setMockSentiment(null); loadAllocation(undefined); }
    };
    window.addEventListener('mockSentimentChange', handleMock);
    return () => window.removeEventListener('mockSentimentChange', handleMock);
  }, [loadAllocation, isProfileIncomplete]);

  if (loading) return <PageSkeleton />;
  if (isProfileIncomplete) return <IncompleteProfile />;

  // Data Preparation
  const sentiment = allocationData?.sentimentData || {};
  const capital = user?.investorProfile?.capital || 0;
  const savingsRate = user?.investorProfile?.savingsRate || 6.0;
  const mockProfile = { ...user?.investorProfile, capital, savingsRate };
  const sentimentValue = mockSentiment !== null ? mockSentiment : (sentiment.value || 50);

  const derivedResult = getAllocation(mockProfile, sentimentValue);
  const derivedAllocation = {
    savings: derivedResult.savings,
    gold:    derivedResult.gold,
    stocks:  derivedResult.stocks,
    bonds:   derivedResult.bonds,
    crypto:  derivedResult.crypto,
  };

  const portfolioBreakdown = [
    { asset: 'Tiết kiệm',    percentage: derivedAllocation.savings, amount: capital * derivedAllocation.savings / 100 },
    { asset: 'Vàng',         percentage: derivedAllocation.gold,    amount: capital * derivedAllocation.gold    / 100 },
    { asset: 'Chứng khoán',  percentage: derivedAllocation.stocks,  amount: capital * derivedAllocation.stocks  / 100 },
    { asset: 'Trái phiếu',   percentage: derivedAllocation.bonds,   amount: capital * derivedAllocation.bonds   / 100 },
    { asset: 'Crypto',       percentage: derivedAllocation.crypto,  amount: capital * derivedAllocation.crypto  / 100 },
  ];

  const pieData = Object.entries(derivedAllocation)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: ASSET_LABELS[key] || key, value: val }));

  const inflationRate = mockProfile.inflationRate !== undefined ? mockProfile.inflationRate / 100 : 0.035;
  const rates = { savings: savingsRate / 100, gold: 0.08, stocks: 0.12, bonds: 0.07, crypto: 0.15 };
  
  const weightedReturn = (derivedAllocation.savings * rates.savings + derivedAllocation.gold * rates.gold +
    derivedAllocation.stocks * rates.stocks + derivedAllocation.bonds * rates.bonds +
    derivedAllocation.crypto * rates.crypto) / 100;

  const realReturn  = weightedReturn - inflationRate;
  const optReturn   = weightedReturn * 1.3 - inflationRate;
  const pessReturn  = Math.max(-0.5, weightedReturn * 0.5 - inflationRate);

  const projectionBase = { 
    '1y': Math.round(calcFV(capital, mockProfile.monthlyAdd, realReturn, 1)), 
    '3y': Math.round(calcFV(capital, mockProfile.monthlyAdd, realReturn, 3)), 
    '5y': Math.round(calcFV(capital, mockProfile.monthlyAdd, realReturn, 5)), 
    '10y': Math.round(calcFV(capital, mockProfile.monthlyAdd, realReturn, 10)) 
  };

  const projectionData = [
    { year: 'Hiện tại', base: capital, optimistic: capital, pessimistic: capital, savings: capital },
    ...[1, 3, 5, 10].map(years => ({
      year: `${years} năm`,
      base:        Math.round(calcFV(capital, mockProfile.monthlyAdd, realReturn, years)),
      optimistic:  Math.round(calcFV(capital, mockProfile.monthlyAdd, optReturn, years)),
      pessimistic: Math.round(calcFV(capital, mockProfile.monthlyAdd, pessReturn, years)),
      savings:     Math.round(calcFV(capital, mockProfile.monthlyAdd, rates.savings - inflationRate, years)),
    }))
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-7xl mx-auto space-y-12 pb-24"
    >
      {/* ── Page Header ── */}
      <header className="pt-2 flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <Sparkles size={11} /> Chiến lược đầu tư
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
            Phân bổ tài sản FinSight AI
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            Mô hình Neural Engine v2.4 tối ưu hóa danh mục theo thời gian thực
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link 
            to="/risk-assessment" 
            className="group flex items-center gap-2.5 px-5 py-2.5 bg-[var(--color-bg-card)] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300 rounded-full shadow-sm"
          >
            <Target size={14} className="text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
              Cập nhật Hồ sơ Rủi ro
            </span>
          </Link>
        </div>
      </header>

      {/* ── Mock Mode Warning ── */}
      {mockSentiment !== null && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4"
        >
          <div className="w-2.5 h-2.5 bg-amber-500 animate-ping rounded-full" />
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            SIMULATION MODE ENABLED: SENTIMENT OVERRIDE = {mockSentiment}
          </span>
        </motion.div>
      )}

      {/* ── Main Dashboard Grid ── */}
      <div className="space-y-8">
        <MarketLivePulse prices={marketSummary?.prices} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sentiment Widget */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 relative z-10">Tâm lý thị trường</h3>
            <div className="relative z-10 scale-110">
               <SentimentGauge value={sentimentValue} />
            </div>
            
            <div className="mt-10 w-full space-y-3 relative z-10 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">Trạng thái</span>
                <span className="text-sm font-bold text-white">{sentiment.labelVi || 'Trung lập'}</span>
              </div>
              <div className="w-full h-px bg-white/5" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-400">Điểm số</span>
                <span className="text-base font-bold text-blue-400">{sentimentValue}/100</span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 h-full">
            <PortfolioHealthMetrics 
              allocation={derivedAllocation} 
              projection={projectionBase} 
              profile={mockProfile} 
            />
          </div>
        </div>

        {/* AI Insight Bar */}
        {derivedResult.recommendation && (
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 p-6 rounded-2xl flex items-start gap-5 shadow-[0_0_30px_rgba(59,130,246,0.1)] group">
            <div className="p-2.5 rounded-full bg-blue-500/20 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
               <Bot size={20} className="text-blue-400" />
            </div>
            <p className="text-base font-medium text-blue-100 leading-relaxed">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-1">Khuyến nghị chiến lược:</span>
              "{derivedResult.recommendation}"
            </p>
          </div>
        )}

        <AllocationEngine 
          pieData={pieData} 
          portfolioBreakdown={portfolioBreakdown} 
          history={history} 
        />

        <AIRationalPanel 
          allocation={derivedAllocation}
          profile={mockProfile}
          sentimentValue={sentimentValue}
          portfolioBreakdown={portfolioBreakdown}
        />

        <WealthProjection 
          projectionData={projectionData} 
          mockProfile={mockProfile} 
        />

        <SmartAssetGuide 
          allocation={derivedAllocation} 
          riskLevel={mockProfile?.riskLevel || 'MEDIUM'} 
        />

        <EconomicNewsFeed news={marketSummary?.news} />
      </div>

      {/* ── Footer Disclaimer ── */}
      <footer className="pt-12 border-t border-white/5 text-center flex flex-col items-center">
        <div className="w-12 h-1 rounded-full bg-white/10 mb-6" />
        <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-4xl">
          Tuyên bố miễn trừ trách nhiệm: Các phân bổ và dự phóng tài sản trên chỉ mang tính chất mô phỏng kỹ thuật dựa trên dữ liệu quá khứ và hồ sơ rủi ro. 
          Thị trường tài chính luôn biến động. Sự suy giảm vốn hoàn toàn có thể xảy ra ở kịch bản tiêu cực. 
          FinSight và Golden Hands không chịu trách nhiệm cho bất kỳ tổn thất tài chính nào phát sinh từ việc sử dụng công cụ này.
        </p>
      </footer>
    </motion.div>
  );
}
