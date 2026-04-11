import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';

export async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, fullName: true, monthlyIncome: true, extraBudget: true, createdAt: true },
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
    const { fullName, monthlyIncome, extraBudget } = req.body;
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(monthlyIncome !== undefined && { monthlyIncome }),
        ...(extraBudget !== undefined && { extraBudget }),
      },
      select: { id: true, email: true, fullName: true, monthlyIncome: true, extraBudget: true },
    });
    return success(res, { user });
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
