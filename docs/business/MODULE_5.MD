# Module 5: Tự Động Xử Lý Quá Hạn (Scheduled Job) — Logic Nghiệp Vụ Chi Tiết

---

## 1. Tại Sao Cần Scheduled Job

Hệ thống quản lý nợ không thể chỉ phản ứng khi người dùng thao tác — nó phải **chủ động theo dõi và xử lý** những sự kiện xảy ra theo thời gian mà không cần ai trigger. Cụ thể:

Ngày hôm nay một khoản nợ vượt due_date — không ai vào hệ thống bấm nút, nhưng khoản nợ phải tự động chuyển sang OVERDUE.

Mỗi ngày khoản nợ quá hạn tồn tại — penalty phải tự động tích lũy mà không cần kế toán tính tay.

Các mốc cảnh báo sắp đến hạn — hệ thống phải tự nhận ra và gửi thông báo trước khi quá muộn.

Nếu những việc này phụ thuộc vào người dùng, sẽ luôn có khoảng trống — người nghỉ phép, quên kiểm tra, hoặc đơn giản là không biết. Scheduled Job lấp đầy khoảng trống đó.

---

## 2. Tổng Quan Các Job Cần Có

Không phải chỉ có một job duy nhất. Hệ thống cần ít nhất bốn job độc lập nhau, mỗi job có trách nhiệm riêng biệt:

**Job 1 — Phát hiện và xử lý quá hạn** (00:01 mỗi ngày)

Nhiệm vụ cốt lõi: scan toàn bộ khoản nợ, tìm những khoản vừa vượt due_date, chuyển trạng thái sang OVERDUE.

**Job 2 — Tính penalty hàng ngày** (00:05 mỗi ngày, sau Job 1)

Tính penalty cho tất cả khoản đang OVERDUE, ghi vào transaction log.

**Job 3 — Gửi cảnh báo sắp đến hạn** (07:00 mỗi ngày)

Scan các khoản sắp đến hạn trong T-30, T-15, T-7, T-1 và tạo notification.

**Job 4 — Tổng hợp báo cáo định kỳ** (00:30 đầu mỗi tháng)

Tính toán và snapshot các chỉ số tháng trước: tổng outstanding, aging bucket, DSO, DPO.

Tại sao tách thành 4 job riêng thay vì gộp một job làm hết? Vì nếu gộp, khi một phần bị lỗi thì toàn bộ job fail. Nếu tách riêng, Job 2 bị lỗi không ảnh hưởng đến Job 1 và Job 3 — penalty không tính được hôm nay nhưng trạng thái vẫn chuyển đúng và cảnh báo vẫn đi ra.

---

## 3. Job 1 — Phát Hiện Và Xử Lý Quá Hạn

### Khi nào chạy

00:01 mỗi ngày — chạy sớm nhất có thể trong ngày để khi nhân viên vào làm lúc 8 giờ sáng, trạng thái đã được cập nhật chính xác.

### Logic xử lý

**Bước 1 — Xác định "hôm nay" là ngày nào**

Nghe đơn giản nhưng thực ra quan trọng. Phải dùng ngày theo múi giờ của doanh nghiệp (GMT+7 với VN), không phải UTC. Nếu dùng UTC, job chạy lúc 00:01 GMT+7 tức là 17:01 ngày hôm trước theo UTC — sẽ tính sai ngày.

**Bước 2 — Query khoản nợ cần xử lý**

Query theo hai nhóm:

Nhóm A — khoản nợ trả một lần: tìm tất cả khoản có trạng thái ACTIVE hoặc PARTIAL, có `due_date < today`, và `last_overdue_check_date` chưa phải hôm nay (idempotency check).

Nhóm B — khoản nợ nhiều kỳ: tìm tất cả `debt_schedule` có `due_date < today`, trạng thái kỳ đó là PENDING (chưa trả), và khoản nợ tổng chưa ở trạng thái terminal.

Hai nhóm này phải xử lý riêng vì logic khác nhau.

**Bước 3 — Xử lý từng khoản**

Với Nhóm A:

Chuyển trạng thái khoản nợ sang OVERDUE qua Module 3.

Ghi `overdue_since = today` nếu chưa có (lần đầu tiên quá hạn).

Ghi `last_overdue_check_date = today`.

Tạo audit log: triggered_by = "SYSTEM/JOB_OVERDUE", timestamp, lý do.

Với Nhóm B:

Đánh dấu kỳ đó là `is_overdue = true` trong `debt_schedules`.

Ghi `overdue_since` cho kỳ đó.

Khoản nợ tổng không nhất thiết chuyển sang OVERDUE — chỉ chuyển nếu kỳ quá hạn là kỳ quan trọng (kỳ đầu tiên chưa trả hoặc tổng overdue amount vượt ngưỡng cấu hình).

**Bước 4 — Trigger downstream**

Sau khi xử lý xong, emit event để Job 3 biết có khoản mới vừa quá hạn và cần gửi cảnh báo ngay — không đợi đến 7 giờ sáng hôm sau.

### Idempotency — Điểm quan trọng nhất của Job 1

Job phải được thiết kế để **chạy nhiều lần trong cùng một ngày cho kết quả như nhau**. Lý do: job có thể fail giữa chừng và cần retry, hoặc ai đó chạy lại thủ công để debug.

Cách đảm bảo idempotency: trước khi xử lý một khoản nợ, check `last_overdue_check_date`. Nếu đã bằng today thì skip — không xử lý lại. Chỉ xử lý những khoản chưa được check hôm nay.

---

## 4. Job 2 — Tính Penalty Hàng Ngày

### Khi nào chạy

00:05 mỗi ngày — 4 phút sau Job 1 để đảm bảo Job 1 đã hoàn thành và tất cả khoản mới quá hạn đã được chuyển trạng thái.

### Logic tính penalty

**Bước 1 — Query khoản cần tính penalty**

Tất cả khoản đang OVERDUE hoặc có kỳ `is_overdue = true`, và `last_penalty_date` chưa phải hôm nay.

**Bước 2 — Xác định rate áp dụng theo loại nợ**

```
Vay ngân hàng:    0.03%/ngày trên dư nợ (theo luật VN)
Thuế/BHXH:        0.03%/ngày (cố định, luật không cho thương lượng)
Nợ thương mại:    theo điều khoản hợp đồng (thường 0.05–0.1%/tháng)
Nợ nội bộ:        theo thỏa thuận, có thể = 0
Trái phiếu:       theo điều khoản phát hành
```

Rate này phải được đọc từ cấu hình của từng khoản nợ, không hard-code trong job. Vì mỗi hợp đồng có thể có điều khoản phạt khác nhau.

**Bước 3 — Tính penalty ngày hôm nay**

Với khoản trả một lần:

```
Penalty hôm nay = Outstanding gốc còn lại × Daily Rate
```

Lưu ý: tính trên outstanding gốc, không tính trên tổng bao gồm cả penalty cũ chưa trả. Không được tính "lãi kép trên penalty" — điều này vi phạm quy định pháp luật VN.

Với khoản nhiều kỳ:

```
Penalty hôm nay = Dư nợ kỳ quá hạn × Daily Rate
```

Chỉ tính trên phần dư nợ của kỳ quá hạn, không phải toàn bộ dư nợ còn lại của khoản.

**Bước 4 — Ghi nhận vào transaction log**

Tạo một transaction với type = PENALTY, số tiền bằng penalty vừa tính, ngày = hôm nay, triggered_by = "SYSTEM/JOB_PENALTY".

Penalty không làm giảm outstanding gốc — nó làm tăng tổng nghĩa vụ tài chính. Outstanding gốc chỉ giảm khi có PAYMENT thực sự.

**Bước 5 — Cập nhật last_penalty_date**

Ghi `last_penalty_date = today` để đảm bảo idempotency — job chạy lại hôm nay sẽ không tính penalty lần nữa.

### Xử Lý Grace Period

Một số khoản nợ có grace period — khoảng thời gian được phép trễ mà không tính phạt. Job phải check:

```
Ngày bắt đầu tính penalty = due_date + grace_period_days
```

Nếu hôm nay chưa qua ngày này thì skip, không tính penalty dù khoản đã OVERDUE. Khoản vẫn ở OVERDUE về mặt trạng thái nhưng penalty chưa tích lũy.

### Trường Hợp Lãi Suất Thay Đổi Giữa Chừng

Ngân hàng điều chỉnh lãi suất (với floating rate). Job phải đọc lãi suất hiệu lực tại ngày hôm nay, không phải lãi suất tại ngày tạo khoản nợ. Lịch sử lãi suất phải được lưu lại với ngày hiệu lực để Job biết dùng rate nào cho ngày nào.

---

## 5. Job 3 — Gửi Cảnh Báo Sắp Đến Hạn

### Khi nào chạy

07:00 mỗi ngày — giờ đầu giờ làm việc để cảnh báo đến tay người phụ trách khi họ bắt đầu ngày làm.

### Logic xử lý

**Bước 1 — Xác định các mốc cần cảnh báo hôm nay**

Với khoản trả một lần: tính `days_until_due = due_date - today`. Nếu days_until_due thuộc các mốc 30, 15, 7, 1 thì tạo notification.

Với khoản nhiều kỳ: tính tương tự nhưng theo due_date của từng kỳ chưa thanh toán.

Với khoản vừa chuyển sang OVERDUE hôm nay (từ Job 1): cũng tạo notification ngay, không đợi các mốc trên.

**Bước 2 — Phân loại mức độ cảnh báo**

```
Vừa quá hạn:    Khẩn cấp — đỏ, notify ngay
Còn 1 ngày:     Rất gấp — đỏ cam
Còn 7 ngày:     Gấp — cam
Còn 15 ngày:    Chú ý — vàng
Còn 30 ngày:    Nhắc nhở — xanh
```

**Bước 3 — Xác định người nhận**

Người phụ trách khoản nợ (assignee của khoản nợ đó).

Người phụ trách đối tác (assignee của party).

Cấp quản lý trực tiếp — chỉ với mức độ "Khẩn cấp" và "Rất gấp".

Không broadcast cho toàn bộ team — thông báo tràn lan sẽ bị bỏ qua.

**Bước 4 — Chống duplicate notification**

Trước khi tạo notification mới, check xem hôm nay đã gửi cảnh báo ở mốc này cho khoản này chưa. Nếu rồi thì skip — không gửi lại.

Lý do: Job có thể bị retry do lỗi hạ tầng. Nếu không check, người nhận sẽ bị spam cùng một cảnh báo nhiều lần.

### Escalation Logic

Nếu một khoản nợ quá hạn mà không có động thái gì sau N ngày, hệ thống phải leo thang cảnh báo lên cấp cao hơn:

```
Quá hạn 1–7 ngày:    Notify người phụ trách
Quá hạn 8–15 ngày:   Notify thêm trưởng phòng
Quá hạn 16–30 ngày:  Notify thêm giám đốc tài chính
Quá hạn > 30 ngày:   Notify giám đốc điều hành, đề xuất chuyển DISPUTED hoặc WRITTEN_OFF
```

Ngưỡng leo thang này phải được cấu hình, không hard-code.

---

## 6. Job 4 — Tổng Hợp Báo Cáo Định Kỳ

### Khi nào chạy

00:30 ngày đầu tiên của mỗi tháng — sau khi Job 1 và Job 2 đã chạy xong.

### Nhiệm vụ

Snapshot toàn bộ số liệu của tháng vừa kết thúc:

Tổng Receivable và Payable cuối tháng.

Aging bucket — phân loại toàn bộ khoản nợ theo tuổi quá hạn, tính tỷ lệ trích lập dự phòng.

DSO (Days Sales Outstanding) — trung bình số ngày thu tiền.

DPO (Days Payable Outstanding) — trung bình số ngày trả tiền.

Tổng penalty tích lũy trong tháng.

Tổng đã thu và đã trả trong tháng.

Snapshot này phải được lưu vào bảng riêng — không tính lại từ raw data mỗi lần xem báo cáo vì raw data thay đổi liên tục, snapshot mới cho số liệu ổn định để so sánh tháng này với tháng trước.

---

## 7. Xử Lý Lỗi Và Retry

### Nguyên tắc chung

Mỗi job phải có timeout — nếu chạy quá lâu (ví dụ 30 phút) thì tự kill để không block job lần sau.

Mỗi job phải ghi log đầy đủ: bắt đầu lúc nào, xử lý bao nhiêu record, thành công bao nhiêu, fail bao nhiêu, kết thúc lúc nào. Log này là công cụ debug duy nhất khi có vấn đề.

Khi một record xử lý bị lỗi, phải log lỗi đó và **tiếp tục xử lý record tiếp theo** — không để một record lỗi làm fail toàn bộ job.

### Dead Letter Queue

Những record fail sau nhiều lần retry phải được đưa vào Dead Letter Queue — danh sách chờ xử lý thủ công. Người quản trị hệ thống phải được notify khi có record trong queue này.

Không được để record fail bị bỏ qua hoàn toàn — penalty không được tính cho một khoản nợ vì lỗi kỹ thuật là sai nghiệp vụ.

### Retry Strategy

Khi job fail toàn bộ (không phải từng record):

```
Lần retry 1: sau 5 phút
Lần retry 2: sau 15 phút
Lần retry 3: sau 30 phút
Sau 3 lần vẫn fail: alert admin, không retry nữa
```

Với Job 1 và Job 2, nếu fail và không retry kịp trong ngày thì sáng hôm sau vẫn phải chạy bù — job phải có khả năng "catch up" bằng cách xử lý tất cả record từ ngày cuối cùng chạy thành công đến hôm nay, không chỉ xử lý hôm nay.

---

## 8. Những Trường Hợp Đặc Biệt Hay Bị Bỏ Sót

**Ngày lễ và cuối tuần:**

Với nợ thương mại, một số hợp đồng quy định nếu due_date rơi vào ngày lễ hoặc cuối tuần thì được dời sang ngày làm việc tiếp theo. Job phải biết lịch ngày lễ và áp dụng đúng theo điều khoản từng hợp đồng — không phải áp dụng chung cho tất cả.

Với nợ thuế, không có ngoại lệ ngày lễ — deadline vẫn là deadline theo luật.

**Server timezone và database timezone lệch nhau:**

Đây là lỗi kỹ thuật hay gặp nhất. Server chạy UTC, database lưu timestamp UTC, nhưng logic nghiệp vụ cần ngày theo GMT+7. Nếu không xử lý nhất quán, job chạy lúc 00:01 GMT+7 tức là 17:01 UTC ngày hôm trước — query `due_date < today` sẽ dùng ngày sai.

Giải pháp: luôn convert sang timezone của doanh nghiệp trước khi so sánh ngày. Không bao giờ so sánh date trực tiếp từ UTC timestamp.

**Khoản nợ được gia hạn sau khi job đã chạy:**

Job chạy lúc 00:01 và chuyển khoản A sang OVERDUE. Lúc 9 giờ sáng, kế toán cập nhật gia hạn khoản A thêm 30 ngày. Khoản A đang OVERDUE trong khi thực ra chưa đến hạn.

Xử lý: khi gia hạn một khoản đang OVERDUE, hệ thống phải tự động chuyển trạng thái về ACTIVE/PARTIAL tùy outstanding, xóa `overdue_since`, và hoàn lại penalty đã tính hôm nay nếu chưa có payment nào.

**Job chạy chồng nhau:**

Server bị chậm, Job 1 hôm nay chưa chạy xong thì đã đến giờ của Job 1 ngày hôm sau. Phải có distributed lock để đảm bảo mỗi lúc chỉ có một instance của mỗi job đang chạy. Dùng Redis lock hoặc database lock.

**Khoản nợ có số lượng lớn:**

Nếu doanh nghiệp có hàng nghìn khoản nợ, job không được query toàn bộ vào memory rồi xử lý — phải xử lý theo batch (ví dụ 100 record mỗi batch) để tránh OOM và cho phép retry từng batch độc lập nhau.

---

## 9. Monitoring Và Alerting

Job chạy ngầm — không có ai nhìn vào màn hình để biết job có chạy đúng không. Phải có hệ thống monitoring chủ động:

**Heartbeat check:** Sau khi mỗi job chạy xong phải ghi timestamp vào một bảng health_check. Một monitor riêng check bảng này mỗi 10 phút — nếu Job 1 chưa ghi heartbeat sau 00:30 thì alert admin ngay.

**Metric tracking:** Mỗi lần job chạy phải ghi lại số record xử lý thành công, số fail, thời gian chạy. Nếu một ngày số record xử lý đột ngột cao hơn bình thường gấp 3 lần — có thể có vấn đề với data, cần kiểm tra.

**Penalty sanity check:** Sau khi Job 2 chạy, tổng penalty tính ra hôm nay không được vượt quá một ngưỡng hợp lý (ví dụ 200% của ngày hôm qua). Nếu vượt thì có thể có lỗi tính toán — alert trước khi penalty sai này được ghi vào database.

---

## 10. Mối Quan Hệ Với Các Module Khác

Job 1 gọi Module 3 để xử lý transition OVERDUE — không tự ý thay đổi trạng thái trực tiếp trên database.

Job 2 gọi Module 4 để tạo transaction PENALTY — tuân theo đúng flow ghi nhận transaction, không bypass.

Job 3 đọc dữ liệu từ Module 2 và Module 3 để biết khoản nào cần cảnh báo, đọc từ Module 1 để biết notify ai.

Job 4 aggregate từ toàn bộ các module để tạo snapshot báo cáo cho Module 8.

Không có job nào được bypass module khác để ghi thẳng vào database — tất cả phải đi qua đúng service layer. Đây là nguyên tắc quan trọng để đảm bảo business rule luôn được áp dụng nhất quán dù trigger từ đâu.
