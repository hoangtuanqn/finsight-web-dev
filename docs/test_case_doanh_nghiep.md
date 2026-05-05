# Bộ Test Data — 8 Module Quản Lý Nợ Doanh Nghiệp

> Base URL: `http://localhost:5001/api/v1/enterprise`  
> Tất cả request (trừ auth) cần header: `Authorization: Bearer <token>`

---

## BƯỚC 0 — Lưu biến sau mỗi bước

| Biến | Lấy từ |
|---|---|
| `TOKEN` | Login response → `data.token` |
| `USER_ID` | Login response → `data.enterpriseUser.id` |
| `ORG_ID` | Login response → `data.enterpriseUser.organizationId` |
| `PARTY_ID_1/2/3` | Create party response → `data.id` |
| `DEBT_ID_1/2/3` | Create debt response → `data.id` |
| `TX_ID_1` | Record payment response → `data.id` |
| `NOTIF_ID` | GET notifications → `[0].id` |

---

## MODULE 1 — Auth

### 1.1 Đăng ký
```
POST /auth/register
```
```json
{
  "email": "lam.hoang.an@cty-alpha.vn",
  "password": "Test@123456",
  "taxCode": "0312345678",
  "name": "Công ty TNHH Alpha Thương Mại",
  "shortName": "Alpha TM",
  "businessType": "Thương mại - Phân phối",
  "headquartersAddress": "123 Nguyễn Huệ, Quận 1, TP.HCM",
  "fullName": "Lâm Hoàng An",
  "roleTitle": "CEO",
  "phoneNumber": "0901234567"
}
```
✅ `201` — `{ success: true, data: { token, enterpriseUser: { id, organizationId } } }`

### 1.2 Đăng nhập
```
POST /auth/login
```
```json
{
  "email": "lam.hoang.an@cty-alpha.vn",
  "password": "Test@123456"
}
```
✅ `200` — lưu `TOKEN`

### 1.3 Lấy thông tin user
```
GET /auth/me
```
✅ `{ success: true, data: { user: { fullName, roleTitle, organization } } }`

---

## MODULE 2 — Party Management

### 2.1 Tạo đối tác khách hàng (RECEIVABLE)
```
POST /parties
```
```json
{
  "taxCode": "0987654321",
  "name": "Công ty Cổ phần Beta Xây Dựng",
  "shortName": "Beta XD",
  "internalCode": "KH-001",
  "typeTags": ["CUSTOMER"],
  "creditLimit": 2000000000,
  "isRelatedParty": false,
  "contacts": [
    {
      "name": "Nguyễn Văn Bình",
      "position": "Giám đốc Tài chính",
      "email": "binh.nguyen@beta-xd.vn",
      "phone": "0912345678",
      "isPrimary": true
    }
  ],
  "bankAccounts": [
    {
      "bankName": "Vietcombank",
      "accountNumber": "0071001234567",
      "accountHolder": "CONG TY CP BETA XAY DUNG",
      "branch": "Chi nhánh Quận 1"
    }
  ]
}
```
✅ `201` — `status: "ACTIVE"` → lưu `PARTY_ID_1`

### 2.2 Tạo đối tác ngân hàng (PAYABLE - lãi suất cao)
```
POST /parties
```
```json
{
  "taxCode": "0100112437",
  "name": "Ngân hàng TMCP Vietcombank",
  "shortName": "VCB",
  "internalCode": "NH-001",
  "typeTags": ["BANK"],
  "creditLimit": 0,
  "isRelatedParty": false,
  "contacts": [
    {
      "name": "Trần Thị Cúc",
      "position": "Chuyên viên Tín dụng",
      "email": "cuc.tran@vcb.com.vn",
      "phone": "0923456789",
      "isPrimary": true
    }
  ]
}
```
✅ `201` → lưu `PARTY_ID_2`

### 2.3 Tạo đối tác nhà cung cấp (PAYABLE - quá hạn)
```
POST /parties
```
```json
{
  "taxCode": "0312999888",
  "name": "Công ty TNHH Gamma Cung Ứng",
  "shortName": "Gamma CU",
  "internalCode": "NCC-001",
  "typeTags": ["SUPPLIER"],
  "creditLimit": 500000000,
  "isRelatedParty": false,
  "contacts": [
    {
      "name": "Lê Minh Đức",
      "position": "Trưởng phòng Kinh doanh",
      "email": "duc.le@gamma-cu.vn",
      "phone": "0934567890",
      "isPrimary": true
    }
  ]
}
```
✅ `201` → lưu `PARTY_ID_3`

### 2.4 Lấy danh sách + lọc
```
GET /parties
GET /parties?status=ACTIVE
```
✅ 3 đối tác vừa tạo

### 2.5 Cập nhật hạn mức tín dụng
```
PATCH /parties/<PARTY_ID_1>
```
```json
{ "creditLimit": 3000000000 }
```
✅ `creditLimit` cập nhật thành công

### 2.6 Vô hiệu hóa đối tác
```
POST /parties/<PARTY_ID_3>/status
```
```json
{
  "status": "INACTIVE",
  "reason": "Tạm ngừng hợp tác do tranh chấp hợp đồng"
}
```
✅ `status: "INACTIVE"`

### 2.7 Kích hoạt lại
```
POST /parties/<PARTY_ID_3>/status
```
```json
{ "status": "ACTIVE", "reason": "Tranh chấp đã giải quyết" }
```
✅ `status: "ACTIVE"`

### 2.8 Xem audit log đối tác
```
GET /parties/<PARTY_ID_1>/audit
```
✅ Có log CREATE, UPDATE (đổi creditLimit)

---

## MODULE 3 — Debt Creation & Lifecycle

### 3.1 Tạo khoản phải thu — EMI 12 tháng
```
POST /debts
```
```json
{
  "partyId": "<PARTY_ID_1>",
  "type": "RECEIVABLE",
  "origin": "TRADE",
  "principal": 500000000,
  "interestMethod": "EMI",
  "issueDate": "2025-05-01T00:00:00.000Z",
  "termMonths": 12,
  "internalCode": "RECV-2025-001",
  "notes": "HĐ thi công dự án Văn phòng Q7 — thanh toán 12 tháng đều",
  "penaltyRate": 0.0003,
  "gracePeriodDays": 5,
  "interestRates": [
    { "rate": 0, "effectiveDate": "2025-05-01T00:00:00.000Z" }
  ]
}
```
✅ `201` — `status: "DRAFT"` → lưu `DEBT_ID_1`

### 3.2 Tạo khoản phải trả — Vay ngân hàng lãi 8.5%/năm
```
POST /debts
```
```json
{
  "partyId": "<PARTY_ID_2>",
  "type": "PAYABLE",
  "origin": "FINANCIAL",
  "principal": 1000000000,
  "interestMethod": "REDUCING_BALANCE",
  "issueDate": "2025-01-15T00:00:00.000Z",
  "termMonths": 6,
  "internalCode": "PAYB-2025-001",
  "notes": "Vay ngắn hạn bổ sung vốn lưu động — lãi 8.5%/năm",
  "penaltyRate": 0.0005,
  "gracePeriodDays": 0,
  "interestRates": [
    { "rate": 8.5, "effectiveDate": "2025-01-15T00:00:00.000Z" }
  ]
}
```
✅ `201` — `status: "DRAFT"` → lưu `DEBT_ID_2`

### 3.3 Tạo khoản phải trả — ĐÃ QUÁ HẠN (dueDate trong quá khứ)
```
POST /debts
```
```json
{
  "partyId": "<PARTY_ID_3>",
  "type": "PAYABLE",
  "origin": "TRADE",
  "principal": 200000000,
  "interestMethod": "BULLET",
  "issueDate": "2024-11-01T00:00:00.000Z",
  "termMonths": 3,
  "internalCode": "PAYB-2024-099",
"notes": "Tiền hàng thiết bị văn phòng — đã quá hạn thanh toán (dueDate: 2025-02-01)",
  "penaltyRate": 0.0003,
  "gracePeriodDays": 0,
  "interestRates": [
    { "rate": 0, "effectiveDate": "2024-11-01T00:00:00.000Z" }
  ]
}
```
✅ `201` — `status: "DRAFT"` → lưu `DEBT_ID_3`

### 3.4 Kích hoạt (DRAFT → ACTIVE) — chạy lần lượt
```
PATCH /debts/<DEBT_ID_1>/activate
PATCH /debts/<DEBT_ID_2>/activate
PATCH /debts/<DEBT_ID_3>/activate
```
✅ Cả 3 chuyển `status: "ACTIVE"`, schedule được tạo

### 3.5 Lấy danh sách + chi tiết
```
GET /debts
GET /debts?type=PAYABLE
GET /debts/<DEBT_ID_1>
```
✅ Chi tiết khoản nợ có `schedules` (array các kỳ), `interestRates`

### 3.6 Xem audit log
```
GET /debts/<DEBT_ID_1>/audit-logs
```
✅ Log CREATE và ACTIVATE

---

## MODULE 4 — Transactions (Thanh Toán & Đảo Ngược)

### 4.1 Thanh toán một phần DEBT_ID_1 (100M)
```
POST /debts/<DEBT_ID_1>/transactions
```
```json
{
  "amount": 100000000,
  "paymentMethod": "BANK_TRANSFER",
  "reference": "VCB-TT-20250510-001",
  "notes": "Beta XD chuyển khoản đợt 1",
  "paidAt": "2025-05-10T09:30:00.000Z"
}
```
✅ `outstanding` giảm, `status → PARTIAL` → lưu `TX_ID_1`

### 4.2 Tất toán DEBT_ID_2 (trả đủ 1 tỷ)
```
POST /debts/<DEBT_ID_2>/transactions
```
```json
{
  "amount": 1000000000,
  "paymentMethod": "BANK_TRANSFER",
  "reference": "VCB-TX-20250715-888",
  "notes": "Tất toán khoản vay ngắn hạn",
  "paidAt": "2025-07-15T10:00:00.000Z"
}
```
✅ `outstanding ≈ 0`, `status → PAID`

### 4.3 Đảo ngược giao dịch TX_ID_1
```
POST /debts/transactions/<TX_ID_1>/reverse
```
```json
{ "reason": "Nhập sai số tiền — cần huỷ và nhập lại" }
```
✅ Transaction REVERSAL được tạo, `outstanding` phục hồi

### 4.4 Test double-reverse (phải bị block)
```
POST /debts/transactions/<TX_ID_1>/reverse
```
```json
{ "reason": "Thử đảo ngược lần 2" }
```
✅ `400` — `"Giao dịch này đã được đảo ngược trước đó"`

---

## MODULE 5 — Debt Status Management

### 5.1 Đánh dấu tranh chấp
```
PATCH /debts/<DEBT_ID_1>/dispute
```
```json
{ "reason": "Beta XD phản đối giá trị quyết toán — đang thương lượng" }
```
✅ `status → DISPUTED`

### 5.2 Giải quyết tranh chấp
```
PATCH /debts/<DEBT_ID_1>/resolve
```
✅ `status → ACTIVE` (hoặc PARTIAL nếu đã có payment)

### 5.3 Xóa nợ (write-off) cho khoản không thể thu hồi
```
PATCH /debts/<DEBT_ID_3>/write-off
```
```json
{ "reason": "Gamma CU mất khả năng thanh toán — khoanh nợ xử lý" }
```
✅ `status → WRITTEN_OFF`

---

## MODULE 6 — Automated Jobs

> DEBT_ID_3 có dueDate = 2025-02-01 → đã quá hạn → Job sẽ xử lý

### 6.1 Job chuyển OVERDUE
```
POST /jobs/run-overdue
```
✅ `{ processed: 1, failed: 0 }` — DEBT_ID_3 chuyển `OVERDUE` (nếu chưa write-off)  
**Tip:** Chạy bước này TRƯỚC 5.3 để test đầy đủ

### 6.2 Job tính phạt
```
POST /jobs/run-penalty
```
✅ Transaction `PENALTY` được tạo — `outstanding` của DEBT_ID_3 tăng thêm phần phạt

### 6.3 Job gửi thông báo
```
POST /jobs/run-notify
```
✅ `{ processed: N, notificationsSent: M }` — M ≥ 1

### 6.4 Xem logs
```
GET /jobs/logs
```
✅ 3 records với `status: "SUCCESS"`, `processedCount`, `durationMs`

---

## MODULE 7 — Notification Center

### 7.1 Lấy tất cả thông báo
```
GET /notifications
```
✅ Array ≥ 1 sau khi chạy job notify

### 7.2 Lọc chưa đọc
```
GET /notifications?isRead=false
```

### 7.3 Lọc theo category
```
GET /notifications?category=OVERDUE
GET /notifications?category=PENALTY
```

### 7.4 Số chưa đọc
```
GET /notifications/unread-count
```
✅ `{ unreadCount: N }` với N > 0

### 7.5 Đánh dấu đã đọc
```
PATCH /notifications/<NOTIF_ID>/read
```
✅ `{ success: true }` — count giảm 1

### 7.6 Snooze 3 ngày
```
POST /notifications/<NOTIF_ID>/snooze
```
```json
{ "days": 3 }
```
✅ Notification biến khỏi GET list cho đến sau 3 ngày

### 7.7 Acknowledge
```
POST /notifications/<NOTIF_ID>/acknowledge
```
✅ `acknowledgedAt` được set trong DB

### 7.8 Đánh dấu tất cả đã đọc
```
POST /notifications/mark-all-read
```
✅ `unread-count → 0`

---

## MODULE 8 — Analytics Dashboard

### 8.1 KPI Summary
```
GET /analytics/summary
```
✅ Expect (ví dụ sau khi nhập data):
```json
{
  "receivable": { "total": 500000000, "overdue": 0, "dueSoon": 0 },
  "payable":    { "total": 200000000, "overdue": 200000000, "dailyPenalty": 60000 },
  "health":     { "deRatio": 0, "maxDeRatio": 3, "isRisk": false }
}
```

### 8.2 Aging Report — Phải thu
```
GET /analytics/aging?type=RECEIVABLE
```
✅ Beta XD xuất hiện với `buckets.current: 500000000`

### 8.3 Aging Report — Phải trả
```
GET /analytics/aging?type=PAYABLE
```
✅ Gamma CU xuất hiện với bucket `over360` hoặc `181-360`

### 8.4 Dự báo dòng tiền 30 ngày
```
GET /analytics/cash-flow
```
✅ Array 30 phần tử — ngày có khoản đến hạn có `out > 0` hoặc `in > 0`

### 8.5 Action Items
```
GET /analytics/action-items
```
✅ Array ≤ 10 — Gamma CU `PAYABLE_OVERDUE` ở priority 1

---

## MODULE 8B — Repayment Planner

### 8B.1 Mô phỏng AVALANCHE
```
POST /repayment-planner/simulate
```
```json
{
  "budget": 150000000,
  "strategy": "AVALANCHE",
  "excludeDebtIds": []
}
```
✅ Khoản VCB (lãi 8.5%) xếp `priority: 1`

### 8B.2 Mô phỏng SNOWBALL
```
POST /repayment-planner/simulate
```
```json
{
  "budget": 150000000,
  "strategy": "SNOWBALL",
  "excludeDebtIds": []
}
```
✅ Khoản `outstanding` nhỏ nhất xếp `priority: 1`

### 8B.3 Mô phỏng OVERDUE_FIRST
```
POST /repayment-planner/simulate
```
```json
{
  "budget": 150000000,
  "strategy": "OVERDUE_FIRST",
  "excludeDebtIds": []
}
```
✅ Khoản OVERDUE xếp đầu

### 8B.4 Test Debt Trap (ngân sách cực nhỏ)
```
POST /repayment-planner/simulate
```
```json
{
  "budget": 1000,
  "strategy": "OVERDUE_FIRST",
  "excludeDebtIds": []
}
```
✅ `alerts[].type: "DANGER"` — cảnh báo "Bẫy nợ"

### 8B.5 Lưu kế hoạch
```
POST /repayment-planner/commit
```
```json
{
  "name": "Kế hoạch trả nợ tháng 5/2025",
  "budget": 150000000,
  "strategy": "AVALANCHE",
  "items": [
    {
      "debtId": "<DEBT_ID_2>",
      "plannedAmount": 100000000,
      "priority": 1,
      "reason": "Lãi suất cao nhất 8.5%/năm"
    },
    {
      "debtId": "<DEBT_ID_3>",
      "plannedAmount": 50000000,
      "priority": 2,
      "reason": "Khoản quá hạn — giảm phạt tích lũy"
    }
  ]
}
```
✅ `201` — `{ status: "COMMITTED", items: [...] }`

---

## THỨ TỰ CHẠY TỐI ƯU

```
1.1 Register  →  1.2 Login (lưu TOKEN)
2.1 → 2.3     Tạo 3 Party
3.1 → 3.3     Tạo 3 Debt (DRAFT)
3.4           Activate 3 Debt → ACTIVE
6.1           run-overdue → DEBT_ID_3 chuyển OVERDUE
6.2           run-penalty → DEBT_ID_3 bị phạt
6.3           run-notify  → tạo notifications
4.1           Thanh toán 100M cho DEBT_ID_1 → lưu TX_ID_1
4.2           Tất toán DEBT_ID_2 → PAID
4.3 → 4.4     Reverse TX_ID_1, test double-reverse
5.1 → 5.2     Dispute → Resolve DEBT_ID_1
7.1 → 7.8     Test toàn bộ Notification Center
8.1 → 8.5     Kiểm tra Analytics Dashboard
8B.1 → 8B.5   Test Repayment Planner (4 strategies + commit)
5.3           Write-off DEBT_ID_3 (cuối cùng)
2.6 → 2.8     Test toggle party status + audit log
```

---

## CHECKLIST CUỐI

| # | Kiểm tra | Expect |
|---|---|---|
| 1 | 3 Party tồn tại trong DB | ✓ |
| 2 | DEBT_ID_1 status = ACTIVE (sau dispute→resolve + reverse) | ✓ |
| 3 | DEBT_ID_2 status = PAID | ✓ |
| 4 | DEBT_ID_3 status = WRITTEN_OFF | ✓ |
| 5 | Double-reverse bị block | 400 error |
| 6 | AuditLog system job userId = null (không crash) | ✓ |
| 7 | Notification tồn tại sau run-notify | ✓ |
| 8 | Analytics summary outstanding đúng | ✓ |
| 9 | Repayment plan COMMITTED lưu vào DB | ✓ |
| 10 | D/E bar hiển thị đúng trên Dashboard UI | ✓ |