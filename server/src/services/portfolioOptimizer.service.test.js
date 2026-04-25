import test from 'node:test';
import assert from 'node:assert/strict';
import * as math from 'mathjs';
import {
  adjustReturnsForSentiment,
  optimizePortfolio,
  portfolioReturn,
  portfolioVariance,
  projectOntoConstraints,
} from './portfolioOptimizer.service.js';
import { WEIGHT_BOUNDS } from '../constants/optimizationConfig.js';

const ASSET_ORDER = ['savings', 'gold', 'stocks', 'bonds', 'crypto'];

const marketParams = {
  means: [0.05, 0.065, 0.10, 0.058, 0.20],
  stdDevs: [0.002, 0.18, 0.22, 0.04, 0.80],
  covMatrix: math.matrix([
    [0.000004, 0, 0, 0, 0],
    [0, 0.0324, 0.0040, -0.0010, 0.0100],
    [0, 0.0040, 0.0484, 0.0020, 0.0400],
    [0, -0.0010, 0.0020, 0.0016, 0.0005],
    [0, 0.0100, 0.0400, 0.0005, 0.6400],
  ]),
  assetOrder: ASSET_ORDER,
  dataQuality: 'full',
};

function expectNear(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
}

function expectAllocationWithinBounds(allocation, riskLevel) {
  const total = ASSET_ORDER.reduce((sum, asset) => sum + allocation[asset], 0);
  expectNear(total, 100, 0.5);

  for (const asset of ASSET_ORDER) {
    const [lower, upper] = WEIGHT_BOUNDS[riskLevel][asset];
    assert.ok(allocation[asset] >= lower - 0.1, `${asset} below lower bound`);
    assert.ok(allocation[asset] <= upper + 0.1, `${asset} above upper bound`);
  }
}

test('portfolioReturn calculates weighted expected return', () => {
  const result = portfolioReturn([0.4, 0.2, 0.2, 0.1, 0.1], marketParams.means);

  expectNear(result, 0.0788);
});

test('portfolioVariance calculates w^T Sigma w', () => {
  const weights = [0.4, 0.2, 0.2, 0.1, 0.1];
  const result = portfolioVariance(weights, marketParams.covMatrix);

  expectNear(result, 0.01201864);
});

test('adjustReturnsForSentiment applies sentiment to expected returns, not weights', () => {
  const adjusted = adjustReturnsForSentiment(marketParams.means, 30);

  expectNear(adjusted[2], 0.092);
  expectNear(adjusted[4], 0.18);
  expectNear(adjusted[0], 0.05);
});

test('projectOntoConstraints returns normalized weights within all bounds', () => {
  const projected = projectOntoConstraints(
    [-0.2, 0.4, 0.9, 0.1, 0.3],
    WEIGHT_BOUNDS.MEDIUM
  );

  expectNear(projected.reduce((sum, weight) => sum + weight, 0), 1, 1e-9);
  projected.forEach((weight, index) => {
    const [lower, upper] = WEIGHT_BOUNDS.MEDIUM[ASSET_ORDER[index]].map(v => v / 100);
    assert.ok(weight >= lower - 1e-9);
    assert.ok(weight <= upper + 1e-9);
  });
});

test('optimizePortfolio returns a bounded allocation and risk metrics', () => {
  const profile = { riskLevel: 'MEDIUM', savingsRate: 6, capital: 100_000_000 };
  const result = optimizePortfolio(marketParams, 'MEDIUM', 50, profile);

  expectAllocationWithinBounds(result.allocation, 'MEDIUM');
  assert.equal(result.optimizationMethod, 'markowitz');
  assert.ok(result.metrics.expectedReturn > 0);
  assert.ok(result.metrics.portfolioRisk > 0);
  assert.ok(Number.isFinite(result.metrics.sharpeRatio));
  assert.ok(result.iterations > 0);
  assert.equal(typeof result.converged, 'boolean');
});

test('HIGH risk optimization keeps growth assets dominant', () => {
  const profile = { riskLevel: 'HIGH', savingsRate: 6, capital: 200_000_000 };
  const result = optimizePortfolio(marketParams, 'HIGH', 50, profile);

  expectAllocationWithinBounds(result.allocation, 'HIGH');
  assert.ok(result.allocation.stocks + result.allocation.crypto > 40);
});
