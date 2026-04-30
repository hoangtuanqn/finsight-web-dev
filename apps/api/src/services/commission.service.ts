import prisma from '../lib/prisma';

function getCommissionRate(): number {
  const rate = parseFloat(process.env.AFFILIATE_COMMISSION_RATE || '0.10');
  if (isNaN(rate) || rate < 0 || rate > 1) {
    console.warn('[Commission] AFFILIATE_COMMISSION_RATE không hợp lệ, dùng mặc định 10%');
    return 0.10;
  }
  return rate;
}

export async function processReferralCommission(
  payerId: string,
  amount: number,
  plan: string,
  transactionId: string,
): Promise<void> {
  try {
    const referral = await (prisma as any).referral.findUnique({
      where: { referredId: payerId },
      select: { referrerId: true },
    });

    if (!referral?.referrerId) {
      return;
    }

    const referrerId = referral.referrerId;
    const commissionRate = getCommissionRate();
    // Công thức: hoa hồng vĩnh viễn = số tiền thanh toán * tỉ lệ hoa hồng
    const commissionAmount = Math.floor(amount * commissionRate);

    await (prisma as any).$transaction([
      (prisma as any).commissionLog.create({
        data: {
          recipientId: referrerId,
          payerId,
          transactionId,
          commissionAmount,
          originalAmount: amount,
          commissionRate,
          plan,
          status: 'EARNED',
        },
      }),
      (prisma as any).user.update({
        where: { id: referrerId },
        data: {
          commissionBalance: { increment: commissionAmount },
          totalCommissionEarned: { increment: commissionAmount },
        },
      }),
    ]);

    console.log(
      `[Commission] ✅ +${commissionAmount.toLocaleString('vi-VN')}đ cho user ${referrerId}` +
      ` | ${(commissionRate * 100).toFixed(0)}% của ${amount.toLocaleString('vi-VN')}đ (${plan})` +
      ` | payer: ${payerId} | tx: ${transactionId}`
    );
  } catch (err: any) {
    console.error(`[Commission] ❌ Lỗi khi xử lý hoa hồng cho payer ${payerId}:`, err.message);
  }
}
