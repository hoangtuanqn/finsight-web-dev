import cron from 'node-cron';
import prisma from '../lib/prisma.js';
import emailService from './email.service.js';

class CronService {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    // Run every minute for Demo purposes (In production: '0 0 * * *' for daily midnight)
    console.log('⏰ Initializing Background Cron Jobs...');
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkDueDebtsAndDominoRisk();
        await this.checkMarketSentimentChanges();
      } catch (error) {
        console.error('❌ Cron Job Error:', error);
      }
    });

    this.isInitialized = true;
  }

  async checkDueDebtsAndDominoRisk() {
    const now = new Date();
    console.log(`[Cron] Quét nợ lúc: ${now.toISOString()}`);
    
    // 1. Fetch all active debts
    const activeDebts = await prisma.debt.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true }
    });

    console.log(`[Cron] Tìm thấy ${activeDebts.length} khoản nợ đang hoạt động.`);
    const userDebtsMap = {};

    for (const debt of activeDebts) {
      // Group by user
      if (!userDebtsMap[debt.userId]) {
        userDebtsMap[debt.userId] = {
          user: debt.user,
          debts: [],
          totalMinPayment: 0
        };
      }
      
      // Calculate next due date from dueDay (Day of month)
      const nextDue = new Date(now.getFullYear(), now.getMonth(), debt.dueDay);
      // If dueDay has passed this month, move to next month
      if (nextDue < now) {
        nextDue.setMonth(nextDue.getMonth() + 1);
      }
      
      const diffTime = nextDue - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`[Cron] Xét nợ: ${debt.name} | Ngày đáo hàng tháng: ${debt.dueDay} | Ngày đáo tiếp theo: ${nextDue.toLocaleDateString()} | diffDays: ${diffDays}`);
      
      userDebtsMap[debt.userId].debts.push({ ...debt, daysUntilDue: diffDays });
      userDebtsMap[debt.userId].totalMinPayment += debt.minPayment;
      
      // Individual Debt Warning: Due in <= 3 days
      if (diffDays >= 0 && diffDays <= 3) {
        console.log(`[Cron] 🎯 Đạt điều kiện thông báo DUE_DATE cho: ${debt.name}`);
        const created = await this.createNotificationIfNotExists(
          debt.userId,
          'DUE_DATE',
          `Khoản nợ sắp đến hạn: ${debt.name}`,
          `Khoản vay ${debt.name} của bạn sẽ đến hạn thanh toán vào ngày ${debt.dueDay} (${diffDays} ngày nữa). Đừng quên thanh toán nhé!`,
          'WARNING'
        );
        
        if (created && debt.user.email) {
          await emailService.sendDebtAlert(debt.user.email, debt.user.username, debt.name, debt.dueDay, diffDays);
        }
      }
    }

    // 2. Check Domino Risk per user
    for (const userId in userDebtsMap) {
      const { user, debts, totalMinPayment } = userDebtsMap[userId];
      
      const debtsDueThisWeek = debts.filter(d => d.daysUntilDue >= 0 && d.daysUntilDue <= 7).length;
      
      let dtiRatio = 0;
      if (user.monthlyIncome > 0) {
        dtiRatio = (totalMinPayment / user.monthlyIncome) * 100;
      }

      // Domino condition: >= 2 debts due this week OR DTI > 50%
      if (debtsDueThisWeek >= 2 || dtiRatio > 50) {
        const reason = debtsDueThisWeek >= 2 
          ? `Bạn có ${debtsDueThisWeek} khoản nợ đáo hạn trong cùng 1 tuần.` 
          : `Tỷ lệ nợ trên thu nhập (DTI) của bạn đang ở mức nguy hiểm (${dtiRatio.toFixed(1)}%).`;
          
        const created = await this.createNotificationIfNotExists(
          userId,
          'DOMINO_RISK',
          '🚨 CẢNH BÁO HIỆU ỨNG DOMINO',
          `Hệ thống phát hiện rủi ro vỡ nợ dây chuyền! ${reason} Cần khẩn cấp tái cơ cấu lại dòng tiền để tránh rớt vào thế bị động.`,
          'DANGER'
        );

        if (created && user.email) {
          await emailService.sendDominoRiskAlert(user.email, user.username, reason);
        }
      }
    }
  }

  async checkMarketSentimentChanges() {
    // Note: In a real app, we'd fetch the Fear & Greed index from MarketService/Redis here.
    // For Demo: We mock a random alert if we want, or just wait for genuine triggers.
    // To keep it clean, we'll intentionally leave this as a stub that could query the DB or Redis.
  }

  async createNotificationIfNotExists(userId, type, title, message, severity) {
    // Prevent spamming the same notification type on the same day for demo
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        title,
        createdAt: { gte: today }
      }
    });

    if (!existing) {
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          severity
        }
      });
      console.log(`[Notification Created] ${type} for User ${userId}`);
      return true;
    }
    return false;
  }
}

export default new CronService();
