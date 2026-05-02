# Full Plan — Phần Mềm Quản Lý Nợ Doanh Nghiệp

**Stack:** Express.js + React.js | **Thời gian:** 4 tuần

---

## Module 1: Quản Lý Đối Tác (Parties)

**Tính năng:**
- CRUD đối tác: tên, MST, loại, người phụ trách, liên hệ
- Một đối tác có thể vừa là khách hàng vừa là NCC — không dùng single `type`, dùng tags hoặc multi-select
- Flag `is_related_party` cho công ty mẹ/con/cổ đông vì báo cáo nội bộ khác thương mại
- Xem lịch sử toàn bộ khoản nợ của một đối tác

**Lưu ý dev:**
Đừng để `type` là enum cứng. Thực tế một đối tác đổi vai trò theo từng giao dịch. Để hệ thống tự suy ra vai trò từ khoản nợ gắn với họ thay vì hard-code trên profile.

---

## Module 2: Quản Lý Khoản Nợ (Debt Records)

**Tính năng:**
- Tạo khoản nợ với đầy đủ thông tin: loại (RECEIVABLE/PAYABLE), đối tác, số tiền gốc, ngày phát sinh, ngày đến hạn, nguồn gốc, lãi suất, phương thức trả
- Phân loại nguồn gốc: Thương mại | Vay ngân hàng | Thuế | Trái phiếu | Nội bộ
- Đính kèm tài liệu: hợp đồng, hóa đơn, biên bản
- Chọn phương thức trả: Một lần | Nhiều kỳ → nếu nhiều kỳ thì chọn tiếp phương thức tính lãi
- Hệ thống tự sinh `debt_schedules` khi chọn nhiều kỳ, không cho nhập tay

**3 phương thức tính lãi cần implement:**

Reducing Balance — lãi tính trên dư nợ còn lại, giảm dần theo từng kỳ trả gốc.

EMI — trả đều mỗi kỳ, công thức `EMI = P × [r(1+r)^n] / [(1+r)^n - 1]`. Số tiền cố định mỗi tháng, thuận tiện cho kế hoạch dòng tiền.

Bullet — mỗi kỳ chỉ trả lãi, cuối kỳ trả toàn bộ gốc. Phổ biến với trái phiếu doanh nghiệp.

**Lưu ý dev:**
Cột `outstanding` không được lưu trực tiếp rồi cộng trừ tay. Phải derive từ `SUM(debt_transactions)`. Nếu không, sau này concurrent payment sẽ sinh ra race condition khiến số dư âm. Dùng database transaction + row-level lock khi ghi nhận thanh toán.

---

## Module 3: Vòng Đời Khoản Nợ (State Machine)

**6 trạng thái:**

```
DRAFT → ACTIVE → PARTIAL → PAID (terminal)
                ↓
             OVERDUE → WRITTEN_OFF (terminal)
ACTIVE/PARTIAL/OVERDUE → DISPUTED
```

**Transition rules:**
- DRAFT → ACTIVE: phải có đủ principal, counterparty, due_date
- ACTIVE/PARTIAL → OVERDUE: chỉ scheduled job mới được trigger, không cho user chuyển tay
- PAID/WRITTEN_OFF: không thể quay lại trạng thái nào khác
- DISPUTED: vẫn tính lãi bình thường, chỉ khác ở báo cáo

**Lưu ý dev:**
Mỗi transition phải ghi log: ai trigger, lúc nào, lý do. Không cho xóa khoản nợ vật lý — chỉ WRITTEN_OFF. Giám khảo kỹ thuật tài chính sẽ hỏi về audit trail này.

---

## Module 4: Ghi Nhận Thanh Toán (Transactions)

**Flow:**
1. User nhập: số tiền, ngày, hình thức (chuyển khoản/tiền mặt), bằng chứng
2. Validate: số tiền không được vượt `outstanding`
3. Phân bổ theo thứ tự: **Phạt → Lãi → Gốc** (chuẩn kế toán, không được đảo)
4. Tạo `debt_transaction` record
5. Recalculate `outstanding`
6. Chuyển trạng thái: PARTIAL nếu còn dư, PAID nếu hết

**Edge cases cần xử lý:**
- Thanh toán khi đang OVERDUE: phải tính penalty tích lũy từ ngày quá hạn đến ngày thanh toán trước, sau đó mới phân bổ phần còn lại vào gốc
- Thanh toán vượt outstanding: reject cứng, không để số dư âm
- Thanh toán đúng một kỳ trong lịch nhiều kỳ: map vào đúng `debt_schedule` của kỳ đó, không cộng chung
- Hoàn tiền (reversal): khi thanh toán nhầm, phải có transaction loại REVERSAL để đảo lại, không được xóa transaction gốc

---

## Module 5: Tự Động Xử Lý Quá Hạn (Scheduled Job)

**Job chạy 00:01 mỗi ngày:**
1. Query tất cả khoản ACTIVE/PARTIAL có `due_date < today`
2. Chuyển sang OVERDUE
3. Tính penalty ngày hôm đó theo từng loại nợ:
   - Vay ngân hàng: 0.03%/ngày trên dư nợ (theo luật VN)
   - Thuế: 0.03%/ngày (cố định, không thương lượng)
   - Thương mại: theo điều khoản hợp đồng
   - Nội bộ: có thể 0
4. Ghi vào `debt_transactions` với type = PENALTY
5. Trigger notification event

**Lưu ý dev:**
Job phải idempotent — check `last_penalty_date` trước khi tính, tránh chạy 2 lần trong ngày tính penalty 2 lần. Với khoản nợ nhiều kỳ, check từng `debt_schedule` riêng, không check tổng khoản nợ. Dùng `node-cron` hoặc Bull queue.

---

## Module 6: Cảnh Báo & Nhắc Nhở (Notifications)

**Mốc nhắc:** T-30, T-15, T-7, T-1 trước ngày đến hạn + ngay khi quá hạn.

**Phân cấp màu:**
- Đỏ: đã quá hạn
- Cam: còn ≤ 7 ngày
- Vàng: còn 8–15 ngày
- Xanh: còn 16–30 ngày

**Lưu ý dev:**
Phải exclude trạng thái PAID và WRITTEN_OFF khỏi danh sách cảnh báo — lỗi hay gặp nhất là khoản đã thanh toán xong vẫn hiện cảnh báo. Badge số lượng trên header phải realtime hoặc polling mỗi 5 phút, không để stale.

---

## Module 7: Kế Hoạch Trả Nợ (Repayment Planner)

Đây là tính năng phức tạp nhất, nên để sau cùng khi các module cơ bản đã chạy được.

**Input:**
- Ngân sách trả nợ tháng này (slider hoặc nhập tay)
- Chiến lược ưu tiên

**4 chiến lược:**

`Avalanche (Lãi cao nhất)` — sort theo annual rate giảm dần, phân bổ hết vào khoản đầu tiên trước khi xuống khoản tiếp. Tiết kiệm tổng lãi phải trả nhiều nhất. Dùng khi doanh nghiệp muốn tối ưu chi phí tài chính dài hạn.

`Snowball (Số dư nhỏ nhất)` — sort theo outstanding tăng dần. Tất toán khoản nhỏ nhanh để giải phóng hạn mức tín dụng. Dùng khi đang cần vay thêm hoặc muốn giảm số đầu khoản phải quản lý.

`Quá hạn trước` — sort theo overdue_days giảm dần. Ngăn phạt leo thang, bảo vệ credit score. Quan trọng khi đang trong quá trình thẩm định ngân hàng.

`Covenant risk` — score tổng hợp: thuế (+3), quá hạn (+2), lãi suất cao (+1). Vi phạm covenant ngân hàng (D/E, DSCR vượt ngưỡng) có thể kéo theo yêu cầu trả nợ trước hạn toàn bộ — đây là rủi ro nghiêm trọng nhất.

**Output cần hiển thị:**
- Thứ tự trả tối ưu có giải thích lý do
- Số tiền phân bổ cụ thể cho từng khoản trong tháng
- Dự báo số tháng tất toán từng khoản với ngân sách hiện tại
- Biểu đồ dòng tiền chi trả 6 tháng tới
- Insight tự động: nếu ngân sách không đủ cover lãi → cảnh báo "bẫy nợ"

**Lưu ý dev:**
Logic phân bổ phải waterfall — đổ hết vào khoản ưu tiên 1 cho đến khi hết hoặc tất toán, rồi mới xuống khoản 2. Không chia đều. Tính `monthsToPayoff` phải trừ phần lãi ra khỏi monthly payment trước khi chia cho outstanding, không chia thô.

---

## Module 8: Dashboard & Báo Cáo

**4 KPI số lớn trên dashboard:**
- Tổng phải thu
- Tổng phải trả
- Tổng quá hạn
- Sắp đến hạn trong 7 ngày

**Aging Report** — phân loại tuổi nợ theo chuẩn ngân hàng VN, kèm tỷ lệ trích lập dự phòng:
- Nhóm 1 (< 10 ngày quá hạn): 0%
- Nhóm 2 (10–90 ngày): 5%
- Nhóm 3 (91–180 ngày): 20%
- Nhóm 4 (181–360 ngày): 50%
- Nhóm 5 (> 360 ngày): 100%

**Cash Flow Forecast** — aggregate `debt_schedules` theo timeline, hiển thị dòng tiền dự kiến thu/chi từng tuần trong 90 ngày tới.

**Lưu ý dev:**
Build KPI trước (đơn giản nhất), Aging Report sau, Cash Flow Forecast cuối cùng vì nó phụ thuộc `debt_schedules` phải có data đầy đủ. Đừng build ngược.

---

## Thứ Tự Build Thực Tế

```
Tuần 1: Module 1 + 2 + 3 (foundation)
Tuần 2: Module 4 + 5 (core business logic)
Tuần 3: Module 6 + 8 (alerts + dashboard)
Tuần 4: Module 7 + seed data thực tế + polish
```

Nếu bị cắt thời gian, cắt theo thứ tự: Covenant strategy → Cash Flow Forecast → Aging Report → Notification. Giữ nguyên Module 1–5 vì đó là core không thể thiếu.

---

## Những Điểm Giám Khảo Sẽ Hỏi

**"Outstanding được tính như thế nào?"** — phải trả lời được là derive từ transaction history, không phải lưu trực tiếp.

**"Nếu job penalty chạy 2 lần thì sao?"** — phải có idempotency check.

**"Tại sao thứ tự phân bổ là Phạt → Lãi → Gốc?"** — đây là chuẩn kế toán, trả gốc trước sẽ làm lệch báo cáo tài chính.

**"Audit trail ở đâu?"** — mọi thay đổi trạng thái và mọi transaction đều có log, không xóa vật lý.

**"Covenant risk strategy hoạt động thế nào?"** — cần giải thích được scoring logic và tại sao vi phạm covenant nguy hiểm hơn quá hạn thông thường.