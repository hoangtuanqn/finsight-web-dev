import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  getMyPlan,
  createInvoice,
  getInvoice,
  getTransactions,
  cancelInvoice,
  verifyMyPayment,
} from '../controllers/subscription.controller.js';

const router = Router();

router.use(authenticate);

router.get('/me', getMyPlan);
router.post('/invoice', createInvoice);
router.post('/verify', verifyMyPayment);
router.get('/invoice/:id', getInvoice);
router.get('/transactions', getTransactions);
router.post('/invoice/:id/cancel', cancelInvoice);

export default router;
