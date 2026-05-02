import { Response } from 'express';
import prisma from '../lib/prisma';
import { invalidateCache } from '../middleware/cache.middleware';
import emailService from '../services/email.service';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';
import {
  calcAPY,
  calcDebtToIncomeRatio,
  calcEAR,
  detectDominoRisk,
  resolveRepaymentExtraBudget,
  simulateRepaymentWithExtraBudget,
} from '../utils/calculations';

const MAX_REPAYMENT_SCHEDULE_POINTS = 361;

export async function getAllDebts(req: AuthenticatedRequest, res: Response) {
  try {
    const { platform, amountRange, dueInDays, status } = req.query;

    const filterStatus = (status as string) || 'ACTIVE'; // 'ACTIVE' | 'PAID' | 'TRASH'

    let whereClause: any = { userId: req.userId };
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

    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });
    let debts = await (prisma as any).debt.findMany({
      where: whereClause,
      includeDeleted,
      orderBy: { createdAt: 'desc' },
    });

    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let debtsWithCalc = debts.map((debt: any) => {
      const apy = calcAPY(debt.apr);
      const ear = calcEAR(debt.apr, debt.feeProcessing, debt.feeInsurance, debt.feeManagement, debt.termMonths);
      const daysUntil = debt.dueDay >= currentDay ? debt.dueDay - currentDay : daysInMonth - currentDay + debt.dueDay;
      return { ...debt, apy, ear, daysUntil };
    });

    if (dueInDays) {
      debtsWithCalc = debtsWithCalc.filter((d: any) => d.daysUntil <= Number(dueInDays));
    }

    const totalBalance = debtsWithCalc.reduce((sum: number, d: any) => sum + d.balance, 0);
    const totalMinPayment = debtsWithCalc.reduce((sum: number, d: any) => sum + d.minPayment, 0);
    const weightedEAR =
      totalBalance > 0 ? debtsWithCalc.reduce((sum: number, d: any) => sum + (d.balance / totalBalance) * d.ear, 0) : 0;

    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, user.monthlyIncome);
    const dominoAlerts = detectDominoRisk(debtsWithCalc, user.monthlyIncome);

    const upcomingDebts = debtsWithCalc
      .filter((d: any) => d.daysUntil <= 30)
      .sort((a: any, b: any) => a.daysUntil - b.daysUntil);

    return success(res, {
      debts: debtsWithCalc,
      summary: {
        totalBalance,
        totalMinPayment,
        averageEAR: weightedEAR,
        debtToIncomeRatio: dtiRatio,
        dominoAlerts,
        dueThisWeek: upcomingDebts.map((d: any) => ({
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

export async function createDebt(req: AuthenticatedRequest, res: Response) {
  const { termMonths, startDate, debtType } = req.body;
  const isCreditCard = debtType === 'CREDIT_CARD';

  if (!isCreditCard && (!termMonths || termMonths <= 0)) {
    return error(res, 'Kỳ hạn phải lớn hơn 0 đối với Vay trả góp.', 400);
  }

  if (req.body.minPayment === 0 && req.body.balance > 0) {
    return error(res, 'Khoản trả tối thiểu phải lớn hơn 0 khi có dư nợ.', 400);
  }

  const start = new Date(startDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const remainingTerms = isCreditCard ? 0 : Math.max(0, termMonths - monthsPassed);

  try {
    const debt = await (prisma as any).debt.create({
      data: {
        userId: req.userId,
        name: String(req.body.name).trim(),
        platform: req.body.platform ?? 'CUSTOM',
        debtType: debtType ?? 'INSTALLMENT',
        originalAmount: +req.body.originalAmount,
        balance: +req.body.balance,
        apr: +req.body.apr,
        rateType: isCreditCard ? 'REDUCING' : (req.body.rateType ?? 'FLAT'),
        feeProcessing: +req.body.feeProcessing || 0,
        feeInsurance: +req.body.feeInsurance || 0,
        feeManagement: +req.body.feeManagement || 0,
        feePenaltyPerDay: +req.body.feePenaltyPerDay || 0,
        minPayment: +req.body.minPayment,
        dueDay: Math.round(+req.body.dueDay),
        termMonths: isCreditCard ? 0 : Math.round(+req.body.termMonths),
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

export async function getDebtById(req: AuthenticatedRequest, res: Response) {
  try {
    const debt = await (prisma as any).debt.findFirst({
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

    const monthlyDataMap: Record<string, any> = {};
    debt.payments.forEach((p: any) => {
      const d = new Date(p.paidAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyDataMap[key]) {
        monthlyDataMap[key] = { month: key, paidAmount: 0 };
      }
      monthlyDataMap[key].paidAmount += p.amount;
    });

    const chartData = Object.keys(monthlyDataMap)
      .sort()
      .map((key) => ({
        date: `${key}-01`,
        paidAmount: monthlyDataMap[key].paidAmount,
        label: `Thanh toán tháng ${key.split('-')[1]}`,
      }));

    return success(res, {
      debt: { ...debt, apy, ear },
      earBreakdown,
      paymentHistory: debt.payments,
      chartData,
    });
  } catch (err) {
    console.error('getDebtById error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateDebt(req: AuthenticatedRequest, res: Response) {
  try {
    const allowedFields = [
      'name',
      'platform',
      'debtType',
      'originalAmount',
      'balance',
      'apr',
      'rateType',
      'feeProcessing',
      'feeInsurance',
      'feeManagement',
      'feePenaltyPerDay',
      'minPayment',
      'dueDay',
      'termMonths',
      'remainingTerms',
      'startDate',
      'notes',
      'status',
    ];

    const dataToUpdate: any = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        dataToUpdate[field] = req.body[field];
      }
    }

    if (dataToUpdate.startDate) {
      dataToUpdate.startDate = new Date(dataToUpdate.startDate);
    }

    const existing = await (prisma as any).debt.findUnique({ where: { id: req.params.id } });
    if (!existing) return error(res, 'Debt not found', 404);

    const currentDebtType = dataToUpdate.debtType || existing.debtType;
    if (currentDebtType === 'CREDIT_CARD') {
      dataToUpdate.termMonths = 0;
      dataToUpdate.remainingTerms = 0;
      dataToUpdate.rateType = 'REDUCING';
    }

    const debt = await (prisma as any).debt.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: dataToUpdate,
    });
    if (debt.count === 0) return error(res, 'Debt not found or unauthorized', 404);
    const updated = await (prisma as any).debt.findUnique({
      where: { id: req.params.id },
    });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { debt: updated });
  } catch (err) {
    console.error('updateDebt error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteDebt(req: AuthenticatedRequest, res: Response) {
  try {
    const { reason, isCommitted } = req.body || {};

    const debt = await (prisma as any).debt.findFirst({
      where: { id: req.params.id, userId: req.userId },
      includeDeleted: true,
    });

    if (!debt) return error(res, 'Debt not found', 404);
    if (debt.deletedAt) return error(res, 'Khoản nợ này đã nằm trong thùng rác', 400);

    let scheduledPurgeAt = new Date();
    scheduledPurgeAt.setDate(scheduledPurgeAt.getDate() + 30);

    if (debt.balance > 0) {
      if (!reason || !isCommitted) {
        return error(res, 'Yêu cầu nhập lý do và cam kết rủi ro.', 400);
      }

      await (prisma as any).debt.update({
        where: { id: debt.id },
        data: {
          deletedAt: new Date(),
          scheduledPurgeAt,
          deleteReason: reason,
          deleteCommitment: true,
        },
      });
    } else {
      await (prisma as any).debt.update({
        where: { id: debt.id },
        data: {
          deletedAt: new Date(),
          scheduledPurgeAt,
          deleteReason: 'CLEAN_UP_SETTLED_DEBT',
          deleteCommitment: false,
        },
      });
    }

    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Khoản nợ đã được chuyển vào thùng rác.' });
  } catch (err) {
    console.error('deleteDebt error:', err);
    return error(res, 'Internal server error');
  }
}

export async function restoreDebt(req: AuthenticatedRequest, res: Response) {
  try {
    const debt = await (prisma as any).debt.findFirst({
      where: { id: req.params.id, userId: req.userId },
      includeDeleted: true,
    });

    if (!debt) return error(res, 'Debt not found', 404);
    if (!debt.deletedAt) return error(res, 'Khoản nợ này không nằm trong thùng rác', 400);

    await (prisma as any).debt.update({
      where: { id: debt.id },
      data: {
        deletedAt: null,
        scheduledPurgeAt: null,
        deleteReason: null,
        deleteCommitment: false,
      },
    });

    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Đã khôi phục khoản nợ thành công.' });
  } catch (err) {
    console.error('restoreDebt error:', err);
    return error(res, 'Internal server error');
  }
}

export async function logPayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { amount, notes } = req.body;
    const debt = await (prisma as any).debt.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!debt) return error(res, 'Debt not found', 404);

    const payment = await (prisma as any).payment.create({
      data: { debtId: debt.id, amount, notes },
    });

    // Payment Priority Logic:
    // 1. Pay off accruedPenalty first
    // 2. The rest pays off the principal/interest (which are lumped in balance)
    const penaltyPayment = Math.min(amount, debt.accruedPenalty || 0);
    const newAccruedPenalty = Math.max(0, (debt.accruedPenalty || 0) - penaltyPayment);

    const newBalance = Math.max(0, debt.balance - amount);

    // Decrement remainingTerms by 1 if payment covers at least one full installment
    let newRemaining = debt.remainingTerms;
    if (newBalance <= 0) {
      newRemaining = 0; // Fully paid off
    } else if (debt.debtType === 'INSTALLMENT' && amount >= debt.minPayment && debt.remainingTerms > 0) {
      newRemaining = debt.remainingTerms - 1; // One term paid
    }

    const updatedDebt = await (prisma as any).debt.update({
      where: { id: debt.id },
      data: {
        balance: newBalance,
        accruedPenalty: newAccruedPenalty,
        remainingTerms: newRemaining,
        status: newBalance <= 0 ? 'PAID' : debt.status,
      },
    });

    await invalidateCache([`user:${req.userId}:*`]);

    try {
      const allDebts = await (prisma as any).debt.findMany({
        where: { userId: req.userId },
      });
      const user = await (prisma as any).user.findUnique({
        where: { id: req.userId },
        select: { email: true, fullName: true },
      });

      const totalOriginal = allDebts.reduce((s: number, d: any) => s + d.originalAmount, 0);
      if (totalOriginal > 0 && user?.email) {
        const totalCurrentAfter = allDebts.reduce(
          (s: number, d: any) => s + (d.id === debt.id ? updatedDebt.balance : d.balance),
          0,
        );
        const totalCurrentBefore = totalCurrentAfter + amount;
        const paidBefore = totalOriginal - totalCurrentBefore;
        const paidAfter = totalOriginal - totalCurrentAfter;

        const MILESTONES = [25, 50, 75, 100];
        for (const pct of MILESTONES) {
          const threshold = (totalOriginal * pct) / 100;
          if (paidBefore < threshold && paidAfter >= threshold) {
            await (prisma as any).notification.create({
              data: {
                userId: req.userId,
                type: 'MILESTONE',
                title: `🎉 Đạt cột mốc ${pct}% tổng nợ!`,
                message: `Bạn đã trả được ${pct}% tổng số nợ gốc (${new Intl.NumberFormat('vi-VN').format(Math.round(paidAfter))}đ / ${new Intl.NumberFormat('vi-VN').format(Math.round(totalOriginal))}đ). Tuyệt vời!`,
                severity: 'INFO',
              },
            });

            await emailService.sendMilestoneCongrats(user.email, user.fullName, pct, paidAfter, totalOriginal);

            console.log(`[Milestone] User ${req.userId} đạt ${pct}% — email gửi tới ${user.email}`);
            break;
          }
        }
      }
    } catch (milestoneErr) {
      console.error('Milestone check error:', milestoneErr);
    }

    return success(res, { payment, updatedDebt });
  } catch (err) {
    console.error('logPayment error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getRepaymentPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });
    const debts = await (prisma as any).debt.findMany({
      where: { userId: req.userId, status: 'ACTIVE' },
    });

    if (debts.length === 0) {
      return success(res, {
        avalanche: null,
        snowball: null,
        comparison: null,
        recommendation: 'Bạn không có khoản nợ nào.',
      });
    }

    const extraBudget = resolveRepaymentExtraBudget(req.query.extraBudget, user?.extraBudget);
    const monthlyIncome = user?.monthlyIncome || 0;
    const simulationOptions = { monthlyIncome, stopOnTermBreach: true };
    const avalanche = simulateRepaymentWithExtraBudget(debts, extraBudget, 'AVALANCHE', simulationOptions);
    const snowball = simulateRepaymentWithExtraBudget(debts, extraBudget, 'SNOWBALL', simulationOptions);

    const savedInterest = snowball.totalInterest - avalanche.totalInterest;
    const savedMonths = snowball.months - avalanche.months;

    let recommendation = '';
    if (savedInterest > 100000) {
      recommendation = `Phương pháp Avalanche giúp bạn tiết kiệm ${savedInterest.toLocaleString('vi-VN')}đ tiền lãi. Khuyến nghị sử dụng Avalanche.`;
    } else {
      recommendation =
        'Hai phương pháp cho kết quả tương đương. Chọn Snowball nếu bạn muốn động lực tâm lý từ việc xoá nợ nhỏ trước.';
    }

    const formatSimulation = (simulation: typeof avalanche | null) => {
      if (!simulation) return null;

      return {
        months: simulation.months,
        initialBalance: simulation.initialBalance,
        minimumBudget: simulation.minimumBudget,
        extraBudgetUsed: simulation.extraBudgetUsed,
        totalMonthlyBudget: simulation.totalMonthlyBudget,
        totalInterest: simulation.totalInterest,
        isCompleted: simulation.isCompleted,
        termBreach: simulation.termBreach,
        warnings: simulation.warnings,
        isScheduleTruncated: simulation.schedule.length > MAX_REPAYMENT_SCHEDULE_POINTS,
        schedule: simulation.schedule.slice(0, MAX_REPAYMENT_SCHEDULE_POINTS),
      };
    };

    return success(res, {
      monthlyIncome,
      extraBudget,
      minimumBudget: avalanche.minimumBudget,
      totalMonthlyBudget: avalanche.totalMonthlyBudget,
      avalanche: formatSimulation(avalanche),
      snowball: formatSimulation(snowball),
      comparison: { savedInterest, savedMonths },
      recommendation,
    });
  } catch (err) {
    console.error('getRepaymentPlan error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getDtiAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });
    const debts = await (prisma as any).debt.findMany({
      where: { userId: req.userId, status: 'ACTIVE' },
    });

    const monthlyIncome = user.monthlyIncome || 0;
    const totalMinPayment = debts.reduce((s: number, d: any) => s + d.minPayment, 0);
    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, monthlyIncome);

    const zone = dtiRatio > 50 ? 'CRITICAL' : dtiRatio > 35 ? 'WARNING' : dtiRatio > 20 ? 'CAUTION' : 'SAFE';

    const breakdown = debts
      .map((d: any) => ({
        id: d.id,
        name: d.name,
        platform: d.platform,
        balance: d.balance,
        minPayment: d.minPayment,
        dtiContribution: parseFloat(monthlyIncome > 0 ? ((d.minPayment / monthlyIncome) * 100).toFixed(2) : '0'),
      }))
      .sort((a: any, b: any) => b.dtiContribution - a.dtiContribution);

    const safeMaxPayment = monthlyIncome * 0.2;
    const whatIf = {
      targetDti: 20,
      incomeNeededForSafe: totalMinPayment > 0 ? parseFloat((totalMinPayment / 0.2).toFixed(0)) : 0,
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

export async function getEarAnalysis(req: AuthenticatedRequest, res: Response) {
  try {
    const debts = await (prisma as any).debt.findMany({
      where: { userId: req.userId, status: 'ACTIVE' },
    });

    const analysis = debts.map((d: any) => {
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

    const totalBalance = debts.reduce((sum: number, d: any) => sum + d.balance, 0);
    const averageAPR = debts.length > 0 ? debts.reduce((sum: number, d: any) => sum + d.apr, 0) / debts.length : 0;
    const averageEAR =
      totalBalance > 0 ? analysis.reduce((sum: number, d: any) => sum + (d.balance / totalBalance) * d.ear, 0) : 0;
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
