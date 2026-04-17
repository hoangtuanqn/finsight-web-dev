// Client-side calculations (mirrored from server)
export function calcAPY(apr, n = 12) {
  return (Math.pow(1 + (apr / 100) / n, n) - 1) * 100;
}

export function calcEAR(apr, feeProcessing, feeInsurance, feeManagement, termMonths) {
  const apy = calcAPY(apr);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = annualizedProcessingFee + feeInsurance + feeManagement;
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

export const ALLOCATION_RULES = {
  LOW: { EXTREME_FEAR: { savings: 70, gold: 20, bonds: 10, stocks: 0, crypto: 0 }, FEAR: { savings: 60, gold: 25, bonds: 15, stocks: 0, crypto: 0 }, NEUTRAL: { savings: 50, gold: 20, bonds: 15, stocks: 15, crypto: 0 }, GREED: { savings: 55, gold: 20, bonds: 15, stocks: 10, crypto: 0 }, EXTREME_GREED: { savings: 65, gold: 25, bonds: 10, stocks: 0, crypto: 0 } },
  MEDIUM: { EXTREME_FEAR: { savings: 35, gold: 30, bonds: 10, stocks: 25, crypto: 0 }, FEAR: { savings: 25, gold: 25, bonds: 10, stocks: 35, crypto: 5 }, NEUTRAL: { savings: 20, gold: 20, bonds: 10, stocks: 40, crypto: 10 }, GREED: { savings: 15, gold: 15, bonds: 10, stocks: 45, crypto: 15 }, EXTREME_GREED: { savings: 30, gold: 25, bonds: 10, stocks: 30, crypto: 5 } },
  HIGH: { EXTREME_FEAR: { savings: 10, gold: 25, bonds: 5, stocks: 40, crypto: 20 }, FEAR: { savings: 10, gold: 15, bonds: 5, stocks: 45, crypto: 25 }, NEUTRAL: { savings: 10, gold: 15, bonds: 0, stocks: 40, crypto: 35 }, GREED: { savings: 10, gold: 10, bonds: 0, stocks: 45, crypto: 35 }, EXTREME_GREED: { savings: 20, gold: 20, bonds: 0, stocks: 35, crypto: 25 } },
};

export function getSentimentLabel(value) {
  if (value <= 24) return 'EXTREME_FEAR';
  if (value <= 49) return 'FEAR';
  if (value === 50) return 'NEUTRAL';
  if (value <= 74) return 'GREED';
  return 'EXTREME_GREED';
}

export function getSentimentVietnamese(label) {
  const map = {
    EXTREME_FEAR: 'Sợ hãi cực độ',
    FEAR: 'Sợ hãi',
    NEUTRAL: 'Trung lập',
    GREED: 'Tham lam',
    EXTREME_GREED: 'Tham lam cực độ',
  };
  return map[label] || label;
}

export function getAllocation(profile, sentimentValue) {
  const riskLevel = profile?.riskLevel || 'MEDIUM';
  const label = getSentimentLabel(sentimentValue);
  const baseAllocation = ALLOCATION_RULES[riskLevel]?.[label] || ALLOCATION_RULES.MEDIUM.NEUTRAL;
  let alloc = { ...baseAllocation };

  const savingsRate = profile?.savingsRate !== undefined ? profile.savingsRate : 6.0;
  const diff = savingsRate - 6.0;
  if (diff > 0) {
    let shiftPercent = Math.min(diff * 2, 15);
    shiftPercent = Math.min(shiftPercent, alloc.stocks);
    alloc.stocks -= shiftPercent; alloc.savings += shiftPercent;
  } else if (diff < 0) {
    let shiftPercent = Math.min(Math.abs(diff) * 2, 15);
    shiftPercent = Math.min(shiftPercent, alloc.savings);
    alloc.savings -= shiftPercent; alloc.stocks += shiftPercent;
  }

  if (profile?.horizon === 'SHORT') {
    let shiftP = Math.min(10, alloc.stocks + alloc.crypto);
    if (alloc.stocks > 0) { const take = Math.min(shiftP, alloc.stocks); alloc.stocks -= take; alloc.savings += take; shiftP -= take; }
    if (shiftP > 0 && alloc.crypto > 0) { const take = Math.min(shiftP, alloc.crypto); alloc.crypto -= take; alloc.savings += take; }
  } else if (profile?.horizon === 'LONG') {
    let shiftP = Math.min(10, alloc.savings);
    alloc.savings -= shiftP; alloc.stocks += shiftP;
  }

  if (profile?.goal === 'STABILITY') {
    let shiftP = Math.min(10, alloc.stocks + alloc.crypto);
    if (alloc.crypto > 0) { const take = Math.min(shiftP, alloc.crypto); alloc.crypto -= take; alloc.bonds += take; shiftP -= take; }
    if (shiftP > 0 && alloc.stocks > 0) { const take = Math.min(shiftP, alloc.stocks); alloc.stocks -= take; alloc.bonds += take; }
  } else if (profile?.goal === 'SPECULATION') {
    let shiftP = Math.min(10, alloc.savings + alloc.bonds);
    if (alloc.savings > 0) { const take = Math.min(shiftP, alloc.savings); alloc.savings -= take; alloc.crypto += take; shiftP -= take; }
    if (shiftP > 0 && alloc.bonds > 0) { const take = Math.min(shiftP, alloc.bonds); alloc.bonds -= take; alloc.crypto += take; }
  }

  const capital = profile?.capital || 0;
  let capitalScaleWarning = null;
  if (capital > 0 && capital < 50000000) {
    if (alloc.crypto > 5) { alloc.savings += (alloc.crypto - 5); alloc.crypto = 5; }
    if (alloc.stocks > 10) { alloc.savings += (alloc.stocks - 10); alloc.stocks = 10; }
    capitalScaleWarning = 'Quy mô vốn nhỏ (< 50tr), AI khuyến nghị ưu tiên dòng tiền tích lũy (Tiết kiệm/Vàng) trước khi đa dạng hoá rủi ro.';
  }

  alloc = {
    savings: Math.max(0, Math.round(alloc.savings * 10) / 10),
    gold: Math.max(0, Math.round(alloc.gold * 10) / 10),
    stocks: Math.max(0, Math.round(alloc.stocks * 10) / 10),
    bonds: Math.max(0, Math.round(alloc.bonds * 10) / 10),
    crypto: Math.max(0, Math.round(alloc.crypto * 10) / 10),
  };
  const sum = alloc.savings + alloc.gold + alloc.stocks + alloc.bonds + alloc.crypto;
  if (sum !== 100) {
    alloc.savings += (100 - sum);
    alloc.savings = Math.round(alloc.savings * 10) / 10;
  }

  let baseRecommendation = '';
  const recommendations = {
    EXTREME_FEAR: 'Thị trường đang sợ hãi cực độ. Đây thường là cơ hội tốt để mua vào, nhưng hãy ưu tiên bảo toàn vốn.',
    FEAR: 'Thị trường đang e ngại. Phân bổ thận trọng, giữ nhiều tiết kiệm và vàng để an toàn.',
    NEUTRAL: 'Thị trường cân bằng. Phân bổ theo profile rủi ro của bạn là hợp lý.',
    GREED: 'Thị trường đang hưng phấn. Thận trọng với crypto và cổ phiếu rủi ro cao.',
    EXTREME_GREED: 'CẢNH BÁO: Thị trường đang tham lam cực độ — dấu hiệu bong bóng. Cân nhắc chuyển sang tài sản an toàn.',
  };
  baseRecommendation = recommendations[label];

  const finalRecommendation = capitalScaleWarning ? `${baseRecommendation} ${capitalScaleWarning}` : baseRecommendation;

  return {
    ...alloc,
    sentimentValue,
    sentimentLabel: label,
    sentimentVietnamese: getSentimentVietnamese(label),
    recommendation: finalRecommendation,
  };
}

export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}
