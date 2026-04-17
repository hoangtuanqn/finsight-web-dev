import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { investmentAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import SentimentGauge from '../components/investment/SentimentGauge';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { formatVND, getAllocation } from '../utils/calculations';
import { Lock, TrendingUp, TrendingDown, Target, Bot, Thermometer, BarChart2, PieChart as PieChartIcon, FileText, Settings2, AlertTriangle } from 'lucide-react';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];
const ASSET_LABELS = { savings: 'Tiết kiệm', gold: 'Vàng', stocks: 'Chứng khoán', bonds: 'Trái phiếu', crypto: 'Crypto' };

const tooltipStyle = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export default function InvestmentPage() {
  const { user } = useAuth();
  const [allocationData, setAllocationData] = useState(null);
  const [marketSummary, setMarketSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mockSentiment, setMockSentiment] = useState(null);

  // Check if profile is complete
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
    if (isProfileIncomplete) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [_, marketRes] = await Promise.all([
          loadAllocation(window.__MOCK_SENTIMENT__),
          marketAPI.getSummary().catch(() => ({ data: { data: {} } })),
        ]);
        setMarketSummary(marketRes.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    load();

    const handleMock = (e) => {
      if (e.detail.active) {
        setMockSentiment(e.detail.value);
        loadAllocation(e.detail.value);
      } else {
        setMockSentiment(null);
        loadAllocation(undefined);
      }
    };
    window.addEventListener('mockSentimentChange', handleMock);
    return () => window.removeEventListener('mockSentimentChange', handleMock);
  }, [loadAllocation, isProfileIncomplete]);

  if (loading) return <PageSkeleton />;

  if (isProfileIncomplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card max-w-md p-10"
        >
          <div className="text-5xl mb-6"><Lock size={48} className="mx-auto text-slate-400" /></div>
          <h2 className="text-xl font-bold text-white mb-3">Chưa đủ dữ liệu phân tích</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Hệ thống AI cần biết <strong>Thu nhập</strong> và <strong>Số vốn</strong> của bạn để đưa ra đề xuất phân bổ tài sản chính xác nhất.
          </p>
          <Link to="/profile" className="btn-primary w-full">
            Hoàn thiện Hồ sơ ngay
          </Link>
        </motion.div>
      </div>
    );
  }

  const sentiment = allocationData?.sentimentData || {};
  const prices = marketSummary?.prices || {};
  const news = marketSummary?.news || [];

  const capital = user?.investorProfile?.capital || 0;
  const savingsRate = user?.investorProfile?.savingsRate || 6.0;

  const mockProfile = { ...user?.investorProfile, capital, savingsRate };
  const sentimentValue = mockSentiment !== null ? mockSentiment : (sentiment.value || 50);

  const derivedResult = getAllocation(mockProfile, sentimentValue);
  const derivedAllocation = {
    savings: derivedResult.savings,
    gold: derivedResult.gold,
    stocks: derivedResult.stocks,
    bonds: derivedResult.bonds,
    crypto: derivedResult.crypto,
  };
  const recommendation = derivedResult.recommendation;

  const portfolioBreakdown = [
    { asset: 'Tiết kiệm', percentage: derivedAllocation.savings, amount: capital * derivedAllocation.savings / 100 },
    { asset: 'Vàng', percentage: derivedAllocation.gold, amount: capital * derivedAllocation.gold / 100 },
    { asset: 'Chứng khoán', percentage: derivedAllocation.stocks, amount: capital * derivedAllocation.stocks / 100 },
    { asset: 'Trái phiếu', percentage: derivedAllocation.bonds, amount: capital * derivedAllocation.bonds / 100 },
    { asset: 'Crypto', percentage: derivedAllocation.crypto, amount: capital * derivedAllocation.crypto / 100 },
  ];

  const pieData = Object.entries(derivedAllocation)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: ASSET_LABELS[key] || key, value: val }));

  const totalPortfolio = capital;

  const inflationRate = mockProfile.inflationRate !== undefined ? mockProfile.inflationRate / 100 : 0.035;
  const rates = { savings: savingsRate / 100, gold: 0.08, stocks: 0.12, bonds: 0.07, crypto: 0.15 };
  const weightedReturn = (derivedAllocation.savings * rates.savings + derivedAllocation.gold * rates.gold +
    derivedAllocation.stocks * rates.stocks + derivedAllocation.bonds * rates.bonds +
    derivedAllocation.crypto * rates.crypto) / 100;

  const realReturn = weightedReturn - inflationRate;
  const optReturn = weightedReturn * 1.3 - inflationRate;
  const pessReturn = Math.max(-0.5, weightedReturn * 0.5 - inflationRate);

  const calcFV = (rate, years) => {
    if (rate === 0) return capital + (mockProfile.monthlyAdd || 0) * 12 * years;
    return capital * Math.pow(1 + rate, years) +
      (mockProfile.monthlyAdd || 0) * 12 * ((Math.pow(1 + rate, years) - 1) / rate);
  };

  const projectionData = [
    { year: 'Hiện tại', base: capital, optimistic: capital, pessimistic: capital, savings: capital },
    ...[1, 3, 5, 10].map(years => ({
      year: `${years} năm`,
      base: Math.round(calcFV(realReturn, years)),
      optimistic: Math.round(calcFV(optReturn, years)),
      pessimistic: Math.round(calcFV(pessReturn, years)),
      savings: Math.round(calcFV(rates.savings - inflationRate, years)),
    }))
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-white flex items-center gap-2"><TrendingUp size={20} /> Tư vấn đầu tư cá nhân hóa</h1>
          <p className="text-slate-500 text-sm mt-1">Phân bổ tài sản dựa trên tâm lý thị trường & risk profile</p>
        </div>
        <Link to="/risk-assessment" className="btn-secondary text-[13px] flex items-center gap-1.5"><Target size={14} /> Cập nhật Risk Profile</Link>
      </div>

      {mockSentiment !== null && (
        <div className="bg-amber-500/6 border border-amber-500/15 rounded-xl px-4 py-2.5 mb-5 text-sm text-amber-400">
          🎮 Mock Mode: Sentiment = {mockSentiment}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Ticker */}
          <div className="glass-card">
            <h3 className="text-[12px] font-semibold mb-3 text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><BarChart2 size={14} /> Thị trường</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Bitcoin', value: prices.bitcoin?.price ? `$${prices.bitcoin.price.toLocaleString()}` : '—', change: prices.bitcoin?.change24h },
                { label: 'Ethereum', value: prices.ethereum?.price ? `$${prices.ethereum.price.toLocaleString()}` : '—', change: prices.ethereum?.change24h },
                { label: 'Vàng SJC', value: prices.gold?.sell ? `${prices.gold.sell.toLocaleString('vi-VN')} đ` : '—', extra: prices.gold?.unit || '' },
              ].map((item, i) => (
                <div key={i} className="py-1">
                  <p className="text-[11px] text-slate-500 mb-0.5">{item.label}</p>
                  <p className="font-bold text-white text-[15px]">{item.value}</p>
                  {item.change !== undefined && (
                    <p className={`text-[11px] font-medium ${(item.change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(item.change || 0) >= 0 ? <TrendingUp size={11} className="inline" /> : <TrendingDown size={11} className="inline" />} {Math.abs(item.change || 0).toFixed(2)}%
                    </p>
                  )}
                  {item.extra && <p className="text-[11px] text-slate-600">{item.extra}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommendation */}
          {recommendation && (
            <div className="glass-card bg-blue-500/3" style={{ borderColor: 'rgba(59, 130, 246, 0.12)' }}>
              <p className="text-sm text-blue-300">
                <Bot size={14} className="inline mr-1" /> <span className="font-semibold">AI phân tích:</span> {recommendation}
              </p>
            </div>
          )}

          {/* Allocation Pie + Breakdown */}
          <div className="glass-card">
            <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <PieChartIcon size={16} /> Phân bổ danh mục khuyến nghị
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`}
                      labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                    >
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {portfolioBreakdown.filter(p => p.percentage > 0).map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-300">{p.asset}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{p.percentage}%</p>
                      <p className="text-[11px] text-slate-500">{formatVND(p.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Projection Chart */}
          <div className="glass-card">
            <h3 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
              <BarChart2 size={16} /> Dự phóng tài sản
            </h3>
            <p className="text-[12px] text-slate-500 mb-4">So sánh: Gửi tiết kiệm 100% vs Phân bổ theo AI</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}tr`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatVND(v), '']} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="savings" name="100% Tiết kiệm" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  <Line type="monotone" dataKey="optimistic" name="Lạc quan" stroke="#10b981" strokeWidth={2} dot={false} strokeOpacity={0.6} />
                  <Line type="monotone" dataKey="base" name="Phân bổ AI (Base)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="pessimistic" name="Bi quan" stroke="#ef4444" strokeWidth={2} dot={false} strokeOpacity={0.6} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center">
              Giá trị dự phóng đă tính chiết khấu Lạm phát ({mockProfile.inflationRate ?? 3.5}%/năm) để phản ánh sức mua thực tế.
            </p>
          </div>

          <div className="glass-card bg-red-500/5 border-red-500/10">
            <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
              <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
              <span>
                <strong>Tuyên bố miễn trừ trách nhiệm:</strong> Các phân bổ và dự phóng tài sản trên chỉ mang tính chất mô phỏng kỹ thuật dựa trên dữ liệu quá khứ và hồ sơ rủi ro.
                Thị trường tài chính luôn biến động. Sự suy giảm vốn hoàn toàn có thể xảy ra ở kịch bản Bi quan. Bạn hãy tự chịu trách nhiệm với quyết định của mình.
              </span>
            </p>
          </div>

          {/* News */}
          {news.length > 0 && (
            <div className="glass-card">
              <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={16} /> Tin tức tài chính
              </h3>
              <div className="space-y-1">
                {news.map((article, i) => (
                  <a
                    key={i}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group"
                  >
                    <p className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors leading-snug">{article.title}</p>
                    <p className="text-[11px] text-slate-600 mt-1">{article.source} • {new Date(article.publishedAt).toLocaleDateString('vi-VN')}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Sentiment */}
        <div className="space-y-6">
          <div className="glass-card">
            <h3 className="text-[12px] font-semibold mb-4 text-center text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5"><Thermometer size={14} /> Fear & Greed Index</h3>
            <SentimentGauge value={sentiment.value || 50} />
          </div>

          <div className="glass-card">
            <h3 className="text-[12px] font-semibold mb-3 text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><BarChart2 size={14} /> Thông tin</h3>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tâm lý</span>
                <span className="text-white font-medium">{sentiment.labelVi || 'Trung lập'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Giá trị</span>
                <span className="text-white font-medium">{sentiment.value || 50}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tổng danh mục</span>
                <span className="text-blue-400 font-medium">{formatVND(totalPortfolio)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
