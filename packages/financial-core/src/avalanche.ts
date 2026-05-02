export interface DebtItem {
  id: string | number;
  name: string;
  balance: number;
  apr: number;
  rateType?: string;
  minPayment: number;
  termMonths?: number;
  remainingTerms?: number;
  debtType?: string;
  feeManagement?: number;
}

export interface PaymentScheduleItem {
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

export interface RepaymentSimulationOptions {
  monthlyIncome?: number;
  maxMonths?: number;
  customOrder?: Array<string | number>;
  stopOnTermBreach?: boolean;
}

export interface RepaymentWarning {
  type: 'NEGATIVE_AMORTIZATION' | 'NOT_COMPLETED' | 'TERM_BREACH';
  severity: 'WARNING' | 'DANGER';
  message: string;
  debtIds?: Array<string | number>;
}

export interface TermBreach {
  month: number;
  debtId: string | number;
  name: string;
  deadlineMonth: number;
  remainingBalance: number;
}

function getDebtDeadlineMonth(debt: DebtItem): number | undefined {
  if (debt.debtType === 'CREDIT_CARD') return undefined;

  const remainingTerms = Number(debt.remainingTerms);
  const termMonths = Number(debt.termMonths);

  if (Number.isFinite(remainingTerms) && remainingTerms > 0) {
    return Math.round(remainingTerms);
  }

  if (Number.isFinite(termMonths) && termMonths > 0) {
    return Math.round(termMonths);
  }

  return undefined;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function simulateRepayment(
  debts: DebtItem[],
  monthlyBudget: number,
  method: 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM' = 'AVALANCHE',
  options: RepaymentSimulationOptions = {},
) {
  let ds = debts.map((d) => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    minPayment: d.minPayment,
    deadlineMonth: getDebtDeadlineMonth(d),
    debtType: d.debtType,
    feeManagement: d.feeManagement,
  }));

  let months = 0;
  let totalInterest = 0;
  const normalizedMonthlyBudget = Math.max(0, Number.isFinite(monthlyBudget) ? monthlyBudget : 0);
  const initialBalance = ds.reduce((sum, d) => sum + d.balance, 0);
  const minimumBudget = ds.reduce((sum, d) => sum + d.minPayment, 0);
  const monthlyIncome = Math.max(0, Number.isFinite(options.monthlyIncome) ? (options.monthlyIncome ?? 0) : 0);
  const maxMonths = Math.max(1, Number.isFinite(options.maxMonths) ? (options.maxMonths ?? 360) : 360);
  const stopOnTermBreach = options.stopOnTermBreach === true;
  const warnings: RepaymentWarning[] = [];
  let termBreach: TermBreach | null = null;
  const negativeAmortizationDebts = ds.filter((d) => {
    const firstMonthInterest = (d.balance * (d.apr / 100)) / 12;
    return d.balance > 0.01 && d.minPayment <= firstMonthInterest;
  });

  if (negativeAmortizationDebts.length > 0) {
    warnings.push({
      type: 'NEGATIVE_AMORTIZATION',
      severity: 'DANGER',
      message: 'Có khoản nợ có tiền trả tối thiểu không đủ bù lãi tháng đầu, dư nợ có thể tăng nếu không trả thêm.',
      debtIds: negativeAmortizationDebts.map((d) => d.id),
    });
  }
  const calculateDti = () => {
    if (monthlyIncome <= 0) return undefined;
    const activeMinimum = ds.filter((d) => d.balance > 0.01).reduce((sum, d) => sum + d.minPayment, 0);
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

  while (ds.some((d) => d.balance > 0.01) && months < maxMonths) {
    months++;
    let remaining = normalizedMonthlyBudget;
    const monthPayments: PaymentScheduleItem['payments'] = [];
    let monthInterest = 0;
    let monthMinimumPaid = 0;
    let monthExtraPaid = 0;
    const debtInterest = new Map<string | number, number>();

    // Step 1: Accrue interest
    ds.forEach((d) => {
      if (d.balance > 0) {
        let interest = (d.balance * (d.apr / 100)) / 12;

        if (d.debtType === 'CREDIT_CARD' && d.feeManagement && d.feeManagement > 0) {
          interest += (d.balance * (d.feeManagement / 100)) / 12;
        }

        totalInterest += interest;
        monthInterest += interest;
        debtInterest.set(d.id, interest);
        d.balance += interest;
      }
    });

    // Step 2: Pay minimums
    ds.forEach((d) => {
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
          endingBalance: d.balance,
          minimumPaid: pay,
          extraPaid: 0,
          interestAccrued: debtInterest.get(d.id) ?? 0,
        });
      }
    });

    // Step 3: Apply extra to priority targets until the monthly budget is exhausted.
    while (remaining > 0.01) {
      const activeDebts = ds.filter((d) => d.balance > 0.01);
      if (activeDebts.length === 0) break;

      let target = null;

      if (method === 'AVALANCHE') {
        target = activeDebts.sort((a, b) => b.apr - a.apr)[0];
      } else if (method === 'SNOWBALL') {
        target = activeDebts.sort((a, b) => a.balance - b.balance)[0];
      } else {
        const customOrder = options.customOrder || [];
        target =
          customOrder.map((id) => activeDebts.find((d) => String(d.id) === String(id))).find(Boolean) || activeDebts[0];
      }

      if (target) {
        const pay = Math.min(remaining, target.balance);
        if (pay <= 0) break;
        target.balance -= pay;
        remaining -= pay;
        monthExtraPaid += pay;
        target.balance = Math.max(0, target.balance);
        const existing = monthPayments.find((p) => p.debtId === target.id);
        if (existing) {
          existing.paid += pay;
          existing.extraPaid += pay;
          existing.balance = target.balance;
          existing.endingBalance = target.balance;
        } else {
          monthPayments.push({
            debtId: target.id,
            name: target.name,
            paid: pay,
            balance: target.balance,
            endingBalance: target.balance,
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

    const breachedDebt = ds.find((d) => d.deadlineMonth !== undefined && months >= d.deadlineMonth && d.balance > 0.01);

    if (breachedDebt) {
      termBreach = {
        month: months,
        debtId: breachedDebt.id,
        name: breachedDebt.name,
        deadlineMonth: breachedDebt.deadlineMonth as number,
        remainingBalance: Math.round(breachedDebt.balance),
      };
      warnings.push({
        type: 'TERM_BREACH',
        severity: 'DANGER',
        message: `Khoản nợ ${breachedDebt.name} còn ${formatVND(Math.round(breachedDebt.balance))} sau tháng ${months}, vượt kỳ hạn hợp đồng ${breachedDebt.deadlineMonth} tháng.`,
        debtIds: [breachedDebt.id],
      });
      if (stopOnTermBreach) break;
    }
  }

  const hasActiveDebt = ds.some((d) => d.balance > 0.01);
  const isCompleted = !hasActiveDebt;

  if (!isCompleted && !termBreach && months >= maxMonths) {
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
    termBreach,
    warnings: warnings.filter((w) => !(w.type === 'TERM_BREACH' && (!w.debtIds || w.debtIds.length === 0))),
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

  return simulateRepayment(debts, minimumBudget + normalizedExtraBudget, method, options);
}

export function simulateCustomRepaymentWithExtraBudget(
  debts: DebtItem[],
  extraBudget: number,
  debtIds: Array<string | number>,
  options: RepaymentSimulationOptions = {},
) {
  const selectedDebtIds = new Set(debtIds.map((id) => String(id)));
  const orderedDebts = debtIds
    .map((id) => debts.find((debt) => String(debt.id) === String(id)))
    .filter(Boolean) as DebtItem[];
  const remainingDebts = debts.filter((debt) => !selectedDebtIds.has(String(debt.id)));
  const planDebts = [...orderedDebts, ...remainingDebts];
  const minimumBudget = planDebts.reduce((sum, debt) => sum + debt.minPayment, 0);
  const normalizedExtraBudget = Math.max(0, Number.isFinite(extraBudget) ? extraBudget : 0);

  return simulateRepayment(planDebts, minimumBudget + normalizedExtraBudget, 'CUSTOM', {
    ...options,
    customOrder: debtIds,
  });
}
