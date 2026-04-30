export type RepaymentMethod = "AVALANCHE" | "SNOWBALL";

export interface DebtForRepayment {
  id: string | number;
  name: string;
  balance: number;
  apr: number;
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
    endingBalance: number;
    minimumPaid: number;
    extraPaid: number;
    interestAccrued: number;
  }>;
}

interface RepaymentWarning {
  type: "NEGATIVE_AMORTIZATION" | "NOT_COMPLETED";
  severity: "WARNING" | "DANGER";
  message: string;
  debtIds?: Array<string | number>;
}

interface RepaymentSimulation {
  months: number;
  initialBalance: number;
  minimumBudget: number;
  extraBudgetUsed: number;
  totalMonthlyBudget: number;
  totalInterest: number;
  schedule: PaymentScheduleItem[];
  isCompleted: boolean;
  warnings: RepaymentWarning[];
}

interface RepaymentSimulationOptions {
  monthlyIncome?: number;
  maxMonths?: number;
}

function toNumber(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeDebts(debts: DebtForRepayment[]) {
  return debts
    .map((debt) => ({
      ...debt,
      balance: Math.max(0, toNumber(debt.balance)),
      apr: Math.max(0, toNumber(debt.apr)),
      minPayment: Math.max(0, toNumber(debt.minPayment)),
    }))
    .filter((debt) => debt.balance > 0.01);
}

export function getAvalanchePriority(debts: DebtForRepayment[]) {
  return normalizeDebts(debts).sort((a, b) => b.apr - a.apr);
}

export function getSnowballPriority(debts: DebtForRepayment[]) {
  return normalizeDebts(debts).sort((a, b) => a.balance - b.balance);
}

export function simulateRepayment(
  debts: DebtForRepayment[],
  monthlyBudget: number,
  method: RepaymentMethod = "AVALANCHE",
  options: RepaymentSimulationOptions = {},
): RepaymentSimulation {
  const ds = normalizeDebts(debts);
  let months = 0;
  let totalInterest = 0;
  const normalizedMonthlyBudget = Math.max(0, toNumber(monthlyBudget));
  const initialBalance = ds.reduce((sum, debt) => sum + debt.balance, 0);
  const minimumBudget = ds.reduce((sum, debt) => sum + debt.minPayment, 0);
  const monthlyIncome = Math.max(0, toNumber(options.monthlyIncome));
  const maxMonths = Math.max(1, toNumber(options.maxMonths) || 360);
  const warnings: RepaymentWarning[] = [];

  const negativeAmortizationDebts = ds.filter((debt) => {
    const firstMonthInterest = debt.balance * (debt.apr / 100) / 12;
    return debt.balance > 0.01 && debt.minPayment <= firstMonthInterest;
  });

  if (negativeAmortizationDebts.length > 0) {
    warnings.push({
      type: "NEGATIVE_AMORTIZATION",
      severity: "DANGER",
      message:
        "Co khoan no co tien tra toi thieu khong du bu lai thang dau, du no co the tang neu khong tra them.",
      debtIds: negativeAmortizationDebts.map((debt) => debt.id),
    });
  }

  const calculateDti = () => {
    if (monthlyIncome <= 0) return undefined;
    const activeMinimum = ds
      .filter((debt) => debt.balance > 0.01)
      .reduce((sum, debt) => sum + debt.minPayment, 0);
    return parseFloat(((activeMinimum / monthlyIncome) * 100).toFixed(1));
  };

  const schedule: PaymentScheduleItem[] = [
    {
      month: 0,
      totalBalance: Math.round(initialBalance),
      interestAccrued: 0,
      minimumPaid: 0,
      extraPaid: 0,
      totalPaid: 0,
      dti: calculateDti(),
      payments: [],
    },
  ];

  while (ds.some((debt) => debt.balance > 0.01) && months < maxMonths) {
    months++;
    let remaining = normalizedMonthlyBudget;
    const monthPayments: PaymentScheduleItem["payments"] = [];
    let monthInterest = 0;
    let monthMinimumPaid = 0;
    let monthExtraPaid = 0;
    const debtInterest = new Map<string | number, number>();

    ds.forEach((debt) => {
      if (debt.balance > 0) {
        const interest = debt.balance * (debt.apr / 100) / 12;
        totalInterest += interest;
        monthInterest += interest;
        debtInterest.set(debt.id, interest);
        debt.balance += interest;
      }
    });

    ds.forEach((debt) => {
      if (debt.balance > 0) {
        const paid = Math.min(debt.minPayment, debt.balance);
        debt.balance = Math.max(0, debt.balance - paid);
        remaining -= paid;
        monthMinimumPaid += paid;
        monthPayments.push({
          debtId: debt.id,
          name: debt.name,
          paid,
          balance: debt.balance,
          endingBalance: debt.balance,
          minimumPaid: paid,
          extraPaid: 0,
          interestAccrued: debtInterest.get(debt.id) ?? 0,
        });
      }
    });

    while (remaining > 0.01) {
      const activeDebts = ds.filter((debt) => debt.balance > 0.01);
      if (activeDebts.length === 0) break;

      const target =
        method === "AVALANCHE"
          ? activeDebts.sort((a, b) => b.apr - a.apr)[0]
          : activeDebts.sort((a, b) => a.balance - b.balance)[0];

      const paid = Math.min(remaining, target.balance);
      if (paid <= 0) break;

      target.balance = Math.max(0, target.balance - paid);
      remaining -= paid;
      monthExtraPaid += paid;

      const existingPayment = monthPayments.find(
        (payment) => payment.debtId === target.id,
      );
      if (existingPayment) {
        existingPayment.paid += paid;
        existingPayment.extraPaid += paid;
        existingPayment.balance = target.balance;
        existingPayment.endingBalance = target.balance;
      } else {
        monthPayments.push({
          debtId: target.id,
          name: target.name,
          paid,
          balance: target.balance,
          endingBalance: target.balance,
          minimumPaid: 0,
          extraPaid: paid,
          interestAccrued: debtInterest.get(target.id) ?? 0,
        });
      }
    }

    schedule.push({
      month: months,
      totalBalance: Math.round(
        ds.reduce((sum, debt) => sum + Math.max(0, debt.balance), 0),
      ),
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
      type: "NOT_COMPLETED",
      severity: "WARNING",
      message: `Ke hoach chua tat toan sau ${maxMonths} thang mo phong. Can tang ngan sach tra them hoac ra lai khoan no co lai cao.`,
    });
  }

  return {
    months,
    initialBalance: Math.round(initialBalance),
    minimumBudget: Math.round(minimumBudget),
    extraBudgetUsed: Math.round(
      Math.max(0, normalizedMonthlyBudget - minimumBudget),
    ),
    totalMonthlyBudget: Math.round(normalizedMonthlyBudget),
    totalInterest: Math.round(totalInterest),
    schedule,
    isCompleted,
    warnings,
  };
}

export function simulateRepaymentWithExtraBudget(
  debts: DebtForRepayment[],
  extraBudget: number,
  method: RepaymentMethod = "AVALANCHE",
  options: RepaymentSimulationOptions = {},
) {
  const minimumBudget = normalizeDebts(debts).reduce(
    (sum, debt) => sum + debt.minPayment,
    0,
  );
  return simulateRepayment(debts, minimumBudget + Math.max(0, toNumber(extraBudget)), method, options);
}

function formatSimulation(simulation: RepaymentSimulation) {
  return {
    months: simulation.months,
    totalInterest: simulation.totalInterest,
    totalPaid: simulation.initialBalance + simulation.totalInterest,
    initialBalance: simulation.initialBalance,
    minimumBudget: simulation.minimumBudget,
    extraBudgetUsed: simulation.extraBudgetUsed,
    totalMonthlyBudget: simulation.totalMonthlyBudget,
    isCompleted: simulation.isCompleted,
    warnings: simulation.warnings,
    isScheduleTruncated: simulation.schedule.length > 25,
    schedule: simulation.schedule.slice(0, 25),
  };
}

export function buildRepaymentPlanFromDebts(
  debts: DebtForRepayment[],
  extraBudget: number,
  monthlyIncome: number,
) {
  const activeDebts = normalizeDebts(debts);
  if (activeDebts.length === 0) return null;

  const options = { monthlyIncome };
  const avalanche = simulateRepaymentWithExtraBudget(
    activeDebts,
    extraBudget,
    "AVALANCHE",
    options,
  );
  const snowball = simulateRepaymentWithExtraBudget(
    activeDebts,
    extraBudget,
    "SNOWBALL",
    options,
  );
  const savedInterest = snowball.totalInterest - avalanche.totalInterest;
  const savedMonths = snowball.months - avalanche.months;

  return {
    monthlyIncome,
    extraBudget: Math.max(0, toNumber(extraBudget)),
    minimumBudget: avalanche.minimumBudget,
    totalMonthlyBudget: avalanche.totalMonthlyBudget,
    avalanche: formatSimulation(avalanche),
    snowball: formatSimulation(snowball),
    comparison: {
      savedInterest,
      savedMonths,
      winner: savedInterest > 0 ? "AVALANCHE" : "SNOWBALL",
    },
    recommendation:
      savedInterest > 1000000
        ? "AVALANCHE"
        : savedMonths < -3
          ? "SNOWBALL"
          : "AVALANCHE",
  };
}
