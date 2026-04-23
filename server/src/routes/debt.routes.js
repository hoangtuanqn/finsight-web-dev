import { Router } from 'express';
import {
  getAllDebts, createDebt, getDebtById, updateDebt, deleteDebt,
  logPayment, getRepaymentPlan, getEarAnalysis, getDtiAnalysis,
} from '../controllers/debt.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authSchemas } from '../utils/validationSchemas.js';

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
router.post('/:id/payments', logPayment);

export default router;
