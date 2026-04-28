import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { getOptimalAllocation } from '../services/portfolioOptimizer.service';
import {
  buildBackwardCompatibleProjection,
  generateProjectionTable,
} from '../services/monteCarloSimulation.service';
import { buildRiskMetrics } from '../services/riskMetrics.service';
import { fetchAssetHistory } from '../services/historicalData.service';
import { runStressTests } from '../services/stressTest.service';
import {
  fetchVietnamGovBondAuctionHistory,
  getLatestVietnamGovBondYields,
} from '../services/vietnamBondHistory.service';
import { fetchFearGreedIndex } from '../services/market.service';
import { ASSET_CLASSES, RISK_CONFIG } from '../constants/investmentConstants';
import { AuthenticatedRequest } from '../types';

function shortUserId(userId: string | undefined): string {
  return String(userId || 'unknown').slice(0, 8);
}

export async function getInvestorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const profile = await (prisma as any).investorProfile.findUnique({ where: { userId: req.userId } });
    return success(res, { investorProfile: profile });
  } catch (err) {
    console.error('getInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createInvestorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const { capital, monthlyAdd, goal, horizon, riskLevel, riskScore, savingsRate, inflationRate } = req.body;
    const profile = await (prisma as any).investorProfile.upsert({
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

export async function updateInvestorProfile(req: AuthenticatedRequest, res: Response) {
  try {
    const data = { ...req.body, lastUpdated: new Date() };
    const profile = await (prisma as any).investorProfile.update({
      where: { userId: req.userId },
      data,
    });
    return success(res, { investorProfile: profile });
  } catch (err) {
    console.error('updateInvestorProfile error:', err);
    return error(res, 'Internal server error');
  }
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
      `[InvestmentAdvisor] allocation:start user=${shortUserId(req.userId)} risk=${profile.riskLevel} horizon=${profile.horizon} mockSentiment=${req.query.mockSentiment ?? 'none'}`
    );

    const mockSentiment = req.query.mockSentiment;
    let sentimentValue: number;

    if (mockSentiment !== undefined) {
      sentimentValue = parseInt(mockSentiment as string);
    } else {
      const sentiment = await fetchFearGreedIndex();
      sentimentValue = sentiment.value;
    }

    const allocation = await getOptimalAllocation(profile, sentimentValue);

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
      { asset: 'Tiết kiệm', percentage: allocation.savings, amount: profile.capital * allocation.savings / 100 },
      { asset: 'Vàng', percentage: allocation.gold, amount: profile.capital * allocation.gold / 100 },
      { asset: 'Cổ phiếu VN', percentage: allocation.stocks, amount: profile.capital * allocation.stocks / 100 },
      { asset: 'Cổ phiếu Mỹ', percentage: allocation.stocks_us || 0, amount: profile.capital * (allocation.stocks_us || 0) / 100 },
      { asset: 'Trái phiếu', percentage: allocation.bonds, amount: profile.capital * allocation.bonds / 100 },
      { asset: 'Crypto', percentage: allocation.crypto, amount: profile.capital * allocation.crypto / 100 },
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
      `[InvestmentAdvisor] allocation:complete user=${shortUserId(req.userId)} sentiment=${sentimentValue} method=${allocation.optimizationMethod} dataQuality=${allocation.optimization?.marketDataQuality || 'unknown'} riskGrade=${riskMetrics.riskGrade} durationMs=${Date.now() - startedAt}`
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
      cryptoWarning: allocation.crypto > 0
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
    console.info(`[InvestmentAdvisor] allocation-history:list user=${shortUserId(req.userId)} count=${allocations.length}`);
    return success(res, { allocations });
  } catch (err) {
    console.error('getAllocationHistory error:', err);
    return error(res, 'Internal server error');
  }
}

export async function submitRiskAssessment(req: AuthenticatedRequest, res: Response) {
  try {
    const { answers } = req.body;
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return error(res, 'Answers are required', 400);
    }

    const weights = RISK_CONFIG.questionWeights as Record<string, number>;
    let weightedSum = 0, totalWeight = 0;
    answers.forEach((a, i) => {
      const qId = a.id || `q${i + 1}`;
      const w = weights[qId] ?? 1.0;
      weightedSum += (a.score || 0) * w;
      totalWeight += w;
    });
    const avgScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : Math.round(answers.reduce((s, a) => s + (a.score || 0), 0) / answers.length);

    let riskLevel = 'LOW';
    let riskDescription = 'Bạn ưu tiên bảo toàn vốn. Phân bổ tập trung vào tiết kiệm và vàng.';
    if (avgScore >= RISK_CONFIG.thresholds.HIGH) {
      riskLevel = 'HIGH';
      riskDescription = 'Bạn sẵn sàng chấp nhận rủi ro cao để tối đa hóa lợi nhuận. Phân bổ nhiều vào chứng khoán và crypto.';
    } else if (avgScore >= RISK_CONFIG.thresholds.MEDIUM) {
      riskLevel = 'MEDIUM';
      riskDescription = 'Bạn chấp nhận rủi ro vừa phải. Phân bổ cân bằng giữa các kênh đầu tư.';
    }

    const scores = answers.map(a => a.score || 0);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const stdDev = Math.sqrt(scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length);
    const consistencyWarning = stdDev > 30
      ? 'Câu trả lời của bạn có độ phân tán cao — một số câu mâu thuẫn nhau. Kết quả đã được xử lý theo trọng số để phản ánh tốt hơn.'
      : null;

    await (prisma as any).investorProfile.upsert({
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

interface BondData {
  term: string;
  tenor: number;
  rate: number;
  liquidity: string;
  risk: string;
  badge: string;
  badgeColor: string;
  source: string;
}

interface BondFund {
  id: string;
  name: string;
  manager: string;
  returnEst: string;
  minInvest: string;
  badge: string;
  badgeColor: string;
  note: string;
  benchmarkSource: string;
}

const BONDS_DATA: { updatedAt: string; govBonds: BondData[]; bondFunds: BondFund[] } = {
  updatedAt: '2026-04-22',
  govBonds: [
    { term: '5 năm',  tenor: 5,  rate: 3.83, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Khuyên dùng', badgeColor: 'purple', source: 'vn_gov_5y'  },
    { term: '10 năm', tenor: 10, rate: 4.15, liquidity: 'Cao', risk: 'Thấp', badge: 'Ưu tiên', badgeColor: 'amber', source: 'vn_gov_10y' },
    { term: '15 năm', tenor: 15, rate: 4.23, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Dài hạn', badgeColor: 'purple', source: 'vn_gov_15y' },
  ],
  bondFunds: [
    { id: 'vcbf_fif', name: 'Quỹ VCBF-FIF', manager: 'Vietcombank Fund Management', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Uy tín', badgeColor: 'blue', note: 'Quỹ thu nhập cố định, benchmark TPCP Việt Nam 10 năm', benchmarkSource: 'vn_gov_10y' },
    { id: 'ssibf', name: 'Quỹ SSIBF', manager: 'SSI AM', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Trái phiếu', badgeColor: 'amber', note: 'Quỹ trái phiếu SSI, dùng benchmark TPCP 10 năm khi chưa có NAV history ổn định', benchmarkSource: 'vn_gov_10y' },
    { id: 'mbbond', name: 'Quỹ MBBOND', manager: 'MB Capital', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Tiện lợi', badgeColor: 'blue', note: 'Mua qua app MBBank, phí thấp, cần collector NAV nếu muốn chart trực tiếp', benchmarkSource: 'vn_gov_10y' },
    { id: 'tcbf', name: 'Quỹ TCBF', manager: 'Techcom Capital', returnEst: '6.0-6.8', minInvest: '1 triệu', badge: '', badgeColor: '', note: 'Mua qua Techcombank, cần collector NAV nếu muốn chart trực tiếp', benchmarkSource: 'vn_gov_10y' },
  ],
};

export async function getBondsRates(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';

    let vnBondHistory: any = null;
    let latestVnYields: any = {};
    try {
      vnBondHistory = await fetchVietnamGovBondAuctionHistory(3);
      latestVnYields = getLatestVietnamGovBondYields(vnBondHistory);
      if (vnBondHistory?.stale) {
        console.warn('[InvestmentAdvisor] bonds:vbma-history-stale-or-empty');
      }
    } catch (err: any) {
      console.warn(`[InvestmentAdvisor] bonds:vbma-history-unavailable ${err.message}`);
    }

    const govBondData = BONDS_DATA.govBonds.map((bond) => ({
      ...bond,
      rate: latestVnYields[bond.tenor] || bond.rate,
    }));

    const preferTerms: Record<string, string[]> = {
      LOW:    ['10 năm', '15 năm', '5 năm'],
      MEDIUM: ['5 năm', '10 năm', '15 năm'],
      HIGH:   ['5 năm', '10 năm', '15 năm'],
    };

    const terms = preferTerms[riskLevel] || preferTerms.MEDIUM;

    const sortedGov = [...govBondData].sort((a, b) => {
      const ai = terms.indexOf(a.term);
      const bi = terms.indexOf(b.term);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const bondItems = [
      ...sortedGov.slice(0, 3).map((g, i) => ({
        id: `gov_${g.term}`,
        name: `Trái phiếu Chính phủ ${g.term}`,
        tag: `TPCP · ${g.liquidity} · Rủi ro ${g.risk}`,
        historySource: { asset: 'bonds', source: g.source, sourceType: 'officialAuction' },
        rate: g.rate,
        rateLabel: `${g.rate.toFixed(2)}%/năm`,
        change: null,
        note: `Yield trúng thầu VBMA/HNX mới nhất · thanh khoản ${g.liquidity.toLowerCase()} · mua qua TCBS, SSI, MBBank tối thiểu 100k`,
        badge: i === 0 ? 'Ưu tiên' : g.badge,
        badgeColor: i === 0 ? 'amber' : g.badgeColor,
      })),
      ...BONDS_DATA.bondFunds.slice(0, 2).map(f => ({
        id: f.id,
        name: f.name,
        tag: `Quỹ · ${f.manager}`,
        historySource: {
          asset: 'bonds',
          source: f.benchmarkSource,
          sourceType: 'proxy',
          sourceLabel: 'Benchmark TPCP 10Y',
        },
        rate: null,
        rateLabel: `~${f.returnEst}%/năm`,
        change: null,
        note: `${f.note} · Đầu tư từ ${f.minInvest}`,
        badge: f.badge,
        badgeColor: f.badgeColor,
      })),
    ];
    const termAdvice: Record<string, string> = {
      LOW:    'kỳ hạn dài 5–15 năm để chốt lãi',
      MEDIUM: 'kỳ hạn trung 3–5 năm cân bằng rủi ro',
      HIGH:   'kỳ hạn ngắn 2–3 năm giữ linh hoạt',
    };

    const currentFiveYearRate = govBondData.find(b => b.term === '5 năm')?.rate;
    const currentTenYearRate = govBondData.find(b => b.term === '10 năm')?.rate;
    const intro = `TPCP Việt Nam kỳ hạn 5 năm đang ở ${currentFiveYearRate?.toFixed(2)}%/năm, 10 năm ở ${currentTenYearRate?.toFixed(2)}%/năm. `
      + `Với khẩu vị ${riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao'}, `
      + `nên chọn ${termAdvice[riskLevel] || termAdvice.MEDIUM}.`;

    return success(res, {
      bondItems,
      intro,
      updatedAt: vnBondHistory?.updatedAt || BONDS_DATA.updatedAt,
      vnBondUpdatedAt: vnBondHistory?.updatedAt || BONDS_DATA.updatedAt,
      riskLevel,
    });
  } catch (err: any) {
    console.error('getBondsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu trái phiếu');
  }
}

interface BankData {
  id: string;
  name: string;
  tier: 'big4' | 'mid' | 'small';
  online: Record<string, number>;
  counter: Record<string, number>;
  note: string;
}

const SAVINGS_DATA: { updatedAt: string; banks: BankData[] } = {
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

function buildSavingsItems(riskLevel: string) {
  const tenorMap: Record<string, string[]> = {
    LOW:    ['t24', 't18', 't12'],
    MEDIUM: ['t12', 't6',  't9'],
    HIGH:   ['t3',  't1',  't6'],
  };
  const preferTenors = tenorMap[riskLevel] || tenorMap.MEDIUM;
  const primaryTenor = preferTenors[0];

  const sorted = [...SAVINGS_DATA.banks].sort((a, b) => {
    const ra = a.online[primaryTenor] || 0;
    const rb = b.online[primaryTenor] || 0;
    if (riskLevel === 'LOW') {
      const tierScore = (t: string) => t === 'big4' ? 0.3 : t === 'mid' ? 0 : -0.2;
      return (rb + tierScore(b.tier)) - (ra + tierScore(a.tier));
    }
    return rb - ra;
  });

  const tenorLabel: Record<string, string> = { t1: '1 tháng', t3: '3 tháng', t6: '6 tháng', t9: '9 tháng', t12: '12 tháng', t18: '18 tháng', t24: '24 tháng' };
  const tierBadge: Record<string, { label: string; color: string }> = { big4: { label: 'Big4', color: 'purple' }, mid: { label: 'Uy tín', color: 'blue' }, small: { label: 'Lãi cao', color: 'emerald' } };

  return sorted.slice(0, 6).map((bank, i) => {
    const rate    = bank.online[primaryTenor];
    const rateCtr = bank.counter[primaryTenor];
    const tb      = tierBadge[bank.tier];

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

export async function getSavingsRates(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const items = buildSavingsItems(riskLevel);

    const tenorAdvice: Record<string, string> = {
      LOW:    'kỳ hạn 18–24 tháng',
      MEDIUM: 'kỳ hạn 6–12 tháng',
      HIGH:   'kỳ hạn 1–3 tháng (giữ linh hoạt)',
    };

    const primaryTenorMap: Record<string, string> = { LOW: 't24', MEDIUM: 't12', HIGH: 't3' };
    const primaryTenor = primaryTenorMap[riskLevel] || 't12';
    const maxRate = Math.max(...SAVINGS_DATA.banks.map(b => b.online[primaryTenor] || 0));

    const intro = `Lãi suất tiết kiệm online tốt nhất hiện tại lên tới **${maxRate}%/năm**. `
      + `Với khẩu vị ${riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao'}, `
      + `nên chọn ${tenorAdvice[riskLevel] || tenorAdvice.MEDIUM} — `
      + (riskLevel === 'LOW' ? 'chốt lãi dài hạn khi lãi suất còn cao.'
        : riskLevel === 'MEDIUM' ? 'cân bằng thanh khoản và lãi suất.'
        : 'giữ tiền mặt linh hoạt để chớp cơ hội đầu tư.');

    return success(res, {
      savingsItems: items,
      intro,
      updatedAt: SAVINGS_DATA.updatedAt,
      riskLevel,
    });
  } catch (err: any) {
    console.error('getSavingsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu tiết kiệm');
  }
}

let goldCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const GOLD_CACHE_TTL = 10 * 60 * 1000;

async function fetchGoldData() {
  const worldRes = await fetch(
    'https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d',
    { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
  );
  const worldJson: any = await worldRes.json();
  const worldMeta = worldJson?.chart?.result?.[0]?.meta;
  const worldPrice   = worldMeta?.regularMarketPrice ?? 0;
  const worldPrevClose = worldMeta?.chartPreviousClose ?? worldPrice;
  const worldChange  = worldPrevClose > 0 ? (worldPrice - worldPrevClose) / worldPrevClose * 100 : 0;

  const btmcRes = await fetch(
    'https://btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v',
    { headers: { Accept: 'application/json' } }
  );
  const btmcJson: any = await btmcRes.json();
  const rows = btmcJson?.DataList?.Data ?? [];

  let sjc: any = null, nhan: any = null;
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

export async function getGoldPrices(req: Request, res: Response) {
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

    const fmt  = (n: number) => n?.toLocaleString('vi-VN') + 'đ';
    const fmtW = (n: number) => `$${n?.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz`;
    const sign = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

    const sjcSpread = sjc ? Math.round((sjc.sell - sjc.buy) / sjc.sell * 100 * 10) / 10 : 0;

    const impliedNhan = sjc ? Math.round(worldPrice * 25500 / 8.29 / 100000) * 100000 : 0;
    const premiumSJC  = sjc && impliedNhan > 0
      ? Math.round((sjc.sell - impliedNhan) / impliedNhan * 100 * 10) / 10
      : 0;
    const sjcBenchmark = sjc || nhan;

    const goldItems = [
      {
        id: 'world',
        name: 'Vàng thế giới (GC=F)',
        tag: 'Futures · COMEX',
        historySource: { asset: 'gold', source: 'world', sourceType: 'direct' },
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
        historySource: { asset: 'gold', source: 'sjc', sourceType: 'direct', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
        price: sjc.sell,
        priceLabel: fmt(sjc.sell),
        buyPrice: sjc.buy,
        buyLabel: fmt(sjc.buy),
        change24h: worldChange,
        note: `Mua: ${fmt(sjc.buy)} · Bán: ${fmt(sjc.sell)} · Spread ${sjcSpread}%${premiumSJC > 0 ? ` · Premium so TG: +${premiumSJC}%` : ''}`,
        badge: 'Thanh khoản cao',
        badgeColor: 'amber',
      } : null,
      nhan ? {
        id: 'nhan',
        name: 'Nhẫn tròn trơn VRTL',
        tag: 'Trang sức · 1 chỉ',
        historySource: { asset: 'gold', source: 'ring', sourceType: 'direct', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
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
        name: 'Vàng thế giới quy đổi',
        tag: 'Proxy · XAU/USD',
        historySource: { asset: 'gold', source: 'world', sourceType: 'proxy', sourceLabel: 'Tham chiếu GC=F' },
        price: worldPrice,
        priceLabel: fmtW(worldPrice),
        change24h: worldChange,
        note: 'Dùng giá vàng thế giới GC=F làm tham chiếu vì chưa xác thực được ticker ETF vàng Việt Nam phù hợp',
        badge: 'Tham chiếu',
        badgeColor: 'blue',
      },
      {
        id: 'saving_gold',
        name: 'Tích lũy vàng DCA',
        tag: 'Chiến lược',
        historySource: { asset: 'gold', source: 'sjc', sourceType: 'proxy', sourceLabel: 'Proxy SJC 30 ngày', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
        price: sjcBenchmark?.sell ?? null,
        priceLabel: sjcBenchmark ? fmt(sjcBenchmark.sell) : 'Theo SJC/nhẫn',
        change24h: 0,
        note: sjcBenchmark
          ? `DCA theo giá bán ${sjc ? 'SJC' : 'nhẫn'} hiện tại ${fmt(sjcBenchmark.sell)}/chỉ · không phải sản phẩm có giá riêng`
          : 'Chiến lược DCA, chưa có sản phẩm có giá riêng để hiển thị',
        badge: 'Khuyên dùng',
        badgeColor: 'emerald',
      },
    ].filter(Boolean);

    const trend = worldChange > 1 ? 'đang tăng 📈' : worldChange > 0 ? 'tích cực nhẹ' : worldChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const intro = `Vàng thế giới ${trend} (${sign(worldChange)} hôm nay, $${worldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz). `
      + (sjc ? `Vàng SJC trong nước: ${fmt(sjc.sell)}/chỉ${premiumSJC > 5 ? ` — đang cao hơn TG ${premiumSJC}%, cân nhắc thời điểm mua.` : '.'}` : '');

    return success(res, { goldItems, intro, worldPrice, worldChange, cached: goldCache.fetchedAt !== now });
  } catch (err: any) {
    console.error('getGoldPrices error:', err.message);
    if (goldCache.data) {
      return success(res, { ...goldCache.data, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá vàng lúc này');
  }
}

let stockCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const STOCK_CACHE_TTL = 10 * 60 * 1000;

interface StockMeta {
  ticker: string;
  name: string;
  sector: string;
  tag: string;
}

const STOCK_UNIVERSE: StockMeta[] = [
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
  { ticker: 'E1VFVN30.VN', name: 'ETF E1VFVN30',  sector: 'ETF',          tag: 'Passive · Theo VN30' },
  { ticker: 'FUEVFVND.VN', name: 'ETF DCVFMVN Diamond', sector: 'ETF',    tag: 'Passive · Diamond' },
  { ticker: 'ACB.VN',  name: 'ACB Bank',           sector: 'Ngân hàng',    tag: 'Mid-cap · Tăng trưởng' },
  { ticker: 'REE.VN',  name: 'REE Corporation',    sector: 'Hạ tầng',      tag: 'Mid-cap · Cổ tức tốt' },
  { ticker: 'PNJ.VN',  name: 'PNJ',                sector: 'Trang sức',    tag: 'Mid-cap · Bán lẻ' },
  { ticker: 'DGC.VN',  name: 'Đức Giang Chemicals',sector: 'Hóa chất',     tag: 'Mid-cap · Xuất khẩu' },
];

const ASSET_HISTORY_MONTH_OPTIONS = new Set([6, 12, 18]);
const ASSET_HISTORY_DAY_OPTIONS = new Set([7, 14, 30]);

const ASSET_HISTORY_SOURCES: Record<string, any> = {
  gold: {
    world: {
      asset: 'gold',
      source: 'world',
      sourceType: 'direct',
      provider: 'yahoo',
      rangeType: 'months',
      ticker: 'GC=F',
      name: 'Vàng thế giới (GC=F)',
      metric: { key: 'price', unit: 'USD/oz', changeUnit: 'percent', decimals: 1 },
      dataSource: 'Yahoo Finance monthly close',
    },
    sjc: {
      asset: 'gold',
      source: 'sjc',
      sourceType: 'direct',
      provider: 'vangToday',
      rangeType: 'days',
      rangeOptions: [7, 14, 30],
      defaultRange: 30,
      goldType: 'VNGSJC',
      name: 'Vàng miếng SJC',
      metric: { key: 'price', unit: 'VND/chỉ', changeUnit: 'percent', decimals: 0 },
      dataSource: 'vang.today daily sell price',
    },
    ring: {
      asset: 'gold',
      source: 'ring',
      sourceType: 'direct',
      provider: 'vangToday',
      rangeType: 'days',
      rangeOptions: [7, 14, 30],
      defaultRange: 30,
      goldType: 'BT9999NTT',
      name: 'Nhẫn tròn trơn 9999',
      metric: { key: 'price', unit: 'VND/chỉ', changeUnit: 'percent', decimals: 0 },
      dataSource: 'vang.today daily sell price',
    },
  },
  bonds: {
    vn_gov_5y: {
      asset: 'bonds',
      source: 'vn_gov_5y',
      sourceType: 'officialAuction',
      provider: 'vbmaAuction',
      rangeType: 'months',
      tenor: 5,
      name: 'TPCP Việt Nam 5 năm',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'VBMA auction result pages',
    },
    vn_gov_10y: {
      asset: 'bonds',
      source: 'vn_gov_10y',
      sourceType: 'officialAuction',
      provider: 'vbmaAuction',
      rangeType: 'months',
      tenor: 10,
      name: 'TPCP Việt Nam 10 năm',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'VBMA auction result pages',
    },
    vn_gov_15y: {
      asset: 'bonds',
      source: 'vn_gov_15y',
      sourceType: 'officialAuction',
      provider: 'vbmaAuction',
      rangeType: 'months',
      tenor: 15,
      name: 'TPCP Việt Nam 15 năm',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'VBMA auction result pages',
    },
  },
};

function normalizeHistoryMonths(value: any): number {
  const months = Number.parseInt(value as string, 10);
  return ASSET_HISTORY_MONTH_OPTIONS.has(months) ? months : 12;
}

function normalizeHistoryDays(value: any): number {
  const days = Number.parseInt(value as string, 10);
  return ASSET_HISTORY_DAY_OPTIONS.has(days) ? days : 30;
}

function normalizeHistorySourceType(value: any, fallback: string): string {
  const normalized = String(value || '').trim();
  return ['direct', 'officialCurve', 'officialAuction', 'proxy'].includes(normalized)
    ? normalized
    : fallback;
}

function resolveStockMeta(rawTicker: any) {
  const raw = String(rawTicker || '').trim().toUpperCase();
  if (!raw) return null;

  const withSuffix = raw.endsWith('.VN') ? raw : `${raw}.VN`;
  return STOCK_UNIVERSE.find((meta) => {
    const ticker = meta.ticker.toUpperCase();
    const symbol = ticker.replace('.VN', '');
    return ticker === withSuffix || symbol === raw;
  });
}

function resolveAssetHistorySource(asset: string, query: any) {
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
      sourceType: 'direct',
      rangeType: 'months',
    };
  }

  const src = String(query.source || '').trim().toLowerCase();
  const sourceConfig = ASSET_HISTORY_SOURCES[asset]?.[src];
  if (!sourceConfig) return null;

  return {
    ...sourceConfig,
    sourceType: normalizeHistorySourceType(query.sourceType, sourceConfig.sourceType),
    sourceLabel: query.sourceLabel || sourceConfig.sourceLabel,
  };
}

function roundHistoryValue(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildMonthlyHistoryRows(rawHistory: any, months: number, metric: any) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;
  const rows = rawHistory.timestamps.map((timestamp: number, index: number) => {
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
    const roundedChange = Number(change.toFixed(2));

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

function buildDailyHistoryRows(rawHistory: any, days: number, metric: any) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;
  const rows = rawHistory.timestamps.map((timestamp: number, index: number) => {
    const value = roundHistoryValue(rawHistory.closes[index], decimals);
    const previousClose = index > 0 ? rawHistory.closes[index - 1] : null;
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const monthNumber = date.getUTCMonth() + 1;
    const dayNumber = date.getUTCDate();
    const month = `${year}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const label = `${String(dayNumber).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}`;
    const change = previousClose
      ? metric?.changeUnit === 'percentagePoint'
        ? value - previousClose
        : ((value - previousClose) / previousClose) * 100
      : 0;
    const roundedChange = Number(change.toFixed(2));

    return {
      month,
      label,
      value,
      close: value,
      change: roundedChange,
      changePct: roundedChange,
    };
  });

  return rows.slice(-days);
}

function buildMonthlyPointRows(series: any[], months: number, metric: any) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;
  const rows = series.map((point, index) => {
    const value = roundHistoryValue(point.value, decimals);
    const previousClose = index > 0 ? series[index - 1].value : null;
    const parts = point.month.split('-');
    const year = parts[0];
    const monthNumber = parts[1];
    const change = previousClose
      ? metric?.changeUnit === 'percentagePoint'
        ? value - previousClose
        : ((value - previousClose) / previousClose) * 100
      : 0;
    const roundedChange = Number(change.toFixed(2));

    return {
      month: point.month,
      label: `${monthNumber}/${String(year).slice(-2)}`,
      value,
      close: value,
      change: roundedChange,
      changePct: roundedChange,
      sourceLabel: point.sourceLabel,
      sourceUrl: point.sourceUrl,
    };
  });

  return rows.slice(-months);
}

function parseMarketNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;

  const hasThousandSuffix = /k/i.test(value);
  const cleaned = value
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(cleaned);
  return hasThousandSuffix ? parsed * 1000 : parsed;
}

function normalizeMarketTimestamp(value: any): number | null {
  if (typeof value === 'number') return value > 1_000_000_000_000 ? Math.floor(value / 1000) : value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeMarketTimestamp(numeric);

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }
  return null;
}

async function fetchVangTodayHistory(source: any, days: number) {
  const url = `https://www.vang.today/api/prices?type=${encodeURIComponent(source.goldType)}&days=${days}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(10000) : undefined,
  });

  if (!response.ok) {
    console.warn(`[InvestmentAdvisor] vang.today ${source.goldType}: HTTP ${response.status}`);
    return null;
  }

  const json: any = await response.json();
  const candidates = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.history)
    ? json.history
    : Array.isArray(json?.prices)
    ? json.prices
    : [];

  const byDay = new Map<string, any>();
  for (const row of candidates) {
    const nestedPrice = row.prices?.[source.goldType] || row.price?.[source.goldType] || row[source.goldType] || row;
    const timestamp = normalizeMarketTimestamp(
      row.update_time
      ?? nestedPrice.update_time
      ?? row.timestamp
      ?? row.time
      ?? row.date
    );
    const rawSell = nestedPrice.sell ?? nestedPrice.close ?? nestedPrice.price ?? nestedPrice.value ?? nestedPrice.buy;
    const sell = parseMarketNumber(rawSell);
    if (!timestamp || !Number.isFinite(sell) || sell <= 0) continue;

    const dateKey = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const previous = byDay.get(dateKey);
    if (!previous || timestamp >= previous.timestamp) {
      byDay.set(dateKey, { timestamp, close: sell / 10 });
    }
  }

  const rows = [...byDay.values()].sort((a, b) => a.timestamp - b.timestamp);
  if (rows.length < 2) {
    console.warn(`[InvestmentAdvisor] vang.today ${source.goldType}: insufficient history (${rows.length} points)`);
    return null;
  }

  return {
    timestamps: rows.map((row) => row.timestamp),
    closes: rows.map((row) => row.close),
  };
}

async function fetchStockQuote(ticker: string) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
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

function scoreStock(quote: any, meta: StockMeta, riskLevel: string) {
  if (!quote) return 0;
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const etfBonus = meta.sector === 'ETF' ? 20 : 0;

  const sectorMap: Record<string, Record<string, number>> = {
    LOW:    { 'Ngân hàng': 15, 'Tiêu dùng': 15, 'ETF': 20, 'Hạ tầng': 10 },
    MEDIUM: { 'Công nghệ': 15, 'Ngân hàng': 12, 'Bán lẻ': 10, 'ETF': 15, 'Tiêu dùng': 8 },
    HIGH:   { 'Công nghệ': 20, 'Hóa chất': 15, 'Thép': 12, 'Bán lẻ': 10 },
  };
  const sectorBonus = sectorMap[riskLevel]?.[meta.sector] || 0;

  const momentumScore = posIn52w * 30;

  const volScore = riskLevel === 'LOW'
    ? Math.max(0, 20 - Math.abs(change) * 4)
    : riskLevel === 'HIGH'
    ? Math.min(20, Math.abs(change) * 4)
    : Math.max(0, 20 - Math.max(0, Math.abs(change) - 2) * 5);

  return etfBonus + sectorBonus + momentumScore + volScore;
}

function buildStockCard(quote: any, meta: StockMeta, rank: number) {
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const priceLabel = quote.price?.toLocaleString('vi-VN') + 'đ';
  const changeSign = change >= 0 ? '+' : '';
  const rate = `${priceLabel} (${changeSign}${change.toFixed(2)}%)`;

  const pos52wLabel = posIn52w > 0.8 ? 'gần đỉnh 52 tuần' : posIn52w < 0.2 ? 'gần đáy 52 tuần' : 'vùng giữa 52 tuần';
  const trendLabel = change > 2 ? '🚀 tăng mạnh' : change > 0.5 ? '📈 tăng' : change < -2 ? '📉 giảm mạnh' : change < -0.5 ? '📉 giảm' : '➡️ đi ngang';
  const note = `${meta.sector} · ${pos52wLabel} · ${trendLabel} hôm nay`;

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

export async function getStockPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const now = Date.now();

    let quotes: Record<string, any>;
    if (stockCache.data && now - stockCache.fetchedAt < STOCK_CACHE_TTL) {
      quotes = stockCache.data;
    } else {
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

    const scored = STOCK_UNIVERSE
      .filter((m) => quotes[m.ticker])
      .map((m) => ({ meta: m, quote: quotes[m.ticker], score: scoreStock(quotes[m.ticker], m, riskLevel) }))
      .sort((a, b) => b.score - a.score);

    const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));

    const quoteList = Object.values(quotes);
    const avgChange = quoteList.length > 0 ? quoteList.reduce((sum, q) => {
      return sum + (q.prevClose > 0 ? (q.price - q.prevClose) / q.prevClose * 100 : 0);
    }, 0) / quoteList.length : 0;
    
    const marketMood = avgChange > 1 ? 'đang tăng 📈' : avgChange > 0 ? 'tích cực nhẹ' : avgChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const introMap: Record<string, string> = {
      LOW:    `VN-Index ${marketMood}. Với khẩu vị thấp, ưu tiên ETF và bluechip ngân hàng/tiêu dùng có cổ tức ổn định. DCA hàng tháng, không cần theo dõi thường xuyên.`,
      MEDIUM: `VN-Index ${marketMood}. Cân bằng giữa cổ phiếu tăng trưởng (FPT, MWG) và phòng thủ (VNM, VCB). Nên giữ 5–7 mã, review mỗi quý.`,
      HIGH:   `VN-Index ${marketMood}. Tập trung vào cổ phiếu tăng trưởng cao (công nghệ, hóa chất, thép). Rủi ro cao — cần theo dõi sát, đặt stop-loss.`,
    };

    return success(res, {
      stocks: top5,
      intro: introMap[riskLevel] || introMap.MEDIUM,
      riskLevel,
      cached: stockCache.fetchedAt !== now,
    });
  } catch (err: any) {
    console.error('getStockPrices error:', err.message);
    if (stockCache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const scored = STOCK_UNIVERSE
        .filter((m) => stockCache.data[m.ticker])
        .map((m) => ({ meta: m, quote: stockCache.data[m.ticker], score: scoreStock(stockCache.data[m.ticker], m, rl) }))
        .sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));
      return success(res, { stocks: top5, intro: '', riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy dữ liệu chứng khoán lúc này');
  }
}

export async function getAssetHistory(req: AuthenticatedRequest, res: Response) {
  const startedAt = Date.now();
  try {
    const asset = String(req.query.asset || 'stocks').toLowerCase();
    const source = resolveAssetHistorySource(asset, req.query);

    if (!source) {
      if (asset === 'savings') {
        return error(res, 'Tiết kiệm chưa có dữ liệu lịch sử theo tháng đã kiểm chứng', 400);
      }
      return error(res, 'Nguồn lịch sử tài sản không được hỗ trợ', 400);
    }

    const rangeType = source.rangeType === 'days' ? 'days' : 'months';
    const rangeValue = rangeType === 'days'
      ? normalizeHistoryDays(req.query.days)
      : normalizeHistoryMonths(req.query.months);

    console.info(
      `[InvestmentAdvisor] asset-history:start user=${shortUserId(req.userId)} asset=${source.asset} source=${source.source} provider=${source.provider || 'unknown'} metric=${source.metric.key} ${rangeType}=${rangeValue}`
    );

    let history: any[] = [];
    let dynamicUpdatedAt: string | null = null;
    let dynamicDataSource = source.dataSource;
    if (source.provider === 'vbmaAuction') {
      const vnBondHistory = await fetchVietnamGovBondAuctionHistory(18);
      const series = vnBondHistory.seriesByTenor?.[String(source.tenor)] || [];
      if (vnBondHistory?.stale || series.length === 0) {
        console.warn(`[InvestmentAdvisor] asset-history:vbma-source-unavailable source=${source.source} tenor=${source.tenor}`);
      }
      history = buildMonthlyPointRows(series, rangeValue, source.metric);
      dynamicUpdatedAt = vnBondHistory.updatedAt;
      dynamicDataSource = vnBondHistory.dataSource || source.dataSource;
    } else {
      const rawHistory: any = source.provider === 'vangToday'
        ? await fetchVangTodayHistory(source, rangeValue)
        : await fetchAssetHistory(source.ticker);

      if (!rawHistory) {
        console.warn(`[InvestmentAdvisor] asset-history:no-data asset=${source.asset} source=${source.source} provider=${source.provider || 'yahoo'}`);
        return error(res, 'Không có dữ liệu lịch sử cho nguồn này', 502);
      }

      history = rangeType === 'days'
        ? buildDailyHistoryRows(rawHistory, rangeValue, source.metric)
        : buildMonthlyHistoryRows(rawHistory, rangeValue, source.metric);
    }

    if (history.length === 0) {
      return error(res, 'Không đủ dữ liệu lịch sử để hiển thị biểu đồ', 404);
    }

    console.info(
      `[InvestmentAdvisor] asset-history:complete user=${shortUserId(req.userId)} asset=${source.asset} source=${source.source} metric=${source.metric.key} points=${history.length} durationMs=${Date.now() - startedAt}`
    );

    return success(res, {
      asset: source.asset,
      source: source.source,
      sourceType: source.sourceType,
      sourceLabel: source.sourceLabel,
      ticker: source.ticker,
      symbol: source.symbol,
      name: source.name,
      sector: source.sector,
      metric: source.metric,
      rangeType,
      [rangeType]: rangeValue,
      history,
      updatedAt: dynamicUpdatedAt || new Date().toISOString(),
      dataSource: dynamicDataSource,
    });
  } catch (err: any) {
    console.error('getAssetHistory error:', err.message);
    return error(res, 'Không thể lấy dữ liệu lịch sử tài sản');
  }
}

let cryptoCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const CRYPTO_CACHE_TTL_MS = 5 * 60 * 1000;

const STABLECOIN_IDS = new Set([
  'tether', 'usd-coin', 'binance-usd', 'dai', 'true-usd', 'usdd',
  'frax', 'liquity-usd', 'fei-usd', 'pax-dollar',
  'usd1', 'usd1-wlfi', 'ripple-usd', 'rlusd',
  'first-digital-usd', 'paypal-usd', 'mountain-protocol-usdm',
]);

const BLACKLIST_IDS = new Set([
  'wrapped-bitcoin', 'wrapped-ethereum', 'staked-ether', 'wrapped-steth',
  'rocket-pool-eth', 'coinbase-wrapped-staked-eth', 'mantle-staked-ether',
  'dogecoin', 'shiba-inu', 'pepe', 'floki', 'dogwifcoin', 'bonk',
  'official-trump', 'melania-meme', 'book-of-meme',
  'pudgy-penguins', 'axie-infinity', 'the-sandbox', 'decentraland',
  'xrp',
]);

function scoreCoin(coin: any, riskLevel: string = 'MEDIUM') {
  const mcap    = coin.market_cap || 0;
  const volume  = coin.total_volume || 0;
  const change  = Math.abs(coin.price_change_percentage_24h || 0);

  const mcapScore = Math.min(100, (Math.log10(Math.max(mcap, 1)) / Math.log10(3e12)) * 100);
  const mcapPenalty = mcap < 5e9 ? 30 : mcap < 20e9 ? 15 : 0;
  const mcapPenaltyApplied = mcapScore - mcapPenalty;

  const volRatio = mcap > 0 ? Math.min(volume / mcap, 0.15) : 0;
  const liqScore = Math.min(100, volRatio * 667);

  let volScore: number;
  if (riskLevel === 'LOW') {
    volScore = Math.max(0, 100 - change * 15);
  } else if (riskLevel === 'HIGH') {
    volScore = change >= 3 && change <= 20 ? 100 - Math.abs(change - 10) * 3 : Math.max(0, 60 - change);
  } else {
    volScore = Math.max(0, 100 - Math.max(0, change - 5) * 5);
  }

  return mcapPenaltyApplied * 0.5 + liqScore * 0.2 + volScore * 0.3;
}

function buildCoinCard(coin: any, rank: number) {
  const change   = coin.price_change_percentage_24h ?? 0;
  const mcap     = coin.market_cap ?? 0;
  const volRatio = mcap > 0 ? (coin.total_volume / mcap) : 0;

  let tag: string;
  if (coin.market_cap_rank <= 2)          tag = 'Top 2 — Blue-chip';
  else if (coin.market_cap_rank <= 10)    tag = `Top ${coin.market_cap_rank} — Large-cap`;
  else if (coin.market_cap_rank <= 50)    tag = `Top ${coin.market_cap_rank} — Mid-cap`;
  else                                    tag = 'Small-cap';

  const mcapLabel = mcap >= 1e12 ? `$${(mcap/1e12).toFixed(2)}T`
    : mcap >= 1e9 ? `$${(mcap/1e9).toFixed(0)}B`
    : `$${(mcap/1e6).toFixed(0)}M`;
  const liqLabel  = volRatio > 0.15 ? 'thanh khoản rất cao' : volRatio > 0.07 ? 'thanh khoản tốt' : 'thanh khoản trung bình';
  const trendLabel = change > 5 ? '🚀 đang tăng mạnh' : change > 1 ? '📈 xu hướng tăng' : change < -5 ? '📉 đang giảm mạnh' : change < -1 ? '📉 xu hướng giảm' : '➡️ đi ngang';
  const note = `MCap ${mcapLabel} · ${liqLabel} · ${trendLabel} 24h`;

  let badge = '', badgeColor = '';
  if (rank === 0)                          { badge = 'Tốt nhất';    badgeColor = 'amber';   }
  else if (coin.market_cap_rank <= 2)      { badge = 'Blue-chip';   badgeColor = 'amber';   }
  else if (change > 5)                     { badge = 'Đang tăng';   badgeColor = 'emerald'; }
  else if (volRatio > 0.15)                { badge = 'Thanh khoản'; badgeColor = 'blue';    }
  else if (coin.market_cap_rank <= 10)     { badge = 'Uy tín cao';  badgeColor = 'blue';    }

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

export async function getCryptoPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const now = Date.now();

    let rawCoins: any[];
    if (cryptoCache.data && now - cryptoCache.fetchedAt < CRYPTO_CACHE_TTL_MS) {
      rawCoins = cryptoCache.data;
    } else {
      const url = 'https://api.coingecko.com/api/v3/coins/markets'
        + '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
        + '&sparkline=false&price_change_percentage=24h';

      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      rawCoins = await response.json();
      cryptoCache = { data: rawCoins, fetchedAt: now };
    }

    const filtered = rawCoins.filter(
      (c) => !STABLECOIN_IDS.has(c.id)
          && !BLACKLIST_IDS.has(c.id)
          && !/usd|dollar/i.test(c.symbol)
    );

    const scored = filtered
      .map((c) => ({ coin: c, score: scoreCoin(c, riskLevel) }))
      .sort((a, b) => b.score - a.score);

    const top5 = scored.slice(0, 5).map((s, i) => buildCoinCard(s.coin, i));

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

    const filteredSlice = filtered.slice(0, 20);
    const avgChange = filteredSlice.length > 0 ? filteredSlice.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / filteredSlice.length : 0;
    const marketMood = avgChange > 3 ? 'đang tăng mạnh 🚀' : avgChange > 0 ? 'tích cực nhẹ 📈' : avgChange > -3 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const introMap: Record<string, string> = {
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
  } catch (err: any) {
    console.error('getCryptoPrices error:', err.message);
    if (cryptoCache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const filtered = cryptoCache.data.filter(
        (c: any) => !STABLECOIN_IDS.has(c.id) && !BLACKLIST_IDS.has(c.id)
      );
      const top5 = filtered
        .map((c: any) => ({ coin: c, score: scoreCoin(c, rl) }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5)
        .map((s: any, i: number) => buildCoinCard(s.coin, i));
      return success(res, { coins: top5, riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá crypto lúc này');
  }
}
