# 💎 Subscription Plan — FinSight

---

## 1. Thiết kế gói

| | **Basic · Free** | **Pro · Phổ biến** | **Pro Max · Toàn năng** |
|---|---|---|---|
| **Giá** | 0đ / tháng | 49.000đ / tháng | 99.000đ / tháng |
| Toàn bộ Debt Management (CRUD) | ✅ | ✅ | ✅ |
| Dashboard tổng quan (EAR, DTI, Domino Risk) | ✅ | ✅ | ✅ |
| Payment Tracking & Notifications | ✅ | ✅ | ✅ |
| Chiến lược trả nợ (Avalanche / Snowball) | ✅ | ✅ | ✅ |
| Xem chỉ số thị trường (Fear & Greed, giá tài sản) | ✅ | ✅ | ✅ |
| Gợi ý phân bổ danh mục đầu tư | ❌ | ✅ | ✅ |
| Market Alert cá nhân hóa theo risk profile | ❌ | ✅ | ✅ |
| AI Chatbot | ❌ | ⚠️ 10 câu / 5 tiếng | ✅ Không giới hạn |
| OCR nhận diện chứng từ | ❌ | ⚠️ 5 ảnh / tháng | ✅ Không giới hạn |
| Xuất báo cáo PDF / Excel | ❌ | ❌ | ✅ |
| Priority support | ❌ | ❌ | ✅ |

> ✅ Đầy đủ · ⚠️ Có giới hạn · ❌ Không có

---

## 2. Luồng hoạt động (Flows)

### Flow 1 — Đăng ký tài khoản mới

```
User điền form đăng ký (email, password, fullName)
  → FE gọi POST /api/auth/register
  → BE validate dữ liệu (email chưa tồn tại, password đủ mạnh)
      ├── Lỗi → 400 { message: "Email đã tồn tại" } → FE hiện lỗi inline
      └── Hợp lệ → tạo user record
                 → INSERT subscriptions: plan=BASIC, status=ACTIVE, expires_at=NULL
                 → INSERT feature_usage: 2 rows (CHATBOT + OCR), used_count=0
                 → Trả về { user, token }
  → FE lưu token vào localStorage ('finsight_token')
  → Redirect → /home (DashboardPage)
  → User vào app với gói Basic ngay lập tức, không cần làm gì thêm
```

---

### Flow 2 — Upgrade lên Pro / Pro Max

```
User vào /pricing
  → FE gọi GET /api/subscription/me
  → Hiển thị gói hiện tại (badge, ngày hết hạn nếu có)
  → User bấm "Nâng cấp lên Pro" (hoặc Pro Max)

  → FE gọi POST /api/payment/create-link { plan: "PRO" }
  → BE tạo payment link từ MoMo / VNPay sandbox
  → Trả về { payment_url, order_id }
  → FE redirect user sang trang thanh toán của cổng

  [Tại cổng thanh toán]
  ├── Thanh toán THẤT BẠI
  │     → Cổng redirect về /pricing?status=failed
  │     → FE hiện toast "Thanh toán thất bại, vui lòng thử lại"
  │
  └── Thanh toán THÀNH CÔNG
        → Cổng gọi webhook → POST /api/payment/webhook { order_id, payment_ref, status }
        → BE xác thực chữ ký webhook (HMAC)
            ├── Chữ ký sai → 400, bỏ qua
            └── Hợp lệ → gọi SubscriptionService.activatePlan(user_id, plan, payment_ref)
                       → UPDATE subscriptions: status=ACTIVE, expires_at=now+30d, payment_ref
                       → Cổng redirect user về /pricing?status=success
        → FE gọi lại GET /api/subscription/me → cập nhật badge gói mới
        → Hiện toast "Nâng cấp thành công! Chào mừng bạn đến với Pro 🎉"
```

---

### Flow 3 — User truy cập tính năng bị khóa bởi gói (Plan Gate)

> Áp dụng cho: Investment Advisory, Market Alert cá nhân hóa

```
User vào trang Investment Advisory (gói BASIC)
  → FE gọi GET /api/investment/advisory
  → [Middleware requirePlan('PRO')]
      → Đọc subscription hiện tại của user
      → Kiểm tra plan có >= PRO không?
          ├── plan=PRO hoặc PROMAX → pass → tiếp tục xử lý → trả data bình thường
          └── plan=BASIC → dừng → trả 403 {
                  upgrade_required: true,
                  min_plan: "PRO",
                  message: "Tính năng này yêu cầu gói Pro trở lên"
              }

  → FE nhận 403 với upgrade_required=true
  → Mở Upsell Modal (KHÔNG redirect trang):
      - Tiêu đề: "Nâng cấp để dùng tính năng này"
      - Mô tả tính năng bị khóa
      - 2 nút: [Nâng cấp Pro — 49k] [Nâng cấp Pro Max — 99k]
      - Nút "Để sau" → đóng modal
  → User chọn gói → vào Flow 2
```

---

### Flow 4 — User dùng tính năng có quota (Chatbot)

> Quota chatbot: Pro = 10 câu / 5 tiếng | Pro Max = không giới hạn

```
User gõ tin nhắn và gửi trong AI Chatbot
  → FE gọi POST /api/agentic/chat { message, sessionId }

  → [Middleware requirePlan('PRO')]
      └── BASIC → 403 → FE mở Upsell Modal → kết thúc

  → [Middleware checkQuota('CHATBOT')]
      → Đọc feature_usage WHERE user_id=X AND feature=CHATBOT
      → Kiểm tra window còn hiệu lực?
          window_valid = (window_start + 5h) > now
          ├── window_valid=false → reset: used_count=0, window_start=now
          └── window_valid=true  → giữ nguyên used_count

      → Kiểm tra plan:
          ├── PROMAX → bỏ qua limit, cho đi tiếp luôn
          └── PRO    → so sánh used_count với limit (10)
                        ├── used_count < 10 → +1 used_count → cho đi tiếp
                        └── used_count >= 10 → dừng → 429 {
                                quota_exceeded: true,
                                feature: "CHATBOT",
                                used: 10,
                                limit: 10,
                                reset_at: "2025-01-01T15:00:00Z"  ← window_start + 5h
                            }

  → FE nhận 429:
      - Disable ô nhập tin nhắn
      - Hiện banner: "Bạn đã dùng hết 10 câu hỏi. Reset lúc 15:00"
      - Hiện nút "Nâng cấp Pro Max để chat không giới hạn"

  → Nếu pass hết → xử lý chat bình thường (SSE stream)
  → FE cập nhật Quota Indicator: "Còn X câu / reset sau Yh Zm"
```

---

### Flow 5 — User dùng OCR (upload ảnh hóa đơn)

> Quota OCR: Pro = 5 ảnh / tháng | Pro Max = không giới hạn

```
User upload ảnh trong AI Chatbot
  → FE chạy Tesseract.js (OCR phía browser) → trích xuất text
  → FE gọi POST /api/agentic/chat { message, imageBase64 }

  → [Middleware requirePlan('PRO')] → tương tự Flow 4

  → [Middleware checkQuota('OCR')]
      → Đọc feature_usage WHERE user_id=X AND feature=OCR
      → Kiểm tra window: window_start là đầu tháng hiện tại
          ├── window_start < đầu tháng này → reset: used_count=0, window_start=đầu tháng
          └── Còn trong tháng → giữ nguyên

      → Kiểm tra plan:
          ├── PROMAX → cho đi tiếp
          └── PRO    → limit = 5
                        ├── used_count < 5 → +1 → cho đi tiếp
                        └── used_count >= 5 → 429 {
                                quota_exceeded: true,
                                feature: "OCR",
                                used: 5,
                                limit: 5,
                                reset_at: "2025-02-01T00:00:00Z"  ← đầu tháng sau
                            }
  → FE nhận 429:
      - Hiện thông báo: "Bạn đã dùng hết 5 lượt OCR tháng này. Reset ngày 01/02"
      - Nút "Nâng cấp Pro Max"
```

---

### Flow 6 — Hủy gói (Cancel)

```
User vào /pricing → bấm "Hủy gia hạn"
  → FE hiện confirm dialog: "Bạn vẫn dùng được Pro đến [ngày expires_at]. Xác nhận hủy?"
  → User xác nhận → FE gọi POST /api/subscription/cancel

  → BE cập nhật subscriptions:
      status = CANCELLED
      (GIỮ NGUYÊN expires_at — không xóa)

  → Trả về { message: "Đã hủy gia hạn. Gói Pro còn hiệu lực đến [expires_at]" }
  → FE hiện badge: "Pro · Hết hạn [ngày]" (thay vì "Pro · Đang hoạt động")
  → Mọi tính năng Pro vẫn hoạt động bình thường đến expires_at

  → Sau expires_at → Cron (Flow 7) tự downgrade về Basic
```

---

### Flow 7 — Subscription hết hạn (Cron job hàng ngày)

```
Cron chạy mỗi ngày lúc 00:05
  → Quét: SELECT * FROM subscriptions
           WHERE expires_at < now
           AND status IN ('ACTIVE', 'CANCELLED')
           AND plan != 'BASIC'

  → Với mỗi subscription tìm được:
      1. UPDATE status = EXPIRED
      2. INSERT subscription mới:
            plan=BASIC, status=ACTIVE, expires_at=NULL, started_at=now
      3. (Optional) Gửi email thông báo cho user

  → Lần sau user vào app:
      → GET /api/subscription/me → trả gói BASIC
      → Mọi tính năng Pro bị khóa → requirePlan trả 403 như bình thường
```

---

### Flow 8 — Reset quota tự động (Cron job)

```
[Chatbot — chạy mỗi 5 tiếng: 00:00, 05:00, 10:00, 15:00, 20:00]
  → UPDATE feature_usage
    SET used_count = 0, window_start = now
    WHERE feature = 'CHATBOT'
    AND (window_start + INTERVAL 5 HOUR) <= now

[OCR — chạy ngày 1 mỗi tháng lúc 00:01]
  → UPDATE feature_usage
    SET used_count = 0, window_start = DATE_TRUNC('month', now)
    WHERE feature = 'OCR'

Lưu ý: Reset chỉ áp dụng cho user đang có gói PRO.
PROMAX không cần reset (limit = ∞).
```

---

### Flow 9 — Kiểm tra quota trước khi render UI (FE proactive check)

```
User mở trang chứa AI Chatbot
  → FE gọi GET /api/subscription/quota/chatbot
  → Nhận: { allowed: true, used: 7, limit: 10, reset_at: "..." }

  → Render Quota Indicator: "Còn 3 câu hỏi · reset lúc 15:00"
  → Nếu allowed=false (hết quota):
      - Disable input ngay từ đầu
      - Hiện banner upsell (không cần đợi user gửi mới báo lỗi)
```

---

## 3. Database Schema

### Bảng `subscriptions`

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Mã định danh |
| `user_id` | UUID FK | Liên kết bảng users |
| `plan` | ENUM | `BASIC` / `PRO` / `PROMAX` |
| `status` | ENUM | `ACTIVE` / `EXPIRED` / `CANCELLED` |
| `started_at` | TIMESTAMP | Ngày bắt đầu gói |
| `expires_at` | TIMESTAMP | Ngày hết hạn (`null` = Basic vĩnh viễn) |
| `payment_ref` | VARCHAR | Mã giao dịch từ cổng thanh toán |
| `created_at` | TIMESTAMP | Thời điểm tạo |

### Bảng `feature_usage` (tracking giới hạn)

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | UUID | Mã định danh |
| `user_id` | UUID FK | Liên kết bảng users |
| `feature` | ENUM | `CHATBOT` / `OCR` |
| `used_count` | INT | Số lần đã dùng trong window hiện tại |
| `window_start` | TIMESTAMP | Mốc bắt đầu tính window (chatbot: mỗi 5h, OCR: mỗi tháng) |
| `updated_at` | TIMESTAMP | Lần cập nhật gần nhất |

---

## 3. API Endpoints

### Subscription management

```
GET  /api/subscription/me
→ Trả về gói hiện tại, ngày hết hạn, usage quota

POST /api/subscription/upgrade
Body: { plan: "PRO" | "PROMAX", payment_ref }
→ 201: Kích hoạt gói mới
→ 402: Thanh toán chưa xác nhận

POST /api/subscription/cancel
→ Hủy gia hạn, giữ quyền lợi đến hết kỳ
```

### Feature gate (dùng nội bộ qua middleware)

```
GET  /api/subscription/quota/:feature
feature: chatbot | ocr
→ { allowed: bool, used: int, limit: int, reset_at: timestamp }

POST /api/subscription/quota/:feature/consume
→ Trừ 1 lượt dùng. 429 nếu đã hết quota
```

---

## 4. Gate Middleware

Mỗi endpoint bảo vệ bởi subscription đi qua **2 lớp middleware**:

### Lớp 1 — `requirePlan(minPlan)`
Kiểm tra gói tối thiểu cần có.

```js
router.get('/advisory', requirePlan('PRO'), handler)
```

- Nếu user là Basic → trả **403** kèm `{ upgrade_required: true, min_plan: 'PRO' }`
- Frontend nhận để mở **modal upsell**

### Lớp 2 — `checkQuota(feature)`
Dùng cho tính năng có giới hạn số lần (chatbot, OCR).

- Đọc bảng `feature_usage` → so sánh `used_count` với limit của gói
- Nếu hết quota → **429** kèm `{ quota_exceeded: true, reset_at }`
- Nếu còn → +1 `used_count` → cho đi tiếp

### Bảng giới hạn theo gói

| Tính năng | Basic | Pro | Pro Max |
|---|---|---|---|
| Investment Advisory | ❌ | ✅ | ✅ |
| Market Alert (cá nhân hóa) | ❌ | ✅ | ✅ |
| AI Chatbot | ❌ | 10 câu / 5 tiếng | Không giới hạn |
| OCR | ❌ | 5 ảnh / tháng | Không giới hạn |
| Xuất PDF / Excel | ❌ | ❌ | ✅ |

---

## 5. Sprint Plan

### Sprint 8 — Database & Core logic

| Task | Tag | Mô tả |
|---|---|---|
| Task 1 | `DB` | Tạo migration: bảng **subscriptions** và **feature_usage**. Thêm index trên `(user_id, feature, window_start)` |
| Task 2 | `BE` | Viết **SubscriptionService**: `getActivePlan`, `activatePlan`, `checkQuota`, `consumeQuota`. Seed mặc định Basic cho user mới khi đăng ký |
| Task 3 | `BE` | Viết 2 middleware **requirePlan** và **checkQuota**. Gắn vào các route: Investment Advisory, Market Alert, Chatbot, OCR |
| Task 4 | `BE` | Viết Cron job reset quota: chatbot (mỗi 5 tiếng), OCR (đầu tháng), kiểm tra subscription hết hạn → downgrade về Basic |

### Sprint 9 — Pricing page & Upgrade flow

| Task | Tag | Mô tả |
|---|---|---|
| Task 5 | `FE` | Trang **/pricing**: 3 card gói (Basic, Pro, Pro Max). Nút "Nâng cấp" → redirect đến cổng thanh toán (MoMo / VNPay). Hiển thị gói hiện tại |
| Task 6 | `Integration` | Tích hợp **MoMo hoặc VNPay sandbox**: tạo payment link → webhook nhận kết quả → gọi `POST /api/subscription/upgrade` kích hoạt gói |
| Task 7 | `FE` | **Upsell modal**: khi nhận 403 `upgrade_required` từ API → show modal "Nâng cấp để dùng tính năng này" kèm nút Upgrade. Không redirect đột ngột |
| Task 8 | `FE` | **Quota indicator** trong UI chatbot: hiển thị "Còn X câu hỏi / reset sau Nh". Disable input khi hết quota, show thông báo upgrade |

### Sprint 10 — Polish & Testing

| Task | Tag | Mô tả |
|---|---|---|
| Task 9 | `BE` | Unit test middleware `requirePlan` và `checkQuota` với đủ 3 gói. Test edge case: gói hết hạn giữa request, reset window đúng thời điểm |
| Task 10 | `FE` | E2E test luồng upgrade: Basic → Pro → test chatbot còn quota → hết quota → hiện upsell → upgrade Pro Max → chatbot không giới hạn |
