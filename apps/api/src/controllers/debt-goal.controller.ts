import { Response } from 'express';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { invalidateCache } from '../middleware/cache.middleware';
import { simulateRepaymentWithExtraBudget } from '../utils/calculations';
import { AuthenticatedRequest } from '../types';

export async function getDebtGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const [goal, user, debts] = await Promise.all([
      (prisma as any).debtGoal.findUnique({ where: { userId: req.userId } }),
      (prisma as any).user.findUnique({ where: { id: req.userId }, select: { monthlyIncome: true, extraBudget: true } }),
      (prisma as any).debt.findMany({ where: { userId: req.userId } }),
    ]);

    const totalOriginal = debts.reduce((sum: number, d: any) => sum + d.originalAmount, 0);
    const totalCurrent = debts
      .filter((d: any) => d.status === 'ACTIVE')
      .reduce((sum: number, d: any) => sum + d.balance, 0);
    const totalPaid = Math.max(0, totalOriginal - totalCurrent);
    const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

    const milestones = [25, 50, 75, 100].map((pct) => ({
      percent: pct,
      targetAmount: totalOriginal * pct / 100,
      reached: totalPaid >= totalOriginal * pct / 100,
    }));

    let onTrack: any = null;
    if (goal) {
      const activeDebts = debts.filter((d: any) => d.status === 'ACTIVE');
      if (activeDebts.length > 0) {
        const extraBudget = user?.extraBudget ?? 0;
        const strategy = goal.strategy || 'AVALANCHE';

        const sim = simulateRepaymentWithExtraBudget(activeDebts, extraBudget, strategy, {
          monthlyIncome: user?.monthlyIncome ?? 0,
        });
        const today = new Date();
        const projectedPayoffDate = new Date(today);
        projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + sim.months);

        const targetDate = new Date(goal.targetDate);
        const diffDays = (targetDate.getTime() - projectedPayoffDate.getTime()) / (1000 * 60 * 60 * 24);

        let status: 'AHEAD' | 'ON_TRACK' | 'BEHIND';
        if (diffDays > 30) status = 'AHEAD';
        else if (diffDays >= -5) status = 'ON_TRACK';
        else status = 'BEHIND';

        let requiredExtraBudget: number | null = null;
        if (status === 'BEHIND') {
          const targetMonths = Math.max(
            1,
            Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30.44)),
          );
          let lo = extraBudget;
          let hi = totalCurrent * 2;
          for (let i = 0; i < 40; i++) {
            const mid = (lo + hi) / 2;
            const s = simulateRepaymentWithExtraBudget(activeDebts, mid, strategy, {
              monthlyIncome: user?.monthlyIncome ?? 0,
            });
            if (s.months <= targetMonths) hi = mid;
            else lo = mid;
          }
          requiredExtraBudget = Math.ceil(hi / 10000) * 10000; 
        }

        onTrack = {
          status,
          projectedPayoffDate: projectedPayoffDate.toISOString(),
          projectedMonths: sim.months,
          extraBudgetUsed: extraBudget,
          requiredExtraBudget,
        };
      } else {
        onTrack = {
          status: 'AHEAD',
          projectedPayoffDate: new Date().toISOString(),
          projectedMonths: 0,
          extraBudgetUsed: 0,
          requiredExtraBudget: null,
        };
      }
    }

    return success(res, {
      goal,
      progress: { totalOriginal, totalCurrent, totalPaid, percentPaid },
      milestones,
      onTrack,
    });
  } catch (err) {
    console.error('getDebtGoal error:', err);
    return error(res, 'Internal server error');
  }
}

export async function upsertDebtGoal(req: AuthenticatedRequest, res: Response) {
  const { targetDate, strategy } = req.body;

  if (!targetDate) return error(res, 'Vui lòng chọn ngày mục tiêu.', 400);
  const date = new Date(targetDate);
  if (isNaN(date.getTime())) return error(res, 'Ngày mục tiêu không hợp lệ.', 400);
  if (date <= new Date()) return error(res, 'Ngày mục tiêu phải là ngày trong tương lai.', 400);

  const validStrategies = ['AVALANCHE', 'SNOWBALL'];
  const strat = strategy && validStrategies.includes(strategy) ? strategy : 'AVALANCHE';

  try {
    const goal = await (prisma as any).debtGoal.upsert({
      where: { userId: req.userId },
      update: { targetDate: date, strategy: strat },
      create: { userId: req.userId, targetDate: date, strategy: strat },
    });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { goal }, 201);
  } catch (err) {
    console.error('upsertDebtGoal error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteDebtGoal(req: AuthenticatedRequest, res: Response) {
  try {
    const existing = await (prisma as any).debtGoal.findUnique({ where: { userId: req.userId } });
    if (!existing) return error(res, 'Không tìm thấy mục tiêu.', 404);

    await (prisma as any).debtGoal.delete({ where: { userId: req.userId } });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Đã xóa mục tiêu trả nợ.' });
  } catch (err) {
    console.error('deleteDebtGoal error:', err);
    return error(res, 'Internal server error');
  }
}
