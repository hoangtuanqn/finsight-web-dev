import { Router } from 'express';
import {
  cancelInvoice,
  createInvoice,
  getInvoice,
  getMyPlan,
  getTransactions,
  verifyMyPayment,
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/me', getMyPlan);
router.post('/invoice', createInvoice);
router.post('/verify', verifyMyPayment);
router.get('/invoice/:id', getInvoice);
router.get('/transactions', getTransactions);
router.post('/invoice/:id/cancel', cancelInvoice);

export default router;
