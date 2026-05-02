import * as math from 'mathjs';
import { ASSET_ORDER } from '../constants/assetTickers.js';
import { MarketView } from './marketViews.service.js';

/**
 * Tính toán Lợi nhuận kỳ vọng theo mô hình Black-Litterman
 *
 * E[R] = [ (tau * Sigma)^-1 + P^T * Omega^-1 * P ]^-1 * [ (tau * Sigma)^-1 * Pi + P^T * Omega^-1 * Q ]
 *
 * @param priorMeans Vector lợi nhuận kỳ vọng ban đầu (Pi)
 * @param covMatrix Ma trận hiệp phương sai (Sigma)
 * @param views Danh sách quan điểm thị trường
 * @param tau Hệ số bất định của prior (thường từ 0.02 đến 0.05)
 */
export function computePosteriorReturns(
  priorMeans: number[],
  covMatrix: math.Matrix,
  views: MarketView[],
  tau: number = 0.05,
): { posteriorMeans: number[]; pMatrix: number[][]; qVector: number[] } {
  if (!views || views.length === 0) {
    return { posteriorMeans: priorMeans, pMatrix: [], qVector: [] };
  }

  const N = ASSET_ORDER.length;
  const K = views.length;
  const covSize = (covMatrix.toArray() as any[]).length;
  if (covSize !== N) {
    console.error(`[BlackLitterman] DIMENSION MISMATCH: ASSET_ORDER.length=${N} but covMatrix is ${covSize}x${covSize}. ASSET_ORDER=${JSON.stringify(ASSET_ORDER)}, covMatrix rows=${covSize}`);
  }

  // 1. Convert to mathjs matrices
  const Pi = math.matrix(priorMeans.map((val) => [val])); // N x 1 column vector
  const Sigma = covMatrix;

  // 2. Build P (Pick Matrix) and Q (View Vector)
  const pMatrix = Array.from({ length: K }, () => new Array(N).fill(0));
  const qVector = new Array(K).fill(0);
  const confidences = new Array(K).fill(0);

  views.forEach((view, i) => {
    view.assets.forEach((asset, idx) => {
      const assetIndex = ASSET_ORDER.indexOf(asset);
      if (assetIndex !== -1) {
        pMatrix[i][assetIndex] = view.weights[idx];
      }
    });
    qVector[i] = view.expectedReturn;
    confidences[i] = view.confidence;
  });

  const P = math.matrix(pMatrix);
  const Q = math.matrix(qVector.map((val) => [val])); // K x 1 column vector

  // 3. Compute Omega (Uncertainty matrix of views)
  // Heuristic: Omega_kk = (tau * P_k * Sigma * P_k^T) / confidence
  const omegaMatrix = Array.from({ length: K }, () => new Array(K).fill(0));

  const tauSigma = math.multiply(Sigma, tau) as math.Matrix;

  for (let k = 0; k < K; k++) {
    const p_k = P.toArray()[k] as number[];
    const p_k_mat = math.matrix([p_k]); // 1 x N
    const p_k_trans = math.transpose(p_k_mat); // N x 1

    // variance of view k = p_k * tauSigma * p_k^T
    const viewVarianceMat = math.multiply(math.multiply(p_k_mat, tauSigma), p_k_trans) as math.Matrix;
    let viewVariance = (viewVarianceMat.toArray() as number[][])[0][0];

    if (viewVariance === 0) {
      viewVariance = 1e-4; // Prevent division by zero
    }

    // Adjust variance based on confidence (higher confidence -> lower variance/uncertainty)
    // Scale from 0.1 to 1.0 -> inverted multiplier
    const confidenceMultiplier = confidences[k] > 0 ? confidences[k] : 0.5;
    omegaMatrix[k][k] = viewVariance / confidenceMultiplier;
  }

  const Omega = math.matrix(omegaMatrix);

  // 4. Calculate BL Formula
  try {
    const invTauSigma = math.inv(tauSigma);
    const invOmega = math.inv(Omega);
    const P_trans = math.transpose(P);

    // Term 1: [ (tau * Sigma)^-1 + P^T * Omega^-1 * P ]^-1
    const term1_part2 = math.multiply(math.multiply(P_trans, invOmega), P);
    const term1_inverse = math.add(invTauSigma, term1_part2) as math.Matrix;
    const term1 = math.inv(term1_inverse);

    // Term 2: [ (tau * Sigma)^-1 * Pi + P^T * Omega^-1 * Q ]
    const term2_part1 = math.multiply(invTauSigma, Pi);
    const term2_part2 = math.multiply(math.multiply(P_trans, invOmega), Q);
    const term2 = math.add(term2_part1, term2_part2) as math.Matrix;

    // Posterior E[R]
    const posterior = math.multiply(term1, term2) as math.Matrix;

    const posteriorMeans = (posterior.toArray() as number[][]).map((row) => row[0]);

    return { posteriorMeans, pMatrix, qVector };
  } catch (error) {
    console.error(
      '[BlackLitterman] Failed to compute posterior returns (Matrix inversion error?). Falling back to prior means.',
      error,
    );
    return { posteriorMeans: priorMeans, pMatrix, qVector };
  }
}
