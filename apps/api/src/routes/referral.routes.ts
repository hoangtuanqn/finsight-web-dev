import { Router } from 'express';
import { ReferralController } from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Route public để track click
router.get('/click/:code', (req: any, res: any) => ReferralController.trackClick(req, res));

// Route private cho dashboard
router.get('/stats', authenticate, (req: any, res: any) => ReferralController.getMyStats(req, res));

export default router;
