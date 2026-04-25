import test from 'node:test';
import assert from 'node:assert/strict';
import {
  annualizeReturn,
  annualizeStdDev,
  calcCorrelationMatrix,
  calcCovarianceMatrix,
  calcLogReturns,
  calcMean,
  calcStdDev,
} from './historicalData.service.js';

function expectNear(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
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
