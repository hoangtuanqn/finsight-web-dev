import { Router } from 'express';
import {
  createRepaymentPlan,
  deleteRepaymentPlan,
  getRepaymentPlanById,
  getRepaymentPlans,
  simulateRepaymentPlan,
  updateRepaymentPlan,
} from '../controllers/repayment-plan.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getRepaymentPlans);
router.post('/', createRepaymentPlan);
router.post('/simulate', simulateRepaymentPlan);
router.get('/:id', getRepaymentPlanById);
router.put('/:id', updateRepaymentPlan);
router.delete('/:id', deleteRepaymentPlan);

export default router;
