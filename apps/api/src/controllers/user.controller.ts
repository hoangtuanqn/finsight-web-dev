import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

export async function getProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      include: { investorProfile: true },
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, { user });
  } catch (err) {
    console.error('getProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const {
      fullName,
      email,
      monthlyIncome,
      extraBudget,
      capital,
      goal,
      horizon,
      riskLevel,
      savingsRate,
      inflationRate,
    } = req.body;

    // Update User basic info
    const user = await (prisma as any).user.update({
      where: { id: req.userId },
      data: {
        fullName,
        email,
        monthlyIncome: monthlyIncome !== undefined ? parseFloat(monthlyIncome) : undefined,
        extraBudget: extraBudget !== undefined ? parseFloat(extraBudget) : undefined,
      },
      include: { investorProfile: true },
    });

    // Update or Create Investor Profile if investment data provided
    if (
      capital !== undefined ||
      goal ||
      horizon ||
      riskLevel ||
      savingsRate !== undefined ||
      inflationRate !== undefined
    ) {
      await (prisma as any).investorProfile.upsert({
        where: { userId: req.userId },
        update: {
          capital: capital !== undefined ? parseFloat(capital) : undefined,
          goal,
          horizon,
          riskLevel,
          savingsRate: savingsRate !== undefined ? parseFloat(savingsRate) : undefined,
          inflationRate: inflationRate !== undefined ? parseFloat(inflationRate) : undefined,
          lastUpdated: new Date(),
        },
        create: {
          userId: req.userId,
          capital: capital !== undefined ? parseFloat(capital) : 0,
          goal: goal || 'GROWTH',
          horizon: horizon || 'MEDIUM',
          riskLevel: riskLevel || 'MEDIUM',
          savingsRate: savingsRate !== undefined ? parseFloat(savingsRate) : 6.0,
          inflationRate: inflationRate !== undefined ? parseFloat(inflationRate) : 3.5,
        },
      });
    }

    const updatedUser = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      include: { investorProfile: true },
    });

    return success(res, { user: updatedUser });
  } catch (err) {
    console.error('updateProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getNotifications(req: AuthenticatedRequest, res: Response) {
  try {
    const notifications = await (prisma as any).notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return success(res, { notifications });
  } catch (err) {
    console.error('getNotifications error:', err);
    return error(res, 'Internal server error');
  }
}

export async function markNotificationRead(req: AuthenticatedRequest, res: Response) {
  try {
    const notification = await (prisma as any).notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return success(res, { notification });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    return error(res, 'Internal server error');
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response) {
  try {
    await (prisma as any).notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getHealthScoreHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const history = await (prisma as any).healthScoreHistory.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return success(res, { history });
  } catch (err) {
    console.error('getHealthScoreHistory error:', err);
    return error(res, 'Internal server error');
  }
}
