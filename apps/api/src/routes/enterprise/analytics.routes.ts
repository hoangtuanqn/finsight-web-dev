import { Router } from 'express';
import { AnalyticsController } from '../../controllers/enterprise/analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

router.get('/summary', controller.getSummary);
router.get('/aging', controller.getAgingReport);
router.get('/cash-flow', controller.getCashFlow);
router.get('/action-items', controller.getActionItems);

export default router;
