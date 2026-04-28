import prisma from '../../lib/prisma';
import emailService from '../../services/email.service';

export async function checkDueDebtsAndDominoRisk() {
  const now = new Date();
  console.log(`[Cron] Quét nợ lúc: ${now.toISOString()}`);

  const activeDebts = await (prisma as any).debt.findMany({
    where: { status: 'ACTIVE' },
    include: { user: true }
  });

  console.log(`[Cron] Tìm thấy ${activeDebts.length} khoản nợ đang hoạt động.`);
  const userDebtsMap: Record<string, any> = {};

  for (const debt of activeDebts) {
    if (!userDebtsMap[debt.userId]) {
      userDebtsMap[debt.userId] = { user: debt.user, debts: [], totalMinPayment: 0 };
    }

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const dueDateThisMonth = new Date(currentYear, currentMonth, debt.dueDay);
    const diffTime = dueDateThisMonth.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log(`[Cron] Xét nợ: ${debt.name} | dueDay: ${debt.dueDay} | diffDays: ${diffDays}`);

    userDebtsMap[debt.userId].debts.push({ ...debt, daysUntilDue: diffDays });
    userDebtsMap[debt.userId].totalMinPayment += debt.minPayment;

    if (diffDays > 0 && diffDays <= 3) {
      console.log(`[Cron] 📅 Kịch bản 1 - Sắp đến hạn: ${debt.name} (còn ${diffDays} ngày)`);
      const created = await createNotificationIfNotExists(
        debt.userId, 'DUE_DATE',
        `Khoản nợ sắp đến hạn: ${debt.name}`,
        `Khoản vay ${debt.name} sẽ đến hạn vào ngày ${debt.dueDay} (còn ${diffDays} ngày). Đừng quên thanh toán!`,
        'WARNING'
      );
      if (created && debt.user.email) {
        await (emailService as any).sendDebtAlert(debt.user.email, debt.user.username, debt.name, debt.dueDay, diffDays);
      }
    }

    if (diffDays === 0) {
      console.log(`[Cron] 🚨 Kịch bản 2 - Đến hạn hôm nay: ${debt.name}`);
      const created = await createNotificationIfNotExists(
        debt.userId, 'DUE_TODAY',
        `Khoản nợ đến hạn HÔM NAY: ${debt.name}`,
        `Khoản vay ${debt.name} đến hạn thanh toán HÔM NAY (ngày ${debt.dueDay}). Thanh toán ngay để tránh phí phạt!`,
        'DANGER'
      );
      if (created && debt.user.email) {
        await (emailService as any).sendDueTodayAlert(debt.user.email, debt.user.username, debt.name, debt.dueDay, debt.minPayment);
      }
    }

    if (diffDays < 0) {
      const daysOverdue = Math.abs(diffDays);
      console.log(`[Cron] 🔴 Kịch bản 3 - Quá hạn: ${debt.name} (${daysOverdue} ngày)`);
      const created = await createNotificationIfNotExists(
        debt.userId, 'OVERDUE',
        `Khoản nợ QUÁ HẠN ${daysOverdue} ngày: ${debt.name}`,
        `Khoản vay ${debt.name} đã quá hạn ${daysOverdue} ngày! Phí phạt đang tích lũy theo ngày. Hãy xử lý ngay!`,
        'CRITICAL'
      );
      if (created && debt.user.email) {
        await (emailService as any).sendOverdueAlert(debt.user.email, debt.user.username, debt.name, daysOverdue, debt.minPayment);
      }
    }
  }

  for (const userId in userDebtsMap) {
    const { user, debts, totalMinPayment } = userDebtsMap[userId];
    const debtsDueThisWeek = debts.filter((d: any) => d.daysUntilDue >= 0 && d.daysUntilDue <= 7).length;
    
    let dtiRatio = 0;
    if (user.monthlyIncome > 0) {
      dtiRatio = (totalMinPayment / user.monthlyIncome) * 100;
    }

    if (debtsDueThisWeek >= 2 || dtiRatio > 50) {
      const reason = debtsDueThisWeek >= 2
        ? `Bạn có ${debtsDueThisWeek} khoản nợ đáo hạn trong cùng 1 tuần.`
        : `Tỷ lệ nợ trên thu nhập (DTI) của bạn đang ở mức nguy hiểm (${dtiRatio.toFixed(1)}%).`;

      const created = await createNotificationIfNotExists(
        userId, 'DOMINO_RISK',
        '🚨 CẢNH BÁO HIỆU ỨNG DOMINO',
        `Hệ thống phát hiện rủi ro vỡ nợ dây chuyền! ${reason} Cần khẩn cấp tái cơ cấu lại dòng tiền để tránh rớt vào thế bị động.`,
        'DANGER'
      );
      if (created && user.email) {
        await (emailService as any).sendDominoRiskAlert(user.email, user.username, reason);
      }
    }

    if (dtiRatio > 35 && dtiRatio <= 50 && debtsDueThisWeek < 2) {
      await createNotificationIfNotExists(
        userId, 'HIGH_DTI',
        '⚠️ Chỉ số DTI vượt ngưỡng cảnh báo',
        `Tỷ lệ nợ/thu nhập (DTI) của bạn đang ở ${dtiRatio.toFixed(1)}% — vượt mức cảnh báo 35%. Hãy xem xét kế hoạch trả nợ để giảm DTI về mức an toàn.`,
        'WARNING'
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingSnapshot = await (prisma as any).debtSnapshot.findFirst({
      where: { userId, createdAt: { gte: today } }
    });
    if (!existingSnapshot) {
      const totalBalance = debts.reduce((s: number, d: any) => s + d.balance, 0);
      await (prisma as any).debtSnapshot.create({
        data: { userId, totalDebt: totalBalance, totalEAR: 0, debtToIncome: dtiRatio }
      });
      console.log(`[DebtSnapshot] Ghi snapshot DTI=${dtiRatio.toFixed(1)}% cho User ${userId}`);
    }
  }
}

async function createNotificationIfNotExists(userId: string, type: string, title: string, message: string, severity: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await (prisma as any).notification.findFirst({
    where: { userId, type, title, createdAt: { gte: today } }
  });

  if (!existing) {
    await (prisma as any).notification.create({
      data: { userId, type, title, message, severity }
    });
    console.log(`[Notification Created] ${type} for User ${userId}`);
    return true;
  }
  return false;
}

export async function purgeSoftDeletedDebts() {
  const now = new Date();
  console.log(`[Cron] Bắt đầu dọn dẹp thùng rác (Soft Delete) lúc: ${now.toISOString()}`);
  
  try {
    const result = await (prisma as any).debt.deleteMany({
      where: {
        scheduledPurgeAt: { lte: now }
      }
    });

    if (result.count > 0) {
      console.log(`[Cron] ✅ Đã xoá vĩnh viễn ${result.count} khoản nợ từ thùng rác.`);
    } else {
      console.log(`[Cron] ♻️ Thùng rác sạch sẽ, không có khoản nợ nào cần xoá.`);
    }
  } catch (error) {
    console.error(`[Cron] ❌ Lỗi dọn dẹp thùng rác:`, error);
  }
}
