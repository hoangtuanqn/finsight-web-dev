import { Router } from 'express';
import { getDebtGoal, upsertDebtGoal, deleteDebtGoal } from '../controllers/debt-goal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.get('/', getDebtGoal);
router.post('/', upsertDebtGoal);
router.delete('/', deleteDebtGoal);

export default router;
