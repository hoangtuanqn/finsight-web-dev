# FinSight – Tài liệu Đặc tả Chức năng Chi tiết
Mục đích: Tài liệu bàn giao nội bộ cho team phát triển hệ thống quản lý nợ FinSight

---

## MỤC LỤC

1. Authentication & Security
2. Debt Management – Quản lý khoản nợ
3. Dashboard – Trang tổng quan
4. Financial Calculation – Tính toán tài chính
5. Payment Tracking – Theo dõi thanh toán
6. Domino Risk – Cảnh báo rủi ro dây chuyền
7. Debt Strategy – Chiến lược trả nợ
8. Smart Notification – Thông báo thông minh
9. Financial Profile – Hồ sơ tài chính
10. Investment Advisory – Tư vấn đầu tư
11. Market Sentiment – Chỉ số tâm lý thị trường
12. Market Alert – Cảnh báo thị trường
13. AI Chatbot – Trợ lý nhập liệu thông minh
14. OCR – Nhận diện chứng từ
15. Dev Priority – Thứ tự ưu tiên triển khai
16. Phụ lục – Database Schema & Danh sách giá trị cố định

---

## 1. Authentication & Security

### 1.1 Đăng ký tài khoản

Người dùng tạo tài khoản mới bằng email và mật khẩu.

Luồng xử lý:

1. User điền form gồm email, password và xác nhận password.
2. Frontend kiểm tra: email đúng định dạng, password tối thiểu 8 ký tự có chữ hoa/thường/số, hai trường password phải khớp nhau.
3. Gửi yêu cầu lên backend.
4. Backend kiểm tra email đã tồn tại chưa. Nếu trùng thì trả lỗi "Email đã được sử dụng".
5. Password được mã hóa bằng bcrypt trước khi lưu vào DB. Không bao giờ lưu mật khẩu dạng thô.
6. Lưu thông tin user vào DB, trạng thái mặc định là active.
7. Trả về thông báo đăng ký thành công.

API:

    POST /api/auth/register
    Body   : email, password, confirm_password
    201    : Đăng ký thành công
    409    : Email đã được sử dụng
    422    : Dữ liệu không hợp lệ (kèm chi tiết lỗi từng trường)

---

### 1.2 Đăng nhập

Người dùng đăng nhập bằng email và password, nhận về token để dùng cho các request tiếp theo.

Luồng xử lý:

1. User điền email và password, gửi lên backend.
2. Backend tìm user theo email. Không tìm thấy thì trả lỗi sai thông tin.
3. Kiểm tra tài khoản có đang bị khóa không. Nếu có thì báo thời gian mở khóa.
4. So sánh password nhập vào với bản mã hóa trong DB.
5. Nếu sai password: tăng đếm số lần sai lên 1. Khi đạt 5 lần thì khóa tài khoản trong 15 phút.
6. Nếu đúng password: reset số lần sai về 0, tạo JWT token (có hiệu lực 24 giờ) và trả về cho frontend.
7. Frontend lưu token và đính kèm vào mọi request tiếp theo dưới dạng: Authorization: Bearer [token].

API:

    POST /api/auth/login
    Body   : email, password
    200    : access_token, token_type, expires_in (giây)
    401    : Sai email hoặc mật khẩu, kèm số lần còn lại
    403    : Tài khoản đang bị khóa, kèm thời điểm mở khóa

---

### 1.3 Đăng xuất

Người dùng kết thúc phiên làm việc hiện tại.

Luồng xử lý:

1. Frontend xóa token khỏi bộ nhớ.
2. Gọi backend để đưa token vào danh sách vô hiệu (nếu hệ thống có hỗ trợ thu hồi token).
3. Chuyển hướng về trang đăng nhập.

---

### 1.4 Các cơ chế bảo mật

**Khóa tài khoản tạm thời**
Sau 5 lần nhập sai password liên tiếp, tài khoản bị khóa trong 15 phút. Sau thời gian này tự động mở lại.

**Xác thực bằng JWT**
Tất cả endpoint yêu cầu dữ liệu riêng tư đều phải kèm token hợp lệ trong header. Backend kiểm tra token trước khi xử lý bất kỳ request nào.

**Mã hóa mật khẩu**
Dùng bcrypt để hash. Tuyệt đối không lưu mật khẩu dạng thô vào DB.

**Mở rộng trong tương lai**
Có thể bổ sung đăng nhập qua Google/Facebook (OAuth2) và xác thực 2 bước (TOTP/OTP).

---

## 2. Debt Management – Quản lý khoản nợ

### 2.1 Thêm khoản nợ mới

Người dùng tạo một bản ghi khoản nợ để hệ thống theo dõi và tính toán.

Luồng xử lý:

1. User điền form thông tin khoản nợ.
2. Frontend kiểm tra các trường bắt buộc.
3. Gửi lên backend. Backend lưu vào DB, liên kết với tài khoản user đang đăng nhập.
4. Sau khi lưu, hệ thống tự động tính chỉ số EAR cho khoản nợ này (xem mục 4.1).
5. Trả về thông tin khoản nợ vừa tạo kèm EAR đã tính.

Thông tin của một khoản nợ:

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| id | UUID | Tự động | Mã định danh duy nhất |
| user_id | UUID | Tự động | Liên kết với tài khoản user |
| name | Chuỗi ký tự | Có | Tên khoản nợ, ví dụ: "Vay ngân hàng ACB" |
| principal | Số thập phân | Có | Số tiền vay gốc, đơn vị VND |
| apr | Số thập phân | Có | Lãi suất hàng năm tính theo % |
| fees | Số thập phân | Không | Các loại phí phát sinh, đơn vị VND. Mặc định là 0 |
| due_date | Ngày | Có | Ngày đến hạn thanh toán kỳ tiếp theo |
| min_payment | Số thập phân | Có | Số tiền tối thiểu phải trả mỗi kỳ |
| remaining_balance | Số thập phân | Tự động | Dư nợ còn lại. Khởi tạo bằng principal |
| status | Trạng thái | Tự động | ACTIVE / PAID / OVERDUE |
| ear | Số thập phân | Tự động | Lãi suất hiệu dụng, được tính tự động |
| created_at | Thời gian | Tự động | Thời điểm tạo |
| updated_at | Thời gian | Tự động | Thời điểm cập nhật gần nhất |

API:

    POST /api/debts
    Header : Authorization: Bearer [token]
    Body   : name, principal, apr, fees, due_date, min_payment
    201    : Thông tin khoản nợ vừa tạo kèm EAR

---

### 2.2 Xem danh sách khoản nợ

Trả về toàn bộ khoản nợ của user đang đăng nhập, sắp xếp theo ngày đến hạn gần nhất lên đầu.

API:

    GET /api/debts
    200 : Danh sách khoản nợ

---

### 2.3 Xem chi tiết một khoản nợ

Trả về đầy đủ thông tin khoản nợ và lịch sử các lần thanh toán.

API:

    GET /api/debts/:id
    200 : Thông tin khoản nợ + lịch sử thanh toán
    404 : Không tìm thấy

---

### 2.4 Cập nhật khoản nợ

Chỉnh sửa thông tin khoản nợ. Sau khi lưu, EAR được tự động tính lại nếu có thay đổi ở principal, apr hoặc fees.

API:

    PUT /api/debts/:id
    Body   : Các trường cần cập nhật (tất cả đều tùy chọn)
    200    : Thông tin khoản nợ đã cập nhật kèm EAR mới

---

### 2.5 Xóa khoản nợ

Xóa khoản nợ khỏi danh sách hiển thị. Dùng soft delete (lưu thời điểm xóa) để giữ lại lịch sử, không xóa hẳn khỏi DB.

API:

    DELETE /api/debts/:id
    200 : Xóa thành công
    404 : Không tìm thấy

---

## 3. Dashboard – Trang tổng quan

Trang chủ sau khi đăng nhập. Hiển thị bức tranh tổng thể về tình trạng tài chính của user.

Luồng xử lý:

1. Gọi API dashboard.
2. Backend lấy toàn bộ khoản nợ đang ACTIVE của user.
3. Tính toán các chỉ số tổng hợp và trả về.

Các thành phần hiển thị:

| Thành phần | Mô tả |
|-----------|-------|
| Tổng dư nợ | Cộng dồn tất cả số dư còn lại của các khoản nợ đang ACTIVE |
| Tổng thanh toán tối thiểu | Cộng dồn số tiền tối thiểu phải trả trong kỳ này của tất cả khoản nợ |
| DTI | Tỷ lệ nợ trên thu nhập, kèm phân loại mức độ SAFE / WARNING / DANGER |
| EAR trung bình | Trung bình lãi suất hiệu dụng của toàn bộ danh mục nợ |
| Khoản nợ sắp đến hạn | Danh sách các khoản có ngày đến hạn trong vòng 7 ngày tới |

API:

    GET /api/dashboard
    200 : total_remaining_balance, total_min_payment, dti (value + status),
          avg_ear, upcoming_debts (id, name, due_date, remaining_balance, min_payment)

---

## 4. Financial Calculation – Tính toán tài chính

### 4.1 EAR – Lãi suất hiệu dụng hàng năm

EAR phản ánh chi phí thực sự của khoản nợ, bao gồm cả lãi suất lẫn các khoản phí phát sinh.

Công thức:

    Lãi trong năm  =  Tiền vay gốc  x  (Lãi suất năm / 100)
    EAR            =  (Lãi trong năm + Tổng phí)  /  Tiền vay gốc
    Kết quả nhân 100 để ra đơn vị %

Ví dụ minh họa:

    Tiền vay gốc : 10.000.000 VND
    Lãi suất năm : 12%   →   Lãi trong năm = 1.200.000 VND
    Tổng phí     : 300.000 VND

    EAR = (1.200.000 + 300.000) / 10.000.000 = 0,15 = 15%

Khi nào tính lại EAR:
- Tự động chạy ngay khi user tạo khoản nợ mới.
- Tự động chạy lại khi user chỉnh sửa khoản nợ và có thay đổi ở tiền gốc, lãi suất, hoặc phí.
- Kết quả được lưu vào trường ear trong bảng debts.

---

### 4.2 DTI – Tỷ lệ nợ trên thu nhập

DTI đo lường mức độ gánh nặng nợ so với thu nhập hàng tháng của user.

Công thức:

    Tổng trả nợ tháng  =  Cộng dồn số tiền tối thiểu của tất cả khoản nợ ACTIVE
    DTI (%)            =  (Tổng trả nợ tháng  /  Thu nhập tháng)  x  100

    Thu nhập tháng lấy từ hồ sơ tài chính của user (xem mục 9)

Phân loại mức độ rủi ro:

| Khoảng DTI | Trạng thái | Màu gợi ý | Ý nghĩa |
|-----------|-----------|----------|---------|
| Dưới 40% | SAFE | Xanh lá | Mức nợ lành mạnh |
| 40% đến 50% | WARNING | Vàng | Cần theo dõi, hạn chế vay thêm |
| Trên 50% | DANGER | Đỏ | Rủi ro cao, cần xử lý ngay |

Lưu ý:
- Nếu user chưa nhập thu nhập trong hồ sơ tài chính thì DTI trả về rỗng và hiển thị thông báo yêu cầu cập nhật.
- DTI được tính lại mỗi khi mở Dashboard hoặc có thay đổi ở danh sách khoản nợ.

---

## 5. Payment Tracking – Theo dõi thanh toán

Ghi nhận một lần thanh toán của user cho một khoản nợ, cập nhật số dư còn lại và lưu vào lịch sử giao dịch.

Luồng xử lý:

1. User chọn khoản nợ muốn ghi nhận thanh toán.
2. Nhập số tiền đã trả và ghi chú (nếu có).
3. Gửi lên backend.
4. Backend tạo bản ghi thanh toán, sau đó tính lại số dư còn lại:
   - Số dư mới = Số dư cũ trừ Số tiền vừa trả.
   - Nếu số dư mới bằng 0 hoặc âm: cập nhật số dư về 0 và chuyển trạng thái khoản nợ sang PAID.
   - Nếu số dư mới vẫn dương: cập nhật số dư mới.
5. Trả về thông tin khoản nợ đã cập nhật và bản ghi thanh toán vừa tạo.

Thông tin của một bản ghi thanh toán:

| Trường | Kiểu dữ liệu | Mô tả |
|--------|-------------|-------|
| id | UUID | Mã định danh |
| debt_id | UUID | Liên kết với khoản nợ |
| user_id | UUID | Liên kết với user |
| amount | Số thập phân | Số tiền đã trả |
| paid_at | Thời gian | Thời điểm ghi nhận thanh toán |
| note | Chuỗi ký tự | Ghi chú thêm, không bắt buộc |

API:

    POST /api/debts/:id/payments
    Body   : amount, note (tùy chọn)
    201    : Bản ghi thanh toán + thông tin khoản nợ đã cập nhật
    400    : Số tiền không hợp lệ

    GET /api/debts/:id/payments
    200    : Danh sách lịch sử thanh toán, sắp xếp mới nhất lên đầu

---

## 6. Domino Risk – Cảnh báo rủi ro dây chuyền

Phát hiện và cảnh báo khi user có nguy cơ rơi vào vòng xoáy nợ dây chuyền, tức là không trả được khoản này dẫn đến không trả được khoản khác.

Điều kiện kích hoạt cảnh báo (chỉ cần thỏa mãn ít nhất 1 trong 3):

| Điều kiện | Ngưỡng | Ý nghĩa |
|-----------|--------|---------|
| Nhiều khoản đến hạn cùng lúc | Từ 2 khoản trở lên có ngày đến hạn trong vòng 7 ngày tới | Áp lực thanh toán tập trung trong thời gian ngắn |
| DTI vượt ngưỡng | DTI trên 40% | Gánh nặng nợ đã vượt mức an toàn |
| Có lịch sử trả trễ | Từng có ít nhất 1 lần thanh toán sau ngày đến hạn | Dấu hiệu khó kiểm soát dòng tiền |

Luồng xử lý:

1. Cron job kiểm tra điều kiện này mỗi ngày (xem mục 8).
2. Cũng kiểm tra ngay lập tức khi user thêm khoản nợ mới hoặc ghi nhận thanh toán trễ.
3. Nếu thỏa điều kiện thì tạo thông báo loại DOMINO_RISK và hiển thị nổi bật trên Dashboard.

Nội dung cảnh báo mẫu:

    CẢNH BÁO RỦI RO DÂY CHUYỀN
    Bạn có 3 khoản nợ đến hạn trong 7 ngày tới với tổng DTI 47%.
    Hãy ưu tiên cân đối dòng tiền ngay hôm nay.

---

## 7. Debt Strategy – Chiến lược trả nợ

Hệ thống gợi ý 2 chiến lược trả nợ phổ biến, tính toán và so sánh hiệu quả để user lựa chọn phương án phù hợp.

### 7.1 Chiến lược Avalanche – Trả lãi cao trước

Nguyên tắc: Ưu tiên dồn tiền vào khoản nợ có lãi suất hiệu dụng (EAR) cao nhất trước. Mục tiêu là tiết kiệm tổng lãi phải trả.

Luồng tính toán:

1. Sắp xếp danh sách nợ theo EAR từ cao xuống thấp.
2. Số tiền trả thêm mỗi tháng (ngoài khoản tối thiểu bắt buộc) được dồn toàn bộ vào khoản có EAR cao nhất.
3. Khi khoản đó trả hết, chuyển toàn bộ số tiền sang khoản có EAR cao tiếp theo.
4. Tính ra tổng lãi phải trả và số tháng để trả hết toàn bộ nợ.

---

### 7.2 Chiến lược Snowball – Trả khoản nhỏ trước

Nguyên tắc: Ưu tiên trả dứt điểm khoản nợ có số dư nhỏ nhất trước. Mục tiêu là tạo động lực tâm lý khi liên tục xóa được khoản nợ.

Luồng tính toán:

1. Sắp xếp danh sách nợ theo số dư còn lại từ nhỏ đến lớn.
2. Số tiền trả thêm được dồn vào khoản có số dư nhỏ nhất.
3. Khi khoản đó trả hết, chuyển số tiền sang khoản nhỏ tiếp theo.
4. Tính ra tổng lãi phải trả và số tháng để trả hết toàn bộ nợ.

---

### 7.3 So sánh 2 chiến lược

Hiển thị bảng so sánh để user dễ đưa ra quyết định:

| Chỉ số | Avalanche | Snowball |
|--------|-----------|----------|
| Tổng lãi phải trả | X VND | Y VND |
| Thời gian trả hết | A tháng | B tháng |
| Khoản ưu tiên đầu tiên | Khoản có EAR cao nhất | Khoản có số dư nhỏ nhất |

API:

    GET /api/strategy?extra_payment=[số tiền trả thêm mỗi tháng]
    200 : Kết quả của cả 2 chiến lược gồm thứ tự ưu tiên, tổng lãi và số tháng

---

## 8. Smart Notification – Thông báo thông minh

### 8.1 Tác vụ nền tự động (Cron Job)

Mỗi ngày lúc 8 giờ sáng, hệ thống chạy một tác vụ nền để kiểm tra toàn bộ user và tự động tạo thông báo phù hợp.

Các trường hợp tạo thông báo:

| Điều kiện phát hiện | Loại thông báo | Mức độ | Nội dung mẫu |
|--------------------|--------------|--------|-------------|
| Khoản nợ đến hạn trong 3 ngày hoặc ít hơn | DEBT_DUE_SOON | WARNING | "Khoản nợ [tên] sẽ đến hạn sau 3 ngày" |
| Khoản nợ đã quá hạn mà chưa thanh toán | DEBT_OVERDUE | DANGER | "Khoản nợ [tên] đã quá hạn X ngày" |
| DTI vượt 50% | DTI_CRITICAL | CRITICAL | "Tỷ lệ nợ của bạn đang ở mức nguy hiểm (XX%)" |
| Thỏa điều kiện Domino Risk | DOMINO_RISK | WARNING | Xem mục 6 |

---

### 8.2 Hiển thị thông báo trong ứng dụng

Giao diện:
- Icon chuông trên thanh điều hướng, có badge hiển thị số lượng thông báo chưa đọc.
- Nhấn vào icon mở danh sách thông báo, sắp xếp mới nhất lên đầu.
- Mỗi thông báo hiển thị biểu tượng mức độ (màu sắc), tiêu đề, nội dung tóm tắt và thời gian.
- Nhấn vào thông báo thì đánh dấu đã đọc và chuyển đến khoản nợ liên quan nếu có.

API:

    GET /api/notifications                 Lấy danh sách (có phân trang)
    GET /api/notifications/unread-count    Số lượng chưa đọc, dùng cho badge
    PUT /api/notifications/:id/read        Đánh dấu một thông báo là đã đọc
    PUT /api/notifications/read-all        Đánh dấu tất cả là đã đọc

Thông tin của một bản ghi thông báo:

| Trường | Kiểu dữ liệu | Mô tả |
|--------|-------------|-------|
| id | UUID | Mã định danh |
| user_id | UUID | Liên kết với user |
| type | Loại cố định | DEBT_DUE_SOON / DEBT_OVERDUE / DTI_CRITICAL / DOMINO_RISK / MARKET_ALERT |
| severity | Mức độ | INFO / WARNING / DANGER / CRITICAL |
| title | Chuỗi | Tiêu đề ngắn |
| body | Chuỗi | Nội dung chi tiết |
| is_read | True/False | Trạng thái đã đọc, mặc định là chưa đọc |
| related_debt_id | UUID | Khoản nợ liên quan, nếu có |
| created_at | Thời gian | Thời điểm tạo thông báo |

---

## 9. Financial Profile – Hồ sơ tài chính

Thông tin tài chính cá nhân của user. Được dùng làm đầu vào để tính DTI và tạo gợi ý đầu tư.

Luồng xử lý:

1. User vào trang hồ sơ tài chính và điền/cập nhật thông tin.
2. Gửi lên backend, lưu vào DB theo từng user (quan hệ 1-1 với tài khoản).
3. Các module DTI và Advisory đọc dữ liệu này mỗi khi cần tính toán.

Thông tin hồ sơ tài chính:

| Trường | Kiểu dữ liệu | Bắt buộc | Mô tả |
|--------|-------------|----------|-------|
| user_id | UUID | Tự động | Liên kết 1-1 với tài khoản user |
| monthly_income | Số thập phân | Có | Thu nhập hàng tháng, đơn vị VND |
| capital | Số thập phân | Không | Tổng tài sản hoặc vốn hiện có, đơn vị VND |
| risk_level | Mức cố định | Có | Mức chấp nhận rủi ro đầu tư: LOW / MEDIUM / HIGH |
| updated_at | Thời gian | Tự động | Lần cập nhật gần nhất |

API:

    GET /api/profile/financial           Lấy hồ sơ hiện tại
    PUT /api/profile/financial           Cập nhật hồ sơ
    Body   : monthly_income, capital (tùy chọn), risk_level
    200    : Hồ sơ tài chính đã cập nhật

---

## 10. Investment Advisory – Tư vấn đầu tư

Dựa trên hồ sơ tài chính, tình trạng nợ và tâm lý thị trường, hệ thống gợi ý cách phân bổ danh mục đầu tư phù hợp.

Dữ liệu đầu vào:
- Mức độ chấp nhận rủi ro từ hồ sơ tài chính.
- Trạng thái DTI hiện tại (SAFE / WARNING / DANGER).
- Chỉ số Fear & Greed từ module Market Sentiment (mục 11).
- Tổng vốn từ hồ sơ tài chính.

Logic gợi ý:

| Điều kiện | Gợi ý hành động |
|-----------|----------------|
| Mức rủi ro thấp (LOW) | Tăng tỷ trọng tiết kiệm, giảm cổ phiếu và crypto |
| Chỉ số Fear & Greed ở vùng Fear (0 đến 40) | Tăng tài sản an toàn như vàng, tiết kiệm, trái phiếu |
| Chỉ số Fear & Greed ở vùng Greed (60 đến 100) | Giảm tỷ trọng cổ phiếu để tránh rủi ro bong bóng |
| DTI đang ở mức DANGER | Ưu tiên trả nợ trước, tạm dừng đầu tư mới |
| DTI ở mức SAFE và mức rủi ro cao (HIGH) | Có thể tăng tỷ trọng cổ phiếu và crypto |

Kết quả đầu ra là tỷ lệ % phân bổ trên tổng vốn. Ví dụ:

    Tiết kiệm  : 30%
    Trái phiếu : 20%
    Cổ phiếu   : 35%
    Crypto     :  5%
    Vàng       : 10%

Kèm theo một đoạn giải thích lý do gợi ý dựa trên tình trạng thực tế của user.

API:

    GET /api/advisory
    200 : Tỷ lệ phân bổ từng loại tài sản + lý do gợi ý

---

## 11. Market Sentiment – Chỉ số tâm lý thị trường

Lấy dữ liệu Fear & Greed Index từ API bên ngoài, lưu vào DB và cung cấp cho các module cần dùng.

Nguồn dữ liệu:
- Alternative.me Fear & Greed Index: https://api.alternative.me/fng/
- CoinGecko (tùy chọn bổ sung cho dữ liệu giá coin).

Luồng xử lý:

1. Cron job chạy mỗi giờ, gọi API để lấy dữ liệu mới nhất.
2. Lưu kết quả vào bảng market_sentiment trong DB.
3. Module Advisory và Market Alert đọc từ DB thay vì gọi thẳng API ngoài, tránh vượt giới hạn request.

Thông tin lưu trữ:

| Trường | Mô tả |
|--------|-------|
| value | Điểm số từ 0 đến 100 |
| label | Nhãn: Extreme Fear / Fear / Neutral / Greed / Extreme Greed |
| fetched_at | Thời điểm lấy dữ liệu |

API:

    GET /api/market/sentiment
    200 : value, label, fetched_at

---

## 12. Market Alert – Cảnh báo thị trường

Gửi thông báo đến user khi thị trường có biến động lớn để có thể phản ứng kịp thời.

Điều kiện kích hoạt:
- Giá tài sản (cổ phiếu hoặc crypto) biến động hơn 5% trong vòng 24 giờ.
- Chỉ số Fear & Greed chuyển vùng, ví dụ từ Neutral sang Extreme Fear.

Luồng xử lý:

1. Cron job so sánh dữ liệu thị trường mới nhất với dữ liệu 24 giờ trước.
2. Nếu thỏa điều kiện, tạo thông báo loại MARKET_ALERT cho các user phù hợp (ưu tiên user có mức rủi ro MEDIUM hoặc HIGH).
3. Thông báo hiển thị trong ứng dụng theo cơ chế đã mô tả ở mục 8.

API:

    GET /api/market/alerts
    200 : Danh sách cảnh báo gồm tên tài sản, % biến động, hướng tăng/giảm, thời điểm cảnh báo

---

## 13. AI Chatbot – Trợ lý nhập liệu thông minh

Cho phép user nhập thông tin khoản nợ bằng câu nói tự nhiên thay vì phải điền form thủ công từng trường.

Luồng xử lý:

1. User gõ một câu mô tả khoản nợ, ví dụ:
   "Tôi vừa vay ACB 50 triệu, lãi 12% một năm, đến hạn ngày 15 tháng 6, trả tối thiểu 2 triệu mỗi tháng"

2. Backend gửi nội dung lên AI/NLP service (GPT, Gemini hoặc model tự phát triển).

3. AI phân tích và trích xuất các trường thông tin: tên khoản nợ, tiền gốc, lãi suất, ngày đến hạn, thanh toán tối thiểu.

4. Hệ thống hiển thị form với các trường đã điền sẵn để user kiểm tra lại.

5. User xác nhận hoặc chỉnh sửa rồi mới bấm lưu. Dữ liệu không được lưu thẳng từ AI mà phải qua bước xác nhận.

Lưu ý quan trọng:
- Trường nào AI không đọc được thì để trống, user tự điền.
- Không bao giờ tự động lưu khoản nợ mà không có thao tác xác nhận từ user.

API:

    POST /api/chatbot/parse
    Body   : message (nội dung user gõ)
    200    : Các trường đã trích xuất được, độ tin cậy, nội dung gốc

---

## 14. OCR – Nhận diện chứng từ

Cho phép user chụp hoặc upload ảnh hợp đồng vay, sao kê hay phiếu thu để hệ thống tự động đọc và điền thông tin vào form.

Luồng xử lý:

1. User chọn file ảnh hoặc PDF từ thiết bị.
2. Frontend gửi file lên backend.
3. Backend gửi file đến OCR service (Tesseract, Google Vision API hoặc AWS Textract).
4. OCR trả về văn bản thô, backend dùng regex/NLP để trích xuất các trường liên quan đến khoản nợ.
5. Trả kết quả về frontend, hiển thị form đã điền sẵn.
6. User kiểm tra lại và xác nhận thì mới lưu chính thức.

Định dạng file hỗ trợ: JPG, PNG, PDF (chỉ trang đầu tiên).
Kích thước tối đa: 10 MB.

API:

    POST /api/ocr/extract
    Body   : File ảnh hoặc PDF (dạng multipart/form-data)
    200    : Các trường đã trích xuất, văn bản thô, độ tin cậy
    422    : Không đọc được nội dung từ ảnh

---

## 15. Dev Priority – Thứ tự ưu tiên triển khai

Thứ tự phát triển theo nguyên tắc ưu tiên lõi trước, tính năng nâng cao sau:

| Sprint | Module cần làm | Lý do ưu tiên |
|--------|---------------|--------------|
| Sprint 1 | Đăng ký, đăng nhập, đăng xuất, bảo mật | Nền tảng bắt buộc, không có thì không làm được gì khác |
| Sprint 1 | Hồ sơ tài chính | Cần có thu nhập để tính DTI ngay từ đầu |
| Sprint 2 | Quản lý khoản nợ (thêm/sửa/xóa/xem) | Chức năng cốt lõi của toàn hệ thống |
| Sprint 2 | Tính EAR và DTI | Gắn liền với Debt CRUD, cần có ngay |
| Sprint 3 | Dashboard tổng quan | Tổng hợp dữ liệu từ các module trước |
| Sprint 3 | Theo dõi thanh toán | Luồng nghiệp vụ cơ bản |
| Sprint 4 | Thông báo thông minh và cron job | Tự động hóa cảnh báo |
| Sprint 4 | Domino Risk | Phụ thuộc lịch sử thanh toán và DTI |
| Sprint 5 | Chiến lược trả nợ Avalanche và Snowball | Tính năng tư vấn nâng cao |
| Sprint 6 | Market Sentiment và Market Alert | Cần tích hợp API bên ngoài |
| Sprint 6 | Investment Advisory | Phụ thuộc hồ sơ tài chính và Market Sentiment |
| Sprint 7 | AI Chatbot | Cần tích hợp NLP hoặc LLM |
| Sprint 7 | OCR | Cần tích hợp dịch vụ OCR |

---

## 16. Phụ lục

### Database Schema

**Bảng users** – Lưu thông tin tài khoản

| Trường | Mô tả |
|--------|-------|
| id | Mã định danh |
| email | Địa chỉ email đăng ký |
| password_hash | Mật khẩu đã mã hóa |
| failed_attempts | Số lần nhập sai mật khẩu liên tiếp |
| locked | Tài khoản có đang bị khóa không |
| locked_until | Thời điểm tự động mở khóa |

---

**Bảng financial_profiles** – Hồ sơ tài chính của user

| Trường | Mô tả |
|--------|-------|
| id | Mã định danh |
| user_id | Liên kết với bảng users |
| monthly_income | Thu nhập hàng tháng |
| capital | Tổng vốn/tài sản hiện có |
| risk_level | Mức rủi ro đầu tư: LOW / MEDIUM / HIGH |

---

**Bảng debts** – Danh sách khoản nợ

| Trường | Mô tả |
|--------|-------|
| id | Mã định danh |
| user_id | Liên kết với bảng users |
| name | Tên khoản nợ |
| principal | Tiền vay gốc |
| apr | Lãi suất năm (%) |
| fees | Phí phát sinh |
| due_date | Ngày đến hạn |
| min_payment | Thanh toán tối thiểu mỗi kỳ |
| remaining_balance | Dư nợ còn lại |
| status | ACTIVE / PAID / OVERDUE |
| ear | Lãi suất hiệu dụng đã tính |
| created_at | Thời điểm tạo |
| updated_at | Thời điểm cập nhật |
| deleted_at | Thời điểm xóa mềm, null nếu chưa xóa |

---

**Bảng payments** – Lịch sử thanh toán

| Trường | Mô tả |
|--------|-------|
| id | Mã định danh |
| debt_id | Liên kết với bảng debts |
| user_id | Liên kết với bảng users |
| amount | Số tiền đã trả |
| paid_at | Thời điểm thanh toán |
| note | Ghi chú |

---

**Bảng notifications** – Thông báo

| Trường | Mô tả |
|--------|-------|
| id | Mã định danh |
| user_id | Liên kết với bảng users |
| type | Loại thông báo (xem danh sách bên dưới) |
| severity | Mức độ nghiêm trọng (xem danh sách bên dưới) |
| title | Tiêu đề ngắn |
| body | Nội dung đầy đủ |
| is_read | Đã đọc hay chưa |
| related_debt_id | Khoản nợ liên quan, có thể để trống |
| created_at | Thời điểm tạo |

---

**Bảng market_sentiment** – Dữ liệu tâm lý thị trường

| Trường | Mô tả |
|--------|-------|
| id | Mã định danh |
| source | Nguồn dữ liệu, ví dụ: alternative.me |
| value | Điểm số từ 0 đến 100 |
| label | Nhãn phân loại |
| fetched_at | Thời điểm lấy dữ liệu |

---

### Danh sách giá trị cố định (Enums)

**Trạng thái khoản nợ (Debt status)**
- ACTIVE – Đang còn nợ
- PAID – Đã thanh toán xong
- OVERDUE – Đã quá hạn

**Trạng thái DTI**
- SAFE – An toàn (dưới 40%)
- WARNING – Cần chú ý (40% đến 50%)
- DANGER – Nguy hiểm (trên 50%)

**Mức rủi ro đầu tư (Risk level)**
- LOW – Thấp
- MEDIUM – Trung bình
- HIGH – Cao

**Loại thông báo (Notification type)**
- DEBT_DUE_SOON – Khoản nợ sắp đến hạn
- DEBT_OVERDUE – Khoản nợ đã quá hạn
- DTI_CRITICAL – DTI ở mức nguy hiểm
- DOMINO_RISK – Rủi ro dây chuyền
- MARKET_ALERT – Biến động thị trường

**Mức độ thông báo (Notification severity)**
- INFO – Thông tin
- WARNING – Cảnh báo
- DANGER – Nguy hiểm
- CRITICAL – Khẩn cấp

**Nhãn chỉ số thị trường (Fear & Greed label)**
- Extreme Fear – Sợ hãi cực độ (0 đến 24)
- Fear – Sợ hãi (25 đến 44)
- Neutral – Trung lập (45 đến 55)
- Greed – Tham lam (56 đến 75)
- Extreme Greed – Tham lam cực độ (76 đến 100)

---

### Biến môi trường cần cấu hình

| Biến | Mô tả |
|------|-------|
| DATABASE_URL | Chuỗi kết nối database |
| JWT_SECRET | Khóa bí mật để ký JWT |
| JWT_EXPIRES_IN | Thời gian sống của token, ví dụ: 86400 (1 ngày) |
| BCRYPT_SALT_ROUNDS | Số vòng mã hóa bcrypt, khuyến nghị 10 |
| OCR_API_KEY | API key của dịch vụ OCR |
| AI_API_KEY | API key của dịch vụ AI/NLP |
| MARKET_API_URL | URL lấy dữ liệu thị trường |
| CRON_DAILY_TIME | Giờ chạy cron hàng ngày, ví dụ: 08:00 |
