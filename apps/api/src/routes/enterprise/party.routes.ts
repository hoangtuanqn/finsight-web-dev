import { Router } from 'express';
import {
  createParty,
  getAuditLogs,
  getParties,
  getParty,
  toggleStatus,
  updateParty,
} from '../../controllers/enterprise/party.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createParty);
router.get('/', getParties);
router.get('/:id', getParty);
router.get('/:id/audit', getAuditLogs);
router.patch('/:id', updateParty);
router.post('/:id/status', toggleStatus);

export default router;
