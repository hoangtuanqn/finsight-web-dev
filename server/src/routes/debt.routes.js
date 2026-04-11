import { Router } from 'express';
import {
  getAllDebts, createDebt, getDebtById, updateDebt, deleteDebt,
  logPayment, getRepaymentPlan, getEarAnalysis,
} from '../controllers/debt.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getAllDebts);
router.post('/', createDebt);
router.get('/repayment-plan', getRepaymentPlan);
router.get('/ear-analysis', getEarAnalysis);
router.get('/:id', getDebtById);
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);
router.post('/:id/payments', logPayment);

export default router;
