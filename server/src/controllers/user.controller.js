import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';

export async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
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

export async function updateProfile(req, res) {
  try {
    const { fullName, email, monthlyIncome, extraBudget, capital, goal, horizon, riskLevel } = req.body;
    
    // Update User basic info
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { 
        fullName, 
        email, 
        monthlyIncome: monthlyIncome !== undefined ? parseFloat(monthlyIncome) : undefined,
        extraBudget: extraBudget !== undefined ? parseFloat(extraBudget) : undefined 
      },
      include: { investorProfile: true }
    });

    // Update or Create Investor Profile if investment data provided
    if (capital !== undefined || goal || horizon || riskLevel) {
      await prisma.investorProfile.upsert({
        where: { userId: req.userId },
        update: { 
          capital: capital !== undefined ? parseFloat(capital) : undefined,
          goal, 
          horizon, 
          riskLevel,
          lastUpdated: new Date() 
        },
        create: { 
          userId: req.userId,
          capital: capital !== undefined ? parseFloat(capital) : 0,
          goal: goal || 'GROWTH',
          horizon: horizon || 'MEDIUM',
          riskLevel: riskLevel || 'MEDIUM'
        }
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { investorProfile: true }
    });

    return success(res, { user: updatedUser });
  } catch (err) {
    console.error('updateProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
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

export async function markNotificationRead(req, res) {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return success(res, { notification });
  } catch (err) {
    console.error('markNotificationRead error:', err);
    return error(res, 'Internal server error');
  }
}

export async function markAllRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });
    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return error(res, 'Internal server error');
  }
}
