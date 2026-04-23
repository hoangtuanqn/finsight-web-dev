import cron from 'node-cron';
import { checkSepayPayments, expirePendingInvoices } from './jobs/payment.job.js';
import { checkExpiredSubscriptions } from './jobs/subscription.job.js';
import { checkDueDebtsAndDominoRisk } from './jobs/debt.job.js';
import { checkMarketSentimentChanges } from './jobs/market.job.js';

class CronManager {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;
    
    console.log('⏰ Initializing Background Cron Jobs Manager...');

    // Job 1: 10-second check for SePay payments
    setInterval(async () => {
      try {
        await checkSepayPayments();
      } catch (error) {
        console.error('❌ 10s SePay Cron Error:', error);
      }
    }, 10000);

    // Job 2: General Background Jobs (Every minute for Demo/Dev)
    cron.schedule('* * * * *', async () => {
      try {
        await Promise.allSettled([
          checkDueDebtsAndDominoRisk(),
          checkMarketSentimentChanges(),
          expirePendingInvoices()
        ]);
      } catch (error) {
        console.error('❌ Minute Cron Job Error:', error);
      }
    });

    // Job 2: Subscription Expiry (Daily at 00:05)
    cron.schedule('5 0 * * *', async () => {
      try {
        await checkExpiredSubscriptions();
      } catch (error) {
        console.error('❌ Subscription Expiry Cron Error:', error);
      }
    });

    this.isInitialized = true;
  }
}

export default new CronManager();
