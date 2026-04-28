import { SENTIMENT_BANDS } from '../constants/investmentConstants';

/**
 * CALCULATION 1: APY from APR
 * APY = (1 + APR/n)^n - 1
 */
export function calcAPY(apr: number, n: number = 12): number {
  return (Math.pow(1 + (apr / 100) / n, n) - 1) * 100;
}

/**
 * CALCULATION 2: EAR (Effective Annual Rate)
 * EAR = APY + total annual fees as % of principal
 */
export function calcEAR(apr: number, feeProcessing: number, feeInsurance: number, feeManagement: number, termMonths: number): number {
  const apy = calcAPY(apr);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = Math.min(annualizedProcessingFee + feeInsurance + feeManagement, 300);
  return apy + totalAnnualFees;
}

/**
 * CALCULATION 3: Monthly payment for reducing balance loan
 * P * r * (1+r)^n / ((1+r)^n - 1)
 */
export function calcReducingMonthlyPayment(principal: number, apr: number, termMonths: number): number {
  const r = (apr / 100) / 12;
  if (r === 0) return principal / termMonths;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

/**
 * CALCULATION 4: Monthly payment for flat rate loan
 * (Principal + Principal * APR/100 * termMonths/12) / termMonths
 */
export function calcFlatMonthlyPayment(principal: number, apr: number, termMonths: number): number {
  const totalInterest = principal * (apr / 100) * (termMonths / 12);
  return (principal + totalInterest) / termMonths;
}

interface DebtItem {
  id: string | number;
  name: string;
  balance: number;
  apr: number;
  rateType?: string;
  minPayment: number;
}

interface PaymentScheduleItem {
  month: number;
  payments: Array<{
    debtId: string | number;
    name: string;
    paid: number;
    balance: number;
  }>;
}

/**
 * CALCULATION 5: Avalanche / Snowball simulation
 */
export function simulateRepayment(debts: DebtItem[], extraBudget: number, method: 'AVALANCHE' | 'SNOWBALL' = 'AVALANCHE') {
  let ds = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
  }));

  let months = 0;
  let totalInterest = 0;
  const schedule: PaymentScheduleItem[] = [];

  while (ds.some(d => d.balance > 0.01) && months < 360) {
    months++;
    let remaining = extraBudget;
    const monthPayments: PaymentScheduleItem['payments'] = [];

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
export function calcDebtToIncomeRatio(totalMonthlyDebtPayments: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}

interface Alert {
  type: string;
  severity: 'WARNING' | 'DANGER' | 'INFO';
  message: string;
  debts?: Array<string | number>;
}

/**
 * CALCULATION 7: Domino Risk Detection
 */
export function detectDominoRisk(debts: Array<DebtItem & { dueDay: number }>, monthlyIncome: number): Alert[] {
  const alerts: Alert[] = [];
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

export function getSentimentLabel(value: any): string {
  const number = Number(value);
  const sentimentValue = Number.isFinite(number) ? number : 50;
  return SENTIMENT_BANDS.find(band => sentimentValue <= band.max)?.label ?? 'NEUTRAL';
}

export function getSentimentVietnamese(label: string): string {
  return SENTIMENT_BANDS.find(band => band.label === label)?.labelVi ?? label;
}

/**
 * Format Vietnamese currency
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
