// ============================================
// FINSIGHT — Financial Calculations Module
// Used in both server AND client
// ============================================

/**
 * CALCULATION 1: APY from APR
 * APY = (1 + APR/n)^n - 1
 */
export function calcAPY(apr, n = 12) {
  return (Math.pow(1 + (apr / 100) / n, n) - 1) * 100;
}

/**
 * CALCULATION 2: EAR (Effective Annual Rate)
 * EAR = APY + total annual fees as % of principal
 */
export function calcEAR(apr, feeProcessing, feeInsurance, feeManagement, termMonths) {
  const apy = calcAPY(apr);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = annualizedProcessingFee + feeInsurance + feeManagement;
  return apy + totalAnnualFees;
}

/**
 * CALCULATION 3: Monthly payment for reducing balance loan
 * P * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calcReducingMonthlyPayment(principal, apr, termMonths) {
  const r = (apr / 100) / 12;
  if (r === 0) return principal / termMonths;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

/**
 * CALCULATION 4: Monthly payment for flat rate loan
 * (Principal + Principal * APR/100 * termMonths/12) / termMonths
 */
export function calcFlatMonthlyPayment(principal, apr, termMonths) {
  const totalInterest = principal * (apr / 100) * (termMonths / 12);
  return (principal + totalInterest) / termMonths;
}

/**
 * CALCULATION 5: Avalanche / Snowball simulation
 */
export function simulateRepayment(debts, extraBudget, method = 'AVALANCHE') {
  let ds = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    rateType: d.rateType,
    minPayment: d.minPayment,
  }));

  let months = 0;
  let totalInterest = 0;
  const schedule = [];

  while (ds.some(d => d.balance > 0.01) && months < 360) {
    months++;
    let remaining = extraBudget;
    const monthPayments = [];

    // Step 1: Accrue interest
    ds.forEach(d => {
      if (d.balance > 0) {
        const interest = d.balance * (d.apr / 100) / 12;
        totalInterest += interest;
        d.balance += interest;
      }
    });

    // Step 2: Pay minimums
    ds.forEach(d => {
      if (d.balance > 0) {
        const pay = Math.min(d.minPayment, d.balance);
        d.balance -= pay;
        remaining -= pay;
        d.balance = Math.max(0, d.balance);
        monthPayments.push({ debtId: d.id, name: d.name, paid: pay, balance: d.balance });
      }
    });

    // Step 3: Apply extra to priority target
    if (remaining > 0) {
      const activeDebts = ds.filter(d => d.balance > 0.01);
      let target = null;

      if (method === 'AVALANCHE') {
        target = activeDebts.sort((a, b) => b.apr - a.apr)[0];
      } else {
        target = activeDebts.sort((a, b) => a.balance - b.balance)[0];
      }

      if (target) {
        const pay = Math.min(remaining, target.balance);
        target.balance -= pay;
        target.balance = Math.max(0, target.balance);
        const existing = monthPayments.find(p => p.debtId === target.id);
        if (existing) {
          existing.paid += pay;
          existing.balance = target.balance;
        }
      }
    }

    schedule.push({ month: months, payments: monthPayments });
  }

  return {
    months,
    totalInterest: Math.round(totalInterest),
    schedule,
    isCompleted: months < 360,
  };
}

/**
 * CALCULATION 6: Debt-to-Income Ratio
 */
export function calcDebtToIncomeRatio(totalMonthlyDebtPayments, monthlyIncome) {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}

/**
 * CALCULATION 7: Domino Risk Detection
 */
export function detectDominoRisk(debts, monthlyIncome) {
  const alerts = [];
  const today = new Date();
  const currentDay = today.getDate();

  // Check 1: Multiple debts due within same week
  const dueSoon = debts.filter(d => {
    const daysUntilDue = d.dueDay >= currentDay
      ? d.dueDay - currentDay
      : 30 - currentDay + d.dueDay;
    return daysUntilDue <= 7 && d.balance > 0;
  });

  if (dueSoon.length >= 2) {
    alerts.push({
      type: 'MULTIPLE_DUE',
      severity: 'WARNING',
      message: `${dueSoon.length} khoản nợ đáo hạn trong tuần này — nguy cơ thiếu tiền`,
      debts: dueSoon.map(d => d.id),
    });
  }

  // Check 2: Total minimum payments exceed income thresholds
  const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const dtiRatio = calcDebtToIncomeRatio(totalMin, monthlyIncome);

  if (dtiRatio > 50) {
    alerts.push({
      type: 'HIGH_DTI',
      severity: 'DANGER',
      message: `Tổng nợ chiếm ${dtiRatio.toFixed(1)}% thu nhập — nguy cơ hiệu ứng domino`,
    });
  } else if (dtiRatio > 35) {
    alerts.push({
      type: 'MEDIUM_DTI',
      severity: 'WARNING',
      message: `Tổng nợ chiếm ${dtiRatio.toFixed(1)}% thu nhập — cần theo dõi`,
    });
  }

  return alerts;
}

/**
 * CALCULATION 8: Portfolio allocation based on Sentiment + Risk Profile
 */
export const ALLOCATION_RULES = {
  LOW: {
    EXTREME_FEAR:  { savings: 70, gold: 20, bonds: 10, stocks: 0,  crypto: 0  },
    FEAR:          { savings: 60, gold: 25, bonds: 15, stocks: 0,  crypto: 0  },
    NEUTRAL:       { savings: 50, gold: 20, bonds: 15, stocks: 15, crypto: 0  },
    GREED:         { savings: 55, gold: 20, bonds: 15, stocks: 10, crypto: 0  },
    EXTREME_GREED: { savings: 65, gold: 25, bonds: 10, stocks: 0,  crypto: 0  },
  },
  MEDIUM: {
    EXTREME_FEAR:  { savings: 35, gold: 30, bonds: 10, stocks: 25, crypto: 0  },
    FEAR:          { savings: 25, gold: 25, bonds: 10, stocks: 35, crypto: 5  },
    NEUTRAL:       { savings: 20, gold: 20, bonds: 10, stocks: 40, crypto: 10 },
    GREED:         { savings: 15, gold: 15, bonds: 10, stocks: 45, crypto: 15 },
    EXTREME_GREED: { savings: 30, gold: 25, bonds: 10, stocks: 30, crypto: 5  },
  },
  HIGH: {
    EXTREME_FEAR:  { savings: 10, gold: 25, bonds: 5,  stocks: 40, crypto: 20 },
    FEAR:          { savings: 10, gold: 15, bonds: 5,  stocks: 45, crypto: 25 },
    NEUTRAL:       { savings: 10, gold: 15, bonds: 0,  stocks: 40, crypto: 35 },
    GREED:         { savings: 10, gold: 10, bonds: 0,  stocks: 45, crypto: 35 },
    EXTREME_GREED: { savings: 20, gold: 20, bonds: 0,  stocks: 35, crypto: 25 },
  },
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

export function getAllocation(riskLevel, sentimentValue) {
  const label = getSentimentLabel(sentimentValue);
  const allocation = ALLOCATION_RULES[riskLevel]?.[label] || ALLOCATION_RULES.MEDIUM.NEUTRAL;

  const recommendations = {
    EXTREME_FEAR: 'Thị trường đang sợ hãi cực độ. Đây thường là cơ hội tốt để mua vào, nhưng hãy ưu tiên bảo toàn vốn.',
    FEAR: 'Thị trường đang e ngại. Phân bổ thận trọng, giữ nhiều tiết kiệm và vàng để an toàn.',
    NEUTRAL: 'Thị trường cân bằng. Phân bổ theo profile rủi ro của bạn là hợp lý.',
    GREED: 'Thị trường đang hưng phấn. Thận trọng với crypto và cổ phiếu rủi ro cao.',
    EXTREME_GREED: 'CẢNH BÁO: Thị trường đang tham lam cực độ — dấu hiệu bong bóng. Cân nhắc chuyển sang tài sản an toàn.',
  };

  return {
    ...allocation,
    sentimentValue,
    sentimentLabel: label,
    sentimentVietnamese: getSentimentVietnamese(label),
    recommendation: recommendations[label],
  };
}

/**
 * Format Vietnamese currency
 */
export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}
