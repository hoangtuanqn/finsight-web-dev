# FinSight System Context

Last audited from code: 2026-04-30  
Repository: `finsight-web-dev`

## Overview

FinSight là web app quản lý tài chính cá nhân có AI advisor. Mục tiêu cốt lõi là giúp người dùng:

- Quản lý nợ, nhìn rõ APR/EAR, DTI, rủi ro domino và kế hoạch trả nợ.
- Quản lý ví, thu chi và giao dịch ngân hàng cần duyệt.
- Đánh giá hồ sơ đầu tư, gợi ý phân bổ tài sản và lưu chiến lược AI.
- Hỏi đáp tài chính qua agentic chat có RAG, OCR và tool calling.
- Nâng cấp gói qua QR SePay, nhận notification realtime và export report.

Nguồn sự thật ưu tiên là source code hiện tại trong `apps/api`, `apps/web`, `apps/api/prisma/schema.prisma`. Nếu docs cũ mâu thuẫn với code, tin code.

## Tech Stack

| Layer | Stack |
| --- | --- |
| Monorepo | Bun workspaces, Turborepo, TypeScript, Node.js >= 18 |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7, TanStack Query, Axios |
| Frontend UX | Recharts, Framer Motion, Lucide React, Sonner, Driver.js, Tesseract.js |
| Backend | Express 5, TypeScript ESM, Socket.IO, node-cron, Zod |
| Database | PostgreSQL 15, pgvector extension |
| ORM | Prisma 6 with a shared Prisma client extension in `apps/api/src/lib/prisma.ts` |
| Cache/Rate limit | Redis via ioredis, graceful fallback if unavailable |
| AI | LangChain, LangGraph ReAct agent, OpenAI-compatible chat and embedding APIs |
| Default AI provider | FPT Cloud: `SaoLa4-medium`, embedding `Vietnamese_Embedding` dimension 1024 |
| Integrations | SePay, Google OAuth, Facebook Graph API, SMTP/Nodemailer |
| Market data | Alternative.me, CoinGecko, Yahoo Finance, BTMC, Vietnamese RSS feeds |
| Export | PDFKit, ExcelJS |

## Architecture

### Runtime Layout

```text
apps/web
  src/App.tsx                 React providers, routes, protected layout
  src/api/index.ts            Axios client and endpoint wrappers
  src/hooks/*Query.ts         TanStack Query hooks and mutation invalidation
  src/context/AuthContext.tsx JWT auth state from localStorage
  src/context/SocketContext.tsx Socket.IO client events

apps/api
  src/app.ts                  Express app, routes, CORS, Socket.IO, error handler
  src/index.ts                Starts HTTP server and cron manager
  src/routes/*.routes.ts      API route groups
  src/controllers/*.ts        Request orchestration
  src/services/*.ts           Business logic and external integrations
  src/lib/prisma.ts           Prisma singleton with Debt soft-delete filter
  src/agentic/*               AI router, memory, tools, RAG, LLM provider
  prisma/schema.prisma        Database schema
```

### Data Flow

1. Frontend calls API through `apps/web/src/api/index.ts`.
2. Axios injects `Authorization: Bearer <finsight_token>` from localStorage.
3. Backend route applies `authenticate`, optional `validate` or `cache`, then calls controller.
4. Controller calls service or Prisma, then returns `{ success: true, data }` or `{ success: false, error }`.
5. Frontend hooks use TanStack Query cache; mutations invalidate related query keys.
6. Redis is used as cache/rate-limit layer where available. App must keep working without Redis.
7. Socket.IO clients join `user_<userId>` rooms and receive events such as subscription upgrade and wallet updates.

### Design Patterns

- Controller-Service pattern for API modules.
- Prisma as repository boundary; prefer the shared client from `lib/prisma`.
- Singleton-style modules: Prisma client, Redis client, CronManager, Socket.IO helper.
- Cache-aside pattern for market/investment endpoints.
- Provider/adapter pattern for LLM, embeddings and external market APIs.
- Smart soft delete for `Debt`: default reads exclude `deletedAt != null`; pass `includeDeleted` only for trash/detail/restore flows.
- SSE streaming for AI chat at `POST /api/agentic/chat`.

## Core Entities & Database Schema

| Entity | Purpose | Main Relations |
| --- | --- | --- |
| `User` | Central account, auth, profile, subscription level, referral code, strategy quota | Has debts, wallets, expenses, transactions, chat sessions, investor profile |
| `Debt` | Loan/debt record with APR, fees, due day, balance and soft-delete metadata | Belongs to user, has payments |
| `Payment` | Debt payment history | Belongs to debt |
| `DebtGoal` | Payoff target date and strategy | One per user |
| `DebtSnapshot` | Historical debt health metrics | Belongs to user |
| `Notification` | In-app alerts for debt, milestones, subscriptions | Belongs to user |
| `InvestorProfile` | Capital, monthly add, goal, horizon, risk level, savings/inflation assumptions | One per user, has allocations |
| `Allocation` | Saved allocation recommendation history | Belongs to investor profile |
| `AIStrategy` | Generated AI investment strategy consuming user quota | Belongs to user, optional source for portfolio |
| `UserPortfolio` | User's current chosen allocation | One per user, optional source strategy |
| `Wallet` | Cash/bank/e-wallet balance and optional SePay sync config | Belongs to user, has expenses and pending bank transactions |
| `Expense` | Income/expense transaction | Belongs to user, category, optional wallet |
| `ExpenseCategory` | System or user category tree | Optional parent/children hierarchy |
| `BankTransactionPending` | Imported SePay bank transaction awaiting approve/reject | Belongs to user and wallet |
| `ChatSession` | AI conversation thread | Belongs to user, has messages |
| `ChatMessage` | AI/user/tool message record | Belongs to chat session |
| `FinanceKnowledge` | RAG chunks with pgvector embedding | Independent knowledge table |
| `Transaction` | Subscription invoice/payment status | Belongs to user |
| `Referral`, `ReferralClick`, `UserActivity` | Affiliate/referral tracking and reward eligibility | Belongs to user |
| `Article` | Knowledge/article content for UI | Independent content table |

Important schema notes:

- IDs are string `cuid()` values.
- Most user-owned relations cascade on user delete.
- `FinanceKnowledge.embedding` is `vector(1024)`.
- Prisma migrations currently include only `20260326082144_init` and `20260419132751_add_chat_and_rag`; schema may be ahead of migration history.

## Core Workflows

### 1. Debt Management & Repayment

1. User creates or updates debt through `/api/debts`.
2. Zod validates debt body; controller stores debt with current user ownership.
3. Debt list calculates APY, EAR, DTI, upcoming due days and domino alerts.
4. Payment logging creates `Payment`, reduces `Debt.balance`, marks `Debt.status = PAID` when balance reaches zero.
5. Milestone logic creates notification and sends email at 25%, 50%, 75%, 100% paid.
6. Repayment plan compares Avalanche and Snowball using `simulateRepaymentWithExtraBudget`.
7. Delete is soft delete: active debt requires reason and risk commitment; restore clears delete metadata.
8. Daily cron purges soft-deleted debts whose `scheduledPurgeAt` has passed.

### 2. Investment Advisor & AI Strategy

1. User creates `InvestorProfile` with capital, monthly add, goal, horizon and risk level.
2. `/api/investment/allocation` fetches market sentiment and historical asset data.
3. Expected returns are adjusted by sentiment and market views.
4. Optimizer applies Black-Litterman style posterior returns plus constrained Markowitz allocation.
5. Allocation is saved to `Allocation` history.
6. Monte Carlo projections, risk metrics and stress tests are returned to UI.
7. `/api/investment/strategies/generate` persists an `AIStrategy` and decrements `User.strategyQuota`.
8. User can apply/update allocation into `UserPortfolio`; portfolio weights must total about 100%.

### 3. Agentic AI Chat, OCR & RAG

1. UI optionally OCRs uploaded images in browser via Tesseract.js.
2. Client sends `POST /api/agentic/chat` and reads SSE `data:` events.
3. Backend enforces auth, message length, off-topic guard and Redis rate limit when available.
4. Intent router uses keyword match first, LLM fallback second.
5. Intent selects allowed tools: debt parsing/query, profile query, DTI simulation, market data, RAG search.
6. LangGraph ReAct agent streams tokens and tool status.
7. Chat memory is persisted in `ChatSession` and `ChatMessage`; old context is compacted/summarized.
8. RAG searches `FinanceKnowledge` via pgvector cosine distance.
9. `parse_debt_from_text` never writes directly to DB; it returns `form_population` payload for UI confirmation.

## Coding Standards & Constraints

- Keep changes simple and local. Prefer existing route/controller/service/hook patterns.
- Protected backend endpoints must use `authenticate` and scope all queries by `req.userId`.
- Do not expose password hashes, social IDs or tokens in API responses. `auth/me` should be treated carefully because it currently returns a full user object.
- Use `success`, `error` or the same JSON envelope convention unless the endpoint is SSE or binary export.
- Use Zod validation for request bodies where possible.
- Prefer `apps/api/src/lib/prisma.ts` instead of creating new `PrismaClient` instances. Existing exceptions should not be copied.
- Respect Debt soft delete. Normal business queries should exclude trashed debts unless the feature is explicitly trash/restore/audit.
- Invalidate Redis caches after mutations that affect cached user or investment data.
- External API failures should degrade through cache, fallback data or empty results. Do not make the core app depend on market API uptime.
- AI tools must not mutate financial records without an explicit user confirmation flow.
- Financial calculations belong in `utils/calculations.ts` or focused services, not duplicated across controllers and UI.
- Frontend data fetching should go through `src/api/index.ts` and `src/hooks/*Query.ts`; avoid direct ad-hoc Axios calls in pages.
- UI mutations should invalidate TanStack Query keys and show concise Sonner feedback.
- Do not introduce broad refactors while fixing a narrow feature. This codebase has existing `any` usage and mojibake text; improve only where it directly helps the task.
- Docker compose values are development defaults, not production-safe secrets.

## Current Route Groups

| API Prefix | Purpose |
| --- | --- |
| `/api/auth` | Local login/register, OAuth, QR login, `me`, logout |
| `/api/users` | Profile and notifications |
| `/api/debts` | Debt CRUD, payments, EAR, DTI, repayment plan, restore |
| `/api/debts/goal` | Debt payoff goal |
| `/api/investment` | Profile, allocation, asset guides, strategies, portfolio |
| `/api/market` | Sentiment, prices, news, market summary |
| `/api/agentic` | AI chat and chat sessions |
| `/api/reports` | PDF/Excel export |
| `/api/subscription` | Plan, invoice, payment verification, transactions |
| `/api/expenses` | Expense CRUD, categories, stats |
| `/api/wallets` | Wallet CRUD and total balance |
| `/api/bank-sync` | SePay pending transaction sync/approve/reject |
| `/api/referral` | Referral click tracking and stats |
| `/api/articles` | Knowledge/articles |

## Operational Notes

- Dev frontend runs on port `5173`; API runs on `5001`.
- Docker compose uses PostgreSQL on host port `5445` and Redis on `6379`.
- `VITE_API_URL` defaults to `/api`; Vite proxies `/api` to backend during dev.
- Cron starts when API server starts:
  - Every 10 seconds: subscription payment check, wallet bank sync.
  - Every minute: debt alerts, market sentiment job, invoice expiry, referral rewards.
  - Daily at 00:05: expired subscriptions and soft-delete purge.
- `server_error.log` is written by backend `console.error` override.
