import { ASSET_ORDER } from '../constants/assetTickers.js';
import { BASE_ALLOCATIONS, RECOMMENDATION_TEXTS } from '../constants/investmentConstants.js';
import {
  RISK_AVERSION,
  SENTIMENT_ADJUSTMENTS,
  SOLVER_CONFIG,
  WEIGHT_BOUNDS,
} from '../constants/optimizationConfig.js';
import { getSentimentLabel, getSentimentVietnamese } from '../utils/calculations.js';

const EPSILON = 1e-12;

function toArrayMatrix(matrix) {
  return typeof matrix?.toArray === 'function' ? matrix.toArray() : matrix;
}

function getBoundsArrays(bounds) {
  const source = bounds || WEIGHT_BOUNDS.MEDIUM;
  const lowerBounds = ASSET_ORDER.map(asset => (source[asset]?.[0] ?? 0) / 100);
  const upperBounds = ASSET_ORDER.map(asset => (source[asset]?.[1] ?? 100) / 100);
  return { lowerBounds, upperBounds };
}

function matrixVectorMultiply(matrix, vector) {
  const values = toArrayMatrix(matrix);
  return values.map(row => row.reduce((sum, value, index) => sum + value * vector[index], 0));
}

function sumWeights(weights) {
  return weights.reduce((sum, weight) => sum + weight, 0);
}

function clampWeights(weights, lowerBounds, upperBounds) {
  return weights.map((weight, index) => {
    const safeWeight = Number.isFinite(weight) ? weight : 0;
    return Math.min(upperBounds[index], Math.max(lowerBounds[index], safeWeight));
  });
}

function redistribute(weights, lowerBounds, upperBounds) {
  let projected = [...weights];

  for (let iteration = 0; iteration < 20; iteration++) {
    const diff = 1 - sumWeights(projected);
    if (Math.abs(diff) <= EPSILON) break;

    const capacities = projected.map((weight, index) => (
      diff > 0 ? upperBounds[index] - weight : weight - lowerBounds[index]
    ));
    const available = capacities.reduce((sum, capacity) => sum + Math.max(0, capacity), 0);
    if (available <= EPSILON) break;

    projected = projected.map((weight, index) => {
      const capacity = Math.max(0, capacities[index]);
      return weight + diff * (capacity / available);
    });
    projected = clampWeights(projected, lowerBounds, upperBounds);
  }

  return projected;
}

function getInitialWeights(riskLevel, bounds) {
  const base = BASE_ALLOCATIONS[riskLevel] || BASE_ALLOCATIONS.MEDIUM;
  return ASSET_ORDER.map(asset => (base[asset] ?? 0) / 100)
    .map((weight, index) => Math.min(bounds.upperBounds[index], Math.max(bounds.lowerBounds[index], weight)));
}

function normalizePercentAllocation(weights) {
  const allocation = Object.fromEntries(
    ASSET_ORDER.map((asset, index) => [asset, Math.round(weights[index] * 1000) / 10])
  );
  const total = ASSET_ORDER.reduce((sum, asset) => sum + allocation[asset], 0);
  const diff = Math.round((100 - total) * 10) / 10;
  if (Math.abs(diff) >= 0.1) {
    allocation.savings = Math.round((allocation.savings + diff) * 10) / 10;
  }
  return allocation;
}

function buildRecommendation(sentimentLabel, result) {
  const base = RECOMMENDATION_TEXTS[sentimentLabel] || RECOMMENDATION_TEXTS.NEUTRAL;
  const expected = (result.metrics.expectedReturn * 100).toFixed(1);
  const risk = (result.metrics.portfolioRisk * 100).toFixed(1);
  return `${base} Danh mục được tối ưu bằng Markowitz MVO với lợi nhuận kỳ vọng ${expected}%/năm và độ biến động ${risk}%/năm.`;
}

export function portfolioReturn(weights, means) {
  return weights.reduce((sum, weight, index) => sum + weight * means[index], 0);
}

export function portfolioVariance(weights, covMatrix) {
  const sigmaW = matrixVectorMultiply(covMatrix, weights);
  return weights.reduce((sum, weight, index) => sum + weight * sigmaW[index], 0);
}

export function adjustReturnsForSentiment(means, sentimentValue, adjustments = SENTIMENT_ADJUSTMENTS) {
  const sentimentLabel = getSentimentLabel(Number.isFinite(sentimentValue) ? sentimentValue : 50);
  const multipliers = adjustments[sentimentLabel] || adjustments.NEUTRAL;
  return means.map((mean, index) => mean * (multipliers[ASSET_ORDER[index]] ?? 1));
}

export function projectOntoConstraints(weights, bounds) {
  const { lowerBounds, upperBounds } = getBoundsArrays(bounds);
  const clamped = clampWeights(weights, lowerBounds, upperBounds);
  return redistribute(clamped, lowerBounds, upperBounds);
}

export function optimizePortfolio(marketParams, riskLevel = 'MEDIUM', sentimentValue = 50, profile = {}) {
  const normalizedRisk = WEIGHT_BOUNDS[riskLevel] ? riskLevel : 'MEDIUM';
  const bounds = getBoundsArrays(WEIGHT_BOUNDS[normalizedRisk]);
  const lambda = RISK_AVERSION[normalizedRisk] || RISK_AVERSION.MEDIUM;
  const adjustedMeans = adjustReturnsForSentiment(marketParams.means, sentimentValue);
  let weights = redistribute(getInitialWeights(normalizedRisk, bounds), bounds.lowerBounds, bounds.upperBounds);
  let converged = false;
  let iterations = 0;

  for (let i = 0; i < SOLVER_CONFIG.maxIterations; i++) {
    iterations = i + 1;
    const previous = [...weights];
    const sigmaW = matrixVectorMultiply(marketParams.covMatrix, weights);
    const gradient = adjustedMeans.map((mean, index) => mean - lambda * sigmaW[index]);

    weights = weights.map((weight, index) => weight + SOLVER_CONFIG.learningRate * gradient[index]);
    weights = projectOntoConstraints(weights, WEIGHT_BOUNDS[normalizedRisk]);

    const change = Math.sqrt(weights.reduce((sum, weight, index) => sum + (weight - previous[index]) ** 2, 0));
    if (change < SOLVER_CONFIG.tolerance) {
      converged = true;
      break;
    }
  }

  const expectedReturn = portfolioReturn(weights, adjustedMeans);
  const variance = Math.max(0, portfolioVariance(weights, marketParams.covMatrix));
  const portfolioRisk = Math.sqrt(variance);
  const riskFreeRate = (profile.savingsRate ?? 5) / 100;
  const sharpeRatio = portfolioRisk > EPSILON ? (expectedReturn - riskFreeRate) / portfolioRisk : 0;

  return {
    weights,
    allocation: normalizePercentAllocation(weights),
    metrics: {
      expectedReturn,
      portfolioRisk,
      sharpeRatio,
      utility: expectedReturn - (lambda / 2) * variance,
    },
    converged,
    iterations,
    optimizationMethod: 'markowitz',
    marketDataQuality: marketParams.dataQuality,
  };
}

export async function getOptimalAllocation(profile, sentimentValue = 50) {
  const savingsRate = (profile?.savingsRate ?? 5) / 100;
  const { getMarketParams } = await import('./historicalData.service.js');
  const marketParams = await getMarketParams(savingsRate);
  const result = optimizePortfolio(marketParams, profile?.riskLevel || 'MEDIUM', sentimentValue, profile);
  const sentimentLabel = getSentimentLabel(sentimentValue);

  return {
    ...result.allocation,
    sentimentValue,
    sentimentLabel,
    sentimentVietnamese: getSentimentVietnamese(sentimentLabel),
    recommendation: buildRecommendation(sentimentLabel, result),
    optimizationMethod: result.optimizationMethod,
    metrics: result.metrics,
    optimization: {
      converged: result.converged,
      iterations: result.iterations,
      marketDataQuality: result.marketDataQuality,
    },
  };
}
