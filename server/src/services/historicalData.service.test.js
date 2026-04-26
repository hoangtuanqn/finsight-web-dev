import test from 'node:test';
import assert from 'node:assert/strict';
import {
  annualizeReturn,
  annualizeStdDev,
  buildMarketParams,
  calcCorrelationMatrix,
  calcCovarianceMatrix,
  calcLogReturns,
  calcMean,
  calcStdDev,
} from './historicalData.service.js';
import {
  ASSET_ORDER,
  ASSET_TICKERS,
  FALLBACK_PARAMS,
} from '../constants/assetTickers.js';

function expectNear(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
}

function makeHistory(start, monthlyGrowth) {
  return {
    timestamps: Array.from({ length: 14 }, (_, index) => index),
    closes: Array.from({ length: 14 }, (_, index) => start * Math.pow(1 + monthlyGrowth, index)),
  };
}

test('calcLogReturns uses natural log price ratios', () => {
  const returns = calcLogReturns([100, 110, 121]);

  expectNear(returns[0], Math.log(1.1));
  expectNear(returns[1], Math.log(1.1));
});

test('mean and sample standard deviation follow statistical definitions', () => {
  const values = [0.01, 0.02, 0.03];

  expectNear(calcMean(values), 0.02);
  expectNear(calcStdDev(values), 0.01);
});

test('annualization converts monthly mean and volatility', () => {
  expectNear(annualizeReturn(0.01), 0.12);
  expectNear(annualizeStdDev(0.02), 0.02 * Math.sqrt(12));
});

test('calcCovarianceMatrix returns a symmetric sample covariance matrix', () => {
  const cov = calcCovarianceMatrix([
    [0.01, 0.02, 0.03],
    [0.02, 0.04, 0.06],
  ]).toArray();

  expectNear(cov[0][0], 0.0001);
  expectNear(cov[1][1], 0.0004);
  expectNear(cov[0][1], 0.0002);
  expectNear(cov[1][0], 0.0002);
});

test('calcCorrelationMatrix clamps correlations to valid range', () => {
  const covMatrix = calcCovarianceMatrix([
    [0.01, 0.02, 0.03],
    [0.02, 0.04, 0.06],
  ]);
  const corr = calcCorrelationMatrix(covMatrix, [0.01, 0.02]).toArray();

  expectNear(corr[0][0], 1);
  expectNear(corr[1][1], 1);
  expectNear(corr[0][1], 1);
  expectNear(corr[1][0], 1);
});

test('buildMarketParams uses partial fallback when one ticker fails', async () => {
  const params = await buildMarketParams(0.05, {
    fetchAssetHistory: async ticker => (
      ticker === ASSET_TICKERS.stocks ? null : makeHistory(100, 0.01)
    ),
  });
  const stocksIndex = ASSET_ORDER.indexOf('stocks');

  assert.equal(params.dataQuality, 'partial');
  assert.equal(params.dataDetails.stocks, 'fallback');
  expectNear(params.means[stocksIndex], FALLBACK_PARAMS.stocks.annualReturn);
  expectNear(params.stdDevs[stocksIndex], FALLBACK_PARAMS.stocks.annualStdDev);
});

test('buildMarketParams uses full fallback when all tickers fail', async () => {
  const params = await buildMarketParams(0.05, {
    fetchAssetHistory: async () => null,
  });

  assert.equal(params.dataQuality, 'fallback');
  for (const [index, asset] of ASSET_ORDER.entries()) {
    expectNear(params.means[index], FALLBACK_PARAMS[asset].annualReturn);
    expectNear(params.stdDevs[index], FALLBACK_PARAMS[asset].annualStdDev);
  }
});
