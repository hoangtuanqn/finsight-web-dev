import React from 'react';
import { ASSET_LABELS } from './InvestmentConstants';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Calculates DeltaChip component for showing percentage changes
 */
export function DeltaChip({ current, previous }) {
  if (previous === undefined || previous === null) return null;
  const delta = +(current - previous).toFixed(1);
  
  if (delta === 0) return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/[0.05] text-slate-400 border border-white/10">
      <Minus size={10} /> 0%
    </span>
  );

  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
      up ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
    }`}>
      {up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(delta)}%
    </span>
  );
}

/**
 * Explains the reasoning behind an asset allocation
 */
export function explainAsset(asset, pct, profile, sentimentValue) {
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

  const BASE = {
    LOW:    { EXTREME_FEAR: { savings:70, gold:20, bonds:10, stocks:0, crypto:0 }, FEAR: { savings:60, gold:25, bonds:15, stocks:0, crypto:0 }, NEUTRAL: { savings:50, gold:20, bonds:15, stocks:15, crypto:0 }, GREED: { savings:55, gold:20, bonds:15, stocks:10, crypto:0 }, EXTREME_GREED: { savings:65, gold:25, bonds:10, stocks:0, crypto:0 } },
    MEDIUM: { EXTREME_FEAR: { savings:35, gold:30, bonds:10, stocks:25, crypto:0 }, FEAR: { savings:25, gold:25, bonds:10, stocks:35, crypto:5 }, NEUTRAL: { savings:20, gold:20, bonds:10, stocks:40, crypto:10 }, GREED: { savings:15, gold:15, bonds:10, stocks:45, crypto:15 }, EXTREME_GREED: { savings:30, gold:25, bonds:10, stocks:30, crypto:5 } },
    HIGH:   { EXTREME_FEAR: { savings:10, gold:25, bonds:5, stocks:40, crypto:20 }, FEAR: { savings:10, gold:15, bonds:5, stocks:45, crypto:25 }, NEUTRAL: { savings:10, gold:15, bonds:0, stocks:40, crypto:35 }, GREED: { savings:10, gold:10, bonds:0, stocks:45, crypto:35 }, EXTREME_GREED: { savings:20, gold:20, bonds:0, stocks:35, crypto:25 } },
  };

  const baseVal = BASE[profile?.riskLevel || 'MEDIUM']?.[sentimentKey]?.[asset] ?? 0;
  reasons.push({
    layer: 'Cơ sở',
    icon: 'Activity',
    text: `Rủi ro ${riskLabel} × Tâm lý "${sentimentZone}" → nền: ${baseVal}%`,
  });

  const sr = profile?.savingsRate || 6;
  if (asset === 'savings' && sr > 6.5) {
    reasons.push({ layer: 'Lãi suất', icon: 'Landmark', text: `Lãi suất ${sr}% > 6% → tăng tỷ trọng Tiết kiệm` });
  } else if (asset === 'stocks' && sr < 5.5) {
    reasons.push({ layer: 'Lãi suất', icon: 'Landmark', text: `Lãi suất ${sr}% < 6% → ưu tiên Chứng khoán` });
  }

  const h = profile?.horizon || 'MEDIUM';
  const horizonEffects = {
    savings:  { SHORT: 'tăng (bảo toàn vốn)', LONG: 'giảm (nhường chỗ tăng trưởng)' },
    stocks:   { SHORT: 'giảm (tránh biến động)', LONG: 'tăng (tăng trưởng dài hạn)' },
    crypto:   { SHORT: 'giảm mạnh (rủi ro cao)', LONG: 'tăng (tiềm năng dài hạn)' },
    gold:     { SHORT: 'giữ nguyên (phòng thủ)', LONG: 'giảm nhẹ (ưu tiên tài sản sinh lời)' },
    bonds:    { SHORT: 'tăng (ổn định)', LONG: 'giảm (lợi nhuận thấp)' },
  };
  const hEffect = horizonEffects[asset]?.[h];
  if (hEffect) {
    const hLabel = { SHORT: 'Ngắn hạn', MEDIUM: 'Trung hạn', LONG: 'Dài hạn' }[h];
    reasons.push({ layer: 'Kỳ hạn', icon: 'Clock', text: `Kỳ hạn ${hLabel} → ${hEffect}` });
  }

  const g = profile?.goal;
  if (g === 'STABILITY' && (asset === 'bonds')) {
    reasons.push({ layer: 'Mục tiêu', icon: 'Target', text: 'Mục tiêu Ổn định → tăng Trái phiếu' });
  }
  if (g === 'STABILITY' && (asset === 'crypto' || asset === 'stocks')) {
    reasons.push({ layer: 'Mục tiêu', icon: 'Target', text: `Mục tiêu Ổn định → giảm ${ASSET_LABELS[asset]}` });
  }
  if (g === 'SPECULATION' && asset === 'crypto') {
    reasons.push({ layer: 'Mục tiêu', icon: 'Target', text: 'Mục tiêu Tăng trưởng → tối ưu Crypto' });
  }

  return reasons;
}

/**
 * Calculates Future Value
 */
export const calcFV = (capital, monthlyAdd, rate, years) => {
  if (rate === 0) return capital + (monthlyAdd || 0) * 12 * years;
  return capital * Math.pow(1 + rate, years) +
    (monthlyAdd || 0) * 12 * ((Math.pow(1 + rate, years) - 1) / rate);
};
