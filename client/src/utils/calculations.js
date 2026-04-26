// Client-side calculations (mirrored from server)
import {
  ASSET_CLASSES,
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

// Export ASSET_CLASSES để InvestmentPage dùng tính expected returns
export { ASSET_CLASSES };

export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

export function formatPercent(value, decimals = 1) {
  return `${formatNumber(value, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}
