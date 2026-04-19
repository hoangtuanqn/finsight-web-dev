import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { investmentAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import SentimentGauge from '../components/investment/SentimentGauge';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { formatVND, getAllocation } from '../utils/calculations';
import {
  Lock, TrendingUp, TrendingDown, Target, Bot, Thermometer, BarChart2,
  PieChart as PieChartIcon, FileText, AlertTriangle, ChevronDown, ChevronRight,
  HeartPulse, Lightbulb, Sparkles, ExternalLink,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];
const ASSET_LABELS = { savings: 'Tiết kiệm', gold: 'Vàng', stocks: 'Chứng khoán', bonds: 'Trái phiếu', crypto: 'Crypto' };
const ASSET_ICONS  = { savings: '🏦', gold: '🥇', stocks: '📈', bonds: '📜', crypto: '₿' };
const ASSET_NATURE = { savings: 'phòng thủ', gold: 'phòng thủ', stocks: 'tăng trưởng', bonds: 'thu nhập', crypto: 'đầu cơ' };

const tooltipStyle = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

// ─── Feature 1: Delta Chip ────────────────────────────────────────────────────

function DeltaChip({ current, previous }) {
  if (previous === undefined || previous === null) return null;
  const delta = +(current - previous).toFixed(1);
  if (delta === 0) return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.05] text-slate-500 border border-white/[0.06]">
      — 0%
    </span>
  );
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
      up ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-red-500/15 text-red-400 border-red-500/20'
    }`}>
      {up ? '▲' : '▼'} {Math.abs(delta)}%
    </span>
  );
}

// ─── Feature 2: Portfolio Health Score Card ───────────────────────────────────

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

function PortfolioHealthCard({ allocation, projection, profile }) {
  const capital = profile?.capital || 0;
  const inflationRate = profile?.inflationRate !== undefined ? profile.inflationRate / 100 : 0.035;

  // Diversification (HHI)
  const vals = Object.values(allocation);
  const hhi = vals.reduce((s, p) => s + (p / 100) ** 2, 0);
  const minHHI = 1 / vals.length;
  const diversificationScore = Math.round(Math.max(0, Math.min(100, ((1 - hhi) / (1 - minHHI)) * 100)));

  // Return score (CAGR 10y)
  const fv10 = projection?.['10y'] || capital;
  const cagr = capital > 0 ? Math.pow(fv10 / capital, 1 / 10) - 1 : 0;
  const returnScore = Math.min(100, Math.round((cagr / 0.15) * 100));

  // Risk alignment
  const aggressiveWeight = ((allocation.stocks || 0) + (allocation.crypto || 0)) / 100;
  const riskTarget = { LOW: 0.15, MEDIUM: 0.40, HIGH: 0.65 }[profile?.riskLevel] ?? 0.40;
  const riskAlignmentScore = Math.max(0, Math.round(100 - Math.abs(aggressiveWeight - riskTarget) * 200));

  const healthScore = Math.round(diversificationScore * 0.35 + returnScore * 0.40 + riskAlignmentScore * 0.25);
  const displayed = useCountUp(healthScore);

  const scoreColor = healthScore >= 80 ? '#10b981' : healthScore >= 65 ? '#3b82f6' : healthScore >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = healthScore >= 80 ? 'Xuất sắc' : healthScore >= 65 ? 'Tốt' : healthScore >= 50 ? 'Trung bình' : 'Cần cải thiện';

  const circumference = 2 * Math.PI * 40;

  const SubScore = ({ icon, label, score, desc }) => {
    const barColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-slate-400 flex items-center gap-1.5">{icon} {label}</span>
          <span className="text-[12px] font-bold text-white">{score}</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: barColor }}
          />
        </div>
        <p className="text-[10px] text-slate-600">{desc}</p>
      </div>
    );
  };

  return (
    <div className="glass-card shadow-[0_0_24px_rgba(59,130,246,0.06)]">
      <h3 className="text-[13px] font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
        <HeartPulse size={14} className="text-blue-400" /> Sức khoẻ danh mục
      </h3>
      <div className="flex items-center gap-5 mb-5">
        {/* Ring gauge */}
        <div className="relative shrink-0 w-[100px] h-[100px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={scoreColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(healthScore / 100) * circumference} ${circumference}`}
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${(healthScore / 100) * circumference} ${circumference}` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[26px] font-extrabold leading-none" style={{ color: scoreColor }}>{displayed}</span>
            <span className="text-[10px] text-slate-500">/100</span>
          </div>
        </div>
        <div>
          <p className="text-[18px] font-bold text-white leading-tight">{scoreLabel}</p>
          <p className="text-[11px] text-slate-500 mt-1">CAGR 10 năm: {(cagr * 100).toFixed(1)}%/năm</p>
          <p className="text-[11px] text-slate-500">Thực (sau lạm phát): {((cagr - inflationRate) * 100).toFixed(1)}%/năm</p>
        </div>
      </div>
      <div className="space-y-3">
        <SubScore
          icon="🎯"
          label="Đa dạng hóa (HHI)"
          score={diversificationScore}
          desc={`HHI = ${hhi.toFixed(3)} — ${diversificationScore >= 70 ? 'Phân bổ cân bằng tốt' : 'Nên đa dạng thêm'}`}
        />
        <SubScore
          icon="📈"
          label="Tỷ suất sinh lời"
          score={returnScore}
          desc={`CAGR ${(cagr * 100).toFixed(1)}%/năm — mục tiêu chuẩn 15%`}
        />
        <SubScore
          icon="⚖️"
          label="Phù hợp khẩu vị rủi ro"
          score={riskAlignmentScore}
          desc={`Tài sản tăng trưởng: ${(aggressiveWeight * 100).toFixed(0)}% — mục tiêu ${(riskTarget * 100).toFixed(0)}%`}
        />
      </div>
    </div>
  );
}

// ─── Investment Suggestions Data ─────────────────────────────────────────────

const INVESTMENT_SUGGESTIONS = {
  savings: {
    label: 'Tiết kiệm', icon: '🏦', color: '#3b82f6',
    intro: 'Chọn ngân hàng có lãi suất kỳ hạn cao nhất phù hợp với kỳ hạn đầu tư của bạn.',
    items: [
      { name: 'ACB',         tag: '12 tháng', rate: '5.5%/năm',  note: 'Lãi suất ổn định, uy tín cao',       badge: 'Phổ biến',  badgeColor: 'blue'    },
      { name: 'Techcombank', tag: '6 tháng',  rate: '5.2%/năm',  note: 'Online banking tiện lợi, rút linh hoạt', badge: '',        badgeColor: ''        },
      { name: 'VPBank',      tag: '12 tháng', rate: '5.8%/năm',  note: 'Lãi suất cạnh tranh, nhiều ưu đãi',  badge: 'Lãi cao',   badgeColor: 'emerald' },
      { name: 'MSB',         tag: '13 tháng', rate: '6.0%/năm',  note: 'Kỳ hạn linh hoạt, lãi suất hấp dẫn', badge: 'Lãi cao',  badgeColor: 'emerald' },
      { name: 'HDBank',      tag: '12 tháng', rate: '5.7%/năm',  note: 'Tốt cho gửi trực tuyến, phí thấp',   badge: '',          badgeColor: ''        },
    ],
    tips: ['Gửi online thường có lãi suất cao hơn quầy 0.1-0.3%', 'Kỳ hạn 12-13 tháng thường cho lãi tốt nhất', 'Chia nhỏ nhiều kỳ để có thanh khoản tốt hơn'],
  },
  gold: {
    label: 'Vàng', icon: '🥇', color: '#f59e0b',
    intro: 'Vàng là tài sản phòng thủ tốt trong biến động. Ưu tiên vàng miếng SJC hoặc vàng nhẫn 24K.',
    items: [
      { name: 'Vàng miếng SJC',       tag: 'Thanh khoản cao', rate: '~95-98 tr/lượng', note: 'Chuẩn quốc gia, thanh khoản cao nhất, dễ mua bán', badge: 'Khuyên dùng', badgeColor: 'amber'   },
      { name: 'Vàng nhẫn 24K PNJ',    tag: 'Nhỏ lẻ',         rate: '~88-92 tr/lượng', note: 'Dễ mua nhỏ lẻ, phí thấp, phù hợp tích lũy dần',  badge: 'Linh hoạt',   badgeColor: 'blue'    },
      { name: 'Vàng nhẫn DOJI',       tag: 'Phổ biến',        rate: '~88-92 tr/lượng', note: 'Hệ thống rộng, kiểm định rõ ràng',               badge: '',            badgeColor: ''        },
      { name: 'Chứng chỉ vàng BIDV',  tag: 'Không giữ vật lý', rate: 'Theo giá SJC',  note: 'Mua bán qua app, không cần cất giữ vật lý',       badge: 'Tiện lợi',    badgeColor: 'purple'  },
    ],
    tips: ['Mua tại đại lý ủy quyền của SJC để tránh hàng giả', 'Chênh lệch mua/bán SJC thường 1-2 triệu/lượng — cần giữ dài hạn', 'Vàng nhẫn phù hợp tích lũy nhỏ, vàng miếng cho vốn lớn'],
  },
  stocks: {
    label: 'Chứng khoán', icon: '📈', color: '#10b981',
    intro: 'Đầu tư cổ phiếu VN-Index — ưu tiên cổ phiếu bluechip và ETF để giảm rủi ro cá biệt.',
    items: [
      { name: 'VNM (Vinamilk)',   tag: 'Tiêu dùng',    rate: 'Cổ tức ~5%/năm',   note: 'Cổ phiếu phòng thủ, cổ tức đều, ít biến động',     badge: 'An toàn',    badgeColor: 'blue'    },
      { name: 'FPT Corporation',  tag: 'Công nghệ',    rate: 'Tăng trưởng 20%+', note: 'Dẫn đầu công nghệ VN, mảng offshore tăng mạnh',    badge: 'Tăng trưởng', badgeColor: 'emerald' },
      { name: 'VCB (Vietcombank)', tag: 'Ngân hàng',  rate: 'ROE ~20%',          note: 'Ngân hàng lớn nhất, tỷ lệ nợ xấu thấp, ổn định',  badge: 'Bluechip',   badgeColor: 'amber'   },
      { name: 'E1VFVN30 (ETF)',   tag: 'ETF',          rate: 'Theo VN30',        note: 'Đầu tư thụ động, phân tán rủi ro tự động, phí thấp', badge: 'Khuyên dùng', badgeColor: 'amber'  },
      { name: 'HPG (Hòa Phát)',   tag: 'Thép/BĐS',    rate: 'P/E thấp ~8x',     note: 'Doanh nghiệp lớn nhất ngành thép, biên lợi nhuận tốt', badge: '',          badgeColor: ''        },
    ],
    tips: ['Không bỏ hết vào 1 mã — đa dạng ít nhất 5-7 cổ phiếu', 'ETF là lựa chọn tốt nhất cho người mới bắt đầu', 'DCA (mua đều hàng tháng) giúp giảm rủi ro giá bình quân'],
  },
  bonds: {
    label: 'Trái phiếu', icon: '📜', color: '#8b5cf6',
    intro: 'Trái phiếu cho thu nhập cố định ổn định. Ưu tiên trái phiếu chính phủ hoặc ngân hàng lớn.',
    items: [
      { name: 'Trái phiếu Chính phủ', tag: 'An toàn nhất', rate: '5.5-6.5%/năm', note: 'Rủi ro gần bằng 0, lãi suất cố định, kỳ hạn 2-10 năm', badge: 'Khuyên dùng', badgeColor: 'purple' },
      { name: 'TP Vietcombank',        tag: 'Ngân hàng lớn', rate: '6.0-7.0%/năm', note: 'An toàn cao, thanh khoản tốt, phát hành định kỳ',     badge: 'Ổn định',    badgeColor: 'blue'   },
      { name: 'Quỹ VCBF-BCF',         tag: 'Quỹ trái phiếu', rate: '~6-7%/năm',  note: 'Quản lý chuyên nghiệp, đa dạng nhiều loại TP',        badge: 'Tiện lợi',   badgeColor: 'blue'   },
    ],
    tips: ['Tránh trái phiếu doanh nghiệp bất động sản lãi suất cao bất thường', 'Kỳ hạn 2-5 năm là cân bằng tốt giữa lãi suất và thanh khoản', 'Có thể mua qua app MBBank, TCBS với lô nhỏ 1-10 triệu'],
  },
  crypto: {
    label: 'Crypto', icon: '₿', color: '#f97316',
    intro: 'Crypto có biến động cao — chỉ đầu tư phần vốn chấp nhận mất hoàn toàn. Tập trung vào coin lớn.',
    items: [
      { name: 'Bitcoin (BTC)',  tag: 'Store of Value', rate: 'Cap ~$1.3T',  note: 'Coin lớn nhất, ít rủi ro nhất trong crypto, lưu trữ giá trị dài hạn', badge: 'Khuyên dùng', badgeColor: 'amber'   },
      { name: 'Ethereum (ETH)', tag: 'Smart Contract', rate: 'Cap ~$400B',  note: 'Nền tảng DeFi/NFT lớn nhất, nhiều use case thực tế',                  badge: 'Tiềm năng',  badgeColor: 'blue'    },
      { name: 'BNB',            tag: 'Exchange Token', rate: 'Cap ~$90B',   note: 'Token Binance, phí giao dịch thấp, ecosystem lớn',                    badge: '',           badgeColor: ''        },
      { name: 'USDC / USDT',   tag: 'Stablecoin',     rate: 'Yield ~5-8%', note: 'Gửi stablecoin để hưởng lãi, tránh biến động giá',                    badge: 'Ít rủi ro',  badgeColor: 'emerald' },
    ],
    tips: ['BTC + ETH nên chiếm >70% danh mục crypto', 'Không để crypto trên sàn — rút về ví cứng Ledger/Trezor', 'Dollar-cost averaging (DCA) hàng tháng giảm rủi ro timing'],
  },
};

// ─── Investment Suggestions Panel ────────────────────────────────────────────

function InvestmentSuggestionsPanel({ allocation }) {
  const [openTab, setOpenTab] = useState(null);

  // Chỉ hiển thị các asset có tỷ trọng > 0, sắp xếp theo tỷ trọng giảm dần
  const activeAssets = Object.entries(allocation)
    .filter(([, pct]) => pct > 0)
    .sort(([, a], [, b]) => b - a);

  // Mở tab đầu tiên (tỷ trọng cao nhất) mặc định
  const defaultTab = activeAssets[0]?.[0] ?? null;
  const active = openTab ?? defaultTab;

  const badgeCls = (color) => ({
    amber:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
    blue:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    purple:  'bg-purple-500/15 text-purple-400 border-purple-500/20',
  })[color] || '';

  const suggestion = active ? INVESTMENT_SUGGESTIONS[active] : null;

  return (
    <div className="glass-card shadow-[0_0_24px_rgba(245,158,11,0.05)]">
      <h3 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2">
        <Sparkles size={16} className="text-amber-400" /> Gợi ý đầu tư cụ thể
      </h3>
      <p className="text-[12px] text-slate-500 mb-4">Theo tỷ trọng phân bổ danh mục của bạn</p>

      {/* Asset tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {activeAssets.map(([asset, pct]) => {
          const sg = INVESTMENT_SUGGESTIONS[asset];
          const isActive = active === asset;
          return (
            <button
              key={asset}
              onClick={() => setOpenTab(asset)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-all border ${
                isActive
                  ? 'text-white border-transparent'
                  : 'bg-white/[0.03] text-slate-400 border-white/[0.06] hover:text-slate-200'
              }`}
              style={isActive ? { background: sg?.color + '25', borderColor: sg?.color + '50', color: sg?.color } : {}}
            >
              <span>{sg?.icon}</span>
              {sg?.label}
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/10' : 'bg-white/[0.05]'}`}>
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {suggestion && (
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Intro */}
            <p className="text-[12px] text-slate-400 mb-4 leading-relaxed px-1">
              {suggestion.intro}
            </p>

            {/* Cards */}
            <div className="space-y-2 mb-4">
              {suggestion.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-bold shrink-0 text-white"
                    style={{ background: suggestion.color + '20', border: `1px solid ${suggestion.color}30` }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-white">{item.name}</span>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badgeCls(item.badgeColor)}`}>
                          {item.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-600 bg-white/[0.04] px-1.5 py-0.5 rounded-md">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[12px] font-bold" style={{ color: suggestion.color }}>{item.rate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3">
              <p className="text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">💡 Lưu ý quan trọng</p>
              <ul className="space-y-1.5">
                {suggestion.tips.map((tip, i) => (
                  <li key={i} className="text-[12px] text-slate-400 flex items-start gap-2">
                    <span className="text-slate-600 shrink-0 mt-0.5">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-slate-600 mt-4 text-center leading-relaxed">
        ⚠️ Các gợi ý trên chỉ mang tính tham khảo — không phải lời khuyên đầu tư. Tự nghiên cứu trước khi quyết định.
      </p>
    </div>
  );
}



function explainAsset(asset, pct, profile, sentimentValue) {
  const reasons = [];
  const riskLabel = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }[profile?.riskLevel] || 'Trung bình';
  const sentimentZone =
    sentimentValue <= 24 ? 'Sợ hãi cực độ' :
    sentimentValue <= 49 ? 'Sợ hãi' :
    sentimentValue <= 74 ? 'Tham lam' : 'Tham lam cực độ';
  const sentimentKey =
    sentimentValue <= 24 ? 'EXTREME_FEAR' :
    sentimentValue <= 49 ? 'FEAR' :
    sentimentValue === 50 ? 'NEUTRAL' :
    sentimentValue <= 74 ? 'GREED' : 'EXTREME_GREED';

  // Layer 1: base matrix
  const BASE = {
    LOW:    { EXTREME_FEAR: { savings:70,gold:20,bonds:10,stocks:0,crypto:0 }, FEAR: { savings:60,gold:25,bonds:15,stocks:0,crypto:0 }, NEUTRAL: { savings:50,gold:20,bonds:15,stocks:15,crypto:0 }, GREED: { savings:55,gold:20,bonds:15,stocks:10,crypto:0 }, EXTREME_GREED: { savings:65,gold:25,bonds:10,stocks:0,crypto:0 } },
    MEDIUM: { EXTREME_FEAR: { savings:35,gold:30,bonds:10,stocks:25,crypto:0 }, FEAR: { savings:25,gold:25,bonds:10,stocks:35,crypto:5 }, NEUTRAL: { savings:20,gold:20,bonds:10,stocks:40,crypto:10 }, GREED: { savings:15,gold:15,bonds:10,stocks:45,crypto:15 }, EXTREME_GREED: { savings:30,gold:25,bonds:10,stocks:30,crypto:5 } },
    HIGH:   { EXTREME_FEAR: { savings:10,gold:25,bonds:5,stocks:40,crypto:20 }, FEAR: { savings:10,gold:15,bonds:5,stocks:45,crypto:25 }, NEUTRAL: { savings:10,gold:15,bonds:0,stocks:40,crypto:35 }, GREED: { savings:10,gold:10,bonds:0,stocks:45,crypto:35 }, EXTREME_GREED: { savings:20,gold:20,bonds:0,stocks:35,crypto:25 } },
  };
  const baseVal = BASE[profile?.riskLevel || 'MEDIUM']?.[sentimentKey]?.[asset] ?? 0;
  reasons.push({
    layer: 'Tầng 1 — Ma trận cơ sở',
    icon: '🎲',
    text: `Rủi ro ${riskLabel} × Tâm lý "${sentimentZone}" (${sentimentValue}) → phân bổ nền: ${baseVal}%`,
  });

  // Layer 2: savings rate
  const sr = profile?.savingsRate || 6;
  if (asset === 'savings' && sr > 6.5) {
    reasons.push({ layer: 'Tầng 2 — Lãi suất tiết kiệm', icon: '💰', text: `Lãi suất ${sr}% cao hơn chuẩn 6% → tăng tỷ trọng Tiết kiệm (lãi tốt nên giữ nhiều hơn)` });
  } else if (asset === 'stocks' && sr < 5.5) {
    reasons.push({ layer: 'Tầng 2 — Lãi suất tiết kiệm', icon: '💰', text: `Lãi suất ${sr}% thấp hơn chuẩn 6% → tăng tỷ trọng Chứng khoán (tiết kiệm kém hiệu quả hơn)` });
  }

  // Layer 3: horizon
  const h = profile?.horizon || 'MEDIUM';
  const horizonEffects = {
    savings:  { SHORT: 'tăng (bảo toàn vốn ngắn hạn)', LONG: 'giảm (nhường chỗ tài sản tăng trưởng)' },
    stocks:   { SHORT: 'giảm (tránh biến động ngắn hạn)', LONG: 'tăng (tăng trưởng dài hạn tốt hơn)' },
    crypto:   { SHORT: 'giảm mạnh (quá rủi ro ngắn hạn)', LONG: 'tăng (tiềm năng cao dài hạn)' },
    gold:     { SHORT: 'giữ nguyên (phòng thủ)', LONG: 'giảm nhẹ (ưu tiên tăng trưởng)' },
    bonds:    { SHORT: 'tăng (ổn định ngắn hạn)', LONG: 'giảm (lợi nhuận thấp dài hạn)' },
  };
  const hEffect = horizonEffects[asset]?.[h];
  if (hEffect) {
    const hLabel = { SHORT: 'Ngắn hạn', MEDIUM: 'Trung hạn', LONG: 'Dài hạn' }[h];
    reasons.push({ layer: 'Tầng 3 — Kỳ hạn đầu tư', icon: '⏳', text: `Kỳ hạn ${hLabel} → tỷ trọng ${ASSET_LABELS[asset]} ${hEffect}` });
  }

  // Layer 4: goal
  const g = profile?.goal;
  if (g === 'STABILITY' && (asset === 'bonds')) {
    reasons.push({ layer: 'Tầng 4 — Mục tiêu đầu tư', icon: '🎯', text: 'Mục tiêu Ổn định → tăng Trái phiếu để bảo toàn thu nhập đều đặn' });
  }
  if (g === 'STABILITY' && (asset === 'crypto' || asset === 'stocks')) {
    reasons.push({ layer: 'Tầng 4 — Mục tiêu đầu tư', icon: '🎯', text: `Mục tiêu Ổn định → giảm ${ASSET_LABELS[asset]} (tránh biến động mạnh)` });
  }
  if (g === 'SPECULATION' && asset === 'crypto') {
    reasons.push({ layer: 'Tầng 4 — Mục tiêu đầu tư', icon: '🎯', text: 'Mục tiêu Tăng trưởng mạnh → tăng Crypto để tối đa hoá tiềm năng lợi nhuận' });
  }

  return reasons;
}

function AllocationExplanationPanel({ allocation, profile, sentimentValue, portfolioBreakdown }) {
  const [openAsset, setOpenAsset] = useState(null);
  const riskLabel  = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }[profile?.riskLevel] || '—';
  const horizonLabel = { SHORT: 'Ngắn hạn', MEDIUM: 'Trung hạn', LONG: 'Dài hạn' }[profile?.horizon] || '—';
  const goalLabel  = { STABILITY: 'Ổn định', SPECULATION: 'Tăng trưởng', GROWTH: 'Tăng trưởng', INCOME: 'Thu nhập' }[profile?.goal] || '—';

  const sorted = Object.entries(allocation).sort(([,a],[,b]) => b - a);

  return (
    <div className="glass-card shadow-[0_0_24px_rgba(139,92,246,0.06)]">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-400" /> Tại sao danh mục này?
        </h3>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">Rủi ro: {riskLabel}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">{horizonLabel}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">{goalLabel}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {sorted.map(([asset, pct]) => {
          const meta = { icon: ASSET_ICONS[asset], label: ASSET_LABELS[asset] };
          const reasons = explainAsset(asset, pct, profile, sentimentValue);
          const isOpen = openAsset === asset;
          const breakdown = portfolioBreakdown.find(p => p.asset === ASSET_LABELS[asset]);

          return (
            <div key={asset} className="rounded-xl overflow-hidden border border-white/[0.06]">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left"
                onClick={() => setOpenAsset(isOpen ? null : asset)}
              >
                <span className="text-base shrink-0">{meta.icon}</span>
                <span className="text-[13px] font-semibold text-slate-200 flex-1">{meta.label}</span>
                {/* Mini bar */}
                <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden mx-2">
                  <div className="h-full bg-blue-400/60 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[13px] font-bold text-white w-10 text-right">{pct}%</span>
                {isOpen ? <ChevronDown size={14} className="text-slate-500 shrink-0" /> : <ChevronRight size={14} className="text-slate-500 shrink-0" />}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-3 space-y-3 bg-white/[0.01] border-t border-white/[0.04]">
                      {reasons.map((r, i) => (
                        <div key={i}>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-[10px] font-bold text-slate-400 mb-1">
                            {r.icon} {r.layer}
                          </span>
                          <p className="text-[12px] text-slate-400 leading-relaxed">{r.text}</p>
                          {i < reasons.length - 1 && (
                            <p className="text-center text-slate-600 text-xs mt-1">↓</p>
                          )}
                        </div>
                      ))}
                      {/* Final result */}
                      <div className="flex items-center justify-between bg-emerald-500/8 border border-emerald-500/15 rounded-lg px-3 py-2 mt-2">
                        <span className="text-[12px] text-emerald-400 font-semibold">✅ Kết quả phân bổ</span>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-white">{pct}%</span>
                          {breakdown && <span className="text-[11px] text-slate-400 ml-1.5">({formatVND(breakdown.amount)})</span>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

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

  if (isProfileIncomplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card max-w-md p-10">
          <div className="text-5xl mb-6"><Lock size={48} className="mx-auto text-slate-400" /></div>
          <h2 className="text-xl font-bold text-white mb-3">Chưa đủ dữ liệu phân tích</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Hệ thống AI cần biết <strong>Thu nhập</strong> và <strong>Số vốn</strong> của bạn để đưa ra đề xuất phân bổ tài sản chính xác nhất.
          </p>
          <Link to="/profile" className="btn-primary w-full">Hoàn thiện Hồ sơ ngay</Link>
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
    gold:    derivedResult.gold,
    stocks:  derivedResult.stocks,
    bonds:   derivedResult.bonds,
    crypto:  derivedResult.crypto,
  };
  const recommendation = derivedResult.recommendation;

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

  const calcFV = (rate, years) => {
    if (rate === 0) return capital + (mockProfile.monthlyAdd || 0) * 12 * years;
    return capital * Math.pow(1 + rate, years) +
      (mockProfile.monthlyAdd || 0) * 12 * ((Math.pow(1 + rate, years) - 1) / rate);
  };

  const projectionBase = { '1y': Math.round(calcFV(realReturn,1)), '3y': Math.round(calcFV(realReturn,3)), '5y': Math.round(calcFV(realReturn,5)), '10y': Math.round(calcFV(realReturn,10)) };

  const projectionData = [
    { year: 'Hiện tại', base: capital, optimistic: capital, pessimistic: capital, savings: capital },
    ...[1, 3, 5, 10].map(years => ({
      year: `${years} năm`,
      base:        Math.round(calcFV(realReturn, years)),
      optimistic:  Math.round(calcFV(optReturn, years)),
      pessimistic: Math.round(calcFV(pessReturn, years)),
      savings:     Math.round(calcFV(rates.savings - inflationRate, years)),
    }))
  ];

  // History delta helpers
  const prev = history?.[1] || null;
  const curr = history?.[0] || null;

  const assetKeyMap = { savings: 'savings', gold: 'gold', stocks: 'stocks', bonds: 'bonds', crypto: 'crypto' };

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

      {/* ── Market Ticker ── */}
      <div className="glass-card mb-6">
        <h3 className="text-[12px] font-semibold mb-3 text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><BarChart2 size={14} /> Thị trường</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Bitcoin',   value: prices.bitcoin?.price  ? `$${prices.bitcoin.price.toLocaleString()}`                 : '—', change: prices.bitcoin?.change24h },
            { label: 'Ethereum',  value: prices.ethereum?.price ? `$${prices.ethereum.price.toLocaleString()}`                : '—', change: prices.ethereum?.change24h },
            { label: 'Vàng SJC', value: prices.gold?.sell       ? `${prices.gold.sell.toLocaleString('vi-VN')} đ`            : '—', extra: prices.gold?.unit || '' },
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

      {/* ── Row 1: Sentiment Gauge (1/3) + Portfolio Health (2/3) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="glass-card">
          <h3 className="text-[12px] font-semibold mb-4 text-center text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5"><Thermometer size={14} /> Fear & Greed Index</h3>
          <SentimentGauge value={sentiment.value || 50} />
          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Tâm lý</span><span className="text-white font-medium">{sentiment.labelVi || 'Trung lập'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Giá trị</span><span className="text-white font-medium">{sentiment.value || 50}/100</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Tổng danh mục</span><span className="text-blue-400 font-medium">{formatVND(capital)}</span></div>
          </div>
        </div>
        <div className="md:col-span-2">
          <PortfolioHealthCard allocation={derivedAllocation} projection={projectionBase} profile={mockProfile} />
        </div>
      </div>

      {/* ── AI Recommendation ── */}
      {recommendation && (
        <div className="glass-card bg-blue-500/3 mb-6" style={{ borderColor: 'rgba(59, 130, 246, 0.12)' }}>
          <p className="text-sm text-blue-300">
            <Bot size={14} className="inline mr-1" /> <span className="font-semibold">AI phân tích:</span> {recommendation}
          </p>
        </div>
      )}

      {/* ── Row 2: Pie Chart (1/2) + Breakdown Table with Delta Chips (1/2) ── */}
      <div className="glass-card mb-6">
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
            {portfolioBreakdown.filter(p => p.percentage > 0).map((p, i) => {
              const assetKey = Object.entries(ASSET_LABELS).find(([, v]) => v === p.asset)?.[0];
              return (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-slate-300">{p.asset}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {assetKey && curr && prev && (
                      <DeltaChip
                        current={curr[assetKey] ?? p.percentage}
                        previous={prev[assetKey] ?? null}
                      />
                    )}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{p.percentage}%</p>
                      <p className="text-[11px] text-slate-500">{formatVND(p.amount)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Explanation Panel ── */}
      <div className="mb-6">
        <AllocationExplanationPanel
          allocation={derivedAllocation}
          profile={mockProfile}
          sentimentValue={sentimentValue}
          portfolioBreakdown={portfolioBreakdown}
        />
      </div>

      {/* ── Investment Suggestions ── */}
      <div className="mb-6">
        <InvestmentSuggestionsPanel allocation={derivedAllocation} />
      </div>

      {/* ── Projection Chart ── */}
      <div className="glass-card mb-6">
        <h3 className="text-[15px] font-semibold text-white mb-1 flex items-center gap-2"><BarChart2 size={16} /> Dự phóng tài sản</h3>
        <p className="text-[12px] text-slate-500 mb-4">So sánh: Gửi tiết kiệm 100% vs Phân bổ theo AI</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} tickFormatter={v => `${(v / 1000000).toFixed(0)}tr`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatVND(v), '']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="savings"     name="100% Tiết kiệm"    stroke="#64748b" strokeWidth={2}   strokeDasharray="5 5" dot={false} />
              <Line type="monotone" dataKey="optimistic"  name="Lạc quan"          stroke="#10b981" strokeWidth={2}   dot={false} strokeOpacity={0.6} />
              <Line type="monotone" dataKey="base"        name="Phân bổ AI (Base)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="pessimistic" name="Bi quan"           stroke="#ef4444" strokeWidth={2}   dot={false} strokeOpacity={0.6} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-slate-500 mt-3 text-center">
          Giá trị dự phóng đã tính chiết khấu lạm phát ({mockProfile.inflationRate ?? 3.5}%/năm) để phản ánh sức mua thực tế.
        </p>
      </div>

      {/* ── Disclaimer ── */}
      <div className="glass-card bg-red-500/5 border-red-500/10 mb-6">
        <p className="text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span>
            <strong>Tuyên bố miễn trừ trách nhiệm:</strong> Các phân bổ và dự phóng tài sản trên chỉ mang tính chất mô phỏng kỹ thuật dựa trên dữ liệu quá khứ và hồ sơ rủi ro.
            Thị trường tài chính luôn biến động. Sự suy giảm vốn hoàn toàn có thể xảy ra ở kịch bản Bi quan. Bạn hãy tự chịu trách nhiệm với quyết định của mình.
          </span>
        </p>
      </div>

      {/* ── News ── */}
      {news.length > 0 && (
        <div className="glass-card">
          <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2"><FileText size={16} /> Tin tức tài chính</h3>
          <div className="space-y-1">
            {news.map((article, i) => (
              <a key={i} href={article.url} target="_blank" rel="noopener noreferrer"
                className="block px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-all group">
                <p className="text-sm text-slate-300 group-hover:text-blue-400 transition-colors leading-snug">{article.title}</p>
                <p className="text-[11px] text-slate-600 mt-1">{article.source} • {new Date(article.publishedAt).toLocaleDateString('vi-VN')}</p>
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
