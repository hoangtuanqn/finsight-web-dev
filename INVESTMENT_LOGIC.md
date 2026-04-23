# Tài liệu: Logic Đề Xuất Phân Bổ Tài Sản Đầu Tư — FinSight

> Cập nhật: 04/2025 | Người viết: Refactor session

---

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Những gì đã thay đổi so với phiên bản cũ](#2-những-gì-đã-thay-đổi-so-với-phiên-bản-cũ)
3. [Hệ thống hiện tại hoạt động như thế nào](#3-hệ-thống-hiện-tại-hoạt-động-như-thế-nào)
4. [Cơ sở của từng con số](#4-cơ-sở-của-từng-con-số)
5. [Hạn chế còn lại](#5-hạn-chế-còn-lại)
6. [Sơ đồ luồng xử lý](#6-sơ-đồ-luồng-xử-lý)

---

## 1. Tổng quan hệ thống

Hệ thống đề xuất phân bổ tài sản của FinSight hoạt động theo mô hình **Rule-Based + Market Sentiment**, gồm 3 bước chính:

```
[1] Người dùng làm Quiz → Xác định Risk Level (LOW / MEDIUM / HIGH)
[2] Hệ thống lấy Fear & Greed Index thời gian thực → Xác định Sentiment
[3] Áp BASE Allocation → Điều chỉnh qua 4 Overlay → Trả về phân bổ cuối
```

### Các file liên quan

| File | Vai trò |
|------|---------|
| `client/src/constants/investmentConstants.js` | ⭐ Single source of truth — tất cả con số gốc |
| `server/src/constants/investmentConstants.js` | Bản copy cho server (nội dung giống nhau) |
| `client/src/utils/calculations.js` | Hàm `getAllocation()` — logic tính toán chính |
| `server/src/controllers/investment.controller.js` | API endpoint, tính projection, risk assessment |
| `client/src/components/investment/InvestmentUtils.jsx` | Giải thích lý do phân bổ hiển thị trên UI |

---

## 2. Những gì đã thay đổi so với phiên bản cũ

### ❌ Phiên bản cũ — Vấn đề

#### Vấn đề 1: 15 ô allocation hoàn toàn hardcode, không có cơ sở

Phiên bản cũ dùng một bảng tra cứu 3×5 (3 risk level × 5 sentiment):

```js
// CŨ — 15 ô đặt tay, không có lý luận
LOW + EXTREME_GREED = { savings: 65, gold: 25, bonds: 10, stocks: 0, crypto: 0 }
//   ↑ LOGIC SAI: Tại sao EXTREME_GREED lại tăng savings lên 65%?
//     EXTREME_GREED = thị trường tham lam → nên tăng risk assets, không phải tăng tiết kiệm!

HIGH + EXTREME_GREED = { savings: 20, gold: 20, bonds: 0, stocks: 35, crypto: 25 }
//   ↑ LOGIC SAI: HIGH risk + EXTREME_GREED lại tăng savings từ 10% → 20%?
```

#### Vấn đề 2: Sentiment mapping lỗi

```js
// CŨ — Bug: NEUTRAL chỉ đúng khi value = 50 chính xác
if (value === 50) return 'NEUTRAL';  // value = 49 → FEAR, value = 51 → GREED
if (value <= 74) return 'GREED';     // Không có "vùng trung lập" thực sự
```

#### Vấn đề 3: Expected returns sai thực tế VN

```js
// CŨ — Hardcode không có nguồn
const rates = {
  gold:   0.08,   // 8% — Thực tế CAGR 10 năm chỉ ~6.5%
  stocks: 0.12,   // 12% — VN-Index CAGR thực tế ~10%
  bonds:  0.07,   // 7% — TPCP 2024 chỉ đạt 5-6.5%
  crypto: 0.15,   // 15% — Con số vô nghĩa, crypto không có "average" ổn định
};
```

#### Vấn đề 4: Duplicate code

`BASE` object tồn tại ở **2 nơi khác nhau** với nội dung giống nhau:
- `client/src/utils/calculations.js` → `ALLOCATION_RULES`
- `client/src/components/investment/InvestmentUtils.jsx` → `BASE`

→ Khi cần sửa phải sửa 2 chỗ, dễ sai nhất quán.

#### Vấn đề 5: Risk Assessment quá đơn giản

```js
// CŨ — Tất cả câu hỏi có trọng số bằng nhau, ranh giới cứng
const avgScore = sum / answers.length;
if (avgScore > 60) riskLevel = 'HIGH';  // >60 chứ không phải >=60, ranh giới tùy tiện
if (avgScore > 30) riskLevel = 'MEDIUM';
// Không có weighted scoring, không check tính nhất quán
```

---

### ✅ Phiên bản mới — Thay đổi

#### Thay đổi 1: Single Source of Truth

Tạo file `investmentConstants.js` ở cả client và server. **Tất cả con số gốc chỉ tồn tại ở 1 nơi**, có comment giải thích nguồn gốc:

```
Trước: ALLOCATION_RULES (calculations.js) + BASE (InvestmentUtils.jsx) — 2 bản sao
Sau:   BASE_ALLOCATIONS (investmentConstants.js) — 1 bản duy nhất
```

#### Thay đổi 2: Overlay System thay vì Lookup Table

```
Trước: 15 ô hardcode (3 risk × 5 sentiment) → dễ mâu thuẫn, khó maintain
Sau:   BASE (3 risk) + Sentiment Overlay + Horizon Overlay + Capital Overlay → 3 lớp độc lập, dễ điều chỉnh từng chiều
```

#### Thay đổi 3: Fix NEUTRAL band

```js
// MỚI — NEUTRAL = vùng [41-59], không phải điểm chính xác 50
{ max: 40,  label: 'FEAR' }
{ max: 59,  label: 'NEUTRAL' }   // value 41-59 đều là NEUTRAL
{ max: 74,  label: 'GREED' }
```

#### Thay đổi 4: Fix logic EXTREME_GREED

```js
// MỚI — EXTREME_GREED tăng stocks, không tăng savings
{ max: 100, label: 'EXTREME_GREED', overlay: { savings: -5, stocks: +3, crypto: +2 } }
//   ↑ Hợp lý: thị trường tham lam → risk-on → tăng tài sản rủi ro
```

#### Thay đổi 5: Expected returns từ dữ liệu thực tế VN

```js
// MỚI — Có nguồn rõ ràng
savings: 5.0%   // NHNN: lãi suất tiết kiệm 12T TB 2024
gold:    6.5%   // CAGR vàng SJC 10 năm, loại trừ distortion 2023-2024
bonds:   5.8%   // HNX: lợi suất TPCP kỳ hạn 5-10 năm cuối 2024
stocks:  10.0%  // VN-Index CAGR 2014-2024 (bao gồm COVID)
crypto:  null   // Không dùng point estimate — dùng 3 scenarios thay thế
```

#### Thay đổi 6: Crypto không có expected return cố định

```js
crypto: {
  expectedReturn: null,  // Không dùng — misleading
  bearCase:  -0.60,      // -60% (BTC 2022)
  baseCase:   0.20,      // +20%
  bullCase:   1.50,      // +150%
}
// API response bây giờ kèm cryptoWarning nếu allocation.crypto > 0
```

#### Thay đổi 7: Risk Assessment có weighted scoring

```js
// MỚI — Câu hỏi hành vi thực tế quan trọng hơn câu hỏi thái độ
questionWeights: {
  q1: 1.0,   // Mục tiêu đầu tư (attitude)
  q2: 1.5,   // Phản ứng khi thua lỗ (predicted behavior)
  q3: 2.0,   // Hành vi đầu tư thực tế quá khứ (actual — quan trọng nhất)
  q4: 1.5,   // Kỳ hạn (constraint)
  q5: 1.0,   // Ổn định thu nhập (context)
}
// Ngưỡng mới: >=65 → HIGH, >=40 → MEDIUM (rộng hơn cũ 60/30)
// + Consistency check: cảnh báo nếu stdDev > 30
```

#### Thay đổi 8: Capital Overlay — soft scale thay vì hard cap

```js
// CŨ — hard cap tạo cliff edge
if (capital < 50_000_000) {
  if (alloc.crypto > 5) alloc.crypto = 5;   // 49.9tr vs 50.1tr → allocation khác hoàn toàn
  if (alloc.stocks > 10) alloc.stocks = 10;
}

// MỚI — soft overlay
SMALL:  { savings: +15, stocks: -8, crypto: -7 },  // < 50tr: giảm dần, không hard cap
NORMAL: {},
LARGE:  { savings: -5, stocks: +3, gold: +2 },      // > 200tr: diversify thêm
```

---

## 3. Hệ thống hiện tại hoạt động như thế nào

### Bước 1: Xác định Risk Level từ Quiz

Người dùng trả lời 5 câu hỏi, mỗi câu có trọng số khác nhau:

```
weighted_score = Σ(answer[i].score × weight[i]) / Σ(weight[i])

→ score >= 65  : HIGH   (tích cực, chấp nhận rủi ro cao)
→ score >= 40  : MEDIUM (cân bằng)
→ score < 40   : LOW    (bảo thủ, ưu tiên bảo toàn vốn)
```

Risk Level được lưu vào `InvestorProfile.riskLevel` trong database.

---

### Bước 2: Lấy Sentiment từ Fear & Greed Index

```
API: https://api.alternative.me/fng/?limit=2
Cache: Redis 30 phút
Fallback: value = 50 (NEUTRAL) nếu API lỗi
```

Fear & Greed Index (0-100) được map thành sentiment band:

| Giá trị | Band | Ý nghĩa |
|---------|------|---------|
| 0 – 20  | EXTREME_FEAR | Thị trường sợ hãi cực độ |
| 21 – 40 | FEAR | Thị trường e ngại |
| 41 – 59 | NEUTRAL | Thị trường cân bằng |
| 60 – 74 | GREED | Thị trường hưng phấn |
| 75 – 100| EXTREME_GREED | Thị trường tham lam cực độ |

> ⚠️ **Lưu ý quan trọng**: Fear & Greed Index hiện tại chủ yếu phản ánh thị trường **crypto và cổ phiếu Mỹ**, không phải VN-Index. Đây là hạn chế chưa được giải quyết (xem Mục 5).

---

### Bước 3: Tính Allocation — 5 lớp xử lý

#### Lớp 1: BASE Allocation (theo Risk Level)

Điểm xuất phát dựa trên nguyên tắc **Lifecycle Investing** và **Vietnam market context**:

```
LOW:    savings 55%  | gold 25%  | bonds 15%  | stocks  5%  | crypto  0%
MEDIUM: savings 30%  | gold 20%  | bonds 15%  | stocks 30%  | crypto  5%
HIGH:   savings 10%  | gold 15%  | bonds  5%  | stocks 55%  | crypto 15%
```

**Lý luận thiết kế:**
- **Vàng luôn > 0%** ở mọi risk level: phản ánh thói quen đầu tư VN truyền thống, vàng đóng vai trò hedge lạm phát
- **LOW = bảo toàn vốn**: 55% tiết kiệm + 25% vàng + 15% bonds = 95% tài sản an toàn
- **MEDIUM = balanced**: Growth (stocks+crypto) = 35%, phỏng theo quy tắc 60/40 adapted cho VN
- **HIGH = growth-oriented**: Growth assets = 70%, savings 10% chỉ để giữ thanh khoản tối thiểu

#### Lớp 2: Sentiment Overlay

Điều chỉnh tactical dựa trên tâm lý thị trường, max delta ±10%:

```
EXTREME_FEAR:  savings +10%, stocks -5%,  crypto -5%   → "cash is king"
FEAR:          savings  +5%, stocks -3%,  crypto -2%   → phòng thủ nhẹ
NEUTRAL:       (không thay đổi)
GREED:         savings  -3%, stocks +3%                → risk-on nhẹ
EXTREME_GREED: savings  -5%, stocks +3%,  crypto +2%   → risk-on (nhưng cẩn thận)
```

#### Lớp 3: Horizon Overlay

Điều chỉnh theo kỳ hạn đầu tư của người dùng:

```
SHORT  (< 3 năm): savings +10%, stocks -5%, crypto -5%   → cần thanh khoản
MEDIUM (3-7 năm): (không thay đổi)
LONG   (> 7 năm): savings -10%, stocks +7%, bonds +3%    → tận dụng compound
```

#### Lớp 4: Capital Overlay

Điều chỉnh theo quy mô vốn (soft scale):

```
SMALL  (< 50tr):   savings +15%, stocks -8%,  crypto -7%   → ưu tiên tích lũy
NORMAL (50-200tr): (không thay đổi)
LARGE  (> 200tr):  savings  -5%, stocks +3%,  gold   +2%   → diversify thêm
```

#### Lớp 5: Goal Adjustment

Điều chỉnh nhỏ theo mục tiêu đầu tư:

```
STABILITY:   chuyển tối đa 10% từ (crypto, stocks) → bonds
SPECULATION: chuyển tối đa 10% từ (savings, bonds) → crypto
GROWTH/INCOME: (không thay đổi)
```

#### Normalize

Sau tất cả các lớp, toàn bộ giá trị được:
1. Clamp về 0 (không âm)
2. Re-normalize để tổng = 100%

---

### Bước 4: Tính Projected Returns (Dự phóng lợi nhuận)

Dùng công thức Future Value chuẩn:

```
FV = capital × (1+r)^n + monthlyAdd × 12 × ((1+r)^n - 1) / r
```

Với **3 kịch bản**:
- **Base**: `weightedReturn - inflation`
- **Optimistic**: `weightedReturn × 1.3 - inflation`
- **Pessimistic**: `max(-50%, weightedReturn × 0.5 - inflation)`

**Expected returns dùng để tính:**

| Tài sản | Rate | Nguồn |
|---------|------|-------|
| Tiết kiệm | profile.savingsRate hoặc 5.0% | NHNN 2024 |
| Vàng | 6.5% | CAGR vàng SJC 10 năm |
| Trái phiếu | 5.8% | HNX: TPCP kỳ hạn 5-10 năm cuối 2024 |
| Cổ phiếu | 10.0% | VN-Index CAGR 2014-2024 |
| Crypto | 20% (baseCase) | Kịch bản trung bình — **kèm cảnh báo** |
| Lạm phát | profile.inflationRate hoặc 3.5% | CPI VN trung bình |

> ⚠️ Crypto projection dùng `baseCase = 20%` nhưng API response luôn kèm `cryptoWarning` để user hiểu rõ độ biến động thực tế (bear: -60%, bull: +150%).

---

### Ví dụ thực tế: MEDIUM risk, sentiment = 55 (NEUTRAL), horizon = LONG, capital = 100tr

```
BASE (MEDIUM):        savings 30, gold 20, bonds 15, stocks 30, crypto 5
+ NEUTRAL overlay:    (không thay đổi)
+ LONG overlay:       savings -10, stocks +7, bonds +3
                    → savings 20, gold 20, bonds 18, stocks 37, crypto 5
+ NORMAL overlay:     (không thay đổi)
+ Goal (GROWTH):      (không thay đổi)
+ Normalize:          tổng = 100 ✓

Final: { savings: 20%, gold: 20%, bonds: 18%, stocks: 37%, crypto: 5% }

Weighted return: 20%×5% + 20%×6.5% + 18%×5.8% + 37%×10% + 5%×20%
               = 1.0 + 1.3 + 1.044 + 3.7 + 1.0 = 8.04%/năm
Real return:   8.04% - 3.5% = 4.54%/năm (sau lạm phát)
```

---

## 4. Cơ sở của từng con số

### BASE Allocation

| Risk | Nguyên tắc | Tham chiếu |
|------|-----------|-----------|
| LOW 55% savings | Ưu tiên bảo toàn vốn, capital preservation first | Lifecycle Investing theory |
| LOW 25% gold | Vàng = hedge lạm phát, phổ biến trong văn hóa đầu tư VN | Vietnam retail investor behavior |
| LOW 15% bonds | TPCP VN 2024 có lãi suất hấp dẫn (~5.8%), rủi ro thấp | HNX bond yield data |
| MEDIUM 30/30 split | Growth/stable = 35/65, adapted từ 60/40 rule | Balanced portfolio theory |
| HIGH 55% stocks | Maximize growth dài hạn, VN-Index CAGR cao | Equity premium theory |
| HIGH 15% crypto | Exposure đáng kể cho risk-taker, nhưng < stocks | Risk-reward tradeoff |

### Sentiment Overlay

| Band | Max delta | Lý do giới hạn |
|------|-----------|---------------|
| EXTREME_FEAR | ±10% | Tránh override quá nhiều BASE allocation |
| EXTREME_GREED | ±5% | Thị trường hưng phấn → tăng nhẹ, không aggressive |

### Expected Returns

| Tài sản | Rate cũ | Rate mới | Thay đổi |
|---------|---------|---------|---------|
| Tiết kiệm | 6.0% (default) | 5.0% | -1% — sát lãi suất NHNN 2024 |
| Vàng | 8.0% | 6.5% | -1.5% — CAGR thực tế, loại trừ spike 2023-2024 |
| Cổ phiếu | 12.0% | 10.0% | -2% — VN-Index CAGR thực tế |
| Trái phiếu | 7.0% | 5.8% | -1.2% — lợi suất TPCP cuối 2024 |
| Crypto | 15.0% (fixed) | null → scenario | Thay bằng bear/base/bull cases |

### Risk Threshold

| Ngưỡng | Cũ | Mới | Lý do thay đổi |
|--------|-----|-----|---------------|
| HIGH | > 60 | >= 65 | Giảm false positive HIGH risk |
| MEDIUM | > 30 | >= 40 | Vùng MEDIUM rõ hơn |
| LOW | <= 30 | < 40 | |

---

## 5. Hạn chế còn lại

Những vấn đề **chưa được giải quyết** trong lần refactor này:

### Hạn chế 1: Fear & Greed Index không phản ánh thị trường VN
Fear & Greed Index của alternative.me tổng hợp từ: Bitcoin volatility, market momentum, social media, surveys, dominance, trends — **chủ yếu là crypto và Mỹ**.

VN-Index có thể đi ngược chiều hoàn toàn với global sentiment. Chưa có giải pháp lấy VN-specific sentiment indicator.

**Ảnh hưởng**: Sentiment overlay có thể không phù hợp với thực tế thị trường VN trong 1 số thời điểm.

### Hạn chế 2: Không có correlation matrix
Các tài sản trong danh mục có tương quan với nhau (ví dụ: crypto và stocks thường cùng chiều, vàng ngược chiều stocks). Hệ thống hiện tại không tính đến hiệu ứng đa dạng hóa thực sự.

**Ảnh hưởng**: Projected return không tính đến risk reduction từ diversification.

### Hạn chế 3: Projected return vẫn là point estimate
Dù đã có 3 kịch bản (base/optimistic/pessimistic), cách nhân/chia fixed (×1.3, ×0.5) vẫn là heuristic. Chưa có Monte Carlo simulation dựa trên phân phối xác suất thực tế.

### Hạn chế 4: Savingsrate layer đã bị bỏ
Phiên bản cũ có layer điều chỉnh theo `savingsRate` (lãi suất tiết kiệm cao → tăng savings). Layer này đã được **loại bỏ** trong refactor để đơn giản hóa, thay bằng `savingsRate` chỉ được dùng trong expected return calculation.

**Ảnh hưởng nhỏ**: Người dùng có savingsRate đặc biệt cao (>8%) hoặc thấp (<4%) sẽ không còn thấy allocation savings thay đổi theo.

### Hạn chế 5: Quiz questions chưa có id chuẩn
Weighted scoring dùng `answer.id` để tra trọng số, nhưng nếu frontend không gửi `id` trong từng answer, fallback về unweighted. Cần kiểm tra frontend RiskAssessment component.

---

## 6. Sơ đồ luồng xử lý

```
USER
 │
 ├─► [Quiz] 5 câu hỏi
 │         │
 │    Weighted Score (q3 = trọng số 2.0)
 │         │
 │    score >= 65 → HIGH
 │    score >= 40 → MEDIUM
 │    score <  40 → LOW
 │         │
 │    Lưu riskLevel vào InvestorProfile (DB)
 │
 ├─► [Trang Investment] Yêu cầu phân bổ
 │         │
 │    [1] Fetch Fear & Greed Index
 │        alternative.me/fng → cache Redis 30 phút
 │        Fallback: 50 (NEUTRAL)
 │         │
 │    [2] Map value → Sentiment Band
 │        0-20   → EXTREME_FEAR
 │        21-40  → FEAR
 │        41-59  → NEUTRAL  ← (fix: band, không phải điểm)
 │        60-74  → GREED
 │        75-100 → EXTREME_GREED
 │         │
 │    [3] Lấy BASE_ALLOCATIONS[riskLevel]
 │         │
 │    [4] Apply Sentiment Overlay  (max ±10%)
 │    [5] Apply Horizon Overlay    (SHORT/LONG)
 │    [6] Apply Capital Overlay    (SMALL/NORMAL/LARGE)
 │    [7] Apply Goal Adjustment    (STABILITY/SPECULATION)
 │    [8] Normalize về 100%
 │         │
 │    [9] Tính Projected Return
 │        weighted return = Σ(allocation% × assetReturn%)
 │        base = weighted - inflation
 │        optimistic = weighted × 1.3 - inflation
 │        pessimistic = max(-50%, weighted × 0.5 - inflation)
 │         │
 │    [10] Build response
 │         - allocation {savings, gold, bonds, stocks, crypto}
 │         - portfolioBreakdown (số tiền tuyệt đối)
 │         - projection {1y, 3y, 5y, 10y} × 3 scenarios
 │         - recommendation text
 │         - cryptoWarning (nếu crypto > 0%)
 │
 └─► Hiển thị trên UI
     - AllocationEngine (pie chart + breakdown)
     - AIRationalPanel (giải thích từng asset)
     - WealthProjection (biểu đồ 3 kịch bản)
     - SmartAssetGuide (gợi ý sản phẩm cụ thể)
```

---

## Ghi chú

> Hệ thống này là **công cụ hỗ trợ tham khảo**, không phải tư vấn tài chính chuyên nghiệp. Mọi quyết định đầu tư cần cân nhắc thêm tình hình cá nhân, tham khảo chuyên gia tài chính có phép, và chấp nhận rủi ro mất vốn.

> Các con số expected return dựa trên **dữ liệu lịch sử** — không đảm bảo kết quả tương lai.
