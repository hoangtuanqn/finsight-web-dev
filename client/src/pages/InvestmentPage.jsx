import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { investmentAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import SentimentGauge from '../components/investment/SentimentGauge';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { formatVND } from '../utils/calculations';

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
          <div className="text-5xl mb-6">🔒</div>
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

  const allocation = allocationData?.allocation || {};
  const sentiment = allocationData?.sentimentData || {};
  const projection = allocationData?.projection || {};
  const portfolioBreakdown = allocationData?.portfolioBreakdown || [];
  const recommendation = allocationData?.recommendation || '';
  const prices = marketSummary?.prices || {};
  const news = marketSummary?.news || [];

  const pieData = Object.entries(allocation)
    .filter(([_, val]) => val > 0)
    .map(([key, val]) => ({ name: ASSET_LABELS[key] || key, value: val }));

  const totalPortfolio = portfolioBreakdown.reduce((s, p) => s + p.amount, 0);
  const projectionData = [
    { year: 'Hiện tại', recommended: totalPortfolio, savings: totalPortfolio },
    { year: '1 năm', recommended: projection['1y'] || 0, savings: Math.round(totalPortfolio * 1.06) },
    { year: '3 năm', recommended: projection['3y'] || 0, savings: Math.round(totalPortfolio * Math.pow(1.06, 3)) },
    { year: '5 năm', recommended: projection['5y'] || 0, savings: Math.round(totalPortfolio * Math.pow(1.06, 5)) },
    { year: '10 năm', recommended: projection['10y'] || 0, savings: Math.round(totalPortfolio * Math.pow(1.06, 10)) },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-white">📈 Tư vấn đầu tư AI</h1>
          <p className="text-slate-500 text-sm mt-1">Phân bổ tài sản dựa trên tâm lý thị trường & risk profile</p>
        </div>
        <Link to="/risk-assessment" className="btn-secondary text-[13px]">🎯 Cập nhật Risk Profile</Link>
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
            <h3 className="text-[12px] font-semibold mb-3 text-slate-500 uppercase tracking-wider">📡 Thị trường</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Bitcoin', value: prices.bitcoin?.price ? `$${prices.bitcoin.price.toLocaleString()}` : '—', change: prices.bitcoin?.change24h },
                { label: 'Ethereum', value: prices.ethereum?.price ? `$${prices.ethereum.price.toLocaleString()}` : '—', change: prices.ethereum?.change24h },
                { label: 'Vàng SJC', value: prices.gold?.sell ? `${(prices.gold.sell / 1000000).toFixed(1)}tr` : '—', extra: prices.gold?.unit || '' },
              ].map((item, i) => (
                <div key={i} className="py-1">
                  <p className="text-[11px] text-slate-500 mb-0.5">{item.label}</p>
                  <p className="font-bold text-white text-[15px]">{item.value}</p>
                  {item.change !== undefined && (
                    <p className={`text-[11px] font-medium ${(item.change || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(item.change || 0) >= 0 ? '▲' : '▼'} {Math.abs(item.change || 0).toFixed(2)}%
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
                🤖 <span className="font-semibold">AI phân tích:</span> {recommendation}
              </p>
            </div>
          )}

          {/* Allocation Pie + Breakdown */}
          <div className="glass-card">
            <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <span>🧩</span> Phân bổ danh mục khuyến nghị
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
              <span>📊</span> Dự phóng tài sản
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
                  <Line type="monotone" dataKey="recommended" name="Phân bổ AI" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* News */}
          {news.length > 0 && (
            <div className="glass-card">
              <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
                <span>📰</span> Tin tức tài chính
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
            <h3 className="text-[12px] font-semibold mb-4 text-center text-slate-500 uppercase tracking-wider">🌡️ Fear & Greed Index</h3>
            <SentimentGauge value={sentiment.value || 50} />
          </div>

          <div className="glass-card">
            <h3 className="text-[12px] font-semibold mb-3 text-slate-500 uppercase tracking-wider">📊 Thông tin</h3>
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
