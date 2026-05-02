# Module 8: Dashboard & Báo Cáo — Logic Nghiệp Vụ Chi Tiết

---

## 1. Mục Đích Của Module Này

Các module 1–7 xử lý dữ liệu đầu vào và nghiệp vụ. Module 8 là đầu ra — nơi **dữ liệu được chuyển thành thông tin để ra quyết định**.

Phân biệt rõ hai thứ:

**Dữ liệu** — "Khoản nợ A outstanding 500 triệu, quá hạn 15 ngày." Đây là fact thô.

**Thông tin** — "Tháng này tỷ lệ thu hồi công nợ giảm 20% so với tháng trước, chủ yếu do nhóm khách hàng bán lẻ. DSO đang tăng từ 45 lên 62 ngày — nếu xu hướng này tiếp tục, dòng tiền tháng sau sẽ thiếu hụt khoảng 800 triệu." Đây là thông tin có thể ra quyết định.

Module 8 phải cung cấp loại thứ hai, không phải loại thứ nhất. Nếu chỉ hiển thị bảng số liệu thô thì người dùng phải tự phân tích — không khác gì dùng Excel.

---

## 2. Kiến Trúc Báo Cáo — Ba Tầng

Trước khi đi vào từng báo cáo cụ thể, cần hiểu báo cáo được tổ chức theo ba tầng với mục đích khác nhau.

**Tầng 1 — Operational Dashboard (Hàng ngày):**

Dành cho kế toán và người phụ trách công nợ. Câu hỏi cần trả lời: "Hôm nay tôi cần làm gì?" Thông tin phải realtime hoặc gần realtime, focus vào action items cụ thể.

**Tầng 2 — Management Reports (Hàng tuần/tháng):**

Dành cho kế toán trưởng và trưởng phòng tài chính. Câu hỏi cần trả lời: "Tháng này tình hình công nợ tốt hay xấu hơn tháng trước? Ở đâu?" Thông tin cần có xu hướng theo thời gian và so sánh được.

**Tầng 3 — Executive Summary (Hàng tháng/quý):**

Dành cho CFO và giám đốc. Câu hỏi cần trả lời: "Rủi ro tài chính của công ty đang ở mức nào? Có vấn đề gì cần quyết định ở cấp cao không?" Thông tin phải cô đọng, không quá nhiều số liệu chi tiết.

---

## 3. Tầng 1 — Operational Dashboard

### 3.1 Bốn KPI Số Lớn

Đây là thứ đầu tiên người dùng nhìn vào mỗi sáng. Bốn con số phải đủ để họ biết ngay hôm nay có vấn đề gì không.

**Tổng Phải Thu (Total Receivable):**

Tổng outstanding của tất cả khoản RECEIVABLE đang ACTIVE, PARTIAL, OVERDUE. Không tính DRAFT (chưa hiệu lực) và không tính DISPUTED (đang tranh chấp — báo riêng).

Kèm theo: so sánh với tháng trước — tăng hay giảm bao nhiêu phần trăm. Số tăng không nhất thiết là xấu (bán được nhiều hơn) và số giảm không nhất thiết là tốt (có thể do bán ít hơn). Phải đọc trong context.

**Tổng Phải Trả (Total Payable):**

Tổng outstanding của tất cả khoản PAYABLE đang ACTIVE, PARTIAL, OVERDUE.

Kèm theo: bao nhiêu phần trăm đến hạn trong 30 ngày tới — đây là áp lực dòng tiền ngắn hạn.

**Tổng Quá Hạn (Total Overdue):**

Tổng outstanding của tất cả khoản đang OVERDUE — cả Receivable lẫn Payable gộp lại, hiển thị phân tách rõ.

Kèm theo: penalty đang tích lũy mỗi ngày — con số này tạo urgency để hành động.

**Sắp Đến Hạn 7 Ngày (Due Soon):**

Tổng outstanding của các khoản có due_date trong vòng 7 ngày tới, chưa PAID.

Kèm theo: dòng tiền dự kiến — nếu là Receivable thì đây là tiền sắp thu về, nếu là Payable thì đây là tiền cần chuẩn bị để trả.

### 3.2 Action Items — Việc Cần Làm Hôm Nay

Đây là phần phân biệt dashboard tốt với dashboard trung bình. Thay vì chỉ hiển thị số, phải chuyển số thành danh sách việc cần làm cụ thể.

**Logic tạo action items:**

Khoản Receivable quá hạn → "Liên hệ [Tên đối tác] để đốc thúc thanh toán [X đồng] quá hạn [Y ngày]."

Khoản Payable đến hạn trong 3 ngày → "Chuẩn bị thanh toán [X đồng] cho [Tên NCC] trước ngày [Z]."

Khoản Payable quá hạn → "Xử lý ngay khoản nợ quá hạn với [Tên NCC], penalty hiện tại [X đồng/ngày]."

Khoản vừa chuyển sang DISPUTED → "Xem xét và xử lý tranh chấp với [Tên đối tác]."

**Thứ tự ưu tiên action items:**

```
1. Khoản Payable quá hạn (tránh bị phạt thêm)
2. Khoản Payable đến hạn hôm nay hoặc ngày mai
3. Khoản Receivable quá hạn lâu nhất (> 30 ngày)
4. Khoản Receivable đến hạn hôm nay
5. Khoản DISPUTED chưa được xử lý
```

Giới hạn tối đa 10 action items hiển thị trên dashboard — nếu nhiều hơn thì người dùng không đọc hết. Phần còn lại vào trang "Xem tất cả".

### 3.3 Biểu Đồ Dòng Tiền 30 Ngày

Timeline hiển thị từng ngày trong 30 ngày tới:

Cột xanh — tiền dự kiến thu về (Receivable đến hạn từng ngày).

Cột đỏ — tiền phải chi ra (Payable đến hạn từng ngày).

Đường net — hiệu giữa thu và chi, cho thấy ngày nào dòng tiền dương, ngày nào âm.

Điểm quan trọng: ngày nào net âm phải được highlight rõ — đây là ngày cần chuẩn bị dòng tiền trước. Người dùng nhìn vào phải thấy ngay "tuần tới ngày 15 có vấn đề về dòng tiền".

---

## 4. Tầng 2 — Management Reports

### 4.1 Aging Report — Báo Cáo Tuổi Nợ

Đây là báo cáo quan trọng nhất trong quản lý công nợ. Nó cho thấy không chỉ bao nhiêu tiền đang nợ mà còn **nợ đó có khả năng thu hồi được không**.

**Cấu trúc Aging Report:**

Rows — từng đối tác có công nợ.

Columns — phân loại theo tuổi nợ:

```
Chưa đến hạn | 1–30 ngày | 31–90 ngày | 91–180 ngày | 181–360 ngày | > 360 ngày | Tổng
```

Mỗi ô là tổng outstanding của đối tác đó trong bucket thời gian đó.

**Tỷ lệ trích lập dự phòng theo chuẩn VN:**

Đây là điểm thể hiện hiểu nghiệp vụ tài chính thật sự. Không phải mọi đồng nợ phải thu đều có giá trị như nhau — nợ càng lâu thì khả năng thu hồi càng thấp, phải trích lập dự phòng để phản ánh rủi ro thực tế:

```
Chưa đến hạn:    0% — chưa có vấn đề
1–30 ngày:       0% — vẫn trong vùng an toàn
31–90 ngày:      0–30% — tùy chính sách doanh nghiệp
91–180 ngày:     30% — chuẩn thông lệ VN
181–360 ngày:    50%
> 360 ngày:      100% — coi như mất
```

Hệ thống tự tính số tiền dự phòng cần trích lập cho từng đối tác và tổng toàn công ty. Con số này trực tiếp ảnh hưởng đến lợi nhuận kỳ báo cáo — đây là lý do kế toán trưởng và CFO quan tâm đến Aging Report.

**Drill-down:**

Click vào một ô trong bảng → xem danh sách chi tiết từng khoản nợ cụ thể nằm trong bucket đó của đối tác đó. Không cần export ra Excel mới xem được chi tiết.

**So sánh tháng:**

Aging Report tháng này so với tháng trước — bucket nào đang xấu đi (tiền đang dịch chuyển từ bucket ngắn sang bucket dài). Đây là cảnh báo sớm trước khi nợ xấu hình thành.

### 4.2 DSO và DPO — Chỉ Số Vòng Quay Công Nợ

**DSO (Days Sales Outstanding) — Số ngày thu tiền trung bình:**

```
DSO = (Tổng Receivable / Doanh thu thuần trong kỳ) × Số ngày trong kỳ
```

Ý nghĩa thực tế: nếu DSO = 45 ngày, trung bình khách hàng trả tiền sau 45 ngày. Nếu DSO tăng lên 60 ngày mà doanh thu không đổi — có 15 ngày tiền đang bị "chôn" thêm ở ngoài.

Benchmark theo ngành: DSO 30–45 ngày là tốt với hầu hết ngành B2B VN. Trên 90 ngày là đáng lo.

**DPO (Days Payable Outstanding) — Số ngày trả tiền trung bình:**

```
DPO = (Tổng Payable / Giá vốn hàng bán trong kỳ) × Số ngày trong kỳ
```

Ý nghĩa thực tế: DPO cao là tốt cho dòng tiền — mình giữ tiền lâu hơn trước khi trả NCC. Nhưng DPO quá cao (trễ hạn nhiều) thì lại xấu vì bị phạt và mất uy tín.

**Cash Conversion Cycle (CCC):**

```
CCC = DSO + DIO (ngày tồn kho) − DPO
```

CCC âm là lý tưởng — thu tiền trước khi phải trả. Walmart làm được điều này. Doanh nghiệp VN trung bình CCC từ 45–90 ngày.

Hiển thị DSO, DPO, CCC theo trend 6 tháng gần nhất trên line chart — cho thấy đang cải thiện hay xấu đi.

### 4.3 Báo Cáo Theo Đối Tác

Tổng hợp tất cả khoản nợ của từng đối tác — cả Receivable lẫn Payable — trong một view:

Tổng Receivable, tổng Payable, net position (Receivable − Payable).

Lịch sử thanh toán: trung bình trả trễ bao nhiêu ngày so với hạn.

Điểm xếp hạng đối tác dựa trên lịch sử: A (luôn đúng hạn), B (thỉnh thoảng trễ), C (thường trễ), D (nhiều lần không trả).

Hạn mức tín dụng còn lại.

Trend outstanding 6 tháng — đang tăng hay giảm.

Đây là thông tin để quyết định có nên tiếp tục bán chịu cho đối tác đó không và với hạn mức bao nhiêu.

### 4.4 Báo Cáo Theo Loại Nợ

Tổng hợp theo 4 loại nợ từ Module 2:

```
Thương mại:   Tổng outstanding, % quá hạn, DSO trung bình
Tài chính:    Tổng outstanding, tổng lãi phải trả tháng này, D/E ratio
Thuế:         Tổng outstanding, khoản nào đến hạn trong tháng, penalty tích lũy
Nội bộ:       Tổng outstanding, tách riêng không gộp vào tổng thương mại
```

Báo cáo này giúp ban lãnh đạo thấy cơ cấu nợ — bao nhiêu phần trăm là nợ thương mại (thường lành mạnh) và bao nhiêu là nợ tài chính (có chi phí lãi vay).

---

## 5. Tầng 3 — Executive Summary

### 5.1 Chỉ Số Sức Khỏe Tài Chính

Bốn nhóm chỉ số từ tài liệu, mỗi nhóm có đánh giá ngay trên dashboard:

**Nhóm thanh khoản:**

```
Current Ratio = Tài sản ngắn hạn / Nợ ngắn hạn
  ≥ 1.5 → Tốt (xanh)
  1.0–1.5 → Cần theo dõi (vàng)
  < 1.0 → Nguy hiểm (đỏ)

Quick Ratio = (Tiền + Phải thu ngắn hạn) / Nợ ngắn hạn
  ≥ 1.0 → Tốt
  0.5–1.0 → Cần chú ý
  < 0.5 → Nguy hiểm
```

**Nhóm đòn bẩy:**

```
D/E Ratio = Tổng nợ / Vốn chủ sở hữu
  < 1.0 → An toàn
  1.0–2.0 → Bình thường
  > 3.0 → Rủi ro cao

Debt Ratio = Tổng nợ / Tổng tài sản
  < 0.4 → Thấp
  0.4–0.6 → Trung bình
  > 0.6 → Cao
```

**Nhóm khả năng trả nợ:**

```
DSCR = EBITDA / (Lãi vay + Gốc phải trả trong kỳ)
  ≥ 1.5 → Tốt
  1.0–1.5 → Chấp nhận
  < 1.0 → Không đủ trả nợ — nghiêm trọng

ICR = EBIT / Chi phí lãi vay
  ≥ 3.0 → Tốt
  1.5–3.0 → Chấp nhận
  < 1.5 → Nguy hiểm
```

**Lưu ý quan trọng:** Các chỉ số này cần thêm dữ liệu từ ngoài hệ thống (EBITDA, tổng tài sản, vốn chủ sở hữu) — không chỉ từ dữ liệu công nợ. Trong scope cuộc thi, có thể cho người dùng nhập thủ công các con số tài chính này, hoặc chỉ implement những chỉ số tính được từ dữ liệu nợ sẵn có.

### 5.2 Nhóm Nợ Theo Chuẩn Ngân Hàng Nhà Nước VN

Đây là cách phân loại dùng trong hệ thống ngân hàng VN — nếu implement được sẽ thể hiện hiểu biết sâu về thị trường:

```
Nhóm 1 — Nợ đủ tiêu chuẩn:  Trong hạn hoặc quá hạn dưới 10 ngày → Dự phòng 0%
Nhóm 2 — Nợ cần chú ý:      Quá hạn 10–90 ngày → Dự phòng 5%
Nhóm 3 — Nợ dưới tiêu chuẩn: Quá hạn 91–180 ngày → Dự phòng 20%
Nhóm 4 — Nợ nghi ngờ:       Quá hạn 181–360 ngày → Dự phòng 50%
Nhóm 5 — Nợ có khả năng mất: Quá hạn trên 360 ngày → Dự phòng 100%
```

Hiển thị phân phối Receivable theo 5 nhóm này — dưới dạng stacked bar chart hoặc donut chart. Tỷ lệ Nhóm 1 càng cao càng tốt.

---

## 6. Báo Cáo Cash Flow Forecast

Đây là báo cáo phức tạp nhất nhưng có giá trị thực tế cao nhất.

**Mục tiêu:** Dự báo dòng tiền thu và chi trong 30/60/90 ngày tới dựa trên lịch nợ đã biết.

**Nguồn dữ liệu:**

Thu vào — từ `debt_schedules` của các khoản Receivable chưa thanh toán, lấy ngày đến hạn của từng kỳ.

Chi ra — từ `debt_schedules` của các khoản Payable chưa thanh toán.

**Độ tin cậy của dự báo:**

Không phải mọi khoản đến hạn đều thực sự về đúng hạn. Hệ thống phải tính "xác suất thu hồi" dựa trên lịch sử thanh toán của từng đối tác:

```
Đối tác hạng A (luôn đúng hạn):    Xác suất 95%
Đối tác hạng B (thỉnh thoảng trễ):  Xác suất 75%
Đối tác hạng C (thường trễ):        Xác suất 50%
Đối tác hạng D (hay không trả):     Xác suất 20%
```

Hiển thị hai đường trên chart: "Dự báo lạc quan" (tính 100% đến hạn thu được) và "Dự báo thực tế" (tính theo xác suất của từng đối tác). Khoảng cách giữa hai đường là vùng rủi ro dòng tiền.

**Cảnh báo dòng tiền âm:**

Ngày nào dự báo dòng tiền net âm — chi nhiều hơn thu — phải highlight đỏ và tính toán cụ thể: thiếu bao nhiêu, có thể bù đắp từ nguồn nào (đẩy nhanh thu từ khoản Receivable nào, hoặc xin gia hạn khoản Payable nào).

---

## 7. Snapshot Và Lịch Sử Báo Cáo

**Tại sao cần snapshot:**

Dữ liệu raw thay đổi liên tục — một khoản vừa được thanh toán, outstanding thay đổi ngay. Nếu mỗi lần xem báo cáo tháng trước đều query lại từ dữ liệu hiện tại, con số sẽ khác với con số đã thấy vào cuối tháng đó — vì có các khoản nợ đã được điều chỉnh, reversed, hoặc written-off sau đó.

Snapshot là ảnh chụp số liệu tại một thời điểm cụ thể — không thay đổi dù dữ liệu gốc sau đó có thay đổi.

**Job 4 từ Module 5** chịu trách nhiệm tạo snapshot cuối mỗi tháng. Snapshot lưu:

Aging Report tại ngày cuối tháng.

Tổng Receivable và Payable theo từng loại nợ.

DSO, DPO, CCC của tháng đó.

Tổng penalty tích lũy, tổng đã thu, tổng đã trả.

**So sánh liên kỳ:**

Mọi báo cáo management đều phải có cột "tháng trước" hoặc "cùng kỳ năm ngoái" để so sánh. Số tuyệt đối không có nhiều ý nghĩa nếu không so sánh được.

---

## 8. Validate Và Đảm Bảo Chất Lượng Số Liệu

**Kiểm tra chéo tự động:**

Hệ thống phải tự động kiểm tra tính nhất quán của số liệu sau mỗi ngày:

Tổng outstanding trong báo cáo phải bằng tổng outstanding tính từng khoản riêng lẻ.

Tổng transaction PAYMENT phải bằng tổng số tiền đã trả ghi nhận trong kỳ.

Số khoản PAID trong tháng cộng với số khoản WRITTEN_OFF phải bằng số khoản "đóng" trong tháng.

Nếu có sự lệch — dù nhỏ — phải alert admin ngay. Lệch số liệu trong báo cáo tài chính là vấn đề nghiêm trọng.

**Phát hiện bất thường:**

Báo cáo phải tự động flag những con số bất thường để người dùng kiểm tra lại:

Outstanding của một khoản tăng dù không có transaction penalty nào — có thể có lỗi.

Một đối tác có DSO đột ngột tăng gấp đôi so với tháng trước — cần xem xét.

Tổng penalty một ngày cao hơn 3 lần trung bình — có thể job tính trùng.

---

## 9. Những Điểm Hay Bị Bỏ Sót

**Báo cáo nội bộ vs thương mại phải tách riêng:**

Khoản nợ nội bộ (flag `is_related_party` từ Module 1) không được gộp vào báo cáo thương mại. Nếu gộp, D/E ratio sẽ sai — khoản vay từ công ty mẹ trông giống nợ ngân hàng trong báo cáo tổng hợp, làm số liệu méo mó.

**Khoản DISPUTED phải báo cáo riêng:**

Không gộp DISPUTED vào tổng outstanding bình thường. Cần một section riêng: "Công nợ đang tranh chấp" với tổng giá trị và danh sách chi tiết. Nếu gộp chung, ban lãnh đạo sẽ hiểu nhầm đây là tiền chắc chắn sẽ thu/trả được.

**Phân biệt "đến hạn" và "thực sự quá hạn":**

Một khoản đến hạn hôm nay nhưng đối tác đã thông báo sẽ chuyển khoản vào cuối ngày — về mặt kỹ thuật chưa quá hạn nhưng hệ thống có thể đang đếm vào "quá hạn". Cần định nghĩa rõ: quá hạn là sau 00:00 của ngày due_date hay sau kết thúc giờ làm việc của ngày due_date.

**Báo cáo không có nghĩa nếu không có baseline:**

Nếu DSO tháng này là 55 ngày — tốt hay xấu? Không biết nếu không có baseline. Hệ thống phải lưu và hiển thị: DSO trung bình 3 tháng trước, DSO cùng kỳ năm ngoái, DSO benchmark ngành (nếu có). Không có context thì con số trở nên vô nghĩa.

---

## 10. Thứ Tự Build Trong Module 8

Trong 4 tuần cuộc thi, không đủ thời gian build tất cả. Đây là thứ tự ưu tiên:

**Phải có — build trước:**

Bốn KPI số lớn trên Operational Dashboard. Đây là thứ đầu tiên giám khảo nhìn vào, phải chính xác và realtime.

Action items list — danh sách việc cần làm hôm nay. Thể hiện hệ thống "hiểu" nghiệp vụ chứ không chỉ hiển thị dữ liệu.

Aging Report đơn giản — ít nhất phải có bảng phân loại tuổi nợ với tỷ lệ dự phòng.

**Nên có — build sau khi phần trên xong:**

Biểu đồ dòng tiền 30 ngày.

DSO và DPO trend chart.

So sánh tháng trước cho KPI.

**Tốt nếu có — nếu còn thời gian:**

Cash Flow Forecast với độ tin cậy theo đối tác.

Chỉ số sức khỏe tài chính (Current Ratio, D/E, DSCR).

Phân loại theo 5 nhóm nợ chuẩn NHNN.

Executive Summary snapshot.

---

## 11. Mối Quan Hệ Với Các Module Khác

Module 8 là module **chỉ đọc** — không bao giờ ghi dữ liệu, không trigger transaction, không thay đổi trạng thái bất kỳ khoản nợ nào.

Đọc từ toàn bộ Module 1–7 để aggregate dữ liệu. Không có module nào không liên quan đến Module 8.

Nhận snapshot từ Job 4 của Module 5 — đây là nguồn dữ liệu cho báo cáo lịch sử, còn dữ liệu realtime thì query trực tiếp.

Cung cấp context cho Module 7 — Repayment Planner đọc lịch sử DSO, DPO, aging trend để đưa ra đề xuất chiến lược chính xác hơn.

Là điểm cuối của toàn bộ hệ thống — mọi dữ liệu từ Module 1 đến 7 đều hội tụ ở đây để phục vụ một mục đích duy nhất: giúp người ra quyết định nhìn thấy toàn bộ bức tranh công nợ của doanh nghiệp một cách rõ ràng và chính xác nhất có thể.