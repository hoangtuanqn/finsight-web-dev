import { Router } from 'express';
import {
  chatWithAgent,
  deleteSession,
  extractOcr,
  getSessionMessages,
  getSessions,
} from '../controllers/agentic.controller';
import { repaymentSetup } from '../controllers/repayment-setup.controller';
import { authenticate } from '../middleware/auth.middleware';
import { agenticRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// All agentic endpoints require authentication
router.use(authenticate);

// Rate limit: 20 requests/minute/user
router.use(agenticRateLimit);

// Routes
router.post('/chat', chatWithAgent);
router.post('/ocr', extractOcr);
router.post('/repayment-setup', repaymentSetup);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionMessages);
router.delete('/sessions/:id', deleteSession);

export default router;
