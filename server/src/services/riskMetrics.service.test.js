import test from 'node:test';
import assert from 'node:assert/strict';
import * as math from 'mathjs';
import {
  buildRiskMetrics,
  calcCVaR,
  calcMaxDrawdown,
  calcRiskGrade,
  calcSharpeRatio,
  calcVaR,
} from './riskMetrics.service.js';

function expectNear(actual, expected, tolerance = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} not within ${tolerance} of ${expected}`);
}

const marketParams = {
  means: [0.05, 0.065, 0.10, 0.058, 0.20],
  covMatrix: math.matrix([
    [0.000004, 0, 0, 0, 0],
    [0, 0.0324, 0.0040, -0.0010, 0.0100],
    [0, 0.0040, 0.0484, 0.0020, 0.0400],
    [0, -0.0010, 0.0020, 0.0016, 0.0005],
    [0, 0.0100, 0.0400, 0.0005, 0.6400],
  ]),
};

test('calcSharpeRatio returns excess return per unit of risk', () => {
  expectNear(calcSharpeRatio(0.12, 0.04, 0.16), 0.5);
  expectNear(calcSharpeRatio(0.12, 0.04, 0), 0);
});

test('calcVaR and calcCVaR use left-tail portfolio outcomes', () => {
  const outcomes = [120, 80, 95, 110, 70, 100];

  assert.equal(calcVaR(outcomes, 100, 0.80), 20);
  assert.equal(calcCVaR(outcomes, 100, 0.80), 25);
});

test('calcMaxDrawdown returns median and p95 drawdowns from sampled paths', () => {
  const drawdown = calcMaxDrawdown([
    [100, 120, 90],
    [100, 100, 70],
    [100, 110, 108],
    [100, 100, 90],
    [100, 100, 80],
  ]);

  expectNear(drawdown.median, 0.20);
  expectNear(drawdown.worst, 0.25);
});

test('calcRiskGrade maps Sharpe and VaR percentage to stable grades', () => {
  assert.equal(calcRiskGrade(1.2, 0.10), 'A');
  assert.equal(calcRiskGrade(0.7, 0.20), 'B');
  assert.equal(calcRiskGrade(0.3, 0.35), 'C');
  assert.equal(calcRiskGrade(0.1, 0.60), 'D');
  assert.equal(calcRiskGrade(-0.1, 0.10), 'F');
});

test('buildRiskMetrics returns API-ready risk metrics with positive Sharpe and coherent tail risk', () => {
  const metrics = buildRiskMetrics({
    weights: [0.6, 0.2, 0.1, 0.1, 0],
    marketParams,
    simResults: [120, 80, 95, 110, 70, 100],
    simPaths: [
      [100, 120, 90],
      [100, 100, 70],
      [100, 110, 108],
      [100, 100, 90],
      [100, 100, 80],
    ],
    capital: 100,
    profile: { savingsRate: 3 },
    projectionTable: {
      '1y': { probLoss: 0.08 },
      '5y': { probLoss: 0.06 },
      '10y': { probLoss: 0.04 },
    },
  });

  assert.ok(metrics.sharpeRatio > 0);
  assert.ok(metrics.var95_1y.amount > 0);
  assert.ok(metrics.cvar95_1y.amount >= metrics.var95_1y.amount);
  assert.equal(metrics.probLoss['10y'], 0.04);
  assert.ok(['A', 'B', 'C', 'D', 'F'].includes(metrics.riskGrade));
});

test('VaR is lower for defensive outcomes than aggressive outcomes', () => {
  const lowRiskOutcomes = [99, 101, 103, 105, 107, 109];
  const highRiskOutcomes = [60, 75, 95, 120, 150, 180];

  assert.ok(calcVaR(lowRiskOutcomes, 100, 0.80) < calcVaR(highRiskOutcomes, 100, 0.80));
});

test('representative LOW, MEDIUM, and HIGH portfolios all have positive Sharpe ratios', () => {
  const profiles = [
    { riskLevel: 'LOW', weights: [0.7, 0.1, 0.05, 0.15, 0] },
    { riskLevel: 'MEDIUM', weights: [0.3, 0.2, 0.3, 0.15, 0.05] },
    { riskLevel: 'HIGH', weights: [0.05, 0.05, 0.65, 0.05, 0.2] },
  ];

  for (const profile of profiles) {
    const metrics = buildRiskMetrics({
      weights: profile.weights,
      marketParams,
      simResults: [95, 100, 105, 110, 115, 120],
      simPaths: [],
      capital: 100,
      profile: { savingsRate: 3, riskLevel: profile.riskLevel },
      projectionTable: {},
    });

    assert.ok(metrics.sharpeRatio > 0, `${profile.riskLevel} Sharpe should be positive`);
  }
});

test('riskGrade is defensive for LOW portfolios and cautionary for HIGH portfolios', () => {
  const low = buildRiskMetrics({
    weights: [0.7, 0.1, 0.05, 0.15, 0],
    marketParams,
    simResults: [99, 101, 103, 105, 107, 109],
    simPaths: [],
    capital: 100,
    profile: { savingsRate: 3, riskLevel: 'LOW' },
    projectionTable: {},
  });
  const high = buildRiskMetrics({
    weights: [0.05, 0.05, 0.65, 0.05, 0.2],
    marketParams,
    simResults: [70, 80, 90, 110, 130, 150],
    simPaths: [],
    capital: 100,
    profile: { savingsRate: 3, riskLevel: 'HIGH' },
    projectionTable: {},
  });

  assert.ok(['A', 'B'].includes(low.riskGrade), `LOW riskGrade was ${low.riskGrade}`);
  assert.ok(['C', 'D'].includes(high.riskGrade), `HIGH riskGrade was ${high.riskGrade}`);
});
