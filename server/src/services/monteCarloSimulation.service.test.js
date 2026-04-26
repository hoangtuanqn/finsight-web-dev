import test from 'node:test';
import assert from 'node:assert/strict';
import * as math from 'mathjs';
import {
  boxMullerTransform,
  buildBackwardCompatibleProjection,
  choleskyDecomposition,
  createSeededRng,
  generateProjectionTable,
  simulatePortfolio,
} from './monteCarloSimulation.service.js';

function expectNear(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
}

const baselineCovMatrix = math.matrix([
  [0.000004, 0, 0, 0, 0],
  [0, 0.0324, 0.0040, -0.0010, 0.0100],
  [0, 0.0040, 0.0484, 0.0020, 0.0400],
  [0, -0.0010, 0.0020, 0.0016, 0.0005],
  [0, 0.0100, 0.0400, 0.0005, 0.6400],
]);

const baselineMeans = [0.05, 0.065, 0.10, 0.058, 0.20];

test('boxMullerTransform is deterministic when rng is injected', () => {
  const rng = createSeededRng(42);
  const first = boxMullerTransform(rng);
  const second = boxMullerTransform(createSeededRng(42));

  assert.equal(first, second);
  assert.ok(Number.isFinite(first));
});

test('choleskyDecomposition factorizes a positive definite matrix', () => {
  const result = choleskyDecomposition([
    [4, 2],
    [2, 3],
  ]);

  expectNear(result[0][0], 2);
  expectNear(result[1][0], 1);
  expectNear(result[1][1], Math.sqrt(2));
});

test('simulatePortfolio matches deterministic compound growth when covariance is zero', () => {
  const result = simulatePortfolio({
    capital: 100,
    monthlyAdd: 0,
    weights: [1, 0, 0, 0, 0],
    means: [0.12, 0, 0, 0, 0],
    covMatrix: math.zeros(5, 5),
    years: 1,
    numSims: 20,
    rng: createSeededRng(1),
  });

  expectNear(result.median, 100 * Math.pow(1.01, 12), 1e-9);
  expectNear(result.probLoss, 0);
});

test('simulatePortfolio returns ordered percentiles and raw simulation results', () => {
  const result = simulatePortfolio({
    capital: 100_000_000,
    monthlyAdd: 1_000_000,
    weights: [0.3, 0.2, 0.3, 0.15, 0.05],
    means: baselineMeans,
    covMatrix: baselineCovMatrix,
    years: 3,
    numSims: 300,
    rng: createSeededRng(7),
  });

  assert.ok(result.p5 <= result.p25);
  assert.ok(result.p25 <= result.median);
  assert.ok(result.median <= result.p75);
  assert.ok(result.p75 <= result.p95);
  assert.equal(result.results.length, 300);
  assert.ok(result.probLoss >= 0 && result.probLoss <= 1);
});

test('generateProjectionTable builds standard investment horizons', () => {
  const table = generateProjectionTable({
    capital: 100,
    monthlyAdd: 0,
    weights: [1, 0, 0, 0, 0],
    means: [0.12, 0, 0, 0, 0],
    covMatrix: math.zeros(5, 5),
    numSims: 20,
    rngFactory: seed => createSeededRng(seed),
  });

  assert.deepEqual(Object.keys(table), ['1y', '3y', '5y', '10y']);
  assert.ok(table['10y'].median > table['1y'].median);
});

test('buildBackwardCompatibleProjection preserves legacy shape and strips raw simulations', () => {
  const projection = buildBackwardCompatibleProjection({
    '1y': { p5: 80.2, p25: 90, median: 100.4, p75: 110, p95: 120.8, mean: 101.2, probLoss: 0.12, results: [1, 2, 3] },
    '10y': { p5: 180.2, p25: 190, median: 200.4, p75: 210, p95: 220.8, mean: 201.2, probLoss: 0.08, samplePaths: [[100, 101]] },
  });

  assert.deepEqual(projection.base, { '1y': 100, '10y': 200 });
  assert.deepEqual(projection.optimistic, { '1y': 121, '10y': 221 });
  assert.deepEqual(projection.pessimistic, { '1y': 80, '10y': 180 });
  assert.equal(projection.probLoss, 0.08);
  assert.equal(projection.monteCarlo['1y'].median, 100);
  assert.equal(projection.monteCarlo['1y'].results, undefined);
  assert.equal(projection.monteCarlo['10y'].samplePaths, undefined);
});

test('simulatePortfolio completes 5000 ten-year simulations within the performance budget', () => {
  const startedAt = performance.now();

  const result = simulatePortfolio({
    capital: 100_000_000,
    monthlyAdd: 1_000_000,
    weights: [0.3, 0.2, 0.3, 0.15, 0.05],
    means: baselineMeans,
    covMatrix: baselineCovMatrix,
    years: 10,
    numSims: 5000,
    rng: createSeededRng(11),
  });

  const elapsedMs = performance.now() - startedAt;

  assert.ok(elapsedMs < 2000, `Monte Carlo took ${elapsedMs.toFixed(1)}ms`);
  assert.equal(result.results.length, 5000);
});

test('HIGH risk projection has higher loss probability than LOW risk and LOW remains under 10%', () => {
  const commonParams = {
    capital: 100_000_000,
    monthlyAdd: 0,
    means: baselineMeans,
    covMatrix: baselineCovMatrix,
    years: 10,
    numSims: 1500,
  };
  const low = simulatePortfolio({
    ...commonParams,
    weights: [0.6, 0.2, 0.1, 0.1, 0],
    rng: createSeededRng(21),
  });
  const high = simulatePortfolio({
    ...commonParams,
    weights: [0.1, 0.05, 0.65, 0.05, 0.15],
    rng: createSeededRng(21),
  });

  assert.ok(high.probLoss > low.probLoss, `${high.probLoss} is not above ${low.probLoss}`);
  assert.ok(low.probLoss < 0.10, `${low.probLoss} is not below 10%`);
});
