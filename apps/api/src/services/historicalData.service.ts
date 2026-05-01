import * as math from 'mathjs';
import {
  ASSET_TICKERS,
  ASSET_ORDER,
  HISTORY_CONFIG,
  FALLBACK_PARAMS,
} from '../constants/assetTickers';
import redis from '../lib/redis';

/**
 * historicalData.service.ts — Historical Data Engine
 */

export interface AssetHistory {
  timestamps: number[];
  closes: number[];
}

/**
 * Lấy monthly adjusted close prices từ Yahoo Finance.
 */
export async function fetchAssetHistory(ticker: string, years: number = HISTORY_CONFIG.years): Promise<AssetHistory | null> {
  const cacheKey = `${HISTORY_CONFIG.cacheKeyPrefix}:${ticker}`;

  // Check Redis cache
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore cache errors */ }
  }

  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`
      + `?interval=${HISTORY_CONFIG.interval}&range=${years}y`;

    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.warn(`[HistoricalData] Yahoo Finance ${ticker}: HTTP ${response.status}`);
      return null;
    }

    const json = await response.json() as any;
    const result = json?.chart?.result?.[0];

    if (!result) {
      console.warn(`[HistoricalData] Yahoo Finance ${ticker}: no result`);
      return null;
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.adjclose?.[0]?.adjclose
      || result.indicators?.quote?.[0]?.close
      || [];

    const validData: AssetHistory = { timestamps: [], closes: [] };
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null && closes[i] > 0) {
        validData.timestamps.push(timestamps[i]);
        validData.closes.push(closes[i]);
      }
    }

    if (validData.closes.length < 13) {
      console.warn(`[HistoricalData] ${ticker}: insufficient data (${validData.closes.length} points)`);
      return null;
    }

    if (redis) {
      try {
        await redis.setex(cacheKey, HISTORY_CONFIG.cacheTTL, JSON.stringify(validData));
      } catch { /* ignore cache errors */ }
    }

    return validData;
  } catch (err: any) {
    console.error(`[HistoricalData] fetchAssetHistory(${ticker}) error:`, err.message);
    return null;
  }
}

export function calcLogReturns(closes: number[]): number[] {
  const returns = new Array(closes.length - 1);
  for (let i = 0; i < returns.length; i++) {
    returns[i] = Math.log(closes[i + 1] / closes[i]);
  }
  return returns;
}

export function calcMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

export function calcStdDev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = calcMean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function annualizeReturn(monthlyReturn: number): number {
  return monthlyReturn * 12;
}

export function annualizeStdDev(monthlyStdDev: number): number {
  return monthlyStdDev * Math.sqrt(12);
}

export function calcCovarianceMatrix(returnsArrays: number[][]): math.Matrix {
  const k = returnsArrays.length;
  const minLen = Math.min(...returnsArrays.map(r => r.length));
  const aligned = returnsArrays.map(r => r.slice(0, minLen));

  const means = aligned.map(r => calcMean(r));
  const demeaned = aligned.map((r, i) => r.map(v => v - means[i]));

  const n = minLen;
  const cov = Array.from({ length: k }, () => new Array(k).fill(0));

  for (let i = 0; i < k; i++) {
    for (let j = i; j < k; j++) {
      let sum = 0;
      for (let t = 0; t < n; t++) {
        sum += demeaned[i][t] * demeaned[j][t];
      }
      const value = sum / (n - 1);
      cov[i][j] = value;
      cov[j][i] = value;
    }
  }

  return math.matrix(cov);
}

export function calcCorrelationMatrix(covMatrix: math.Matrix, stdDevs: number[]): math.Matrix {
  const size = stdDevs.length;
  const corr = Array.from({ length: size }, () => new Array(size).fill(0));
  const covArr = covMatrix.toArray() as number[][];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (stdDevs[i] === 0 || stdDevs[j] === 0) {
        corr[i][j] = i === j ? 1 : 0;
      } else {
        corr[i][j] = covArr[i][j] / (stdDevs[i] * stdDevs[j]);
        corr[i][j] = Math.max(-1, Math.min(1, corr[i][j]));
      }
    }
  }

  return math.matrix(corr);
}

export async function buildMarketParams(savingsRate: number = 0.05, options: any = {}) {
  const tickerEntries = Object.entries(ASSET_TICKERS).filter(([, ticker]) => Boolean(ticker)) as [string, string][];
  const historyFetcher = options.fetchAssetHistory || fetchAssetHistory;

  const fetchResults = await Promise.allSettled(
    tickerEntries.map(async ([asset, ticker]) => {
      const data = await historyFetcher(ticker);
      return { asset, data };
    })
  );

  const assetReturns: Record<string, number[] | null> = {};
  const means: Record<string, number> = {};
  const stdDevs: Record<string, number> = {};
  let dataQuality = 'full';
  const dataDetails: Record<string, any> = {};

  means.savings = savingsRate;
  stdDevs.savings = FALLBACK_PARAMS.savings.annualStdDev;
  assetReturns.savings = null;

  for (const asset of ASSET_ORDER) {
    if (asset === 'savings' || ASSET_TICKERS[asset]) continue;

    const fb = (FALLBACK_PARAMS as any)[asset];
    if (fb) {
      means[asset] = fb.annualReturn;
      stdDevs[asset] = fb.annualStdDev;
      assetReturns[asset] = null;
      dataQuality = 'partial';
      dataDetails[asset] = 'fallback:no-ticker';
    }
  }

  for (const result of fetchResults) {
    if (result.status !== 'fulfilled' || !result.value.data) {
      const asset = result.status === 'fulfilled' ? result.value.asset : 'unknown';
      console.warn(`[HistoricalData] Using fallback for: ${asset}`);
      const fb = (FALLBACK_PARAMS as any)[asset];
      if (fb) {
        means[asset] = fb.annualReturn;
        stdDevs[asset] = fb.annualStdDev;
        assetReturns[asset] = null;
        dataQuality = 'partial';
        dataDetails[asset] = 'fallback';
      }
      continue;
    }

    const { asset, data } = result.value;
    const returns = calcLogReturns(data.closes);
    const monthlyMean = calcMean(returns);
    const monthlyStd = calcStdDev(returns);

    means[asset] = annualizeReturn(monthlyMean);
    stdDevs[asset] = annualizeStdDev(monthlyStd);
    assetReturns[asset] = returns;
    dataDetails[asset] = { points: data.closes.length, returns: returns.length };
  }

  const hasRealData = Object.values(assetReturns).some(r => r !== null);
  if (!hasRealData) {
    dataQuality = 'fallback';
    console.warn('[HistoricalData] All fetches failed — using full fallback');
  }

  // Ghi đè yield bonds bằng dữ liệu thực từ VBMA auction (10Y)
  try {
    const { fetchVietnamGovBondAuctionHistory, getLatestVietnamGovBondYields } =
      await import('./vietnamBondHistory.service.js');
    const bondHistory = await fetchVietnamGovBondAuctionHistory(3);
    const latestYields = getLatestVietnamGovBondYields(bondHistory);
    if (latestYields[10] && latestYields[10] > 0) {
      means.bonds = latestYields[10] / 100;
      dataDetails.bonds = { source: 'vbma-auction', yield10y: latestYields[10] };
    }
  } catch {
    // giữ fallback từ FALLBACK_PARAMS
  }

  const covSize = ASSET_ORDER.length;
  const realAssets = ASSET_ORDER.filter(a => assetReturns[a] !== null && a !== 'savings');
  console.log(`[HistoricalData] buildMarketParams: ASSET_ORDER=${JSON.stringify(ASSET_ORDER)} covSize=${covSize} realAssets=${JSON.stringify(realAssets)}`);
  const covArray = Array.from({ length: covSize }, () => new Array(covSize).fill(0));

  if (realAssets.length >= 2) {
    const realReturnsArrays = realAssets.map(a => assetReturns[a] as number[]);
    const realCov = calcCovarianceMatrix(realReturnsArrays);
    const realCovArr = realCov.toArray() as number[][];

    for (let i = 0; i < realAssets.length; i++) {
      for (let j = 0; j < realAssets.length; j++) {
        const ii = ASSET_ORDER.indexOf(realAssets[i] as any);
        const jj = ASSET_ORDER.indexOf(realAssets[j] as any);
        covArray[ii][jj] = realCovArr[i][j] * 12;
      }
    }
  }

  for (let i = 0; i < covSize; i++) {
    const asset = ASSET_ORDER[i];
    if (covArray[i][i] === 0) {
      covArray[i][i] = stdDevs[asset] ** 2;
    }
  }

  const covMatrix = math.matrix(covArray);

  const stdDevsArray = ASSET_ORDER.map((a, i) => {
    const variance = covArray[i][i];
    return variance > 0 ? Math.sqrt(variance) : (stdDevs[a] || 0);
  });
  const corrMatrix = calcCorrelationMatrix(covMatrix, stdDevsArray);

  const meansArray = ASSET_ORDER.map(a => means[a] || 0);

  return {
    means: meansArray,
    stdDevs: stdDevsArray,
    covMatrix,
    corrMatrix,
    assetOrder: ASSET_ORDER,
    dataQuality,
    dataDetails,
    updatedAt: new Date().toISOString(),
  };
}

const MARKET_PARAMS_CACHE_KEY = 'market:params:v3';
const MARKET_PARAMS_TTL = 86400;

export async function getMarketParams(savingsRate: number = 0.05) {
  if (redis) {
    try {
      const cached = await redis.get(MARKET_PARAMS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        parsed.covMatrix = math.matrix(parsed.covMatrix);
        parsed.corrMatrix = math.matrix(parsed.corrMatrix);
        return parsed;
      }
    } catch { /* ignore cache errors */ }
  }

  const params = await buildMarketParams(savingsRate);

  if (redis) {
    try {
      const serializable = {
        ...params,
        covMatrix: params.covMatrix.toArray(),
        corrMatrix: params.corrMatrix.toArray(),
      };
      await redis.setex(MARKET_PARAMS_CACHE_KEY, MARKET_PARAMS_TTL, JSON.stringify(serializable));
    } catch { /* ignore cache errors */ }
  }

  return params;
}
