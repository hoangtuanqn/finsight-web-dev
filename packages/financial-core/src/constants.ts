export const SENTIMENT_BANDS = [
  { max: 20, label: 'EXTREME_FEAR', labelVi: 'Sợ hãi tột độ', color: '#ef4444' },
  { max: 40, label: 'FEAR', labelVi: 'Sợ hãi', color: '#f97316' },
  { max: 60, label: 'NEUTRAL', labelVi: 'Trung lập', color: '#eab308' },
  { max: 80, label: 'GREED', labelVi: 'Tham lam', color: '#84cc16' },
  { max: 100, label: 'EXTREME_GREED', labelVi: 'Tham lam tột độ', color: '#22c55e' },
];

export const ASSET_CLASSES = {
  STOCKS: { label: 'Cổ phiếu', risk: 'HIGH', expectedReturn: 0.12 },
  BONDS: { label: 'Trái phiếu', risk: 'LOW', expectedReturn: 0.06 },
  CRYPTO: { label: 'Tiền điện tử', risk: 'VERY_HIGH', expectedReturn: 0.25 },
  REAL_ESTATE: { label: 'Bất động sản', risk: 'MEDIUM', expectedReturn: 0.1 },
  CASH: { label: 'Tiền mặt', risk: 'VERY_LOW', expectedReturn: 0.03 },
};
