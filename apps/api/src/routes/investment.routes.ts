import { Router } from 'express';
import {
  getInvestorProfile, createInvestorProfile, updateInvestorProfile,
  getAllocationRecommendation, getAllocationHistory, submitRiskAssessment,
  getCryptoPrices, getStockPrices, getGoldPrices, getSavingsRates, getBondsRates,
  getAssetHistory,
} from '../controllers/investment.controller';
import {
  getMyStrategies, generateStrategy,
  getMyPortfolio, upsertPortfolio, updatePortfolio,
} from '../controllers/strategy.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/profile', getInvestorProfile);
router.post('/profile', createInvestorProfile);
router.put('/profile', updateInvestorProfile);
router.get('/allocation', getAllocationRecommendation);
router.get('/history', getAllocationHistory);
router.post('/risk-assessment', submitRiskAssessment);
router.get('/crypto-prices', getCryptoPrices);
router.get('/stock-prices', getStockPrices);
router.get('/asset-history', getAssetHistory);
router.get('/gold-prices', getGoldPrices);
router.get('/savings-rates', getSavingsRates);
router.get('/bonds-rates', getBondsRates);

// ── AI Strategy & User Portfolio ──
router.get('/strategies', getMyStrategies);
router.post('/strategies/generate', generateStrategy);
router.get('/portfolio', getMyPortfolio);
router.post('/portfolio', upsertPortfolio);
router.put('/portfolio', updatePortfolio);

export default router;
