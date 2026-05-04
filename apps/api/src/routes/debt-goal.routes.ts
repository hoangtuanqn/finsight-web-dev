import { Router } from 'express';
import { deleteDebtGoal, getDebtGoal, upsertDebtGoal } from '../controllers/debt-goal.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', getDebtGoal);
router.post('/', upsertDebtGoal);
router.delete('/', deleteDebtGoal);

export default router;
