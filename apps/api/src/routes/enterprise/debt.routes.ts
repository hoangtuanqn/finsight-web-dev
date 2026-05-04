import { Router } from 'express';
import { createDebt, getDebt, getDebts } from '../../controllers/enterprise/debt.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createDebt);
router.get('/', getDebts);
router.get('/:id', getDebt);

export default router;
