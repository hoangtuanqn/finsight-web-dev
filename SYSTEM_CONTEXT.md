# FinSight System Context

Last audited from runtime source: 2026-05-08
Repository: `finsight-web-dev`
Audience: future AI/code agents working inside this repo.

## Source Of Truth

Use runtime source code as the source of truth:

1. `apps/*`, `packages/*`, root `package.json`, `turbo.json`, and Docker files.
2. Backend route mounts in `apps/api/src/app.ts`.
3. Frontend route maps in `apps/web/src/App.tsx` and `apps/web-enterprise/src/App.tsx`.
4. Prisma schemas in `apps/api/prisma/schema.prisma` and `apps/api/prisma/enterprise/schema.prisma`.
5. Agent runtime in `packages/agentic/src`, especially `agent.ts`, `router-node.ts`, `worker.interface.ts`, `workers/*`, `tools/*`, `ui-signal.ts`, and `sse-envelope.ts`.

Do not treat `dist`, `.turbo`, `node_modules`, logs, `README.md`, or old prose docs such as `docs/AI_PROJECT_CONTEXT.md` as authoritative. This file intentionally uses ASCII only.

## Current Architecture

FinSight is a Bun/Turborepo TypeScript monorepo with one Express API, two React/Vite frontends, and shared packages.

- `apps/web`: personal finance app for debt, wallets, expenses, subscriptions, KYC, face login, investment, affiliate, knowledge base, and AI advisor.
- `apps/web-enterprise`: enterprise receivable/payable app for organizations, parties, debt records, repayment planning, notifications, jobs, and analytics.
- `apps/api`: Node.js/Express API serving both personal and enterprise products from one server.
- `packages/*`: shared agentic AI runtime, financial math, UI primitives, permission helpers, enterprise types, and tooling config.

## Tech Stack

| Layer | Current stack |
| --- | --- |
| Monorepo | Bun workspaces, Turborepo, TypeScript, Node.js >= 18 |
| Frontends | React 19, Vite 8, Tailwind CSS 4, React Router DOM 7, TanStack Query, Axios/fetch |
| Frontend UX | Recharts, Framer Motion, Lucide React, Sonner, Driver.js, face-api.js, Three.js, ExcelJS/FileSaver in enterprise export |
| Backend | Node.js, Express 5, TypeScript ESM, Socket.IO, node-cron, Zod, Multer |
| Database | PostgreSQL 15 with pgvector |
| ORM | Prisma 6 personal client plus generated enterprise Prisma client in `@prisma/enterprise` |
| Cache/rate limit | Redis through `ioredis`; code falls back when Redis is unavailable |
| AI runtime | `@repo/agentic`, LangChain Core/OpenAI, LangGraph prebuilt ReAct agents inside workers, OpenAI SDK for OCR/STT calls |
| Default AI provider | FPT Cloud/OpenAI-compatible chat, embedding `Vietnamese_Embedding` dimension 1024 |
| Integrations | SePay, Google OAuth, Facebook Graph API, SMTP/Nodemailer, FPT.AI KYC, BankLookup, FPT Cloud vision/STT |
| Market data | Alternative.me, CoinGecko, Yahoo Finance, BTMC/SJC, Vietnamese RSS feeds |
| Export | Backend PDFKit/ExcelJS; enterprise debt detail exports client-side `.xlsx` through ExcelJS + FileSaver |

## Workspace Layout

```text
apps/web
  src/App.tsx                         Personal React route map
  src/api/index.ts                    Axios wrappers for personal REST APIs
  src/api/agentic.ts                  fetch + ReadableStream SSE client, OCR endpoint client
  src/api/voice.ts                    Audio upload client for /api/agentic/voice
  src/context/AuthContext.tsx         localStorage token auth state
  src/context/SocketContext.tsx       Socket.IO personal subscription/wallet events
  src/components/chat/*               AI chat, UI signal dispatcher, confirmation modals/cards
  src/pages/*                         Personal product pages

apps/web-enterprise
  src/App.tsx                         Enterprise React route map
  src/api/index.ts                    Active /v1/enterprise wrappers plus copied personal wrappers
  src/context/AuthContext.tsx         Enterprise login/me using enterprise endpoints
  src/context/SocketContext.tsx       Copied personal socket event handling
  src/hooks/useAnalytics.ts           Enterprise analytics hook
  src/hooks/useNotifications.ts       Enterprise notifications hook
  src/hooks/useRepaymentPlanner.ts    Enterprise repayment planner hook
  src/pages/parties/*                 Party management UI
  src/pages/debts/*                   Enterprise debt list/create/edit/detail
  src/utils/excelExport.ts            Client-side enterprise debt Excel export

apps/api
  src/app.ts                          Express app, route mounts, CORS, Socket.IO, error handler
  src/index.ts                        Starts server, cron, initAgentic(prisma, marketService)
  src/routes/*.routes.ts              Personal API route groups
  src/routes/enterprise/*.routes.ts   Enterprise API route groups
  src/controllers/*                   Request orchestration
  src/services/*                      Personal services and integrations
  src/services/enterprise/*           Enterprise debt, transaction, analytics, notification services
  src/lib/prisma.ts                   Personal Prisma singleton with Debt soft-delete extension
  src/prisma/enterprise.client.ts     Enterprise Prisma singleton
  src/cron/*                          Personal and enterprise scheduler wiring
  src/jobs/*                          Enterprise scheduled/manual jobs
  prisma/schema.prisma                Personal/public schema
  prisma/enterprise/schema.prisma     Enterprise schema namespace

packages
  agentic                             Chat orchestration, router, workers, tools, memory, RAG, SSE, UI signals
  financial-core                      EAR/DTI formulas and enterprise repayment schedule generation
  ui                                  Shared UI primitives and auth widgets
  auth                                Permission helper foundation
  types                               Shared enterprise TypeScript interfaces
  eslint-config, typescript-config    Shared tooling config
```

## Root Commands And Ports

Root package:

- Package manager: `bun@1.3.8`.
- Workspaces: `apps/*`, `packages/*`.
- Root scripts: `bun run dev`, `bun run build`, `bun run lint`, `bun run check-types`, `bun run format`.
- Sharp edge: root `check-types` calls `turbo run check-types`, but `turbo.json` defines `type-check`. Prefer `bunx turbo run type-check` or package-level `bun run type-check` until fixed.

App scripts:

- `apps/api`: `dev`, `build`, `start`, `type-check`, `db:seed`, `db:reset`, `db:push`, `db:generate`, `db:studio`, `rag:ingest`.
- API `db:push` and `db:generate` run both personal and enterprise Prisma schemas.
- `apps/web` and `apps/web-enterprise`: `dev`, `build`, `lint`, `preview`, `type-check`.

Dev ports:

- Personal web: `5173`; Vite proxies `/api` to `http://127.0.0.1:5001`.
- Enterprise web: `5174`; Vite proxies `/api` to `http://127.0.0.1:5001`.
- API: `5001`.
- Docker PostgreSQL host port: `5445`.
- Docker Redis host port: `6379`.

Docker compose starts PostgreSQL, Redis, API, and personal web only. It does not start `apps/web-enterprise`. The API Dockerfile runs only the default Prisma generate/db push path, so use API package scripts when enterprise schema generation or push matters.

## Personal Web App

Current personal routes in `apps/web/src/App.tsx`:

| Route | Component/domain |
| --- | --- |
| `/` | Landing page |
| `/login`, `/register` | Personal auth |
| `/qr-confirm` | Authenticated QR login confirmation |
| `/home` | Personal dashboard |
| `/knowledge` | Knowledge base |
| `/debts` | Debt overview |
| `/debts/add` | Add debt |
| `/debts/ear-analysis` | EAR analysis |
| `/debts/goal` | Payoff goal |
| `/debts/repayment` | Repayment simulation |
| `/debts/plan/:planId` | Custom repayment plan |
| `/debts/dti` | DTI analysis |
| `/debts/:id` | Debt detail |
| `/debts/:id/edit` | Debt edit |
| `/investment` | Investment advisor |
| `/investment/my-portfolio` | User portfolio |
| `/risk-assessment` | Risk questionnaire |
| `/profile` | Profile, finance, investment, security |
| `/upgrade` | Subscription upgrade |
| `/invoice/:id` | Subscription invoice |
| `/transactions` | Subscription transaction history |
| `/expenses` | Expenses and wallets overview |
| `/wallets/:id` | Wallet detail |
| `/affiliate` | Referral/affiliate |
| `/kyc` | OCR/liveness KYC |
| `*` | Redirect to `/home` |

Frontend conventions:

- `Layout` performs the logged-in guard for app routes and mounts `AIChatbotModal`.
- `PublicRoute` wraps `/login` and `/register`; `ProtectedRoute` wraps `/qr-confirm`.
- REST calls should go through `src/api/index.ts` unless a feature owns a direct fetch helper.
- Agent chat streaming goes through `src/api/agentic.ts`.
- Voice recording goes through `src/api/voice.ts` and `POST /api/agentic/voice`.
- Auth token key is `localStorage.finsight_token`; trusted-device token key is `finsight_trust_token`.
- `SocketContext` connects after login, emits `join` with `user.id`, and handles `subscription:upgraded`, `wallet:balance_updated`, and `wallet:new_pending_transactions`.
- Chat image OCR now sends resized base64 image data to `POST /api/agentic/ocr`; the returned text is passed as `ocrText` to `POST /api/agentic/chat`.
- `UiSignalDispatcher` handles debt, repayment, investment, debt summary, and redirect UI signals.

## Enterprise Web App

Current enterprise routes in `apps/web-enterprise/src/App.tsx`:

| Route | Component/domain |
| --- | --- |
| `/` | Enterprise landing |
| `/login`, `/register` | Enterprise auth and organization onboarding |
| `/home` | Enterprise analytics dashboard |
| `/profile` | Enterprise profile |
| `/parties` | Party/counterparty management |
| `/notifications` | Enterprise notification inbox |
| `/debts` | Enterprise debt list |
| `/debts/new` | Create enterprise debt |
| `/debts/:id` | Debt detail, schedules, transactions, audit |
| `/debts/:id/edit` | Edit enterprise debt |
| `/repayment-planner` | Enterprise repayment planner |
| `*` | Redirect to `/home` |

Important enterprise frontend notes:

- Active enterprise REST surface is `/api/v1/enterprise/*`.
- `enterpriseAuthAPI` in `apps/web-enterprise/src/api/index.ts` owns active wrappers for auth, parties, debts, transactions, and repayment planner.
- `useAnalytics`, `useNotifications`, and `useRepaymentPlanner` call `/v1/enterprise/*` endpoints.
- `partiesAPI` still points at old `/enterprise/parties` paths and is not the active wrapper used by the mounted enterprise pages.
- `AuthContext` fetches personal Google/Facebook config from `/api/auth/*`, but enterprise login/me use `/api/v1/enterprise/auth/*`.
- The enterprise `SocketContext` is copied from personal web and listens for personal subscription/wallet events; no enterprise-specific realtime events are wired in the mounted route flow.
- `api/agentic.ts` and `useAgenticChat` exist in `apps/web-enterprise`, but no enterprise chat UI is mounted in `App.tsx` or `Layout.tsx`.
- Enterprise `src/utils/ocr.ts` uses browser-side Tesseract, but the mounted enterprise app currently has no chat modal.
- Both web apps use `localStorage.finsight_token`, so running both side by side can overwrite session context.

## API Server

`apps/api/src/app.ts` creates Express, an HTTP server, Socket.IO, CORS, JSON/urlencoded middleware, route mounts, a health check, and an error handler. `apps/api/src/index.ts` starts the server, initializes cron jobs, and calls:

```ts
initAgentic(prisma, marketService);
```

CORS allows all localhost/127.0.0.1 origins plus `CLIENT_URL` (default `http://localhost:5173`). `console.error` is overridden to append to `server_error.log`.

### Personal/Public Route Groups

All prefixes below are mounted under `/api`.

| Prefix | Key endpoints/purpose |
| --- | --- |
| `/health` | `GET /health` health check |
| `/auth` | Register/login/me/logout, password verification, social auth/config, 2FA, trusted device, QR login |
| `/face` | Face status/register/remove, public face login and account selection |
| `/kyc` | KYC status and FPT.AI OCR/liveness submit |
| `/users` | Profile, notifications, health score history |
| `/debts` | Personal debt CRUD, restore, payments, repayment plan, EAR, DTI |
| `/debts/goal` | Personal payoff goal get/upsert/delete |
| `/repayment-plans` | Saved custom repayment plans and simulation |
| `/investment` | Investor profile, allocation/history, risk assessment, asset guides/history, AI strategies, portfolio |
| `/market` | Sentiment, prices, crypto, gold, news, summary |
| `/agentic` | Authenticated AI chat SSE, backend OCR, voice STT, repayment setup, chat sessions |
| `/reports` | Personal PDF/Excel export |
| `/subscription` | Plan status, invoice create/get/cancel, SePay verification, transaction history |
| `/articles` | Knowledge/article CRUD |
| `/expenses` | Expense/category CRUD and stats |
| `/wallets` | Wallet CRUD and total balance |
| `/bank-sync` | SePay wallet pending transaction fetch/approve/reject/clear |
| `/referral` | Public click tracking plus authenticated affiliate stats, commissions, banks, bank accounts, withdrawals |

Mounted agentic endpoints:

- `POST /api/agentic/chat`
- `POST /api/agentic/ocr`
- `POST /api/agentic/voice`
- `POST /api/agentic/repayment-setup`
- `GET /api/agentic/sessions`
- `GET /api/agentic/sessions/:id`
- `DELETE /api/agentic/sessions/:id`

### Enterprise Route Groups

All prefixes below are mounted under `/api/v1/enterprise`.

| Prefix | Key endpoints/purpose |
| --- | --- |
| `/auth` | `POST /register`, `POST /login`, `GET /me` |
| `/parties` | Users, party CRUD, party audit, status toggle |
| `/debts` | Debt CRUD/detail, audit logs, payments, reverse transaction, activate/dispute/resolve/write-off |
| `/jobs` | Manual overdue, penalty, notify, report jobs, and job logs |
| `/notifications` | Inbox, unread count, mark read/all-read, acknowledge, snooze |
| `/repayment-planner` | Eligible debts, simulate, commit, execution report |
| `/analytics` | Summary, aging report, cash flow projection, action items |

## Auth And Request Flow

1. Frontends call Axios wrappers or `fetch` for SSE/audio.
2. Request interceptors attach `Authorization: Bearer <finsight_token>` and optional `x-trust-token`.
3. `authenticate` verifies JWT and sets `req.userId`, `req.userEmail`, `req.organizationId`, and `req.role`.
4. Route calls controller, controller calls services/Prisma/integrations.
5. Personal JSON responses usually use `{ success, data }` or `{ success: false, error }`.
6. Enterprise response shapes are mixed: some controllers use `{ success, data }`, while planner/notifications return raw arrays/objects. Follow the active hook/page before changing a response shape.
7. Redis is used for cache and the agentic rate limiter when available. Core behavior should keep working without Redis.
8. Socket.IO joins rooms named `user_<id>`.

## Database Schemas

### Personal/Public Prisma

Client: `apps/api/src/lib/prisma.ts` using `@prisma/client`.

Important models:

| Entity | Purpose |
| --- | --- |
| `User` | Personal account, subscription level, strategy quota, referral, 2FA, KYC, finance profile |
| `TrustedDevice` | Trusted 2FA device token |
| `Debt`, `Payment`, `DebtGoal`, `DebtSnapshot`, `RepaymentPlan`, `RepaymentPlanItem` | Personal debt domain |
| `Notification`, `HealthScoreHistory` | Alerts and health score audit |
| `InvestorProfile`, `Allocation`, `AIStrategy`, `UserPortfolio` | Investment profile, allocation, generated strategy, portfolio |
| `Transaction` | Subscription invoice/payment |
| `ChatSession`, `ChatMessage`, `FinanceKnowledge` | Agent memory and RAG |
| `Wallet`, `Expense`, `ExpenseCategory`, `BankTransactionPending` | Wallets, expense tracking, SePay pending sync |
| `Referral`, `ReferralClick`, `UserActivity`, `CommissionLog`, `BankAccount`, `WithdrawalRequest` | Affiliate/referral system |
| `Article` | Knowledge base content |
| `KycRecord`, `FaceDescriptor` | KYC and face login vectors |

Schema notes:

- Most personal IDs use `cuid()`.
- `FinanceKnowledge.embedding` is `vector(1024)`.
- `FaceDescriptor.descriptor` is `vector(128)`.
- `Debt` has soft-delete fields: `deletedAt`, `scheduledPurgeAt`, `deleteReason`, `deleteCommitment`.
- The shared personal Prisma client auto-filters `Debt.findMany`, `findFirst`, and `count` to `deletedAt: null` unless callers pass `includeDeleted`.

### Enterprise Prisma

Client: `apps/api/src/prisma/enterprise.client.ts` using generated `@prisma/enterprise`.
Database schema namespace: `enterprise`.

Important models:

| Entity | Purpose |
| --- | --- |
| `Organization` | Tenant/company and covenant thresholds |
| `EnterpriseUser` | Enterprise user inside one organization |
| `Party`, `Contact`, `EnterpriseBankAccount` | Counterparties and party contact/bank data |
| `DebtRecord` | Receivable/payable record with origin, principal, outstanding, due date, penalty config, status |
| `DebtInterestRate`, `DebtSchedule`, `DebtTransaction`, `DebtDocument` | Interest rates, schedules, ledger, documents |
| `AuditLog` | Enterprise audit trail |
| `JobLog` | Scheduled/manual job execution log |
| `EnterpriseNotification` | Enterprise notifications |
| `EnterpriseRepaymentPlan`, `EnterpriseRepaymentPlanItem` | Committed enterprise repayment plans |

Status vocabulary:

- `DebtRecord.status`: `DRAFT`, `ACTIVE`, `PARTIAL`, `PAID`, `OVERDUE`, `DISPUTED`, `WRITTEN_OFF`.
- `DebtRecord.type`: `RECEIVABLE` or `PAYABLE`.
- `DebtRecord.origin`: `TRADE`, `FINANCIAL`, `TAX`, `BOND`, `INTERNAL`.
- Interest methods: `REDUCING_BALANCE`, `EMI`, `BULLET`, `NONE`.
- Party statuses: `ACTIVE`, `INACTIVE`, `BLACKLIST`.
- Repayment plan strategies: `AVALANCHE`, `SNOWBALL`, `OVERDUE_FIRST`, `COVENANT_RISK`.

## Agentic AI Current State

Runtime package: `packages/agentic`.

The API initializes the package by injecting the personal Prisma client and market service:

```ts
initAgentic(prisma, marketService);
```

Important correction from older docs: the current `runAgenticChat` in `packages/agentic/src/agent.ts` does not branch on `AGENT_GRAPH_V2` and does not run the old Graph V2 documentation flow. The current runtime path is:

```text
session bootstrap -> save user message -> memoryCompressorNode -> routerNode -> worker registry -> worker.run -> save assistant message
```

### Chat Endpoint Flow

`POST /api/agentic/chat`:

1. Requires auth and uses `agenticRateLimit`.
2. Rate limit is `50 req/min/user` when Redis works; Redis failure allows requests through.
3. Validates message length before SSE headers: `2000` chars normally, `20000` chars when `ocrText` exists.
4. Opens named SSE with heartbeat comments every 15 seconds.
5. Injects OCR text into the prompt when `ocrText` exists.
6. Calls `runAgenticChat`.
7. Streams token/status events and sends validated `ui_signal` before `done`.
8. Closes the writer on client disconnect or completion.

Agentic support endpoints:

- `POST /api/agentic/ocr`: accepts `{ base64Image }`, calls FPT Cloud/OpenAI-compatible vision model `gemma-4-31B-it`, and returns extracted text.
- `POST /api/agentic/voice`: accepts multipart `audio` up to 10 MB and transcribes with `FPT.AI-whisper-large-v3-turbo`.
- `POST /api/agentic/repayment-setup`: updates `User.extraBudget` and optionally upserts `DebtGoal.targetDate`.

SSE event names:

- `message`: `{ token }`
- `status`: `{ status }`
- `ui_signal`: `{ uiSignal }`
- `done`: `{ done, sessionId, actionType, uiSignal, triggerPayload }`
- `error`: `{ done, error }`

`SseWriter` can emit legacy `data: {...}` frames when `legacyCompat` is true. The active API controller creates `new SseWriter(res, { legacyCompat: false, heartbeatMs: 15_000 })`, so the server path sends named SSE events only. The personal frontend parser supports both named and legacy frames; the enterprise parser only handles legacy `data:` frames, but no enterprise chat UI is mounted.

### Router And Workers

`routerNode` uses:

- Max-length guard, skipped for OCR messages.
- OCR message detection pinned directly to `DEBT_EXTRACTION`.
- Keyword fast path.
- LLM fallback with a 5-second timeout.
- Investment quota pre-check that reroutes investment requests to general chat when quota is exhausted.

Current intent-to-worker map:

| Intent | Worker | Status |
| --- | --- | --- |
| `DEBT_EXTRACTION` | `debt_extraction` | Real worker |
| `REPAYMENT_SETUP` | `repayment` | Real worker |
| `INVESTMENT_ADVICE` | `investment` | Real worker |
| `DEBT_SUMMARY` | `debt_summary` | Real worker |
| `DEBT_LIST_QUERY` | `debt_list` | Stub worker |
| `SIMULATION` | `simulation` | Real worker |
| `MARKET_OVERVIEW` | `market` | Real worker |
| `MARKET_SPECIFIC` | `market` | Real worker |
| `KNOWLEDGE` | `rag` | Real worker |
| `GENERAL_CHAT` | `general` | Streaming LLM response |

The worker registry also includes `max_length`. There is no current `OFF_TOPIC` intent in `AgentIntent`. Workers must return `{ text, uiSignal }`, must not write financial records directly, and must not format SSE.

### Worker Behavior

- Debt extraction uses LangGraph `createReactAgent` and `parse_debt_information`; it opens a `DEBT_CONFIRMATION` popup when parsed data exists. User confirmation calls normal debt REST endpoints.
- Repayment setup uses `extract_repayment_setup`; it always opens a `REPAYMENT_CONFIRMATION` popup, and confirmation calls `POST /api/agentic/repayment-setup`.
- Investment reads quota/profile only. It opens an `INVESTMENT_CONFIRMATION` popup when quota is available. `POST /api/investment/strategies/generate` atomically decrements quota and creates `AIStrategy`.
- Debt summary reads active debts and DTI snapshot, then returns a `DEBT_SUMMARY_ACTIONS` interactive card.
- Simulation uses `simulate_financial_risk` to compute scenario DTI/cash-flow effects and returns text only.
- Market uses tools for gold price, Fear & Greed, BTC/ETH market prices, and returns text only.
- RAG calls `knowledge_search` directly. Results below similarity `0.7` produce the fixed no-answer response.
- `debt_list` is still a stub.
- General chat streams a short LLM response and attaches no UI signal.

### UI Signal Contract

Defined in `packages/agentic/src/ui-signal.ts` with Zod.

Signal types:

- `SHOW_POPUP`
- `SHOW_INTERACTIVE_CARD`
- `REDIRECT`
- `NONE`

Actions:

- `DEBT_CONFIRMATION`
- `REPAYMENT_CONFIRMATION`
- `INVESTMENT_CONFIRMATION`
- `DEBT_SUMMARY_ACTIONS`

Important rules:

- Popup data fields are intentionally nullable/optional.
- Backend validates UI signals before sending them over SSE.
- UI confirmation flows call normal REST endpoints after the user confirms.
- Frontend route redirects are allowlisted in `UiSignalDispatcher`.

### Agentic Tests And RAG

- `packages/agentic/src/__tests__` contains Bun tests for UI signal schemas, router fixtures, RAG retriever behavior, and agent contract fixtures.
- `packages/agentic/package.json` currently has no `test` script; run tests explicitly with Bun if needed.
- `apps/api` exposes `bun run rag:ingest`, which executes `packages/agentic/src/rag/ingest.ts`.
- RAG ingestion reads markdown files from `apps/api/data/knowledge` relative to the API process cwd.

## Core Personal Workflows

### Debt Management

1. Users create/update debts under `/api/debts`.
2. Zod validation uses `validate(authSchemas.debt)`.
3. Controllers calculate EAR/APY, DTI, upcoming due days, domino risk, progress, health score effects, and repayment simulations.
4. Payments create `Payment`, reduce `Debt.balance`, reduce accrued penalty first, update remaining terms, and mark `Debt.status = PAID` at zero balance.
5. Debt deletion is soft delete; normal queries should not include deleted debts.
6. Daily maintenance purges soft-deleted debts whose purge date has passed.

### Investment Advisor

1. `InvestorProfile` stores capital, monthly contribution, goal, horizon, risk level/score, savings/inflation assumptions.
2. Allocation uses market sentiment, historical data, Black-Litterman-style views, constrained portfolio optimization, Monte Carlo projection, and risk metrics.
3. Asset guides fetch/cache gold, savings, bonds, stocks, crypto, and related market data.
4. Risk assessment updates profile risk score/level.
5. AI strategy generation stores `AIStrategy`, captures asset snapshots, and decrements `User.strategyQuota` atomically.
6. `UserPortfolio` weights must sum to roughly 100%.

### Auth, Security, KYC, Face Login

1. Email/password auth uses JWT.
2. Google and Facebook auth are available for personal accounts.
3. 2FA uses TOTP, temporary login token, and optional trusted device token.
4. QR login uses generate/status/scanned/confirm endpoints.
5. KYC sends front/back ID images plus liveness video to FPT.AI and stores `KycRecord`.
6. Face login stores 128-dimension descriptors in pgvector and supports multi-account selection when several accounts match.

### Wallets, Expenses, Bank Sync

1. Wallets hold balances and optional bank account/SePay token sync fields.
2. Expenses belong to user, category, and optional wallet.
3. SePay bank sync fetches pending transactions per wallet.
4. Pending transactions can be approved into expenses/wallet balance or rejected/cleared.
5. Wallet sync cron runs every 10 seconds and emits Socket.IO events.

### Subscription And Affiliate

1. Subscription invoices are `Transaction` records with plan, amount, transfer code, QR URL, expiry, and status.
2. SePay verification runs every 10 seconds and can emit `subscription:upgraded`.
3. Expired invoices/subscriptions are handled by cron.
4. Referral flow tracks clicks, referred users, activity days, top-up status, commissions, bank accounts, and withdrawals.

## Core Enterprise Workflows

1. Enterprise registration creates `Organization` and first `EnterpriseUser` in one transaction.
2. Enterprise JWT includes `userId`, `email`, `organizationId`, and `role: "enterprise"`.
3. Party management enforces unique `taxCode` and `internalCode` per organization, auto-generates internal codes from party tags, supports status changes, and writes audit logs.
4. Creating debt validates receivable credit limits, creates a `DebtRecord` in `DRAFT`, stores interest rates, and generates schedules via `@repo/financial-core.generateSchedule`.
5. Status transitions include activate, dispute, resolve dispute, and write-off.
6. Payments allocate unpaid penalty first, then schedule interest, then principal, all in a transaction.
7. Reversals create a `REVERSAL` transaction, restore schedule paid amounts, and restore outstanding balance.
8. Analytics returns receivable/payable summary, aging buckets, 30-day cash-flow projection, and action items.
9. Repayment planner eligibility targets `PAYABLE` debts in `ACTIVE`, `PARTIAL`, or `OVERDUE` status.
10. Repayment planner supports `AVALANCHE`, `SNOWBALL`, `OVERDUE_FIRST`, and `COVENANT_RISK`; it allocates mandatory interest/penalty first, then applies remaining budget by strategy.
11. Repayment simulation returns `monthsToPayoff`, `isDebtTrap`, and `trapReason`; low budgets can mark debts as `BUDGET_TOO_LOW`, and plans still unpaid after the 360-month simulation window are treated as `TERM_EXCEEDED`.
12. Repayment plan tracking compares committed monthly plan items with actual payments and flags compliance/priority issues.

## Cron Schedule

When the API starts, `cronManager.init()` schedules:

| Schedule | Jobs |
| --- | --- |
| Every 10 seconds | SePay subscription payment check, wallet bank sync |
| Every minute | Personal debt alerts/domino risk, market sentiment change check, invoice expiry, referral rewards |
| Daily 00:05 | Expired subscriptions, personal soft-delete purge |
| Daily 00:01 Asia/Ho_Chi_Minh | Enterprise overdue job |
| Daily 00:05 Asia/Ho_Chi_Minh | Enterprise penalty job |
| Daily 07:00 Asia/Ho_Chi_Minh | Enterprise notification job |
| Monday 08:00 Asia/Ho_Chi_Minh | Enterprise weekly report job |

## Shared Packages

| Package | Current role |
| --- | --- |
| `@repo/agentic` | Chat orchestration, router, workers, tools, memory, RAG, typed SSE, UI signals |
| `@repo/financial-core` | Personal financial formulas plus enterprise repayment schedule generation |
| `@repo/ui` | Shared UI primitives and auth widgets |
| `@repo/auth` | Permission map/helper foundation; most active API auth still uses local middleware |
| `@repo/types` | Shared enterprise interfaces and generic API response types; partial coverage |
| `@repo/eslint-config` | Shared ESLint configs |
| `@repo/typescript-config` | Shared TS configs |

## External Services And Env

Common server env keys:

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

GOOGLE_CLIENT_ID=
FACEBOOK_APP_ID=
NEWS_API_KEY=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_PASSWORD=
EMAIL_FROM=
SEPAY_API_TOKEN=
SEPAY_BANK_ACCOUNT=
SEPAY_BANK_NAME=
AFFILIATE_COMMISSION_RATE=
API_KEY_FPT_AI=
API_KEY_BANKLOOKUP_KEY=
API_KEY_BANKLOOKUP_SECRET=
```

Frontend env:

```env
VITE_API_URL=/api
VITE_API_PROXY=http://127.0.0.1:5001
VITE_COMMISSION_RATE=
```

Docker compose contains development defaults and secrets; do not treat them as production-safe.

## Coding Standards For This Repo

- Keep changes scoped to the active app/package/domain.
- Protected personal endpoints must use `authenticate` and scope queries by `req.userId`.
- Enterprise queries must scope by `req.organizationId`.
- Never expose password hashes, social IDs, 2FA secrets, backup codes, tokens, or raw trust tokens in JSON responses.
- Preserve personal response envelope `{ success, data/error }` unless the endpoint is SSE, multipart, or binary export.
- Enterprise response shapes are mixed; follow the active controller/hook contract before normalizing.
- Use `apps/api/src/lib/prisma.ts` for personal data and `apps/api/src/prisma/enterprise.client.ts` for enterprise data.
- Respect personal Debt soft delete. Use `includeDeleted` only for trash/detail/restore/audit flows.
- Invalidate Redis caches after mutations that affect cached user, investment, or market data.
- External API failures should degrade through cache, fallback data, or empty results when possible.
- AI tools/workers must not mutate financial records without explicit UI confirmation.
- Put financial math in `@repo/financial-core` or focused backend services/utilities, not duplicated across pages/controllers.
- Frontend mutations should invalidate TanStack Query keys or refresh local state and show concise Sonner feedback.

## Known Sharp Edges

- Generated outputs such as `dist`, `.turbo`, nested `node_modules`, `server_error.log`, and `tsc_errors.log` should not be edited.
- Many source comments/user-facing strings display mojibake in PowerShell. Avoid broad text rewrites unless the task is explicitly about encoding/content.
- `README.md` and `docs/AI_PROJECT_CONTEXT.md` describe older layouts and should not be used as source of truth.
- Personal and enterprise web apps share `localStorage.finsight_token`.
- `apps/web-enterprise` contains copied personal files/hooks. Active enterprise pages mostly use `enterpriseAuthAPI`, `useAnalytics`, `useNotifications`, and `useRepaymentPlanner`.
- Enterprise Socket.IO handling is copied from personal web and does not expose enterprise-specific realtime events.
- `apps/web-enterprise/src/api/agentic.ts` only parses legacy `data:` SSE frames, while the active API sends named SSE events; no enterprise chat UI is currently mounted.
- `apps/web/src/api/index.ts` contains `subscriptionAPI.getPlans()` and `subscriptionAPI.checkStatus()` wrappers, but the backend currently mounts no `/api/subscription/plans` or `/api/subscription/invoice/:id/status` routes.
- `CLIENT_URL` defaults to personal web (`http://localhost:5173`); enterprise CORS/Socket.IO deployments may need explicit env config.
- Docker compose starts only personal web. Enterprise web must be run separately.
- `apps/web-enterprise/Dockerfile` currently points to `/app/apps/web` and exposes `5173`, so it does not build/run the enterprise app as written.
- API Dockerfile does not run the API `db:generate`/`db:push` scripts that include enterprise Prisma.
- Root `bun run check-types` points at a non-existent Turbo task name; use `bunx turbo run type-check` or app/package `bun run type-check`.
- `@repo/auth` and `@repo/types` are partial foundations, not complete authority over runtime auth/types.
- Some API TypeScript imports omit explicit `.js` extensions despite ESM settings. Avoid large import-extension refactors unless the task is type-check cleanup.
- Agentic Graph V2 feature flags described in older docs are stale. Current `runAgenticChat` always uses the memory/router/worker pipeline.
