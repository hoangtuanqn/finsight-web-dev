import { Response } from 'express';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { invalidateCache } from '../middleware/cache.middleware';
import { AuthenticatedRequest } from '../types';

export async function getInvestorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const profile = await (prisma as any).investorProfile.findUnique({ where: { userId: req.userId } });
    return success(res, { investorProfile: profile });
  } catch (err) {
    console.error('getInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createInvestorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const { capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate } = req.body;
    const profile = await (prisma as any).investorProfile.upsert({
      where: { userId: req.userId },
      update: { capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate, lastUpdated: new Date() },
      create: { userId: req.userId, capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate },
    });
    invalidateCache([`investment:allocation:${req.userId}:*`]);
    return success(res, { investorProfile: profile }, 201);
  } catch (err) {
    console.error('createInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateInvestorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const data = { ...req.body, lastUpdated: new Date() };
    const profile = await (prisma as any).investorProfile.update({
      where: { userId: req.userId },
      data,
    });
    invalidateCache([`investment:allocation:${req.userId}:*`]);
    return success(res, { investorProfile: profile });
  } catch (err) {
    console.error('updateInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}
