import prisma from '../../lib/prisma';

export async function checkExpiredSubscriptions() {
  const now = new Date();
  console.log(`[Cron] Checking expired subscriptions at: ${now.toISOString()}`);

  const expiredUsers = await (prisma as any).user.findMany({
    where: {
      level: { not: 'BASIC' },
      levelExpiresAt: { lt: now },
    },
  });

  for (const user of expiredUsers) {
    await (prisma as any).user.update({
      where: { id: user.id },
      data: { level: 'BASIC', levelExpiresAt: null },
    });

    await (prisma as any).notification.create({
      data: {
        userId: user.id,
        type: 'SUBSCRIPTION_EXPIRED',
        title: '⏰ Gói đăng ký đã hết hạn',
        message: `Gói ${user.level} của bạn đã hết hạn. Tài khoản đã chuyển về gói Basic. Nâng cấp lại để tiếp tục sử dụng các tính năng premium.`,
        severity: 'WARNING',
      },
    });

    console.log(`[Subscription] Downgraded User ${user.id} from ${user.level} to BASIC`);
  }
}
