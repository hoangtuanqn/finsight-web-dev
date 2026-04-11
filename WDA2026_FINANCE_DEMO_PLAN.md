# WDA2026 — FinSight: Personal Finance Platform
## Complete Technical Implementation Plan

---

## OVERVIEW

Build a full-stack personal finance web application that solves 2 core problems:
1. **Debt Management**: Aggregate scattered BNPL debts (SPayLater, LazPayLater, MoMo, credit cards) into one dashboard, calculate real interest rates (EAR), and suggest optimal repayment strategies (Avalanche/Snowball)
2. **AI Investment Advisor**: Analyze user's financial profile + real-time Market Sentiment (Fear & Greed Index) + multi-asset market data to recommend a personalized investment portfolio allocation

---

## TECH STACK

```
Frontend:  React 18 + Vite + TailwindCSS + Recharts + React Router v6 + Axios + React Query + Framer Motion (for premium animations)
Backend:   Node.js + Express 5 + Prisma ORM + Redis (caching) + JWT Auth + bcrypt
Database:  PostgreSQL 15
Cache:     Redis 7
APIs:      Fear & Greed Index (alternative.me), CoinGecko, Alpha Vantage, NewsAPI
```

---

## PROJECT STRUCTURE

```
finsight/
├── client/                          # React frontend (Vite)
│   ├── src/
│   │   ├── api/                     # Axios API calls
│   │   │   ├── auth.api.js
│   │   │   ├── debt.api.js
│   │   │   ├── investment.api.js
│   │   │   ├── market.api.js
│   │   │   └── user.api.js
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── AlertBadge.jsx
│   │   │   │   ├── MetricCard.jsx
│   │   │   │   ├── ProgressBar.jsx
│   │   │   │   └── Modal.jsx
│   │   │   ├── debt/
│   │   │   │   ├── DebtCard.jsx
│   │   │   │   ├── DebtForm.jsx
│   │   │   │   ├── DebtTable.jsx
│   │   │   │   ├── EARBreakdown.jsx
│   │   │   │   ├── RepaymentSimulator.jsx
│   │   │   │   ├── DominoAlert.jsx
│   │   │   │   └── DebtTimeline.jsx
│   │   │   └── investment/
│   │   │       ├── SentimentGauge.jsx
│   │   │       ├── AllocationChart.jsx
│   │   │       ├── MarketTicker.jsx
│   │   │       ├── RiskProfileForm.jsx
│   │   │       ├── NewsCard.jsx
│   │   │       ├── PortfolioProjection.jsx
│   │   │       ├── MockMarketControl.jsx # For hacking demo sentiment
│   │   │       └── AdvisorChatbot.jsx    # LLM-powered virtual advisor
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── debt/
│   │   │   │   ├── DebtOverviewPage.jsx
│   │   │   │   ├── AddDebtPage.jsx
│   │   │   │   ├── DebtDetailPage.jsx
│   │   │   │   └── RepaymentPlanPage.jsx
│   │   │   ├── investment/
│   │   │   │   ├── InvestmentPage.jsx
│   │   │   │   ├── RiskAssessmentPage.jsx
│   │   │   │   └── PortfolioPage.jsx
│   │   │   └── profile/
│   │   │       └── ProfilePage.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useDebts.js
│   │   │   ├── useMarketData.js
│   │   │   └── useInvestment.js
│   │   ├── utils/
│   │   │   ├── calculations.js      # EAR, APY, Avalanche/Snowball logic
│   │   │   ├── formatters.js        # currency, date, percentage formatters
│   │   │   └── constants.js         # platform presets, risk levels
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── debt.controller.js
│   │   │   ├── investment.controller.js
│   │   │   └── market.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── debt.routes.js
│   │   │   ├── investment.routes.js
│   │   │   └── market.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── validate.middleware.js # request validation
│   │   │   └── cache.middleware.js  # Redis caching
│   │   ├── services/
│   │   │   ├── debt.service.js      # EAR calc, Avalanche/Snowball logic
│   │   │   ├── investment.service.js # allocation rules engine
│   │   │   ├── market.service.js    # external API calls
│   │   │   └── redis.service.js     # Redis helper
│   │   ├── lib/
│   │   │   ├── prisma.js            # Prisma client singleton
│   │   │   └── redis.js             # Redis client singleton
│   │   ├── utils/
│   │   │   ├── calculations.js      # shared financial math
│   │   │   └── apiResponse.js       # standardized response format
│   │   └── app.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── package.json
│   └── .env
│
└── docker-compose.yml               # PostgreSQL + Redis containers
```

---

## DATABASE SCHEMA (Prisma)

```prisma
// server/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  fullName      String
  monthlyIncome Float    @default(0)
  extraBudget   Float    @default(0)  // tiền dư có thể trả thêm nợ/tháng
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  debts          Debt[]
  investorProfile InvestorProfile?
  notifications   Notification[]
  debtSnapshots   DebtSnapshot[]

  @@map("users")
}

model Debt {
  id            String   @id @default(cuid())
  userId        String
  name          String
  platform      String   // SPAYLATER | LAZPAYLATER | CREDIT_CARD | MOMO | HOME_CREDIT | OTHER
  originalAmount Float   // số tiền vay ban đầu
  balance       Float    // dư nợ còn lại
  apr           Float    // APR % được quảng cáo
  rateType      String   @default("FLAT")  // FLAT | REDUCING
  feeProcessing Float    @default(0)  // phí hồ sơ % một lần
  feeInsurance  Float    @default(0)  // phí bảo hiểm % / năm
  feeManagement Float    @default(0)  // phí quản lý % / năm
  feePenaltyPerDay Float @default(0)  // phí phạt % / ngày khi trễ hạn
  minPayment    Float    // số tiền trả tối thiểu / kỳ
  dueDay        Int      // ngày trả trong tháng (1-31)
  termMonths    Int      // tổng số kỳ ban đầu
  remainingTerms Int     // số kỳ còn lại
  status        String   @default("ACTIVE")  // ACTIVE | PAID | OVERDUE
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  payments      Payment[]

  @@map("debts")
}

model Payment {
  id        String   @id @default(cuid())
  debtId    String
  amount    Float
  paidAt    DateTime @default(now())
  notes     String?

  debt      Debt     @relation(fields: [debtId], references: [id], onDelete: Cascade)

  @@map("payments")
}

model InvestorProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  capital       Float    @default(0)   // vốn hiện có
  monthlyAdd    Float    @default(0)   // đầu tư thêm / tháng
  goal          String   @default("GROWTH")  // BUY_HOUSE | FINANCIAL_FREEDOM | EMERGENCY | GROWTH
  horizon       String   @default("MEDIUM")  // SHORT | MEDIUM | LONG
  riskLevel     String   @default("MEDIUM")  // LOW | MEDIUM | HIGH
  riskScore     Int      @default(0)   // 0-100 điểm từ quiz
  lastUpdated   DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  allocations   Allocation[]

  @@map("investor_profiles")
}

model Allocation {
  id              String   @id @default(cuid())
  profileId       String
  sentimentValue  Int      // giá trị Fear & Greed lúc tính
  sentimentLabel  String   // EXTREME_FEAR | FEAR | NEUTRAL | GREED | EXTREME_GREED
  savings         Float    // % tiết kiệm
  gold            Float    // % vàng
  stocks          Float    // % chứng khoán
  bonds           Float    // % trái phiếu
  crypto          Float    // % crypto
  recommendation  String   // lý do đề xuất
  createdAt       DateTime @default(now())

  profile         InvestorProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@map("allocations")
}

model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // DEBT_DUE | DOMINO_RISK | SENTIMENT_CHANGE | REBALANCE
  title     String
  message   String
  isRead    Boolean  @default(false)
  severity  String   @default("INFO")  // INFO | WARNING | DANGER
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model DebtSnapshot {
  id          String   @id @default(cuid())
  userId      String
  totalDebt   Float
  totalEAR    Float    // weighted average EAR
  debtToIncome Float
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("debt_snapshots")
}
```

---

## BUSINESS LOGIC — FINANCIAL CALCULATIONS

```javascript
// Implement these functions in both server/src/utils/calculations.js AND client/src/utils/calculations.js

/**
 * CALCULATION 1: APY from APR
 * APY = (1 + APR/n)^n - 1
 * n = compounding periods per year (12 for monthly)
 */
function calcAPY(apr, n = 12) {
  return (Math.pow(1 + (apr / 100) / n, n) - 1) * 100;
}

/**
 * CALCULATION 2: EAR (Effective Annual Rate)
 * EAR = APY + total annual fees as percentage of principal
 * Includes: processing fee (one-time, amortized), insurance fee, management fee
 */
function calcEAR(apr, feeProcessing, feeInsurance, feeManagement, termMonths) {
  const apy = calcAPY(apr);
  const annualizedProcessingFee = (feeProcessing / termMonths) * 12;
  const totalAnnualFees = annualizedProcessingFee + feeInsurance + feeManagement;
  return apy + totalAnnualFees;
}

/**
 * CALCULATION 3: Monthly payment for reducing balance loan
 * P * r * (1+r)^n / ((1+r)^n - 1)
 */
function calcReducingMonthlyPayment(principal, apr, termMonths) {
  const r = (apr / 100) / 12;
  if (r === 0) return principal / termMonths;
  return principal * r * Math.pow(1 + r, termMonths) / (Math.pow(1 + r, termMonths) - 1);
}

/**
 * CALCULATION 4: Monthly payment for flat rate loan
 * (Principal + Principal * APR/100 * termMonths/12) / termMonths
 */
function calcFlatMonthlyPayment(principal, apr, termMonths) {
  const totalInterest = principal * (apr / 100) * (termMonths / 12);
  return (principal + totalInterest) / termMonths;
}

/**
 * CALCULATION 5: Avalanche / Snowball simulation
 * Returns: { months, totalInterest, schedule: [{month, payments: [{debtId, paid, balance}]}] }
 */
function simulateRepayment(debts, extraBudget, method = 'AVALANCHE') {
  let ds = debts.map(d => ({
    id: d.id,
    name: d.name,
    balance: d.balance,
    apr: d.apr,
    rateType: d.rateType,
    minPayment: d.minPayment,
  }));

  let months = 0;
  let totalInterest = 0;
  const schedule = [];

  while (ds.some(d => d.balance > 0.01) && months < 360) {
    months++;
    let remaining = extraBudget;
    const monthPayments = [];

    // Step 1: Accrue interest
    ds.forEach(d => {
      if (d.balance > 0) {
        let interest;
        if (d.rateType === 'FLAT') {
          interest = d.balance * (d.apr / 100) / 12;
        } else {
          interest = d.balance * (d.apr / 100) / 12;
        }
        totalInterest += interest;
        d.balance += interest;
      }
    });

    // Step 2: Pay minimums
    ds.forEach(d => {
      if (d.balance > 0) {
        const pay = Math.min(d.minPayment, d.balance);
        d.balance -= pay;
        remaining -= pay;
        d.balance = Math.max(0, d.balance);
        monthPayments.push({ debtId: d.id, paid: pay, balance: d.balance });
      }
    });

    // Step 3: Apply extra to priority target
    const activDebts = ds.filter(d => d.balance > 0.01);
    let target = null;

    if (method === 'AVALANCHE') {
      target = activDebts.sort((a, b) => b.apr - a.apr)[0];
    } else {
      target = activDebts.sort((a, b) => a.balance - b.balance)[0];
    }

    if (target && remaining > 0) {
      const pay = Math.min(remaining, target.balance);
      target.balance -= pay;
      target.balance = Math.max(0, target.balance);
      const existing = monthPayments.find(p => p.debtId === target.id);
      if (existing) {
        existing.paid += pay;
        existing.balance = target.balance;
      }
    }

    schedule.push({ month: months, payments: monthPayments });
  }

  return {
    months,
    totalInterest: Math.round(totalInterest * 1000) / 1000,
    schedule,
    isCompleted: months < 360,
  };
}

/**
 * CALCULATION 6: Debt-to-Income Ratio
 */
function calcDebtToIncomeRatio(totalMonthlyDebtPayments, monthlyIncome) {
  if (monthlyIncome === 0) return 0;
  return (totalMonthlyDebtPayments / monthlyIncome) * 100;
}

/**
 * CALCULATION 7: Domino Risk Detection
 * Returns list of debts at risk of cascading default
 */
function detectDominoRisk(debts, monthlyIncome) {
  const alerts = [];
  const today = new Date();
  const currentDay = today.getDate();

  // Check 1: Multiple debts due within same week
  const dueSoon = debts.filter(d => {
    const daysUntilDue = d.dueDay >= currentDay
      ? d.dueDay - currentDay
      : 30 - currentDay + d.dueDay;
    return daysUntilDue <= 7 && d.balance > 0;
  });

  if (dueSoon.length >= 2) {
    alerts.push({
      type: 'MULTIPLE_DUE',
      severity: 'WARNING',
      message: `${dueSoon.length} khoản nợ đáo hạn trong tuần này — nguy cơ thiếu tiền`,
      debts: dueSoon.map(d => d.id),
    });
  }

  // Check 2: Total minimum payments exceed 50% of income
  const totalMin = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const dtiRatio = calcDebtToIncomeRatio(totalMin, monthlyIncome);

  if (dtiRatio > 50) {
    alerts.push({
      type: 'HIGH_DTI',
      severity: 'DANGER',
      message: `Tổng nợ chiếm ${dtiRatio.toFixed(1)}% thu nhập — nguy cơ hiệu ứng domino`,
    });
  } else if (dtiRatio > 35) {
    alerts.push({
      type: 'MEDIUM_DTI',
      severity: 'WARNING',
      message: `Tổng nợ chiếm ${dtiRatio.toFixed(1)}% thu nhập — cần theo dõi`,
    });
  }

  return alerts;
}

/**
 * CALCULATION 8: Portfolio allocation based on Sentiment + Risk Profile
 */
const ALLOCATION_RULES = {
  LOW: {
    EXTREME_FEAR:  { savings: 70, gold: 20, bonds: 10, stocks: 0,  crypto: 0  },
    FEAR:          { savings: 60, gold: 25, bonds: 15, stocks: 0,  crypto: 0  },
    NEUTRAL:       { savings: 50, gold: 20, bonds: 15, stocks: 15, crypto: 0  },
    GREED:         { savings: 55, gold: 20, bonds: 15, stocks: 10, crypto: 0  },
    EXTREME_GREED: { savings: 65, gold: 25, bonds: 10, stocks: 0,  crypto: 0  },
  },
  MEDIUM: {
    EXTREME_FEAR:  { savings: 35, gold: 30, bonds: 10, stocks: 25, crypto: 0  },
    FEAR:          { savings: 25, gold: 25, bonds: 10, stocks: 35, crypto: 5  },
    NEUTRAL:       { savings: 20, gold: 20, bonds: 10, stocks: 40, crypto: 10 },
    GREED:         { savings: 15, gold: 15, bonds: 10, stocks: 45, crypto: 15 },
    EXTREME_GREED: { savings: 30, gold: 25, bonds: 10, stocks: 30, crypto: 5  },
  },
  HIGH: {
    EXTREME_FEAR:  { savings: 10, gold: 25, bonds: 5,  stocks: 40, crypto: 20 },
    FEAR:          { savings: 10, gold: 15, bonds: 5,  stocks: 45, crypto: 25 },
    NEUTRAL:       { savings: 10, gold: 15, bonds: 0,  stocks: 40, crypto: 35 },
    GREED:         { savings: 10, gold: 10, bonds: 0,  stocks: 45, crypto: 35 },
    EXTREME_GREED: { savings: 20, gold: 20, bonds: 0,  stocks: 35, crypto: 25 },
  },
};

function getSentimentLabel(value) {
  if (value <= 24) return 'EXTREME_FEAR';
  if (value <= 49) return 'FEAR';
  if (value === 50) return 'NEUTRAL';
  if (value <= 74) return 'GREED';
  return 'EXTREME_GREED';
}

function getSentimentVietnamese(label) {
  const map = {
    EXTREME_FEAR: 'Sợ hãi cực độ',
    FEAR: 'Sợ hãi',
    NEUTRAL: 'Trung lập',
    GREED: 'Tham lam',
    EXTREME_GREED: 'Tham lam cực độ',
  };
  return map[label];
}

function getAllocation(riskLevel, sentimentValue) {
  const label = getSentimentLabel(sentimentValue);
  const allocation = ALLOCATION_RULES[riskLevel][label];

  const recommendations = {
    EXTREME_FEAR: 'Thị trường đang sợ hãi cực độ. Đây thường là cơ hội tốt để mua vào chứng khoán, nhưng với rủi ro thấp hãy ưu tiên bảo toàn vốn.',
    FEAR: 'Thị trường đang e ngại. Phân bổ thận trọng, giữ nhiều tiết kiệm và vàng để an toàn.',
    NEUTRAL: 'Thị trường cân bằng. Phân bổ theo profile rủi ro của bạn là hợp lý.',
    GREED: 'Thị trường đang hưng phấn. Thận trọng với crypto và cổ phiếu rủi ro cao.',
    EXTREME_GREED: 'CẢNH BÁO: Thị trường đang tham lam cực độ — dấu hiệu bong bóng. Cân nhắc chuyển sang tài sản an toàn hơn.',
  };

  return {
    ...allocation,
    sentimentLabel: label,
    sentimentVietnamese: getSentimentVietnamese(label),
    recommendation: recommendations[label],
  };
}
```

---

## API ENDPOINTS

### Authentication Routes (`/api/auth`)

```
POST /api/auth/register
  Body: { email, password, fullName }
  Returns: { user, token }

POST /api/auth/login
  Body: { email, password }
  Returns: { user, token }

POST /api/auth/logout
  Headers: Authorization: Bearer <token>
  Returns: { message }

GET /api/auth/me
  Headers: Authorization: Bearer <token>
  Returns: { user }
```

### User Routes (`/api/users`) — Protected

```
GET /api/users/profile
  Returns: { user, investorProfile }

PUT /api/users/profile
  Body: { fullName?, monthlyIncome?, extraBudget? }
  Returns: { user }

GET /api/users/notifications
  Returns: { notifications[] }

PUT /api/users/notifications/:id/read
  Returns: { notification }

DELETE /api/users/notifications/read-all
  Returns: { message }
```

### Debt Routes (`/api/debts`) — Protected

```
GET /api/debts
  Returns: { debts[], summary }
  summary = {
    totalBalance,
    totalMinPayment,
    averageEAR,
    debtToIncomeRatio,
    dominoAlerts[],
    dueThisWeek[]
  }

POST /api/debts
  Body: {
    name, platform, originalAmount, balance,
    apr, rateType, feeProcessing, feeInsurance,
    feeManagement, feePenaltyPerDay, minPayment,
    dueDay, termMonths, remainingTerms, notes?
  }
  Returns: { debt }

GET /api/debts/:id
  Returns: { debt, earBreakdown, paymentHistory }

PUT /api/debts/:id
  Body: (same fields as POST, all optional)
  Returns: { debt }

DELETE /api/debts/:id
  Returns: { message }

POST /api/debts/:id/payments
  Body: { amount, notes? }
  Returns: { payment, updatedDebt }

GET /api/debts/repayment-plan
  Query: ?method=AVALANCHE|SNOWBALL&extraBudget=number
  Returns: {
    avalanche: { months, totalInterest, schedule },
    snowball:  { months, totalInterest, schedule },
    comparison: { savedInterest, savedMonths },
    recommendation
  }
  Cache: Redis, TTL 5 minutes per user

GET /api/debts/ear-analysis
  Returns: {
    debts: [{ id, name, apr, apy, ear, earBreakdown }],
    summary: { averageAPR, averageEAR, totalHiddenCost }
  }
```

### Investment Routes (`/api/investment`) — Protected

```
GET /api/investment/profile
  Returns: { investorProfile }

POST /api/investment/profile
  Body: {
    capital, monthlyAdd, goal, horizon, riskLevel, riskScore
  }
  Returns: { investorProfile }

PUT /api/investment/profile
  Body: (same fields, all optional)
  Returns: { investorProfile }

GET /api/investment/allocation
  Returns: {
    allocation: { savings, gold, stocks, bonds, crypto },
    sentimentData: { value, label, labelVi },
    recommendation,
    portfolioBreakdown: [{ asset, percentage, amount }],
    projection: { 1y, 3y, 5y }  // expected value ranges
  }
  Cache: Redis, TTL 15 minutes per user

GET /api/investment/history
  Returns: { allocations[] }  // history of past allocations

POST /api/investment/risk-assessment
  Body: { answers: [{ questionId, answer, score }] }
  Returns: { riskScore, riskLevel, riskDescription }
```

### Market Routes (`/api/market`) — Protected

```
GET /api/market/sentiment
  Returns: {
    fearGreed: { value, label, labelVi, previousClose, trend },
    cryptoFearGreed: { value, label }
  }
  Cache: Redis, TTL 30 minutes (global cache, not per user)

GET /api/market/prices
  Returns: {
    bitcoin: { price, change24h, changePercent },
    ethereum: { price, change24h, changePercent },
    vnindex: { price, change, changePercent },
    gold: { priceVND, change, source }
  }
  Cache: Redis, TTL 10 minutes (global cache)

GET /api/market/news
  Returns: {
    articles: [{ title, description, url, publishedAt, source }]
  }
  Cache: Redis, TTL 30 minutes (global cache)

GET /api/market/summary
  Returns: combined { sentiment, prices, news }
  This endpoint is called on Investment page load
  Cache: Redis, TTL 10 minutes (global cache)
```

---

## REDIS CACHING STRATEGY

```javascript
// Cache keys and TTL strategy:

// GLOBAL CACHE (shared across all users, market data):
"market:fear_greed"          TTL: 30 minutes
"market:prices"              TTL: 10 minutes
"market:news"                TTL: 30 minutes
"market:summary"             TTL: 10 minutes

// PER-USER CACHE (personalized calculations):
"user:{userId}:debt_summary"      TTL: 5 minutes
"user:{userId}:repayment_plan"    TTL: 5 minutes
"user:{userId}:ear_analysis"      TTL: 10 minutes
"user:{userId}:allocation"        TTL: 15 minutes

// INVALIDATION RULES:
// When user adds/edits/deletes a debt → delete user:{userId}:debt_summary, repayment_plan, ear_analysis
// When user updates investor profile → delete user:{userId}:allocation
// Market data auto-expires by TTL, no manual invalidation needed
```

---

## EXTERNAL API INTEGRATIONS

```javascript
// 1. Fear & Greed Index — FREE, no API key needed
GET https://api.alternative.me/fng/?limit=2
// Note: This index is Crypto-specific. For the contest, use this as a representative proxy for "High Risk Market Sentiment".
// Returns current and previous value, use to calculate trend

// 2. Crypto Fear & Greed Index — same endpoint
// value_classification: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"

// 3. CoinGecko — FREE, no API key needed
GET https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true

// 4. Alpha Vantage — FREE with API key (25 req/day)
// Register at alphavantage.co for free API key
GET https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=VNINDEX&apikey={KEY}
// Note: VN-Index symbol may not be available on free tier
// Fallback: Use Vietnam ETF (VFMVN30) or hardcode last known price with "stale" indicator

// 5. NewsAPI — FREE with API key (100 req/day)
// Register at newsapi.org for free API key
GET https://newsapi.org/v2/everything?q=kinh+te+tai+chinh+viet+nam&language=vi&sortBy=publishedAt&pageSize=10&apiKey={KEY}

// 6. Gold price — No official free API for SJC
// Strategy: Scrape sjc.com.vn/xml/tygiavang.xml every hour via cron job
// Cache result in Redis with TTL 1 hour
// Provide manual update endpoint: PUT /api/market/gold { priceVND }
```

---

## FRONTEND PAGES — DETAILED SPECIFICATION

### Page 1: Login / Register (`/login`, `/register`)
- Clean auth forms with email/password
- JWT stored in localStorage
- Redirect to Dashboard on success
- Form validation with error messages

### Page 2: Dashboard (`/dashboard`)
Overview of user's complete financial health.

**Sections:**
1. **Financial Health Score** (computed metric 0-100 based on DTI ratio, EAR, and savings)
2. **Debt Summary Card**:
   - Total outstanding debt
   - Number of active debts
   - Debt-to-income ratio with color indicator (green <30%, yellow 30-50%, red >50%)
   - Next payment due date
3. **Domino Risk Alert** (if applicable — red banner at top)
4. **Debts Due This Week** (list of debts due within 7 days)
5. **Investment Summary Card**:
   - Current allocation overview (mini pie chart)
   - Fear & Greed value (large number with color)
   - Latest recommendation (1 sentence)
6. **Recent Notifications** (last 5 unread)
7. **Quick Actions**: Add Debt, View Repayment Plan, Update Investment Profile

### Page 3: Debt Overview (`/debts`)
Full debt management dashboard.

**Sections:**
1. **Summary Bar** (4 metric cards):
   - Total Debt (total balance)
   - Average EAR % (weighted average)
   - Monthly Minimum (total minimum payments)
   - DTI Ratio %
2. **Domino Risk Alert Panel** (if risk detected — detailed breakdown)
3. **Debt Cards Grid** (one card per debt showing):
   - Platform icon + name
   - Balance remaining
   - APR displayed (with EAR tooltip showing real cost)
   - Next due date (with days countdown)
   - Progress bar (paid vs original)
   - Quick actions: Edit, Delete, Log Payment
4. **Add Debt Button** → navigate to Add Debt page

### Page 4: Add/Edit Debt (`/debts/add`, `/debts/:id/edit`)
Smart form with platform presets.

**Form fields:**
```
Platform (dropdown with icons):
  - SPayLater → preset: APR=18%, rateType=FLAT, feeProcessing=0
  - LazPayLater → preset: APR=18%, rateType=FLAT, feeProcessing=0
  - Credit Card (Visa/MC) → preset: APR=36%, rateType=REDUCING
  - MoMo Vay → preset: APR=20%, rateType=FLAT
  - Home Credit → preset: APR=30%, rateType=FLAT, feeInsurance=2
  - Other → all fields manual

Name (text input, pre-filled based on platform)
Original Amount (number)
Current Balance (number)
APR % (number, pre-filled by preset, editable)
Rate Type (toggle: Flat Rate / Reducing Balance)
--- Advanced Fees Section (collapsible) ---
Processing Fee % (one-time)
Insurance Fee % per year
Management Fee % per year
Late Penalty % per day
---
Minimum Payment per month (number)
Due Day of month (1-31)
Total Term (months)
Remaining Terms (months)
Notes (optional textarea)
```

**Live Preview Panel** (right side, updates as user types):
- APY calculated from APR
- EAR including all fees
- "Real cost" comparison: APR X% → actual EAR Y%
- Estimated total interest to pay

### Page 5: Debt Detail (`/debts/:id`)
Full detail of one debt.

**Sections:**
1. **Debt Summary** (all fields)
2. **EAR Breakdown Chart** (stacked bar):
   - APR portion
   - Compound interest addition (APY-APR)
   - Processing fee
   - Insurance fee
   - Management fee
   - = Total EAR
3. **Payment History** (table with date, amount, remaining balance)
4. **Log Payment** (quick form)
5. **Repayment Progress** (line chart showing balance over time)

### Page 6: Repayment Plan (`/debts/repayment-plan`)
Compare Avalanche vs Snowball strategies.

**Sections:**
1. **Extra Budget Slider** (how much extra you can pay per month)
2. **Comparison Cards**:

```
[AVALANCHE]                    [SNOWBALL]
Tiết kiệm tiền nhất            Tạo động lực tâm lý
Total Interest: X triệu        Total Interest: Y triệu
Months to clear: N             Months to clear: M
Priority order:                Priority order:
1. Thẻ tín dụng (24%)         1. SPayLater (2tr)
2. SPayLater (18%)             2. Thẻ tín dụng (5tr)
3. MoMo (15%)                  3. MoMo (8tr)
```

3. **Savings Comparison**: "Avalanche saves you X triệu compared to Snowball"
4. **Monthly Schedule Table** (first 12 months): month, payments per debt, remaining balance

### Page 7: Investment Page (`/investment`)
Main investment advisory page.

**Sections:**
1. **Market Overview Bar** (live data):
   - Fear & Greed Index gauge (0-100, color coded)
   - BTC price + 24h change
   - ETH price + 24h change
   - VN-Index value + change
   - Gold price (VND/chỉ)
2. **Your Allocation Recommendation** (main feature):
   - Large pie chart (Recharts) with 5 segments: Savings, Gold, Stocks, Bonds, Crypto
   - With capital X triệu, breakdown shows: "X triệu → tiết kiệm: Y triệu, vàng: Z triệu, ..."
   - Recommendation text (1-2 sentences explaining why)
   - Sentiment context: "Thị trường đang [FEAR/GREED] (điểm X/100)"
3. **Projection Chart** (Recharts AreaChart - The "Aha! Moment"):
   - X-axis: years (1-10)
   - Y-axis: portfolio value
   - Shows 2 comparing lines: "Current Path" (minimum debt payments + low savings) vs "Recommended Path" (Avalanche debt payoff + optimized portfolio allocation).
4. **AI Virtual Advisor Chat** (LLM Integration):
   - A dedicated chat box using ChatGPT/Gemini API. Sends prompt: "User has risk X, debt Y, market is FEAR. Give a short advice".
5. **Latest Financial News** (from NewsAPI, 6 articles, card grid)
6. **Update Profile Button** → Risk Assessment page
7. **Mock Market Mode (DEV ONLY)**:
   - A floating widget/toggle to force Sentiment to "EXTREME FEAR" or "EXTREME GREED" to instantly demonstrate dynamic AI adjustments during the presentation.

### Page 8: Risk Assessment (`/investment/risk-assessment`)
Quiz-based risk profiling (5 questions).

```
Question 1: "Nếu danh mục của bạn giảm 20% trong 1 tháng, bạn sẽ làm gì?"
  A) Bán tất cả ngay (score: 0)
  B) Bán một phần (score: 25)
  C) Giữ nguyên (score: 50)
  D) Mua thêm (score: 100)

Question 2: "Mục tiêu tài chính chính của bạn là gì?"
  A) Bảo toàn vốn, không mất tiền (score: 0)
  B) Tăng trưởng ổn định 8-10%/năm (score: 40)
  C) Tăng trưởng 15-20%/năm, chấp nhận rủi ro (score: 70)
  D) Tối đa hóa lợi nhuận, chấp nhận mất đến 50% (score: 100)

Question 3: "Bạn cần dùng số tiền đầu tư này trong bao lâu?"
  A) Dưới 1 năm (score: 0)
  B) 1-3 năm (score: 30)
  C) 3-5 năm (score: 60)
  D) Trên 5 năm (score: 100)

Question 4: "Bạn có bao nhiêu kinh nghiệm đầu tư?"
  A) Chưa đầu tư bao giờ (score: 0)
  B) Chỉ tiết kiệm ngân hàng (score: 20)
  C) Đã mua vàng hoặc quỹ ETF (score: 50)
  D) Đã giao dịch chứng khoán hoặc crypto (score: 100)

Question 5: "Nếu mọi người xung quanh bán tháo, bạn sẽ?"
  A) Bán theo ngay (score: 0)
  B) Chờ và xem (score: 40)
  C) Giữ nguyên kế hoạch (score: 70)
  D) Mua thêm vì giá rẻ (score: 100)
```

**Score calculation:**
- 0-30: LOW risk
- 31-60: MEDIUM risk
- 61-100: HIGH risk

### Page 9: Profile (`/profile`)
User settings and financial profile.

**Sections:**
1. Personal info (name, email, change password)
2. Financial profile: monthly income, extra budget for debt repayment
3. Danger zone: delete account

---

## BACKEND IMPLEMENTATION DETAILS

### Authentication Flow
```javascript
// Register:
// 1. Validate email uniqueness
// 2. Hash password with bcrypt (salt rounds: 12)
// 3. Create user in DB
// 4. Sign JWT (payload: { userId, email }, expires: 7d)
// 5. Return user + token

// Login:
// 1. Find user by email
// 2. Compare password with bcrypt
// 3. Sign JWT
// 4. Return user + token

// Protected routes: verify JWT via middleware
// Token format: "Authorization: Bearer <token>"
```

### Debt Summary Endpoint Logic
```javascript
// GET /api/debts — the most complex endpoint
async function getDebtSummary(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const debts = await prisma.debt.findMany({ where: { userId, status: 'ACTIVE' } });

  const debtsWithCalculations = debts.map(debt => {
    const ear = calcEAR(debt.apr, debt.feeProcessing, debt.feeInsurance, debt.feeManagement, debt.termMonths);
    const apy = calcAPY(debt.apr);
    return { ...debt, ear, apy };
  });

  const totalBalance = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + d.minPayment, 0);
  const weightedEAR = totalBalance > 0
    ? debts.reduce((sum, d) => sum + (d.balance / totalBalance) * calcEAR(d.apr, d.feeProcessing, d.feeInsurance, d.feeManagement, d.termMonths), 0)
    : 0;

  const dtiRatio = calcDebtToIncomeRatio(totalMinPayment, user.monthlyIncome);
  const dominoAlerts = detectDominoRisk(debts, user.monthlyIncome);

  // Check debts due this week
  const today = new Date();
  const dueThisWeek = debts.filter(d => {
    const daysUntil = d.dueDay >= today.getDate()
      ? d.dueDay - today.getDate()
      : 30 - today.getDate() + d.dueDay;
    return daysUntil <= 7;
  });

  return {
    debts: debtsWithCalculations,
    summary: {
      totalBalance,
      totalMinPayment,
      averageEAR: weightedEAR,
      debtToIncomeRatio: dtiRatio,
      dominoAlerts,
      dueThisWeek: dueThisWeek.map(d => ({
        id: d.id, name: d.name, dueDay: d.dueDay, minPayment: d.minPayment
      })),
    }
  };
}
```

### Market Data Service
```javascript
// server/src/services/market.service.js
async function fetchFearGreedIndex(redis) {
  const cacheKey = 'market:fear_greed';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await fetch('https://api.alternative.me/fng/?limit=2');
  const data = await response.json();

  const current = data.data[0];
  const previous = data.data[1];
  const trend = parseInt(current.value) > parseInt(previous.value) ? 'UP' : 'DOWN';

  const result = {
    value: parseInt(current.value),
    label: current.value_classification,
    labelVi: getSentimentVietnamese(getSentimentLabel(parseInt(current.value))),
    previousValue: parseInt(previous.value),
    trend,
    updatedAt: new Date().toISOString(),
  };

  await redis.setEx(cacheKey, 1800, JSON.stringify(result)); // 30 min TTL
  return result;
}

async function fetchCryptoPrices(redis) {
  const cacheKey = 'market:prices:crypto';
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
  );
  const data = await response.json();

  const result = {
    bitcoin: {
      price: data.bitcoin.usd,
      change24h: data.bitcoin.usd_24h_change,
    },
    ethereum: {
      price: data.ethereum.usd,
      change24h: data.ethereum.usd_24h_change,
    },
  };

  await redis.setEx(cacheKey, 600, JSON.stringify(result)); // 10 min TTL
  return result;
}
```

---

## ENVIRONMENT VARIABLES

```env
# server/.env

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/finsight_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# External APIs
ALPHA_VANTAGE_API_KEY="your_key_here"
NEWS_API_KEY="your_key_here"

# Optional: OpenAI for chatbot feature (Phase 2)
OPENAI_API_KEY="your_key_here"
```

```env
# client/.env

VITE_API_URL=http://localhost:5000/api
```

---

## DOCKER COMPOSE (for local dev)

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: finsight_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## SEED DATA (for testing)

```javascript
// server/prisma/seed.js
// Create 1 demo user with realistic Vietnamese finance scenario:

const demoUser = {
  email: "demo@finsight.vn",
  password: bcrypt.hashSync("Demo@123", 12),
  fullName: "Nguyễn Văn A",
  monthlyIncome: 12000000,  // 12 triệu/tháng
  extraBudget: 1500000,     // 1.5 triệu dư để trả thêm nợ
};

const demoDebts = [
  {
    name: "Mua điện thoại Samsung",
    platform: "SPAYLATER",
    originalAmount: 8000000,
    balance: 5200000,
    apr: 18, rateType: "FLAT",
    feeProcessing: 0, feeInsurance: 0, feeManagement: 0, feePenaltyPerDay: 0.05,
    minPayment: 666666, dueDay: 15, termMonths: 12, remainingTerms: 8,
  },
  {
    name: "Thẻ tín dụng Vietcombank",
    platform: "CREDIT_CARD",
    originalAmount: 5000000,
    balance: 4800000,
    apr: 36, rateType: "REDUCING",
    feeProcessing: 0, feeInsurance: 0, feeManagement: 0.5, feePenaltyPerDay: 0.07,
    minPayment: 500000, dueDay: 20, termMonths: 12, remainingTerms: 11,
  },
  {
    name: "Mua đồ gia dụng",
    platform: "LAZPAYLATER",
    originalAmount: 3000000,
    balance: 1800000,
    apr: 18, rateType: "FLAT",
    feeProcessing: 0, feeInsurance: 0, feeManagement: 0, feePenaltyPerDay: 0.05,
    minPayment: 300000, dueDay: 10, termMonths: 10, remainingTerms: 6,
  },
];

const demoInvestorProfile = {
  capital: 15000000,    // 15 triệu vốn
  monthlyAdd: 2000000,  // đầu tư thêm 2tr/tháng
  goal: "FINANCIAL_FREEDOM",
  horizon: "LONG",
  riskLevel: "MEDIUM",
  riskScore: 55,
};
```

---

## UI/UX DESIGN GUIDELINES

### Color Palette (TailwindCSS)
```
Primary: Blue-600 (#2563EB) — main actions, links
Success: Green-500 (#22C55E) — positive values, paid debts
Warning: Yellow-500 (#EAB308) — medium DTI, greed sentiment
Danger:  Red-500 (#EF4444) — high DTI, domino risk, extreme fear/greed
Info:    Blue-400 (#60A5FA) — informational elements

Sentiment Colors:
  Extreme Fear: Red-700 (#B91C1C)
  Fear: Orange-500 (#F97316)
  Neutral: Yellow-500 (#EAB308)
  Greed: Green-500 (#22C55E)
  Extreme Greed: Green-700 (#15803D)
```

### Premium Fintech UI (Crucial for WDA2026)
- **Glassmorphism & Dark Mode**: Highly recommended to use a sleek dark mode with frosted glass effects (`backdrop-blur-md bg-white/10`) to elevate the app to a "Premium Fintech" level.
- **Micro-animations**: Use Framer Motion for element entrance, value counting effects, and especially for chart transitions (e.g. from Snowball to Avalanche, charts should morph smoothly).
- **Hazard Feedback**: For "Domino Risk Alerts", use a subtle pulsating animation instead of static red boxes to create urgency.

### Layout
- Use a left sidebar navigation on desktop, bottom tab bar on mobile
- All pages have max-width: 1280px, centered
- Card-based layout with consistent shadow and rounded corners (rounded-xl)
- Loading states: skeleton screens (not spinners) for all data-heavy sections

---

## FEATURE PRIORITY & IMPLEMENTATION ORDER

### Phase 1 — Core (Must Have, implement first):
1. Auth (register/login/logout)
2. Debt CRUD with EAR calculation
3. Debt Dashboard with DTI and domino alerts
4. Repayment Plan (Avalanche vs Snowball)
5. Fear & Greed API integration
6. Investment allocation recommendation
7. Market prices display (BTC, ETH)

### Phase 2 — Enhanced (implement after Phase 1 works):
1. Risk Assessment Quiz
2. Portfolio projection chart (Two paths comparison)
3. Mock Market Data switch (Crucial for final pitch demo)
4. AI Virtual Advisor Chat (OpenAI/Gemini LLM prompt integration)
5. Payment logging and history
6. Redis caching for all expensive operations
7. News feed integration

### Phase 3 — Nice to Have:
1. Notifications system & Debt snapshots for trend tracking
2. AI Chatbot for natural language debt entry 
3. Email notifications for upcoming payments
4. Export data to PDF/Excel

---

## KNOWN TECHNICAL CHALLENGES TO HANDLE

1. **VN-Index data**: Alpha Vantage free tier may not support Vietnamese stocks reliably. Solution: implement a fallback that shows last known value with "Data may be delayed" indicator.

2. **Gold price**: No free API. Solution: Implement a cron job to scrape SJC XML endpoint every hour. Cache in Redis. Provide manual update as fallback.

3. **CORS**: Configure Express to allow requests from React dev server (localhost:5173) and production domain.

4. **Prisma connection pooling**: In production, configure connection pool properly to avoid "too many connections" errors with PostgreSQL.

5. **React Query stale time**: Configure appropriate stale times: market data (10min), debt data (30sec), user profile (5min).

6. **EAR calculation edge case**: If termMonths is 0 or very small, annualized processing fee calculation blows up. Add input validation: minimum term is 1 month.

7. **Simulation performance**: Snowball/Avalanche runs up to 360 iterations with N debts. With N < 20, this is negligible. Add server-side validation: reject if extraBudget < totalMinPayment (infinite loop prevention).
```
