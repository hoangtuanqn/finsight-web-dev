import { Response } from 'express';
import prisma from '../lib/prisma';
import { invalidateCache } from '../middleware/cache.middleware';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

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
    const existingProfile = await (prisma as any).investorProfile.findUnique({
      where: { userId: req.userId },
    });

    const capital = req.body.capital ?? existingProfile?.capital;
    const monthlyAdd = req.body.monthlyAdd ?? existingProfile?.monthlyAdd;
    const goal = req.body.goal ?? existingProfile?.goal;
    const horizon = req.body.horizon ?? existingProfile?.horizon;
    const riskLevel = req.body.riskLevel ?? existingProfile?.riskLevel;
    const riskScore = req.body.riskScore ?? existingProfile?.riskScore;
    const savingsRate = req.body.savingsRate ?? existingProfile?.savingsRate;
    const inflationRate = req.body.inflationRate ?? existingProfile?.inflationRate;

    const profile = await (prisma as any).investorProfile.upsert({
      where: { userId: req.userId },
      update: {
        capital,
        monthlyAdd,
        goal,
        horizon,
        riskLevel,
        riskScore,
        savingsRate,
        inflationRate,
        lastUpdated: new Date(),
      },
      create: {
        userId: req.userId,
        capital,
        monthlyAdd,
        goal,
        horizon,
        riskLevel,
        riskScore,
        savingsRate,
        inflationRate,
      },
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
    const existingProfile = await (prisma as any).investorProfile.findUnique({
      where: { userId: req.userId },
    });

    if (!existingProfile) {
      return error(res, 'Profile not found', 404);
    }

    const data = {
      capital: req.body.capital ?? existingProfile.capital,
      monthlyAdd: req.body.monthlyAdd ?? existingProfile.monthlyAdd,
      goal: req.body.goal ?? existingProfile.goal,
      horizon: req.body.horizon ?? existingProfile.horizon,
      riskLevel: req.body.riskLevel ?? existingProfile.riskLevel,
      riskScore: req.body.riskScore ?? existingProfile.riskScore,
      savingsRate: req.body.savingsRate ?? existingProfile.savingsRate,
      inflationRate: req.body.inflationRate ?? existingProfile.inflationRate,
      lastUpdated: new Date(),
    };

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
