import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { getAllocation } from '../utils/calculations.js';
import { fetchFearGreedIndex } from '../services/market.service.js';

export async function getInvestorProfile(req, res) {
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: req.userId } });
    return success(res, { investorProfile: profile });
  } catch (err) {
    console.error('getInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createInvestorProfile(req, res) {
  try {
    const { capital, monthlyAdd, goal, horizon, riskLevel, riskScore } = req.body;
    const profile = await prisma.investorProfile.upsert({
      where: { userId: req.userId },
      update: { capital, monthlyAdd, goal, horizon, riskLevel, riskScore, lastUpdated: new Date() },
      create: { userId: req.userId, capital, monthlyAdd, goal, horizon, riskLevel, riskScore },
    });
    return success(res, { investorProfile: profile }, 201);
  } catch (err) {
    console.error('createInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateInvestorProfile(req, res) {
  try {
    const data = { ...req.body, lastUpdated: new Date() };
    const profile = await prisma.investorProfile.update({
      where: { userId: req.userId },
      data,
    });
    return success(res, { investorProfile: profile });
  } catch (err) {
    console.error('updateInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getAllocationRecommendation(req, res) {
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      return error(res, 'Please create your investor profile first', 400);
    }

    // Check for mock override
    const mockSentiment = req.query.mockSentiment;
    let sentimentValue;

    if (mockSentiment !== undefined) {
      sentimentValue = parseInt(mockSentiment);
    } else {
      const sentiment = await fetchFearGreedIndex();
      sentimentValue = sentiment.value;
    }

    const allocation = getAllocation(profile.riskLevel, sentimentValue);

    // Save allocation history
    await prisma.allocation.create({
      data: {
        profileId: profile.id,
        sentimentValue,
        sentimentLabel: allocation.sentimentLabel,
        savings: allocation.savings,
        gold: allocation.gold,
        stocks: allocation.stocks,
        bonds: allocation.bonds,
        crypto: allocation.crypto,
        recommendation: allocation.recommendation,
      },
    });

    // Calculate portfolio breakdown
    const portfolioBreakdown = [
      { asset: 'Tiết kiệm', percentage: allocation.savings, amount: profile.capital * allocation.savings / 100 },
      { asset: 'Vàng', percentage: allocation.gold, amount: profile.capital * allocation.gold / 100 },
      { asset: 'Chứng khoán', percentage: allocation.stocks, amount: profile.capital * allocation.stocks / 100 },
      { asset: 'Trái phiếu', percentage: allocation.bonds, amount: profile.capital * allocation.bonds / 100 },
      { asset: 'Crypto', percentage: allocation.crypto, amount: profile.capital * allocation.crypto / 100 },
    ];

    // Simple projection estimates
    const rates = { savings: 0.06, gold: 0.08, stocks: 0.12, bonds: 0.07, crypto: 0.15 };
    const weightedReturn = (allocation.savings * rates.savings + allocation.gold * rates.gold +
      allocation.stocks * rates.stocks + allocation.bonds * rates.bonds +
      allocation.crypto * rates.crypto) / 100;

    const projection = {};
    for (const years of [1, 3, 5, 10]) {
      const fv = profile.capital * Math.pow(1 + weightedReturn, years) +
        profile.monthlyAdd * 12 * ((Math.pow(1 + weightedReturn, years) - 1) / weightedReturn);
      projection[`${years}y`] = Math.round(fv);
    }

    return success(res, {
      allocation: {
        savings: allocation.savings,
        gold: allocation.gold,
        stocks: allocation.stocks,
        bonds: allocation.bonds,
        crypto: allocation.crypto,
      },
      sentimentData: {
        value: sentimentValue,
        label: allocation.sentimentLabel,
        labelVi: allocation.sentimentVietnamese,
      },
      recommendation: allocation.recommendation,
      portfolioBreakdown,
      projection,
    });
  } catch (err) {
    console.error('getAllocationRecommendation error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getAllocationHistory(req, res) {
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) return success(res, { allocations: [] });

    const allocations = await prisma.allocation.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return success(res, { allocations });
  } catch (err) {
    console.error('getAllocationHistory error:', err);
    return error(res, 'Internal server error');
  }
}

export async function submitRiskAssessment(req, res) {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return error(res, 'Answers are required', 400);
    }

    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
    const avgScore = Math.round(totalScore / answers.length);

    let riskLevel = 'LOW';
    let riskDescription = 'Bạn ưu tiên bảo toàn vốn. Phân bổ tập trung vào tiết kiệm và vàng.';
    if (avgScore > 60) {
      riskLevel = 'HIGH';
      riskDescription = 'Bạn sẵn sàng chấp nhận rủi ro cao để tối đa hóa lợi nhuận. Phân bổ nhiều vào chứng khoán và crypto.';
    } else if (avgScore > 30) {
      riskLevel = 'MEDIUM';
      riskDescription = 'Bạn chấp nhận rủi ro vừa phải. Phân bổ cân bằng giữa các kênh đầu tư.';
    }

    // Update or create investor profile
    await prisma.investorProfile.upsert({
      where: { userId: req.userId },
      update: { riskScore: avgScore, riskLevel, lastUpdated: new Date() },
      create: { userId: req.userId, riskScore: avgScore, riskLevel },
    });

    return success(res, { riskScore: avgScore, riskLevel, riskDescription });
  } catch (err) {
    console.error('submitRiskAssessment error:', err);
    return error(res, 'Internal server error');
  }
}
