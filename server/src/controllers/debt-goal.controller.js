import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { invalidateCache } from '../middleware/cache.middleware.js';
import { simulateRepayment } from '../utils/calculations.js';

// ============================================================
// GET /api/debts/goal
// Returns current goal + progress + milestones + on-track status
// ============================================================
export async function getDebtGoal(req, res) {
  try {
    const [goal, user, debts] = await Promise.all([
      prisma.debtGoal.findUnique({ where: { userId: req.userId } }),
      prisma.user.findUnique({ where: { id: req.userId }, select: { monthlyIncome: true, extraBudget: true } }),
      prisma.debt.findMany({ where: { userId: req.userId } }),
    ]);

    // --- Progress calculation (always returned, even without a goal) ---
    const totalOriginal = debts.reduce((sum, d) => sum + d.originalAmount, 0);
    const totalCurrent = debts
      .filter((d) => d.status === 'ACTIVE')
      .reduce((sum, d) => sum + d.balance, 0);
    const totalPaid = Math.max(0, totalOriginal - totalCurrent);
    const percentPaid = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

    // --- Milestones ---
    const milestones = [25, 50, 75, 100].map((pct) => ({
      percent: pct,
      targetAmount: totalOriginal * pct / 100,
      reached: totalPaid >= totalOriginal * pct / 100,
    }));

    // --- On-track status (only when goal exists and there are active debts) ---
    let onTrack = null;
    if (goal) {
      const activeDebts = debts.filter((d) => d.status === 'ACTIVE');
      if (activeDebts.length > 0) {
        const extraBudget = user?.extraBudget ?? 0;
        const strategy = goal.strategy || 'AVALANCHE';

        // Simulate repayment with current extra budget
        const sim = simulateRepayment(activeDebts, extraBudget, strategy);
        const today = new Date();
        const projectedPayoffDate = new Date(today);
        projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + sim.months);

        const targetDate = new Date(goal.targetDate);
        const diffDays = (targetDate - projectedPayoffDate) / (1000 * 60 * 60 * 24);

        let status;
        if (diffDays > 30) status = 'AHEAD';
        else if (diffDays >= -5) status = 'ON_TRACK';
        else status = 'BEHIND';

        // Estimate required extra budget if BEHIND (binary search)
        let requiredExtraBudget = null;
        if (status === 'BEHIND') {
          const targetMonths = Math.max(
            1,
            Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30.44)),
          );
          let lo = extraBudget;
          let hi = totalCurrent * 2;
          for (let i = 0; i < 40; i++) {
            const mid = (lo + hi) / 2;
            const s = simulateRepayment(activeDebts, mid, strategy);
            if (s.months <= targetMonths) hi = mid;
            else lo = mid;
          }
          requiredExtraBudget = Math.ceil(hi / 10000) * 10000; // round up to nearest 10K
        }

        onTrack = {
          status,
          projectedPayoffDate: projectedPayoffDate.toISOString(),
          projectedMonths: sim.months,
          extraBudgetUsed: extraBudget,
          requiredExtraBudget,
        };
      } else {
        // All debts paid
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

// ============================================================
// POST /api/debts/goal
// Create or update goal (upsert)
// ============================================================
export async function upsertDebtGoal(req, res) {
  const { targetDate, strategy } = req.body;

  // Validation
  if (!targetDate) return error(res, 'Vui lòng chọn ngày mục tiêu.', 400);
  const date = new Date(targetDate);
  if (isNaN(date.getTime())) return error(res, 'Ngày mục tiêu không hợp lệ.', 400);
  if (date <= new Date()) return error(res, 'Ngày mục tiêu phải là ngày trong tương lai.', 400);

  const validStrategies = ['AVALANCHE', 'SNOWBALL'];
  const strat = strategy && validStrategies.includes(strategy) ? strategy : 'AVALANCHE';

  try {
    const goal = await prisma.debtGoal.upsert({
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

// ============================================================
// DELETE /api/debts/goal
// Remove user's goal
// ============================================================
export async function deleteDebtGoal(req, res) {
  try {
    const existing = await prisma.debtGoal.findUnique({ where: { userId: req.userId } });
    if (!existing) return error(res, 'Không tìm thấy mục tiêu.', 404);

    await prisma.debtGoal.delete({ where: { userId: req.userId } });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Đã xóa mục tiêu trả nợ.' });
  } catch (err) {
    console.error('deleteDebtGoal error:', err);
    return error(res, 'Internal server error');
  }
}
