import { Request, Response } from 'express';
import { checkSepayPayments } from '../cron/jobs/payment.job';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

const PLAN_PRICES: Record<string, number> = {
  PRO: 49000,
  PROMAX: 99000,
};

const BANK_NAME = process.env.SEPAY_BANK_NAME || 'MBBank';
const BANK_ACCOUNT = process.env.SEPAY_BANK_ACCOUNT || '259876543210';
const INVOICE_EXPIRY_HOURS = 24;

const LEVEL_RANKS: Record<string, number> = {
  BASIC: 0,
  PRO: 1,
  PROMAX: 2,
};

function generateQrUrl(plan: string, amount: number, transferCode: string) {
  const encodedDes = encodeURIComponent(transferCode);
  return `https://qr.sepay.vn/img?bank=${BANK_NAME}&acc=${BANK_ACCOUNT}&template=compact&amount=${amount}&des=${encodedDes}`;
}

export async function getMyPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      select: { level: true, levelExpiresAt: true },
    });
    if (!user) return error(res, 'User not found', 404);

    return success(res, {
      level: user.level,
      levelExpiresAt: user.levelExpiresAt,
    });
  } catch (err) {
    console.error('getMyPlan error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
      return error(res, 'Invalid plan. Must be PRO or PROMAX', 400);
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      select: { level: true },
    });

    if (user && LEVEL_RANKS[plan] <= LEVEL_RANKS[user.level]) {
      return error(res, `Bạn đã ở cấp độ ${user.level} hoặc cao hơn.`, 400);
    }

    const existing = await (prisma as any).transaction.findFirst({
      where: {
        userId: req.userId,
        plan,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      return success(res, { transaction: existing });
    }

    const amount = PLAN_PRICES[plan];
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const transferCode = `UPGRADE ${plan} ${req.userId} ${suffix}`;
    const qrUrl = generateQrUrl(plan, amount, transferCode);
    const expiresAt = new Date(Date.now() + INVOICE_EXPIRY_HOURS * 60 * 60 * 1000);

    const transaction = await (prisma as any).transaction.create({
      data: {
        userId: req.userId,
        plan,
        amount,
        transferCode,
        qrUrl,
        expiresAt,
      },
    });

    return success(res, { transaction }, 201);
  } catch (err: any) {
    if (err.code === 'P2002') {
      const existing = await (prisma as any).transaction.findFirst({
        where: { userId: req.userId, plan: req.body.plan, status: 'PENDING' },
      });
      if (existing) return success(res, { transaction: existing });
    }
    console.error('createInvoice error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    const transaction = await (prisma as any).transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!transaction) return error(res, 'Invoice not found', 404);
    if (transaction.userId !== req.userId) return error(res, 'Forbidden', 403);

    return success(res, { transaction });
  } catch (err) {
    console.error('getInvoice error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getTransactions(req: AuthenticatedRequest, res: Response) {
  try {
    const transactions = await (prisma as any).transaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return success(res, { transactions });
  } catch (err) {
    console.error('getTransactions error:', err);
    return error(res, 'Internal server error');
  }
}

export async function cancelInvoice(req: AuthenticatedRequest, res: Response) {
  try {
    const transaction = await (prisma as any).transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!transaction) return error(res, 'Invoice not found', 404);
    if (transaction.userId !== req.userId) return error(res, 'Forbidden', 403);
    if (transaction.status !== 'PENDING') {
      return error(res, 'Only PENDING invoices can be cancelled', 400);
    }

    const updated = await (prisma as any).transaction.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    return success(res, { transaction: updated });
  } catch (err) {
    console.error('cancelInvoice error:', err);
    return error(res, 'Internal server error');
  }
}

export async function verifyMyPayment(req: Request, res: Response) {
  try {
    await checkSepayPayments();
    return success(res, { message: 'Hệ thống đang kiểm tra giao dịch của bạn. Vui lòng đợi trong giây lát.' });
  } catch (err) {
    console.error('verifyMyPayment error:', err);
    return error(res, 'Internal server error');
  }
}
