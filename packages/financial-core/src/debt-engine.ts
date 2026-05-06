import { calcDebtToIncomeRatio } from './dti';

export type InterestMethod = 'REDUCING_BALANCE' | 'EMI' | 'BULLET' | 'NONE';

export interface InterestRateSchedule {
  rate: number; // Annual percentage (e.g. 8.5) — total effective rate used for calculation
  effectiveDate: Date;
  rateType?: 'FIXED' | 'FLOATING' | 'REFERENCE'; // metadata only, does not affect calculation
  referenceBase?: string; // e.g. "VCB", "SOFR"
  spread?: number; // basis points added on top of referenceBase (%)
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

export function detectDominoRisk(debts: any[], monthlyIncome: number): any[] {
  const alerts: any[] = [];
  const today = new Date();
  const currentDay = today.getDate();

  // Check 1: Multiple debts due within same week
  const dueSoon = debts.filter((d) => {
    const dueDay = Number(d.dueDay || 0);
    const daysUntilDue = dueDay >= currentDay ? dueDay - currentDay : 30 - currentDay + dueDay;
    return daysUntilDue <= 7 && Number(d.balance || 0) > 0;
  });

  if (dueSoon.length >= 2) {
    alerts.push({
      type: 'MULTIPLE_DUE',
      severity: 'WARNING',
      message: `${dueSoon.length} khoản nợ đáo hạn trong tuần này — nguy cơ thiếu tiền`,
      debts: dueSoon.map((d) => d.id),
    });
  }

  // Check 2: Total minimum payments exceed income thresholds
  const totalMin = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
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
