import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { invalidateCache } from '../middleware/cache.middleware.js';
import {
  calcAPY, calcEAR, simulateRepayment,
  calcDebtToIncomeRatio, detectDominoRisk,
} from '../utils/calculations.js';

export async function getAllDebts(req, res) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const debts = await prisma.debt.findMany({
      where: { userId: req.userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    const debtsWithCalc = debts.map(debt => {
      const apy = calcAPY(debt.apr);
      const ear = calcEAR(debt.apr, debt.feeProcessing, debt.feeInsurance, debt.feeManagement, debt.termMonths);
      return { ...debt, apy, ear };
    });

    const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
    const weightedEAR = totalBalance > 0
      ? debts.reduce((sum, d) => sum + (d.balance / totalBalance) * calcEAR(d.apr, d.feeProcessing, d.feeInsurance, d.feeManagement, d.termMonths), 0)
      : 0;

    const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, user.monthlyIncome);
    const dominoAlerts = detectDominoRisk(debts, user.monthlyIncome);

    const today = new Date();
    const dueThisWeek = debts.filter(d => {
      const daysUntil = d.dueDay >= today.getDate()
        ? d.dueDay - today.getDate()
        : 30 - today.getDate() + d.dueDay;
      return daysUntil <= 7;
    });

    return success(res, {
      debts: debtsWithCalc,
      summary: {
        totalBalance,
        totalMinPayment,
        averageEAR: weightedEAR,
        debtToIncomeRatio: dtiRatio,
        dominoAlerts,
        dueThisWeek: dueThisWeek.map(d => ({ id: d.id, name: d.name, dueDay: d.dueDay, minPayment: d.minPayment })),
      },
    });
  } catch (err) {
    console.error('getAllDebts error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createDebt(req, res) {
  try {
    const debt = await prisma.debt.create({
      data: { userId: req.userId, ...req.body },
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

    return success(res, { debt: { ...debt, apy, ear }, earBreakdown, paymentHistory: debt.payments });
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
    await prisma.debt.deleteMany({ where: { id: req.params.id, userId: req.userId } });
    await invalidateCache([`user:${req.userId}:*`]);
    return success(res, { message: 'Debt deleted' });
  } catch (err) {
    console.error('deleteDebt error:', err);
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
