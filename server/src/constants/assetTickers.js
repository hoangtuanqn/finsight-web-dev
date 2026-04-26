/**
 * assetTickers.js — Ticker mapping cho Historical Data Engine
 *
 * Dùng Yahoo Finance v8 chart API để lấy monthly closes 5 năm cho asset có ticker public.
 * Savings không cần ticker — dùng profile.savingsRate (lãi suất cố định, variance ≈ 0).
 * Bonds không dùng proxy Mỹ nữa; optimizer dùng fallback TPCP Việt Nam trong FALLBACK_PARAMS.
 *
 * Hạn chế đã biết:
 *   - ^VNINDEX: Yahoo Finance API không chính thức, có thể mất ổn định.
 *     Backup plan: dùng FUEVFVND.VN (ETF VN-Diamond) hoặc hardcode monthly closes.
 *   - BTC-USD: Yahoo Finance backup cho CoinGecko (đã dùng trong getCryptoPrices).
 */

export const ASSET_TICKERS = {
  gold:    'GC=F',       // Gold Futures (COMEX) — đã dùng trong getGoldPrices()
  // NOTE: ^VNINDEX trả 404 từ Yahoo Finance (API không chính thức).
  // Dùng VCB.VN (Vietcombank — VN30 bluechip lớn nhất) làm proxy cho thị trường VN.
  // Có correlation cao với VN-Index (~0.85). Backup: FUEVFVND.VN hoặc E1VFVN30.VN.
  stocks:  'VCB.VN',     // Vietcombank — proxy cho thị trường chứng khoán VN
  bonds:   null,         // Không dùng proxy Mỹ; dùng fallback TPCP Việt Nam trong optimizer
  crypto:  'BTC-USD',    // Bitcoin — blue-chip crypto
};

// Thứ tự chuẩn cho vector/matrix operations (phải nhất quán toàn bộ hệ thống)
export const ASSET_ORDER = ['savings', 'gold', 'stocks', 'bonds', 'crypto'];

export const HISTORY_CONFIG = {
  years: 5,
  interval: '1mo',       // monthly data
  cacheKeyPrefix: 'hist',
  cacheTTL: 86400,        // 24 giờ (historical data ít thay đổi)
};

// Fallback values nếu Yahoo Finance lỗi — lấy từ ASSET_CLASSES hiện tại
// Đây là "last resort", chỉ dùng khi không fetch được data thật
export const FALLBACK_PARAMS = {
  savings: { annualReturn: 0.050, annualStdDev: 0.002 },
  gold:    { annualReturn: 0.065, annualStdDev: 0.180 },
  stocks:  { annualReturn: 0.100, annualStdDev: 0.220 },
  bonds:   { annualReturn: 0.058, annualStdDev: 0.040 },
  crypto:  { annualReturn: 0.200, annualStdDev: 0.800 },
};
