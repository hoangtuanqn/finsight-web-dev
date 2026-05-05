// Client-side calculations (mirrored from server)
import { ASSET_CLASSES } from '../constants/investmentConstants';

export function calcAPY(apr: number, n = 12) {
  return (Math.pow(1 + apr / 100 / n, n) - 1) * 100;
}

/**
 * CALCULATION 1.5: Convert Flat APR to Reducing APR
 * Uses Newton-Raphson to find the equivalent reducing rate
 */
export function convertFlatToReducingAPR(principal: number, flatAPR: number, termMonths: number): number {
  if (flatAPR === 0 || !principal || !termMonths) return flatAPR;

  const totalInterest = principal * (flatAPR / 100) * (termMonths / 12);
  const monthlyPayment = (principal + totalInterest) / termMonths;

  // Initial guess
  let r = flatAPR / 100 / 12;
  let error = 1;
  const tolerance = 1e-7;
  let iterations = 0;

  while (error > tolerance && iterations < 100) {
    const term1 = Math.pow(1 + r, termMonths);
    const f = (principal * (r * term1)) / (term1 - 1) - monthlyPayment;

    const fPrime = principal * ((term1 * (1 + r * termMonths) - 1) / Math.pow(term1 - 1, 2));

    const nextR = r - f / fPrime;
    error = Math.abs(nextR - r);
    r = nextR;
    iterations++;
  }

  return r * 12 * 100;
}

export function calcEAR(
  apr: number,
  feeProcessing: number,
  feeInsurance: number,
  feeManagement: number,
  termMonths: number,
  rateType?: string,
  originalAmount?: number,
) {
  let effectiveAPR = apr;
  if (rateType === 'FLAT' && originalAmount && termMonths) {
    effectiveAPR = convertFlatToReducingAPR(originalAmount, apr, termMonths);
  }

  const apy = calcAPY(effectiveAPR);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = Math.min(annualizedProcessingFee + feeInsurance + feeManagement, 300);
  return apy + totalAnnualFees;
}

export function calcReducingMonthlyPayment(principal: number, apr: number, termMonths: number) {
  const r = apr / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function calcFlatMonthlyPayment(principal: number, apr: number, termMonths: number) {
  const totalInterest = principal * (apr / 100) * (termMonths / 12);
  return (principal + totalInterest) / termMonths;
}

export function calcDebtToIncomeRatio(totalMonthlyDebtPayments: number, monthlyIncome: number) {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}

export function formatNumber(value: any, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('vi-VN', options).format(number);
}

export function normalizeLocaleNumberInput(value: any) {
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

export function formatIntegerInput(value: any) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? formatNumber(digits) : '';
}

export function formatDecimalInput(value: any, decimals = 2) {
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

export function detectDominoRisk(debts: any[], monthlyIncome: number) {
  const alerts: any[] = [];
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

export function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function formatPercent(value: number, decimals = 1) {
  return value.toFixed(decimals);
}

interface CalculateMonthlyPaymentOptions {
  principal: number;
  apr: number;
  termMonths: number;
  rateType: 'FLAT' | 'REDUCING';
  feeManagement?: number;
}

export function calculateMonthlyPayment({
  principal,
  apr,
  termMonths,
  rateType,
  feeManagement = 0,
}: CalculateMonthlyPaymentOptions) {
  if (!principal || !termMonths) return 0;
  const r = apr / 100 / 12;
  const m = feeManagement / 100 / 12;

  if (rateType === 'FLAT') {
    // Flat: (Gốc / Kỳ hạn) + (Gốc * Lãi tháng) + (Gốc * Phí quản lý tháng)
    return Math.round(principal / termMonths + principal * r + principal * m);
  } else {
    // Reducing (EMI): P * (r+m) * (1 + r+m)^n / ((1 + r+m)^n - 1)
    const rate = r + m;
    if (rate === 0) return Math.round(principal / termMonths);
    const emi = (principal * rate * Math.pow(1 + rate, termMonths)) / (Math.pow(1 + rate, termMonths) - 1);
    return Math.round(emi);
  }
}
