/**
 * optimizationConfig.js — Configuration for Markowitz MVO
 *
 * Risk aversion coefficients, weight constraints, sentiment adjustments.
 * Ref: He & Litterman (1999), Markowitz (1952)
 *
 * Xem chi tiết: docs/todo/LOGIC-advanced-investment-algorithms.md
 */

import { ASSET_ORDER } from './assetTickers.js';

// Risk aversion coefficient (λ)
// Cao = conservative (ưu tiên giảm risk), Thấp = aggressive (ưu tiên return)
// Ref: He & Litterman 1999
export const RISK_AVERSION = {
  LOW: 8,
  MEDIUM: 4,
  HIGH: 1.5,
};

// Weight bounds [min, max] cho mỗi asset class theo riskLevel
// Tái sử dụng tư tưởng từ BASE_ALLOCATIONS cũ, mở rộng thành ranges
// Đơn vị: phần trăm (0-100), sẽ convert sang 0-1 khi optimize
export const WEIGHT_BOUNDS = {
  LOW: {
    savings: [40, 70],
    gold:    [10, 35],
    stocks:  [0,  15],
    bonds:   [5,  25],
    crypto:  [0,  0],    // Không cho phép crypto cho LOW risk
  },
  MEDIUM: {
    savings: [15, 45],
    gold:    [5,  30],
    stocks:  [10, 45],
    bonds:   [5,  25],
    crypto:  [0,  10],
  },
  HIGH: {
    savings: [5,  25],
    gold:    [0,  20],
    stocks:  [25, 70],
    bonds:   [0,  15],
    crypto:  [0,  20],
  },
};

// Sentiment adjustments cho expected returns (Black-Litterman style)
// Thay vì sửa weights trực tiếp (overlay cũ), sentiment điều chỉnh μ (expected returns)
// → Optimizer tự tìm weights tối ưu dựa trên adjusted returns
export const SENTIMENT_ADJUSTMENTS = {
  EXTREME_FEAR: { savings: 1.00, gold: 1.05, stocks: 0.85, bonds: 1.02, crypto: 0.80 },
  FEAR:         { savings: 1.00, gold: 1.02, stocks: 0.92, bonds: 1.01, crypto: 0.90 },
  NEUTRAL:      { savings: 1.00, gold: 1.00, stocks: 1.00, bonds: 1.00, crypto: 1.00 },
  GREED:        { savings: 1.00, gold: 0.98, stocks: 1.05, bonds: 0.99, crypto: 1.05 },
  EXTREME_GREED:{ savings: 1.00, gold: 0.95, stocks: 1.08, bonds: 0.98, crypto: 1.10 },
};

// Solver configuration
export const SOLVER_CONFIG = {
  maxIterations: 1000,
  learningRate: 0.01,
  tolerance: 1e-6,
};

/**
 * Get weight bounds as arrays following ASSET_ORDER.
 * Converts percentage bounds to decimal (0-1).
 *
 * @param {string} riskLevel - LOW | MEDIUM | HIGH
 * @returns {{ lowerBounds: number[], upperBounds: number[] }}
 */
export function getBoundsForRisk(riskLevel) {
  const bounds = WEIGHT_BOUNDS[riskLevel] || WEIGHT_BOUNDS.MEDIUM;
  const lowerBounds = ASSET_ORDER.map(a => (bounds[a]?.[0] ?? 0) / 100);
  const upperBounds = ASSET_ORDER.map(a => (bounds[a]?.[1] ?? 100) / 100);
  return { lowerBounds, upperBounds };
}
