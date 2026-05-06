import { SENTIMENT_BANDS } from './constants';

export function getSentimentLabel(value: any): string {
  const number = Number(value);
  const sentimentValue = Number.isFinite(number) ? number : 50;
  return SENTIMENT_BANDS.find((band) => sentimentValue <= band.max)?.label ?? 'NEUTRAL';
}

export function getSentimentVietnamese(label: string): string {
  return SENTIMENT_BANDS.find((band) => band.label === label)?.labelVi ?? label;
}

export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}
