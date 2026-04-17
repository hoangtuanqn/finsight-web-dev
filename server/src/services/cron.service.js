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

    const activeDebts = await prisma.debt.findMany({
      where: { status: 'ACTIVE' },
      include: { user: true }
    });

    console.log(`[Cron] Tìm thấy ${activeDebts.length} khoản nợ đang hoạt động.`);
    const userDebtsMap = {};

    for (const debt of activeDebts) {
      if (!userDebtsMap[debt.userId]) {
        userDebtsMap[debt.userId] = { user: debt.user, debts: [], totalMinPayment: 0 };
      }

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Ngày đáo hạn trong tháng hiện tại
      const dueDateThisMonth = new Date(currentYear, currentMonth, debt.dueDay);
      const diffTime = dueDateThisMonth - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      console.log(`[Cron] Xét nợ: ${debt.name} | dueDay: ${debt.dueDay} | diffDays: ${diffDays}`);

      userDebtsMap[debt.userId].debts.push({ ...debt, daysUntilDue: diffDays });
      userDebtsMap[debt.userId].totalMinPayment += debt.minPayment;

      // ── Kịch bản 1: Sắp đến hạn (còn <= 3 ngày) ──
      if (diffDays > 0 && diffDays <= 3) {
        console.log(`[Cron] 📅 Kịch bản 1 - Sắp đến hạn: ${debt.name} (còn ${diffDays} ngày)`);
        const created = await this.createNotificationIfNotExists(
          debt.userId,
          'DUE_DATE',
          `Khoản nợ sắp đến hạn: ${debt.name}`,
          `Khoản vay ${debt.name} sẽ đến hạn vào ngày ${debt.dueDay} (còn ${diffDays} ngày). Đừng quên thanh toán!`,
          'WARNING'
        );
        if (created && debt.user.email) {
          await emailService.sendDebtAlert(debt.user.email, debt.user.username, debt.name, debt.dueDay, diffDays);
        }
      }

      // ── Kịch bản 2: Đến hạn HÔM NAY (diffDays = 0) ──
      if (diffDays === 0) {
        console.log(`[Cron] 🚨 Kịch bản 2 - Đến hạn hôm nay: ${debt.name}`);
        const created = await this.createNotificationIfNotExists(
          debt.userId,
          'DUE_TODAY',
          `Khoản nợ đến hạn HÔM NAY: ${debt.name}`,
          `Khoản vay ${debt.name} đến hạn thanh toán HÔM NAY (ngày ${debt.dueDay}). Thanh toán ngay để tránh phí phạt!`,
          'DANGER'
        );
        if (created && debt.user.email) {
          await emailService.sendDueTodayAlert(debt.user.email, debt.user.username, debt.name, debt.dueDay, debt.minPayment);
        }
      }

      // ── Kịch bản 3: Quá hạn (diffDays < 0) ──
      if (diffDays < 0) {
        const daysOverdue = Math.abs(diffDays);
        console.log(`[Cron] 🔴 Kịch bản 3 - Quá hạn: ${debt.name} (${daysOverdue} ngày)`);
        const created = await this.createNotificationIfNotExists(
          debt.userId,
          'OVERDUE',
          `Khoản nợ QUÁ HẠN ${daysOverdue} ngày: ${debt.name}`,
          `Khoản vay ${debt.name} đã quá hạn ${daysOverdue} ngày! Phí phạt đang tích lũy theo ngày. Hãy xử lý ngay!`,
          'CRITICAL'
        );
        if (created && debt.user.email) {
          await emailService.sendOverdueAlert(debt.user.email, debt.user.username, debt.name, daysOverdue, debt.minPayment);
        }
      }
    }

    // ── Check Domino Risk + DTI per user ──
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

      // Cảnh báo sớm khi DTI vượt 35% (WARNING) — chưa đến mức DOMINO nhưng cần theo dõi
      if (dtiRatio > 35 && dtiRatio <= 50 && debtsDueThisWeek < 2) {
        await this.createNotificationIfNotExists(
          userId,
          'HIGH_DTI',
          '⚠️ Chỉ số DTI vượt ngưỡng cảnh báo',
          `Tỷ lệ nợ/thu nhập (DTI) của bạn đang ở ${dtiRatio.toFixed(1)}% — vượt mức cảnh báo 35%. Hãy xem xét kế hoạch trả nợ để giảm DTI về mức an toàn.`,
          'WARNING'
        );
      }

      // Ghi DebtSnapshot hàng ngày (chỉ 1 bản/ngày)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingSnapshot = await prisma.debtSnapshot.findFirst({
        where: { userId, createdAt: { gte: today } }
      });
      if (!existingSnapshot) {
        const totalBalance = debts.reduce((s, d) => s + d.balance, 0);
        await prisma.debtSnapshot.create({
          data: { userId, totalDebt: totalBalance, totalEAR: 0, debtToIncome: dtiRatio }
        });
        console.log(`[DebtSnapshot] Ghi snapshot DTI=${dtiRatio.toFixed(1)}% cho User ${userId}`);
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
