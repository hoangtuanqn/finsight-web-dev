import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { invalidateCache } from '../middleware/cache.middleware.js';
import emailService from '../services/email.service.js';
import {
  calcAPY, calcEAR, simulateRepayment,
  calcDebtToIncomeRatio, detectDominoRisk,
} from '../utils/calculations.js';

export async function getAllDebts(req, res) {
  try {
    const { platform, amountRange, dueInDays, status } = req.query;

    const filterStatus = status || 'ACTIVE'; // 'ACTIVE' | 'PAID' | 'TRASH'

    let whereClause = { userId: req.userId };
    let includeDeleted = false;

    if (filterStatus === 'TRASH') {
      whereClause.deletedAt = { not: null };
      includeDeleted = true;
    } else {
      whereClause.status = filterStatus;
    }

    if (platform) {
      whereClause.platform = platform;
    }

    if (amountRange) {
      if (amountRange === '<10000000') whereClause.balance = { lt: 10000000 };
      else if (amountRange === '10000000-50000000') whereClause.balance = { gte: 10000000, lte: 50000000 };
      else if (amountRange === '>50000000') whereClause.balance = { gt: 50000000 };
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    let debts = await prisma.debt.findMany({
      where: whereClause,
      includeDeleted,
      orderBy: { createdAt: 'desc' },
    });

    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let debtsWithCalc = debts.map(debt => {
      const apy = calcAPY(debt.apr);
      const ear = calcEAR(debt.apr, debt.feeProcessing, debt.feeInsurance, debt.feeManagement, debt.termMonths);
      const daysUntil = debt.dueDay >= currentDay
        ? debt.dueDay - currentDay
        : daysInMonth - currentDay + debt.dueDay;
      return { ...debt, apy, ear, daysUntil };
    });

    if (dueInDays) {
      debtsWithCalc = debtsWithCalc.filter(d => d.daysUntil <= Number(dueInDays));
    }

    const totalBalance = debtsWithCalc.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debtsWithCalc.reduce((sum, d) => sum + d.minPayment, 0);
    const weightedEAR = totalBalance > 0
      ? debtsWithCalc.reduce((sum, d) => sum + (d.balance / totalBalance) * d.ear, 0)
      : 0;

    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, user.monthlyIncome);
    const dominoAlerts = detectDominoRisk(debtsWithCalc, user.monthlyIncome);

    const upcomingDebts = debtsWithCalc
      .filter(d => d.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return success(res, {
      debts: debtsWithCalc,
      summary: {
        totalBalance,
        totalMinPayment,
        averageEAR: weightedEAR,
        debtToIncomeRatio: dtiRatio,
        dominoAlerts,
        dueThisWeek: upcomingDebts.map(d => ({
          id: d.id,
          name: d.name,
          dueDay: d.dueDay,
          minPayment: d.minPayment,
          daysUntil: d.daysUntil,
        })),
      },
    });
  } catch (err) {
    console.error('getAllDebts error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createDebt(req, res) {
  const { termMonths, startDate } = req.body;

  const start = new Date(startDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const remainingTerms = Math.max(0, termMonths - monthsPassed);

  try {
    const debt = await prisma.debt.create({
      data: {
        userId: req.userId,
        name: String(req.body.name).trim(),
        platform: req.body.platform ?? 'CUSTOM',
        originalAmount: +req.body.originalAmount,
        balance: +req.body.balance,
        apr: +req.body.apr,
        rateType: req.body.rateType ?? 'FLAT',
        feeProcessing: +req.body.feeProcessing || 0,
        feeInsurance: +req.body.feeInsurance || 0,
        feeManagement: +req.body.feeManagement || 0,
        feePenaltyPerDay: +req.body.feePenaltyPerDay || 0,
        minPayment: +req.body.minPayment,
        dueDay: Math.round(+req.body.dueDay),
        termMonths: Math.round(+req.body.termMonths),
        remainingTerms: Math.round(remainingTerms),
        startDate: new Date(startDate),
        notes: req.body.notes ?? null,
      },
    });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { debt }, 201);
  } catch (err) {
    console.error('createDebt error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getDebtById(req, res) {
  try {
    const debt = await prisma.debt.findFirst({
      where: { id: req.params.id, userId: req.userId },
      includeDeleted: true,
      include: { payments: { orderBy: { paidAt: 'desc' } } },
    });
    if (!debt) return error(res, 'Debt not found', 404);

    const apy = calcAPY(debt.apr);
    const ear = calcEAR(debt.apr, debt.feeProcessing, debt.feeInsurance, debt.feeManagement, debt.termMonths);
    const earBreakdown = {
      apr: debt.apr,
      compoundEffect: apy - debt.apr,
      processingFee: debt.termMonths > 0 ? (debt.feeProcessing / debt.termMonths) * 12 : 0,
      insuranceFee: debt.feeInsurance,
      managementFee: debt.feeManagement,
      totalEAR: ear,
    };

    const monthlyDataMap = {};
    debt.payments.forEach(p => {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = { month: key, paidAmount: 0 };
      }
      monthlyDataMap[key].paidAmount += p.amount;
    });

    const chartData = Object.keys(monthlyDataMap)
      .sort()
      .map(key => ({
        date: `${key}-01`,
        paidAmount: monthlyDataMap[key].paidAmount,
        label: `Thanh toán tháng ${key.split('-')[1]}`
      }));

    return success(res, { 
      debt: { ...debt, apy, ear }, 
      earBreakdown, 
      paymentHistory: debt.payments,
      chartData 
    });
  } catch (err) {
    console.error('getDebtById error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateDebt(req, res) {
  try {
    const debt = await prisma.debt.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: req.body,
    });
    if (debt.count === 0) return error(res, 'Debt not found', 404);
    const updated = await prisma.debt.findUnique({ where: { id: req.params.id } });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { debt: updated });
  } catch (err) {
    console.error('updateDebt error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteDebt(req, res) {
  try {
    const { reason, isCommitted } = req.body || {};

    // Use includeDeleted: true in case they are trying to delete something already deleted (though it shouldn't happen)
    const debt = await prisma.debt.findFirst({
      where: { id: req.params.id, userId: req.userId },
      includeDeleted: true
    });

    if (!debt) return error(res, 'Debt not found', 404);
    if (debt.deletedAt) return error(res, 'Khoản nợ này đã nằm trong thùng rác', 400);

    let scheduledPurgeAt = new Date();
    scheduledPurgeAt.setDate(scheduledPurgeAt.getDate() + 30);

    if (debt.balance > 0) {
      if (!reason || !isCommitted) {
        return error(res, 'Yêu cầu nhập lý do và cam kết rủi ro.', 400);
      }

      await prisma.debt.update({
        where: { id: debt.id },
        data: {
          deletedAt: new Date(),
          scheduledPurgeAt,
          deleteReason: reason,
          deleteCommitment: true
        }
      });
    } else {
      await prisma.debt.update({
        where: { id: debt.id },
        data: {
          deletedAt: new Date(),
          scheduledPurgeAt,
          deleteReason: 'CLEAN_UP_SETTLED_DEBT',
          deleteCommitment: false
        }
      });
    }

    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Khoản nợ đã được chuyển vào thùng rác.' });
  } catch (err) {
    console.error('deleteDebt error:', err);
    return error(res, 'Internal server error');
  }
}

export async function restoreDebt(req, res) {
  try {
    const debt = await prisma.debt.findFirst({
      where: { id: req.params.id, userId: req.userId },
      includeDeleted: true
    });

    if (!debt) return error(res, 'Debt not found', 404);
    if (!debt.deletedAt) return error(res, 'Khoản nợ này không nằm trong thùng rác', 400);

    await prisma.debt.update({
      where: { id: debt.id },
      data: {
        deletedAt: null,
        scheduledPurgeAt: null,
        deleteReason: null,
        deleteCommitment: false
      }
    });

    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Đã khôi phục khoản nợ thành công.' });
  } catch (err) {
    console.error('restoreDebt error:', err);
    return error(res, 'Internal server error');
  }
}


export async function logPayment(req, res) {
  try {
    const { amount, notes } = req.body;
    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId: req.userId } });
    if (!debt) return error(res, 'Debt not found', 404);

    const payment = await prisma.payment.create({
      data: { debtId: debt.id, amount, notes },
    });

    const newBalance = Math.max(0, debt.balance - amount);
    const newRemaining = newBalance <= 0 ? 0 : debt.remainingTerms;
    const updatedDebt = await prisma.debt.update({
      where: { id: debt.id },
      data: {
        balance: newBalance,
        remainingTerms: newRemaining,
        status: newBalance <= 0 ? 'PAID' : debt.status,
      },
    });

    await invalidateCache([`user:${req.userId}:*`]);

    // ── Milestone check ────────────────────────────────────
    try {
      const allDebts = await prisma.debt.findMany({ where: { userId: req.userId } });
      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true, fullName: true } });

      const totalOriginal = allDebts.reduce((s, d) => s + d.originalAmount, 0);
      if (totalOriginal > 0 && user?.email) {
        // Tính totalPaid trước và sau thanh toán vừa rồi
        const totalCurrentAfter = allDebts.reduce((s, d) => s + (d.id === debt.id ? updatedDebt.balance : d.balance), 0);
        const totalCurrentBefore = totalCurrentAfter + amount; // hoàn ngược lại
        const paidBefore = totalOriginal - totalCurrentBefore;
        const paidAfter = totalOriginal - totalCurrentAfter;

        const MILESTONES = [25, 50, 75, 100];
        for (const pct of MILESTONES) {
          const threshold = totalOriginal * pct / 100;
          // Milestone vừa được vượt qua trong lần thanh toán này
          if (paidBefore < threshold && paidAfter >= threshold) {
            // Tạo notification trong DB
            await prisma.notification.create({
              data: {
                userId: req.userId,
                type: 'MILESTONE',
                title: `🎉 Đạt cột mốc ${pct}% tổng nợ!`,
                message: `Bạn đã trả được ${pct}% tổng số nợ gốc (${new Intl.NumberFormat('vi-VN').format(Math.round(paidAfter))}đ / ${new Intl.NumberFormat('vi-VN').format(Math.round(totalOriginal))}đ). Tuyệt vời!`,
                severity: pct === 100 ? 'INFO' : 'INFO',
              },
            });

            // Gửi email chúc mừng
            await emailService.sendMilestoneCongrats(
              user.email,
              user.fullName,
              pct,
              paidAfter,
              totalOriginal,
            );

            console.log(`[Milestone] User ${req.userId} đạt ${pct}% — email gửi tới ${user.email}`);
            break; // Chỉ gửi 1 milestone trong 1 lần thanh toán
          }
        }
      }
    } catch (milestoneErr) {
      // Không để lỗi milestone làm hỏng response chính
      console.error('Milestone check error:', milestoneErr);
    }
    // ──────────────────────────────────────────────────────

    return success(res, { payment, updatedDebt });
  } catch (err) {
    console.error('logPayment error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getRepaymentPlan(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const debts = await prisma.debt.findMany({ where: { userId: req.userId, status: 'ACTIVE' } });

    if (debts.length === 0) {
      return success(res, { avalanche: null, snowball: null, comparison: null, recommendation: 'Bạn không có khoản nợ nào.' });
    }

    const extraBudget = parseFloat(req.query.extraBudget) || user.extraBudget || 0;
    const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const totalBudget = totalMin + extraBudget;

    const avalanche = simulateRepayment(debts, totalBudget, 'AVALANCHE');
    const snowball = simulateRepayment(debts, totalBudget, 'SNOWBALL');

    const savedInterest = snowball.totalInterest - avalanche.totalInterest;
    const savedMonths = snowball.months - avalanche.months;

    let recommendation = '';
    if (savedInterest > 100000) {
      recommendation = `Phương pháp Avalanche giúp bạn tiết kiệm ${savedInterest.toLocaleString('vi-VN')}đ tiền lãi. Khuyến nghị sử dụng Avalanche.`;
    } else {
      recommendation = 'Hai phương pháp cho kết quả tương đương. Chọn Snowball nếu bạn muốn động lực tâm lý từ việc xoá nợ nhỏ trước.';
    }

    return success(res, {
      avalanche: { months: avalanche.months, totalInterest: avalanche.totalInterest, schedule: avalanche.schedule.slice(0, 24) },
      snowball: { months: snowball.months, totalInterest: snowball.totalInterest, schedule: snowball.schedule.slice(0, 24) },
      comparison: { savedInterest, savedMonths },
      recommendation,
    });
  } catch (err) {
    console.error('getRepaymentPlan error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getDtiAnalysis(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const debts = await prisma.debt.findMany({ where: { userId: req.userId, status: 'ACTIVE' } });

    const monthlyIncome = user.monthlyIncome || 0;
    const totalMinPayment = debts.reduce((s, d) => s + d.minPayment, 0);
    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, monthlyIncome);

    const zone =
      dtiRatio > 50 ? 'CRITICAL' :
        dtiRatio > 35 ? 'WARNING' :
          dtiRatio > 20 ? 'CAUTION' : 'SAFE';

    const breakdown = debts.map(d => ({
      id: d.id,
      name: d.name,
      platform: d.platform,
      balance: d.balance,
      minPayment: d.minPayment,
      dtiContribution: parseFloat(
        monthlyIncome > 0 ? ((d.minPayment / monthlyIncome) * 100).toFixed(2) : 0
      ),
    })).sort((a, b) => b.dtiContribution - a.dtiContribution);

    const safeMaxPayment = monthlyIncome * 0.20;
    const whatIf = {
      targetDti: 20,
      incomeNeededForSafe: totalMinPayment > 0 ? parseFloat((totalMinPayment / 0.20).toFixed(0)) : 0,
      paymentReductionNeeded: parseFloat(Math.max(0, totalMinPayment - safeMaxPayment).toFixed(0)),
    };

    return success(res, {
      summary: {
        dtiRatio: parseFloat(dtiRatio.toFixed(2)),
        zone,
        monthlyIncome,
        totalMinPayment,
        remainingCashflow: monthlyIncome - totalMinPayment,
      },
      breakdown,
      whatIf,
    });
  } catch (err) {
    console.error('getDtiAnalysis error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getEarAnalysis(req, res) {
  try {
    const debts = await prisma.debt.findMany({ where: { userId: req.userId, status: 'ACTIVE' } });

    const analysis = debts.map(d => {
      const apy = calcAPY(d.apr);
      const ear = calcEAR(d.apr, d.feeProcessing, d.feeInsurance, d.feeManagement, d.termMonths);
      return {
        id: d.id,
        name: d.name,
        platform: d.platform,
        balance: d.balance,
        apr: d.apr,
        apy,
        ear,
        earBreakdown: {
          apr: d.apr,
          compoundEffect: apy - d.apr,
          processingFee: d.termMonths > 0 ? (d.feeProcessing / d.termMonths) * 12 : 0,
          insuranceFee: d.feeInsurance,
          managementFee: d.feeManagement,
          totalEAR: ear,
        },
      };
    });

    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const averageAPR = debts.length > 0 ? debts.reduce((sum, d) => sum + d.apr, 0) / debts.length : 0;
    const averageEAR = totalBalance > 0
      ? analysis.reduce((sum, d) => sum + (d.balance / totalBalance) * d.ear, 0)
      : 0;
    const totalHiddenCost = averageEAR - averageAPR;

    return success(res, {
      debts: analysis,
      summary: { averageAPR, averageEAR, totalHiddenCost },
    });
  } catch (err) {
    console.error('getEarAnalysis error:', err);
    return error(res, 'Internal server error');
  }
}
