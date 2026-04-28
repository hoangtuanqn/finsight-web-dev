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
  totalBalance: number;
  interestAccrued: number;
  minimumPaid: number;
  extraPaid: number;
  totalPaid: number;
  dti?: number;
  payments: Array<{
    debtId: string | number;
    name: string;
    paid: number;
    balance: number;
    minimumPaid: number;
    extraPaid: number;
    interestAccrued: number;
  }>;
}

interface RepaymentSimulationOptions {
  monthlyIncome?: number;
  maxMonths?: number;
}

interface RepaymentWarning {
  type: 'NEGATIVE_AMORTIZATION' | 'NOT_COMPLETED';
  severity: 'WARNING' | 'DANGER';
  message: string;
  debtIds?: Array<string | number>;
}

export function resolveRepaymentExtraBudget(queryValue: unknown, savedValue: unknown): number {
  const getFirstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);
  const firstQueryValue = getFirstValue(queryValue);
  const hasQueryValue = firstQueryValue !== undefined && firstQueryValue !== null && String(firstQueryValue).trim() !== '';
  const rawValue = hasQueryValue ? firstQueryValue : getFirstValue(savedValue);
  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) return 0;
  return Math.max(0, parsedValue);
}

/**
 * CALCULATION 5: Avalanche / Snowball simulation
 */
export function simulateRepayment(
  debts: DebtItem[],
  monthlyBudget: number,
  method: 'AVALANCHE' | 'SNOWBALL' = 'AVALANCHE',
  options: RepaymentSimulationOptions = {},
) {
  let ds = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
  }));

  let months = 0;
  let totalInterest = 0;
  const normalizedMonthlyBudget = Math.max(0, Number.isFinite(monthlyBudget) ? monthlyBudget : 0);
  const initialBalance = ds.reduce((sum, d) => sum + d.balance, 0);
  const minimumBudget = ds.reduce((sum, d) => sum + d.minPayment, 0);
  const monthlyIncome = Math.max(0, Number.isFinite(options.monthlyIncome) ? options.monthlyIncome ?? 0 : 0);
  const maxMonths = Math.max(1, Number.isFinite(options.maxMonths) ? options.maxMonths ?? 360 : 360);
  const warnings: RepaymentWarning[] = [];
  const negativeAmortizationDebts = ds.filter(d => {
    const firstMonthInterest = d.balance * (d.apr / 100) / 12;
    return d.balance > 0.01 && d.minPayment <= firstMonthInterest;
  });

  if (negativeAmortizationDebts.length > 0) {
    warnings.push({
      type: 'NEGATIVE_AMORTIZATION',
      severity: 'DANGER',
      message: 'Có khoản nợ có tiền trả tối thiểu không đủ bù lãi tháng đầu, dư nợ có thể tăng nếu không trả thêm.',
      debtIds: negativeAmortizationDebts.map(d => d.id),
    });
  }
  const calculateDti = () => {
    if (monthlyIncome <= 0) return undefined;
    const activeMinimum = ds
      .filter(d => d.balance > 0.01)
      .reduce((sum, d) => sum + d.minPayment, 0);
    return parseFloat(((activeMinimum / monthlyIncome) * 100).toFixed(1));
  };
  const schedule: PaymentScheduleItem[] = [];

  schedule.push({
    month: 0,
    totalBalance: Math.round(initialBalance),
    interestAccrued: 0,
    minimumPaid: 0,
    extraPaid: 0,
    totalPaid: 0,
    dti: calculateDti(),
    payments: [],
  });

  while (ds.some(d => d.balance > 0.01) && months < maxMonths) {
    months++;
    let remaining = normalizedMonthlyBudget;
    const monthPayments: PaymentScheduleItem['payments'] = [];
    let monthInterest = 0;
    let monthMinimumPaid = 0;
    let monthExtraPaid = 0;
    const debtInterest = new Map<string | number, number>();

    // Step 1: Accrue interest
    ds.forEach(d => {
      if (d.balance > 0) {
        const interest = d.balance * (d.apr / 100) / 12;
        totalInterest += interest;
        monthInterest += interest;
        debtInterest.set(d.id, interest);
        d.balance += interest;
      }
    });

    // Step 2: Pay minimums
    ds.forEach(d => {
      if (d.balance > 0) {
        const pay = Math.min(d.minPayment, d.balance);
        d.balance -= pay;
        remaining -= pay;
        monthMinimumPaid += pay;
        d.balance = Math.max(0, d.balance);
        monthPayments.push({
          debtId: d.id,
          name: d.name,
          paid: pay,
          balance: d.balance,
          minimumPaid: pay,
          extraPaid: 0,
          interestAccrued: debtInterest.get(d.id) ?? 0,
        });
      }
    });

    // Step 3: Apply extra to priority targets until the monthly budget is exhausted.
    while (remaining > 0.01) {
      const activeDebts = ds.filter(d => d.balance > 0.01);
      if (activeDebts.length === 0) break;

      let target = null;

      if (method === 'AVALANCHE') {
        target = activeDebts.sort((a, b) => b.apr - a.apr)[0];
      } else {
        target = activeDebts.sort((a, b) => a.balance - b.balance)[0];
      }

      if (target) {
        const pay = Math.min(remaining, target.balance);
        if (pay <= 0) break;
        target.balance -= pay;
        remaining -= pay;
        monthExtraPaid += pay;
        target.balance = Math.max(0, target.balance);
        const existing = monthPayments.find(p => p.debtId === target.id);
        if (existing) {
          existing.paid += pay;
          existing.extraPaid += pay;
          existing.balance = target.balance;
        } else {
          monthPayments.push({
            debtId: target.id,
            name: target.name,
            paid: pay,
            balance: target.balance,
            minimumPaid: 0,
            extraPaid: pay,
            interestAccrued: debtInterest.get(target.id) ?? 0,
          });
        }
      }
    }

    schedule.push({
      month: months,
      totalBalance: Math.round(ds.reduce((sum, d) => sum + Math.max(0, d.balance), 0)),
      interestAccrued: Math.round(monthInterest),
      minimumPaid: Math.round(monthMinimumPaid),
      extraPaid: Math.round(monthExtraPaid),
      totalPaid: Math.round(monthMinimumPaid + monthExtraPaid),
      dti: calculateDti(),
      payments: monthPayments,
    });
  }

  const isCompleted = months < maxMonths;

  if (!isCompleted) {
    warnings.push({
      type: 'NOT_COMPLETED',
      severity: 'WARNING',
      message: `Kế hoạch chưa tất toán sau ${maxMonths} tháng mô phỏng. Cần tăng ngân sách trả thêm hoặc rà lại khoản nợ có lãi cao.`,
    });
  }

  return {
    months,
    initialBalance: Math.round(initialBalance),
    minimumBudget: Math.round(minimumBudget),
    extraBudgetUsed: Math.round(Math.max(0, normalizedMonthlyBudget - minimumBudget)),
    totalMonthlyBudget: Math.round(normalizedMonthlyBudget),
    totalInterest: Math.round(totalInterest),
    schedule,
    isCompleted,
    warnings,
  };
}

export function simulateRepaymentWithExtraBudget(
  debts: DebtItem[],
  extraBudget: number,
  method: 'AVALANCHE' | 'SNOWBALL' = 'AVALANCHE',
  options: RepaymentSimulationOptions = {},
) {
  const minimumBudget = debts.reduce((sum, debt) => sum + debt.minPayment, 0);
  const normalizedExtraBudget = Math.max(0, Number.isFinite(extraBudget) ? extraBudget : 0);

  return simulateRepayment(
    debts,
    minimumBudget + normalizedExtraBudget,
    method,
    options,
  );
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
