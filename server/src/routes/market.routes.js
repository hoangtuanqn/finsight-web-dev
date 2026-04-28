import { Router } from 'express';
import { getSentiment, getPrices, getNews, getMarketSummary } from '../controllers/market.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/sentiment', getSentiment);
router.get('/prices', getPrices);
router.get('/news', getNews);
router.get('/summary', getMarketSummary);

export default router;
