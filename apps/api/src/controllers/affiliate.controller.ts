import { Response } from 'express';
import { banks } from '../data/banks';
import prisma from '../lib/prisma';
import { checkBankOwner } from '../services/kyc.service';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

const MIN_WITHDRAWAL_AMOUNT = 50_000;

export async function getBanks(req: AuthenticatedRequest, res: Response) {
  try {
    return success(res, { banks });
  } catch (err) {
    console.error('[Affiliate] getBanks error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getAffiliateStats(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        commissionBalance: true,
        totalCommissionEarned: true,
      },
    });
    if (!user) return error(res, 'User not found', 404);

    const [totalReferrals, completedReferrals, clicks] = await Promise.all([
      (prisma as any).referral.count({ where: { referrerId: userId } }),
      (prisma as any).referral.count({ where: { referrerId: userId, status: 'REWARDED' } }),
      (prisma as any).referralClick.count({ where: { referrerId: userId } }),
    ]);

    const referrals = await (prisma as any).referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        referred: {
          select: { fullName: true, email: true, createdAt: true },
        },
      },
    });

    const pendingWithdrawalResult = await (prisma as any).withdrawalRequest.aggregate({
      where: { userId, status: 'PENDING' },
      _sum: { amount: true },
    });
    const pendingWithdrawalAmount = pendingWithdrawalResult._sum.amount || 0;

    return success(res, {
      referralCode: user.referralCode,
      commissionBalance: user.commissionBalance,
      totalCommissionEarned: user.totalCommissionEarned,
      pendingWithdrawalAmount,
      availableBalance: user.commissionBalance - pendingWithdrawalAmount,
      stats: {
        totalReferrals,
        completedReferrals,
        clicks,
      },
      referrals: referrals.map((r: any) => ({
        id: r.id,
        name: r.referred.fullName,
        email: r.referred.email,
        status: r.status,
        activeDays: r.activeDaysCount,
        hasToppedUp: r.hasToppedUp,
        joinedAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error('[Affiliate] getAffiliateStats error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getCommissionHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      (prisma as any).commissionLog.count({ where: { recipientId: userId } }),
      (prisma as any).commissionLog.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          recipient: {
            select: { fullName: true },
          },
        },
      }),
    ]);

    const payerIds = [...new Set(logs.map((l: any) => l.payerId))];
    const payers = await (prisma as any).user.findMany({
      where: { id: { in: payerIds } },
      select: { id: true, fullName: true, email: true },
    });
    const payerMap = new Map(payers.map((p: any) => [p.id, p]));

    const commissions = logs.map((log: any) => {
      const payer = payerMap.get(log.payerId) as any;
      return {
        id: log.id,
        commissionAmount: log.commissionAmount,
        originalAmount: log.originalAmount,
        commissionRate: log.commissionRate,
        commissionRatePercent: `${(log.commissionRate * 100).toFixed(0)}%`,
        plan: log.plan,
        status: log.status,
        createdAt: log.createdAt,
        payer: {
          name: payer?.fullName || 'Người dùng ẩn danh',
          email: payer?.email || '',
        },
      };
    });

    return success(res, {
      commissions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error('[Affiliate] getCommissionHistory error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getBankAccounts(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const accounts = await (prisma as any).bankAccount.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return success(res, { bankAccounts: accounts });
  } catch (err) {
    console.error('[Affiliate] getBankAccounts error:', err);
    return error(res, 'Internal server error');
  }
}

export async function addBankAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { bankCode, accountNumber, accountName } = req.body;

    if (!bankCode || !accountNumber || !accountName) {
      return error(res, 'Vui lòng điền đầy đủ thông tin', 400);
    }

    const bank = banks.find((b: any) => b.code === bankCode);
    if (!bank) {
      return error(res, `Ngân hàng không tồn tại`, 400);
    }

    const existing = await (prisma as any).bankAccount.findFirst({
      where: { userId, bankCode, accountNumber },
    });
    if (existing) {
      return error(res, 'Tài khoản ngân hàng này đã được thêm rồi', 400);
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { kycStatus: true, kycName: true },
    });

    if (user?.kycStatus !== 'VERIFIED' || !user?.kycName) {
      return error(res, 'Vui lòng xác minh danh tính (eKYC) trước khi thêm tài khoản ngân hàng', 403);
    }

    // Call BankLookup API
    try {
      const bankLookupRes = await checkBankOwner(bankCode, accountNumber);
      console.log('\n--- [BankLookup] API Response ---');
      console.dir(bankLookupRes, { depth: null });

      if (bankLookupRes.code !== 200 || !bankLookupRes.success) {
        if (
          bankLookupRes.code === 402 ||
          String(bankLookupRes.msg || bankLookupRes.message).includes('Out of Credit')
        ) {
          return error(
            res,
            'Dịch vụ xác thực ngân hàng đang tạm gián đoạn để bảo trì. Vui lòng liên hệ hỗ trợ hoặc thử lại sau.',
            503,
          );
        }
        return error(res, `Xác thực tài khoản thất bại (Code: ${bankLookupRes.code})`, 422);
      }

      const returnedOwnerName = bankLookupRes.data?.ownerName;
      if (!returnedOwnerName) {
        return error(res, 'Không tìm thấy thông tin chủ tài khoản ngân hàng này.', 422);
      }

      // So sánh tên sau khi loại bỏ dấu và đưa về chữ thường
      if (normalizeName(returnedOwnerName) !== normalizeName(user.kycName)) {
        return error(
          res,
          `Chủ tài khoản hiện tại là ${returnedOwnerName}. Yêu cầu dùng đúng STK có tên đã xác minh từ trước (${user.kycName}).`,
          422,
        );
      }
    } catch (apiErr: any) {
      console.error('[Affiliate] checkBankOwner error:', apiErr?.response?.data || apiErr.message);
      return error(res, 'Lỗi kết nối khi xác thực chủ tài khoản. Vui lòng thử lại sau', 502);
    }

    const existingCount = await (prisma as any).bankAccount.count({ where: { userId } });
    const isDefault = existingCount === 0;

    const account = await (prisma as any).bankAccount.create({
      data: {
        userId,
        bankCode: bank.code,
        bankName: bank.name,
        bankShortName: bank.shortName,
        bankLogo: bank.logo || null,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        isDefault,
      },
    });

    return success(res, { bankAccount: account }, 201);
  } catch (err) {
    console.error('[Affiliate] addBankAccount error:', err);
    return error(res, 'Internal server error');
  }
}

export async function setDefaultBankAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const account = await (prisma as any).bankAccount.findFirst({ where: { id, userId } });
    if (!account) return error(res, 'Không tìm thấy tài khoản ngân hàng', 404);

    await (prisma as any).$transaction([
      (prisma as any).bankAccount.updateMany({ where: { userId }, data: { isDefault: false } }),
      (prisma as any).bankAccount.update({ where: { id }, data: { isDefault: true } }),
    ]);

    return success(res, { message: 'Đã đặt làm tài khoản mặc định' });
  } catch (err) {
    console.error('[Affiliate] setDefaultBankAccount error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteBankAccount(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const account = await (prisma as any).bankAccount.findFirst({ where: { id, userId } });
    if (!account) return error(res, 'Không tìm thấy tài khoản ngân hàng', 404);

    const pendingWithdrawals = await (prisma as any).withdrawalRequest.count({
      where: { bankAccountId: id, status: 'PENDING' },
    });
    if (pendingWithdrawals > 0) {
      return error(res, 'Không thể xóa tài khoản đang có yêu cầu rút tiền chờ xử lý', 400);
    }

    await (prisma as any).bankAccount.delete({ where: { id } });
    return success(res, { message: 'Đã xóa tài khoản ngân hàng' });
  } catch (err) {
    console.error('[Affiliate] deleteBankAccount error:', err);
    return error(res, 'Internal server error');
  }
}

export async function requestWithdrawal(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { bankAccountId, amount } = req.body;

    if (!bankAccountId || !amount) {
      return error(res, 'Vui lòng cung cấp bankAccountId và amount', 400);
    }

    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAWAL_AMOUNT) {
      return error(res, `Số tiền rút tối thiểu là ${MIN_WITHDRAWAL_AMOUNT}đ`, 400);
    }

    const bankAccount = await (prisma as any).bankAccount.findFirst({
      where: { id: bankAccountId, userId },
    });
    if (!bankAccount) return error(res, 'Tài khoản ngân hàng không hợp lệ', 404);

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { commissionBalance: true },
    });

    const pendingResult = await (prisma as any).withdrawalRequest.aggregate({
      where: { userId, status: 'PENDING' },
      _sum: { amount: true },
    });
    const pendingAmount = pendingResult._sum.amount || 0;
    const availableBalance = (user?.commissionBalance || 0) - pendingAmount;

    if (withdrawAmount > availableBalance) {
      return error(res, `Số dư khả dụng không đủ`, 400);
    }

    const withdrawal = await (prisma as any).withdrawalRequest.create({
      data: {
        userId,
        bankAccountId,
        amount: withdrawAmount,
        status: 'PENDING',
      },
      include: {
        bankAccount: true,
      },
    });

    console.log(`[Affiliate] 📤 Rút ${withdrawAmount} user ${userId}`);

    return success(res, { withdrawal }, 201);
  } catch (err) {
    console.error('[Affiliate] requestWithdrawal error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getWithdrawalHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId!;

    const withdrawals = await (prisma as any).withdrawalRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        bankAccount: {
          select: {
            bankShortName: true,
            bankLogo: true,
            accountNumber: true,
            accountName: true,
          },
        },
      },
    });

    return success(res, { withdrawals });
  } catch (err) {
    console.error('[Affiliate] getWithdrawalHistory error:', err);
    return error(res, 'Internal server error');
  }
}
