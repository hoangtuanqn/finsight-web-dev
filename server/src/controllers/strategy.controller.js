import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { getOptimalAllocation } from '../services/portfolioOptimizer.service.js';
import { fetchFearGreedIndex } from '../services/market.service.js';

function shortUserId(userId) {
  return String(userId || 'unknown').slice(0, 8);
}

// ─── GET /investment/strategies ──────────────────────────────
export async function getMyStrategies(req, res) {
  try {
    const strategies = await prisma.aIStrategy.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, strategies);
  } catch (err) {
    console.error('getMyStrategies error:', err);
    return error(res, 'Internal server error');
  }
}

// ─── POST /investment/strategies/generate ────────────────────
export async function generateStrategy(req, res) {
  const startedAt = Date.now();
  try {
    // 1. Lấy user + profile + quota
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { investorProfile: true },
    });

    if (!user) return error(res, 'User not found', 404);

    // 2. Kiểm tra profile đầu tư
    if (!user.investorProfile) {
      console.info(`[InvestmentAdvisor] strategy-generate:missing-profile user=${shortUserId(req.userId)}`);
      return error(res, 'Vui lòng tạo hồ sơ đầu tư trước khi tạo chiến lược.', 400);
    }

    // 3. Kiểm tra quota
    if (user.strategyQuota <= 0) {
      console.info(`[InvestmentAdvisor] strategy-generate:no-quota user=${shortUserId(req.userId)}`);
      return error(res, 'Bạn đã hết lượt tạo chiến lược. Nâng cấp tài khoản để nhận thêm lượt.', 403);
    }

    console.info(
      `[InvestmentAdvisor] strategy-generate:start user=${shortUserId(req.userId)} risk=${user.investorProfile.riskLevel} quotaBefore=${user.strategyQuota}`
    );

    // 4. Lấy Fear & Greed Index hiện tại
    const sentiment = await fetchFearGreedIndex();
    const sentimentValue = sentiment.value ?? 50;

    // 5. Tính allocation bằng optimizer dựa trên profile + sentiment.
    const result = await getOptimalAllocation(user.investorProfile, sentimentValue);

    // 6. Lưu AIStrategy
    const strategy = await prisma.aIStrategy.create({
      data: {
        userId:        req.userId,
        sentimentValue,
        sentimentLabel: result.sentimentLabel,
        riskLevel:     user.investorProfile.riskLevel,
        savings:       result.savings,
        gold:          result.gold,
        stocks:        result.stocks,
        bonds:         result.bonds,
        crypto:        result.crypto,
        recommendation: result.recommendation,
      },
    });

    // 7. Trừ quota (atomic decrement)
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { strategyQuota: { decrement: 1 } },
      select: { strategyQuota: true },
    });

    console.info(
      `[InvestmentAdvisor] strategy-generate:complete user=${shortUserId(req.userId)} strategy=${strategy.id} sentiment=${sentimentValue} dataQuality=${result.optimization?.marketDataQuality || 'unknown'} quotaAfter=${updatedUser.strategyQuota} durationMs=${Date.now() - startedAt}`
    );

    return success(res, {
      strategy,
      remainingQuota: updatedUser.strategyQuota,
    }, 201);
  } catch (err) {
    console.error('generateStrategy error:', err);
    return error(res, 'Internal server error');
  }
}

// ─── GET /investment/portfolio ────────────────────────────────
export async function getMyPortfolio(req, res) {
  try {
    const portfolio = await prisma.userPortfolio.findUnique({
      where: { userId: req.userId },
      include: { sourceStrategy: true },
    });
    // trả null nếu chưa có — FE sẽ hiện empty state
    return success(res, portfolio);
  } catch (err) {
    console.error('getMyPortfolio error:', err);
    return error(res, 'Internal server error');
  }
}

// ─── POST /investment/portfolio ───────────────────────────────
// Tạo mới hoặc thay thế UserPortfolio (upsert)
export async function upsertPortfolio(req, res) {
  try {
    const { savings, gold, stocks, bonds, crypto, notes, sourceStrategyId } = req.body;

    // Validate: tổng phải = 100% (cho phép sai số 0.5%)
    const total = (savings || 0) + (gold || 0) + (stocks || 0) + (bonds || 0) + (crypto || 0);
    if (Math.abs(total - 100) > 0.5) {
      return error(res, `Tổng phân bổ phải bằng 100% (hiện tại: ${total.toFixed(1)}%)`, 400);
    }

    // Validate các giá trị không âm
    if ([savings, gold, stocks, bonds, crypto].some(v => v < 0)) {
      return error(res, 'Phân bổ không được âm', 400);
    }

    // Upsert — 1 record / user
    const portfolio = await prisma.userPortfolio.upsert({
      where: { userId: req.userId },
      update: {
        savings,
        gold,
        stocks,
        bonds,
        crypto,
        notes:            notes ?? null,
        sourceStrategyId: sourceStrategyId ?? null,
        updatedAt:        new Date(),
      },
      create: {
        userId:           req.userId,
        savings,
        gold,
        stocks,
        bonds,
        crypto,
        notes:            notes ?? null,
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

// ─── PUT /investment/portfolio ────────────────────────────────
// Chỉnh sửa % hoặc ghi chú của UserPortfolio hiện tại
export async function updatePortfolio(req, res) {
  try {
    const existing = await prisma.userPortfolio.findUnique({ where: { userId: req.userId } });
    if (!existing) {
      return error(res, 'Bạn chưa có danh mục đầu tư. Hãy tạo mới trước.', 404);
    }

    const { savings, gold, stocks, bonds, crypto, notes } = req.body;

    // Tính tổng từ giá trị mới (nếu có) hoặc giữ giá trị cũ
    const newSavings = savings ?? existing.savings;
    const newGold    = gold    ?? existing.gold;
    const newStocks  = stocks  ?? existing.stocks;
    const newBonds   = bonds   ?? existing.bonds;
    const newCrypto  = crypto  ?? existing.crypto;

    const total = newSavings + newGold + newStocks + newBonds + newCrypto;
    if (Math.abs(total - 100) > 0.5) {
      return error(res, `Tổng phân bổ phải bằng 100% (hiện tại: ${total.toFixed(1)}%)`, 400);
    }

    const portfolio = await prisma.userPortfolio.update({
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
