import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import enterpriseDb from '../prisma/enterprise.client';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Ho_Chi_Minh';
const JOB_NAME = 'JOB_OVERDUE';

export async function runOverdueJob(orgId?: string): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const today = dayjs().tz(TZ).startOf('day').toDate();
  const todayStr = dayjs(today).format('YYYY-MM-DD');

  console.log(`[${JOB_NAME}] Starting — today is ${todayStr} (GMT+7)`);

  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  // Log job start
  const jobLog = await (enterpriseDb as any).jobLog.create({
    data: { jobName: JOB_NAME, status: 'RUNNING', organizationId: orgId ?? null },
  });

  try {
    // ── Group A: Bullet/single-payment debts ──────────────────────────────
    const groupADebts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        status: { in: ['ACTIVE', 'PARTIAL'] },
        dueDate: { lt: today },
        // Idempotency: skip if already processed today
        OR: [{ lastOverdueCheckDate: null }, { lastOverdueCheckDate: { lt: today } }],
      },
      select: {
        id: true,
        organizationId: true,
        status: true,
        overdueSince: true,
        principal: true,
        outstanding: true,
      },
    });

    console.log(`[${JOB_NAME}] Group A: ${groupADebts.length} debts to process`);

    for (const debt of groupADebts) {
      try {
        await (enterpriseDb as any).$transaction(async (tx: any) => {
          // Transition to OVERDUE
          await tx.debtRecord.update({
            where: { id: debt.id },
            data: {
              status: 'OVERDUE',
              overdueSince: debt.overdueSince ?? today, // Only set if first time
              lastOverdueCheckDate: today,
            },
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              organizationId: debt.organizationId,
              userId: 'SYSTEM',
              action: 'UPDATE_STATUS',
              entityType: 'DEBT_RECORD',
              entityId: debt.id,
              oldValues: { status: debt.status },
              newValues: {
                status: 'OVERDUE',
                triggeredBy: 'SYSTEM/JOB_OVERDUE',
                processedDate: todayStr,
                outstandingSnapshot: debt.outstanding,
              },
              reason: 'Khoản nợ vượt ngày đến hạn — chuyển OVERDUE tự động',
            },
          });
        });

        processed++;
        console.log(`[${JOB_NAME}] ✓ Debt ${debt.id} → OVERDUE`);
      } catch (err: any) {
        failed++;
        const msg = `Debt ${debt.id}: ${err.message}`;
        errors.push(msg);
        console.error(`[${JOB_NAME}] ✗ ${msg}`);
      }
    }

    // ── Group B: Multi-period debts — check individual schedules ──────────
    const overdueSchedules = await (enterpriseDb as any).debtSchedule.findMany({
      where: {
        ...(orgId ? { debtRecord: { organizationId: orgId } } : {}),
        dueDate: { lt: today },
        status: 'PENDING',
        isOverdue: false,
        isActivated: true,
      },
      include: {
        debtRecord: {
          select: { id: true, organizationId: true, status: true, outstanding: true },
        },
      },
    });

    console.log(`[${JOB_NAME}] Group B: ${overdueSchedules.length} schedules to process`);

    for (const schedule of overdueSchedules) {
      try {
        await (enterpriseDb as any).$transaction(async (tx: any) => {
          // Mark this schedule as overdue
          await tx.debtSchedule.update({
            where: { id: schedule.id },
            data: { isOverdue: true, overdueSince: today, status: 'OVERDUE' },
          });

          // Check if the parent debt should also become OVERDUE
          // (transition if the debt is still ACTIVE/PARTIAL and not already OVERDUE)
          const debt = schedule.debtRecord;
          if (['ACTIVE', 'PARTIAL'].includes(debt.status)) {
            await tx.debtRecord.update({
              where: { id: debt.id },
              data: {
                status: 'OVERDUE',
                overdueSince: today,
                lastOverdueCheckDate: today,
              },
            });

            await tx.auditLog.create({
              data: {
                organizationId: debt.organizationId,
                userId: 'SYSTEM',
                action: 'UPDATE_STATUS',
                entityType: 'DEBT_RECORD',
                entityId: debt.id,
                oldValues: { status: debt.status },
                newValues: {
                  status: 'OVERDUE',
                  triggeredBy: 'SYSTEM/JOB_OVERDUE',
                  overdueScheduleId: schedule.id,
                  outstandingSnapshot: debt.outstanding,
                },
                reason: `Kỳ ${schedule.period} vượt ngày đến hạn`,
              },
            });
          }
        });

        processed++;
      } catch (err: any) {
        failed++;
        const msg = `Schedule ${schedule.id}: ${err.message}`;
        errors.push(msg);
        console.error(`[${JOB_NAME}] ✗ ${msg}`);
      }
    }
  } catch (fatalErr: any) {
    console.error(`[${JOB_NAME}] FATAL:`, fatalErr.message);
    errors.push(`FATAL: ${fatalErr.message}`);
  }

  const durationMs = Date.now() - startTime;

  // Update job log
  await (enterpriseDb as any).jobLog.update({
    where: { id: jobLog.id },
    data: {
      status: failed > 0 && processed === 0 ? 'FAILED' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
      processedCount: processed,
      failedCount: failed,
      errorLog: errors.length > 0 ? errors.join('\n') : null,
      durationMs,
    },
  });

  console.log(`[${JOB_NAME}] Done — processed: ${processed}, failed: ${failed}, duration: ${durationMs}ms`);

  return { processed, failed, errors };
}
