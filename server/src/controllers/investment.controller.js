import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { getOptimalAllocation } from '../services/portfolioOptimizer.service.js';
import {
  buildBackwardCompatibleProjection,
  generateProjectionTable,
} from '../services/monteCarloSimulation.service.js';
import { buildRiskMetrics } from '../services/riskMetrics.service.js';
import { fetchAssetHistory } from '../services/historicalData.service.js';
import { fetchFearGreedIndex } from '../services/market.service.js';
import { ASSET_CLASSES, RISK_CONFIG } from '../constants/investmentConstants.js';

function shortUserId(userId) {
  return String(userId || 'unknown').slice(0, 8);
}

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
    const { capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate } = req.body;
    const profile = await prisma.investorProfile.upsert({
      where: { userId: req.userId },
      update: { capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate, lastUpdated: new Date() },
      create: { userId: req.userId, capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate },
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
  const startedAt = Date.now();
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      console.info(`[InvestmentAdvisor] allocation:missing-profile user=${shortUserId(req.userId)}`);
      return error(res, 'Please create your investor profile first', 400);
    }

    console.info(
      `[InvestmentAdvisor] allocation:start user=${shortUserId(req.userId)} risk=${profile.riskLevel} horizon=${profile.horizon} mockSentiment=${req.query.mockSentiment ?? 'none'}`
    );

    // Check for mock override
    const mockSentiment = req.query.mockSentiment;
    let sentimentValue;

    if (mockSentiment !== undefined) {
      sentimentValue = parseInt(mockSentiment);
    } else {
      const sentiment = await fetchFearGreedIndex();
      sentimentValue = sentiment.value;
    }

    // Markowitz Mean-Variance Optimization is the runtime allocation engine.
    const allocation = await getOptimalAllocation(profile, sentimentValue);

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

    // [LEGACY] Projection cũ dùng ASSET_CLASSES + calcFV(realReturn),
    // optimistic = weightedReturn * 1.3, pessimistic = weightedReturn * 0.5.
    // Replaced by Monte Carlo percentiles using the same market params as MVO.
    const inflationRate = profile.inflationRate !== undefined ? profile.inflationRate / 100 : 0.035;
    const projectionTable = generateProjectionTable({
      capital: profile.capital ?? 0,
      monthlyAdd: profile.monthlyAdd ?? 0,
      weights: allocation.weights,
      means: allocation.marketParams.means.map(mean => mean - inflationRate),
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

    console.info(
      `[InvestmentAdvisor] allocation:complete user=${shortUserId(req.userId)} sentiment=${sentimentValue} method=${allocation.optimizationMethod} dataQuality=${allocation.optimization?.marketDataQuality || 'unknown'} riskGrade=${riskMetrics.riskGrade} durationMs=${Date.now() - startedAt}`
    );

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
      riskMetrics,
      optimizationMethod: allocation.optimizationMethod,
      optimization: allocation.optimization,
      allocationMetrics: allocation.metrics,
      // Cảnh báo crypto nếu có phân bổ vào crypto — vì không có expected return ổn định
      cryptoWarning: allocation.crypto > 0
        ? `Crypto (${allocation.crypto}% danh mục) có thể dao động từ ${ASSET_CLASSES.crypto.bearCase * 100}% đến +${ASSET_CLASSES.crypto.bullCase * 100}% — không có lợi nhuận kỳ vọng ổn định. Chỉ đầu tư phần vốn chấp nhận mất hoàn toàn.`
        : null,
    });
  } catch (err) {
    console.error('getAllocationRecommendation error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getAllocationHistory(req, res) {
  try {
    const profile = await prisma.investorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      console.info(`[InvestmentAdvisor] allocation-history:no-profile user=${shortUserId(req.userId)}`);
      return success(res, { allocations: [] });
    }

    const allocations = await prisma.allocation.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    console.info(`[InvestmentAdvisor] allocation-history:list user=${shortUserId(req.userId)} count=${allocations.length}`);
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

    // Weighted scoring: câu hỏi hành vi thực tế quan trọng hơn câu hỏi thái độ
    // answers[i].id = 'q1'...'q5', answers[i].score = 0-100
    const weights = RISK_CONFIG.questionWeights; // { q1:1.0, q2:1.5, q3:2.0, q4:1.5, q5:1.0 }
    let weightedSum = 0, totalWeight = 0;
    answers.forEach((a, i) => {
      const qId = a.id || `q${i + 1}`;
      const w = weights[qId] ?? 1.0;
      weightedSum += (a.score || 0) * w;
      totalWeight += w;
    });
    const avgScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(answers.reduce((s, a) => s + (a.score || 0), 0) / answers.length);

    // Risk level dùng ngưỡng từ RISK_CONFIG (score >= 65 → HIGH, >= 40 → MEDIUM, còn lại → LOW)
    let riskLevel = 'LOW';
    let riskDescription = 'Bạn ưu tiên bảo toàn vốn. Phân bổ tập trung vào tiết kiệm và vàng.';
    if (avgScore >= RISK_CONFIG.thresholds.HIGH) {
      riskLevel = 'HIGH';
      riskDescription = 'Bạn sẵn sàng chấp nhận rủi ro cao để tối đa hóa lợi nhuận. Phân bổ nhiều vào chứng khoán và crypto.';
    } else if (avgScore >= RISK_CONFIG.thresholds.MEDIUM) {
      riskLevel = 'MEDIUM';
      riskDescription = 'Bạn chấp nhận rủi ro vừa phải. Phân bổ cân bằng giữa các kênh đầu tư.';
    }

    // Consistency check cơ bản: cảnh báo nếu câu trả lời có độ phân tán cao
    const scores = answers.map(a => a.score || 0);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length);
    const consistencyWarning = stdDev > 30
      ? 'Câu trả lời của bạn có độ phân tán cao — một số câu mâu thuẫn nhau. Kết quả đã được xử lý theo trọng số để phản ánh tốt hơn.'
      : null;

    // Update or create investor profile
    await prisma.investorProfile.upsert({
      where: { userId: req.userId },
      update: { riskScore: avgScore, riskLevel, lastUpdated: new Date() },
      create: { userId: req.userId, riskScore: avgScore, riskLevel },
    });

    return success(res, { riskScore: avgScore, riskLevel, riskDescription, consistencyWarning });
  } catch (err) {
    console.error('submitRiskAssessment error:', err);
    return error(res, 'Internal server error');
  }
}

// ─── Bonds Rates ──────────────────────────────────────────────────────────────
// Cập nhật: 23/04/2026
const BONDS_DATA = {
  updatedAt: '2026-04-23',
  govBonds: [
    { term: '2 năm',  rate: 5.20, liquidity: 'Cao',    risk: 'Rất thấp', badge: 'Ngắn hạn',  badgeColor: 'blue'    },
    { term: '3 năm',  rate: 5.50, liquidity: 'Cao',    risk: 'Rất thấp', badge: 'Phổ biến',  badgeColor: 'purple'  },
    { term: '5 năm',  rate: 5.80, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Khuyên dùng', badgeColor: 'purple' },
    { term: '10 năm', rate: 6.20, liquidity: 'Thấp',   risk: 'Thấp',    badge: 'Lãi cao',    badgeColor: 'emerald' },
    { term: '15 năm', rate: 6.40, liquidity: 'Thấp',   risk: 'Thấp',    badge: '',           badgeColor: ''        },
  ],
  bondFunds: [
    { name: 'Quỹ VCBF-BCF',    manager: 'Vietcombank AM', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Uy tín',    badgeColor: 'blue',    note: 'Danh mục TPCP + TP ngân hàng, quản lý chuyên nghiệp' },
    { name: 'Quỹ SSISCA',      manager: 'SSI AM',         returnEst: '6.5-7.5', minInvest: '1 triệu', badge: 'Tốt nhất',  badgeColor: 'amber',   note: 'Lợi nhuận ổn định, đa dạng TP doanh nghiệp uy tín' },
    { name: 'Quỹ MBBOND',      manager: 'MB Capital',     returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Tiện lợi',  badgeColor: 'blue',    note: 'Mua qua app MBBank, phí thấp, rút linh hoạt' },
    { name: 'Quỹ TCBF',        manager: 'Techcom Capital', returnEst: '6.0-6.8', minInvest: '1 triệu', badge: '',         badgeColor: '',        note: 'Mua qua Techcombank, tích hợp sẵn trong app' },
  ],
};

let bondsCache = { us10y: null, fetchedAt: 0 };
const BONDS_CACHE_TTL = 30 * 60 * 1000; // 30 phút (bond yield ít thay đổi)

export async function getBondsRates(req, res) {
  try {
    const riskLevel = req.query.riskLevel || 'MEDIUM';
    const now = Date.now();

    // Lấy US 10Y Treasury yield làm tham chiếu lãi suất toàn cầu
    let us10y = bondsCache.us10y;
    if (!us10y || now - bondsCache.fetchedAt > BONDS_CACHE_TTL) {
      try {
        const r = await fetch(
          'https://query2.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=1d',
          { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
        );
        const j = await r.json();
        const meta = j?.chart?.result?.[0]?.meta;
        us10y = {
          rate:      meta?.regularMarketPrice ?? 0,
          prevClose: meta?.chartPreviousClose ?? 0,
        };
        bondsCache = { us10y, fetchedAt: now };
      } catch {
        us10y = bondsCache.us10y || { rate: 4.4, prevClose: 4.4 };
      }
    }

    const us10yChange = us10y.prevClose > 0
      ? us10y.rate - us10y.prevClose : 0;

    // Gợi ý kỳ hạn TPCP theo riskLevel
    const preferTerms = {
      LOW:    ['10 năm', '15 năm', '5 năm'],
      MEDIUM: ['5 năm',  '3 năm',  '2 năm'],
      HIGH:   ['2 năm',  '3 năm',  '5 năm'],
    }[riskLevel];

    const sortedGov = [...BONDS_DATA.govBonds].sort((a, b) => {
      const ai = preferTerms.indexOf(a.term);
      const bi = preferTerms.indexOf(b.term);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    // Build items: TPCP + Quỹ TP
    const bondItems = [
      // US 10Y là reference toàn cầu
      {
        id: 'us10y',
        name: 'US Treasury 10Y (tham chiếu)',
        tag: 'Lãi suất toàn cầu',
        historySource: { asset: 'bonds', source: 'us10y' },
        rate: us10y.rate,
        rateLabel: `${us10y.rate.toFixed(2)}%`,
        change: us10yChange,
        note: `Lãi suất tham chiếu quốc tế · ${us10yChange >= 0 ? '📈 tăng' : '📉 giảm'} ${Math.abs(us10yChange).toFixed(2)}% hôm nay · Ảnh hưởng đến TP toàn thị trường`,
        badge: 'Tham chiếu',
        badgeColor: 'blue',
        highlight: true,
      },
      // TPCP Việt Nam theo kỳ hạn ưu tiên
      ...sortedGov.slice(0, 3).map((g, i) => ({
        id: `gov_${g.term}`,
        name: `Trái phiếu Chính phủ ${g.term}`,
        tag: `TPCP · ${g.liquidity} · Rủi ro ${g.risk}`,
        rate: g.rate,
        rateLabel: `${g.rate.toFixed(2)}%/năm`,
        change: null,
        note: `Phát hành qua HNX · thanh khoản ${g.liquidity.toLowerCase()} · mua qua TCBS, SSI, MBBank tối thiểu 100k`,
        badge: i === 0 ? 'Ưu tiên' : g.badge,
        badgeColor: i === 0 ? 'amber' : g.badgeColor,
      })),
      // Quỹ trái phiếu
      ...BONDS_DATA.bondFunds.slice(0, 2).map(f => ({
        id: f.name,
        name: f.name,
        tag: `Quỹ · ${f.manager}`,
        rate: null,
        rateLabel: `~${f.returnEst}%/năm`,
        change: null,
        note: `${f.note} · Đầu tư từ ${f.minInvest}`,
        badge: f.badge,
        badgeColor: f.badgeColor,
      })),
    ];

    // Nhận xét về môi trường lãi suất
    const rateEnv = us10y.rate > 4.5
      ? 'lãi suất toàn cầu ở mức cao — TPCP kỳ hạn ngắn hấp dẫn hơn'
      : us10y.rate > 3.5
      ? 'lãi suất toàn cầu ở mức trung bình'
      : 'lãi suất toàn cầu thấp — TPCP kỳ hạn dài cho lãi tốt hơn';

    const termAdvice = {
      LOW:    'kỳ hạn dài 5–15 năm để chốt lãi',
      MEDIUM: 'kỳ hạn trung 3–5 năm cân bằng rủi ro',
      HIGH:   'kỳ hạn ngắn 2–3 năm giữ linh hoạt',
    }[riskLevel];

    const intro = `US 10Y yield đang ở ${us10y.rate.toFixed(2)}% — ${rateEnv}. `
      + `Với khẩu vị ${riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao'}, `
      + `nên chọn ${termAdvice}. TPCP Việt Nam kỳ hạn 5 năm đang ở ${BONDS_DATA.govBonds.find(b => b.term === '5 năm')?.rate}%/năm.`;

    return success(res, {
      bondItems,
      intro,
      us10y,
      updatedAt: BONDS_DATA.updatedAt,
      riskLevel,
    });
  } catch (err) {
    console.error('getBondsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu trái phiếu');
  }
}

// ─── Savings Rates ────────────────────────────────────────────────────────────
// Cập nhật: 23/04/2026 — lãi suất tiết kiệm online tại quầy (đơn vị: %/năm)
// Cấu trúc: { bankId, name, logo, online: {t1,t3,t6,t9,t12,t18,t24}, counter: {...}, note, tier }
// tier: 'big4' | 'mid' | 'small'  (big4 = BIDV/VCB/CTG/ACB)
const SAVINGS_DATA = {
  updatedAt: '2026-04-23',
  banks: [
    {
      id: 'acb', name: 'ACB', tier: 'mid',
      online:  { t1: 3.1, t3: 3.5, t6: 4.6, t9: 4.7, t12: 5.5, t18: 5.5, t24: 5.5 },
      counter: { t1: 2.9, t3: 3.3, t6: 4.4, t9: 4.5, t12: 5.3, t18: 5.3, t24: 5.3 },
      note: 'Lãi suất ổn định, uy tín cao, hệ thống rộng khắp',
    },
    {
      id: 'tcb', name: 'Techcombank', tier: 'mid',
      online:  { t1: 3.0, t3: 3.4, t6: 4.5, t9: 4.6, t12: 5.2, t18: 5.2, t24: 5.2 },
      counter: { t1: 2.8, t3: 3.2, t6: 4.3, t9: 4.4, t12: 5.0, t18: 5.0, t24: 5.0 },
      note: 'Online banking tốt, gửi/rút linh hoạt qua app',
    },
    {
      id: 'vpb', name: 'VPBank', tier: 'mid',
      online:  { t1: 3.2, t3: 3.7, t6: 4.8, t9: 4.9, t12: 5.8, t18: 5.8, t24: 5.8 },
      counter: { t1: 3.0, t3: 3.5, t6: 4.6, t9: 4.7, t12: 5.6, t18: 5.6, t24: 5.6 },
      note: 'Lãi suất cạnh tranh top đầu, nhiều ưu đãi online',
    },
    {
      id: 'msb', name: 'MSB', tier: 'mid',
      online:  { t1: 3.3, t3: 3.8, t6: 4.9, t9: 5.0, t12: 6.0, t18: 6.0, t24: 6.1 },
      counter: { t1: 3.1, t3: 3.6, t6: 4.7, t9: 4.8, t12: 5.8, t18: 5.8, t24: 5.9 },
      note: 'Kỳ hạn 13/24 tháng hấp dẫn, app dễ dùng',
    },
    {
      id: 'hdb', name: 'HDBank', tier: 'mid',
      online:  { t1: 3.4, t3: 3.9, t6: 4.9, t9: 5.0, t12: 5.7, t18: 5.7, t24: 5.8 },
      counter: { t1: 3.2, t3: 3.7, t6: 4.7, t9: 4.8, t12: 5.5, t18: 5.5, t24: 5.6 },
      note: 'Gửi online cao hơn quầy, ưu đãi cho khách VIP',
    },
    {
      id: 'ocb', name: 'OCB', tier: 'small',
      online:  { t1: 3.5, t3: 4.0, t6: 5.0, t9: 5.1, t12: 6.0, t18: 6.1, t24: 6.2 },
      counter: { t1: 3.3, t3: 3.8, t6: 4.8, t9: 4.9, t12: 5.8, t18: 5.9, t24: 6.0 },
      note: 'Lãi suất cao hơn trung bình, cần cân nhắc quy mô',
    },
    {
      id: 'vcb', name: 'Vietcombank', tier: 'big4',
      online:  { t1: 2.0, t3: 2.5, t6: 3.0, t9: 3.4, t12: 4.7, t18: 4.7, t24: 4.7 },
      counter: { t1: 1.7, t3: 2.1, t6: 2.9, t9: 3.2, t12: 4.6, t18: 4.6, t24: 4.6 },
      note: 'Lãi thấp hơn nhưng uy tín Nhà nước, bảo hiểm tốt nhất',
    },
  ],
};

/**
 * Gợi ý ngân hàng + kỳ hạn theo riskLevel:
 *  LOW  → kỳ hạn dài (12-24 tháng), chốt lãi cao, chọn ngân hàng big4/mid uy tín
 *  MEDIUM → kỳ hạn trung (6-12 tháng), cân bằng thanh khoản và lãi
 *  HIGH → kỳ hạn ngắn (1-3 tháng), giữ tiền mặt linh hoạt để bắt cơ hội
 */
function buildSavingsItems(riskLevel) {
  const tenorMap = {
    LOW:    ['t24', 't18', 't12'],
    MEDIUM: ['t12', 't6',  't9'],
    HIGH:   ['t3',  't1',  't6'],
  };
  const preferTenors = tenorMap[riskLevel] || tenorMap.MEDIUM;
  const primaryTenor = preferTenors[0];

  // Sắp xếp theo lãi suất kỳ hạn ưu tiên (online), loại big4 xuống cuối nếu MEDIUM/HIGH
  const sorted = [...SAVINGS_DATA.banks].sort((a, b) => {
    const ra = a.online[primaryTenor] || 0;
    const rb = b.online[primaryTenor] || 0;
    // Với LOW: big4 lên trên một chút vì uy tín
    if (riskLevel === 'LOW') {
      const tierScore = (t) => t === 'big4' ? 0.3 : t === 'mid' ? 0 : -0.2;
      return (rb + tierScore(b.tier)) - (ra + tierScore(a.tier));
    }
    return rb - ra;
  });

  const tenorLabel = { t1: '1 tháng', t3: '3 tháng', t6: '6 tháng', t9: '9 tháng', t12: '12 tháng', t18: '18 tháng', t24: '24 tháng' };
  const tierBadge  = { big4: { label: 'Big4', color: 'purple' }, mid: { label: 'Uy tín', color: 'blue' }, small: { label: 'Lãi cao', color: 'emerald' } };

  return sorted.slice(0, 6).map((bank, i) => {
    const rate    = bank.online[primaryTenor];
    const rateCtr = bank.counter[primaryTenor];
    const tb      = tierBadge[bank.tier];

    // Ghi chú kỳ hạn khác để so sánh
    const otherTenors = preferTenors.slice(1).map(t => `${tenorLabel[t]}: ${bank.online[t]}%`).join(' · ');
    const note = `${bank.note} · ${otherTenors}`;

    return {
      id:         bank.id,
      name:       bank.name,
      tag:        `Online ${tenorLabel[primaryTenor]}`,
      rate:       rate,
      rateLabel:  `${rate}%/năm`,
      rateCounter: rateCtr,
      rateCounterLabel: `${rateCtr}%/năm (quầy)`,
      note,
      badge:      i === 0 ? 'Tốt nhất' : tb.label,
      badgeColor: i === 0 ? 'amber' : tb.color,
      tier:       bank.tier,
      allRates:   bank.online,
    };
  });
}

export async function getSavingsRates(req, res) {
  try {
    const riskLevel = req.query.riskLevel || 'MEDIUM';
    const items = buildSavingsItems(riskLevel);

    const tenorAdvice = {
      LOW:    'kỳ hạn 18–24 tháng',
      MEDIUM: 'kỳ hạn 6–12 tháng',
      HIGH:   'kỳ hạn 1–3 tháng (giữ linh hoạt)',
    };

    // Tìm lãi suất cao nhất thị trường cho kỳ hạn phù hợp
    const primaryTenor = { LOW: 't24', MEDIUM: 't12', HIGH: 't3' }[riskLevel];
    const maxRate = Math.max(...SAVINGS_DATA.banks.map(b => b.online[primaryTenor] || 0));

    const intro = `Lãi suất tiết kiệm online tốt nhất hiện tại lên tới **${maxRate}%/năm**. `
      + `Với khẩu vị ${riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao'}, `
      + `nên chọn ${tenorAdvice[riskLevel]} — `
      + (riskLevel === 'LOW' ? 'chốt lãi dài hạn khi lãi suất còn cao.'
        : riskLevel === 'MEDIUM' ? 'cân bằng thanh khoản và lãi suất.'
        : 'giữ tiền mặt linh hoạt để chớp cơ hội đầu tư.');

    return success(res, {
      savingsItems: items,
      intro,
      updatedAt: SAVINGS_DATA.updatedAt,
      riskLevel,
    });
  } catch (err) {
    console.error('getSavingsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu tiết kiệm');
  }
}

// ─── Gold Suggestions ─────────────────────────────────────────────────────────
let goldCache = { data: null, fetchedAt: 0 };
const GOLD_CACHE_TTL = 10 * 60 * 1000; // 10 phút

async function fetchGoldData() {
  // 1) Giá vàng thế giới từ Yahoo Finance (GC=F futures)
  const worldRes = await fetch(
    'https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d',
    { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
  );
  const worldJson = await worldRes.json();
  const worldMeta = worldJson?.chart?.result?.[0]?.meta;
  const worldPrice   = worldMeta?.regularMarketPrice ?? 0;   // USD/troy oz
  const worldPrevClose = worldMeta?.chartPreviousClose ?? worldPrice;
  const worldChange  = worldPrevClose > 0 ? (worldPrice - worldPrevClose) / worldPrevClose * 100 : 0;

  // 2) Giá vàng trong nước từ BTMC
  const btmcRes = await fetch(
    'https://btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v',
    { headers: { Accept: 'application/json' } }
  );
  const btmcJson = await btmcRes.json();
  const rows = btmcJson?.DataList?.Data ?? [];

  // Tìm SJC và Nhẫn từ BTMC
  let sjc = null, nhan = null;
  for (const row of rows) {
    const idx = row['@row'];
    const name = (row[`@n_${idx}`] || '').toUpperCase();
    const buy  = parseInt(row[`@pb_${idx}`] || '0', 10);
    const sell = parseInt(row[`@ps_${idx}`] || '0', 10);
    if (!sjc  && name.includes('VÀNG MIẾNG SJC'))   sjc  = { buy, sell };
    if (!nhan && name.includes('NHẪN TRÒN TRƠN'))   nhan = { buy, sell };
    if (sjc && nhan) break;
  }

  return { worldPrice, worldChange, sjc, nhan };
}

export async function getGoldPrices(req, res) {
  try {
    const now = Date.now();
    let data;
    if (goldCache.data && now - goldCache.fetchedAt < GOLD_CACHE_TTL) {
      data = goldCache.data;
    } else {
      data = await fetchGoldData();
      goldCache = { data, fetchedAt: now };
    }

    const { worldPrice, worldChange, sjc, nhan } = data;

    // Format helpers
    const fmt  = (n) => n?.toLocaleString('vi-VN') + 'đ';
    const fmtW = (n) => `$${n?.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz`;
    const sign = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    const changeColor = worldChange >= 0 ? 'emerald' : 'red';

    // Tính spread SJC (chênh lệch mua/bán)
    const sjcSpread = sjc ? Math.round((sjc.sell - sjc.buy) / sjc.sell * 100 * 10) / 10 : 0;

    // Tính giá vàng nhẫn quy đổi (so với thế giới)
    // 1 troy oz = 31.1g, 1 chỉ = 3.75g → 1 oz ≈ 8.29 chỉ
    // Quy đổi thô: worldPrice USD * tỷ giá ~25500 / 8.29
    const impliedNhan = sjc ? Math.round(worldPrice * 25500 / 8.29 / 100000) * 100000 : 0;
    const premiumSJC  = sjc && impliedNhan > 0
      ? Math.round((sjc.sell - impliedNhan) / impliedNhan * 100 * 10) / 10
      : 0;

    const goldItems = [
      {
        id: 'world',
        name: 'Vàng thế giới (GC=F)',
        tag: 'Futures · COMEX',
        historySource: { asset: 'gold', source: 'world' },
        price: worldPrice,
        priceLabel: fmtW(worldPrice),
        change24h: worldChange,
        note: `Giá spot quốc tế · ${worldChange >= 0 ? '📈 tăng' : '📉 giảm'} ${Math.abs(worldChange).toFixed(2)}% hôm nay`,
        badge: worldChange > 1 ? 'Đang tăng' : worldChange < -1 ? 'Giảm' : 'Ổn định',
        badgeColor: worldChange > 0 ? 'emerald' : 'amber',
        highlight: true,
      },
      sjc ? {
        id: 'sjc',
        name: 'Vàng miếng SJC',
        tag: 'Trong nước · 1 chỉ',
        price: sjc.sell,
        priceLabel: fmt(sjc.sell),
        buyPrice: sjc.buy,
        buyLabel: fmt(sjc.buy),
        change24h: worldChange, // proxy theo thế giới
        note: `Mua: ${fmt(sjc.buy)} · Bán: ${fmt(sjc.sell)} · Spread ${sjcSpread}%${premiumSJC > 0 ? ` · Premium so TG: +${premiumSJC}%` : ''}`,
        badge: 'Thanh khoản cao',
        badgeColor: 'amber',
      } : null,
      nhan ? {
        id: 'nhan',
        name: 'Nhẫn tròn trơn VRTL',
        tag: 'Trang sức · 1 chỉ',
        price: nhan.sell,
        priceLabel: fmt(nhan.sell),
        buyPrice: nhan.buy,
        buyLabel: fmt(nhan.buy),
        change24h: worldChange,
        note: `Mua: ${fmt(nhan.buy)} · Bán: ${fmt(nhan.sell)} · Dễ mua bán nhỏ lẻ hơn SJC`,
        badge: 'Linh hoạt',
        badgeColor: 'blue',
      } : null,
      {
        id: 'etf_gold',
        name: 'ETF Vàng (VFMVF1)',
        tag: 'Chứng chỉ quỹ',
        price: null,
        priceLabel: 'Giao dịch qua HNX',
        change24h: worldChange,
        note: 'Đầu tư vàng qua sàn chứng khoán — phí thấp, không cần lưu trữ vật lý',
        badge: 'Tiện lợi',
        badgeColor: 'blue',
      },
      {
        id: 'saving_gold',
        name: 'Tích lũy vàng DCA',
        tag: 'Chiến lược',
        price: null,
        priceLabel: 'Mua đều hàng tháng',
        change24h: 0,
        note: 'Mua nhẫn/chứng chỉ vàng định kỳ — giảm rủi ro timing, phù hợp dài hạn',
        badge: 'Khuyên dùng',
        badgeColor: 'emerald',
      },
    ].filter(Boolean);

    // Intro động
    const trend = worldChange > 1 ? 'đang tăng 📈' : worldChange > 0 ? 'tích cực nhẹ' : worldChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const intro = `Vàng thế giới ${trend} (${sign(worldChange)} hôm nay, $${worldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz). `
      + (sjc ? `Vàng SJC trong nước: ${fmt(sjc.sell)}/chỉ${premiumSJC > 5 ? ` — đang cao hơn TG ${premiumSJC}%, cân nhắc thời điểm mua.` : '.'}` : '');

    return success(res, { goldItems, intro, worldPrice, worldChange, cached: goldCache.fetchedAt !== now });
  } catch (err) {
    console.error('getGoldPrices error:', err.message);
    if (goldCache.data) {
      return success(res, { ...goldCache.data, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá vàng lúc này');
  }
}

// ─── Stock Suggestions ────────────────────────────────────────────────────────
let stockCache = { data: null, fetchedAt: 0 };
const STOCK_CACHE_TTL = 10 * 60 * 1000; // 10 phút (thị trường VN đóng cửa 15h)

// Danh sách cổ phiếu theo nhóm — dùng ticker Yahoo Finance (.VN)
const STOCK_UNIVERSE = [
  // Bluechip / VN30
  { ticker: 'VCB.VN',  name: 'Vietcombank',       sector: 'Ngân hàng',    tag: 'VN30 · Bluechip' },
  { ticker: 'BID.VN',  name: 'BIDV',               sector: 'Ngân hàng',    tag: 'VN30 · Bluechip' },
  { ticker: 'CTG.VN',  name: 'VietinBank',         sector: 'Ngân hàng',    tag: 'VN30 · Bluechip' },
  { ticker: 'TCB.VN',  name: 'Techcombank',        sector: 'Ngân hàng',    tag: 'VN30 · Tăng trưởng' },
  { ticker: 'MBB.VN',  name: 'MBBank',             sector: 'Ngân hàng',    tag: 'VN30 · Tăng trưởng' },
  { ticker: 'FPT.VN',  name: 'FPT Corporation',    sector: 'Công nghệ',    tag: 'VN30 · Tech leader' },
  { ticker: 'VNM.VN',  name: 'Vinamilk',           sector: 'Tiêu dùng',    tag: 'VN30 · Phòng thủ' },
  { ticker: 'MSN.VN',  name: 'Masan Group',        sector: 'Tiêu dùng',    tag: 'VN30 · Đa ngành' },
  { ticker: 'MWG.VN',  name: 'Mobile World (MWG)', sector: 'Bán lẻ',       tag: 'VN30 · Bán lẻ' },
  { ticker: 'HPG.VN',  name: 'Hòa Phát Group',     sector: 'Thép',         tag: 'VN30 · Chu kỳ' },
  { ticker: 'VHM.VN',  name: 'Vinhomes',           sector: 'Bất động sản', tag: 'VN30 · BĐS lớn' },
  { ticker: 'VIC.VN',  name: 'Vingroup',            sector: 'Đa ngành',    tag: 'VN30 · Tập đoàn' },
  // ETF
  { ticker: 'E1VFVN30.VN', name: 'ETF E1VFVN30',  sector: 'ETF',          tag: 'Passive · Theo VN30' },
  { ticker: 'FUEVFVND.VN', name: 'ETF DCVFMVN Diamond', sector: 'ETF',    tag: 'Passive · Diamond' },
  // Mid-cap tăng trưởng
  { ticker: 'ACB.VN',  name: 'ACB Bank',           sector: 'Ngân hàng',    tag: 'Mid-cap · Tăng trưởng' },
  { ticker: 'REE.VN',  name: 'REE Corporation',    sector: 'Hạ tầng',      tag: 'Mid-cap · Cổ tức tốt' },
  { ticker: 'PNJ.VN',  name: 'PNJ',                sector: 'Trang sức',    tag: 'Mid-cap · Bán lẻ' },
  { ticker: 'DGC.VN',  name: 'Đức Giang Chemicals',sector: 'Hóa chất',     tag: 'Mid-cap · Xuất khẩu' },
];

const ASSET_HISTORY_MONTH_OPTIONS = new Set([6, 12, 18]);
const ASSET_HISTORY_SOURCES = {
  gold: {
    world: {
      asset: 'gold',
      source: 'world',
      ticker: 'GC=F',
      name: 'Vàng thế giới (GC=F)',
      metric: { key: 'price', unit: 'USD/oz', changeUnit: 'percent', decimals: 1 },
      dataSource: 'Yahoo Finance monthly close',
    },
  },
  bonds: {
    us10y: {
      asset: 'bonds',
      source: 'us10y',
      ticker: '^TNX',
      name: 'US Treasury 10Y',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'Yahoo Finance monthly yield',
    },
  },
};

function normalizeHistoryMonths(value) {
  const months = Number.parseInt(value, 10);
  return ASSET_HISTORY_MONTH_OPTIONS.has(months) ? months : 12;
}

function resolveStockMeta(rawTicker) {
  const raw = String(rawTicker || '').trim().toUpperCase();
  if (!raw) return null;

  const withSuffix = raw.endsWith('.VN') ? raw : `${raw}.VN`;
  return STOCK_UNIVERSE.find((meta) => {
    const ticker = meta.ticker.toUpperCase();
    const symbol = ticker.replace('.VN', '');
    return ticker === withSuffix || symbol === raw;
  });
}

function resolveAssetHistorySource(asset, query) {
  if (asset === 'stocks') {
    const meta = resolveStockMeta(query.ticker || query.symbol);
    if (!meta) return null;

    return {
      asset,
      source: 'ticker',
      ticker: meta.ticker,
      symbol: meta.ticker.replace('.VN', ''),
      name: meta.name,
      sector: meta.sector,
      metric: { key: 'price', unit: 'VND', changeUnit: 'percent', decimals: 0 },
      dataSource: 'Yahoo Finance monthly close',
    };
  }

  const source = String(query.source || '').trim().toLowerCase();
  return ASSET_HISTORY_SOURCES[asset]?.[source] || null;
}

function roundHistoryValue(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildMonthlyHistoryRows(rawHistory, months, metric) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;
  const rows = rawHistory.timestamps.map((timestamp, index) => {
    const value = roundHistoryValue(rawHistory.closes[index], decimals);
    const previousClose = index > 0 ? rawHistory.closes[index - 1] : null;
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const monthNumber = date.getUTCMonth() + 1;
    const month = `${year}-${String(monthNumber).padStart(2, '0')}`;
    const label = `${String(monthNumber).padStart(2, '0')}/${String(year).slice(-2)}`;
    const change = previousClose
      ? metric?.changeUnit === 'percentagePoint'
        ? value - previousClose
        : ((value - previousClose) / previousClose) * 100
      : 0;
    const roundedChange = Number(change.toFixed(metric?.changeUnit === 'percentagePoint' ? 2 : 2));

    return {
      month,
      label,
      value,
      close: value,
      change: roundedChange,
      changePct: roundedChange,
    };
  });

  return rows.slice(-months);
}

async function fetchStockQuote(ticker) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) return null;
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price:      meta.regularMarketPrice,
    prevClose:  meta.chartPreviousClose,
    high52w:    meta.fiftyTwoWeekHigh,
    low52w:     meta.fiftyTwoWeekLow,
    volume:     meta.regularMarketVolume,
    dayHigh:    meta.regularMarketDayHigh,
    dayLow:     meta.regularMarketDayLow,
  };
}

function scoreStock(quote, meta, riskLevel) {
  if (!quote) return 0;
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  // Vị trí giá trong range 52 tuần (0=đáy, 1=đỉnh)
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  // ETF luôn có điểm nền cao
  const etfBonus = meta.sector === 'ETF' ? 20 : 0;

  // Sector score — ưu tiên theo riskLevel
  const sectorMap = {
    LOW:    { 'Ngân hàng': 15, 'Tiêu dùng': 15, 'ETF': 20, 'Hạ tầng': 10 },
    MEDIUM: { 'Công nghệ': 15, 'Ngân hàng': 12, 'Bán lẻ': 10, 'ETF': 15, 'Tiêu dùng': 8 },
    HIGH:   { 'Công nghệ': 20, 'Hóa chất': 15, 'Thép': 12, 'Bán lẻ': 10 },
  };
  const sectorBonus = sectorMap[riskLevel]?.[meta.sector] || 0;

  // Momentum: giá đang gần đỉnh 52w là tín hiệu tốt
  const momentumScore = posIn52w * 30;

  // Biến động ngày
  const volScore = riskLevel === 'LOW'
    ? Math.max(0, 20 - Math.abs(change) * 4)
    : riskLevel === 'HIGH'
    ? Math.min(20, Math.abs(change) * 4)
    : Math.max(0, 20 - Math.max(0, Math.abs(change) - 2) * 5);

  return etfBonus + sectorBonus + momentumScore + volScore;
}

function buildStockCard(quote, meta, rank) {
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const priceLabel = quote.price?.toLocaleString('vi-VN') + 'đ';
  const changeSign = change >= 0 ? '+' : '';
  const rate = `${priceLabel} (${changeSign}${change.toFixed(2)}%)`;

  // Note tự động
  const pos52wLabel = posIn52w > 0.8 ? 'gần đỉnh 52 tuần' : posIn52w < 0.2 ? 'gần đáy 52 tuần' : 'vùng giữa 52 tuần';
  const trendLabel = change > 2 ? '🚀 tăng mạnh' : change > 0.5 ? '📈 tăng' : change < -2 ? '📉 giảm mạnh' : change < -0.5 ? '📉 giảm' : '➡️ đi ngang';
  const note = `${meta.sector} · ${pos52wLabel} · ${trendLabel} hôm nay`;

  // Badge
  let badge = '', badgeColor = '';
  if (rank === 0)                  { badge = 'Tốt nhất';   badgeColor = 'amber';   }
  else if (meta.sector === 'ETF')  { badge = 'Passive';    badgeColor = 'blue';    }
  else if (change > 2)             { badge = 'Đang tăng';  badgeColor = 'emerald'; }
  else if (posIn52w < 0.25)        { badge = 'Vùng giá tốt'; badgeColor = 'blue'; }
  else if (posIn52w > 0.75)        { badge = 'Uptrend';    badgeColor = 'emerald'; }

  return {
    ticker:   meta.ticker.replace('.VN', ''),
    historyTicker: meta.ticker,
    name:     meta.name,
    sector:   meta.sector,
    tag:      meta.tag,
    price:    quote.price,
    change24h: change,
    high52w:  quote.high52w,
    low52w:   quote.low52w,
    posIn52w,
    note,
    badge,
    badgeColor,
    rate,
  };
}

export async function getStockPrices(req, res) {
  try {
    const riskLevel = req.query.riskLevel || 'MEDIUM';
    const now = Date.now();

    let quotes; // { ticker -> quote }
    if (stockCache.data && now - stockCache.fetchedAt < STOCK_CACHE_TTL) {
      quotes = stockCache.data;
    } else {
      // Fetch song song tất cả tickers
      const results = await Promise.allSettled(
        STOCK_UNIVERSE.map(async (m) => {
          const q = await fetchStockQuote(m.ticker);
          return { ticker: m.ticker, quote: q };
        })
      );
      quotes = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.quote) {
          quotes[r.value.ticker] = r.value.quote;
        }
      });
      stockCache = { data: quotes, fetchedAt: now };
    }

    // Tính điểm và sắp xếp
    const scored = STOCK_UNIVERSE
      .filter((m) => quotes[m.ticker])
      .map((m) => ({ meta: m, quote: quotes[m.ticker], score: scoreStock(quotes[m.ticker], m, riskLevel) }))
      .sort((a, b) => b.score - a.score);

    const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));

    // Intro động
    const avgChange = Object.values(quotes).reduce((sum, q) => {
      return sum + (q.prevClose > 0 ? (q.price - q.prevClose) / q.prevClose * 100 : 0);
    }, 0) / Object.keys(quotes).length;
    const marketMood = avgChange > 1 ? 'đang tăng 📈' : avgChange > 0 ? 'tích cực nhẹ' : avgChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const introMap = {
      LOW:    `VN-Index ${marketMood}. Với khẩu vị thấp, ưu tiên ETF và bluechip ngân hàng/tiêu dùng có cổ tức ổn định. DCA hàng tháng, không cần theo dõi thường xuyên.`,
      MEDIUM: `VN-Index ${marketMood}. Cân bằng giữa cổ phiếu tăng trưởng (FPT, MWG) và phòng thủ (VNM, VCB). Nên giữ 5–7 mã, review mỗi quý.`,
      HIGH:   `VN-Index ${marketMood}. Tập trung vào cổ phiếu tăng trưởng cao (công nghệ, hóa chất, thép). Rủi ro cao — cần theo dõi sát, đặt stop-loss.`,
    };

    return success(res, {
      stocks: top5,
      intro: introMap[riskLevel],
      riskLevel,
      cached: stockCache.fetchedAt !== now,
    });
  } catch (err) {
    console.error('getStockPrices error:', err.message);
    if (stockCache.data) {
      const scored = STOCK_UNIVERSE
        .filter((m) => stockCache.data[m.ticker])
        .map((m) => ({ meta: m, quote: stockCache.data[m.ticker], score: scoreStock(stockCache.data[m.ticker], m, req.query.riskLevel || 'MEDIUM') }))
        .sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));
      return success(res, { stocks: top5, intro: '', riskLevel: req.query.riskLevel || 'MEDIUM', cached: true, stale: true });
    }
    return error(res, 'Không thể lấy dữ liệu chứng khoán lúc này');
  }
}

export async function getAssetHistory(req, res) {
  const startedAt = Date.now();
  try {
    const asset = String(req.query.asset || 'stocks').toLowerCase();
    const months = normalizeHistoryMonths(req.query.months);
    const source = resolveAssetHistorySource(asset, req.query);

    if (!source) {
      if (asset === 'savings') {
        return error(res, 'Tiết kiệm chưa có dữ liệu lịch sử theo tháng đã kiểm chứng', 400);
      }
      return error(res, 'Nguồn lịch sử tài sản không được hỗ trợ', 400);
    }

    console.info(
      `[InvestmentAdvisor] asset-history:start user=${shortUserId(req.userId)} asset=${source.asset} source=${source.source} ticker=${source.ticker} metric=${source.metric.key} months=${months}`
    );

    const rawHistory = await fetchAssetHistory(source.ticker);
    if (!rawHistory) {
      console.warn(`[InvestmentAdvisor] asset-history:no-data asset=${source.asset} source=${source.source} ticker=${source.ticker}`);
      return error(res, 'Không có dữ liệu lịch sử cho nguồn này', 502);
    }

    const history = buildMonthlyHistoryRows(rawHistory, months, source.metric);
    if (history.length === 0) {
      return error(res, 'Không đủ dữ liệu lịch sử để hiển thị biểu đồ', 404);
    }

    console.info(
      `[InvestmentAdvisor] asset-history:complete user=${shortUserId(req.userId)} asset=${source.asset} source=${source.source} metric=${source.metric.key} points=${history.length} durationMs=${Date.now() - startedAt}`
    );

    return success(res, {
      asset: source.asset,
      source: source.source,
      ticker: source.ticker,
      symbol: source.symbol,
      name: source.name,
      sector: source.sector,
      metric: source.metric,
      months,
      history,
      updatedAt: new Date().toISOString(),
      dataSource: source.dataSource,
    });
  } catch (err) {
    console.error('getAssetHistory error:', err.message);
    return error(res, 'Không thể lấy dữ liệu lịch sử tài sản');
  }
}

// ─── Crypto Suggestions ───────────────────────────────────────────────────────
// Cache đơn giản trong bộ nhớ — tránh spam CoinGecko (rate limit 30 req/phút free)
let cryptoCache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 phút

// Stablecoin IDs — luôn filter ra
const STABLECOIN_IDS = new Set([
  'tether', 'usd-coin', 'binance-usd', 'dai', 'true-usd', 'usdd',
  'frax', 'liquity-usd', 'fei-usd', 'pax-dollar',
  'usd1',          // World Liberty Financial (Trump stablecoin)
  'usd1-wlfi',     // alias
  'ripple-usd', 'rlusd',    // Ripple USD
  'first-digital-usd', 'paypal-usd', 'mountain-protocol-usdm',
]);

// Meme coin, NFT token, exchange token rủi ro cao — blacklist hoàn toàn
const BLACKLIST_IDS = new Set([
  // Wrapped / staked
  'wrapped-bitcoin', 'wrapped-ethereum', 'staked-ether', 'wrapped-steth',
  'rocket-pool-eth', 'coinbase-wrapped-staked-eth', 'mantle-staked-ether',
  // Meme coins
  'dogecoin', 'shiba-inu', 'pepe', 'floki', 'dogwifcoin', 'bonk',
  'official-trump', 'melania-meme', 'book-of-meme',
  // NFT / gaming token biến động cực cao
  'pudgy-penguins', 'axie-infinity', 'the-sandbox', 'decentraland',
  // Các token có lịch sử thao túng giá
  'xrp',  // NOTE: nếu muốn giữ XRP thì xóa dòng này
]);

/**
 * Tính điểm cho 1 coin dựa trên 3 tiêu chí:
 *  1. Market Cap  — độ an toàn / uy tín (50%)
 *     → Coin có mcap < $5B bị phạt nặng thêm
 *  2. Volume/MCap ratio — thanh khoản bình thường (20%)
 *     → Trần 0.15 để không thưởng meme coin volume điên cuồng
 *  3. Biến động   — dựa theo riskLevel người dùng (30%)
 *     LOW  → thưởng coin ổn định (BTC, ETH)
 *     HIGH → thưởng coin biến động vừa phải 5–15%
 */
function scoreCoin(coin, riskLevel = 'MEDIUM') {
  const mcap    = coin.market_cap || 0;
  const volume  = coin.total_volume || 0;
  const change  = Math.abs(coin.price_change_percentage_24h || 0);

  // Market cap score — trọng số 50%, phạt mạnh coin nhỏ
  const mcapScore = Math.min(100, (Math.log10(Math.max(mcap, 1)) / Math.log10(3e12)) * 100);
  const mcapPenalty = mcap < 5e9 ? 30 : mcap < 20e9 ? 15 : 0;
  const mcapPenaltyApplied = mcapScore - mcapPenalty;

  // Liquidity score: volume/mcap ratio — trần 0.15 để không thưởng meme coin
  const volRatio = mcap > 0 ? Math.min(volume / mcap, 0.15) : 0;
  const liqScore = Math.min(100, volRatio * 667); // 0.15 → 100

  // Volatility score theo riskLevel
  let volScore;
  if (riskLevel === 'LOW') {
    // Thưởng coin ổn định (change < 3%)
    volScore = Math.max(0, 100 - change * 15);
  } else if (riskLevel === 'HIGH') {
    // Thưởng coin biến động vừa (5–15%)
    volScore = change >= 3 && change <= 20 ? 100 - Math.abs(change - 10) * 3 : Math.max(0, 60 - change);
  } else {
    // MEDIUM: ổn định nhẹ
    volScore = Math.max(0, 100 - Math.max(0, change - 5) * 5);
  }

  return mcapPenaltyApplied * 0.5 + liqScore * 0.2 + volScore * 0.3;
}

function buildCoinCard(coin, rank) {
  const change   = coin.price_change_percentage_24h ?? 0;
  const mcap     = coin.market_cap ?? 0;
  const volRatio = mcap > 0 ? (coin.total_volume / mcap) : 0;

  // Tag: mô tả đặc tính coin
  let tag;
  if (coin.market_cap_rank <= 2)          tag = 'Top 2 — Blue-chip';
  else if (coin.market_cap_rank <= 10)    tag = `Top ${coin.market_cap_rank} — Large-cap`;
  else if (coin.market_cap_rank <= 50)    tag = `Top ${coin.market_cap_rank} — Mid-cap`;
  else                                    tag = 'Small-cap';

  // Note: sinh tự động từ số liệu
  const mcapLabel = mcap >= 1e12 ? `$${(mcap/1e12).toFixed(2)}T`
    : mcap >= 1e9 ? `$${(mcap/1e9).toFixed(0)}B`
    : `$${(mcap/1e6).toFixed(0)}M`;
  const liqLabel  = volRatio > 0.15 ? 'thanh khoản rất cao' : volRatio > 0.07 ? 'thanh khoản tốt' : 'thanh khoản trung bình';
  const trendLabel = change > 5 ? '🚀 đang tăng mạnh' : change > 1 ? '📈 xu hướng tăng' : change < -5 ? '📉 đang giảm mạnh' : change < -1 ? '📉 xu hướng giảm' : '➡️ đi ngang';
  const note = `MCap ${mcapLabel} · ${liqLabel} · ${trendLabel} 24h`;

  // Badge: dán nhãn nổi bật
  let badge = '', badgeColor = '';
  if (rank === 0)                          { badge = 'Tốt nhất';    badgeColor = 'amber';   }
  else if (coin.market_cap_rank <= 2)      { badge = 'Blue-chip';   badgeColor = 'amber';   }
  else if (change > 5)                     { badge = 'Đang tăng';   badgeColor = 'emerald'; }
  else if (volRatio > 0.15)                { badge = 'Thanh khoản'; badgeColor = 'blue';    }
  else if (coin.market_cap_rank <= 10)     { badge = 'Uy tín cao';  badgeColor = 'blue';    }

  // Rate: hiển thị giá + % 24h
  const price = coin.current_price;
  const priceLabel = price >= 1
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${price.toFixed(6)}`;
  const changeSign = change >= 0 ? '+' : '';
  const rate = `${priceLabel} (${changeSign}${change.toFixed(2)}% 24h)`;

  return {
    id:          coin.id,
    name:        coin.name,
    symbol:      coin.symbol.toUpperCase(),
    image:       coin.image,
    price:       coin.current_price,
    marketCap:   mcap,
    change24h:   change,
    volRatio,
    marketCapRank: coin.market_cap_rank,
    tag,
    note,
    badge,
    badgeColor,
    rate,
  };
}

export async function getCryptoPrices(req, res) {
  try {
    const riskLevel = req.query.riskLevel || 'MEDIUM'; // LOW | MEDIUM | HIGH
    const now = Date.now();

    // Dùng cache nếu còn mới (không phân biệt riskLevel vì raw data giống nhau)
    let rawCoins;
    if (cryptoCache.data && now - cryptoCache.fetchedAt < CACHE_TTL_MS) {
      rawCoins = cryptoCache.data;
    } else {
      // Fetch top 100 coins để có đủ lựa chọn sau khi filter
      const url = 'https://api.coingecko.com/api/v3/coins/markets'
        + '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
        + '&sparkline=false&price_change_percentage=24h';

      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      rawCoins = await response.json();
      cryptoCache = { data: rawCoins, fetchedAt: now };
    }

    // Lọc stablecoin, blacklist, và coin có tên/symbol chứa "usd"/"dollar" (catch-all stablecoin lạ)
    const filtered = rawCoins.filter(
      (c) => !STABLECOIN_IDS.has(c.id)
          && !BLACKLIST_IDS.has(c.id)
          && !/usd|dollar/i.test(c.symbol)
    );

    // Tính điểm và sắp xếp
    const scored = filtered
      .map((c) => ({ coin: c, score: scoreCoin(c, riskLevel) }))
      .sort((a, b) => b.score - a.score);

    // Lấy top 5 để hiển thị
    const top5 = scored.slice(0, 5).map((s, i) => buildCoinCard(s.coin, i));

    // Thêm stablecoin USDC/USDT vào cuối (luôn hữu ích cho mọi risk level)
    const usdc = rawCoins.find((c) => c.id === 'usd-coin');
    if (usdc) {
      top5.push({
        id: 'usd-coin', name: 'USDC / USDT', symbol: 'USDC',
        image: usdc.image, price: 1, marketCap: usdc.market_cap,
        change24h: 0, volRatio: 0, marketCapRank: usdc.market_cap_rank,
        tag: 'Stablecoin', note: 'Gửi nhận lãi 5–8%/năm trên các nền tảng DeFi · không chịu biến động giá',
        badge: 'Ít rủi ro', badgeColor: 'emerald',
        rate: '$1.00 (Stablecoin)',
      });
    }

    // Sinh intro động theo riskLevel + thị trường
    const top1 = scored[0]?.coin;
    const avgChange = filtered.slice(0, 20).reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / 20;
    const marketMood = avgChange > 3 ? 'đang tăng mạnh 🚀' : avgChange > 0 ? 'tích cực nhẹ 📈' : avgChange > -3 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const introMap = {
      LOW:    `Thị trường crypto ${marketMood}. Với khẩu vị rủi ro thấp, danh sách tập trung vào các coin có market cap lớn, biến động thấp — ưu tiên bảo toàn vốn. Chỉ đầu tư phần vốn chấp nhận rủi ro.`,
      MEDIUM: `Thị trường crypto ${marketMood}. Danh sách cân bằng giữa an toàn (mcap lớn) và tăng trưởng (thanh khoản tốt). Tập trung vào coin có nền tảng thực sự, tránh meme coin.`,
      HIGH:   `Thị trường crypto ${marketMood}. Với khẩu vị rủi ro cao, danh sách ưu tiên coin có tiềm năng tăng mạnh và thanh khoản tốt. Chỉ đầu tư vốn chấp nhận mất hoàn toàn, DCA hàng tháng.`,
    };

    return success(res, {
      coins: top5,
      intro: introMap[riskLevel] || introMap.MEDIUM,
      riskLevel,
      cached: cryptoCache.fetchedAt !== now,
    });
  } catch (err) {
    console.error('getCryptoPrices error:', err.message);
    if (cryptoCache.data) {
      // Fallback: tính từ cache cũ
      const filtered = cryptoCache.data.filter(
        (c) => !STABLECOIN_IDS.has(c.id) && !BLACKLIST_IDS.has(c.id)
      );
      const top5 = filtered
        .map((c) => ({ coin: c, score: scoreCoin(c, req.query.riskLevel || 'MEDIUM') }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((s, i) => buildCoinCard(s.coin, i));
      return success(res, { coins: top5, riskLevel: req.query.riskLevel || 'MEDIUM', cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá crypto lúc này');
  }
}
