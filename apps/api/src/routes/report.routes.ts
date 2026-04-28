import { Router } from 'express';
import { exportReport } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/export', authenticate, exportReport);

export default router;
