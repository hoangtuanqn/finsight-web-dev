import { Response } from 'express';
import { ASSET_CLASSES } from '../constants/investmentConstants';
import prisma from '../lib/prisma';
import { fetchFearGreedIndex } from '../services/market.service';
import { buildBackwardCompatibleProjection, generateProjectionTable } from '../services/monteCarloSimulation.service';
import { getOptimalAllocation } from '../services/portfolioOptimizer.service';
import { buildRiskMetrics } from '../services/riskMetrics.service';
import { runStressTests } from '../services/stressTest.service';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

function shortUserId(userId: string | undefined): string {
  return String(userId || 'unknown').slice(0, 8);
}

export async function getAllocationRecommendation(req: AuthenticatedRequest, res: Response) {
  const startedAt = Date.now();
  try {
    const profile = await (prisma as any).investorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      console.info(`[InvestmentAdvisor] allocation:missing-profile user=${shortUserId(req.userId)}`);
      return error(res, 'Please create your investor profile first', 400);
    }

    console.info(
      `[InvestmentAdvisor] allocation:start user=${shortUserId(req.userId)} risk=${profile.riskLevel} horizon=${profile.horizon} mockSentiment=${req.query.mockSentiment ?? 'none'}`,
    );

    const mockSentiment = req.query.mockSentiment;
    let sentimentValue: number;

    if (mockSentiment !== undefined) {
      sentimentValue = parseInt(mockSentiment as string);
    } else {
      const sentiment = await fetchFearGreedIndex();
      sentimentValue = sentiment.value;
    }

    const EXCLUDABLE_ASSETS = ['gold', 'stocks', 'stocks_us', 'bonds', 'crypto'];
    const rawExcluded = req.query.excludedAssets as string | undefined;
    const excludedAssets = rawExcluded
      ? rawExcluded
          .split(',')
          .map((s) => s.trim())
          .filter((s) => EXCLUDABLE_ASSETS.includes(s))
      : [];

    const allocation = await getOptimalAllocation(profile, sentimentValue, null, excludedAssets);

    await (prisma as any).allocation.create({
      data: {
        profileId: profile.id,
        sentimentValue,
        sentimentLabel: allocation.sentimentLabel,
        savings: allocation.savings,
        gold: allocation.gold,
        stocks: allocation.stocks,
        stocks_us: allocation.stocks_us || 0,
        bonds: allocation.bonds,
        crypto: allocation.crypto,
        recommendation: allocation.recommendation,
      },
    });

    const portfolioBreakdown = [
      { asset: 'Tiết kiệm', percentage: allocation.savings, amount: (profile.capital * allocation.savings) / 100 },
      { asset: 'Vàng', percentage: allocation.gold, amount: (profile.capital * allocation.gold) / 100 },
      { asset: 'Cổ phiếu VN', percentage: allocation.stocks, amount: (profile.capital * allocation.stocks) / 100 },
      {
        asset: 'Cổ phiếu Mỹ',
        percentage: allocation.stocks_us || 0,
        amount: (profile.capital * (allocation.stocks_us || 0)) / 100,
      },
      { asset: 'Trái phiếu', percentage: allocation.bonds, amount: (profile.capital * allocation.bonds) / 100 },
      { asset: 'Crypto', percentage: allocation.crypto, amount: (profile.capital * allocation.crypto) / 100 },
    ];

    const inflationRate = profile.inflationRate !== undefined ? profile.inflationRate / 100 : 0.035;
    const projectionTable = generateProjectionTable({
      capital: profile.capital ?? 0,
      monthlyAdd: profile.monthlyAdd ?? 0,
      weights: allocation.weights,
      means: allocation.marketParams.means.map((mean: number) => mean - inflationRate),
      covMatrix: allocation.marketParams.covMatrix,
      capturePaths: true,
      pathSampleSize: 500,
    });
    const projection = buildBackwardCompatibleProjection(projectionTable);
    const riskMetrics = buildRiskMetrics({
      weights: allocation.weights,
      marketParams: allocation.marketParams,
      simResults: projectionTable['1y'].results,
      simPaths: projectionTable['10y'].samplePaths,
      capital: profile.capital ?? 0,
      profile,
      projectionTable,
    });

    const stressTests = runStressTests(allocation.weights, profile.capital ?? 0);

    console.info(
      `[InvestmentAdvisor] allocation:complete user=${shortUserId(req.userId)} sentiment=${sentimentValue} method=${allocation.optimizationMethod} dataQuality=${allocation.optimization?.marketDataQuality || 'unknown'} riskGrade=${riskMetrics.riskGrade} durationMs=${Date.now() - startedAt}`,
    );

    return success(res, {
      allocation: {
        savings: allocation.savings,
        gold: allocation.gold,
        stocks: allocation.stocks,
        stocks_us: allocation.stocks_us || 0,
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
      riskMetrics,
      stressTests,
      optimizationMethod: allocation.optimizationMethod,
      optimization: allocation.optimization,
      allocationMetrics: allocation.metrics,
      cryptoWarning:
        allocation.crypto > 0
          ? `Crypto (${allocation.crypto}% danh mục) có thể dao động từ ${ASSET_CLASSES.crypto.bearCase * 100}% đến +${ASSET_CLASSES.crypto.bullCase * 100}% — không có lợi nhuận kỳ vọng ổn định. Chỉ đầu tư phần vốn chấp nhận mất hoàn toàn.`
          : null,
    });
  } catch (err) {
    console.error('getAllocationRecommendation error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getAllocationHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const profile = await (prisma as any).investorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      console.info(`[InvestmentAdvisor] allocation-history:no-profile user=${shortUserId(req.userId)}`);
      return success(res, { allocations: [] });
    }

    const allocations = await (prisma as any).allocation.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    console.info(
      `[InvestmentAdvisor] allocation-history:list user=${shortUserId(req.userId)} count=${allocations.length}`,
    );
    return success(res, { allocations });
  } catch (err) {
    console.error('getAllocationHistory error:', err);
    return error(res, 'Internal server error');
  }
}
