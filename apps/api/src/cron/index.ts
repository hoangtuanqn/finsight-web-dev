import cron from 'node-cron';
import { checkDueDebtsAndDominoRisk, purgeSoftDeletedDebts } from './jobs/debt.job';
import { checkMarketSentimentChanges } from './jobs/market.job';
import { checkSepayPayments, expirePendingInvoices } from './jobs/payment.job';
import { processReferralRewards } from './jobs/referral-reward.job';
import { checkExpiredSubscriptions } from './jobs/subscription.job';
import { syncAllBankWallets } from './jobs/wallet-sync.job';
// Module 5: Enterprise Debt Scheduled Jobs
import { runNotificationJob } from '../jobs/notification.job';
import { runOverdueJob } from '../jobs/overdue.job';
import { runPenaltyJob } from '../jobs/penalty.job';
import { runReportingJob } from '../jobs/report.job';

const TZ = 'Asia/Ho_Chi_Minh';

class CronManager {
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    console.log('⏰ Initializing Background Cron Jobs Manager...');

    // Job 1: Kiểm tra thanh toán subscription (10s)
    setInterval(async () => {
      try {
        await checkSepayPayments();
      } catch (e: any) {
        console.error('❌ Payment Cron Error:', e.message);
      }
    }, 10_000);

    // Job 2: Đồng bộ số dư & giao dịch ví ngân hàng — realtime (10s)
    setInterval(async () => {
      try {
        await syncAllBankWallets();
      } catch (e: any) {
        console.error('❌ WalletSync Cron Error:', e.message);
      }
    }, 10_000);

    // Job 3: Background jobs mỗi phút
    cron.schedule('* * * * *', async () => {
      try {
        await Promise.allSettled([
          checkDueDebtsAndDominoRisk(),
          checkMarketSentimentChanges(),
          expirePendingInvoices(),
          processReferralRewards(),
        ]);
      } catch (e: any) {
        console.error('❌ Minute Cron Error:', e.message);
      }
    });

    // Job 4: Maintenance hàng ngày 00:05
    cron.schedule('5 0 * * *', async () => {
      try {
        await Promise.allSettled([checkExpiredSubscriptions(), purgeSoftDeletedDebts()]);
      } catch (e: any) {
        console.error('❌ Daily Maintenance Cron Error:', e.message);
      }
    });

    // ── Module 5: Enterprise Debt Jobs ─────────────────────────────────────

    // Job M5-1: Phát hiện quá hạn — 00:01 GMT+7 mỗi ngày
    cron.schedule(
      '1 0 * * *',
      async () => {
        console.log('⏰ [M5] JOB_OVERDUE triggered');
        try {
          await runOverdueJob();
        } catch (e: any) {
          console.error('❌ JOB_OVERDUE Error:', e.message);
        }
      },
      { timezone: TZ },
    );

    // Job M5-2: Tính penalty hàng ngày — 00:05 GMT+7 (sau Job M5-1)
    cron.schedule(
      '5 0 * * *',
      async () => {
        console.log('⏰ [M5] JOB_PENALTY triggered');
        try {
          await runPenaltyJob();
        } catch (e: any) {
          console.error('❌ JOB_PENALTY Error:', e.message);
        }
      },
      { timezone: TZ },
    );

    // Job M5-3: Gửi cảnh báo sắp đến hạn — 07:00 GMT+7
    cron.schedule(
      '0 7 * * *',
      async () => {
        console.log('⏰ [M5] JOB_NOTIFY triggered');
        try {
          await runNotificationJob();
        } catch (e: any) {
          console.error('❌ JOB_NOTIFY Error:', e.message);
        }
      },
      { timezone: TZ },
    );

    // Job M5-4: Báo cáo hàng tuần - 08:00 Thứ 2
    cron.schedule(
      '0 8 * * 1',
      async () => {
        console.log('⏰ [M5] JOB_REPORT triggered');
        try {
          await runReportingJob();
        } catch (e: any) {
          console.error('❌ JOB_REPORT Error:', e.message);
        }
      },
      { timezone: TZ },
    );

    this.isInitialized = true;
    console.log('✅ Enterprise debt jobs scheduled (GMT+7): OVERDUE@00:01, PENALTY@00:05, NOTIFY@07:00');
  }
}

export default new CronManager();
