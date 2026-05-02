export function calcDebtToIncomeRatio(totalMonthlyDebtPayments: number, monthlyIncome: number): number {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}
