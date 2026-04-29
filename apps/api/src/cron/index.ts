import cron from 'node-cron';
import { checkSepayPayments, expirePendingInvoices } from './jobs/payment.job';
import { syncAllBankWallets } from './jobs/wallet-sync.job';
import { checkExpiredSubscriptions } from './jobs/subscription.job';
import { checkDueDebtsAndDominoRisk, purgeSoftDeletedDebts } from './jobs/debt.job';
import { checkMarketSentimentChanges } from './jobs/market.job';
import { processReferralRewards } from './jobs/referral-reward.job';

class CronManager {
  private isInitialized = false;

  init() {
    if (this.isInitialized) return;
    console.log('⏰ Initializing Background Cron Jobs Manager...');

    // Job 1: Kiểm tra thanh toán subscription (10s)
    setInterval(async () => {
      try { await checkSepayPayments(); } catch (e: any) {
        console.error('❌ Payment Cron Error:', e.message);
      }
    }, 10_000);

    // Job 2: Đồng bộ số dư & giao dịch ví ngân hàng — realtime (10s)
    setInterval(async () => {
      try { await syncAllBankWallets(); } catch (e: any) {
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
        await Promise.allSettled([
          checkExpiredSubscriptions(),
          purgeSoftDeletedDebts(),
        ]);
      } catch (e: any) {
        console.error('❌ Daily Maintenance Cron Error:', e.message);
      }
    });

    this.isInitialized = true;
  }
}

export default new CronManager();
