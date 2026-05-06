// Shared calculations from financial-core
export * from '@repo/financial-core';

// Re-export specifically to help some bundlers/IDE if needed,
// though export * should work.
export {
  calcEAR,
  calculateMonthlyPayment,
  formatPercent,
  formatVND,
  getSentimentLabel,
  getSentimentVietnamese,
} from '@repo/financial-core';

// Client-side UI/Formatting specifics
export function formatNumber(value: any, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '0';
  return new Intl.NumberFormat('vi-VN', options).format(number);
}

export function normalizeLocaleNumberInput(value: any) {
  if (value === null || value === undefined) return '';
  const raw = String(value);
  const hasTrailingSeparator = /[,.]$/.test(raw);
  const normalized = String(value)
    .replace(/\s/g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '');
  const isNegative = normalized.startsWith('-');
  const unsigned = normalized.replace(/-/g, '');
  const [integerPart = '', ...decimalParts] = unsigned.split('.');
  const decimalPart = decimalParts.join('');
  if (decimalPart) return `${isNegative ? '-' : ''}${integerPart}.${decimalPart}`;
  if (hasTrailingSeparator) return `${isNegative ? '-' : ''}${integerPart}.`;
  return `${isNegative ? '-' : ''}${integerPart}`;
}

export function formatIntegerInput(value: any) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits ? formatNumber(digits) : '';
}

export function formatDecimalInput(value: any, decimals = 2) {
  const normalized = normalizeLocaleNumberInput(value);
  if (!normalized) return '';

  const isNegative = normalized.startsWith('-');
  const unsigned = normalized.replace('-', '');
  const [integerPart = '', decimalPart = ''] = unsigned.split('.');
  const formattedInteger = integerPart ? formatNumber(integerPart) : '0';
  const trimmedDecimal = decimalPart.slice(0, decimals);
  const hasTrailingSeparator = normalized.endsWith('.') && !trimmedDecimal;

  return `${isNegative ? '-' : ''}${formattedInteger}${trimmedDecimal ? `,${trimmedDecimal}` : hasTrailingSeparator ? ',' : ''}`;
}
