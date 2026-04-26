import test from 'node:test';
import assert from 'node:assert/strict';
import * as math from 'mathjs';
import {
  boxMullerTransform,
  choleskyDecomposition,
  createSeededRng,
  generateProjectionTable,
  simulatePortfolio,
} from './monteCarloSimulation.service.js';

function expectNear(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
}

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
    means: [0.05, 0.065, 0.10, 0.058, 0.20],
    covMatrix: math.matrix([
      [0.000004, 0, 0, 0, 0],
      [0, 0.0324, 0.0040, -0.0010, 0.0100],
      [0, 0.0040, 0.0484, 0.0020, 0.0400],
      [0, -0.0010, 0.0020, 0.0016, 0.0005],
      [0, 0.0100, 0.0400, 0.0005, 0.6400],
    ]),
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
