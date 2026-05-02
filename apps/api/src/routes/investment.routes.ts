import { Request, Router } from 'express';
import { getAllocationHistory, getAllocationRecommendation } from '../controllers/allocation.controller.js';
import {
  getBondsRates,
  getCryptoPrices,
  getGoldPrices,
  getSavingsRates,
  getStockPrices,
} from '../controllers/assetGuide.controller.js';
import { getAssetHistory } from '../controllers/assetHistory.controller.js';
import { createInvestorProfile, getInvestorProfile, updateInvestorProfile } from '../controllers/profile.controller.js';
import { submitRiskAssessment } from '../controllers/riskAssessment.controller.js';
import {
  generateStrategy,
  getMyPortfolio,
  getMyStrategies,
  updatePortfolio,
  upsertPortfolio,
} from '../controllers/strategy.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { cache } from '../middleware/cache.middleware.js';
import { AuthenticatedRequest } from '../types/index.js';

const TTL_10M = 10 * 60;

const router = Router();

router.use(authenticate);

router.get('/profile', getInvestorProfile);
router.post('/profile', createInvestorProfile);
router.put('/profile', updateInvestorProfile);

// Cache per-user vì kết quả phụ thuộc vào profile + excludedAssets
router.get(
  '/allocation',
  cache((req: Request) => {
    const r = req as AuthenticatedRequest;
    const excluded = (r.query.excludedAssets as string) || '';
    const mock = (r.query.mockSentiment as string) || '';
    return `investment:allocation:${r.userId}:${excluded}:${mock}`;
  }, TTL_10M),
  getAllocationRecommendation,
);

router.get('/history', getAllocationHistory);
router.post('/risk-assessment', submitRiskAssessment);

// Cache chung — giá thị trường không phụ thuộc user
router.get('/gold-prices', cache('investment:gold-prices', TTL_10M), getGoldPrices);
router.get(
  '/savings-rates',
  cache((req) => `investment:savings-rates:${req.query.riskLevel || 'MEDIUM'}`, TTL_10M),
  getSavingsRates,
);
router.get(
  '/bonds-rates',
  cache((req) => `investment:bonds-rates:${req.query.riskLevel || 'MEDIUM'}`, TTL_10M),
  getBondsRates,
);
router.get(
  '/stock-prices',
  cache((req) => `investment:stock-prices:${req.query.riskLevel || 'MEDIUM'}`, TTL_10M),
  getStockPrices,
);
router.get(
  '/crypto-prices',
  cache((req) => `investment:crypto-prices:${req.query.riskLevel || 'MEDIUM'}`, TTL_10M),
  getCryptoPrices,
);

router.get(
  '/asset-history',
  cache((req) => {
    const { asset, source, ticker, months, days } = req.query;
    return `investment:asset-history:${asset}:${source || ticker}:${months || days}`;
  }, TTL_10M),
  getAssetHistory,
);

// ── AI Strategy & User Portfolio ──
router.get('/strategies', getMyStrategies);
router.post('/strategies/generate', generateStrategy);
router.get('/portfolio', getMyPortfolio);
router.post('/portfolio', upsertPortfolio);
router.put('/portfolio', updatePortfolio);

export default router;
