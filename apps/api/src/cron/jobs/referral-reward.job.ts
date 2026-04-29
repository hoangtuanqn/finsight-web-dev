import prisma from '../../lib/prisma';

export async function processReferralRewards() {
  try {
    // 1. Tìm các referral đủ điều kiện nhưng chưa trao thưởng
    const qualifiedReferrals = await (prisma as any).referral.findMany({
      where: {
        status: 'PENDING',
        activeDaysCount: { gte: 3 }
      },
      include: {
        referrer: { select: { id: true, fullName: true } },
        referred: { select: { id: true, fullName: true } }
      }
    });

    if (qualifiedReferrals.length === 0) return;

    console.log(`[ReferralJob] Processing ${qualifiedReferrals.length} qualified referrals...`);

    for (const ref of qualifiedReferrals) {
      try {
        await (prisma as any).$transaction(async (tx: any) => {
          // Cộng thưởng cho người giới thiệu (+15)
          await tx.user.update({
            where: { id: ref.referrerId },
            data: { strategyQuota: { increment: 15 } }
          });

          // Cộng thưởng cho người được giới thiệu (+5)
          await tx.user.update({
            where: { id: ref.referredId },
            data: { strategyQuota: { increment: 5 } }
          });

          // Cập nhật trạng thái Referral
          await tx.referral.update({
            where: { id: ref.id },
            data: {
              status: 'REWARDED',
              rewardedAt: new Date()
            }
          });

          // Tạo thông báo cho người giới thiệu
          await tx.notification.create({
            data: {
              userId: ref.referrerId,
              type: 'REFERRAL_REWARD',
              title: '🎁 Thưởng giới thiệu thành công!',
              message: `Bạn nhận được 15 lượt tạo chiến lược AI nhờ giới thiệu thành công bạn bè (${ref.referred.fullName}).`,
              severity: 'SUCCESS'
            }
          });

          // Tạo thông báo cho người được giới thiệu
          await tx.notification.create({
            data: {
              userId: ref.referredId,
              type: 'REFERRAL_REWARD',
              title: '🎁 Quà tặng người mới!',
              message: `Chào mừng bạn đến với FinSight! Bạn nhận được 5 lượt tạo chiến lược AI vì đã tham gia qua lời mời của ${ref.referrer.fullName}.`,
              severity: 'SUCCESS'
            }
          });
        });

        console.log(`[ReferralJob] ✅ Rewarded referral ${ref.id} (Referrer: ${ref.referrerId}, Referee: ${ref.referredId})`);
      } catch (err) {
        console.error(`[ReferralJob] ❌ Error processing referral ${ref.id}:`, err);
      }
    }
  } catch (err) {
    console.error('[ReferralJob] Critical error:', err);
  }
}
