import { Router } from 'express';
import {
  getInvestorProfile, createInvestorProfile, updateInvestorProfile,
  getAllocationRecommendation, getAllocationHistory, submitRiskAssessment,
} from '../controllers/investment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getInvestorProfile);
router.post('/profile', createInvestorProfile);
router.put('/profile', updateInvestorProfile);
router.get('/allocation', getAllocationRecommendation);
router.get('/history', getAllocationHistory);
router.post('/risk-assessment', submitRiskAssessment);

export default router;
