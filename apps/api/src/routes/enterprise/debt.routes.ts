import { Router } from 'express';
import {
  activateDebt,
  createDebt,
  disputeDebt,
  getDebt,
  getDebtAuditLogs,
  getDebts,
  recordPayment,
  resolveDispute,
  reverseTransaction,
  updateDebt,
  writeOffDebt,
} from '../../controllers/enterprise/debt.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createDebt);
router.get('/', getDebts);
router.get('/:id', getDebt);
router.patch('/:id', updateDebt);
router.get('/:id/audit-logs', getDebtAuditLogs);

// Transactions — specific route must come before parameterised /:id/transactions
router.post('/transactions/:transactionId/reverse', reverseTransaction);
router.post('/:id/transactions', recordPayment);

// Status management
router.patch('/:id/activate', activateDebt);
router.patch('/:id/dispute', disputeDebt);
router.patch('/:id/resolve', resolveDispute);
router.patch('/:id/write-off', writeOffDebt);

export default router;
