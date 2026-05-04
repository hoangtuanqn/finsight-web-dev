import enterpriseDb from '../../prisma/enterprise.client.js';

export class AnalyticsService {
  /**
   * Get main KPI summary for the organization
   */
  async getSummary(organizationId: string) {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const debts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'PARTIAL', 'OVERDUE'] },
      },
    });

    let totalReceivable = 0;
    let totalPayable = 0;
    let totalOverdueReceivable = 0;
    let totalOverduePayable = 0;
    let dueSoonReceivable = 0;
    let dueSoonPayable = 0;
    let dailyPenalty = 0;

    for (const debt of debts) {
      const outstanding = debt.outstanding;

      if (debt.type === 'RECEIVABLE') {
        totalReceivable += outstanding;
        if (debt.status === 'OVERDUE') totalOverdueReceivable += outstanding;
        if (new Date(debt.dueDate) <= sevenDaysFromNow && debt.status !== 'OVERDUE') {
          dueSoonReceivable += outstanding;
        }
      } else {
        totalPayable += outstanding;
        if (debt.status === 'OVERDUE') totalOverduePayable += outstanding;
        if (new Date(debt.dueDate) <= sevenDaysFromNow && debt.status !== 'OVERDUE') {
          dueSoonPayable += outstanding;
        }
        if (debt.status === 'OVERDUE') {
          dailyPenalty += outstanding * (debt.penaltyRate || 0.0003);
        }
      }
    }

    return {
      receivable: {
        total: totalReceivable,
        overdue: totalOverdueReceivable,
        dueSoon: dueSoonReceivable,
      },
      payable: {
        total: totalPayable,
        overdue: totalOverduePayable,
        dueSoon: dueSoonPayable,
        dailyPenalty,
      },
      health: await this.getFinancialHealth(organizationId, totalPayable),
    };
  }

  /**
   * Get Aging Report data
   */
  async getAgingReport(organizationId: string, type: 'RECEIVABLE' | 'PAYABLE' = 'RECEIVABLE') {
    const debts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        organizationId,
        type,
        status: { in: ['ACTIVE', 'PARTIAL', 'OVERDUE'] },
      },
      include: { party: true },
    });

    const report: Record<string, any> = {};

    for (const debt of debts) {
      const partyId = debt.party.id;
      if (!report[partyId]) {
        report[partyId] = {
          partyName: debt.party.name,
          buckets: { current: 0, '1-30': 0, '31-90': 0, '91-180': 0, '181-360': 0, over360: 0 },
          total: 0,
          provision: 0,
        };
      }

      const outstanding = debt.outstanding;
      report[partyId].total += outstanding;

      if (debt.status !== 'OVERDUE') {
        report[partyId].buckets.current += outstanding;
      } else {
        const overdueDays = Math.floor((Date.now() - new Date(debt.dueDate).getTime()) / 86400000);

        if (overdueDays <= 30) {
          report[partyId].buckets['1-30'] += outstanding;
        } else if (overdueDays <= 90) {
          report[partyId].buckets['31-90'] += outstanding;
          report[partyId].provision += outstanding * 0.1;
        } else if (overdueDays <= 180) {
          report[partyId].buckets['91-180'] += outstanding;
          report[partyId].provision += outstanding * 0.3;
        } else if (overdueDays <= 360) {
          report[partyId].buckets['181-360'] += outstanding;
          report[partyId].provision += outstanding * 0.5;
        } else {
          report[partyId].buckets.over360 += outstanding;
          report[partyId].provision += outstanding;
        }
      }
    }

    return Object.values(report);
  }

  /**
   * Get Cash Flow projection for 30 days
   */
  async getCashFlowProjection(organizationId: string) {
    const projection: Record<string, { in: number; out: number }> = {};
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      projection[dateStr] = { in: 0, out: 0 };
    }

    const debts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'PARTIAL'] },
      },
    });

    for (const debt of debts) {
      const dateStr = new Date(debt.dueDate).toISOString().split('T')[0];
      if (projection[dateStr]) {
        if (debt.type === 'RECEIVABLE') {
          projection[dateStr].in += debt.outstanding;
        } else {
          projection[dateStr].out += debt.outstanding;
        }
      }
    }

    return Object.entries(projection).map(([date, values]) => ({
      date,
      ...values,
      net: values.in - values.out,
    }));
  }

  /**
   * Get action items (today's tasks)
   */
  async getActionItems(organizationId: string) {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    const debts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'PARTIAL', 'OVERDUE', 'DISPUTED'] },
      },
      include: { party: true },
    });

    const items: any[] = [];

    for (const debt of debts) {
      const outstanding = debt.outstanding;
      if (outstanding <= 0) continue;

      if (debt.status === 'DISPUTED') {
        items.push({
          type: 'DISPUTE',
          priority: 5,
          message: `Xem xét và xử lý tranh chấp với ${debt.party.name}`,
          debtId: debt.id,
          amount: outstanding,
        });
      } else if (debt.type === 'PAYABLE') {
        if (debt.status === 'OVERDUE') {
          items.push({
            type: 'PAYABLE_OVERDUE',
            priority: 1,
            message: `Xử lý ngay khoản nợ quá hạn với ${debt.party.name}, penalty đang tích lũy`,
            debtId: debt.id,
            amount: outstanding,
          });
        } else if (new Date(debt.dueDate) <= threeDaysFromNow) {
          items.push({
            type: 'PAYABLE_DUE_SOON',
            priority: 2,
            message: `Chuẩn bị thanh toán ${outstanding.toLocaleString()}đ cho ${debt.party.name} trước ngày ${new Date(debt.dueDate).toLocaleDateString('vi-VN')}`,
            debtId: debt.id,
            amount: outstanding,
          });
        }
      } else if (debt.type === 'RECEIVABLE') {
        if (debt.status === 'OVERDUE') {
          items.push({
            type: 'RECEIVABLE_OVERDUE',
            priority: 3,
            message: `Liên hệ ${debt.party.name} để đốc thúc thanh toán ${outstanding.toLocaleString()}đ quá hạn`,
            debtId: debt.id,
            amount: outstanding,
          });
        } else if (new Date(debt.dueDate) <= today) {
          items.push({
            type: 'RECEIVABLE_DUE_TODAY',
            priority: 4,
            message: `Theo dõi thanh toán ${outstanding.toLocaleString()}đ từ ${debt.party.name} đến hạn hôm nay`,
            debtId: debt.id,
            amount: outstanding,
          });
        }
      }
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 10);
  }

  private async getFinancialHealth(organizationId: string, totalPayable: number) {
    const org = await (enterpriseDb as any).organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) return null;

    const equity = (org as any).equity ?? 0;
    const maxDebtToEquity = (org as any).maxDebtToEquity ?? 3;
    const deRatio = equity > 0 ? totalPayable / equity : 0;

    return {
      deRatio,
      maxDeRatio: maxDebtToEquity,
      isRisk: deRatio > maxDebtToEquity,
    };
  }
}
