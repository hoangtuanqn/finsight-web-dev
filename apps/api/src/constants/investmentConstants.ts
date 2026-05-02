export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export const BASE_ALLOCATIONS: Record<string, Record<string, number>> = {
  LOW: { savings: 55, gold: 25, bonds: 15, stocks: 5, crypto: 0 },
  MEDIUM: { savings: 30, gold: 20, bonds: 15, stocks: 30, crypto: 5 },
  HIGH: { savings: 10, gold: 15, bonds: 5, stocks: 55, crypto: 15 },
};

export const SENTIMENT_BANDS = [
  { max: 20, label: 'EXTREME_FEAR', labelVi: 'Sợ hãi cực độ', overlay: { savings: +10, stocks: -5, crypto: -5 } },
  { max: 40, label: 'FEAR', labelVi: 'Sợ hãi', overlay: { savings: +5, stocks: -3, crypto: -2 } },
  { max: 59, label: 'NEUTRAL', labelVi: 'Trung lập', overlay: {} },
  { max: 74, label: 'GREED', labelVi: 'Tham lam', overlay: { savings: -3, stocks: +3 } },
  { max: 100, label: 'EXTREME_GREED', labelVi: 'Tham lam cực độ', overlay: { savings: -5, stocks: +3, crypto: +2 } },
];

export const HORIZON_OVERLAYS: Record<string, Record<string, number>> = {
  SHORT: { savings: +10, stocks: -5, crypto: -5 },
  MEDIUM: {},
  LONG: { savings: -10, stocks: +7, bonds: +3 },
};

export const CAPITAL_OVERLAYS: Record<string, Record<string, number>> = {
  SMALL: { savings: +15, stocks: -8, crypto: -7 },
  NORMAL: {},
  LARGE: { savings: -5, stocks: +3, gold: +2 },
};

export const ASSET_CLASSES: Record<string, any> = {
  savings: {
    label: 'Tiết kiệm',
    expectedReturn: 0.05,
    stdDev: 0.002,
  },
  gold: {
    label: 'Vàng',
    expectedReturn: 0.065,
    stdDev: 0.18,
  },
  bonds: {
    label: 'Trái phiếu',
    expectedReturn: 0.058,
    stdDev: 0.04,
  },
  stocks: {
    label: 'Cổ phiếu',
    expectedReturn: 0.1,
    stdDev: 0.22,
  },
  crypto: {
    label: 'Tiền mã hóa',
    expectedReturn: null,
    bearCase: -0.6,
    baseCase: 0.2,
    bullCase: 1.5,
    stdDev: 0.8,
    note: 'Crypto không có lợi nhuận kỳ vọng ổn định — hiển thị 3 kịch bản thay vì số trung bình',
  },
};

export const RISK_CONFIG = {
  thresholds: { HIGH: 65, MEDIUM: 40 },
  questionWeights: { q1: 1.0, q2: 1.5, q3: 2.0, q4: 1.5, q5: 1.0 },
};

export const RECOMMENDATION_TEXTS: Record<string, string> = {
  EXTREME_FEAR:
    'Thị trường đang sợ hãi cực độ. Đây thường là cơ hội tốt để mua vào từng phần, nhưng hãy ưu tiên bảo toàn vốn và giữ thanh khoản cao.',
  FEAR: 'Thị trường đang e ngại. Phân bổ thận trọng, giữ nhiều tiết kiệm và vàng để an toàn. Có thể mua thêm cổ phiếu cơ bản tốt.',
  NEUTRAL: 'Thị trường cân bằng. Phân bổ theo hồ sơ rủi ro của bạn là hợp lý. Duy trì kỷ luật tái cân bằng định kỳ.',
  GREED:
    'Thị trường đang hưng phấn. Thận trọng với crypto và cổ phiếu đầu cơ. Cân nhắc chốt lời một phần nếu danh mục đã tăng mạnh.',
  EXTREME_GREED:
    'CẢNH BÁO: Thị trường đang tham lam cực độ — thường là dấu hiệu đỉnh ngắn hạn. Cân nhắc giảm tỷ trọng tài sản rủi ro, tăng tiền mặt/tiết kiệm.',
};
