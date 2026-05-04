import { Router } from 'express';
import { getJobLogs, runNotify, runOverdue, runPenalty, runReport } from '../../controllers/enterprise/job.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/run-overdue', runOverdue);
router.post('/run-penalty', runPenalty);
router.post('/run-notify', runNotify);
router.post('/run-report', runReport);
router.get('/logs', getJobLogs);

export default router;
