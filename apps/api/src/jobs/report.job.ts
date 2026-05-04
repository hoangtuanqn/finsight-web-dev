import dayjs from 'dayjs';
import enterpriseDb from '../prisma/enterprise.client';

export async function runReportingJob(organizationId?: string) {
  const jobName = 'WEEKLY_REPORT';
  const startAt = new Date();

  try {
    const orgs = organizationId
      ? [{ id: organizationId }]
      : await (enterpriseDb as any).organization.findMany({ select: { id: true } });

    const results = [];

    for (const org of orgs) {
      // 1. Top 10 Overdue
      const topOverdue = await (enterpriseDb as any).debtRecord.findMany({
        where: { organizationId: org.id, status: 'OVERDUE' },
        orderBy: { overdueSince: 'asc' }, // Cũ nhất lên đầu
        take: 10,
        include: { party: { select: { name: true } } },
      });

      // 2. Total Penalty last week
      const lastWeek = dayjs().subtract(7, 'day').toDate();
      const weeklyPenalty = await (enterpriseDb as any).debtTransaction.aggregate({
        where: {
          debtRecord: { organizationId: org.id },
          type: 'PENALTY',
          paidAt: { gte: lastWeek },
        },
        _sum: { amount: true },
      });

      // 3. Dự báo (Simple logic)
      const totalOverdueAmount = await (enterpriseDb as any).debtRecord.aggregate({
        where: { organizationId: org.id, status: 'OVERDUE' },
        _sum: { outstanding: true },
      });

      const reportData = {
        topOverdueCount: topOverdue.length,
        weeklyPenaltySum: weeklyPenalty._sum.amount || 0,
        totalOverdueOutstanding: totalOverdueAmount._sum.outstanding || 0,
        generatedAt: new Date(),
      };

      // Ghi log báo cáo
      await (enterpriseDb as any).jobLog.create({
        data: {
          organizationId: org.id,
          jobName,
          status: 'SUCCESS',
          runAt: startAt,
          details: reportData,
        },
      });

      results.push({ orgId: org.id, report: reportData });
    }

    return { success: true, processedOrgs: results.length, data: results };
  } catch (error: any) {
    console.error(`[Job: ${jobName}] Failed:`, error);
    return { success: false, error: error.message };
  }
}
