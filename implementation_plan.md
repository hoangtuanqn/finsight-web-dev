# Blueprint & Kế Hoạch Triển Khai: Module Quản Lý Nợ (Debt Management)

Tài liệu này là bức tranh tổng thể (Big Picture) và bản thiết kế kiến trúc nghiệp vụ tài chính dành riêng cho module Quản Lý Nợ của FinSight. Nó kết hợp 9 định hướng UX/UI gốc và vá lại toàn bộ các lỗ hổng theo chuẩn hệ thống Core Banking.

> [!IMPORTANT]
> **Mục Tiêu:** Biến tính năng "Ghi chép nợ" đơn thuần thành một "Hệ thống Quản trị Rủi ro & Tín dụng" chuyên nghiệp, không thể bị bắt bẻ bởi bất kỳ chuyên gia tài chính nào.

---

## Bức Tranh Tổng Thể (9 Trụ Cột Nghiệp Vụ)

### 1. Báo Cáo & Thống Kê (Chi Tiết Giai Đoạn 1)
Thay vì chỉ hiển thị các con số khô khan, hệ thống sẽ biến dữ liệu nợ thành một "trung tâm chỉ huy tài chính".

#### A. Hệ thống Biểu đồ (Visual Analytics):
- **Cơ cấu nợ (Debt Mix - Donut Chart)**: Phân tích tỷ trọng nợ theo loại (Thẻ tín dụng, Vay ngân hàng, Vay cá nhân). Giúp user nhận diện "vùng đỏ" đang chiếm dụng vốn nhiều nhất.
- **Xu hướng dư nợ (Balance Trend - Area Chart)**: Biểu đồ vùng thể hiện sự sụt giảm của tổng nợ qua các tháng. Mục tiêu là thấy được đường nợ đi xuống và đường tích lũy đi lên.
- **Lãi suất vs Gốc (Interest vs Principal - Stacked Bar Chart)**: Thống kê hàng tháng bao nhiêu tiền "biến mất" vào lãi vay và bao nhiêu tiền thực sự làm giảm gốc nợ. Đây là biểu đồ "cảnh tỉnh" người dùng về chi phí lãi vay.
- **Tiến độ tất toán (Payoff Progress - Circular Progress)**: Con số % trực quan cho biết user đã đi được bao xa trên con đường thoát nợ.

#### B. Tính năng Xuất báo cáo (Export Functionality):
- **Option lọc linh hoạt (UI Proposed)**:
    - **Khoảng thời gian**: Tháng hiện tại, 3 tháng gần nhất, 6 tháng gần nhất hoặc Khoảng tự chọn (Date Range Picker).
    - **Đối tượng**: "Tất cả khoản nợ" (Báo cáo tổng quát) hoặc "Chọn khoản nợ cụ thể" (Báo cáo chuyên sâu cho 1 khoản vay).
    - **Định dạng**: PDF (Để xem và lưu trữ chuyên nghiệp) hoặc Excel/CSV (Để người dùng tự xử lý dữ liệu).
- **Thiết kế UI**: Sử dụng một `ExportReportModal` hiện đại với giao diện các bước (Step-by-step) đơn giản, tránh gây rối cho user.

#### C. Chiến lược Template (PDF/Excel):
- **Tái sử dụng & Nâng cấp chuyên sâu**: Tôi sẽ **giữ lại và cải tiến bộ khung `ReportService` hiện tại** của bạn thay vì viết mới từ đầu để đảm bảo tính kế thừa.
- **Cải tiến Layout PDF**:
    - Nâng cấp Header với phong cách Sharp Geometry (hình khối sắc nét), tối ưu hóa vị trí LOGO.
    - Thêm mục **"Bảng biến động nợ" (Movement Summary)**: Số dư đầu kỳ -> Tổng gốc đã trả -> Lãi phát sinh -> Phí phạt/Phí ẩn -> Số dư cuối kỳ.
    - Bổ sung trang **"Dự báo tài chính"**: Dựa trên tiến độ hiện tại, AI sẽ vẽ ra ngày dự kiến bạn thoát nợ hoàn toàn.
    - Tích hợp "Mã QR xác thực" hoặc dấu "Watermark" để tạo cảm giác báo cáo chính thống và bảo mật.

### 2. EAR (Lãi Suất Thực Tế) & Hành Động
- Không chỉ dùng AI để giải thích thuật ngữ, hệ thống cần đưa ra **Giải pháp hành động (Call to Action)**.
- Nếu EAR bị ẩn quá cao (do phí phạt, phí quản lý), hệ thống tự động kích hoạt tính năng **Đảo nợ (Refinancing)**: Đề xuất người dùng đi vay một khoản có lãi suất thấp hơn để tất toán khoản nợ độc hại này.

### 3. DTI (Tỷ Lệ Nợ Trên Thu Nhập) & Dòng Tiền Tự Do
- Tính toán DTI chính xác dựa trên "Số tiền tối thiểu phải trả hàng tháng" / "Thu nhập trung bình tháng".
- Khi DTI > 40% (Báo động Đỏ), hệ thống **bắt cầu** sang module Quản Lý Chi Tiêu, ép người dùng tạo một ngân sách thắt lưng buộc bụng (Tight Budget) để dồn tiền vào trả nợ.

### 4. Hệ Thống Điểm Sức Khoẻ (Financial Health Score)
Mô phỏng hệ thống điểm tín dụng CIC (Việt Nam) hoặc FICO (Mỹ).
- Điểm dao động từ 300 - 850.
- **Tăng điểm:** Thanh toán đúng hạn 3 kỳ liên tiếp, tỷ lệ DTI giảm, trả trước hạn.
- **Giảm điểm:** Chậm thanh toán (trừ nặng), tạo thêm nợ xấu mới. 

### 5. Thêm/Cập Nhật Nợ: Tách Bạch Rõ Ràng 2 Loại Nợ (CRITICAL)
Sẽ có 2 giao diện và logic hoàn toàn khác nhau khi thêm nợ:
1. **Vay trả góp (Installment Loan):** Mua nhà, mua xe. Có thời hạn rõ ràng (12, 24, 36 tháng). Có số tiền gốc phải trả mỗi tháng cố định.
2. **Thẻ tín dụng (Revolving Credit):** Không có thời hạn vay. Dư nợ thay đổi liên tục tuỳ số tiền quẹt thẻ. Chỉ yêu cầu thanh toán "Số tiền tối thiểu" (Minimum Payment).
- Có Tooltip/Modal giải thích rõ ràng từng field (APR, Phí bảo hiểm, Phí trễ hạn).

### 6. Xóa Mềm Nợ (Safe Soft-Delete)
- Chỉ chuyển khoản nợ vào Thùng rác (Ẩn khỏi danh sách).
- **Quy tắc bất biến:** Tuyệt đối không xóa hay thay đổi các giao dịch thanh toán (Payment) đã thực hiện trong quá khứ. Điều này giữ cho lịch sử chi tiêu của người dùng không bao giờ bị lệch.

### 7. Hệ Thống Cảnh Báo (Escalation Alerts)
Áp dụng mô hình cảnh báo leo thang:
- **7 ngày trước:** Cảnh báo nhẹ (Notification In-app).
- **3 ngày trước:** Cảnh báo vàng (Email nhắc nhở chuẩn bị dòng tiền).
- **Quá hạn 1 ngày:** Cảnh báo đỏ (Cảnh báo hậu quả rớt điểm Sức Khoẻ).

### 8. Hạch Toán Kế Toán Kép (Nợ & Chi Tiêu)
Khắc phục hoàn toàn sự chia cắt giữa Ví và Nợ:
- **Khi Giải Ngân (Tạo nợ):** Tiền tự động chạy vào Ví. Giao dịch này mang nhãn `Loan_Disbursement` (Dòng tiền vay). Nó làm tăng số dư Ví nhưng KHÔNG tính vào tổng "Thu nhập tạo ra" của tháng.
- **Khi Trả Nợ (Thanh toán):** Chọn trả từ Ví nào, hệ thống trừ tiền Ví đó và tự động tạo 1 giao dịch chi tiêu mang nhãn `Debt_Repayment`.

### 9. Hệ Thống Phạt Kép (Kỷ Luật Tài Chính)
Xử lý thông minh tùy theo chủ nợ:
- **Luật chung:** Mọi khoản nợ trễ hạn đều tự động bị trừ Điểm Sức Khoẻ.
- **Luật riêng:** Có checkbox "Khoản nợ này có áp dụng phí phạt trễ hạn không?". Nếu có, Cronjob sẽ tự động cộng dồn tiền phạt (Late Fee) vào Tổng nợ (Balance) mỗi ngày trễ.

---

## User Review Required

> [!WARNING]
> Bản kế hoạch này đòi hỏi phải **cập nhật lại Schema Database** (Đặc biệt là phân loại `Installment` vs `CreditCard`, và thêm liên kết `walletId` vào bảng `Payment`). Bạn vui lòng đọc kỹ bức tranh này. Nếu bạn thấy mọi thứ logic, chặt dẫn và "đã hiểu toàn bộ", hãy phản hồi OK để tôi bắt tay vào chia nhỏ task và code hệ thống Backend trước!
