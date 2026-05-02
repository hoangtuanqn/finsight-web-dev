import { ASSET_ORDER } from './assetTickers';

export const RISK_AVERSION: Record<string, number> = {
  LOW: 8,
  MEDIUM: 4,
  HIGH: 1.5,
};

export const WEIGHT_BOUNDS: Record<string, Record<string, [number, number]>> = {
  LOW: {
    savings:   [40, 70],
    gold:      [10, 35],
    stocks:    [0,  20],
    bonds:     [5,  25],
    crypto:    [0,  0],
  },
  MEDIUM: {
    savings:   [15, 45],
    gold:      [5,  30],
    stocks:    [10, 50],
    bonds:     [5,  25],
    crypto:    [0,  10],
  },
  HIGH: {
    savings:   [5,  25],
    gold:      [0,  20],
    stocks:    [20, 80],
    bonds:     [0,  15],
    crypto:    [0,  20],
    savings: [40, 70],
    gold: [10, 35],
    stocks: [0, 15],
    stocks_us: [0, 5],
    bonds: [5, 25],
    crypto: [0, 0],
  },
  MEDIUM: {
    savings: [15, 45],
    gold: [5, 30],
    stocks: [10, 35],
    stocks_us: [0, 15],
    bonds: [5, 25],
    crypto: [0, 10],
  },
  HIGH: {
    savings: [5, 25],
    gold: [0, 20],
    stocks: [20, 50],
    stocks_us: [5, 30],
    bonds: [0, 15],
    crypto: [0, 20],
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
  },
};

export const SENTIMENT_ADJUSTMENTS: Record<string, Record<string, number>> = {
  EXTREME_FEAR: { savings: 1.00, gold: 1.05, stocks: 0.85, bonds: 1.02, crypto: 0.80 },
  FEAR:         { savings: 1.00, gold: 1.02, stocks: 0.92, bonds: 1.01, crypto: 0.90 },
  NEUTRAL:      { savings: 1.00, gold: 1.00, stocks: 1.00, bonds: 1.00, crypto: 1.00 },
  GREED:        { savings: 1.00, gold: 0.98, stocks: 1.05, bonds: 0.99, crypto: 1.05 },
  EXTREME_GREED:{ savings: 1.00, gold: 0.95, stocks: 1.08, bonds: 0.98, crypto: 1.10 },
  EXTREME_FEAR: { savings: 1.0, gold: 1.05, stocks: 0.85, stocks_us: 0.85, bonds: 1.02, crypto: 0.8 },
  FEAR: { savings: 1.0, gold: 1.02, stocks: 0.92, stocks_us: 0.92, bonds: 1.01, crypto: 0.9 },
  NEUTRAL: { savings: 1.0, gold: 1.0, stocks: 1.0, stocks_us: 1.0, bonds: 1.0, crypto: 1.0 },
  GREED: { savings: 1.0, gold: 0.98, stocks: 1.05, stocks_us: 1.05, bonds: 0.99, crypto: 1.05 },
  EXTREME_GREED: { savings: 1.0, gold: 0.95, stocks: 1.08, stocks_us: 1.08, bonds: 0.98, crypto: 1.1 },
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
};

export const SOLVER_CONFIG = {
  maxIterations: 1000,
  learningRate: 0.05,
  tolerance: 1e-6,
};

export function getBoundsForRisk(riskLevel: string) {
  const bounds = WEIGHT_BOUNDS[riskLevel] || WEIGHT_BOUNDS.MEDIUM;
  const lowerBounds = ASSET_ORDER.map((a) => (bounds[a]?.[0] ?? 0) / 100);
  const upperBounds = ASSET_ORDER.map((a) => (bounds[a]?.[1] ?? 100) / 100);
  return { lowerBounds, upperBounds };
}
