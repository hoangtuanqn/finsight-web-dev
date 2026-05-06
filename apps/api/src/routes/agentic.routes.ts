import { Router } from 'express';
import multer from 'multer';
import {
  chatWithAgent,
  deleteSession,
  extractOcr,
  getSessionMessages,
  getSessions,
  transcribeVoice,
} from '../controllers/agentic.controller';
import { repaymentSetup } from '../controllers/repayment-setup.controller';
import { authenticate } from '../middleware/auth.middleware';
import { agenticRateLimit } from '../middleware/rateLimit.middleware';

const router = Router();

// Multer: memory storage for voice file uploads (max 10MB)
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file audio'));
  },
});

// All agentic endpoints require authentication
router.use(authenticate);

// Rate limit: 50 requests/minute/user
router.use(agenticRateLimit);

// Routes
router.post('/chat', chatWithAgent);
router.post('/ocr', extractOcr);
router.post('/voice', voiceUpload.single('audio'), transcribeVoice);
router.post('/repayment-setup', repaymentSetup);
router.get('/sessions', getSessions);
router.get('/sessions/:id', getSessionMessages);
router.delete('/sessions/:id', deleteSession);

export default router;
