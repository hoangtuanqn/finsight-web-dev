import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';

const PLAN_PRICES = {
  PRO: 49000,
  PROMAX: 99000,
};

const BANK_NAME = process.env.SEPAY_BANK_NAME || 'MBBank';
const BANK_ACCOUNT = process.env.SEPAY_BANK_ACCOUNT || '259876543210';
const INVOICE_EXPIRY_HOURS = 24;

function generateQrUrl(plan, amount, transferCode) {
  const encodedDes = encodeURIComponent(transferCode);
  return `https://qr.sepay.vn/img?bank=${BANK_NAME}&acc=${BANK_ACCOUNT}&template=compact&amount=${amount}&des=${encodedDes}`;
}

export async function getMyPlan(req, res) {
  try {
    const user = await prisma.user.findUnique({
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

export async function createInvoice(req, res) {
  try {
    const { plan } = req.body;
    if (!plan || !PLAN_PRICES[plan]) {
      return error(res, 'Invalid plan. Must be PRO or PROMAX', 400);
    }

    // Check for existing PENDING invoice (not expired)
    const existing = await prisma.transaction.findFirst({
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
    // Generate a unique transfer code. SePay regex will capture the first part as userId.
    // We add a random suffix to avoid unique constraint if user creates multiple invoices.
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const transferCode = `UPGRADE ${plan} ${req.userId} ${suffix}`;
    const qrUrl = generateQrUrl(plan, amount, transferCode);
    const expiresAt = new Date(Date.now() + INVOICE_EXPIRY_HOURS * 60 * 60 * 1000);

    const transaction = await prisma.transaction.create({
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
  } catch (err) {
    // Handle unique constraint on transferCode (race condition)
    if (err.code === 'P2002') {
      const existing = await prisma.transaction.findFirst({
        where: { userId: req.userId, plan: req.body.plan, status: 'PENDING' },
      });
      if (existing) return success(res, { transaction: existing });
    }
    console.error('createInvoice error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getInvoice(req, res) {
  try {
    const transaction = await prisma.transaction.findUnique({
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

export async function getTransactions(req, res) {
  try {
    const transactions = await prisma.transaction.findMany({
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

export async function cancelInvoice(req, res) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
    });

    if (!transaction) return error(res, 'Invoice not found', 404);
    if (transaction.userId !== req.userId) return error(res, 'Forbidden', 403);
    if (transaction.status !== 'PENDING') {
      return error(res, 'Only PENDING invoices can be cancelled', 400);
    }

    const updated = await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });

    return success(res, { transaction: updated });
  } catch (err) {
    console.error('cancelInvoice error:', err);
    return error(res, 'Internal server error');
  }
}
