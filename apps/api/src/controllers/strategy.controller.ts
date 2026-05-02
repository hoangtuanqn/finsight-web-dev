import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { invalidateCache } from '../middleware/cache.middleware.js';
import { fetchFearGreedIndex } from '../services/market.service.js';
import { getOptimalAllocation } from '../services/portfolioOptimizer.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { error, success } from '../utils/apiResponse.js';
async function warmHistoricalDataCache(profile: any, userId: string) {
  try {
    // Pre-run optimizer in background to warm Redis hist:* keys from Yahoo Finance.
    // This way the next GET /allocation hits cache instead of fetching 5y history live.
    const sentiment = await fetchFearGreedIndex();
    await getOptimalAllocation(profile, sentiment.value, null, []);
    console.info(`[InvestmentAdvisor] hist-cache:warmed user=${shortUserId(userId)}`);
  } catch (err: any) {
    console.warn(`[InvestmentAdvisor] hist-cache:warm-failed user=${shortUserId(userId)} err=${err.message}`);
  }
}

function shortUserId(userId: string | undefined): string {
  return String(userId || 'unknown').slice(0, 8);
}

export async function getMyStrategies(req: AuthenticatedRequest, res: Response) {
  try {
    const strategies = await (prisma as any).aIStrategy.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, strategies);
  } catch (err) {
    console.error('getMyStrategies error:', err);
    return error(res, 'Internal server error');
  }
}

export async function generateStrategy(req: AuthenticatedRequest, res: Response) {
  const startedAt = Date.now();
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      include: { investorProfile: true },
    });

    if (!user) return error(res, 'User not found', 404);

    if (!user.investorProfile) {
      console.info(`[InvestmentAdvisor] strategy-generate:missing-profile user=${shortUserId(req.userId)}`);
      return error(res, 'Vui lòng tạo hồ sơ đầu tư trước khi tạo chiến lược.', 400);
    }

    if (user.strategyQuota <= 0) {
      console.info(`[InvestmentAdvisor] strategy-generate:no-quota user=${shortUserId(req.userId)}`);
      return error(res, 'Bạn đã hết lượt tạo chiến lược. Nâng cấp tài khoản để nhận thêm lượt.', 403);
    }

    console.info(
      `[InvestmentAdvisor] strategy-generate:start user=${shortUserId(req.userId)} risk=${user.investorProfile.riskLevel} quotaBefore=${user.strategyQuota}`,
    );

    const sentiment = await fetchFearGreedIndex();
    const sentimentValue = sentiment.value ?? 50;

    const EXCLUDABLE_ASSETS = ['gold', 'stocks', 'bonds', 'crypto'];
    const rawExcluded: string[] = Array.isArray(req.body.excludedAssets) ? req.body.excludedAssets : [];
    const excludedAssets = rawExcluded.filter((a) => EXCLUDABLE_ASSETS.includes(a));

    const result = await getOptimalAllocation(user.investorProfile, sentimentValue, null, excludedAssets);

    const strategy = await (prisma as any).aIStrategy.create({
      data: {
        userId: req.userId,
        sentimentValue,
        sentimentLabel: result.sentimentLabel,
        riskLevel:     user.investorProfile.riskLevel,
        savings:       result.savings,
        gold:          result.gold,
        stocks:        result.stocks,
        bonds:         result.bonds,
        crypto:        result.crypto,
        recommendation: result.recommendation,
        marketViews: result.marketViews,
      },
    });

    const updatedUser = await (prisma as any).user.update({
      where: { id: req.userId },
      data: { strategyQuota: { decrement: 1 } },
      select: { strategyQuota: true },
    });

    console.info(
      `[InvestmentAdvisor] strategy-generate:complete user=${shortUserId(req.userId)} strategy=${strategy.id} sentiment=${sentimentValue} dataQuality=${result.optimization?.marketDataQuality || 'unknown'} quotaAfter=${updatedUser.strategyQuota} durationMs=${Date.now() - startedAt}`,
    );

    invalidateCache([`investment:allocation:${req.userId}:*`]);

    // Fire-and-forget: pre-warm hist:* Redis keys so next GET /allocation is fast
    warmHistoricalDataCache(user.investorProfile, req.userId!);

    return success(
      res,
      {
        strategy,
        remainingQuota: updatedUser.strategyQuota,
      },
      201,
    );
  } catch (err) {
    console.error('generateStrategy error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getMyPortfolio(req: AuthenticatedRequest, res: Response) {
  try {
    const portfolio = await (prisma as any).userPortfolio.findUnique({
      where: { userId: req.userId },
      include: { sourceStrategy: true },
    });
    return success(res, portfolio);
  } catch (err) {
    console.error('getMyPortfolio error:', err);
    return error(res, 'Internal server error');
  }
}

export async function upsertPortfolio(req: AuthenticatedRequest, res: Response) {
  try {
    const { savings, gold, stocks, bonds, crypto, notes, sourceStrategyId } = req.body;

    const total = (savings || 0) + (gold || 0) + (stocks || 0) + (bonds || 0) + (crypto || 0);
    if (Math.abs(total - 100) > 0.5) {
      return error(res, `Tổng phân bổ phải bằng 100% (hiện tại: ${total.toFixed(1)}%)`, 400);
    }

    if ([savings, gold, stocks, bonds, crypto].some(v => v < 0)) {
      return error(res, 'Phân bổ không được âm', 400);
    }

    const portfolio = await (prisma as any).userPortfolio.upsert({
      where: { userId: req.userId },
      update: {
        savings,
        gold,
        stocks,
        bonds,
        crypto,
        notes: notes ?? null,
        sourceStrategyId: sourceStrategyId ?? null,
        updatedAt: new Date(),
      },
      create: {
        userId: req.userId,
        savings,
        gold,
        stocks,
        bonds,
        crypto,
        notes: notes ?? null,
        sourceStrategyId: sourceStrategyId ?? null,
      },
      include: { sourceStrategy: true },
    });

    return success(res, portfolio);
  } catch (err) {
    console.error('upsertPortfolio error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updatePortfolio(req: AuthenticatedRequest, res: Response) {
  try {
    const existing = await (prisma as any).userPortfolio.findUnique({ where: { userId: req.userId } });
    if (!existing) {
      return error(res, 'Bạn chưa có danh mục đầu tư. Hãy tạo mới trước.', 404);
    }

    const { savings, gold, stocks, bonds, crypto, notes } = req.body;

    const newSavings  = savings   ?? existing.savings;
    const newGold     = gold      ?? existing.gold;
    const newStocks   = stocks    ?? existing.stocks;
    const newBonds    = bonds     ?? existing.bonds;
    const newCrypto   = crypto    ?? existing.crypto;

    const total = newSavings + newGold + newStocks + newBonds + newCrypto;
    if (Math.abs(total - 100) > 0.5) {
      return error(res, `Tổng phân bổ phải bằng 100% (hiện tại: ${total.toFixed(1)}%)`, 400);
    }

    const portfolio = await (prisma as any).userPortfolio.update({
      where: { userId: req.userId },
      data: {
        savings: newSavings,
        gold:    newGold,
        stocks:  newStocks,
        bonds:   newBonds,
        crypto:  newCrypto,
        notes:   notes !== undefined ? notes : existing.notes,
      },
      include: { sourceStrategy: true },
    });

    return success(res, portfolio);
  } catch (err) {
    console.error('updatePortfolio error:', err);
    return error(res, 'Internal server error');
  }
}
