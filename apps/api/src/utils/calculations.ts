export * from '@repo/financial-core';
export {
  calcEAR,
  calculateMonthlyPayment,
  detectDominoRisk,
  formatPercent,
  formatVND,
  getSentimentLabel,
  getSentimentVietnamese,
  simulateRepayment,
} from '@repo/financial-core';

export function resolveRepaymentExtraBudget(queryValue: unknown, savedValue: unknown): number {
  const getFirstValue = (value: unknown) => (Array.isArray(value) ? value[0] : value);
  const firstQueryValue = getFirstValue(queryValue);
  const hasQueryValue =
    firstQueryValue !== undefined && firstQueryValue !== null && String(firstQueryValue).trim() !== '';
  const rawValue = hasQueryValue ? firstQueryValue : getFirstValue(savedValue);
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue)) return 0;
  return Math.max(0, parsedValue);
}
