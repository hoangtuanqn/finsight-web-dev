# Module 1: Quản Lý Đối Tác — Logic Nghiệp Vụ Chi Tiết

---

## 1. Đối Tác Là Gì Trong Hệ Thống Này

Đối tác (Party) là **bất kỳ tổ chức hoặc cá nhân nào có phát sinh quan hệ tài chính với doanh nghiệp** — tức là có khoản nợ phải thu hoặc phải trả liên quan đến họ.

Điểm quan trọng cần hiểu ngay từ đầu: **đối tác không có type cố định**. Cùng một công ty A có thể là khách hàng (mình bán hàng cho họ → Receivable) đồng thời là nhà cung cấp (họ bán nguyên liệu cho mình → Payable). Nếu thiết kế `type` là một giá trị cứng thì sẽ fail ngay ở trường hợp này. Role của đối tác phải là **nhiều-nhiều**, tách thành bảng riêng, và có thể thêm/bỏ theo thời gian.

---

## 2. Phân Loại Đối Tác

**Theo hình thức pháp lý:**

Tổ chức (doanh nghiệp, cơ quan nhà nước, tổ chức phi lợi nhuận) — bắt buộc có Mã số thuế. Đây là định danh pháp lý duy nhất, không được trùng trong hệ thống.

Cá nhân — không bắt buộc MST, nhưng phải có CCCD hoặc số điện thoại để định danh. Trường hợp phổ biến là chủ doanh nghiệp tư nhân cho công ty vay tiền cá nhân.

**Theo vai trò trong quan hệ nợ:**

Khách hàng — phát sinh Receivable. Mình bán hàng/dịch vụ, họ chưa trả tiền.

Nhà cung cấp — phát sinh Payable. Họ giao hàng/dịch vụ, mình chưa thanh toán.

Ngân hàng/tổ chức tín dụng — phát sinh Payable dạng vay tài chính, có lãi suất, có tài sản đảm bảo, có covenant.

Cơ quan nhà nước — phát sinh Payable dạng thuế, BHXH. Đây là loại đặc biệt vì penalty cố định theo luật (0.03%/ngày), không thương lượng được.

Nội bộ (công ty mẹ/con/cổ đông) — có thể phát sinh cả hai chiều. Đây là loại nhạy cảm nhất vì giao dịch nội bộ phải báo cáo riêng, không được gộp vào báo cáo thương mại thông thường. Cần flag `is_related_party` để hệ thống biết mà tách báo cáo.

---

## 3. Thông Tin Cần Thu Thập

**Thông tin định danh — bắt buộc:**

Tên đầy đủ và tên viết tắt. Tên viết tắt dùng để hiển thị trên dashboard và báo cáo cho gọn.

Mã nội bộ — hệ thống tự sinh theo quy tắc: KH001 cho khách hàng, NCC001 cho nhà cung cấp, NH001 cho ngân hàng. Mã này dùng để tra cứu nhanh và không bao giờ thay đổi dù đối tác đổi tên.

Mã số thuế — unique trong hệ thống. Trước khi tạo phải check trùng. Trường hợp đối tác cá nhân thì dùng CCCD thay thế.

**Thông tin liên hệ:**

Cần lưu nhiều đầu mối liên hệ cho một đối tác vì thực tế khi đòi nợ sẽ cần liên hệ đúng người — kế toán trưởng khác với giám đốc, người phụ trách kho khác với người ký hợp đồng. Mỗi đầu mối cần ghi rõ chức vụ và mục đích liên hệ.

**Người phụ trách nội bộ:**

Mỗi đối tác phải gán cho ít nhất một nhân viên nội bộ chịu trách nhiệm theo dõi. Khi khoản nợ sắp đến hạn hoặc quá hạn, hệ thống sẽ notify đúng người này chứ không broadcast cho cả team.

**Hạn mức tín dụng:**

Số tiền tối đa được phép nợ tại một thời điểm. Khi tổng Receivable của một khách hàng vượt hạn mức này, hệ thống phải cảnh báo trước khi cho phép tạo khoản nợ mới. Đây là kiểm soát rủi ro quan trọng — nhiều doanh nghiệp mất thanh khoản vì bán chịu quá nhiều cho một khách hàng.

---

## 4. Các Luồng Nghiệp Vụ Chính

**Tạo đối tác mới:**

Bước đầu tiên phải check trùng MST trong hệ thống. Nếu trùng thì không tạo mới mà redirect về hồ sơ đã có — tránh tình trạng một đối tác bị tạo hai lần với thông tin khác nhau, sau đó khoản nợ bị phân tán, báo cáo tổng hợp sai.

Sau khi tạo, chọn vai trò ban đầu. Lưu ý vai trò này có thể bổ sung sau — đừng lock lại.

Gán người phụ trách ngay khi tạo, không để trống. Nếu để trống thì khi có cảnh báo không biết notify ai.

**Cập nhật thông tin:**

Tên, địa chỉ, người liên hệ được phép sửa bình thường. Nhưng MST không được sửa tùy tiện vì nó là định danh pháp lý — nếu đối tác thực sự đổi MST (tái cơ cấu doanh nghiệp) thì phải có quy trình riêng kèm tài liệu pháp lý.

Mọi thay đổi quan trọng (MST, tên, hạn mức tín dụng) cần ghi log: ai sửa, sửa lúc nào, từ giá trị nào sang giá trị nào.

**Vô hiệu hóa đối tác:**

Không được xóa vật lý vì khoản nợ lịch sử vẫn còn. Chỉ được chuyển sang `INACTIVE`. Khi đối tác ở trạng thái INACTIVE, hệ thống không cho tạo khoản nợ mới nhưng vẫn hiển thị toàn bộ lịch sử.

Trường hợp đặc biệt là `BLACKLIST` — đối tác từng phát sinh nợ xấu, không thu hồi được. Hệ thống phải cảnh báo rõ ràng nếu ai đó cố tạo giao dịch mới với đối tác blacklist.

---

## 5. Validate Quan Trọng

**Khi tạo mới:**

MST phải đúng format (10 hoặc 13 số theo quy định VN) và không trùng trong hệ thống.

Tên không được để trống và phải unique đủ để phân biệt — nếu đã có "Công ty TNHH ABC" thì không cho tạo thêm "Công ty TNHH ABC" nữa, phải cảnh báo nghi ngờ trùng lặp dù MST khác.

Phải có ít nhất một thông tin liên hệ (email hoặc số điện thoại).

Phải gán ít nhất một người phụ trách nội bộ.

**Khi tạo khoản nợ liên quan:**

Kiểm tra tổng Receivable hiện tại của đối tác so với hạn mức tín dụng. Nếu khoản nợ mới sẽ khiến tổng vượt hạn mức → cảnh báo, yêu cầu xác nhận rõ ràng trước khi tiếp tục.

Không cho tạo khoản nợ mới với đối tác `INACTIVE` hoặc `BLACKLIST`.

---

## 6. Những Trường Hợp Hay Bị Bỏ Sót

**Đối tác đổi tên công ty** — rất phổ biến khi doanh nghiệp tái cơ cấu. Cần lưu lịch sử tên cũ kèm ngày hiệu lực, không ghi đè. Nếu ghi đè, báo cáo cũ sẽ hiển thị sai tên.

**Hai chi nhánh của cùng một tập đoàn** — về mặt pháp lý là hai MST khác nhau, nhưng về mặt quản lý rủi ro thì nên gộp vào một "nhóm đối tác" để tính hạn mức tín dụng chung. Nếu không làm thế, doanh nghiệp có thể vô tình bán chịu vượt mức cho cùng một tập đoàn qua nhiều pháp nhân khác nhau.

**Đối tác nội bộ** — khoản vay giữa công ty mẹ và công ty con phải được hạch toán riêng, không gộp vào báo cáo thương mại. Nếu không flag `is_related_party` ngay từ đầu, kế toán sau này sẽ phải rà soát lại toàn bộ để tách ra.

**Người phụ trách nghỉ việc** — khi nhân viên phụ trách một đối tác nghỉ việc, toàn bộ đối tác đó phải được reassign. Nếu không có quy trình này, khoản nợ sẽ không có ai theo dõi và cảnh báo sẽ không đến được đúng người.

---

## 7. Dữ Liệu Đầu Ra Của Module Này

Module 1 phải cung cấp được cho các module sau:

Cho Module 2 (tạo khoản nợ) — danh sách đối tác active để chọn, kèm hạn mức còn lại.

Cho Module 6 (notification) — người phụ trách nội bộ của từng đối tác để biết notify ai.

Cho Module 8 (báo cáo) — flag `is_related_party` để tách báo cáo nội bộ vs thương mại, nhóm đối tác để tổng hợp theo tập đoàn.