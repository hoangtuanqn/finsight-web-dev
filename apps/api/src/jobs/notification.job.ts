import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import enterpriseDb from '../prisma/enterprise.client';
import { NotificationService } from '../services/enterprise/notification.service';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Ho_Chi_Minh';
const JOB_NAME = 'JOB_NOTIFY';

export async function runNotificationJob(orgId?: string): Promise<{
  processed: number;
  notificationsSent: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const today = dayjs().tz(TZ).startOf('day');
  const todayStr = today.format('YYYY-MM-DD');

  console.log(`[${JOB_NAME}] Starting — today is ${todayStr}`);

  let processed = 0;
  let notificationsSent = 0;
  const errors: string[] = [];

  const jobLog = await (enterpriseDb as any).jobLog.create({
    data: { jobName: JOB_NAME, status: 'RUNNING', organizationId: orgId ?? null },
  });

  const adminCache = new Map<string, string[]>();

  const getOrgAdmins = async (oId: string) => {
    if (adminCache.has(oId)) return adminCache.get(oId) || [];
    const admins = await (enterpriseDb as any).user.findMany({
      where: {
        organizationId: oId,
        roleTitle: { in: ['ADMIN', 'MANAGER', 'CFO', 'CEO'] },
      },
      select: { id: true },
    });
    const ids = admins.map((a: any) => a.id);
    adminCache.set(oId, ids);
    return ids;
  };

  try {
    const activeDebts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        status: { notIn: ['PAID', 'WRITTEN_OFF', 'DRAFT'] },
      },
      include: {
        party: {
          select: {
            name: true,
            personInChargeId: true,
          },
        },
      },
    });

    for (const debt of activeDebts) {
      try {
        const dueDate = dayjs(debt.dueDate).tz(TZ).startOf('day');
        const daysUntilDue = dueDate.diff(today, 'day');
        const isOverdue = debt.status === 'OVERDUE';
        const overdueDays =
          isOverdue && debt.overdueSince ? today.diff(dayjs(debt.overdueSince).tz(TZ).startOf('day'), 'day') : 0;

        let category: any = null;
        let title = '';
        let content = '';
        let priority: any = 'NORMAL';

        // 1. Cảnh báo trước hạn
        const Milestones = [30, 15, 7, 3, 1];
        if (daysUntilDue > 0 && Milestones.includes(daysUntilDue)) {
          category = 'OVERDUE';
          title = `⏳ Sắp đến hạn: ${debt.party?.name || 'Đối tác'}`;
          content = `Khoản nợ ${debt.internalCode} sẽ đến hạn trong ${daysUntilDue} ngày tới.`;
          priority = daysUntilDue <= 3 ? 'IMPORTANT' : 'NORMAL';
        }

        // 2. Cảnh báo quá hạn
        if (isOverdue && overdueDays >= 0) {
          if ([0, 1, 7, 15, 30].includes(overdueDays)) {
            category = overdueDays >= 15 ? 'ESCALATION' : 'OVERDUE';
            priority = overdueDays >= 7 ? 'URGENT' : 'IMPORTANT';
            title =
              overdueDays === 0
                ? `🔴 Khoản nợ VỪA QUÁ HẠN: ${debt.party?.name}`
                : `🚨 QUÁ HẠN ${overdueDays} NGÀY: ${debt.party?.name}`;
            content = `Khoản nợ ${debt.internalCode} đã quá hạn ${overdueDays} ngày. Tổng nợ: ${debt.outstanding.toLocaleString()}đ.`;
          }
        }

        if (category) {
          const recipients = new Set<string>();
          if (debt.personInChargeId) recipients.add(debt.personInChargeId);
          else if (debt.party?.personInChargeId) recipients.add(debt.party.personInChargeId);

          if (category === 'ESCALATION' || (category === 'OVERDUE' && overdueDays >= 7)) {
            const orgAdmins = await getOrgAdmins(debt.organizationId);
            orgAdmins.forEach((id) => recipients.add(id));
          }

          if (recipients.size === 0) {
            const orgAdmins = await getOrgAdmins(debt.organizationId);
            if (orgAdmins.length > 0) recipients.add(orgAdmins[0]);
          }

          for (const targetUserId of recipients) {
            await NotificationService.createNotification({
              organizationId: debt.organizationId,
              targetUserId,
              type: 'TIME_BASED',
              category,
              priority,
              title,
              content,
              debtRecordId: debt.id,
              data: { daysUntilDue, overdueDays, outstanding: debt.outstanding },
            });
            notificationsSent++;
          }
        }
        processed++;
      } catch (err: any) {
        errors.push(`Debt ${debt.id}: ${err.message}`);
      }
    }
  } catch (fatalErr: any) {
    errors.push(`FATAL: ${fatalErr.message}`);
  }

  const durationMs = Date.now() - startTime;
  await (enterpriseDb as any).jobLog.update({
    where: { id: jobLog.id },
    data: {
      status: errors.length > 0 && processed === 0 ? 'FAILED' : errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
      processedCount: processed,
      failedCount: errors.length,
      errorLog: errors.length > 0 ? errors.join('\n') : null,
      durationMs,
    },
  });

  return { processed, notificationsSent, errors };
}
