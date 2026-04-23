# Quick Reference: Stock Hardcoding & API Status

## 📍 EXACT LINE NUMBERS - HARDCODED STOCKS

### File: `client/src/pages/InvestmentPage.jsx`

| Component | Lines | Content |
|-----------|-------|---------|
| **INVESTMENT_SUGGESTIONS start** | 177 | `const INVESTMENT_SUGGESTIONS = {` |
| **Savings asset** | 178-189 | 5 banks + tips |
| **Gold asset** | 190-200 | 4 gold products + tips |
| **⭐ STOCKS ASSET** | **201-211** | **5 stocks + 3 tips** |
| **Bonds asset** | 213-222 | 3 bonds + tips |
| **Crypto asset** | 223-234 | 4 coins (static) |
| **InvestmentSuggestionsPanel** | 238 | Component function start |
| **Crypto loading logic** | 254-267 | `useEffect` fetch crypto |
| **Crypto render** | 339-376 | Dynamic coin card map |
| **Stock render (HARDCODED)** | 379-408 | Static `suggestion.items` map |

---

## 📍 EXACT LINE NUMBERS - SERVER STOCK SEARCHES

### Search Results Summary
```
Files containing "stock", "SSI", "TCBS", "VNDirect", "vndirect", "fireant":
  - server/src/controllers/investment.controller.js (NO relevant stock code)
  - server/src/utils/calculations.js (NO relevant stock code)
```

**Conclusion:** ❌ **NO STOCK API INTEGRATION EXISTS**

---

## 📍 EXISTING API ENDPOINTS

### File: `server/src/routes/market.routes.js`
| Route | Lines | Handler |
|-------|-------|---------|
| GET `/api/market/sentiment` | 9 | `getSentiment()` |
| GET `/api/market/prices` | 10 | `getPrices()` |
| GET `/api/market/news` | 11 | `getNews()` |
| GET `/api/market/summary` | 12 | `getMarketSummary()` |

### File: `server/src/routes/investment.routes.js`
| Route | Lines | Handler |
|-------|-------|---------|
| GET `/api/investment/profile` | 13 | `getInvestorProfile()` |
| POST `/api/investment/profile` | 14 | `createInvestorProfile()` |
| PUT `/api/investment/profile` | 15 | `updateInvestorProfile()` |
| GET `/api/investment/allocation` | 16 | `getAllocationRecommendation()` |
| GET `/api/investment/history` | 17 | `getAllocationHistory()` |
| POST `/api/investment/risk-assessment` | 18 | `submitRiskAssessment()` |
| GET `/api/investment/crypto-prices` | 19 | `getCryptoPrices()` |

---

## 📍 EXISTING CRYPTO API (MODEL FOR STOCKS)

### File: `server/src/controllers/investment.controller.js`

| Component | Lines | Purpose |
|-----------|-------|---------|
| **getCryptoPrices()** | 312-393 | Main crypto fetch endpoint |
| **scoreCoin()** | 228-256 | Scoring algorithm (50% mcap, 20% liquidity, 30% volatility) |
| **buildCoinCard()** | 258-310 | Format coin data for UI |
| **Cache setup** | 191-202 | 5-min TTL, stablecoin filter, blacklist |

### File: `server/src/services/market.service.js`

| Component | Lines | Purpose |
|-----------|-------|---------|
| **fetchFearGreedIndex()** | 5-32 | Fear & Greed sentiment |
| **fetchCryptoPrices()** | 34-60 | BTC/ETH from CoinGecko |
| **fetchGoldPrice()** | 96-134 | SJC from BTMC API |
| **fetchNews()** | 62-94 | News from NewsAPI |

---

## 🔧 STOCKS OBJECT STRUCTURE

### Location: Lines 201-211 in InvestmentPage.jsx

```javascript
{
  label: 'Chứng khoán',
  icon: '📈',
  color: '#10b981',
  intro: 'Đầu tư cổ phiếu VN-Index — ưu tiên cổ phiếu bluechip và ETF để giảm rủi ro cá biệt.',
  items: [
    // 5 stocks hardcoded here:
    // 1. VNM (Vinamilk) - Tiêu dùng
    // 2. FPT Corporation - Công nghệ
    // 3. VCB (Vietcombank) - Ngân hàng
    // 4. E1VFVN30 (ETF) - ETF
    // 5. HPG (Hòa Phát) - Thép/BĐS
  ],
  tips: [
    // 3 investment tips hardcoded here
  ]
}
```

---

## ✅ WHAT EXISTS / ❌ WHAT'S MISSING

| Feature | Status | Lines |
|---------|--------|-------|
| Fear & Greed sentiment API | ✅ | market.service.js:5-32 |
| Crypto prices (CoinGecko) | ✅ | market.service.js:34-60 |
| Gold prices (BTMC) | ✅ | market.service.js:96-134 |
| Crypto scoring algorithm | ✅ | investment.controller.js:228-256 |
| Crypto formatting (UI cards) | ✅ | investment.controller.js:258-310 |
| Crypto cache management | ✅ | investment.controller.js:191-202 |
| **Stock prices API** | ❌ | — |
| **Stock scoring** | ❌ | — |
| **Stock service** | ❌ | — |
| **Stock endpoint** | ❌ | — |
| **Hardcoded stocks** | ✅ | InvestmentPage.jsx:201-211 |

---

## 🎯 STOCKS TO IMPLEMENT (IF INTEGRATING APIs)

**Current hardcoded stocks:**
1. VNM (Vinamilk) — Consumer, Dividend ~5%/year
2. FPT Corporation — Tech, Growth 20%+
3. VCB (Vietcombank) — Bank, ROE ~20%
4. E1VFVN30 (ETF) — Index fund, Tracks VN30
5. HPG (Hòa Phát) — Steel, P/E ~8x

**Possible API sources:**
- SSI Securities - Stock trading data
- TCBS - Stock analysis & ratings
- VNDirect - Market data
- fireant - Real-time pricing

---

END
