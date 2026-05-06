import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js';
import enterpriseDb from '../prisma/enterprise.client';

dayjs.extend(utc);
dayjs.extend(timezone);

const TZ = 'Asia/Ho_Chi_Minh';
const JOB_NAME = 'JOB_PENALTY';

/**
 * Tính penalty rate mặc định theo loại nợ (Module 5 spec)
 * Dùng nếu penaltyRate trên DebtRecord = 0
 */
function getDefaultPenaltyRate(origin: string): number {
  switch (origin) {
    case 'FINANCIAL':
      return 0.0003; // 0.03%/day — Luật VN
    case 'TAX':
      return 0.0003; // 0.03%/day — Cố định theo luật
    case 'TRADE':
      return 0.001; // 0.1%/day — Theo hợp đồng (default)
    case 'BOND':
      return 0.0005; // 0.05%/day
    case 'INTERNAL':
      return 0; // Có thể = 0
    default:
      return 0.0003;
  }
}

export async function runPenaltyJob(orgId?: string): Promise<{
  processed: number;
  failed: number;
  totalPenalty: number;
  errors: string[];
}> {
  const startTime = Date.now();
  const today = dayjs().tz(TZ).startOf('day').toDate();
  const todayStr = dayjs(today).format('YYYY-MM-DD');

  console.log(`[${JOB_NAME}] Starting — today is ${todayStr} (GMT+7)`);

  let processed = 0;
  let failed = 0;
  let totalPenalty = 0;
  const errors: string[] = [];

  const jobLog = await (enterpriseDb as any).jobLog.create({
    data: { jobName: JOB_NAME, status: 'RUNNING', organizationId: orgId ?? null },
  });

  try {
    // Query tất cả khoản OVERDUE chưa tính penalty hôm nay
    const overdueDebts = await (enterpriseDb as any).debtRecord.findMany({
      where: {
        ...(orgId ? { organizationId: orgId } : {}),
        status: 'OVERDUE',
        OR: [{ lastPenaltyDate: null }, { lastPenaltyDate: { lt: today } }],
      },
      select: {
        id: true,
        organizationId: true,
        origin: true,
        outstanding: true,
        penaltyRate: true,
        gracePeriodDays: true,
        overdueSince: true,
      },
    });

    console.log(`[${JOB_NAME}] Found ${overdueDebts.length} OVERDUE debts to process`);

    for (const debt of overdueDebts) {
      try {
        // ── Check Grace Period ──────────────────────────────────────────
        if (debt.overdueSince && debt.gracePeriodDays > 0) {
          const penaltyStartDate = dayjs(debt.overdueSince).add(debt.gracePeriodDays, 'day').toDate();
          if (today < penaltyStartDate) {
            console.log(`[${JOB_NAME}] Debt ${debt.id} in grace period — skip`);
            continue;
          }
        }

        // ── Xác định rate ──────────────────────────────────────────────
        // Ưu tiên rate trên record, nếu = 0 thì dùng default theo origin
        const dailyRate = debt.penaltyRate > 0 ? debt.penaltyRate : getDefaultPenaltyRate(debt.origin);

        if (dailyRate === 0) {
          console.log(`[${JOB_NAME}] Debt ${debt.id} has penalty rate 0 — skip`);
          continue;
        }

        // Calculate penalty and round to nearest integer (important for VND)
        const penaltyAmount = Math.round(debt.outstanding * dailyRate);

        if (penaltyAmount <= 0) continue;

        await (enterpriseDb as any).$transaction(async (tx: any) => {
          // Tạo transaction PENALTY
          // PENALTY không giảm outstanding — chỉ là nghĩa vụ tăng thêm
          await tx.debtTransaction.create({
            data: {
              debtRecordId: debt.id,
              type: 'PENALTY',
              amount: penaltyAmount,
              principalPart: 0, // Không chạm vào gốc
              interestPart: 0,
              penaltyPart: penaltyAmount,
              paidAt: today,
              notes: `Phạt quá hạn ngày ${todayStr} — Rate: ${(dailyRate * 100).toFixed(4)}%/ngày`,
              balanceSnapshot: debt.outstanding, // Outstanding không đổi khi tạo PENALTY
            },
          });

          // Cập nhật idempotency date
          await tx.debtRecord.update({
            where: { id: debt.id },
            data: { lastPenaltyDate: today },
          });
        });

        processed++;
        totalPenalty += penaltyAmount;
        console.log(
          `[${JOB_NAME}] ✓ Debt ${debt.id} — penalty: ${penaltyAmount.toLocaleString()}đ (rate: ${(dailyRate * 100).toFixed(4)}%/ngày)`,
        );
      } catch (err: any) {
        failed++;
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
      status: failed > 0 && processed === 0 ? 'FAILED' : failed > 0 ? 'PARTIAL' : 'SUCCESS',
      processedCount: processed,
      failedCount: failed,
      errorLog: errors.length > 0 ? errors.join('\n') : null,
      durationMs,
    },
  });

  console.log(
    `[${JOB_NAME}] Done — processed: ${processed}, failed: ${failed}, total penalty: ${totalPenalty.toLocaleString()}đ, duration: ${durationMs}ms`,
  );

  return { processed, failed, totalPenalty, errors };
}
