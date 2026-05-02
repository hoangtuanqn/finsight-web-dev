/**
 * investmentConstants.js - SINGLE SOURCE OF TRUTH cho logic phân bổ tài sản
 *
 * Cơ sở thiết kế:
 *  - Lifecycle Investing: risk cao → nhiều tài sản tăng trưởng, risk thấp → bảo toàn vốn
 *  - Vietnam market context: vàng đóng vai trò "trái phiếu thay thế" trong văn hóa đầu tư VN
 *  - Dữ liệu thực tế VN 2024-2025: NHNN, HNX, VN-Index historical
 *
 * File này được dùng ở cả client và server (server có bản copy tại server/src/constants/)
 */

// ─────────────────────────────────────────────────────────────────────────────
// BASE ALLOCATIONS
// Allocation nền tảng, chỉ phụ thuộc risk level.
// Sentiment/horizon/capital được điều chỉnh qua overlay system bên dưới.
// ─────────────────────────────────────────────────────────────────────────────
export const BASE_ALLOCATIONS = {
  // Mục tiêu: bảo toàn vốn
  // - Vàng 25%: phản ánh thói quen đầu tư VN truyền thống, hedge lạm phát tốt
  // - Bonds 15%: lãi suất TPCP VN 2024 hấp dẫn (~5.8%/năm), ổn định hơn vàng
  // - Stocks 5%: exposure tối thiểu, không bỏ hẳn thị trường cổ phiếu
  // - Crypto 0%: không phù hợp với mục tiêu bảo toàn vốn
  LOW: { savings: 55, gold: 25, bonds: 15, stocks: 5, crypto: 0 },

  // Mục tiêu: cân bằng tăng trưởng và bảo toàn
  // - Growth assets (stocks+crypto) = 35%, stable assets = 65%
  // - Phỏng theo 60/40 rule nhưng adapted cho thị trường VN
  MEDIUM: { savings: 30, gold: 20, bonds: 15, stocks: 30, crypto: 5 },

  // Mục tiêu: tối đa hóa tăng trưởng dài hạn
  // - Growth assets (stocks+crypto) = 70%
  // - Savings 10% = liquidity buffer tối thiểu, không bỏ hẳn tài sản an toàn
  // - Vàng 15% giảm xuống vì đã có cổ phiếu đa dạng hóa
  HIGH: { savings: 10, gold: 15, bonds: 5, stocks: 55, crypto: 15 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SENTIMENT BANDS
// Điều chỉnh tactical dựa trên tâm lý thị trường (Fear & Greed Index).
// Max delta mỗi band: ±10% để không override quá nhiều BASE allocation.
//
// Fix bug cũ: NEUTRAL là band [41-59], không phải điểm chính xác 50.
// Logic đúng: EXTREME_GREED → tăng stocks (risk-on), KHÔNG tăng savings.
// ─────────────────────────────────────────────────────────────────────────────
export const SENTIMENT_BANDS = [
  {
    max: 20,
    label: 'EXTREME_FEAR',
    labelVi: 'Sợ hãi cực độ',
    // Thoát rủi ro: +10% savings, giảm stocks và crypto
    overlay: { savings: +10, stocks: -5, crypto: -5 },
  },
  {
    max: 40,
    label: 'FEAR',
    labelVi: 'Sợ hãi',
    // Phòng thủ nhẹ: +5% savings, giảm nhẹ cổ phiếu và crypto
    overlay: { savings: +5, stocks: -3, crypto: -2 },
  },
  {
    max: 59,
    label: 'NEUTRAL',
    labelVi: 'Trung lập',
    // Không điều chỉnh - giữ BASE allocation
    overlay: {},
  },
  {
    max: 74,
    label: 'GREED',
    labelVi: 'Tham lam',
    // Risk-on nhẹ: tăng stocks, giảm savings
    overlay: { savings: -3, stocks: +3 },
  },
  {
    max: 100,
    label: 'EXTREME_GREED',
    labelVi: 'Tham lam cực độ',
    // Risk-on: tăng stocks và crypto, giảm savings
    // Lưu ý: contrarian view - EXTREME_GREED là tín hiệu cảnh báo,
    // nhưng giữ moderate để không confuse retail investor
    overlay: { savings: -5, stocks: +3, crypto: +2 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HORIZON OVERLAYS
// Điều chỉnh dựa trên kỳ hạn đầu tư của người dùng.
// ─────────────────────────────────────────────────────────────────────────────
export const HORIZON_OVERLAYS = {
  // < 3 năm: ưu tiên thanh khoản, giảm tài sản biến động cao
  SHORT: { savings: +10, stocks: -5, crypto: -5 },
  // 3–7 năm: giữ nguyên BASE
  MEDIUM: {},
  // > 7 năm: tận dụng compound growth, giảm savings, tăng tài sản sinh lời
  LONG: { savings: -10, stocks: +7, bonds: +3 },
};

// ─────────────────────────────────────────────────────────────────────────────
// CAPITAL OVERLAYS
// Soft scale theo quy mô vốn - thay thế hard cap cũ (< 50tr cap crypto=5%).
// Hard cap tạo cliff edge: 49.9tr vs 50.1tr có allocation khác hoàn toàn.
// ─────────────────────────────────────────────────────────────────────────────
export const CAPITAL_OVERLAYS = {
  // < 50tr: ưu tiên tích lũy, giảm tài sản rủi ro cao
  // Lý do: transaction cost cao tương đối, cần đủ vốn để diversify hiệu quả
  SMALL: { savings: +15, stocks: -8, crypto: -7 },
  // 50–200tr: giữ nguyên BASE
  NORMAL: {},
  // > 200tr: có thể chịu illiquidity, diversify thêm
  LARGE: { savings: -5, stocks: +3, gold: +2 },
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSET_CLASSES - Expected Returns thực tế VN 2024-2025
// ─────────────────────────────────────────────────────────────────────────────
export const ASSET_CLASSES = {
  savings: {
    label: 'Tiết kiệm',
    expectedReturn: 0.05, // 5.0%/năm - lãi suất tiết kiệm 12T TB NH lớn VN 2024 (nguồn: NHNN)
    stdDev: 0.002, // gần như risk-free
  },
  gold: {
    label: 'Vàng',
    expectedReturn: 0.065, // 6.5%/năm - CAGR vàng SJC 10 năm, loại trừ distortion 2023-2024
    stdDev: 0.18, // biến động cao hơn bonds nhưng thấp hơn stocks
  },
  bonds: {
    label: 'Trái phiếu',
    expectedReturn: 0.042, // 4.2%/năm - yield TPCP 10 năm đấu thầu VBMA/HNX 2025
    stdDev: 0.04,
  },
  stocks: {
    label: 'Cổ phiếu',
    expectedReturn: 0.1, // 10.0%/năm - VN-Index CAGR 2014-2024, bao gồm giai đoạn COVID
    stdDev: 0.22, // biến động đáng kể, phù hợp dài hạn
  },
  crypto: {
    label: 'Tiền mã hóa',
    expectedReturn: null, // Không dùng point estimate - biến động quá lớn, misleading
    bearCase: -0.6, // -60% (đã xảy ra: BTC 2022)
    baseCase: 0.2, // +20% (kịch bản trung bình)
    bullCase: 1.5, // +150% (đã xảy ra nhiều lần)
    stdDev: 0.8,
    note: 'Crypto không có lợi nhuận kỳ vọng ổn định - hiển thị 3 kịch bản thay vì số trung bình',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// RISK_CONFIG - Ngưỡng xác định risk level từ quiz score
// ─────────────────────────────────────────────────────────────────────────────
export const RISK_CONFIG = {
  // score >= 65 → HIGH, score >= 40 → MEDIUM, còn lại → LOW
  // (Rộng hơn cũ: cũ dùng 60/30, nay 65/40 để giảm false HIGH)
  thresholds: { HIGH: 65, MEDIUM: 40 },

  // Trọng số câu hỏi: câu hỏi về hành vi thực tế quan trọng hơn thái độ
  // q1: mục tiêu đầu tư (attitude)
  // q2: phản ứng khi thua lỗ (predicted behavior)
  // q3: hành vi đầu tư thực tế trong quá khứ (actual behavior - quan trọng nhất)
  // q4: kỳ hạn đầu tư (constraint)
  // q5: ổn định thu nhập (context)
  questionWeights: { q1: 1.0, q2: 1.5, q3: 2.0, q4: 1.5, q5: 1.0 },
};

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION_TEXTS - Văn bản khuyến nghị theo sentiment
// ─────────────────────────────────────────────────────────────────────────────
export const RECOMMENDATION_TEXTS = {
  EXTREME_FEAR:
    'Thị trường đang sợ hãi cực độ. Đây thường là cơ hội tốt để mua vào từng phần, nhưng hãy ưu tiên bảo toàn vốn và giữ thanh khoản cao.',
  FEAR: 'Thị trường đang e ngại. Phân bổ thận trọng, giữ nhiều tiết kiệm và vàng để an toàn. Có thể mua thêm cổ phiếu cơ bản tốt.',
  NEUTRAL: 'Thị trường cân bằng. Phân bổ theo hồ sơ rủi ro của bạn là hợp lý. Duy trì kỷ luật tái cân bằng định kỳ.',
  GREED:
    'Thị trường đang hưng phấn. Thận trọng với crypto và cổ phiếu đầu cơ. Cân nhắc chốt lời một phần nếu danh mục đã tăng mạnh.',
  EXTREME_GREED:
    'CẢNH BÁO: Thị trường đang tham lam cực độ - thường là dấu hiệu đỉnh ngắn hạn. Cân nhắc giảm tỷ trọng tài sản rủi ro, tăng tiền mặt/tiết kiệm.',
};
