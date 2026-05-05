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

  // Initial guess
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

export function calcEAR(
  apr: number,
  feeProcessing: number,
  feeInsurance: number,
  feeManagement: number,
  termMonths: number,
  rateType?: string,
  initialPrincipal?: number,
): number {
  let effectiveAPR = apr;
  if (rateType === 'FLAT' && initialPrincipal && termMonths) {
    effectiveAPR = convertFlatToReducingAPR(initialPrincipal, apr, termMonths);
  }

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
