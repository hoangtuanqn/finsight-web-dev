import { Request, Response } from 'express';
import { runNotificationJob } from '../../jobs/notification.job';
import { runOverdueJob } from '../../jobs/overdue.job';
import { runPenaltyJob } from '../../jobs/penalty.job';
import { runReportingJob } from '../../jobs/report.job';
import enterpriseDb from '../../prisma/enterprise.client';

export const runOverdue = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const result = await runOverdueJob(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runPenalty = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const result = await runPenaltyJob(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runNotify = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const result = await runNotificationJob(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const runReport = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const result = await runReportingJob(orgId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobLogs = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.organizationId;
    const logs = await (enterpriseDb as any).jobLog.findMany({
      where: orgId ? { organizationId: orgId } : {},
      orderBy: { runAt: 'desc' },
      take: 50,
    });
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
