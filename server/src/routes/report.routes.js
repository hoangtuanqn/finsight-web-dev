import { Router } from 'express';
import { exportReport } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/export', authenticate, exportReport);

export default router;
