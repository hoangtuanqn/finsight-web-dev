/**
 * historicalData.service.js — Historical Data Engine
 *
 * Thu thập dữ liệu lịch sử 5 năm (monthly) từ Yahoo Finance,
 * tính toán market parameters dựa trên log returns.
 *
 * Output: { means[5], stdDevs[5], covMatrix[5×5], corrMatrix[5×5] }
 *
 * Academic basis:
 *   - Log returns: r_t = ln(P_t / P_{t-1}) — Sharpe (1994)
 *   - Sample covariance: Σ = R^T × R / (n-1)
 *   - Annualization: μ_annual = μ_monthly × 12, σ_annual = σ_monthly × √12
 *
 * Xem chi tiết: docs/todo/LOGIC-advanced-investment-algorithms.md
 */

import * as math from 'mathjs';
import {
  ASSET_TICKERS,
  ASSET_ORDER,
  HISTORY_CONFIG,
  FALLBACK_PARAMS,
} from '../constants/assetTickers.js';

let redisClientPromise = null;

async function getRedisClient() {
  if (!redisClientPromise) {
    redisClientPromise = import('../lib/redis.js')
      .then(module => module.default)
      .catch(() => null);
  }
  return redisClientPromise;
}

// ─── Fetch historical monthly closes from Yahoo Finance ───────────────────────

/**
 * Lấy monthly adjusted close prices từ Yahoo Finance.
 *
 * @param {string} ticker - Yahoo Finance ticker (e.g. 'GC=F', '^VNINDEX')
 * @param {number} years - Số năm historical data (default: 5)
 * @returns {Promise<{timestamps: number[], closes: number[]}|null>}
 */
export async function fetchAssetHistory(ticker, years = HISTORY_CONFIG.years) {
  const cacheKey = `${HISTORY_CONFIG.cacheKeyPrefix}:${ticker}`;
  const redis = await getRedisClient();

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

    const json = await response.json();
    const result = json?.chart?.result?.[0];

    if (!result) {
      console.warn(`[HistoricalData] Yahoo Finance ${ticker}: no result`);
      return null;
    }

    const timestamps = result.timestamp || [];
    // Prefer adjusted close, fall back to regular close
    const closes = result.indicators?.adjclose?.[0]?.adjclose
      || result.indicators?.quote?.[0]?.close
      || [];

    // Filter out null/undefined entries (Yahoo sometimes has gaps)
    const validData = { timestamps: [], closes: [] };
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] != null && closes[i] > 0) {
        validData.timestamps.push(timestamps[i]);
        validData.closes.push(closes[i]);
      }
    }

    if (validData.closes.length < 13) {
      // Need at least 13 months for 12 monthly returns
      console.warn(`[HistoricalData] ${ticker}: insufficient data (${validData.closes.length} points)`);
      return null;
    }

    // Cache for 24 hours
    if (redis) {
      try {
        await redis.setex(cacheKey, HISTORY_CONFIG.cacheTTL, JSON.stringify(validData));
      } catch { /* ignore cache errors */ }
    }

    return validData;
  } catch (err) {
    console.error(`[HistoricalData] fetchAssetHistory(${ticker}) error:`, err.message);
    return null;
  }
}

// ─── Statistical calculations ─────────────────────────────────────────────────

/**
 * Tính log returns từ price series.
 * r_t = ln(P_t / P_{t-1})
 *
 * @param {number[]} closes - Monthly close prices
 * @returns {number[]} Log returns (length = closes.length - 1)
 */
export function calcLogReturns(closes) {
  const returns = new Array(closes.length - 1);
  for (let i = 0; i < returns.length; i++) {
    returns[i] = Math.log(closes[i + 1] / closes[i]);
  }
  return returns;
}

/**
 * Tính mean (trung bình) của một mảng số.
 * @param {number[]} arr
 * @returns {number}
 */
export function calcMean(arr) {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, v) => sum + v, 0) / arr.length;
}

/**
 * Tính sample standard deviation.
 * σ = sqrt(Σ(x_i - μ)² / (n-1))
 *
 * @param {number[]} arr
 * @returns {number}
 */
export function calcStdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = calcMean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/**
 * Annualize monthly return.
 * μ_annual = μ_monthly × 12
 *
 * @param {number} monthlyReturn
 * @returns {number}
 */
export function annualizeReturn(monthlyReturn) {
  return monthlyReturn * 12;
}

/**
 * Annualize monthly standard deviation.
 * σ_annual = σ_monthly × √12
 *
 * @param {number} monthlyStdDev
 * @returns {number}
 */
export function annualizeStdDev(monthlyStdDev) {
  return monthlyStdDev * Math.sqrt(12);
}

// ─── Covariance & Correlation Matrices ────────────────────────────────────────

/**
 * Tính sample covariance matrix từ nhiều chuỗi returns.
 * Σ = R^T × R / (n-1) (demeaned returns)
 *
 * @param {number[][]} returnsArrays - Array of return series (mỗi asset 1 array)
 * @returns {math.Matrix} Covariance matrix (k×k where k = number of assets)
 */
export function calcCovarianceMatrix(returnsArrays) {
  const k = returnsArrays.length; // number of assets
  // Align lengths (truncate to shortest)
  const minLen = Math.min(...returnsArrays.map(r => r.length));
  const aligned = returnsArrays.map(r => r.slice(0, minLen));

  // Demean each series
  const means = aligned.map(r => calcMean(r));
  const demeaned = aligned.map((r, i) => r.map(v => v - means[i]));

  // Build covariance matrix: cov[i][j] = Σ(d_i[t] × d_j[t]) / (n-1)
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
      cov[j][i] = value; // symmetric
    }
  }

  return math.matrix(cov);
}

/**
 * Tính correlation matrix từ covariance matrix.
 * ρ_ij = Σ_ij / (σ_i × σ_j)
 *
 * @param {math.Matrix} covMatrix - Covariance matrix
 * @param {number[]} stdDevs - Standard deviations of each asset
 * @returns {math.Matrix} Correlation matrix
 */
export function calcCorrelationMatrix(covMatrix, stdDevs) {
  const size = stdDevs.length;
  const corr = Array.from({ length: size }, () => new Array(size).fill(0));
  const covArr = covMatrix.toArray();

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (stdDevs[i] === 0 || stdDevs[j] === 0) {
        corr[i][j] = i === j ? 1 : 0;
      } else {
        corr[i][j] = covArr[i][j] / (stdDevs[i] * stdDevs[j]);
        // Clamp to [-1, 1] for numerical safety
        corr[i][j] = Math.max(-1, Math.min(1, corr[i][j]));
      }
    }
  }

  return math.matrix(corr);
}

// ─── Build complete market parameters ─────────────────────────────────────────

/**
 * Build complete market parameters from historical data.
 *
 * Fetches 5y monthly data for 4 assets (savings is fixed-rate),
 * computes log returns, covariance matrix, correlation matrix.
 *
 * @param {number} savingsRate - Annual savings rate (e.g. 0.05 for 5%)
 * @returns {Promise<Object>} marketParams
 */
export async function buildMarketParams(savingsRate = 0.05, options = {}) {
  const tickerEntries = Object.entries(ASSET_TICKERS).filter(([, ticker]) => Boolean(ticker)); // [['gold','GC=F'], ...]
  const historyFetcher = options.fetchAssetHistory || fetchAssetHistory;

  // Fetch all tickers in parallel
  const fetchResults = await Promise.allSettled(
    tickerEntries.map(async ([asset, ticker]) => {
      const data = await historyFetcher(ticker);
      return { asset, data };
    })
  );

  // Process results, use fallback for failed fetches
  const assetReturns = {}; // { gold: returns[], stocks: returns[], ... }
  const means = {};        // annualized means
  const stdDevs = {};      // annualized stdDevs
  let dataQuality = 'full';
  const dataDetails = {};

  // Savings: fixed rate, near-zero variance
  means.savings = savingsRate;
  stdDevs.savings = FALLBACK_PARAMS.savings.annualStdDev;
  assetReturns.savings = null; // not used in covariance calc (treated specially)

  for (const asset of ASSET_ORDER) {
    if (asset === 'savings' || ASSET_TICKERS[asset]) continue;

    const fb = FALLBACK_PARAMS[asset];
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
      const fb = FALLBACK_PARAMS[asset];
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

  // Check if all fetches failed
  const hasRealData = Object.values(assetReturns).some(r => r !== null);
  if (!hasRealData) {
    dataQuality = 'fallback';
    console.warn('[HistoricalData] All fetches failed — using full fallback');
  }

  // Build covariance matrix (5×5) following ASSET_ORDER
  // For assets with real data: compute from returns
  // For assets with fallback or savings: use diagonal (variance only, zero covariance)
  const covSize = ASSET_ORDER.length;
  const covArray = Array.from({ length: covSize }, () => new Array(covSize).fill(0));

  // Get returns arrays that have real data (excluding savings)
  const realAssets = ASSET_ORDER.filter(a => assetReturns[a] !== null && a !== 'savings');

  if (realAssets.length >= 2) {
    // Compute covariance from real data
    const realReturnsArrays = realAssets.map(a => assetReturns[a]);
    const realCov = calcCovarianceMatrix(realReturnsArrays);
    const realCovArr = realCov.toArray();

    // Map back to full 5×5 matrix
    for (let i = 0; i < realAssets.length; i++) {
      for (let j = 0; j < realAssets.length; j++) {
        const ii = ASSET_ORDER.indexOf(realAssets[i]);
        const jj = ASSET_ORDER.indexOf(realAssets[j]);
        // Annualize monthly covariance: Σ_annual = Σ_monthly × 12
        covArray[ii][jj] = realCovArr[i][j] * 12;
      }
    }
  }

  // Fill diagonal for assets without real covariance data (savings, failed tickers)
  for (let i = 0; i < covSize; i++) {
    const asset = ASSET_ORDER[i];
    if (covArray[i][i] === 0) {
      covArray[i][i] = stdDevs[asset] ** 2; // variance = stdDev²
    }
  }

  const covMatrix = math.matrix(covArray);

  // Build stdDevs array from covMatrix diagonal for consistency
  // This ensures corr[i][i] = cov[i][i] / (σi × σi) = 1.0 exactly
  const stdDevsArray = ASSET_ORDER.map((a, i) => {
    const variance = covArray[i][i];
    return variance > 0 ? Math.sqrt(variance) : (stdDevs[a] || 0);
  });
  const corrMatrix = calcCorrelationMatrix(covMatrix, stdDevsArray);

  // Build means array in ASSET_ORDER
  const meansArray = ASSET_ORDER.map(a => means[a] || 0);

  return {
    means: meansArray,             // [5] annualized expected returns
    stdDevs: stdDevsArray,         // [5] annualized standard deviations
    covMatrix,                     // math.Matrix [5×5] annualized covariance
    corrMatrix,                    // math.Matrix [5×5] correlation
    assetOrder: ASSET_ORDER,       // ['savings', 'gold', 'stocks', 'bonds', 'crypto']
    dataQuality,                   // 'full' | 'partial' | 'fallback'
    dataDetails,                   // per-asset data source info
    updatedAt: new Date().toISOString(),
  };
}

// ─── Cached wrapper ───────────────────────────────────────────────────────────

const MARKET_PARAMS_CACHE_KEY = 'market:params';
const MARKET_PARAMS_TTL = 86400; // 24 hours

/**
 * Get market parameters with Redis caching (24h).
 * Falls back to buildMarketParams() on cache miss.
 *
 * @param {number} savingsRate - Annual savings rate
 * @returns {Promise<Object>} marketParams
 */
export async function getMarketParams(savingsRate = 0.05) {
  const redis = await getRedisClient();

  // Check cache
  if (redis) {
    try {
      const cached = await redis.get(MARKET_PARAMS_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Reconstruct math.Matrix from arrays
        parsed.covMatrix = math.matrix(parsed.covMatrix);
        parsed.corrMatrix = math.matrix(parsed.corrMatrix);
        return parsed;
      }
    } catch { /* ignore cache errors */ }
  }

  // Build fresh
  const params = await buildMarketParams(savingsRate);

  // Cache (serialize matrices as arrays)
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
