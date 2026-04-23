/**
 * investmentConstants.js — SINGLE SOURCE OF TRUTH cho logic phân bổ tài sản
 *
 * Cơ sở thiết kế:
 *  - Lifecycle Investing: risk cao → nhiều tài sản tăng trưởng, risk thấp → bảo toàn vốn
 *  - Vietnam market context: vàng đóng vai trò "trái phiếu thay thế" trong văn hóa đầu tư VN
 *  - Dữ liệu thực tế VN 2024-2025: NHNN, HNX, VN-Index historical
 *
 * Đây là bản copy từ client/src/constants/investmentConstants.js
 * Giữ đồng bộ khi có thay đổi.
 */

// ─────────────────────────────────────────────────────────────────────────────
// BASE ALLOCATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_ALLOCATIONS = {
  LOW:    { savings: 55, gold: 25, bonds: 15, stocks:  5, crypto:  0 },
  MEDIUM: { savings: 30, gold: 20, bonds: 15, stocks: 30, crypto:  5 },
  HIGH:   { savings: 10, gold: 15, bonds:  5, stocks: 55, crypto: 15 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SENTIMENT BANDS
// Fix bug: NEUTRAL = band [41-59], không phải điểm chính xác 50
// EXTREME_GREED → tăng stocks, KHÔNG tăng savings
// ─────────────────────────────────────────────────────────────────────────────
export const SENTIMENT_BANDS = [
  { max: 20,  label: 'EXTREME_FEAR',  labelVi: 'Sợ hãi cực độ',   overlay: { savings: +10, stocks: -5, crypto: -5 } },
  { max: 40,  label: 'FEAR',          labelVi: 'Sợ hãi',           overlay: { savings:  +5, stocks: -3, crypto: -2 } },
  { max: 59,  label: 'NEUTRAL',       labelVi: 'Trung lập',        overlay: {} },
  { max: 74,  label: 'GREED',         labelVi: 'Tham lam',         overlay: { savings:  -3, stocks: +3 } },
  { max: 100, label: 'EXTREME_GREED', labelVi: 'Tham lam cực độ', overlay: { savings:  -5, stocks: +3, crypto: +2 } },
];

// ─────────────────────────────────────────────────────────────────────────────
// HORIZON OVERLAYS
// ─────────────────────────────────────────────────────────────────────────────
export const HORIZON_OVERLAYS = {
  SHORT:  { savings: +10, stocks: -5, crypto: -5 },
  MEDIUM: {},
  LONG:   { savings: -10, stocks: +7, bonds:  +3 },
};

// ─────────────────────────────────────────────────────────────────────────────
// CAPITAL OVERLAYS — Soft scale thay vì hard cap
// ─────────────────────────────────────────────────────────────────────────────
export const CAPITAL_OVERLAYS = {
  SMALL:  { savings: +15, stocks: -8, crypto: -7 }, // < 50tr
  NORMAL: {},                                         // 50–200tr
  LARGE:  { savings:  -5, stocks: +3, gold:   +2 }, // > 200tr
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSET_CLASSES — Expected Returns thực tế VN 2024-2025
// ─────────────────────────────────────────────────────────────────────────────
export const ASSET_CLASSES = {
  savings: {
    label: 'Tiết kiệm',
    expectedReturn: 0.050,  // 5.0%/năm — lãi suất tiết kiệm 12T TB NH lớn VN 2024 (NHNN)
    stdDev: 0.002,
  },
  gold: {
    label: 'Vàng',
    expectedReturn: 0.065,  // 6.5%/năm — CAGR vàng SJC 10 năm, loại trừ distortion 2023-2024
    stdDev: 0.18,
  },
  bonds: {
    label: 'Trái phiếu',
    expectedReturn: 0.058,  // 5.8%/năm — lợi suất TPCP kỳ hạn 5-10 năm cuối 2024 (HNX)
    stdDev: 0.04,
  },
  stocks: {
    label: 'Cổ phiếu',
    expectedReturn: 0.10,   // 10.0%/năm — VN-Index CAGR 2014-2024 (bao gồm COVID)
    stdDev: 0.22,
  },
  crypto: {
    label: 'Tiền mã hóa',
    expectedReturn: null,   // Không dùng point estimate — quá biến động
    bearCase:  -0.60,       // -60% (BTC 2022)
    baseCase:   0.20,       // +20%
    bullCase:   1.50,       // +150%
    stdDev: 0.80,
    note: 'Crypto không có lợi nhuận kỳ vọng ổn định — hiển thị 3 kịch bản thay vì số trung bình',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RISK_CONFIG
// ─────────────────────────────────────────────────────────────────────────────
export const RISK_CONFIG = {
  thresholds: { HIGH: 65, MEDIUM: 40 },
  questionWeights: { q1: 1.0, q2: 1.5, q3: 2.0, q4: 1.5, q5: 1.0 },
};

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION_TEXTS
// ─────────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_TEXTS = {
  EXTREME_FEAR:  'Thị trường đang sợ hãi cực độ. Đây thường là cơ hội tốt để mua vào từng phần, nhưng hãy ưu tiên bảo toàn vốn và giữ thanh khoản cao.',
  FEAR:          'Thị trường đang e ngại. Phân bổ thận trọng, giữ nhiều tiết kiệm và vàng để an toàn. Có thể mua thêm cổ phiếu cơ bản tốt.',
  NEUTRAL:       'Thị trường cân bằng. Phân bổ theo hồ sơ rủi ro của bạn là hợp lý. Duy trì kỷ luật tái cân bằng định kỳ.',
  GREED:         'Thị trường đang hưng phấn. Thận trọng với crypto và cổ phiếu đầu cơ. Cân nhắc chốt lời một phần nếu danh mục đã tăng mạnh.',
  EXTREME_GREED: 'CẢNH BÁO: Thị trường đang tham lam cực độ — thường là dấu hiệu đỉnh ngắn hạn. Cân nhắc giảm tỷ trọng tài sản rủi ro, tăng tiền mặt/tiết kiệm.',
};
