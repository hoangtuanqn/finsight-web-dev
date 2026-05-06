import enterpriseDb from '../../prisma/enterprise.client.js';

const prisma = enterpriseDb;

export class RepaymentPlanTrackingService {
  /**
   * Compares a committed plan with actual payments for the specified month/year
   */
  async getExecutionReport(organizationId: string, month: number, year: number) {
    // 1. Get the committed plan for the month
    const plan = await prisma.enterpriseRepaymentPlan.findFirst({
      where: {
        organizationId,
        month,
        year,
        status: 'COMMITTED',
      },
      include: {
        items: {
          include: {
            debtRecord: {
              include: {
                party: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!plan) {
      return { plan: null, summary: null, items: [] };
    }

    // 2. Get all payments (transactions of type PAYMENT) for these debts in that month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const transactions = await prisma.debtTransaction.findMany({
      where: {
        debtRecord: {
          organizationId,
        },
        type: 'PAYMENT',
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 3. Map actuals to plan items
    const executionItems = plan.items.map((item) => {
      const actualAmount = transactions
        .filter((t) => t.debtRecordId === item.debtRecordId)
        .reduce((sum, t) => sum + t.amount, 0);

      const variance = actualAmount - item.plannedAmount;
      const status = actualAmount >= item.plannedAmount ? 'COMPLIANT' : actualAmount > 0 ? 'PARTIAL' : 'NON_COMPLIANT';

      return {
        debtId: item.debtRecordId,
        debtName: item.debtRecord.internalCode || 'N/A',
        partyName: item.debtRecord.party.name,
        plannedAmount: item.plannedAmount,
        actualAmount,
        variance,
        status,
        priority: item.priority,
      };
    });

    // 4. Calculate overall compliance score
    const totalPlanned = executionItems.reduce((sum, i) => sum + i.plannedAmount, 0);
    const totalActual = executionItems.reduce((sum, i) => sum + i.actualAmount, 0);
    const complianceRate = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 100;

    // Detect priority violations (paying a lower priority debt while a higher one is unpaid)
    let priorityViolation = false;
    let foundUnpaidHigherPriority = false;

    // Sort by priority (asc)
    const sortedItems = [...executionItems].sort((a, b) => a.priority - b.priority);
    for (const item of sortedItems) {
      if (item.actualAmount < item.plannedAmount) {
        foundUnpaidHigherPriority = true;
      } else if (foundUnpaidHigherPriority && item.actualAmount > 0) {
        // We found a payment for a lower priority debt while a higher one wasn't fully met
        priorityViolation = true;
        break;
      }
    }

    return {
      plan: {
        id: plan.id,
        name: plan.name,
        budget: plan.budget,
        strategy: plan.strategy,
      },
      summary: {
        totalPlanned,
        totalActual,
        complianceRate,
        priorityViolation,
        itemsCount: executionItems.length,
        compliantCount: executionItems.filter((i) => i.status === 'COMPLIANT').length,
      },
      items: executionItems,
    };
  }
}
