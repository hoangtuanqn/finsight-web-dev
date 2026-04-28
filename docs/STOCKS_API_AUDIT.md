# Stock API & Hardcoded Suggestions Audit
**File:** `client/src/pages/InvestmentPage.jsx`  
**Date:** 2026-04-23

---

## 1. HARDCODED STOCKS OBJECT (INVESTMENT_SUGGESTIONS)

### Location
**File:** `client/src/pages/InvestmentPage.jsx`  
**Lines:** 177-234

### Full `INVESTMENT_SUGGESTIONS.stocks` Object

```javascript
// Lines 201-211
stocks: {
  label: 'Chứng khoán',
  icon: '📈',
  color: '#10b981',
  intro: 'Đầu tư cổ phiếu VN-Index — ưu tiên cổ phiếu bluechip và ETF để giảm rủi ro cá biệt.',
  items: [
    {
      name: 'VNM (Vinamilk)',
      tag: 'Tiêu dùng',
      rate: 'Cổ tức ~5%/năm',
      note: 'Cổ phiếu phòng thủ, cổ tức đều, ít biến động',
      badge: 'An toàn',
      badgeColor: 'blue'
    },
    {
      name: 'FPT Corporation',
      tag: 'Công nghệ',
      rate: 'Tăng trưởng 20%+',
      note: 'Dẫn đầu công nghệ VN, mảng offshore tăng mạnh',
      badge: 'Tăng trưởng',
      badgeColor: 'emerald'
    },
    {
      name: 'VCB (Vietcombank)',
      tag: 'Ngân hàng',
      rate: 'ROE ~20%',
      note: 'Ngân hàng lớn nhất, tỷ lệ nợ xấu thấp, ổn định',
      badge: 'Bluechip',
      badgeColor: 'amber'
    },
    {
      name: 'E1VFVN30 (ETF)',
      tag: 'ETF',
      rate: 'Theo VN30',
      note: 'Đầu tư thụ động, phân tán rủi ro tự động, phí thấp',
      badge: 'Khuyên dùng',
      badgeColor: 'amber'
    },
    {
      name: 'HPG (Hòa Phát)',
      tag: 'Thép/BĐS',
      rate: 'P/E thấp ~8x',
      note: 'Doanh nghiệp lớn nhất ngành thép, biên lợi nhuận tốt',
      badge: '',
      badgeColor: ''
    },
  ],
  tips: [
    'Không bỏ hết vào 1 mã — đa dạng ít nhất 5-7 cổ phiếu',
    'ETF là lựa chọn tốt nhất cho người mới bắt đầu',
    'DCA (mua đều hàng tháng) giúp giảm rủi ro giá bình quân'
  ]
}
```

### Other Asset Suggestions (for context)
- **Savings** (Lines 178-189): ACB, Techcombank, VPBank, MSB, HDBank
- **Gold** (Lines 190-200): Vàng miếng SJC, Vàng nhẫn 24K PNJ, DOJI, BIDV chứng chỉ
- **Bonds** (Lines 213-222): Trái phiếu Chính phủ, Vietcombank, Quỹ VCBF-BCF
- **Crypto** (Lines 223-234): BTC, ETH, BNB, USDC/USDT (static + dynamic from server)

---

## 2. EXISTING STOCK API CALLS IN SERVER

### Search Results
Files with "stock", "SSI", "TCBS", "VNDirect", "vndirect", "fireant":
- `server/src/controllers/investment.controller.js`
- `server/src/utils/calculations.js`

### Findings: **NO STOCK API INTEGRATION FOUND**

#### in `investment.controller.js` (Lines 1-394)
**What exists:**
- ✅ `getCryptoPrices()` — fetches from CoinGecko API (Lines 312-393)
- ✅ `getAllocationRecommendation()` — allocates assets (Lines 45-136)
- ✅ `submitRiskAssessment()` — calculates risk level (Lines 155-187)

**What's MISSING:**
- ❌ No SSI API call
- ❌ No TCBS API call
- ❌ No VNDirect API call
- ❌ No fireant API call
- ❌ No stock price fetch
- ❌ No stock suggestion generation

#### in `calculations.js`
**Pattern:** Only financial math (APY, EAR, loan calculations)  
**No stock-related code found**

---

## 3. MARKET-RELATED ROUTES & SERVICES (EXISTING)

### Routes Defined
**File:** `server/src/routes/market.routes.js` (Lines 1-14)

```javascript
// Available endpoints:
GET /api/market/sentiment      → getSentiment()
GET /api/market/prices         → getPrices()
GET /api/market/news           → getNews()
GET /api/market/summary        → getMarketSummary()
```

**Note:** These are cryptocurrency/general market endpoints - NO stock market routes

### Services Available
**File:** `server/src/services/market.service.js` (Lines 1-135)

```javascript
✅ fetchFearGreedIndex()        // Lines 5-32 (crypto sentiment)
✅ fetchCryptoPrices()          // Lines 34-60 (BTC, ETH from CoinGecko)
✅ fetchGoldPrice()             // Lines 96-134 (SJC from BTMC API)
✅ fetchNews()                  // Lines 62-94 (general news from NewsAPI)

❌ NO fetchStockPrice()
❌ NO fetchStockList()
❌ NO fetchStockSuggestions()
```

### Investment Routes
**File:** `server/src/routes/investment.routes.js` (Lines 1-21)

```javascript
// Available endpoints:
GET  /api/investment/profile              → getInvestorProfile()
POST /api/investment/profile              → createInvestorProfile()
PUT  /api/investment/profile              → updateInvestorProfile()
GET  /api/investment/allocation           → getAllocationRecommendation()
GET  /api/investment/history              → getAllocationHistory()
POST /api/investment/risk-assessment      → submitRiskAssessment()
GET  /api/investment/crypto-prices        → getCryptoPrices()

❌ NO /api/investment/stock-prices
❌ NO /api/investment/stock-suggestions
```

---

## 4. SUMMARY TABLE

| Component | Status | Details |
|-----------|--------|---------|
| **Hardcoded Stocks List** | ✅ EXISTS | 5 stocks (VNM, FPT, VCB, E1VFVN30, HPG) + 3 tips |
| **Stock Price API** | ❌ MISSING | No SSI, TCBS, VNDirect, or fireant integration |
| **Stock Suggestions Endpoint** | ❌ MISSING | No `/api/investment/stock-prices` or similar |
| **Crypto Integration** | ✅ EXISTS | CoinGecko API with scoring (lines 312-393) |
| **Market Services** | ⚠️ PARTIAL | Sentiment, crypto prices, gold, news — but NO stocks |
| **Risk Allocation** | ✅ EXISTS | Multi-layer allocation logic (savings, gold, stocks, bonds, crypto) |

---

## 5. NEXT STEPS FOR STOCK API INTEGRATION

### Option A: Simple (Use existing hardcoded list + enrich)
1. **Keep hardcoded stocks** for static display
2. **Add enrichment endpoint** `/api/investment/stock-prices` to fetch real prices from:
   - SSI (Stock Trading)
   - TCBS (Analysis)
   - VNDirect (Trading)
   - fireant (Market data)

### Option B: Dynamic (Full replacement)
1. **Remove hardcoded list** from `InvestmentPage.jsx`
2. **Create new endpoint** `/api/investment/stock-suggestions` similar to `getCryptoPrices()`
3. **Implement stock scoring** similar to `scoreCoin()` (lines 228-256)
4. **Add stock service** `fetchStockPrices()` in `market.service.js`

---

## 6. DATA STRUCTURE REFERENCE

### Stock Item Object (current hardcoded format)
```javascript
{
  name: string,           // e.g., "VNM (Vinamilk)"
  tag: string,            // e.g., "Tiêu dùng"
  rate: string,           // e.g., "Cổ tức ~5%/năm"
  note: string,           // description
  badge: string,          // e.g., "An toàn" (optional)
  badgeColor: string      // 'blue' | 'amber' | 'emerald' | 'purple'
}
```

### Crypto Item Object (dynamic format)
```javascript
{
  id: string,             // CoinGecko ID
  name: string,
  symbol: string,
  image: string,
  price: number,
  marketCap: number,
  change24h: number,
  volRatio: number,
  marketCapRank: number,
  tag: string,
  note: string,
  badge: string,
  badgeColor: string,
  rate: string
}
```

---

## 7. CLIENT-SIDE IMPLEMENTATION

### File: `client/src/pages/InvestmentPage.jsx`

**Crypto Tab (Dynamic):**
- Lines 254-267: Fetch from `/api/investment/crypto-prices`
- Lines 339-376: Render dynamic coin cards

**Stock Tab (Currently Static):**
- Lines 201-211: HARDCODED STOCKS OBJECT
- Lines 379-408: Render from `suggestion.items` (hardcoded)

**To make stocks dynamic:**
- Modify `InvestmentSuggestionsPanel` (lines 238-433)
- Add `useEffect` hook to fetch stocks (similar to crypto)
- Replace hardcoded rendering with dynamic map (similar to crypto)

---

## END OF AUDIT
