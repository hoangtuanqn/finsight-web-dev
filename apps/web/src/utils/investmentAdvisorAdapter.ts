const ASSET_KEYS = ['savings', 'gold', 'stocks', 'stocks_us', 'bonds', 'crypto'];

const ASSET_LABELS: Record<string, string> = {
  savings: 'Tiết kiệm',
  gold: 'Vàng',
  stocks: 'Cổ phiếu VN',
  stocks_us: 'Cổ phiếu Mỹ',
  bonds: 'Trái phiếu',
  crypto: 'Crypto',
};

const DEFAULT_RATES: Record<string, number> = {
  gold: 0.08,
  stocks: 0.12,
  bonds: 0.042,
  crypto: 0.15,
};

const STANDARD_HORIZONS = [1, 3, 5, 10];

function toNumber(value: any, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function horizonKey(years: number) {
  return `${years}y`;
}

function horizonLabel(years: number) {
  return `${years} năm`;
}

function calcFutureValue(capital: number, monthlyAdd: number, rate: number, years: number) {
  if (rate === 0) return capital + (monthlyAdd || 0) * 12 * years;
  return capital * Math.pow(1 + rate, years) + (monthlyAdd || 0) * 12 * ((Math.pow(1 + rate, years) - 1) / rate);
}

function getProfileRates(profile: any = {}) {
  return {
    savings: toNumber(profile.savingsRate, 6) / 100,
    ...DEFAULT_RATES,
  };
}

export function getAllocationFromSource(source: any = {}) {
  return Object.fromEntries(ASSET_KEYS.map((key) => [key, toNumber(source?.[key])]));
}

export function buildPortfolioBreakdown(allocation: any, profile: any = {}, providedBreakdown: any = null) {
  if (Array.isArray(providedBreakdown) && providedBreakdown.length > 0) {
    return providedBreakdown.map((item: any) => ({
      asset: item.asset,
      percentage: toNumber(item.percentage),
      amount: toNumber(item.amount),
    }));
  }

  const capital = toNumber(profile.capital);
  return ASSET_KEYS.map((key) => ({
    asset: ASSET_LABELS[key],
    percentage: allocation[key],
    amount: (capital * allocation[key]) / 100,
  }));
}

export function buildPieData(allocation: any) {
  return ASSET_KEYS.filter((key) => allocation[key] > 0).map((key) => ({
    name: ASSET_LABELS[key],
    value: allocation[key],
    key,
  }));
}

function buildLegacyProjection(allocation: any, profile: any = {}) {
  const capital = toNumber(profile.capital);
  const monthlyAdd = toNumber(profile.monthlyAdd);
  const inflationRate = profile.inflationRate !== undefined ? toNumber(profile.inflationRate) / 100 : 0.035;
  const rates: any = getProfileRates(profile);
  const weightedReturn = ASSET_KEYS.reduce((sum, key) => sum + allocation[key] * rates[key], 0) / 100;
  const realReturn = weightedReturn - inflationRate;
  const optimisticReturn = weightedReturn * 1.3 - inflationRate;
  const pessimisticReturn = Math.max(-0.5, weightedReturn * 0.5 - inflationRate);

  return {
    base: Object.fromEntries(
      STANDARD_HORIZONS.map((years) => [
        horizonKey(years),
        Math.round(calcFutureValue(capital, monthlyAdd, realReturn, years)),
      ]),
    ),
    optimistic: Object.fromEntries(
      STANDARD_HORIZONS.map((years) => [
        horizonKey(years),
        Math.round(calcFutureValue(capital, monthlyAdd, optimisticReturn, years)),
      ]),
    ),
    pessimistic: Object.fromEntries(
      STANDARD_HORIZONS.map((years) => [
        horizonKey(years),
        Math.round(calcFutureValue(capital, monthlyAdd, pessimisticReturn, years)),
      ]),
    ),
    monteCarlo: null as any,
    probLoss: null as any,
  };
}

function chooseProjection(projection: any, allocation: any, profile: any) {
  if (projection?.base && projection?.optimistic && projection?.pessimistic) {
    return projection;
  }

  return buildLegacyProjection(allocation, profile);
}

export function buildProjectionData(projection: any, profile: any = {}) {
  const capital = toNumber(profile.capital);
  const monthlyAdd = toNumber(profile.monthlyAdd);
  const inflationRate = profile.inflationRate !== undefined ? toNumber(profile.inflationRate) / 100 : 0.035;
  const savingsRate = toNumber(profile.savingsRate, 6) / 100 - inflationRate;

  return [
    {
      year: 'Hiện tại',
      base: capital,
      optimistic: capital,
      pessimistic: capital,
      savings: capital,
    },
    ...STANDARD_HORIZONS.map((years) => {
      const key = horizonKey(years);
      return {
        year: horizonLabel(years),
        base: toNumber(projection?.base?.[key]),
        optimistic: toNumber(projection?.optimistic?.[key]),
        pessimistic: toNumber(projection?.pessimistic?.[key]),
        savings: Math.round(calcFutureValue(capital, monthlyAdd, savingsRate, years)),
      };
    }),
  ];
}

export function buildMonteCarloData(projection: any = null, profile: any = {}) {
  const monteCarlo = projection?.monteCarlo;
  if (!monteCarlo) return [];

  const capital = toNumber(profile.capital);
  const monthlyAdd = toNumber(profile.monthlyAdd);
  const inflationRate = profile.inflationRate !== undefined ? toNumber(profile.inflationRate) / 100 : 0.035;
  const savingsRate = toNumber(profile.savingsRate, 6) / 100 - inflationRate;
  const currentRow = {
    year: 'Hiện tại',
    horizon: 0,
    p5: capital,
    p25: capital,
    median: capital,
    p75: capital,
    p95: capital,
    mean: capital,
    probLoss: 0,
    savings: capital,
    band90Base: capital,
    band90Range: 0,
    band50Base: capital,
    band50Range: 0,
  };

  const rows = STANDARD_HORIZONS.map((years) => {
    const key = horizonKey(years);
    const item = monteCarlo[key];
    if (!item) return null;
    const p5 = toNumber(item.p5);
    const p25 = toNumber(item.p25);
    const p75 = toNumber(item.p75);
    const p95 = toNumber(item.p95);

    return {
      year: horizonLabel(years),
      horizon: years,
      p5,
      p25,
      median: toNumber(item.median),
      p75,
      p95,
      mean: toNumber(item.mean),
      probLoss: toNumber(item.probLoss),
      savings: Math.round(calcFutureValue(capital, monthlyAdd, savingsRate, years)),
      band90Base: p5,
      band90Range: Math.max(0, p95 - p5),
      band50Base: p25,
      band50Range: Math.max(0, p75 - p25),
    };
  }).filter(Boolean);

  return rows.length > 0 ? [currentRow, ...rows] : [];
}

function buildViewModel({
  allocation,
  profile,
  source,
  providedBreakdown = null,
  projection = null,
  recommendation = '',
  sentimentData = null,
  riskMetrics = null,
  optimization = null,
  optimizationMethod = null,
  allocationMetrics = null,
  cryptoWarning = null,
  stressTests = null,
  marketViews = null,
}: any) {
  const selectedProjection = chooseProjection(projection, allocation, profile);

  return {
    allocation,
    portfolioBreakdown: buildPortfolioBreakdown(allocation, profile, providedBreakdown),
    pieData: buildPieData(allocation),
    projectionBase: selectedProjection.base || {},
    projectionData: buildProjectionData(selectedProjection, profile),
    monteCarloData: buildMonteCarloData(selectedProjection, profile),
    riskMetrics,
    stressTests,
    optimization,
    optimizationMethod,
    allocationMetrics,
    dataQuality: optimization?.marketDataQuality || null,
    recommendation,
    sentimentData,
    cryptoWarning,
    source,
    marketViews,
  };
}

export function normalizeAllocationAnalysis(apiData: any = {}, profile: any = {}) {
  const allocation = getAllocationFromSource(apiData.allocation);

  return buildViewModel({
    allocation,
    profile,
    source: 'allocation-api',
    providedBreakdown: apiData.portfolioBreakdown,
    projection: apiData.projection,
    recommendation: apiData.recommendation,
    sentimentData: apiData.sentimentData,
    riskMetrics: apiData.riskMetrics,
    optimization: apiData.optimization,
    optimizationMethod: apiData.optimizationMethod,
    allocationMetrics: apiData.allocationMetrics,
    cryptoWarning: apiData.cryptoWarning,
    stressTests: apiData.stressTests,
    marketViews: apiData.marketViews,
  });
}

export function normalizeStrategy(strategy: any = {}, profile: any = {}) {
  const allocation = getAllocationFromSource(strategy);
  const sentimentData = {
    value: toNumber(strategy.sentimentValue, 50),
    label: strategy.sentimentLabel || 'NEUTRAL',
    labelVi: strategy.sentimentVietnamese || null,
  };

  return buildViewModel({
    allocation,
    profile,
    source: 'strategy-legacy',
    recommendation: strategy.recommendation || '',
    sentimentData,
    marketViews: strategy.marketViews || [],
  });
}
