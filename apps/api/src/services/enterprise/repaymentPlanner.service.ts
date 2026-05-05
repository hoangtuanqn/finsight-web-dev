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
  effectiveAnnualRate: number;
  totalObligation: number;
  monthlyInterest: number;
  penaltyAccrued: number;
  riskScore: number;
}

interface SimulationResult {
  debts: {
    debtId: string;
    debtName: string;
    partyName: string;
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
    totalInterestSaved: number; // Placeholder for future enhancement
  };
  alerts: {
    type: 'DANGER' | 'WARNING' | 'INFO';
    message: string;
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
          take: 1,
        },
      },
    });

    // Transform and calculate initial metrics
    return debts.map((debt) => {
      const currentRate = debt.interestRates[0]?.rate || 0;
      const penaltyRate = debt.penaltyRate || 0;

      // Calculate effective rate (simplified: contract rate + penalty if overdue)
      let effectiveRate = currentRate;
      if (debt.status === 'OVERDUE') {
        effectiveRate += penaltyRate * 365 * 100; // Convert daily penalty to annual %
      }

      // Calculate monthly interest and penalty
      const monthlyInterest = (debt.outstanding * (currentRate / 100)) / 12;
      const monthlyPenalty = debt.status === 'OVERDUE' ? debt.outstanding * penaltyRate * 30 : 0;

      return {
        ...debt,
        effectiveAnnualRate: effectiveRate,
        totalObligation: debt.outstanding + monthlyInterest + monthlyPenalty,
        monthlyInterest,
        penaltyAccrued: monthlyPenalty,
        riskScore: 0, // Will be calculated by Covenant Risk strategy
      } as SimulationDebt;
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

    // Filter excluded debts
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

    // Waterfall allocation
    let remainingBudget = budget;
    let fullyPaidCount = 0;
    const totalDebt = allDebts.reduce((sum, d) => sum + d.outstanding, 0);
    const deRatio = org?.equity ? totalDebt / org.equity : 0;

    const allocatedDebts = debts.map((debt, index) => {
      const plannedAmount = Math.min(remainingBudget, debt.totalObligation);
      remainingBudget -= plannedAmount;

      if (plannedAmount >= debt.totalObligation) {
        fullyPaidCount++;
      }

      const monthlyCost = debt.monthlyInterest + (debt.status === 'OVERDUE' ? debt.penaltyAccrued : 0);
      let monthsToPayoff: number | 'NEVER' = 'NEVER';
      let isDebtTrap = false;
      let debtIncrease = 0;

      if (plannedAmount > 0) {
        if (plannedAmount <= monthlyCost && debt.outstanding > 0) {
          monthsToPayoff = 'NEVER';
          isDebtTrap = true;
          debtIncrease = monthlyCost - plannedAmount;
        } else {
          const netPrincipalPayment = plannedAmount - monthlyCost;
          monthsToPayoff = Math.ceil(debt.outstanding / netPrincipalPayment);
        }
      } else {
        // No payment made this month
        debtIncrease = monthlyCost;
      }

      return {
        debtId: debt.id,
        debtName: debt.internalCode || 'N/A',
        partyName: debt.party.name,
        outstanding: debt.outstanding,
        plannedAmount,
        remainingAfter: Math.max(
          0,
          debt.outstanding - (plannedAmount - monthlyCost > 0 ? plannedAmount - monthlyCost : 0),
        ),
        priority: index + 1,
        reason: this.getReasonForStrategy(debt, strategy),
        monthsToPayoff,
        isDebtTrap,
        debtIncrease,
      };
    });

    // Generate alerts
    const alerts: { type: 'DANGER' | 'WARNING' | 'INFO'; message: string }[] = [];

    const trapDebts = allocatedDebts.filter((d) => d.isDebtTrap);
    if (trapDebts.length > 0) {
      const totalShortfall = trapDebts.reduce((sum, d) => {
        const debtData = debts.find((orig) => orig.id === d.debtId);
        if (!debtData) return sum;
        const monthlyCost = debtData.monthlyInterest + (debtData.status === 'OVERDUE' ? debtData.penaltyAccrued : 0);
        return sum + (monthlyCost - d.plannedAmount);
      }, 0);

      alerts.push({
        type: 'DANGER',
        message: `Phát hiện ${trapDebts.length} khoản nợ đang rơi vào "Bẫy nợ". Tổng nợ của nhóm này sẽ tăng thêm ${totalShortfall.toLocaleString()}đ mỗi tháng. Cần bổ sung ít nhất số tiền này để dừng đà tăng nợ.`,
      });
    }

    if (org && deRatio > org.maxDebtToEquity) {
      alerts.push({
        type: 'DANGER',
        message: `Chỉ số D/E hiện tại (${deRatio.toFixed(2)}x) đã vượt ngưỡng Covenant (${org.maxDebtToEquity}x). Nguy cơ bị ngân hàng yêu cầu tất toán trước hạn (Acceleration).`,
      });
    }

    const totalMinimum = debts.reduce((sum, d) => sum + d.monthlyInterest + d.penaltyAccrued, 0);
    if (budget < totalMinimum) {
      alerts.push({
        type: 'WARNING',
        message: `Ngân sách hiện tại (${budget.toLocaleString()}đ) thấp hơn tổng lãi và phạt phát sinh hàng tháng (${totalMinimum.toLocaleString()}đ). Dư nợ tổng của doanh nghiệp sẽ tiếp tục tăng.`,
      });
    }

    // Alert for excluded debts that are overdue
    const excludedOverdue = allDebts.filter((d) => excludeDebtIds.includes(d.id) && d.status === 'OVERDUE');
    if (excludedOverdue.length > 0) {
      alerts.push({
        type: 'WARNING',
        message: `Có ${excludedOverdue.length} khoản nợ QUÁ HẠN bị loại khỏi kế hoạch. Các khoản này vẫn tiếp tục phát sinh phạt và ảnh hưởng xấu đến điểm tín dụng.`,
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
    };
  }

  private calculateRiskScores(debts: SimulationDebt[], org: any) {
    const totalDebt = debts.reduce((sum, d) => sum + d.outstanding, 0);
    const deRatio = org?.equity ? totalDebt / org.equity : 0;

    debts.forEach((d) => {
      let score = 0;
      if (d.status === 'OVERDUE' && d.origin === 'FINANCIAL') score += 10;
      if (d.status === 'OVERDUE' && d.origin === 'TAX') score += 8;

      const daysToDue = (new Date(d.dueDate).getTime() - Date.now()) / 86400000;
      if (daysToDue > 0 && daysToDue <= 7) score += 6;

      if (deRatio > (org?.maxDebtToEquity || 3) * 0.9 && d.origin === 'FINANCIAL') {
        score += 5; // Extra priority to bank debts when close to D/E limit
      }

      const overdueDays = d.overdueSince ? (Date.now() - new Date(d.overdueSince).getTime()) / 86400000 : 0;
      score += Math.floor(overdueDays / 10);

      d.riskScore = score;
    });
  }

  private getReasonForStrategy(debt: SimulationDebt, strategy: RepaymentStrategy): string {
    switch (strategy) {
      case RepaymentStrategy.AVALANCHE:
        return `Lãi suất thực tế cao (${debt.effectiveAnnualRate.toFixed(2)}%/năm)`;
      case RepaymentStrategy.SNOWBALL:
        return `Dư nợ nhỏ (${debt.outstanding.toLocaleString()}đ)`;
      case RepaymentStrategy.OVERDUE_FIRST:
        return debt.status === 'OVERDUE' ? 'Đã quá hạn' : 'Sắp đến hạn';
      case RepaymentStrategy.COVENANT_RISK:
        return `Điểm rủi ro cao (${debt.riskScore})`;
      default:
        return '';
    }
  }

  /**
   * Commit a simulation results to a formal plan
   */
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
