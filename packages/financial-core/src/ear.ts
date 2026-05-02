export function calcAPY(apr: number, n: number = 12): number {
  return (Math.pow(1 + apr / 100 / n, n) - 1) * 100;
}

export function calcEAR(
  apr: number,
  feeProcessing: number,
  feeInsurance: number,
  feeManagement: number,
  termMonths: number,
): number {
  const apy = calcAPY(apr);
  const annualizedProcessingFee = termMonths > 0 ? (feeProcessing / termMonths) * 12 : 0;
  const totalAnnualFees = Math.min(annualizedProcessingFee + feeInsurance + feeManagement, 300);
  return apy + totalAnnualFees;
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
