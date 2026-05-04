/**
 * Debt Engine - Core financial calculations for Enterprise Debt
 * Supports: Reducing Balance, EMI, Bullet
 * Features: Floating Interest Rates
 */

export type InterestMethod = 'REDUCING_BALANCE' | 'EMI' | 'BULLET' | 'NONE';

export interface InterestRateSchedule {
  rate: number; // Annual percentage (e.g. 8.5)
  effectiveDate: Date;
}

export interface DebtScheduleInput {
  principal: number;
  issueDate: Date;
  termMonths: number;
  interestMethod: InterestMethod;
  interestRates: InterestRateSchedule[];
}

export interface SchedulePeriod {
  period: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
}

/**
 * Finds the applicable interest rate for a specific date
 */
export function getApplicableRate(date: Date, rates: InterestRateSchedule[]): number {
  if (rates.length === 0) return 0;

  // Sort by effectiveDate descending to find the latest applicable rate
  const sortedRates = [...rates].sort((a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime());

  const applicable = sortedRates.find((r) => r.effectiveDate.getTime() <= date.getTime());
  return applicable ? applicable.rate : sortedRates[sortedRates.length - 1].rate;
}

/**
 * Generates a repayment schedule based on the selected method
 */
export function generateSchedule(input: DebtScheduleInput): SchedulePeriod[] {
  const { principal, issueDate, termMonths, interestMethod, interestRates } = input;
  const schedule: SchedulePeriod[] = [];

  let remainingPrincipal = principal;
  const startDate = new Date(issueDate);

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + i);

    const annualRate = getApplicableRate(dueDate, interestRates);
    const monthlyRate = annualRate / 100 / 12;

    let principalAmount = 0;
    let interestAmount = 0;

    switch (interestMethod) {
      case 'REDUCING_BALANCE':
        interestAmount = remainingPrincipal * monthlyRate;
        principalAmount = principal / termMonths;
        break;

      case 'EMI':
        // EMI formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
        // Note: For floating rates, standard EMI formula is tricky.
        // We calculate EMI based on CURRENT applicable rate and REMAINING periods.
        const remainingTerms = termMonths - i + 1;
        const emi =
          monthlyRate > 0
            ? (remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, remainingTerms)) /
              (Math.pow(1 + monthlyRate, remainingTerms) - 1)
            : remainingPrincipal / remainingTerms;

        interestAmount = remainingPrincipal * monthlyRate;
        principalAmount = emi - interestAmount;
        break;

      case 'BULLET':
        interestAmount = remainingPrincipal * monthlyRate;
        principalAmount = i === termMonths ? principal : 0;
        break;

      case 'NONE':
      default:
        interestAmount = 0;
        principalAmount = principal / termMonths;
        break;
    }

    // Adjust for last period to avoid floating point dust
    if (i === termMonths) {
      principalAmount = remainingPrincipal;
    }

    const totalAmount = principalAmount + interestAmount;
    remainingPrincipal -= principalAmount;

    schedule.push({
      period: i,
      dueDate,
      principalAmount: Math.round(principalAmount * 100) / 100,
      interestAmount: Math.round(interestAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      remainingPrincipal: Math.max(0, Math.round(remainingPrincipal * 100) / 100),
    });
  }

  return schedule;
}
