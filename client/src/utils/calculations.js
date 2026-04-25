// Client-side calculations (mirrored from server)
import {
  BASE_ALLOCATIONS,
  SENTIMENT_BANDS,
  HORIZON_OVERLAYS,
  CAPITAL_OVERLAYS,
  ASSET_CLASSES,
  RECOMMENDATION_TEXTS,
} from '../constants/investmentConstants';

export function calcAPY(apr, n = 12) {
  return (Math.pow(1 + (apr / 100) / n, n) - 1) * 100;
}

export function calcEAR(apr, feeProcessing, feeInsurance, feeManagement, termMonths) {
  const apy = calcAPY(apr);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = Math.min(annualizedProcessingFee + feeInsurance + feeManagement, 300);
  return apy + totalAnnualFees;
}

export function calcReducingMonthlyPayment(principal, apr, termMonths) {
  const r = (apr / 100) / 12;
  if (r === 0) return principal / termMonths;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

export function calcFlatMonthlyPayment(principal, apr, termMonths) {
  const totalInterest = principal * (apr / 100) * (termMonths / 12);
  return (principal + totalInterest) / termMonths;
}

export function simulateRepayment(debts, extraBudget, method = 'AVALANCHE') {
  let ds = debts.map(d => ({ ...d }));
  let months = 0, totalInterest = 0;
  const schedule = [];
  while (ds.some(d => d.balance > 0.01) && months < 360) {
    months++;
    let remaining = extraBudget;
    const monthPayments = [];
    ds.forEach(d => {
      if (d.balance > 0) {
        const interest = d.balance * (d.apr / 100) / 12;
        totalInterest += interest;
        d.balance += interest;
      }
    });
    ds.forEach(d => {
      if (d.balance > 0) {
        const pay = Math.min(d.minPayment, d.balance);
        d.balance -= pay;
        remaining -= pay;
        d.balance = Math.max(0, d.balance);
        monthPayments.push({ debtId: d.id, name: d.name, paid: pay, balance: d.balance });
      }
    });
    if (remaining > 0) {
      const activeDebts = ds.filter(d => d.balance > 0.01);
      let target = method === 'AVALANCHE'
        ? activeDebts.sort((a, b) => b.apr - a.apr)[0]
        : activeDebts.sort((a, b) => a.balance - b.balance)[0];
      if (target) {
        const pay = Math.min(remaining, target.balance);
        target.balance -= pay;
        target.balance = Math.max(0, target.balance);
        const existing = monthPayments.find(p => p.debtId === target.id);
        if (existing) { existing.paid += pay; existing.balance = target.balance; }
      }
    }
    schedule.push({ month: months, payments: monthPayments });
  }
  return { months, totalInterest: Math.round(totalInterest), schedule, isCompleted: months < 360 };
}

export function calcDebtToIncomeRatio(totalMonthlyDebtPayments, monthlyIncome) {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}

export function formatNumber(value, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('vi-VN', options).format(number);
}

export function normalizeLocaleNumberInput(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const hasTrailingSeparator = /[,.]$/.test(raw);
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '');
  const isNegative = normalized.startsWith('-');
  const unsigned = normalized.replace(/-/g, '');
  const [integerPart = '', ...decimalParts] = unsigned.split('.');
  const decimalPart = decimalParts.join('');
  if (decimalPart) return `${isNegative ? '-' : ''}${integerPart}.${decimalPart}`;
  if (hasTrailingSeparator) return `${isNegative ? '-' : ''}${integerPart}.`;
  return `${isNegative ? '-' : ''}${integerPart}`;
}

export function formatIntegerInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? formatNumber(digits) : '';
}

export function formatDecimalInput(value, decimals = 2) {
  const normalized = normalizeLocaleNumberInput(value);
  if (!normalized) return '';

  const isNegative = normalized.startsWith('-');
  const unsigned = normalized.replace('-', '');
  const [integerPart = '', decimalPart = ''] = unsigned.split('.');
  const formattedInteger = integerPart ? formatNumber(integerPart) : '0';
  const trimmedDecimal = decimalPart.slice(0, decimals);
  const hasTrailingSeparator = normalized.endsWith('.') && !trimmedDecimal;

  return `${isNegative ? '-' : ''}${formattedInteger}${trimmedDecimal ? `,${trimmedDecimal}` : hasTrailingSeparator ? ',' : ''}`;
}

export function detectDominoRisk(debts, monthlyIncome) {
  const alerts = [];
  const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const dtiRatio = calcDebtToIncomeRatio(totalMin, monthlyIncome);
  if (dtiRatio > 50) {
    alerts.push({ type: 'HIGH_DTI', severity: 'DANGER', message: `Tổng nợ chiếm ${dtiRatio.toFixed(1)}% thu nhập` });
  } else if (dtiRatio > 35) {
    alerts.push({ type: 'MEDIUM_DTI', severity: 'WARNING', message: `Tổng nợ chiếm ${dtiRatio.toFixed(1)}% thu nhập` });
  }
  return alerts;
}

export const ALLOCATION_RULES = BASE_ALLOCATIONS; // legacy alias — dùng BASE_ALLOCATIONS trực tiếp

export function getSentimentLabel(value) {
  return SENTIMENT_BANDS.find(b => value <= b.max)?.label ?? 'NEUTRAL';
}

export function getSentimentVietnamese(label) {
  return SENTIMENT_BANDS.find(b => b.label === label)?.labelVi ?? label;
}

// ─── Helper: áp overlay lên allocation ────────────────────────────────────────
function applyOverlay(alloc, overlay = {}) {
  const result = { ...alloc };
  for (const [k, delta] of Object.entries(overlay)) {
    result[k] = (result[k] ?? 0) + delta;
  }
  return result;
}

// ─── Helper: clamp về 0 rồi re-normalize về 100% ─────────────────────────────
function normalizeAllocation(alloc) {
  const clamped = Object.fromEntries(
    Object.entries(alloc).map(([k, v]) => [k, Math.max(0, Math.round(v * 10) / 10)])
  );
  const total = Object.values(clamped).reduce((s, v) => s + v, 0);
  if (total === 0) return clamped;
  if (Math.abs(total - 100) < 0.5) {
    // Fix rounding error nhỏ bằng cách cộng vào savings
    clamped.savings = Math.round((clamped.savings + (100 - total)) * 10) / 10;
    return clamped;
  }
  // Re-normalize nếu lệch nhiều
  return Object.fromEntries(
    Object.entries(clamped).map(([k, v]) => [k, Math.round((v / total) * 100)])
  );
}

// ─── Goal adjustment (giữ logic cũ) ──────────────────────────────────────────
function applyGoalAdjustment(alloc, goal) {
  const a = { ...alloc };
  if (goal === 'STABILITY') {
    let shiftP = Math.min(10, a.stocks + a.crypto);
    if (a.crypto > 0) { const take = Math.min(shiftP, a.crypto); a.crypto -= take; a.bonds += take; shiftP -= take; }
    if (shiftP > 0 && a.stocks > 0) { const take = Math.min(shiftP, a.stocks); a.stocks -= take; a.bonds += take; }
  } else if (goal === 'SPECULATION') {
    let shiftP = Math.min(10, a.savings + a.bonds);
    if (a.savings > 0) { const take = Math.min(shiftP, a.savings); a.savings -= take; a.crypto += take; shiftP -= take; }
    if (shiftP > 0 && a.bonds > 0) { const take = Math.min(shiftP, a.bonds); a.bonds -= take; a.crypto += take; }
  }
  return a;
}

// [LEGACY] Client-side heuristic allocation mirror.
// Runtime allocation should come from the server optimizer API.
// Kept for UI fallback/reference only.
export function getAllocation(profile, sentimentValue) {
  const riskLevel = profile?.riskLevel || 'MEDIUM';

  // 1. Base allocation theo risk level (có cơ sở Lifecycle Investing + VN context)
  let alloc = { ...BASE_ALLOCATIONS[riskLevel] };

  // 2. Sentiment overlay (fix bug: NEUTRAL = band [41-59], EXTREME_GREED tăng stocks không tăng savings)
  const band = SENTIMENT_BANDS.find(b => sentimentValue <= b.max) ?? SENTIMENT_BANDS[2];
  alloc = applyOverlay(alloc, band.overlay);

  // 3. Horizon overlay
  alloc = applyOverlay(alloc, HORIZON_OVERLAYS[profile?.horizon] ?? {});

  // 4. Capital overlay (soft scale thay vì hard cap cũ)
  const capital = profile?.capital || 0;
  const capitalTier = capital > 0 && capital < 50_000_000 ? 'SMALL'
                    : capital >= 200_000_000 ? 'LARGE' : 'NORMAL';
  alloc = applyOverlay(alloc, CAPITAL_OVERLAYS[capitalTier]);

  // 5. Goal adjustment
  alloc = applyGoalAdjustment(alloc, profile?.goal);

  // 6. Normalize về 100%
  alloc = normalizeAllocation(alloc);

  // 7. Recommendation text
  const capitalWarning = capitalTier === 'SMALL'
    ? ' Quy mô vốn nhỏ (< 50tr), ưu tiên tích lũy tiết kiệm/vàng trước khi đa dạng hoá rủi ro.'
    : '';
  const recommendation = (RECOMMENDATION_TEXTS[band.label] ?? '') + capitalWarning;

  return {
    ...alloc,
    sentimentValue,
    sentimentLabel: band.label,
    sentimentVietnamese: band.labelVi,
    recommendation,
  };
}

// Export ASSET_CLASSES để InvestmentPage dùng tính expected returns
export { ASSET_CLASSES };

export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value, decimals = 1) {
  return `${formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}
