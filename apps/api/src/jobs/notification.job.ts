import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import enterpriseDb from '../prisma/enterprise.client';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Ho_Chi_Minh';
const JOB_NAME = 'JOB_NOTIFY';

// Mốc cảnh báo (ngày trước khi đến hạn)
const ALERT_MILESTONES = [30, 15, 7, 1];

type AlertLevel = 'URGENT' | 'CRITICAL' | 'WARNING' | 'INFO' | 'REMINDER';

function getAlertLevel(daysUntilDue: number, isOverdue: boolean): AlertLevel {
  if (isOverdue) return 'URGENT';
  if (daysUntilDue <= 1) return 'CRITICAL';
  if (daysUntilDue <= 7) return 'WARNING';
  if (daysUntilDue <= 15) return 'INFO';
  return 'REMINDER';
}

function getEscalationLevel(overdueDays: number): string {
  if (overdueDays <= 7) return 'ASSIGNEE';
  if (overdueDays <= 15) return 'MANAGER';
  if (overdueDays <= 30) return 'CFO';
  return 'CEO';
}

export async function runNotificationJob(orgId?: string): Promise<{
  processed: number;
  notificationsSent: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const today = dayjs().tz(TZ).startOf('day');
  const todayStr = today.format('YYYY-MM-DD');

  console.log(`[${JOB_NAME}] Starting — today is ${todayStr} (GMT+7)`);

  let processed = 0;
  let notificationsSent = 0;
  const errors: string[] = [];

  const jobLog = await (enterpriseDb as any).jobLog.create({
    data: { jobName: JOB_NAME, status: 'RUNNING', organizationId: orgId ?? null },
  });

  try {
    // Query tất cả khoản nợ đang hoạt động (không bao gồm terminal states)
    const activeDebts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        status: { notIn: ['PAID', 'WRITTEN_OFF', 'DRAFT'] },
      },
      include: {
        party: { select: { name: true } },
      },
    });

    console.log(`[${JOB_NAME}] Processing ${activeDebts.length} active debts`);

    for (const debt of activeDebts) {
      try {
        const dueDate = dayjs(debt.dueDate).tz(TZ).startOf('day');
        const daysUntilDue = dueDate.diff(today, 'day');
        const isOverdue = debt.status === 'OVERDUE';
        const overdueDays =
          isOverdue && debt.overdueSince ? today.diff(dayjs(debt.overdueSince).tz(TZ).startOf('day'), 'day') : 0;

        let shouldNotify = false;
        let milestone = '';

        if (isOverdue && dayjs(debt.overdueSince).format('YYYY-MM-DD') === todayStr) {
          // Vừa chuyển OVERDUE hôm nay → notify ngay
          shouldNotify = true;
          milestone = 'OVERDUE_TODAY';
        } else if (!isOverdue && ALERT_MILESTONES.includes(daysUntilDue)) {
          // Đến mốc cảnh báo sắp đến hạn
          shouldNotify = true;
          milestone = `T_MINUS_${daysUntilDue}`;
        }

        if (!shouldNotify) {
          processed++;
          continue;
        }

        // ── Chống duplicate notification ─────────────────────────────
        // Kiểm tra xem hôm nay đã gửi ở mốc này chưa
        const existingNotification = await (enterpriseDb as any).notification.findFirst({
          where: {
            userId: 'SYSTEM', // Tạm dùng userId đặc biệt để đánh dấu
            metadata: {
              path: ['debtId'],
              equals: debt.id,
            },
            // Dùng createdAt để check duplicate trong ngày
            createdAt: { gte: today.toDate() },
          },
        });

        if (existingNotification) {
          console.log(`[${JOB_NAME}] Notification already sent for debt ${debt.id} today — skip`);
          processed++;
          continue;
        }

        const alertLevel = getAlertLevel(daysUntilDue, isOverdue);
        const escalationTarget = isOverdue ? getEscalationLevel(overdueDays) : 'ASSIGNEE';

        // ── Lấy danh sách users trong org để gửi notify ─────────────
        const orgUsers = await (enterpriseDb as any).user.findMany({
          where: { organizationId: debt.organizationId },
          select: { id: true },
        });

        // Tạo notification cho tất cả users trong org
        // (Thực tế sẽ filter theo assignee/role khi có field assigneeId)
        for (const user of orgUsers) {
          await (enterpriseDb as any).notification.create({
            data: {
              userId: user.id,
              type: isOverdue ? 'DEBT_OVERDUE' : 'DEBT_DUE_SOON',
              title: isOverdue
                ? `🔴 Khoản nợ quá hạn: ${debt.party?.name}`
                : `${alertLevel === 'CRITICAL' ? '🟠' : alertLevel === 'WARNING' ? '🟡' : '🟢'} Sắp đến hạn (${daysUntilDue} ngày): ${debt.party?.name}`,
              message: isOverdue
                ? `Khoản nợ ${debt.internalCode} với ${debt.party?.name} đã quá hạn ${overdueDays} ngày. Cần xử lý ngay — cấp độ: ${escalationTarget}.`
                : `Khoản nợ ${debt.internalCode} với ${debt.party?.name} sẽ đến hạn sau ${daysUntilDue} ngày (${dayjs(debt.dueDate).format('DD/MM/YYYY')}).`,
              isRead: false,
              metadata: {
                debtId: debt.id,
                milestone,
                alertLevel,
                escalationTarget,
                daysUntilDue,
                overdueDays,
                outstanding: debt.outstanding,
              },
            },
          });
          notificationsSent++;
        }

        processed++;
        console.log(
          `[${JOB_NAME}] ✓ Debt ${debt.id} — sent ${orgUsers.length} notifications [${alertLevel}/${milestone}]`,
        );
      } catch (err: any) {
        // Check if error is about notification model not existing
        if (err.message?.includes('notification')) {
          console.warn(`[${JOB_NAME}] Notification model may not exist yet — ${err.message}`);
          processed++;
          continue;
        }
        const msg = `Debt ${debt.id}: ${err.message}`;
        errors.push(msg);
        console.error(`[${JOB_NAME}] ✗ ${msg}`);
      }
    }
  } catch (fatalErr: any) {
    console.error(`[${JOB_NAME}] FATAL:`, fatalErr.message);
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

  console.log(
    `[${JOB_NAME}] Done — processed: ${processed}, notifications sent: ${notificationsSent}, duration: ${durationMs}ms`,
  );

  return { processed, notificationsSent, errors };
}
