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
  private async getEligibleDebts(organizationId: string): Promise<SimulationDebt[]> {
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
      },
    });

    return debts.map((debt) => {
      const rates = debt.interestRates;
      const currentRate = rates[0]?.rate || 0;
      const previousRate = rates[1]?.rate || currentRate;
      const penaltyRate = debt.penaltyRate || 0;

      const isRateIncreasing = currentRate > previousRate;

      let effectiveRate = currentRate;
      if (debt.status === 'OVERDUE') {
        effectiveRate += penaltyRate * 365 * 100;
      }

      const monthlyInterest = (Number(debt.outstanding) * (Number(currentRate) / 100)) / 12;
      const monthlyPenalty = debt.status === 'OVERDUE' ? Number(debt.outstanding) * Number(penaltyRate) * 30 : 0;

      // Default 1% prepayment penalty for bank loans as per business requirement 9.1
      const prepaymentFee = debt.origin === 'FINANCIAL' ? Number(debt.outstanding) * 0.01 : 0;

      return {
        ...debt,
        principal: Number(debt.principal),
        outstanding: Number(debt.outstanding),
        effectiveAnnualRate: effectiveRate,
        totalObligation: Number(debt.outstanding) + monthlyInterest + monthlyPenalty + prepaymentFee,
        monthlyInterest,
        penaltyAccrued: monthlyPenalty,
        riskScore: 0,
        isRateIncreasing,
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

    // Sort based on strategy
    switch (strategy) {
      case RepaymentStrategy.AVALANCHE:
        debts.sort((a, b) => b.effectiveAnnualRate - a.effectiveAnnualRate);
        break;
      case RepaymentStrategy.SNOWBALL:
        debts.sort((a, b) => a.outstanding - b.outstanding);
        break;
      case RepaymentStrategy.OVERDUE_FIRST:
        debts.sort((a, b) => {
          const getPriority = (d: SimulationDebt) => {
            if (d.status !== 'OVERDUE') return 99;
            if (d.origin === 'TAX') return 1;
            if (d.origin === 'FINANCIAL') return 2;
            if (d.origin === 'TRADE') return 3;
            return 4;
          };
          const pA = getPriority(a);
          const pB = getPriority(b);
          if (pA !== pB) return pA - pB;
          const daysA = a.overdueSince ? (Date.now() - new Date(a.overdueSince).getTime()) / 86400000 : 0;
          const daysB = b.overdueSince ? (Date.now() - new Date(b.overdueSince).getTime()) / 86400000 : 0;
          return daysB - daysA;
        });
        break;
      case RepaymentStrategy.COVENANT_RISK:
        this.calculateRiskScores(debts, org);
        debts.sort((a, b) => b.riskScore - a.riskScore);
        break;
    }

    let remainingBudget = budget;
    let fullyPaidCount = 0;

    // Phase 1: Calculate and allocate base minimum payment (Interest + Penalty) for ALL debts
    const allocations = debts.map((debt) => {
      const monthlyCost = debt.monthlyInterest + (debt.status === 'OVERDUE' ? debt.penaltyAccrued : 0);
      return {
        debt,
        monthlyCost,
        baseAllocation: 0,
        extraAllocation: 0,
      };
    });

    // Allocate base minimums first (even if it's not the highest priority, we must cover interest to avoid default)
    for (const alloc of allocations) {
      if (remainingBudget <= 0) break;
      const amountToPay = Math.min(remainingBudget, alloc.monthlyCost);
      alloc.baseAllocation = amountToPay;
      remainingBudget -= amountToPay;
    }

    // Phase 2: Allocate remaining budget according to priority strategy (Avalanche/Snowball etc)
    for (const alloc of allocations) {
      if (remainingBudget <= 0) break;
      const principalRemaining = alloc.debt.totalObligation - alloc.baseAllocation;
      if (principalRemaining > 0) {
        const amountToPay = Math.min(remainingBudget, principalRemaining);
        alloc.extraAllocation = amountToPay;
        remainingBudget -= amountToPay;
      }
    }

    // Phase 3: Calculate outcomes
    const allocatedDebts = allocations.map(({ debt, monthlyCost, baseAllocation, extraAllocation }, index) => {
      const plannedAmount = baseAllocation + extraAllocation;

      if (plannedAmount >= debt.totalObligation) {
        fullyPaidCount++;
      }

      let monthsToPayoff: number | 'NEVER' = 'NEVER';
      let isDebtTrap = false;

      if (plannedAmount > 0) {
        if (plannedAmount <= monthlyCost && debt.outstanding > 0) {
          monthsToPayoff = 'NEVER';
          isDebtTrap = true;
        } else {
          const netPrincipalPayment = plannedAmount - monthlyCost;
          monthsToPayoff = Math.ceil(debt.outstanding / netPrincipalPayment);
        }
      }

      return {
        debtId: debt.id,
        debtName: debt.internalCode || 'N/A',
        internalCode: debt.internalCode || 'N/A',
        partyName: debt.party.name,
        principal: Number(debt.principal),
        interestRate: Number(debt.interestRates[0]?.rate || 0),
        interestMethod: debt.interestMethod,
        dueDate: debt.dueDate,
        outstanding: Number(debt.outstanding),
        plannedAmount,
        remainingAfter: Math.max(
          0,
          Number(debt.outstanding) - (plannedAmount - monthlyCost > 0 ? plannedAmount - monthlyCost : 0),
        ),
        priority: index + 1,
        reason: this.getReasonForStrategy(debt, strategy),
        monthsToPayoff,
        isDebtTrap,
      };
    });

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
        totalInterestSaved: 0,
      },
      alerts,
      optimalPoints: this.findOptimalPoints(debts, budget),
    };
  }

  private calculateRiskScores(debts: SimulationDebt[], org: any) {
    const totalDebt = debts.reduce((sum, d) => sum + d.outstanding, 0);
    const deRatio = org?.equity ? totalDebt / org.equity : 0;

    const totalMonthlyService = debts.reduce((sum, d) => sum + d.monthlyInterest + d.penaltyAccrued, 0);
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
