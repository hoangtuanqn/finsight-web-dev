import { Router } from 'express';
import { calculateSimulation, commitPlan } from '../../controllers/enterprise/repaymentPlanner.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/v1/enterprise/repayment-planner/simulate
 * @desc Get a simulation result based on budget and strategy
 */
router.post('/simulate', calculateSimulation);

/**
 * @route POST /api/v1/enterprise/repayment-planner/commit
 * @desc Save a simulation result as a committed plan
 */
router.post('/commit', commitPlan);

export default router;
