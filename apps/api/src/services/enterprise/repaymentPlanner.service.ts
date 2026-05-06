import { DebtRecord, Party } from '@prisma/enterprise';
import enterpriseDb from '../../prisma/enterprise.client.js';

const prisma = enterpriseDb;

export enum RepaymentStrategy {
  AVALANCHE = 'AVALANCHE',
  SNOWBALL = 'SNOWBALL',
  OVERDUE_FIRST = 'OVERDUE_FIRST',
  COVENANT_RISK = 'COVENANT_RISK',
}

interface SimulationDebt extends DebtRecord {
  party: Party;
  interestRates: any[]; // Include the relation
  effectiveAnnualRate: number;
  totalObligation: number;
  monthlyInterest: number;
  penaltyAccrued: number;
  riskScore: number;
  isRateIncreasing: boolean;
  mandatoryPrincipal: number;
  mandatoryInterest: number;
  mandatoryPayment: number;
}

interface SimulationResult {
  debts: {
    debtId: string;
    debtName: string;
    partyName: string;
    internalCode: string;
    principal: number;
    interestRate: number;
    interestMethod: string;
    dueDate: Date;
    outstanding: number;
    plannedAmount: number;
    remainingAfter: number;
    priority: number;
    reason: string;
    monthsToPayoff: number | 'NEVER';
    isDebtTrap: boolean;
  }[];
  summary: {
    totalBudget: number;
    totalAllocated: number;
    remainingBudget: number;
    fullyPaidCount: number;
    totalInterestSaved: number;
  };
  alerts: {
    type: 'DANGER' | 'WARNING' | 'INFO';
    message: string;
  }[];
  optimalPoints?: {
    budget: number;
    fullyPaidCount: number;
    impact: string;
  }[];
}

export class RepaymentPlannerService {
  /**
   * Fetches eligible debts for planning (ACTIVE, PARTIAL, OVERDUE and PAYABLE)
   */
  public async getEligibleDebts(organizationId: string): Promise<SimulationDebt[]> {
    const debts = await prisma.debtRecord.findMany({
      where: {
        organizationId,
        type: 'PAYABLE',
        status: {
          in: ['ACTIVE', 'PARTIAL', 'OVERDUE'],
        },
      },
      include: {
        party: true,
        interestRates: {
          orderBy: { effectiveDate: 'desc' },
          take: 2, // Check for floating rate trends
        },
        schedules: {
          where: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            isActivated: true,
            dueDate: {
              lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
            },
          },
        },
      },
    });

    return debts.map((debt) => {
      const rates = debt.interestRates;
      const currentRate = rates[0]?.rate || 0;
      const previousRate = rates[1]?.rate || currentRate;
      const penaltyRate = debt.penaltyRate || 0;

      const isRateIncreasing = currentRate > previousRate;

      const outstandingNum = Number(debt.outstanding);
      const currentRateNum = Number(currentRate);
      const penaltyRateNum = Number(penaltyRate);

      let effectiveRate = currentRateNum;
      if (debt.status === 'OVERDUE') {
        // penaltyRate is daily percentage (e.g., 0.03 means 0.03%/day)
        effectiveRate += penaltyRateNum * 365;
      }

      const penaltyAccrued = debt.status === 'OVERDUE' ? outstandingNum * (penaltyRateNum / 100) * 30 : 0;

      // Calculate mandatory from schedules
      const schedules = (debt as any).schedules || [];
      const mandatoryPrincipal = schedules.reduce(
        (sum: number, s: any) => sum + (Number(s.principalAmount) - Number(s.paidPrincipal)),
        0,
      );
      const mandatoryInterest = schedules.reduce(
        (sum: number, s: any) => sum + (Number(s.interestAmount) - Number(s.paidInterest)),
        0,
      );
      const mandatoryPayment = penaltyAccrued + mandatoryInterest + mandatoryPrincipal;

      const remainingOutstandingIfBasePaid = Math.max(0, outstandingNum - mandatoryPrincipal);
      const totalObligation = mandatoryPayment + remainingOutstandingIfBasePaid;

      return {
        ...debt,
        principal: Number(debt.principal),
        outstanding: Number(debt.outstanding),
        effectiveAnnualRate: effectiveRate,
        totalObligation,
        monthlyInterest: mandatoryInterest,
        penaltyAccrued,
        riskScore: 0,
        isRateIncreasing,
        mandatoryPrincipal,
        mandatoryInterest,
        mandatoryPayment,
      } as unknown as SimulationDebt;
    });
  }

  /**
   * Main simulation logic
   */
  async calculateSimulation(
    organizationId: string,
    budget: number,
    strategy: RepaymentStrategy,
    excludeDebtIds: string[] = [],
  ): Promise<SimulationResult> {
    if (budget <= 0) {
      throw new Error('Ngân sách phải lớn hơn 0');
    }

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    let allDebts = await this.getEligibleDebts(organizationId);
    let debts = allDebts.filter((d) => !excludeDebtIds.includes(d.id));

    if (debts.length === 0) {
      return {
        debts: [],
        summary: {
          totalBudget: budget,
          totalAllocated: 0,
          remainingBudget: budget,
          fullyPaidCount: 0,
          totalInterestSaved: 0,
        },
        alerts: [{ type: 'INFO', message: 'Không có khoản nợ nào cần lập kế hoạch.' }],
      };
    }

    // Calculate risk scores if needed BEFORE sorting
    if (strategy === RepaymentStrategy.COVENANT_RISK && org) {
      this.calculateRiskScores(debts, org);
    }

    // Sort based on strategy
    this.sortDebtsByStrategy(debts, strategy);

    let remainingBudget = budget;
    let fullyPaidCount = 0;

    // Phase 1: Calculate and allocate base mandatory payment (Penalty + Interest + Principal due) for ALL debts
    const allocations = debts.map((debt) => {
      return {
        debt,
        mandatoryPayment: debt.mandatoryPayment,
        baseAllocation: 0,
        extraAllocation: 0,
        effectiveExtraPrincipal: 0,
      };
    });

    // Allocate base minimums first (even if it's not the highest priority, we must cover interest to avoid default)
    for (const alloc of allocations) {
      if (remainingBudget <= 0) break;
      const amountToPay = Math.min(remainingBudget, alloc.mandatoryPayment);
      alloc.baseAllocation = amountToPay;
      remainingBudget -= amountToPay;
    }

    // Phase 2: Allocate remaining budget according to priority strategy (Avalanche/Snowball etc)
    for (const alloc of allocations) {
      if (remainingBudget <= 0) break;

      const principalPaidInBase = Math.max(
        0,
        alloc.baseAllocation - alloc.debt.penaltyAccrued - alloc.debt.mandatoryInterest,
      );
      const remainingOutstanding = alloc.debt.outstanding - principalPaidInBase;

      if (remainingOutstanding > 0) {
        const prepaymentFeeRate = 0; // Removed: alloc.debt.origin === 'FINANCIAL' ? 0.01 : 0;
        const budgetNeeded = remainingOutstanding * (1 + prepaymentFeeRate);
        const amountToPay = Math.min(remainingBudget, budgetNeeded);

        alloc.extraAllocation = amountToPay;
        alloc.effectiveExtraPrincipal = amountToPay / (1 + prepaymentFeeRate);
        remainingBudget -= amountToPay;
      }
    }

    // Engine 2: Future Simulation Loop to calculate accurate monthsToPayoff
    const simResults = this.runSimulationLoop(debts, budget, strategy, org);

    // Phase 3: Calculate outcomes
    const allocatedDebts = allocations.map(
      ({ debt, mandatoryPayment, baseAllocation, extraAllocation, effectiveExtraPrincipal }, index) => {
        const plannedAmount = baseAllocation + extraAllocation;

        const principalPaidInBase = Math.max(0, baseAllocation - debt.penaltyAccrued - debt.mandatoryInterest);
        const totalPrincipalReduction = principalPaidInBase + effectiveExtraPrincipal;
        const remainingAfter = Math.max(0, debt.outstanding - totalPrincipalReduction);

        if (remainingAfter <= 0) {
          fullyPaidCount++;
        }

        const { monthsToPayoff, isDebtTrap } = simResults[debt.id];

        return {
          debtId: debt.id,
          debtName: debt.internalCode || 'N/A',
          internalCode: debt.internalCode || 'N/A',
          partyName: debt.party.name,
          principal: Number(debt.principal),
          interestRate: Number((debt as any).interestRates?.[0]?.rate || 0),
          interestMethod: debt.interestMethod,
          dueDate: debt.dueDate,
          outstanding: Number(debt.outstanding),
          plannedAmount,
          remainingAfter,
          priority: index + 1,
          reason: this.getReasonForStrategy(debt, strategy),
          monthsToPayoff,
          isDebtTrap,
        };
      },
    );

    const alerts: { type: 'DANGER' | 'WARNING' | 'INFO'; message: string }[] = [];
    const trapDebts = allocatedDebts.filter((d) => d.isDebtTrap);

    if (trapDebts.length > 0) {
      alerts.push({
        type: 'DANGER',
        message: `Phát hiện ${trapDebts.length} khoản nợ đang rơi vào "Bẫy nợ". Tổng nợ sẽ tăng dần dù có trả nợ.`,
      });
    }

    const totalDebt = allDebts.reduce((sum, d) => sum + d.outstanding, 0);
    const deRatio = org?.equity ? totalDebt / org.equity : 0;

    if (org && deRatio > org.maxDebtToEquity) {
      alerts.push({
        type: 'DANGER',
        message: `Chỉ số D/E hiện tại (${deRatio.toFixed(2)}x) vượt ngưỡng Covenant (${org.maxDebtToEquity}x).`,
      });
    }

    const totalMinimum = debts.reduce((sum, d) => sum + d.monthlyInterest + d.penaltyAccrued, 0);
    if (budget < totalMinimum) {
      alerts.push({
        type: 'WARNING',
        message: `Ngân sách thấp hơn tổng lãi và phạt phát sinh (${totalMinimum.toLocaleString()}đ).`,
      });
    }

    return {
      debts: allocatedDebts,
      summary: {
        totalBudget: budget,
        totalAllocated: budget - remainingBudget,
        remainingBudget,
        fullyPaidCount,
        totalInterestSaved: allocations.reduce((sum, alloc) => {
          const annualRate = alloc.debt.effectiveAnnualRate / 100;
          return sum + alloc.effectiveExtraPrincipal * annualRate;
        }, 0),
      },
      alerts,
      optimalPoints: this.findOptimalPoints(debts, budget),
    };
  }

  private sortDebtsByStrategy(debts: any[], strategy: RepaymentStrategy) {
    switch (strategy) {
      case RepaymentStrategy.AVALANCHE:
        debts.sort((a, b) => b.effectiveAnnualRate - a.effectiveAnnualRate);
        break;
      case RepaymentStrategy.SNOWBALL:
        debts.sort((a, b) => Number(a.outstanding) - Number(b.outstanding));
        break;
      case RepaymentStrategy.OVERDUE_FIRST:
        debts.sort((a, b) => {
          // 1. Overdue items first
          const statusA = a.status === 'OVERDUE' ? 0 : 1;
          const statusB = b.status === 'OVERDUE' ? 0 : 1;
          if (statusA !== statusB) return statusA - statusB;

          // 2. If both overdue, oldest overdue first
          if (a.status === 'OVERDUE') {
            const dateA = a.overdueSince ? new Date(a.overdueSince).getTime() : new Date(a.dueDate).getTime();
            const dateB = b.overdueSince ? new Date(b.overdueSince).getTime() : new Date(b.dueDate).getTime();
            return dateA - dateB;
          }

          // 3. Otherwise, soonest due first
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
        break;
      case RepaymentStrategy.COVENANT_RISK:
        debts.sort((a, b) => {
          // 1. Risk score descending (highest covenant risk first)
          if (a.riskScore !== b.riskScore) return b.riskScore - a.riskScore;
          // 2. Financial (Bank) debts first
          const originA = a.origin === 'FINANCIAL' ? 0 : 1;
          const originB = b.origin === 'FINANCIAL' ? 0 : 1;
          if (originA !== originB) return originA - originB;
          // 3. Tie-break with highest interest rate
          return b.effectiveAnnualRate - a.effectiveAnnualRate;
        });
        break;
    }
  }

  private runSimulationLoop(debts: SimulationDebt[], monthlyBudget: number, strategy: RepaymentStrategy, org: any) {
    // Initial mapping
    const simDebts = debts.map((d) => ({
      id: d.id,
      outstanding: Number(d.outstanding),
      originalPrincipal: Number(d.principal),
      interestMethod: d.interestMethod,
      effectiveAnnualRate: d.effectiveAnnualRate,
      baseRate: Number((d as any).interestRates?.[0]?.rate || 0),
      riskScore: d.riskScore ?? 0,
      origin: d.origin,
      status: d.status as string,
      dueDate: d.dueDate,
      overdueSince: d.overdueSince,
      monthsCount: 0 as number | 'NEVER',
      isPaidOff: Number(d.outstanding) <= 0,
      isDebtTrap: false,
      trapReason: undefined as string | undefined,
      growingMonths: 0,
    }));

    let currentMonth = 0;
    const MAX_MONTHS = 360;

    // Sort simDebts by strategy once — order is preserved across loop iterations
    this.sortDebtsByStrategy(simDebts as any[], strategy);

    while (currentMonth < MAX_MONTHS) {
      const activeDebts = simDebts.filter((d) => !d.isPaidOff);
      if (activeDebts.length === 0) break;

      currentMonth++;
      let remainingBudget = monthlyBudget;

      // Phase 1: Mandatory Interest for ALL debts (strategy order preserved from activeDebts)
      const monthlyRequirements = activeDebts.map((d) => ({
        debt: d,
        previousOutstanding: d.outstanding,
        monthlyInterest:
          d.interestMethod === 'FLAT'
            ? (d.originalPrincipal * (d.effectiveAnnualRate / 100)) / 12
            : (d.outstanding * (d.effectiveAnnualRate / 100)) / 12,
        baseAllocation: 0,
        extraAllocation: 0,
      }));

      // Phase 1: Pay interest in strategy order (activeDebts already sorted)
      for (const req of monthlyRequirements) {
        if (remainingBudget <= 0) break;
        const amountToPay = Math.min(remainingBudget, req.monthlyInterest);
        req.baseAllocation = amountToPay;
        remainingBudget -= amountToPay;
      }

      // Phase 2: Pay extra principal in same strategy order
      for (const req of monthlyRequirements) {
        if (remainingBudget <= 0) break;
        const amountToPay = Math.min(remainingBudget, req.debt.outstanding);
        req.extraAllocation = amountToPay;
        remainingBudget -= amountToPay;
      }

      // Apply payments and detect per-debt traps
      for (const req of monthlyRequirements) {
        const unpaidInterest = req.monthlyInterest - req.baseAllocation;

        // Outstanding grows if interest not fully paid
        req.debt.outstanding += unpaidInterest;
        // Outstanding shrinks if extra principal paid
        req.debt.outstanding -= req.extraAllocation;

        if (req.debt.outstanding <= 0.5 && !req.debt.isPaidOff) {
          req.debt.isPaidOff = true;
          req.debt.monthsCount = currentMonth;
          req.debt.growingMonths = 0;
          req.debt.status = 'PAID';
        } else if (req.debt.outstanding > req.previousOutstanding) {
          // Per-debt trap: balance grew this month
          req.debt.growingMonths++;
          if (req.debt.growingMonths >= 6) {
            req.debt.isDebtTrap = true;
            req.debt.trapReason = 'GROWING_BALANCE';
          }
        } else {
          req.debt.growingMonths = Math.max(0, req.debt.growingMonths - 1);
        }
      }

      // Recalculate effectiveRate: OVERDUE debts with >50% of originalPrincipal paid off lose penalty
      for (const req of monthlyRequirements) {
        const paidFraction = 1 - req.debt.outstanding / req.debt.originalPrincipal;
        if (!req.debt.isPaidOff && req.debt.status === 'OVERDUE' && paidFraction >= 0.5) {
          req.debt.effectiveAnnualRate = req.debt.baseRate;
          req.debt.status = 'ACTIVE';
        }
      }
    }

    const result: any = {};
    for (const d of simDebts) {
      const isNever = !d.isPaidOff && (d.isDebtTrap || currentMonth >= MAX_MONTHS);
      result[d.id] = {
        monthsToPayoff: d.isPaidOff ? d.monthsCount : 'NEVER',
        isDebtTrap: isNever,
        trapReason: d.trapReason || (isNever ? 'TERM_EXCEEDED' : undefined),
      };
    }
    return result;
  }

  private calculateRiskScores(debts: SimulationDebt[] | any[], org: any) {
    const totalDebt = (debts as any[]).reduce((sum: number, d: any) => sum + Number(d.outstanding), 0);
    const deRatio = org?.equity ? totalDebt / org.equity : 0;

    const totalMonthlyService = (debts as any[]).reduce(
      (sum: number, d: any) => sum + Number(d.monthlyInterest || 0) + Number(d.penaltyAccrued || 0),
      0,
    );
    const monthlyRevenue = (org?.annualRevenue || 0) / 12;
    const dscr = totalMonthlyService > 0 ? monthlyRevenue / totalMonthlyService : 100;

    debts.forEach((d) => {
      let score = 0;
      if (d.status === 'OVERDUE' && d.origin === 'FINANCIAL') score += 10;
      if (d.status === 'OVERDUE' && d.origin === 'TAX') score += 8;
      const daysToDue = (new Date(d.dueDate).getTime() - Date.now()) / 86400000;
      if (daysToDue > 0 && daysToDue <= 7) score += 6;
      if (deRatio > (org?.maxDebtToEquity || 3) * 0.9 && d.origin === 'FINANCIAL') score += 5;
      if (dscr < (org?.minDSCR || 1.2) * 1.1 && d.origin === 'FINANCIAL') score += 4;
      if (d.isRateIncreasing) score += 3;
      const overdueDays = d.overdueSince ? (Date.now() - new Date(d.overdueSince).getTime()) / 86400000 : 0;
      score += Math.floor(overdueDays / 10);
      d.riskScore = score;
    });
  }

  private findOptimalPoints(debts: SimulationDebt[], currentBudget: number) {
    const points: any[] = [];
    const testIncrements = [0.1, 0.2, 0.5];

    const simulateAt = (testBudget: number) => {
      let rem = testBudget;
      let count = 0;
      for (const d of debts) {
        if (rem >= d.totalObligation) {
          rem -= d.totalObligation;
          count++;
        }
      }
      return count;
    };

    const currentCount = simulateAt(currentBudget);

    for (const inc of testIncrements) {
      const testBudget = currentBudget * (1 + inc);
      const count = simulateAt(testBudget);
      if (count > currentCount) {
        points.push({
          budget: testBudget,
          fullyPaidCount: count,
          impact: `Thêm ${(inc * 100).toFixed(0)}% ngân sách sẽ giúp tất toán thêm ${count - currentCount} khoản nợ.`,
        });
      }
    }
    return points;
  }

  private getReasonForStrategy(debt: SimulationDebt, strategy: RepaymentStrategy): string {
    switch (strategy) {
      case RepaymentStrategy.AVALANCHE:
        return `Lãi suất cao (${debt.effectiveAnnualRate.toFixed(2)}%/năm)`;
      case RepaymentStrategy.SNOWBALL:
        return `Dư nợ nhỏ (${debt.outstanding.toLocaleString()}đ)`;
      case RepaymentStrategy.OVERDUE_FIRST:
        return debt.status === 'OVERDUE' ? 'Đã quá hạn' : 'Sắp đến hạn';
      case RepaymentStrategy.COVENANT_RISK:
        return `Rủi ro Covenant (${debt.riskScore})`;
      default:
        return '';
    }
  }

  async commitPlan(
    organizationId: string,
    userId: string,
    data: {
      name: string;
      budget: number;
      strategy: RepaymentStrategy;
      items: { debtId: string; plannedAmount: number; priority: number; reason?: string }[];
    },
  ) {
    const now = new Date();
    return await prisma.enterpriseRepaymentPlan.create({
      data: {
        organizationId,
        userId,
        name: data.name,
        budget: data.budget,
        strategy: data.strategy,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'COMMITTED',
        items: {
          create: data.items.map((item) => ({
            debtRecordId: item.debtId,
            plannedAmount: item.plannedAmount,
            priority: item.priority,
            reason: item.reason,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  }
}
