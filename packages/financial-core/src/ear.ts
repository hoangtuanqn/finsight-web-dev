export function calcAPY(apr: number, n: number = 12): number {
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

  let r = flatAPR / 100 / 12;
  let error = 1;
  const tolerance = 1e-7;
  let iterations = 0;

  while (error > tolerance && iterations < 100) {
    const term1 = Math.pow(1 + r, termMonths);
    const f = (principal * (r * term1)) / (term1 - 1) - monthlyPayment;
    const fPrime =
      principal * ((term1 * (term1 - 1) - r * termMonths * Math.pow(1 + r, termMonths - 1)) / Math.pow(term1 - 1, 2));
    const nextR = r - f / fPrime;
    error = Math.abs(nextR - r);
    r = nextR;
    iterations++;
  }

  return r * 12 * 100;
}

export function getEffectiveAPR(apr: number, rateType?: string, originalAmount?: number, termMonths?: number): number {
  if (rateType === 'FLAT' && originalAmount && termMonths) {
    return convertFlatToReducingAPR(originalAmount, apr, termMonths);
  }
  return apr;
}

export function calcEAR(
  apr: number,
  feeProcessing: number,
  feeInsurance: number,
  feeManagement: number,
  termMonths: number,
  rateType?: string,
  originalAmount?: number,
): number {
  const effectiveAPR = getEffectiveAPR(apr, rateType, originalAmount, termMonths);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = Math.min(annualizedProcessingFee + feeInsurance + feeManagement, 300);
  return effectiveAPR + totalAnnualFees;
}

export function calcReducingMonthlyPayment(principal: number, apr: number, termMonths: number): number {
  const r = apr / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

export function calcFlatMonthlyPayment(principal: number, apr: number, termMonths: number): number {
  const totalInterest = principal * (apr / 100) * (termMonths / 12);
  return (principal + totalInterest) / termMonths;
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
}: CalculateMonthlyPaymentOptions): number {
  if (!principal || !termMonths) return 0;
  const r = apr / 100 / 12;
  const m = (feeManagement || 0) / 100 / 12;

  if (rateType === 'FLAT') {
    return Math.round(principal / termMonths + principal * r + principal * m);
  } else {
    const rate = r + m;
    if (rate === 0) return Math.round(principal / termMonths);
    const emi = (principal * rate * Math.pow(1 + rate, termMonths)) / (Math.pow(1 + rate, termMonths) - 1);
    return Math.round(emi);
  }
}
