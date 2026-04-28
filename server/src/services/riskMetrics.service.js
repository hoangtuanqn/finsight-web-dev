import {
  portfolioReturn,
  portfolioVariance,
} from './portfolioOptimizer.service.js';

const EPSILON = 1e-12;

function normalizeWeights(weights) {
  const raw = weights.some(weight => weight > 1)
    ? weights.map(weight => weight / 100)
    : [...weights];
  const total = raw.reduce((sum, weight) => sum + weight, 0);
  return total > EPSILON ? raw.map(weight => weight / total) : raw;
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(sortedValues, percentileValue) {
  if (sortedValues.length === 0) return 0;
  const index = Math.floor(percentileValue * (sortedValues.length - 1));
  return sortedValues[index];
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function buildTailDescription(amount, percentage, label) {
  return `${label}: có thể mất khoảng ${Math.round(amount).toLocaleString('vi-VN')} VND (${formatPercent(percentage)}) trong kịch bản xấu.`;
}

export function calcSharpeRatio(portfolioReturnValue, riskFreeRate, portfolioStdDev) {
  if (portfolioStdDev <= EPSILON) return 0;
  return (portfolioReturnValue - riskFreeRate) / portfolioStdDev;
}

export function calcVaR(simResults, capital, confidence = 0.95) {
  if (!simResults || simResults.length === 0) return 0;
  const sorted = Array.from(simResults).sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((1 - confidence) * sorted.length))
  );
  return Math.max(0, capital - sorted[index]);
}

export function calcCVaR(simResults, capital, confidence = 0.95) {
  if (!simResults || simResults.length === 0) return 0;
  const sorted = Array.from(simResults).sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((1 - confidence) * sorted.length))
  );
  const tail = sorted.slice(0, index + 1);
  return Math.max(0, capital - average(tail));
}

function calcPathDrawdown(path) {
  let peak = path[0] || 0;
  let maxDrawdown = 0;

  for (const value of path) {
    peak = Math.max(peak, value);
    if (peak > EPSILON) {
      maxDrawdown = Math.max(maxDrawdown, (peak - value) / peak);
    }
  }

  return maxDrawdown;
}

export function calcMaxDrawdown(simPaths = []) {
  if (simPaths.length === 0) {
    return {
      median: 0,
      worst: 0,
      description: 'Chưa có dữ liệu đường mô phỏng để tính drawdown.',
    };
  }

  const drawdowns = simPaths
    .slice(0, 500)
    .map(calcPathDrawdown)
    .sort((a, b) => a - b);

  const median = percentile(drawdowns, 0.50);
  const worst = percentile(drawdowns, 0.95);

  return {
    median,
    worst,
    description: `Drawdown trung vị ${formatPercent(median)}, kịch bản xấu ${formatPercent(worst)}.`,
  };
}

export function calcRiskGrade(sharpeRatio, varPercentage) {
  if (sharpeRatio > 1.0 && varPercentage < 0.15) return 'A';
  if (sharpeRatio > 0.5 && varPercentage < 0.25) return 'B';
  if (sharpeRatio > 0.2 && varPercentage < 0.40) return 'C';
  if (sharpeRatio > 0) return 'D';
  return 'F';
}

function getSharpeLabel(sharpeRatio) {
  if (sharpeRatio > 1) return 'Tốt';
  if (sharpeRatio > 0.3) return 'Trung bình';
  return 'Kém';
}

function pickProbLoss(projectionTable, horizon) {
  return projectionTable?.[horizon]?.probLoss ?? 0;
}

export function buildRiskMetrics({
  weights,
  marketParams,
  simResults,
  simPaths = [],
  capital,
  profile = {},
  projectionTable = {},
}) {
  const normalizedWeights = normalizeWeights(weights);
  const expectedReturn = portfolioReturn(normalizedWeights, marketParams.means);
  const variance = Math.max(0, portfolioVariance(normalizedWeights, marketParams.covMatrix));
  const portfolioStdDev = Math.sqrt(variance);
  const riskFreeRate = (profile.savingsRate ?? 5) / 100;
  const sharpeRatio = calcSharpeRatio(expectedReturn, riskFreeRate, portfolioStdDev);
  const varAmount = calcVaR(simResults, capital, 0.95);
  const cvarAmount = calcCVaR(simResults, capital, 0.95);
  const varPercentage = capital > EPSILON ? varAmount / capital : 0;
  const cvarPercentage = capital > EPSILON ? cvarAmount / capital : 0;

  return {
    sharpeRatio,
    sharpeLabel: getSharpeLabel(sharpeRatio),
    var95_1y: {
      amount: varAmount,
      percentage: varPercentage,
      description: buildTailDescription(varAmount, varPercentage, 'VaR 95% 1 năm'),
    },
    cvar95_1y: {
      amount: cvarAmount,
      percentage: cvarPercentage,
      description: buildTailDescription(cvarAmount, cvarPercentage, 'CVaR 95% 1 năm'),
    },
    maxDrawdown: calcMaxDrawdown(simPaths),
    probLoss: {
      '1y': pickProbLoss(projectionTable, '1y'),
      '5y': pickProbLoss(projectionTable, '5y'),
      '10y': pickProbLoss(projectionTable, '10y'),
    },
    riskGrade: calcRiskGrade(sharpeRatio, varPercentage),
  };
}
