# Test Plan — Quản lý Nợ Doanh nghiệp
> App: `apps/web-enterprise` · Port: **5174** · API base: `/v1/enterprise`  
> Cập nhật: 2026-05-05 | Tất cả bugs đã fix trước khi test

---

## Mục lục
1. [Kiến trúc & Auth](#1-kiến-trúc--auth)
2. [Vòng đời khoản nợ (State Machine)](#2-vòng-đời-khoản-nợ-state-machine)
3. [Phân tích luồng từng tính năng](#3-phân-tích-luồng-từng-tính-năng)
4. [So khớp BE vs FE](#4-so-khớp-be-vs-fe)
5. [Test Cases chi tiết](#5-test-cases-chi-tiết)
6. [Cron Jobs](#6-cron-jobs)
7. [Checklist Demo](#7-checklist-demo)
8. [Debug nhanh](#8-debug-nhanh)

---

## 1. Kiến trúc & Auth

```
apps/web-enterprise (React/Vite)  →  port 5174
  proxy /api  →  apps/api (Express)  →  port 5001
    /v1/enterprise/debts/*
    /v1/enterprise/analytics/*
    /v1/enterprise/repayment-planner/*
    /v1/enterprise/jobs/*
  Prisma  →  PostgreSQL (schema: enterprise)
```

**Auth**: JWT Bearer token. Middleware `authenticate` inject `req.organizationId` + `req.userId` vào mọi request.  
Token lưu trong `localStorage` ở FE.

---

## 2. Vòng đời khoản nợ (State Machine)

```
[Tạo mới]
     ↓
  DRAFT ────── activate() ──────────────→ ACTIVE
                                              │
          ┌───────────────────────────────────┤
          │ cron runOverdueJob (00:01 GMT+7)  │ (sau khi ghi nhận thanh toán)
          ↓                                   ↓
       OVERDUE ◄──────────────────────── PARTIAL
          │
    dispute(reason) ◄─── từ ACTIVE / PARTIAL / OVERDUE
          ↓
      DISPUTED
          │
      resolve() ──→ tự động tính:
          │           outstanding = 0            → PAID
          │           dueDate < hôm nay          → OVERDUE
          │           dueDate còn hạn + có pay   → PARTIAL
          │           dueDate còn hạn + chưa pay → ACTIVE
          │
    write-off(reason) ◄─── từ BẤT KỲ status
          ↓
     WRITTEN_OFF

    (thanh toán đủ outstanding trong createPayment)
          ↓
        PAID
```

### Quy tắc chuyển trạng thái

| Transition | Ai kích hoạt | Điều kiện BE |
|---|---|---|
| DRAFT → ACTIVE | Thủ công (activate) | status phải = DRAFT |
| ACTIVE/PARTIAL → OVERDUE | Cron tự động | dueDate < hôm nay |
| * → DISPUTED | Thủ công | Bắt buộc có `reason` |
| DISPUTED → ? | Thủ công (resolve) | status phải = DISPUTED, tự tính newStatus |
| * → WRITTEN_OFF | Thủ công | Bắt buộc có `reason` |
| * → PAID | Tự động | outstanding giảm về 0 sau payment |

---

## 3. Phân tích luồng từng tính năng

### 3.1 Tạo khoản nợ — `POST /v1/enterprise/debts`

**FE:** `DebtCreatePage.tsx` → `/debts/new`

**Luồng BE:**
1. Validate: `principal > 0`, `termMonths > 0`
2. method = NONE nhưng rate > 0 → lỗi
3. type = **RECEIVABLE**: kiểm tra credit limit — tổng outstanding hiện tại + principal mới > `party.creditLimit` → lỗi 400
4. Tạo `DebtRecord`: status = **DRAFT**, outstanding = principal
5. Gọi `generateSchedule()` → sinh toàn bộ `DebtSchedule` rows
6. Gửi notification đến personInCharge

**4 phương pháp lãi:**

| Method | Gốc mỗi kỳ | Lãi mỗi kỳ |
|---|---|---|
| `REDUCING_BALANCE` | Đều (principal ÷ termMonths) | Tính trên số dư giảm dần |
| `EMI` | Tăng dần | Tổng mỗi kỳ bằng nhau (EMI cố định) |
| `BULLET` | 0 (kỳ 1→n-1), toàn bộ gốc (kỳ n) | Tính trên toàn bộ gốc mỗi kỳ |
| `NONE` | Đều | 0 |

**Lãi suất thả nổi:** Mảng `interestRates[{rate, effectiveDate}]` — kỳ nào rơi sau `effectiveDate` thì dùng rate đó.

---

### 3.2 Thanh toán — `POST /v1/enterprise/debts/:id/transactions`

**FE:** `RecordPaymentModal.tsx`  
**FE validate trước:** `amount ≤ debt.outstanding + debt.unpaidPenalty`

**Waterfall phân bổ (Penalty → Interest → Principal):**

```
Số tiền nhận được
  Bước 1 → Trả phạt tích lũy chưa trả (unpaidPenalty)
  Bước 2 → Trả lãi chưa trả từ các kỳ schedule (pendingInterest)
  Bước 3 → Trả gốc còn lại (outstanding)
```

**Kết quả ghi nhận:**
- `DebtTransaction` mới: `principalPart` + `interestPart` + `penaltyPart` đều có giá trị
- `DebtSchedule`: cập nhật `paidPrincipal` + `paidInterest` từ kỳ cũ nhất trước
- `DebtRecord.outstanding` = outstanding cũ − principalToPay
- `DebtRecord.status` → PAID nếu outstanding = 0, ngược lại PARTIAL

---

### 3.3 Đảo ngược giao dịch — `POST /v1/enterprise/debts/transactions/:transactionId/reverse`

**FE:** Nút đảo ngược trong bảng transactions của `DebtDetailPage.tsx`  
**Điều kiện:** Transaction chưa bị reverse trước đó

**Luồng BE:**
1. Hoàn lại `paidPrincipal` + `paidInterest` trên schedules (từ kỳ muộn nhất → cũ nhất)
2. Tạo REVERSAL transaction: amount âm, principalPart âm, interestPart âm, penaltyPart âm
3. `outstanding` = outstanding + principalPart của transaction gốc
4. Gửi notification IMPORTANT

---

### 3.4 Các thao tác trạng thái

**FE:** `DebtStatusActions.tsx` — render button theo status hiện tại:

| Status | Buttons hiển thị |
|---|---|
| DRAFT | "Kích hoạt khoản nợ" |
| ACTIVE / PARTIAL / OVERDUE | "Ghi nhận thanh toán" + "Báo tranh chấp" + "Xóa nợ" |
| DISPUTED | "Giải quyết tranh chấp" |
| PAID / WRITTEN_OFF | *(không có button nào)* |

---

### 3.5 Kế hoạch Trả nợ — `POST /v1/enterprise/repayment-planner/simulate`

**FE:** `RepaymentPlanner.tsx` → `/repayment-planner`  
**Chỉ áp dụng cho PAYABLE** (type = PAYABLE, status = ACTIVE/PARTIAL/OVERDUE)

**4 chiến lược:**

| Chiến lược | Ưu tiên theo |
|---|---|
| AVALANCHE | Lãi suất thực tế cao nhất |
| SNOWBALL | Dư nợ nhỏ nhất |
| OVERDUE_FIRST | OVERDUE trước; trong OVERDUE: TAX(1) → FINANCIAL(2) → TRADE(3); cùng loại → overdue lâu hơn trước |
| COVENANT_RISK | Risk score: OVERDUE+FINANCIAL(+10), OVERDUE+TAX(+8), sắp hạn 7 ngày(+6), gần D/E limit(+5), số ngày overdue(+1/10 ngày) |

**Cảnh báo tự động:**
- **DANGER — Debt trap**: `plannedAmount ≤ monthlyInterest + penalty` → nợ không bao giờ giảm được
- **DANGER — D/E covenant**: `totalDebt / equity > org.maxDebtToEquity`
- **WARNING — Budget thấp**: ngân sách < tổng lãi+phạt tháng → dư nợ tổng vẫn tăng
- **WARNING — Excluded overdue**: có OVERDUE bị loại khỏi kế hoạch

**Response shape (raw, KHÔNG wrap):** `{ debts[], summary{}, alerts[] }`

---

### 3.6 Analytics Dashboard — `/home`

**FE:** `DashboardPage/index.tsx`  
**4 API gọi song song (Promise.all):**

| API | Response shape | FE đọc |
|---|---|---|
| `GET /analytics/summary` | `{receivable, payable, health}` | `response.data` → `setSummary()` |
| `GET /analytics/action-items` | `[{type, priority, message, debtId, amount}]` | `response.data` |
| `GET /analytics/cash-flow` | `[{date, in, out, net}]` (30 ngày) | `response.data` |
| `GET /analytics/aging?type=RECEIVABLE` | `[{partyName, buckets, total, provision}]` | `response.data` |

> **Lưu ý:** Analytics trả **raw** (không wrap `{success, data}`), khác với tất cả `/debts/*` endpoints wrap đầy đủ.

**Aging Report buckets & provision:**

| Bucket | Provision |
|---|---|
| Hiện tại (chưa quá hạn) | 0% |
| 1–30 ngày | 0% |
| 31–90 ngày | 10% |
| 91–180 ngày | 30% |
| 181–360 ngày | 50% |
| > 360 ngày | 100% |

**Action Items priority:**
1. PAYABLE_OVERDUE
2. PAYABLE_DUE_SOON (trong 3 ngày)
3. RECEIVABLE_OVERDUE
4. RECEIVABLE_DUE_TODAY
5. DISPUTE

---

## 4. So khớp BE vs FE

### Bugs đã fix — hoạt động đúng

| # | Vấn đề | File đã sửa |
|---|---|---|
| BUG-E | Route `/transactions/:id/reverse` bị Express match nhầm vào `/:id/transactions` → reversal không hoạt động | `debt.routes.ts` |
| BUG-1 | `guarantorId: ""` / `personInChargeId: ""` thay vì `null` → lỗi FK constraint | `DebtCreatePage.tsx` |
| BUG-2 | Repayment planner: BE trả raw, FE đọc `response.data` → **đúng rồi**, không cần fix | — |
| BUG-3 | Cột "Còn thiếu" bỏ qua `interestAmount - paidInterest` | `DebtDetailPage.tsx` |
| BUG-4 | `resolveDispute` trả PARTIAL thay vì ACTIVE khi chưa có payment | `debtStatus.service.ts` |
| BUG-5 | Reversal thiếu `interestPart` + không hoàn `paidInterest` trên schedules | `transaction.service.ts` |
| BUG-6 | `useAnalytics` đọc `err.response.data.message` trong khi BE trả `{ error }` | `useAnalytics.ts` |
| BUG-7 | `DebtAuditTrail` gọi `setLogs(res.data.data)` không check `success` trước | `DebtAuditTrail.tsx` |
| BUG-8 | `analytics.controller` error handler dùng `{ message }` thay vì `{ error }` | `analytics.controller.ts` |

### Behavior cần biết khi test

| # | Vấn đề | Ghi chú |
|---|---|---|
| INFO-1 | DebtListPage không dùng server filter | FE filter client-side — ổn với data nhỏ |
| INFO-2 | Stats card tính cả DRAFT debts | DRAFT có outstanding = principal → có thể inflate số tổng |
| INFO-3 | RecordPaymentModal text waterfall hiện "Phạt → Gốc" | Thực tế là "Phạt → **Lãi** → Gốc" — UI text chưa cập nhật |
| INFO-4 | DISPUTED không có nút "Xóa nợ" | BE cho phép write-off từ bất kỳ status, FE chưa render nút khi DISPUTED |

---

## 5. Test Cases chi tiết

> ✅ Expected pass | ❌ Expected fail/lỗi | ⚠️ Cần chú ý kết quả

---

### SUITE 1 — Tạo khoản nợ · `/debts/new`

#### TC-01 · RECEIVABLE · REDUCING_BALANCE · Happy path
**Precondition:** Đã login, có party trong hệ thống

**Steps:**
1. Type = RECEIVABLE, chọn party, Origin = TRADE
2. Principal = 100,000,000đ, termMonths = 12
3. interestMethod = REDUCING_BALANCE, rate = 12%/năm
4. penaltyRate = 0.001 (0.1%/ngày), gracePeriodDays = 3
5. personInCharge = chọn nhân viên, internalCode = `TC-01`
6. Submit

**Expected:** ✅
- `POST /v1/enterprise/debts` → 201
- Debt: status=DRAFT, outstanding=100,000,000
- 12 schedules được tạo
- Kỳ 1: interestAmount = 1,000,000đ, principalAmount ≈ 8,333,333đ
- Chuyển về `/debts`, badge DRAFT hiển thị

---

#### TC-02 · PAYABLE · EMI
**Steps:** Type = PAYABLE, method = EMI, APR = 8%, 12 tháng, principal = 60,000,000đ → Submit

**Expected:** ✅ Mỗi kỳ `totalAmount` bằng nhau (EMI cố định)

---

#### TC-03 · BULLET loan
**Steps:** method = BULLET, 6 tháng, principal = 50,000,000đ, rate = 10% → Submit

**Expected:** ✅
- Kỳ 1–5: `principalAmount = 0`, `interestAmount ≈ 416,667đ`
- Kỳ 6: `principalAmount = 50,000,000đ`, `interestAmount ≈ 416,667đ`

---

#### TC-04 · NONE interest
**Steps:** method = NONE → Submit

**Expected:** ✅ Tất cả kỳ `interestAmount = 0`

---

#### TC-05 · Credit limit exceeded (RECEIVABLE)
**Precondition:** Party có `creditLimit = 50M`, outstanding hiện tại 40M

**Steps:** Tạo RECEIVABLE mới principal = 20,000,000đ → Submit

**Expected:** ❌ 400 — "Vượt hạn mức tín dụng..."

---

#### TC-06 · Không chọn guarantor / personInCharge *(BUG-1 đã fix)*
**Steps:** Để trống cả 2 dropdown → Submit

**Expected:** ✅ Tạo thành công, `guarantorId = null`, `personInChargeId = null`

> Trước fix: lỗi FK constraint ❌

---

#### TC-07 · method = NONE nhưng rate > 0
**Steps:** method = NONE, rate = 5% → Submit

**Expected:** ❌ 400 — "Nếu có nhập lãi suất, phương thức tính lãi không được là Không tính lãi"

---

#### TC-08 · termMonths = 0
**Expected:** ❌ 400 — "Thời hạn (số tháng) phải lớn hơn 0"

---

#### TC-09 · Floating rate (lãi suất thả nổi)
**Steps:** 2 dòng interestRates: rate=8% effectiveDate=hôm nay; rate=10% effectiveDate=7 tháng sau; termMonths=12

**Expected:** ✅ Kỳ 1–6 dùng 8%, kỳ 7–12 dùng 10%

---

### SUITE 2 — Danh sách khoản nợ · `/debts`

#### TC-10 · Tabs filter
**Steps:** Tab "Tất cả" / "Phải thu" / "Phải trả" / "Rủi ro"

**Expected:** ✅ Filter client-side đúng theo type/status

---

#### TC-11 · Search theo internalCode / tên party
**Expected:** ✅ Hiện đúng record matching

---

#### TC-12 · Stats card ⚠️
**Precondition:** 1 DRAFT (100M) + 1 ACTIVE (80M) RECEIVABLE

**Expected:** ⚠️ Tổng Phải Thu có thể = 180M (tính cả DRAFT) — behavior hiện tại, không phải bug

---

### SUITE 3 — Chi tiết khoản nợ · `/debts/:id`

#### TC-13 · Xem đầy đủ thông tin
**Expected:** ✅
- Header: internalCode, party.name, badge status
- Stats: outstanding, unpaidPenalty, principal, interestMethod
- Bảng schedules: period / dueDate / principalAmount / interestAmount / totalAmount / status / "Còn thiếu"
- Bảng transactions: type / amount / 3 parts (principal+interest+penalty) / balanceSnapshot / paidAt
- Audit trail nếu có
- Buttons đúng theo status

---

#### TC-14 · Cột "Còn thiếu" tính cả gốc + lãi *(BUG-3 đã fix)*
**Precondition:** Kỳ 1: principalAmount=8.3M, interestAmount=1M, paidPrincipal=2M, paidInterest=0

**Expected:** ✅ "Còn thiếu" = (8.3M − 2M) + (1M − 0) = **7.3M**

> Trước fix: hiện 6.3M ❌

---

#### TC-15 · Audit trail
**Precondition:** Đã có ít nhất 1 status transition

**Expected:** ✅ Timeline mới nhất trên cùng, có user.fullName / reason / outstandingSnapshot

---

### SUITE 4 — Kích hoạt · DRAFT → ACTIVE

#### TC-16 · Kích hoạt thành công
**Precondition:** Debt DRAFT

**Steps:** Nhấn "Kích hoạt khoản nợ"

**Expected:** ✅
- status = ACTIVE
- Audit log: DRAFT → ACTIVE
- Buttons chuyển sang: "Ghi nhận thanh toán" + "Báo tranh chấp" + "Xóa nợ"

---

#### TC-17 · Không kích hoạt được nếu không phải DRAFT
**Expected:** ❌ 400 — "Không hợp lệ"

---

### SUITE 5 — Thanh toán

#### TC-18 · Thanh toán không có penalty
**Precondition:** Debt ACTIVE, outstanding = 100M, không có PENALTY transactions

**Steps:** amount = 9,333,333đ, method = BANK_TRANSFER

**Expected:** ✅
- `principalPart ≈ 8.33M`, `interestPart ≈ 1M`, `penaltyPart = 0`
- Tổng 3 parts = amount
- `debt.status = PARTIAL`
- Schedule kỳ 1: paidPrincipal + paidInterest cập nhật đúng

---

#### TC-19 · Thanh toán có penalty — waterfall 3 bước
**Precondition:** Debt OVERDUE, outstanding = 50M, unpaidPenalty = 200,000đ

**Steps:** amount = 5,000,000đ

**Expected:** ✅
- `penaltyPart = 200,000đ` (trả hết penalty trước)
- `interestPart = X` (lãi kỳ từ schedule)
- `principalPart = 5,000,000 − 200,000 − X`
- **Kiểm tra:** `penaltyPart + interestPart + principalPart = 5,000,000đ` (tổng khớp)

---

#### TC-20 · Thanh toán toàn bộ → PAID
**Precondition:** Debt PARTIAL, outstanding = 10M

**Steps:** amount = outstanding + toàn bộ lãi còn lại

**Expected:** ✅
- `debt.status = PAID`
- `outstanding = 0`
- Tất cả schedules status = PAID

---

#### TC-21 · Validation — amount > outstanding + penalty
**Expected:** ❌ FE: "Số tiền thanh toán không được vượt quá tổng nghĩa vụ"

---

#### TC-22 · Validation — amount = 0
**Expected:** ❌ FE: "Số tiền thanh toán phải lớn hơn 0"

---

### SUITE 6 — Đảo ngược giao dịch

#### TC-23 · Đảo ngược PAYMENT thành công *(BUG-E + BUG-5 đã fix)*
**Precondition:** Debt PARTIAL, có ít nhất 1 PAYMENT transaction

**Steps:** Nhấn nút đảo ngược trên transaction row → nhập reason

**Expected:** ✅
- URL trong Network: `/v1/enterprise/debts/transactions/:id/reverse` (không phải `/:id/transactions`)
- REVERSAL transaction: amount âm, 3 parts âm
- `debt.outstanding` khôi phục đúng
- Schedule: `paidPrincipal` + `paidInterest` được hoàn lại

---

#### TC-24 · Không đảo ngược 2 lần
**Expected:** ❌ 400 — "Giao dịch này đã được đảo ngược trước đó"

---

#### TC-25 · Không đảo ngược của org khác
**Expected:** ❌ 400 — "Không có quyền đảo ngược giao dịch này"

---

### SUITE 7 — Tranh chấp & Giải quyết

#### TC-26 · Báo tranh chấp từ ACTIVE
**Steps:** Nhấn "Báo tranh chấp" → nhập reason

**Expected:** ✅
- status = DISPUTED
- Audit log: ACTIVE → DISPUTED, reason được lưu
- Notification gửi đến personInCharge
- Chỉ còn button "Giải quyết tranh chấp"

---

#### TC-27 · Resolve → ACTIVE *(BUG-4 đã fix)*
**Precondition:** DISPUTED, **chưa có payment nào**, dueDate còn 3 tháng

**Expected:** ✅ status = ACTIVE

> Trước fix: trả PARTIAL ❌

---

#### TC-28 · Resolve → PARTIAL
**Precondition:** DISPUTED, **đã có payment**, dueDate chưa qua

**Expected:** ✅ status = PARTIAL

---

#### TC-29 · Resolve → OVERDUE
**Precondition:** DISPUTED, dueDate **đã qua**

**Expected:** ✅ status = OVERDUE

---

#### TC-30 · Resolve → PAID
**Precondition:** DISPUTED, outstanding = 0

**Expected:** ✅ status = PAID

---

### SUITE 8 — Xóa nợ (Write-Off)

#### TC-31 · Write-off thành công
**Steps:** Debt OVERDUE → nhấn "Xóa nợ" → nhập reason

**Expected:** ✅
- status = WRITTEN_OFF
- Audit log + notification URGENT
- Tất cả button ẩn

---

#### TC-32 · Write-off không có reason
**Expected:** ❌ 400 — "Cần cung cấp lý do xóa nợ"

---

### SUITE 9 — Kế hoạch Trả nợ · `/repayment-planner`

> **Lưu ý:** Planner chỉ chạy cho **PAYABLE** (type=PAYABLE, status=ACTIVE/PARTIAL/OVERDUE).  
> Nếu không có PAYABLE nào thì `result.debts = []`.

#### TC-33 · Simulate AVALANCHE
**Steps:** Budget = 50M, strategy = AVALANCHE → "Tính toán"

**Expected:** ✅
- `result.debts[]`: debtName / partyName / outstanding / plannedAmount / priority / reason / monthsToPayoff
- Debt APR cao nhất → priority = 1
- `result.summary.totalBudget = 50M`
- Alerts nếu có debt trap hoặc D/E vượt ngưỡng

---

#### TC-34 · OVERDUE_FIRST — thứ tự ưu tiên
**Precondition:** Có OVERDUE TAX + OVERDUE FINANCIAL + OVERDUE TRADE

**Expected:** ✅ TAX(1) → FINANCIAL(2) → TRADE(3)

---

#### TC-35 · Debt trap cảnh báo
**Precondition:** Budget < tổng lãi + phạt tháng

**Expected:** ✅ Alert DANGER "Phát hiện X khoản nợ đang rơi vào Bẫy nợ"

---

#### TC-36 · Exclude debt khỏi kế hoạch
**Steps:** Tick exclude 1 debt OVERDUE → Simulate

**Expected:** ✅
- Debt excluded không có trong `result.debts`
- Alert WARNING về excluded overdue debt

---

#### TC-37 · Commit plan
**Steps:** Sau simulate → nhập tên plan → "Lưu kế hoạch"

**Expected:** ✅ `POST .../repayment-planner/commit` → 201, toast "Đã lưu kế hoạch"

---

### SUITE 10 — Analytics Dashboard · `/home`

#### TC-38 · Dashboard load đủ 4 section
**Steps:** Vào `/home`

**Expected:** ✅
- 4 KPI cards: Tổng Phải Thu / Tổng Phải Trả / Tổng Quá Hạn / Sắp Đến Hạn
- D/E bar: ratio / maxDebtToEquity (đỏ nếu vượt ngưỡng)
- CashFlow chart (30 ngày)
- ActionItems tối đa 10 items, đúng thứ tự priority
- AgingReport (RECEIVABLE)

---

#### TC-39 · Action items đúng thứ tự priority
**Expected:** ✅ PAYABLE_OVERDUE → PAYABLE_DUE_SOON → RECEIVABLE_OVERDUE → RECEIVABLE_DUE_TODAY → DISPUTE

---

#### TC-40 · Aging report buckets
**Precondition:** Có OVERDUE debt với `overdueSince` 60 ngày trước

**Expected:** ✅ Debt xuất hiện bucket "31–90 ngày", provision = outstanding × 10%

---

## 6. Cron Jobs

> Trigger thủ công qua API: `POST /v1/enterprise/jobs/run-overdue` | `run-penalty` | `run-notify`

### Lịch chạy & Idempotency

| Job | Giờ (GMT+7) | Idempotency field |
|---|---|---|
| `runOverdueJob` | 00:01 | `lastOverdueCheckDate` |
| `runPenaltyJob` | 00:05 | `lastPenaltyDate` |
| `runNotificationJob` | 07:00 | Gửi tại milestone cụ thể |
| `runReportingJob` | 08:00 thứ 2 | — |

### Penalty rate mặc định (khi `penaltyRate = 0` trên DebtRecord)

| Origin | Rate/ngày |
|---|---|
| FINANCIAL | 0.03% |
| TAX | 0.03% |
| TRADE | 0.1% |
| BOND | 0.05% |
| INTERNAL | 0% |

### TC-41 · runOverdueJob — ACTIVE → OVERDUE
**Precondition:** Debt ACTIVE, dueDate = hôm qua

**Expected:** ✅
- status = OVERDUE, overdueSince = hôm nay
- Audit log: `triggeredBy = "SYSTEM/JOB_OVERDUE"`
- **Idempotency:** Trigger lại → `lastOverdueCheckDate` đã set → bỏ qua, không xử lý lại

---

### TC-42 · runPenaltyJob — tạo PENALTY daily
**Precondition:** Debt OVERDUE, gracePeriodDays = 0

**Expected:** ✅
- 1 PENALTY transaction: `amount = outstanding × penaltyRate`
- `outstanding` **KHÔNG thay đổi** (penalty là nghĩa vụ phụ, không giảm gốc)
- **Idempotency:** Trigger lại trong ngày → bỏ qua

---

### TC-43 · Grace period — chưa tính penalty
**Precondition:** Debt OVERDUE, gracePeriodDays = 5, overdueSince = 3 ngày trước

**Expected:** ✅ KHÔNG tạo PENALTY (còn trong grace period = 5 ngày)

---

### TC-44 · runOverdueJob Group B — kéo từ schedule level
**Precondition:** Debt ACTIVE multi-period, DebtSchedule kỳ 1 status=PENDING, dueDate đã qua

**Expected:** ✅
- DebtSchedule kỳ 1: status=OVERDUE, isOverdue=true
- DebtRecord: status=OVERDUE (kéo theo từ schedule)

---

### TC-45 · runNotificationJob — milestone T-30
**Precondition:** Debt có dueDate = 30 ngày nữa, có personInCharge

**Expected:** ✅ 1 notification: "Sắp đến hạn", priority=NORMAL

---

### TC-46 · runNotificationJob — overdue 7 ngày → escalation
**Precondition:** Debt OVERDUE, overdueSince = 7 ngày trước

**Expected:** ✅
- Notification: "QUÁ HẠN 7 NGÀY", priority=URGENT
- Gửi đến cả ADMIN/MANAGER/CFO/CEO của org

---

## 7. Checklist Demo

| # | Chức năng | Kết quả |
|---|---|---|
| ☐ | Tạo RECEIVABLE + preview schedule đúng theo method | |
| ☐ | Tạo PAYABLE EMI + tổng mỗi kỳ bằng nhau | |
| ☐ | Activate DRAFT → ACTIVE | |
| ☐ | Record payment: 3 parts khớp (penaltyPart + interestPart + principalPart = amount) | |
| ☐ | Reverse transaction hoạt động (URL đúng, outstanding khôi phục đúng) | |
| ☐ | Dispute từ ACTIVE → resolve về ACTIVE (khi chưa có payment) | |
| ☐ | Write-off + audit trail đầy đủ | |
| ☐ | Analytics dashboard: 4 cards + D/E bar + chart + aging | |
| ☐ | Repayment Planner: simulate AVALANCHE + xem alert + commit | |
| ☐ | Cron job trigger thủ công → kiểm tra idempotency (chạy 2 lần không duplicate) | |

---

## 8. Debug nhanh

### Dashboard trắng / không có data
```
DevTools → Network → /analytics/summary
Response shape đúng: { receivable, payable, health }  ← raw, KHÔNG wrap {success, data}
Nếu lỗi 500: error field là { error: "..." }
```

### Reverse transaction 404
```
DevTools → Network → URL phải là:
/v1/enterprise/debts/transactions/:id/reverse
Nếu vẫn 404 → kiểm tra debt.routes.ts: route /transactions/:id/reverse có ở TRƯỚC /:id/transactions không
```

### Payment waterfall sai
```
Kiểm tra response: principalPart + interestPart + penaltyPart phải = amount
Nếu interestPart = 0 dù có lãi → kiểm tra debt.schedules có interestAmount > 0 không?
Nếu penaltyPart = 0 dù có unpaidPenalty → kiểm tra unpaidPenalty tính từ PENALTY transactions
```

### Repayment Planner không hiện kết quả
```
Kiểm tra: có PAYABLE nào status ACTIVE/PARTIAL/OVERDUE không?
  → Planner CHỈ chạy cho PAYABLE, RECEIVABLE không xuất hiện
Response shape: { debts, summary, alerts }  ← raw, KHÔNG wrap
```

### Notification không gửi
```
personInChargeId của debt hoặc party phải có giá trị (không null)
Nếu null: job vẫn chạy nhưng recipients = rỗng → không gửi
Kiểm tra ESCALATION: overdueDays >= 7 → gửi thêm ADMIN/MANAGER/CFO/CEO
```

### Cron không chạy đúng giờ
```
Cron dùng timezone Asia/Ho_Chi_Minh (GMT+7)
runOverdueJob: 00:01 | runPenaltyJob: 00:05 | runNotificationJob: 07:00
Trigger thủ công: POST /v1/enterprise/jobs/run-overdue (cần auth)
```

---

*Đang test đến TC nào thì hỏi, tôi giải thích hoặc debug cùng ngay.*
