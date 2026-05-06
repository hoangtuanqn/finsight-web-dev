import { Router } from 'express';
import {
  calculateSimulation,
  commitPlan,
  getEligibleDebts,
  getExecutionReport,
} from '../../controllers/enterprise/repaymentPlanner.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/enterprise/repayment-planner/eligible-debts
 * @desc Get all debts eligible for repayment planning
 */
router.get('/eligible-debts', getEligibleDebts);

/**
 * @route POST /api/v1/enterprise/repayment-planner/simulate
 * @desc Get a simulation result based on budget and strategy
 */
router.post('/simulate', calculateSimulation);

router.post('/commit', commitPlan);

/**
 * @route GET /api/v1/enterprise/repayment-planner/execution-report
 * @desc Get a report comparing committed plan vs actual payments
 */
router.get('/execution-report', getExecutionReport);

export default router;
