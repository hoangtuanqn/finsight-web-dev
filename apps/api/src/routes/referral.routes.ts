import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getBanks,
  getAffiliateStats,
  getCommissionHistory,
  getBankAccounts,
  addBankAccount,
  setDefaultBankAccount,
  deleteBankAccount,
  requestWithdrawal,
  getWithdrawalHistory,
} from '../controllers/affiliate.controller';
import { ReferralController } from '../controllers/referral.controller';

const router = Router();

router.get('/click/:code', (req: any, res: any) => ReferralController.trackClick(req, res));

router.use(authenticate);

router.get('/stats', (req: any, res: any) => getAffiliateStats(req, res));
router.get('/commissions', (req: any, res: any) => getCommissionHistory(req, res));
router.get('/banks', (req: any, res: any) => getBanks(req, res));
router.get('/bank-accounts', (req: any, res: any) => getBankAccounts(req, res));
router.post('/bank-accounts', (req: any, res: any) => addBankAccount(req, res));
router.patch('/bank-accounts/:id/default', (req: any, res: any) => setDefaultBankAccount(req, res));
router.delete('/bank-accounts/:id', (req: any, res: any) => deleteBankAccount(req, res));
router.post('/withdraw', (req: any, res: any) => requestWithdrawal(req, res));
router.get('/withdrawals', (req: any, res: any) => getWithdrawalHistory(req, res));

export default router;
