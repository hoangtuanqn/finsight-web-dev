const DEFAULT_NUM_SIMS = 5000;
const DEFAULT_HORIZONS = [1, 3, 5, 10];
const EPSILON = 1e-12;

function toArrayMatrix(matrix) {
  return typeof matrix?.toArray === 'function' ? matrix.toArray() : matrix;
}

function normalizeWeights(weights) {
  const raw = weights.some(weight => weight > 1)
    ? weights.map(weight => weight / 100)
    : [...weights];
  const total = raw.reduce((sum, weight) => sum + weight, 0);
  return total > 0 ? raw.map(weight => weight / total) : raw;
}

function dot(left, right) {
  return left.reduce((sum, value, index) => sum + value * right[index], 0);
}

function percentile(sortedValues, percentileValue) {
  const index = Math.floor(percentileValue * (sortedValues.length - 1));
  return sortedValues[index];
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function buildDiagonalMatrix(matrix) {
  return matrix.map((row, rowIndex) => (
    row.map((_, colIndex) => (rowIndex === colIndex ? Math.max(0, row[rowIndex]) : 0))
  ));
}

export function createSeededRng(seed = 1) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function boxMullerTransform(rng = Math.random) {
  const u1 = Math.max(EPSILON, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function choleskyDecomposition(matrix) {
  const values = toArrayMatrix(matrix);
  const size = values.length;
  const lower = Array.from({ length: size }, () => new Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0;
      for (let k = 0; k < j; k++) {
        sum += lower[i][k] * lower[j][k];
      }

      if (i === j) {
        const diagonal = values[i][i] - sum;
        if (diagonal < -EPSILON) return null;
        lower[i][j] = diagonal <= EPSILON ? 0 : Math.sqrt(diagonal);
        continue;
      }

      const numerator = values[i][j] - sum;
      if (Math.abs(lower[j][j]) <= EPSILON) {
        if (Math.abs(numerator) > EPSILON) return null;
        lower[i][j] = 0;
      } else {
        lower[i][j] = numerator / lower[j][j];
      }
    }
  }

  return lower;
}

export function generateCorrelatedNormals(choleskyL, numAssets, rng = Math.random) {
  const independent = Array.from({ length: numAssets }, () => boxMullerTransform(rng));
  return choleskyL.map(row => dot(row, independent));
}

export function simulatePortfolio({
  capital,
  monthlyAdd = 0,
  weights,
  means,
  covMatrix,
  years,
  numSims = DEFAULT_NUM_SIMS,
  rng = Math.random,
  capturePaths = false,
  pathSampleSize = 500,
}) {
  const normalizedWeights = normalizeWeights(weights);
  const monthlyMeans = means.map(mean => mean / 12);
  const annualCov = toArrayMatrix(covMatrix);
  const monthlyCov = annualCov.map(row => row.map(value => value / 12));
  const cholesky = choleskyDecomposition(monthlyCov)
    || choleskyDecomposition(buildDiagonalMatrix(monthlyCov));
  const months = Math.max(0, Math.round(years * 12));
  const results = new Float64Array(numSims);
  const samplePaths = [];

  for (let sim = 0; sim < numSims; sim++) {
    let value = capital;
    const path = capturePaths && sim < pathSampleSize ? [value] : null;

    for (let month = 0; month < months; month++) {
      const shocks = cholesky
        ? generateCorrelatedNormals(cholesky, normalizedWeights.length, rng)
        : new Array(normalizedWeights.length).fill(0);
      const monthlyReturns = monthlyMeans.map((mean, index) => mean + shocks[index]);
      const portfolioMonthlyReturn = dot(normalizedWeights, monthlyReturns);
      value = value * (1 + portfolioMonthlyReturn) + monthlyAdd;
      if (path) path.push(value);
    }

    results[sim] = value;
    if (path) samplePaths.push(path);
  }

  results.sort();
  const sortedResults = Array.from(results);

  return {
    p5: percentile(sortedResults, 0.05),
    p25: percentile(sortedResults, 0.25),
    median: percentile(sortedResults, 0.50),
    p75: percentile(sortedResults, 0.75),
    p95: percentile(sortedResults, 0.95),
    mean: average(sortedResults),
    probLoss: sortedResults.filter(value => value < capital).length / numSims,
    results: sortedResults,
    samplePaths,
  };
}

export function generateProjectionTable(params) {
  const horizons = params.yearsList || DEFAULT_HORIZONS;
  return Object.fromEntries(
    horizons.map((years, index) => {
      const rng = params.rngFactory ? params.rngFactory(index + 1) : params.rng;
      return [`${years}y`, simulatePortfolio({ ...params, years, rng })];
    })
  );
}
