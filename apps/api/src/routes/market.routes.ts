import { Router } from 'express';
import {
  getCryptoPricesHandler,
  getGoldPriceHandler,
  getMarketSummary,
  getNews,
  getPrices,
  getSentiment,
} from '../controllers/market.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/sentiment', getSentiment);
router.get('/prices', getPrices);
router.get('/prices/crypto', getCryptoPricesHandler);
router.get('/prices/gold', getGoldPriceHandler);
router.get('/news', getNews);
router.get('/summary', getMarketSummary);

export default router;
