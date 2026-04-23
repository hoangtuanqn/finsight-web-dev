import React from 'react';
import { ASSET_LABELS } from './InvestmentConstants';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { BASE_ALLOCATIONS, SENTIMENT_BANDS } from '../../constants/investmentConstants';

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
 * Explains the reasoning behind an asset allocation.
 * Dùng BASE_ALLOCATIONS từ constants (single source of truth, không duplicate).
 */
export function explainAsset(asset, pct, profile, sentimentValue) {
  const reasons = [];
  const riskLabel = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }[profile?.riskLevel] || 'Trung bình';

  // Dùng SENTIMENT_BANDS để lấy label + labelVi (fix bug NEUTRAL band)
  const band = SENTIMENT_BANDS.find(b => sentimentValue <= b.max) ?? SENTIMENT_BANDS[2];
  const sentimentZone = band.labelVi;

  // Dùng BASE_ALLOCATIONS từ constants thay vì object duplicate
  const baseVal = BASE_ALLOCATIONS[profile?.riskLevel || 'MEDIUM']?.[asset] ?? 0;
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
  if (g === 'STABILITY' && asset === 'bonds') {
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

