import { Router } from 'express';
import {
  getAllDebts, createDebt, getDebtById, updateDebt, deleteDebt, restoreDebt,
  logPayment, getRepaymentPlan, getEarAnalysis, getDtiAnalysis,
} from '../controllers/debt.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authSchemas } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/', getAllDebts);
router.post('/', validate(authSchemas.debt), createDebt);
router.get('/repayment-plan', getRepaymentPlan);
router.get('/ear-analysis', getEarAnalysis);
router.get('/dti', getDtiAnalysis);
router.get('/:id', getDebtById);
router.put('/:id', validate(authSchemas.debt), updateDebt);
router.delete('/:id', deleteDebt);
router.post('/:id/restore', restoreDebt);
router.post('/:id/payments', validate(authSchemas.payment), logPayment);

export default router;
