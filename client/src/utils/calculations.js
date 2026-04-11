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

export function getAllocation(riskLevel, sentimentValue) {
  const label = getSentimentLabel(sentimentValue);
  return ALLOCATION_RULES[riskLevel]?.[label] || ALLOCATION_RULES.MEDIUM.NEUTRAL;
}

export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}
