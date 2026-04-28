# AI Project Context

Canonical location: `./AI_PROJECT_CONTEXT.md`  
Last audited from code: `2026-04-26`  
Repository: `finsight-web-dev`

## 1. Mục đích và nguyên tắc

Tệp này là **Single Source of Truth** cho các AI Assistant làm việc với repository này.

Thứ tự ưu tiên nguồn:

1. Source code runtime hiện tại: `server/src/**`, `client/src/**`, `server/prisma/schema.prisma`
2. `package.json`, route definitions, controllers, Prisma schema, cron jobs
3. Tài liệu cũ trong `README.md`, `QUICK_REFERENCE.md`, `STOCKS_API_AUDIT.md`, `Docs/**`

Nếu code và docs mâu thuẫn, **tin code** và ghi mâu thuẫn đó vào mục `Caveats & Technical Debt`.

## 2. Tóm tắt điều hành

FinSight là ứng dụng full-stack quản lý tài chính cá nhân, tập trung vào 4 mảng chính:

- Quản lý nợ cá nhân: theo dõi khoản vay, APR/EAR, DTI, trả nợ theo Avalanche/Snowball, goal payoff.
- Gợi ý đầu tư: investor profile, market sentiment, phân bổ tài sản giữa tiết kiệm/vàng/cổ phiếu/trái phiếu/crypto.
- AI advisor: chatbot agentic dùng LangGraph/LangChain, hỗ trợ chat streaming, RAG và OCR browser-side.
- Subscription/reporting: nâng cấp gói qua SePay QR, notification realtime qua Socket.IO, export PDF/Excel.

Kiến trúc repo là **2 package Node tách biệt**:

- `client/`: React + Vite
- `server/`: Express + Prisma + PostgreSQL + Redis + LangGraph

`Docs/` đang bị ignore bởi `.gitignore`, vì vậy bản canonical được đặt ở root repo.

## 3. Bố cục repository và entry points

```text
finance-webdev-adventure/
  AI_PROJECT_CONTEXT.md
  client/
    package.json
    vite.config.js
    src/
      App.jsx
      api/
      components/
      context/
      hooks/
      pages/
      utils/
  server/
    package.json
    Dockerfile
    prisma/
      schema.prisma
      migrations/
      seed.js
    data/knowledge/
    src/
      app.js
      agentic/
      controllers/
      cron/
      lib/
      middleware/
      routes/
      services/
      utils/
  Docs/
  docker-compose.yml
  README.md
  QUICK_REFERENCE.md
```

Runtime entry points:

- Backend: `server/src/app.js`
- Frontend: `client/src/App.jsx`

Operational notes:

- Backend mount các route dưới `/api/*` và có `GET /api/health`.
- Backend override `console.error` để append log vào `server/server_error.log`.
- CORS cho phép `localhost`, `127.0.0.1` mọi port, cộng thêm `CLIENT_URL`.
- Socket.IO được khởi tạo cùng HTTP server.
- Cron jobs được start ngay khi app boot.

## 4. Tech Stack

### 4.1 Frontend runtime (`client/package.json`)

| Package | Version | Vai trò |
| --- | --- | --- |
| `react` | `^19.2.4` | UI runtime |
| `react-dom` | `^19.2.4` | DOM renderer |
| `react-router-dom` | `^7.13.1` | Routing |
| `@tanstack/react-query` | `^5.91.3` | Server state/query cache |
| `axios` | `^1.13.6` | REST client |
| `socket.io-client` | `^4.8.3` | Realtime subscription events |
| `framer-motion` | `^12.38.0` | Animation |
| `lucide-react` | `^1.8.0` | Icons |
| `recharts` | `^3.8.0` | Charts |
| `sonner` | `^2.0.7` | Toast notifications |
| `driver.js` | `^1.4.0` | Product tour/onboarding |
| `tesseract.js` | `^7.0.0` | OCR trong browser |
| `react-markdown` | `^10.1.0` | Render markdown chat content |
| `remark-gfm` | `^4.0.1` | GitHub Flavored Markdown |
| `@react-oauth/google` | `^0.13.5` | Google OAuth client |
| `react-is` | `^19.2.5` | React utility |

### 4.2 Frontend tooling (`client/package.json`)

| Package | Version | Vai trò |
| --- | --- | --- |
| `vite` | `^8.0.1` | Build/dev server |
| `@vitejs/plugin-react` | `^6.0.1` | React plugin cho Vite |
| `tailwindcss` | `^4.2.4` | CSS utility framework |
| `@tailwindcss/vite` | `^4.2.4` | Tailwind Vite integration |
| `eslint` | `^9.39.4` | Linting |
| `@eslint/js` | `^9.39.4` | ESLint config base |
| `eslint-plugin-react-hooks` | `^7.0.1` | React hooks lint rules |
| `eslint-plugin-react-refresh` | `^0.5.2` | Fast Refresh lint rules |
| `globals` | `^17.4.0` | Global env declarations |
| `@types/react` | `^19.2.14` | Type metadata |
| `@types/react-dom` | `^19.2.3` | Type metadata |

### 4.3 Backend runtime (`server/package.json`)

| Package | Version | Vai trò |
| --- | --- | --- |
| `express` | `^5.2.1` | HTTP server |
| `@prisma/client` | `^6.19.2` | ORM client |
| `bcryptjs` | `^3.0.3` | Password hashing |
| `jsonwebtoken` | `^9.0.3` | JWT auth |
| `cors` | `^2.8.6` | CORS middleware |
| `dotenv` | `^17.3.1` | Env loading |
| `axios` | `^1.13.6` | External API calls |
| `socket.io` | `^4.8.3` | Realtime server |
| `ioredis` | `^5.10.1` | Cache/rate limit backend |
| `mathjs` | `^15.2.0` | Matrix math for investment covariance and optimizer |
| `node-cron` | `^4.2.1` | Scheduled jobs |
| `nodemailer` | `^8.0.4` | Email notifications |
| `exceljs` | `^4.4.0` | Excel export |
| `pdfkit` | `^0.18.0` | PDF export |
| `uuid` | `^13.0.0` | ID utilities |
| `google-auth-library` | `^10.6.2` | Google token verification |
| `pgvector` | `^0.2.1` | Vector support for PostgreSQL |
| `@langchain/core` | `^1.1.40` | LangChain core abstractions |
| `@langchain/openai` | `^1.4.4` | OpenAI-compatible chat + embeddings |
| `@langchain/google-genai` | `^0.2.1` | Installed, not primary path hiện tại |
| `@langchain/langgraph` | `^1.2.9` | Agent orchestration |

### 4.4 Backend tooling (`server/package.json`)

| Package | Version | Vai trò |
| --- | --- | --- |
| `prisma` | `^6.19.2` | Prisma CLI |
| `nodemon` | `^3.1.14` | Dev reload |

### 4.5 Infrastructure

| Thành phần | Version/Image | Ghi chú |
| --- | --- | --- |
| PostgreSQL + pgvector | `pgvector/pgvector:pg15` | `docker-compose.yml`, host port `5433` |
| Redis | `redis:7-alpine` | host port `6379` |
| Server container | local Dockerfile | intended port `5001` |
| Client container | commented out | chưa dùng trong compose hiện tại |

## 5. Frontend routes

### Public

| Route | Component |
| --- | --- |
| `/` | `LandingPage` |
| `/login` | `LoginPage` qua `PublicRoute` |
| `/register` | `RegisterPage` qua `PublicRoute` |

### Protected (bọc bởi `Layout`)

| Route | Component |
| --- | --- |
| `/home` | `DashboardPage` |
| `/debts` | `DebtOverviewPage` |
| `/debts/add` | `AddDebtPage` |
| `/debts/ear-analysis` | `EarAnalysisPage` |
| `/debts/goal` | `DebtGoalPage` |
| `/debts/repayment` | `RepaymentPlanPage` |
| `/debts/dti` | `DtiAnalysisPage` |
| `/debts/:id` | `DebtDetailPage` |
| `/debts/:id/edit` | `EditDebtPage` |
| `/investment` | `InvestmentPage` |
| `/risk-assessment` | `RiskAssessmentPage` |
| `/profile` | `ProfilePage` |
| `/upgrade` | `UpgradePage` |
| `/invoice/:id` | `InvoicePage` |
| `/transactions` | `TransactionHistoryPage` |

Unknown routes redirect về `/home`.

## 6. Kiến trúc dữ liệu (Prisma Data Model)

Nguồn chuẩn: `server/prisma/schema.prisma`

### 6.1 Quan hệ chính

- `User` 1-n `Debt`
- `Debt` 1-n `Payment`
- `User` 1-1 optional `InvestorProfile`
- `InvestorProfile` 1-n `Allocation`
- `User` 1-n `Notification`
- `User` 1-n `DebtSnapshot`
- `User` 1-1 optional `DebtGoal`
- `User` 1-n `Transaction`
- `User` 1-n `ChatSession`
- `ChatSession` 1-n `ChatMessage`
- `FinanceKnowledge` độc lập, chứa vector embedding cho RAG

### 6.2 Model summary

| Model | Trường trọng yếu | Quan hệ | Ghi chú |
| --- | --- | --- | --- |
| `User` | `email`, `password?`, `googleId?`, `facebookId?`, `avatar?`, `fullName`, `monthlyIncome`, `extraBudget`, `level`, `levelExpiresAt` | hasMany debts/notifications/snapshots/chatSessions/transactions; hasOne investorProfile/debtGoal | `level` mặc định `BASIC` |
| `Debt` | `name`, `platform`, `originalAmount`, `balance`, `apr`, `rateType`, `feeProcessing`, `feeInsurance`, `feeManagement`, `feePenaltyPerDay`, `minPayment`, `dueDay`, `termMonths`, `remainingTerms`, `startDate?`, `status` | belongsTo user; hasMany payments | `startDate` optional trong schema nhưng create API đang bắt buộc |
| `Payment` | `amount`, `paidAt`, `notes` | belongsTo debt | dùng cho lịch sử thanh toán |
| `InvestorProfile` | `capital`, `monthlyAdd`, `goal`, `horizon`, `riskLevel`, `riskScore`, `savingsRate`, `inflationRate`, `lastUpdated` | belongsTo user; hasMany allocations | chỉ 1 profile/user |
| `Allocation` | `sentimentValue`, `sentimentLabel`, `savings`, `gold`, `stocks`, `bonds`, `crypto`, `recommendation` | belongsTo investorProfile | mỗi lần lấy allocation sẽ ghi lịch sử |
| `Notification` | `type`, `title`, `message`, `isRead`, `severity`, `createdAt` | belongsTo user | dùng cho debt alerts và subscription events |
| `DebtSnapshot` | `totalDebt`, `totalEAR`, `debtToIncome`, `createdAt` | belongsTo user | tạo hằng ngày bởi cron |
| `DebtGoal` | `targetDate`, `strategy` | belongsTo user | strategy mặc định `AVALANCHE` |
| `Transaction` | `plan`, `amount`, `status`, `transferCode`, `sepayRef`, `qrUrl`, `expiresAt`, `paidAt` | belongsTo user | payment/subscription invoice |
| `ChatSession` | `title`, `metadata`, timestamps | belongsTo user; hasMany messages | title auto sinh từ câu đầu |
| `ChatMessage` | `role`, `content`, `toolCalls?`, `toolResult?`, `actionType?`, `payload?` | belongsTo chatSession | `actionType` dùng để bật modal thêm nợ |
| `FinanceKnowledge` | `title`, `content`, `chunk`, `category`, `embedding`, `metadata` | none | `embedding` là `vector(1024)` |

### 6.3 Migration drift

Migrations hiện tại **không phủ hết schema hiện tại**.

Đã có migration:

- `20260326082144_init`
- `20260419132751_add_chat_and_rag`

Nhưng schema hiện tại có thêm những phần chưa thấy trong migrations:

- `User.googleId`, `facebookId`, `avatar`, `level`, `levelExpiresAt`
- `Debt.startDate`
- `InvestorProfile.savingsRate`, `inflationRate`
- `DebtGoal`
- `Transaction`

Hệ quả: môi trường dev hiện có dấu hiệu dựa vào `prisma db push` hơn là migration chain đầy đủ.

## 7. API client & server contract

### 7.1 Base contract

Frontend client wrapper: `client/src/api/index.js`

- Base URL: `import.meta.env.VITE_API_URL || '/api'`
- Auth header: `Authorization: Bearer <finsight_token>`

JSON envelope chuẩn:

```json
{ "success": true, "data": { } }
{ "success": false, "error": "message" }
```

Ngoại lệ:

- `POST /api/agentic/chat`: SSE stream qua `text/event-stream`
- `GET /api/reports/export`: trả về binary `blob` (`excel` hoặc `pdf`)

### 7.2 Auth

| Route | Method | Auth | Input chính | `data` khi success | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `/api/auth/register` | `POST` | No | `{ email, password, fullName }` | `{ user, token }` | tạo user local |
| `/api/auth/login` | `POST` | No | `{ email, password }` | `{ user, token }` | login local |
| `/api/auth/google` | `POST` | No | `{ credential }` | `{ user, token }` | verify Google ID token |
| `/api/auth/google-config` | `GET` | No | none | `{ clientId }` | trả Google client ID |
| `/api/auth/facebook` | `POST` | No | `{ accessToken }` | `{ user, token }` | verify qua Facebook Graph API |
| `/api/auth/facebook-config` | `GET` | No | none | `{ appId }` | trả Facebook app ID |
| `/api/auth/me` | `GET` | Yes | none | `{ user }` | hiện tại trả full Prisma user record |
| `/api/auth/logout` | `POST` | Yes | none | `{ message }` | backend stateless |

### 7.3 User

| Route | Method | Auth | Input chính | `data` khi success | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `/api/users/profile` | `GET` | Yes | none | `{ user }` | include `investorProfile` |
| `/api/users/profile` | `PUT` | Yes | basic profile + investor fields | `{ user }` | update `User` và upsert `InvestorProfile` |
| `/api/users/notifications` | `GET` | Yes | none | `{ notifications }` | tối đa 50 items |
| `/api/users/notifications/:id/read` | `PUT` | Yes | none | `{ notification }` | thiếu ownership check |
| `/api/users/notifications/read-all` | `DELETE` | Yes | none | `{ message }` | mark all read |

### 7.4 Debts + Debt Goal

| Route | Method | Auth | Input chính | `data` khi success | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `/api/debts` | `GET` | Yes | none | `{ debts, summary }` | chỉ lấy `ACTIVE` debts |
| `/api/debts` | `POST` | Yes | debt form | `{ debt }` | bắt buộc `startDate` dù schema optional |
| `/api/debts/:id` | `GET` | Yes | path `id` | `{ debt, earBreakdown, paymentHistory }` | kèm payments desc |
| `/api/debts/:id` | `PUT` | Yes | raw `req.body` | `{ debt }` | validation còn lỏng |
| `/api/debts/:id` | `DELETE` | Yes | path `id` | `{ message }` | luôn trả success dù không xóa gì |
| `/api/debts/:id/payments` | `POST` | Yes | `{ amount, notes }` | `{ payment, updatedDebt }` | cập nhật balance/status |
| `/api/debts/repayment-plan` | `GET` | Yes | query `extraBudget?` | `{ avalanche, snowball, comparison, recommendation }` | truncate schedule còn 24 tháng |
| `/api/debts/ear-analysis` | `GET` | Yes | none | `{ debts, summary }` | summary gồm `averageAPR`, `averageEAR`, `totalHiddenCost` |
| `/api/debts/dti` | `GET` | Yes | none | `{ summary, breakdown, whatIf }` | zone: `SAFE/CAUTION/WARNING/CRITICAL` |
| `/api/debts/goal` | `GET` | Yes | none | `{ goal, progress, milestones, onTrack }` | progress luôn trả về kể cả chưa có goal |
| `/api/debts/goal` | `POST` | Yes | `{ targetDate, strategy? }` | `{ goal }` | upsert |
| `/api/debts/goal` | `DELETE` | Yes | none | `{ message }` | delete goal |

`GET /api/debts` trả `summary` có cấu trúc thực tế:

```json
{
  "totalBalance": 0,
  "totalMinPayment": 0,
  "averageEAR": 0,
  "debtToIncomeRatio": 0,
  "dominoAlerts": [],
  "dueThisWeek": [
    { "id": "debtId", "name": "Debt", "dueDay": 15, "minPayment": 1000000, "daysUntil": 4 }
  ]
}
```

Lưu ý: `dueThisWeek` là tên gây hiểu nhầm; code thực tế đang lấy **<= 30 ngày**, không phải 7 ngày.

### 7.5 Investment + Market

| Route | Method | Auth | Input chính | `data` khi success | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `/api/investment/profile` | `GET` | Yes | none | `{ investorProfile }` | có thể là `null` |
| `/api/investment/profile` | `POST` | Yes | profile fields | `{ investorProfile }` | upsert |
| `/api/investment/profile` | `PUT` | Yes | profile fields | `{ investorProfile }` | update trực tiếp |
| `/api/investment/allocation` | `GET` | Yes | query `mockSentiment?` | `{ allocation, sentimentData, recommendation, portfolioBreakdown, projection, riskMetrics, optimizationMethod, optimization, allocationMetrics, cryptoWarning }` | ghi lịch sử `Allocation`; allocation runtime dùng Markowitz MVO |
| `/api/investment/history` | `GET` | Yes | none | `{ allocations }` | 20 records gần nhất |
| `/api/investment/risk-assessment` | `POST` | Yes | `{ answers: [{ score }] }` | `{ riskScore, riskLevel, riskDescription }` | `>60 HIGH`, `>30 MEDIUM`, còn lại `LOW` |
| `/api/investment/crypto-prices` | `GET` | Yes | query `riskLevel?` | `{ coins, intro, riskLevel, cached, stale? }` | top 5 + stablecoin suggestion |
| `/api/investment/stock-prices` | `GET` | Yes | query `riskLevel?` | `{ stocks, intro, riskLevel, cached, stale? }` | Yahoo Finance + scoring |
| `/api/investment/gold-prices` | `GET` | Yes | none | `{ goldItems, intro, worldPrice, worldChange, cached }` | fallback cache có shape khác |
| `/api/investment/savings-rates` | `GET` | Yes | query `riskLevel?` | `{ savingsItems, intro, updatedAt, riskLevel }` | curated VN savings dataset |
| `/api/investment/bonds-rates` | `GET` | Yes | query `riskLevel?` | `{ bondItems, intro, updatedAt, riskLevel }` | TPCP Việt Nam từ VBMA + quỹ trái phiếu |
| `/api/market/sentiment` | `GET` | Yes | none | `{ fearGreed }` | Alternative.me + Redis |
| `/api/market/prices` | `GET` | Yes | none | `{ bitcoin, ethereum, gold }` | CoinGecko + BTMC |
| `/api/market/news` | `GET` | Yes | none | `{ articles }` | NewsAPI hoặc placeholder |
| `/api/market/summary` | `GET` | Yes | none | `{ sentiment, prices, news }` | dashboard snapshot |

Investment payload notes:

- `projection.base/optimistic/pessimistic` vẫn giữ shape cũ, nhưng hiện được build từ Monte Carlo percentiles: median / p95 / p5.
- `projection.monteCarlo` chứa `{ p5, p25, median, p75, p95, mean, probLoss }` cho `1y`, `3y`, `5y`, `10y`; raw simulation arrays không trả ra response.
- `riskMetrics` hiện gồm Sharpe, VaR 95%, CVaR 95%, max drawdown, probLoss theo horizon và `riskGrade`.
- `getGoldPrices()` fallback khi API lỗi nhưng cache cũ tồn tại sẽ trả `...goldCache.data`, tức shape có thể chỉ còn `{ worldPrice, worldChange, sjc, nhan, cached, stale }`, **không chắc có `goldItems` hoặc `intro`**.
- `getStockPrices()` và `getCryptoPrices()` fallback cache giữ được shape gần giống, có thêm `stale: true`.
- `getSavingsRates()` và `getBondsRates()` dùng curated dataset hardcoded với `updatedAt: '2026-04-23'`.

### 7.6 Agentic AI, Reports, Subscription

| Route | Method | Auth | Input chính | `data` khi success | Ghi chú |
| --- | --- | --- | --- | --- | --- |
| `/api/agentic/chat` | `POST` | Yes | `{ message, sessionId?, ocrText? }` | SSE events | rate limit 20 req/min/user nếu Redis có |
| `/api/agentic/sessions` | `GET` | Yes | none | `{ sessions }` | list session meta + `_count.messages` |
| `/api/agentic/sessions/:id` | `GET` | Yes | path `id` | `{ session }` | session + ordered messages |
| `/api/agentic/sessions/:id` | `DELETE` | Yes | path `id` | `{ message }` | cascade delete messages |
| `/api/reports/export` | `GET` | Yes | query `format=excel|pdf` | binary stream | không dùng JSON envelope |
| `/api/subscription/me` | `GET` | Yes | none | `{ level, levelExpiresAt }` | plan hiện tại |
| `/api/subscription/invoice` | `POST` | Yes | `{ plan }` | `{ transaction }` | `PRO` hoặc `PROMAX` |
| `/api/subscription/verify` | `POST` | Yes | none | `{ message }` | trigger `checkSepayPayments()` |
| `/api/subscription/invoice/:id` | `GET` | Yes | path `id` | `{ transaction }` | có ownership check |
| `/api/subscription/transactions` | `GET` | Yes | none | `{ transactions }` | 50 bản ghi gần nhất |
| `/api/subscription/invoice/:id/cancel` | `POST` | Yes | path `id` | `{ transaction }` | chỉ hủy `PENDING` |

### 7.7 SSE contract cho `/api/agentic/chat`

Client dùng `fetch()` + `ReadableStream`, parse các block `data: {...}\n\n`.

Ví dụ luồng SSE:

```text
data: {"status":"Đang suy nghĩ..."}

data: {"token":"Xin "}

data: {"token":"chào"}

data: {"done":true,"sessionId":"cs_xxx","actionType":"form_population","triggerPayload":{"action":"FORM_POPULATION_REQUIRED"}}
```

Event shape:

- streaming token: `{ token: string }`
- tool/status update: `{ status: string | null }`
- final event: `{ done: true, sessionId, actionType, triggerPayload }`
- error during stream: `{ done: true, error: string }`

## 8. Logic nghiệp vụ cốt lõi

Nguồn chuẩn: `server/src/utils/calculations.js`  
Client mirror: `client/src/utils/calculations.js`

### 8.1 Financial formulas

```text
APY = (1 + (APR / 100) / 12)^12 - 1

EAR = APY + totalAnnualFees
totalAnnualFees = min((feeProcessing / termMonths) * 12 + feeInsurance + feeManagement, 300)

Reducing-balance monthly payment
= P * r * (1 + r)^n / ((1 + r)^n - 1)

Flat monthly payment
= (Principal + Principal * APR * termMonths / 12 / 100) / termMonths

DTI = totalMonthlyDebtPayments / monthlyIncome * 100
```

### 8.2 Debt thresholds và repayment logic

| Logic | Ngưỡng / hành vi hiện tại |
| --- | --- |
| DTI zone | `>50 CRITICAL`, `>35 WARNING`, `>20 CAUTION`, còn lại `SAFE` |
| Domino risk | có ít nhất 2 khoản nợ đến hạn trong 7 ngày, hoặc `DTI > 50`, hoặc `DTI > 35` |
| Repayment methods | `AVALANCHE` = ưu tiên APR cao nhất; `SNOWBALL` = ưu tiên balance nhỏ nhất |
| Simulation cap | tối đa `360` tháng |
| Goal status | `AHEAD` nếu sớm hơn >30 ngày; `ON_TRACK` nếu chậm tối đa 5 ngày; còn lại `BEHIND` |
| Required extra budget | binary search, round up đến `10,000` VND |
| Milestone payoff | tạo notification/email tại `25%`, `50%`, `75%`, `100%` |

Repayment simulation thực tế:

1. Cộng lãi theo tháng vào từng khoản nợ đang active.
2. Trừ minimum payment của từng khoản.
3. Dùng budget còn lại cho target debt theo `AVALANCHE` hoặc `SNOWBALL`.

### 8.3 Investment advisor engine

Runtime hiện hành đã thay heuristic `getAllocation()` bằng backend services mới:

| File | Vai trò |
| --- | --- |
| `server/src/constants/assetTickers.js` | Asset order, Yahoo tickers, fallback params |
| `server/src/services/historicalData.service.js` | 5y monthly data, log returns, covariance/correlation, Redis cache |
| `server/src/constants/optimizationConfig.js` | Markowitz risk aversion, bounds, sentiment adjustments, solver config |
| `server/src/services/portfolioOptimizer.service.js` | Mean-Variance Optimization và wrapper `getOptimalAllocation()` |
| `server/src/services/monteCarloSimulation.service.js` | 5000-simulation projection engine |
| `server/src/services/riskMetrics.service.js` | Sharpe, VaR, CVaR, max drawdown, risk grade |

`getAllocation()` heuristic cũ đã được gỡ khỏi `server/src/utils/calculations.js` và `client/src/utils/calculations.js` trong cleanup trước merge vì runtime không còn import. Các fallback còn dùng cho strategy history cũ vẫn giữ ở UI adapter/page.

Flow allocation:

1. Load `InvestorProfile`.
2. Fetch Alternative.me Fear & Greed Index, fallback neutral nếu lỗi.
3. `getMarketParams()` lấy/calc `{ means, stdDevs, covMatrix, corrMatrix, dataQuality }`.
4. `adjustReturnsForSentiment()` chỉnh expected returns, không chỉnh weights trực tiếp.
5. `optimizePortfolio()` tối đa hóa `w^T μ - (λ/2) w^T Σw` trong bounds theo risk level.
6. Save `Allocation` history với percentages.
7. `generateProjectionTable()` chạy Monte Carlo cho `1y`, `3y`, `5y`, `10y`.
8. `buildRiskMetrics()` tạo Sharpe/VaR/CVaR/drawdown/riskGrade.

Key config hiện hành:

```js
RISK_AVERSION = { LOW: 8, MEDIUM: 4, HIGH: 1.5 }
SOLVER_CONFIG = { maxIterations: 1000, learningRate: 0.05, tolerance: 1e-6 }
```

### 8.4 Risk assessment

`POST /api/investment/risk-assessment`:

- average score `> 60` -> `HIGH`
- average score `> 30` -> `MEDIUM`
- còn lại -> `LOW`

### 8.5 Subscription logic

Hardcoded plan pricing:

| Plan | Price |
| --- | --- |
| `PRO` | `49,000 VND` |
| `PROMAX` | `99,000 VND` |

Other rules:

- Không cho tạo invoice nếu downgrade hoặc cùng cấp (`LEVEL_RANKS`).
- Reuse invoice `PENDING` chưa hết hạn cho cùng `plan`.
- `INVOICE_EXPIRY_HOURS = 24`
- Transfer code format: `UPGRADE <PLAN> <userId> <suffix>`
- Payment verified thành công sẽ nâng level trong `30` ngày.

### 8.6 Reporting logic

Report export (`Excel`/`PDF`) dùng `report.service.js` và lấy:

- user summary
- active debts
- DTI
- domino alerts
- EAR per debt
- repayment simulation theo `AVALANCHE` với budget giả định `monthlyIncome * 0.1`

Lưu ý: report simulation **không dùng** `user.extraBudget`.

## 9. Hệ thống AI Agent & RAG

### 9.1 End-to-end flow

1. User nhập text hoặc upload ảnh ở client.
2. `AIChatbotModal` OCR ảnh trong browser bằng `tesseract.js` (`vie+eng`), giới hạn `10MB`, resize max width `1200`.
3. Client gửi `POST /api/agentic/chat` với `{ message, sessionId?, ocrText? }`.
4. `agentic.controller.js` validate message và inject OCR text vào prompt nếu có.
5. `runAgenticChat()` áp guard:
   - max `2000` chars
   - off-topic keyword guard
6. Router phân intent:
   - keyword first
   - LLM fallback nếu keyword miss
7. Nếu intent là `KNOWLEDGE`, check semantic cache in-memory.
8. Tạo hoặc lấy `ChatSession`.
9. Lấy **6 tin nhắn gần nhất** của session trước khi lưu query mới.
10. Lưu user message vào DB.
11. Tạo LangGraph ReAct agent với `ALL_TOOLS`.
12. Stream token/tool status về client qua SSE.
13. Nếu tool `parse_debt_from_text` trả `FORM_POPULATION_REQUIRED`, backend set:
    - `actionType = "form_population"`
    - `triggerPayload = parsed tool output`
14. Nếu intent là `INVESTMENT_ADVICE`, append disclaimer text.
15. Lưu assistant message vào DB.
16. Cache response chỉ khi intent là `KNOWLEDGE`.

### 9.2 Intent routing

Supported intents:

- `DATA_ENTRY`
- `PERSONAL_QUERY`
- `WHAT_IF`
- `INVESTMENT_ADVICE`
- `KNOWLEDGE`
- `OFF_TOPIC`

Fast keyword routes hiện tại bao phủ các nhóm:

- khái niệm tài chính (`dti là gì`, `ear là gì`, `apr là gì`, `snowball`, `avalanche`)
- khai báo nợ mới
- what-if simulation
- đầu tư/thị trường
- truy vấn dữ liệu cá nhân

Fallback: LLM classifier với `temperature: 0.1`.

### 9.3 Guard rails và giới hạn

| Guard/limit | Giá trị |
| --- | --- |
| Message max length | `2000` ký tự |
| Agent timeout | `30,000 ms` |
| Max tool iterations | `5` |
| Agent rate limit | `20 req/min/user` nếu Redis available |
| Off-topic policy | keyword-based denylist |

Redis không có thì:

- rate limit bỏ qua
- cache HTTP bỏ qua
- app vẫn chạy

### 9.4 Tool registry hiện tại

Nguồn chuẩn: `server/src/agentic/tools/index.js`

| Tool name | Mục đích | Ghi chú |
| --- | --- | --- |
| `get_user_debts` | lấy active debts của user | personal data |
| `parse_debt_from_text` | parse debt fields từ text/OCR | không ghi DB trực tiếp |
| `get_user_profile` | lấy income, extraBudget, investor profile | personal data |
| `simulate_dti` | what-if DTI simulation | planning |
| `get_market_prices` | giá BTC/ETH/vàng | dùng `market.service.js` thực |
| `get_market_sentiment` | Fear & Greed | dùng Alternative.me thực |
| `knowledge_search` | vector search nội bộ | RAG |

### 9.5 LLM/Embedding provider

Nguồn chuẩn: `server/src/agentic/llm-provider.js`

| Thành phần | Giá trị mặc định |
| --- | --- |
| `LLM_PROVIDER` | `fptcloud` |
| Chat model | `SaoLa4-medium` |
| Base URL | `https://mkp-api.fptcloud.com` |
| Embedding model | `Vietnamese_Embedding` |
| Embedding dimension | `1024` |

Code path hiện tại dùng `@langchain/openai` với OpenAI-compatible interface cho cả FPT Cloud và OpenAI.

### 9.6 Memory và persistence

Chat memory được lưu trong:

- `ChatSession`
- `ChatMessage`

Current behavior:

- `getSessionHistory(sessionId, 6)` lấy 6 messages mới nhất, order desc rồi `reverse()`
- current user query **không bị duplicate** trong prompt context
- session title auto cắt từ message đầu tiên

Semantic cache:

- implementation: `Map()` in-memory
- normalization: lowercase + bỏ punctuation cơ bản
- chỉ cache intent `KNOWLEDGE`
- không shared giữa nhiều process/instance

### 9.7 RAG

Nguồn dữ liệu:

- thư mục `server/data/knowledge/*.md`

Knowledge files hiện có:

- `credit_score.md`
- `debt_consolidation.md`
- `dti_concept.md`
- `ear_vs_apr.md`
- `etf_openfund_stock_bond_comparison.md`
- `fear_of_missing_out.md`
- `flat_rate_vs_reducing_balance.md`
- `investment_basics.md`
- `lifestyle_creep.md`
- `market_sentiment.md`
- `minimum_payment_trap.md`
- `pain_of_paying.md`
- `pre_investment_checklist.md`
- `pre_loan_checklist.md`
- `snowball_avalanche.md`

Retrieval:

- store trong bảng `finance_knowledge`
- vector search qua pgvector cosine distance `<=>`
- topK mặc định `3`
- `knowledge_search` chỉ chấp nhận kết quả có `similarity >= 0.7`

Ingestion:

- command: `cd server && npm run rag:ingest`
- đọc markdown + frontmatter
- chunk theo heading `##`
- hash content vào `metadata.contentHash`
- insert bằng raw SQL

## 10. Realtime, background jobs và external integrations

### 10.1 Socket.IO

Flow hiện tại:

- client connect khi đã có `user`
- client emit `join` với `user.id`
- server join room `user_<userId>`
- event chính hiện tại: `subscription:upgraded`

### 10.2 Cron jobs

Nguồn chuẩn: `server/src/cron/index.js`

| Schedule | Job | Tác dụng |
| --- | --- | --- |
| mỗi `10s` | `checkSepayPayments()` | verify thanh toán SePay |
| mỗi `1m` | `checkDueDebtsAndDominoRisk()` | debt alerts + snapshots |
| mỗi `1m` | `checkMarketSentimentChanges()` | hiện là stub |
| mỗi `1m` | `expirePendingInvoices()` | hết hạn invoice |
| `00:05` hằng ngày | `checkExpiredSubscriptions()` | downgrade plan hết hạn |

### 10.3 External services hiện diện trong code

| Service | Mục đích |
| --- | --- |
| Alternative.me | Fear & Greed Index |
| CoinGecko | BTC/ETH, crypto universe |
| Yahoo Finance | gold futures, US10Y, VN stocks |
| BTMC | domestic gold price |
| NewsAPI | financial news |
| SePay | QR payment verification |
| Google OAuth | login |
| Facebook Graph API | login |
| SMTP/Nodemailer | debt milestone and alert emails |

## 11. Biến môi trường được code sử dụng

### 11.1 Server

```env
DATABASE_URL=
REDIS_URL=
PORT=5001
CLIENT_URL=http://localhost:5173

JWT_SECRET=
JWT_EXPIRES_IN=

LLM_PROVIDER=fptcloud
LLM_MODEL=SaoLa4-medium
LLM_BASE_URL=https://mkp-api.fptcloud.com
LLM_API_KEY=
OPENAI_API_KEY=
EMBEDDING_PROVIDER=fptcloud
EMBEDDING_MODEL=Vietnamese_Embedding

NEWS_API_KEY=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=

GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=

SEPAY_API_TOKEN=
SEPAY_BANK_ACCOUNT=
SEPAY_BANK_NAME=
```

### 11.2 Client

```env
VITE_API_URL=/api
```

Note:

- `client/vite.config.js` còn tham chiếu `process.env.VITE_API_PROXY` ở config runtime của Vite.
- `docker-compose.yml` có secret demo, không được coi là production-safe.

## 12. Seed data và môi trường dev

Seed script: `server/prisma/seed.js`

Demo credential:

```text
email: demo@finsight.vn
password: Demo@123
```

Seed tạo:

- 1 user
- 5 debts
- payment history
- debt goal
- investor profile
- notifications
- debt snapshots

Seed cleanup không explicit delete:

- `Transaction`
- `ChatSession`
- `ChatMessage`
- `FinanceKnowledge`

## 13. Trạng thái kiểm chứng

Verification window: `2026-04-26`

| Command | Kết quả | Ghi chú |
| --- | --- | --- |
| `cd server && npx prisma validate` | Passed | schema Prisma hợp lệ |
| `cd server && npm.cmd run test:investment` | Archived | đã pass 32 tests trong giai đoạn phát triển; test modules/script nội bộ của investment advisor đã gỡ trước merge |
| `cd client && npm run lint` | Failed | `92` vấn đề (`87` errors, `5` warnings) |
| `cd client && npm run build` | Passed | rerun ngoài sandbox; có warning bundle lớn |
| `cd client && npm test` | Failed | không có script `test` |
| `cd server && npm test` | Failed | không có script `test` |

Lint failure categories chính:

- unused imports/vars
- `react-hooks/set-state-in-effect`
- `react-hooks/static-components`
- `react-hooks/exhaustive-deps`
- `react-refresh/only-export-components`
- `vite.config.js`: `process is not defined`

Build note:

- Vite build thành công nhưng chunk chính khoảng `1.5 MB` sau minify, vượt ngưỡng warning `500 kB`.

## 14. Caveats & Technical Debt

### 14.1 High severity

| Mức độ | Vấn đề | Ảnh hưởng |
| --- | --- | --- |
| High | `GET /api/auth/me`, `GET /api/users/profile`, `PUT /api/users/profile` trả full Prisma `User` record | có thể lộ `password` hash, `googleId`, `facebookId` cho client |
| High | `PUT /api/users/notifications/:id/read` update theo `id` duy nhất, không ràng buộc `userId` | user có thể mark notification của user khác nếu đoán được ID |
| High | Prisma migrations lag phía sau schema | môi trường mới có thể không tái hiện được schema hiện tại bằng migrate chain |
| High | `server/Dockerfile` chỉ chạy `npx prisma db push` ở `CMD` | container không khởi động API server như mong đợi |

### 14.2 Medium severity

| Mức độ | Vấn đề | Ảnh hưởng |
| --- | --- | --- |
| Medium | `debt.job.js` dùng `user.username` / `debt.user.username` nhưng schema chỉ có `fullName` | email alert có khả năng lỗi runtime hoặc gửi sai tên |
| Medium | `DELETE /api/debts/:id` luôn trả success dù `deleteMany()` xóa `0` rows | API contract gây hiểu nhầm |
| Medium | `PUT /api/debts/:id` dùng `req.body` trực tiếp với validation hạn chế | dễ ghi dữ liệu không mong muốn |
| Medium | `Debt.startDate` là optional trong schema nhưng create API bắt buộc | schema-contract mismatch cho client khác ngoài UI hiện tại |
| Medium | `getGoldPrices()` fallback cache trả shape khác success path | client/AI caller có thể lỗi nếu assume luôn có `goldItems` |
| Medium | Client và server có divergence ở `detectDominoRisk()` | UI client-side không phản ánh đầy đủ due-soon logic của backend |
| Medium | `checkMarketSentimentChanges()` cron job hiện là stub | scheduler có nhưng business effect chưa hoàn chỉnh |
| Medium | report export dùng heuristic `monthlyIncome * 0.1` thay vì `extraBudget` thật | report có thể không khớp trải nghiệm repayment plan |

### 14.3 Lower severity nhưng cần biết

| Mức độ | Vấn đề | Ảnh hưởng |
| --- | --- | --- |
| Low | `summary.dueThisWeek` trong debt API thực chất là `<= 30 ngày` | tên field sai ngữ nghĩa |
| Low | `AuthContext.logout()` chỉ clear local token, không gọi backend `/auth/logout` | không ảnh hưởng lớn do backend stateless, nhưng contract không nhất quán |
| Low | bundle frontend lớn (`~1.5MB`) | ảnh hưởng performance |
| Low | nhiều string/comment bị mojibake | giảm maintainability, tăng rủi ro chỉnh text |
| Low | report service phụ thuộc logo URL ngoài và fallback path local tương đối mong manh | export PDF có thể degrade branding |

### 14.4 Docs/code conflicts đã xác nhận

Các tài liệu sau **không còn phản ánh code hiện tại đầy đủ**:

- `QUICK_REFERENCE.md`: nói stock API chưa tồn tại, nhưng code hiện có `GET /api/investment/stock-prices`.
- `Docs/Agentic/AI_PROJECT_CONTEXT.md` cũ: một số caveat đã lỗi thời, gồm:
  - OCR field mismatch
  - `DebtConfirmModal` thiếu `startDate`
  - session memory lấy oldest messages
  - current query bị duplicate trong agent context
  - market tools trả mock/random data
- `README.md` và docs cũ có thể còn nhắc route cũ không tồn tại như `/api/dashboard`, `/api/advisory`, `/api/market/fear-greed`.

## 15. Quy ước khi AI khác tiếp tục làm việc

- Luôn đọc tệp này trước, sau đó xác minh lại đúng file runtime liên quan.
- Khi thay đổi investment advisor runtime, ưu tiên các service backend mới (`historicalData`, `portfolioOptimizer`, `monteCarloSimulation`, `riskMetrics`). Heuristic `getAllocation()` cũ đã được gỡ khỏi utils; chỉ giữ fallback UI đang thật sự dùng cho strategy history cũ.
- Không cho tool AI ghi nợ trực tiếp xuống DB nếu chưa có bước confirm ở UI.
- Nếu thay schema Prisma, phải quyết định rõ:
  - chỉ `db push` cho dev
  - hay viết migration đầy đủ
- Khi đụng `investment.controller.js`, chú ý payload stale fallback không luôn đồng nhất giữa các endpoint.
- Khi sửa auth/profile responses, ưu tiên loại bỏ hoàn toàn password hash và social IDs khỏi JSON trả về.
- Khi sửa docs, cập nhật **chỉ** root `AI_PROJECT_CONTEXT.md`; không tạo thêm bản sao độc lập trong `Docs/`.
