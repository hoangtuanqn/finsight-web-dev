# FinSight — Project Context for AI Agent

## Project Overview
FinSight là nền tảng quản lý tài chính cá nhân dự thi **WDA2026** (Web Development Adventure 2026).
Hai vấn đề cốt lõi cần giải quyết:
1. **Debt Management** — Gộp nhiều khoản nợ BNPL (SPayLater, LazPayLater, Momo, thẻ tín dụng) vào một dashboard, tính lãi suất thực tế (EAR), đề xuất chiến lược trả nợ tối ưu (Avalanche/Snowball).
2. **AI Investment Advisor** — Phân tích hồ sơ tài chính + dữ liệu thị trường (Fear & Greed Index) + multi-asset prices để đề xuất danh mục đầu tư cá nhân hóa.

---

## Tech Stack

```
Frontend:  React 19 + Vite 8 + TailwindCSS v4 + Recharts + Framer Motion + React Router v7 + React Query v5 + Axios + Lucide React
Backend:   Node.js + Express 5 + Prisma ORM + Redis (ioredis) + JWT (jsonwebtoken) + bcryptjs
Database:  PostgreSQL 15
Cache:     Redis 7
OS/Shell:  Windows + PowerShell
Container: Docker Compose (PostgreSQL + Redis)
```

---

## Project Structure

```
finance-webdev-adventure/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── api/                # Axios API calls (auth, debt, investment, market, user)
│       ├── components/         # Reusable components (common/, debt/, investment/)
│       ├── pages/              # Pages (DashboardPage, InvestmentPage, ProfilePage, LoginPage, RegisterPage, RiskAssessmentPage, debt/)
│       ├── context/            # AuthContext.jsx (JWT + user state)
│       ├── utils/              # calculations.js, formatters.js, constants.js
│       └── index.css           # Global styles (TailwindCSS v4)
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/        # auth, user, debt, investment, market
│   │   ├── routes/             # auth, user, debt, investment, market routes
│   │   ├── middleware/         # auth (JWT), validate, cache (Redis)
│   │   ├── services/           # cron.service.js, email.service.js, market.service.js
│   │   ├── lib/                # prisma.js, redis.js (singletons)
│   │   ├── utils/              # calculations.js, apiResponse.js
│   │   └── app.js              # Express entry point (port 5001)
│   └── prisma/
│       ├── schema.prisma       # Database schema
│       └── seed.js             # Seed data
└── docker-compose.yml          # PostgreSQL + Redis containers
```

---

## API Base URL
- Backend: `http://localhost:5001`
- Frontend: `http://localhost:5173`
- Health Check: `GET /api/health`

## API Routes
- `POST /api/auth/register` — Đăng ký
- `POST /api/auth/login` — Đăng nhập
- `GET /api/users/profile` — Hồ sơ người dùng
- `GET /api/debts` — Danh sách nợ + summary (totals, DTI, domino alerts)
- `POST /api/debts` — Thêm khoản nợ mới
- `GET /api/debts/repayment-plan?method=AVALANCHE|SNOWBALL` — Kế hoạch trả nợ
- `GET /api/debts/ear-analysis` — Phân tích lãi suất thực
- `GET /api/investment/allocation` — Phân bổ danh mục đầu tư
- `GET /api/market/summary` — Tổng hợp sentiment + prices + news

---

## Database Models (Prisma)
- `User` — id, email, password, fullName, monthlyIncome, extraBudget
- `Debt` — id, userId, name, platform, balance, apr, rateType, feeProcessing, feeInsurance, feeManagement, minPayment, dueDay, termMonths, remainingTerms, status
- `Payment` — id, debtId, amount, paidAt
- `InvestorProfile` — id, userId, capital, monthlyAdd, goal, horizon, riskLevel, riskScore
- `Allocation` — id, profileId, sentimentValue, savings, gold, stocks, bonds, crypto, recommendation
- `Notification` — id, userId, type, title, message, severity (INFO|WARNING|DANGER), isRead
- `DebtSnapshot` — id, userId, totalDebt, totalEAR, debtToIncomeRatio

---

## Key Business Logic (Financial Calculations)

### EAR (Effective Annual Rate)
```js
// EAR = APY + annualized fees
// APY = (1 + APR/12)^12 - 1
// Bao gồm: feeProcessing (amortized over termMonths), feeInsurance, feeManagement
function calcEAR(apr, feeProcessing, feeInsurance, feeManagement, termMonths)
```

### Repayment Strategies
```js
// AVALANCHE: ưu tiên khoản nợ EAR cao nhất → tiết kiệm lãi tối đa
// SNOWBALL: ưu tiên khoản nợ nhỏ nhất → tạo động lực tâm lý
function simulateRepayment(debts, extraBudget, method = 'AVALANCHE')
```

### Domino Risk Detection
```js
// Cảnh báo khi: ≥2 khoản nợ đáo hạn trong 7 ngày tới
// Cảnh báo DANGER khi: DTI > 50%, WARNING khi: DTI > 35%
function detectDominoRisk(debts, monthlyIncome)
```

### Investment Allocation Rules
```js
// Kết hợp: riskLevel (LOW | MEDIUM | HIGH) × sentimentLabel (EXTREME_FEAR | FEAR | NEUTRAL | GREED | EXTREME_GREED)
// Output: % phân bổ cho savings, gold, stocks, bonds, crypto
const ALLOCATION_RULES = { LOW: {...}, MEDIUM: {...}, HIGH: {...} }
```

---

## External APIs
- **Fear & Greed Index**: `https://api.alternative.me/fng/?limit=2` (free, no key)
- **CoinGecko BTC/ETH**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true` (free)
- **Alpha Vantage** (VN-Index): `https://www.alphavantage.co/query` (free, 25 req/day, cần API key)
- **NewsAPI**: `https://newsapi.org/v2/everything` (free, 100 req/day, cần API key)
- **SJC Gold**: `https://sjc.com.vn/xml/tygiavang.xml` (scrape, no key)

---

## Redis Caching Strategy
```
GLOBAL (shared):
  market:fear_greed       TTL 30 min
  market:prices           TTL 10 min
  market:news             TTL 30 min
  market:summary          TTL 10 min

PER-USER:
  user:{userId}:debt_summary    TTL 5 min
  user:{userId}:repayment_plan  TTL 5 min
  user:{userId}:ear_analysis    TTL 10 min
  user:{userId}:allocation      TTL 15 min

INVALIDATION:
  Add/Edit/Delete debt → xóa user:{userId}:debt_summary, repayment_plan, ear_analysis
  Update investor profile → xóa user:{userId}:allocation
```

---

## Debt Platform Presets
| Platform | APR | rateType | Notes |
|----------|-----|----------|-------|
| SPayLater | 18% | FLAT | Shopee Pay Later |
| LazPayLater | 18% | FLAT | Lazada Pay Later |
| Credit Card | 36% | REDUCING | Visa/Mastercard |
| MoMo Vay | 20% | FLAT | MoMo loan |
| Home Credit | 35% | FLAT | Consumer loan |

---

## Coding Conventions

### Backend (Node.js + Express)
- ESM modules (`import`/`export`), không dùng `require`
- Standard API response format: `{ success: true, data: {...} }` hoặc `{ success: false, error: "..." }`
- JWT được gửi qua header: `Authorization: Bearer <token>`
- Mọi protected route đều dùng `authMiddleware`
- Prisma client singleton: import từ `./lib/prisma.js`
- Redis client singleton: import từ `./lib/redis.js`

### Frontend (React + Vite)
- Component files: PascalCase (`.jsx`)
- Hook files: camelCase bắt đầu bằng `use` (`.js`)
- API calls tập trung trong `src/api/` tương ứng với từng domain
- Auth state quản lý qua `AuthContext` (JWT stored in localStorage)
- TailwindCSS v4 — CSS-first config (không có `tailwind.config.js`)

---

## Dev Commands
```powershell
# Start Docker (PostgreSQL + Redis)
docker-compose up -d

# Backend
cd server
npm run dev        # nodemon, port 5001
npm run db:push    # apply schema changes
npm run seed       # seed dữ liệu mẫu

# Frontend
cd client
npm run dev        # Vite dev server, port 5173
```

---

## WDA2026 Context
- **Competition**: Web Development Adventure 2026
- **Round**: Vòng 2 (đang thực hiện)
- **Deliverables**: Full-stack web app + live demo
- **Priority**: Demo-ready, UI/UX premium, all core features working
- **Key features for demo**: Dashboard, Debt Management, Repayment Simulator, Investment Advisor, Market Sentiment
