import prisma from '../lib/prisma';

export class ReferralService {
  /**
   * Lấy hoặc tạo mã giới thiệu cho user
   */
  static async getOrCreateReferralCode(userId: string) {
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { referralCode: true, fullName: true }
    });

    if (user?.referralCode) return user.referralCode;

    // Tạo mã: Tên (không dấu) + 4 ký tự ngẫu nhiên
    const base = user?.fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'user';
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${base}${randomSuffix}`;

    await (prisma as any).user.update({
      where: { id: userId },
      data: { referralCode: code }
    });

    return code;
  }

  /**
   * Ghi nhận lượt nhấp vào link giới thiệu
   */
  static async trackClick(referrerCode: string, ip?: string, userAgent?: string) {
    const referrer = await (prisma as any).user.findUnique({
      where: { referralCode: referrerCode },
      select: { id: true }
    });

    if (!referrer) return;

    await (prisma as any).referralClick.create({
      data: {
        referrerId: referrer.id,
        ip,
        userAgent
      }
    });
  }

  /**
   * Xử lý quan hệ giới thiệu khi user mới đăng ký
   */
  static async processReferral(newUserId: string, referralCode: string) {
    const referrer = await (prisma as any).user.findUnique({
      where: { referralCode },
      select: { id: true }
    });

    // Không tự giới thiệu chính mình
    if (!referrer || referrer.id === newUserId) return;

    await (prisma as any).referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        status: 'PENDING'
      }
    });

    await (prisma as any).user.update({
      where: { id: newUserId },
      data: { referralCodeUsed: referralCode }
    });
  }

  /**
   * Ghi nhận hoạt động hàng ngày (check-in)
   */
  static async recordActivity(userId: string) {
    const today = new Date().toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
    
    try {
      // Ghi nhận hoạt động trong bảng UserActivity
      await (prisma as any).userActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today
          }
        },
        create: {
          userId,
          date: today
        },
        update: {} 
      });

      // Cập nhật số ngày hoạt động trong bảng Referral nếu user này được giới thiệu
      const referral = await (prisma as any).referral.findUnique({
        where: { referredId: userId },
        select: { id: true, status: true }
      });

      if (referral && referral.status === 'PENDING') {
        const activeDaysCount = await (prisma as any).userActivity.count({
          where: { userId }
        });

        await (prisma as any).referral.update({
          where: { id: referral.id },
          data: { activeDaysCount }
        });
      }
    } catch (err) {
      console.error('[Referral] Error recording activity:', err);
    }
  }

  /**
   * Lấy thống kê cho Dashboard
   */
  static async getStats(userId: string) {
    const [clicks, totalReferrals, completedReferrals, referralList] = await Promise.all([
      (prisma as any).referralClick.count({ where: { referrerId: userId } }),
      (prisma as any).referral.count({ where: { referrerId: userId } }),
      (prisma as any).referral.count({ where: { referrerId: userId, status: 'REWARDED' } }),
      (prisma as any).referral.findMany({
        where: { referrerId: userId },
        include: {
          referred: {
            select: { fullName: true, email: true, createdAt: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const referralCode = await this.getOrCreateReferralCode(userId);

    return {
      referralCode,
        clicks,
        totalReferrals,
        completedReferrals,
      },
      referrals: referralList.map(r => ({
        id: r.id,
        name: r.referred.fullName,
        email: r.referred.email.replace(/(.{3})(.*)(@.*)/, '$1...$3'), // Mask email cho bảo mật
        date: r.referred.createdAt,
        status: r.status,
        hasToppedUp: r.hasToppedUp,
        activeDays: r.activeDaysCount
      }))
    };
  }
}
