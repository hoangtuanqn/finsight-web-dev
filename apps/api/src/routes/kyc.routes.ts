import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { getKycStatus, submitKyc } from '../controllers/kyc.controller';

const router = Router();

// Multer memory storage (we send the buffer directly to FPT.AI)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max for video
  },
});

router.use(authenticate);

router.get('/status', (req: any, res: any) => getKycStatus(req, res));

router.post(
  '/submit',
  upload.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  (req: any, res: any) => submitKyc(req, res)
);

export default router;
