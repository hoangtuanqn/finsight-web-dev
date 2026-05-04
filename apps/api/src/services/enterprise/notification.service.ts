import dayjs from 'dayjs';
import enterpriseDb from '../../prisma/enterprise.client';

export class NotificationService {
  /**
   * Tạo thông báo mới
   */
  static async createNotification(
    data: {
      organizationId: string;
      targetUserId: string;
      type: 'EVENT_BASED' | 'TIME_BASED';
      category: 'OVERDUE' | 'PENALTY' | 'PAYMENT' | 'NEW_DEBT' | 'ESCALATION' | 'LIMIT_BREACH';
      priority: 'NORMAL' | 'IMPORTANT' | 'URGENT' | 'REMINDER' | 'INFO';
      title: string;
      content: string;
      debtRecordId?: string;
      data?: any;
    },
    tx?: any,
  ) {
    const db = tx || enterpriseDb;
    // Chống trùng lặp cho các thông báo cùng loại trong ngày (tránh spam)
    if (data.type === 'TIME_BASED' && data.debtRecordId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existing = await (db as any).enterpriseNotification.findFirst({
        where: {
          debtRecordId: data.debtRecordId,
          targetUserId: data.targetUserId,
          type: 'TIME_BASED',
          category: data.category,
          createdAt: { gte: today },
        },
      });
      if (existing) return existing;
    }

    return await (db as any).enterpriseNotification.create({
      data: {
        organizationId: data.organizationId,
        targetUserId: data.targetUserId,
        type: data.type,
        category: data.category,
        priority: data.priority,
        title: data.title,
        content: data.content,
        debtRecordId: data.debtRecordId,
        data: data.data || {},
      },
    });
  }

  /**
   * Lấy danh sách thông báo của User
   */
  static async getUserNotifications(
    userId: string,
    filters: {
      isRead?: boolean;
      priority?: string;
      category?: string;
    },
  ) {
    const where: any = { targetUserId: userId };

    // Ẩn các thông báo đang bị Snooze
    where.OR = [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }];

    if (filters.isRead !== undefined) where.isRead = filters.isRead;
    if (filters.priority) where.priority = filters.priority;
    if (filters.category) where.category = filters.category;

    return await (enterpriseDb as any).enterpriseNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        debtRecord: {
          select: { internalCode: true, principal: true, outstanding: true },
        },
      },
      take: 100,
    });
  }

  /**
   * Đánh dấu đã đọc
   */
  static async markAsRead(id: string, userId: string) {
    return await (enterpriseDb as any).enterpriseNotification.updateMany({
      where: { id, targetUserId: userId },
      data: { isRead: true, readAt: new Date() },
    });
  }

  static async markAllAsRead(userId: string) {
    return await (enterpriseDb as any).enterpriseNotification.updateMany({
      where: { targetUserId: userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * Xác nhận xử lý (Acknowledge)
   */
  static async acknowledge(id: string, userId: string) {
    return await (enterpriseDb as any).enterpriseNotification.updateMany({
      where: { id, targetUserId: userId },
      data: { acknowledgedAt: new Date() },
    });
  }

  /**
   * Tạm hoãn nhắc nhở (Snooze)
   */
  static async snooze(id: string, userId: string, days: number = 3) {
    const snoozedUntil = dayjs().add(days, 'day').toDate();
    return await (enterpriseDb as any).enterpriseNotification.updateMany({
      where: { id, targetUserId: userId },
      data: { snoozedUntil },
    });
  }

  /**
   * Lấy số lượng chưa đọc
   */
  static async getUnreadCount(userId: string) {
    return await (enterpriseDb as any).enterpriseNotification.count({
      where: {
        targetUserId: userId,
        isRead: false,
        OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: new Date() } }],
      },
    });
  }
}
