import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
console.log('--- Expense Router Loaded ---');

router.use(authenticate);

router.get('/stats', ExpenseController.getStats);
router.get('/categories', ExpenseController.getCategories);
router.post('/categories', ExpenseController.createCategory);
router.get('/', ExpenseController.getAll);
router.post('/', ExpenseController.create);
router.patch('/:id', ExpenseController.update);
router.delete('/:id', ExpenseController.delete);

export default router;
