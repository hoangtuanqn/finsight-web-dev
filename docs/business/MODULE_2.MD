# Module 2: Quản Lý Khoản Nợ — Logic Nghiệp Vụ Chi Tiết

---

## 1. Khoản Nợ Là Gì Trong Hệ Thống Này

Khoản nợ là **một nghĩa vụ tài chính cụ thể, có xác định được số tiền, có ngày đến hạn, và gắn với ít nhất một đối tác**. Không phải mọi giao dịch tiền tệ đều là khoản nợ — chỉ những giao dịch mà tại thời điểm phát sinh, tiền chưa được thanh toán đầy đủ mới cần ghi nhận vào đây.

Hai chiều cần phân biệt rõ ngay từ đầu:

**Receivable** — tiền người khác đang nợ mình, là tài sản trên bảng cân đối kế toán. Mình muốn số này càng nhỏ càng tốt vì nó nghĩa là tiền đang bị "chôn" ở ngoài.

**Payable** — tiền mình đang nợ người khác, là nợ phải trả. Mình muốn quản lý số này chặt để không bị phạt quá hạn, không vi phạm covenant, không ảnh hưởng credit score.

---

## 2. Phân Loại Khoản Nợ Theo Nguồn Gốc

Đây là phân loại quan trọng nhất vì mỗi loại có **logic tính lãi, logic tính phạt, và cách xử lý khi quá hạn hoàn toàn khác nhau**. Nếu không phân loại từ đầu, sau này không biết áp rule nào.

**Nợ thương mại (Trade Debt)**

Phát sinh từ mua bán hàng hóa, dịch vụ. Đặc điểm là thường không có lãi suất trong thời hạn — chỉ phát sinh phạt khi quá hạn và mức phạt do hai bên thỏa thuận trong hợp đồng, không cố định theo luật. Thời hạn thường ngắn, 30–90 ngày. Đây là loại phổ biến nhất.

**Nợ tài chính (Financial Debt)**

Phát sinh từ vay mượn tiền mặt — ngân hàng, tổ chức tín dụng, trái phiếu. Đặc điểm là có lãi suất rõ ràng (fixed hoặc floating), thường có tài sản đảm bảo, có điều khoản covenant ràng buộc. Thời hạn dài hơn, từ vài tháng đến nhiều năm. Penalty khi quá hạn theo luật VN là 0.03%/ngày trên dư nợ.

**Nợ thuế và nghĩa vụ nhà nước**

Thuế GTGT, thuế TNDN, BHXH, thuế TNCN khấu trừ. Đặc điểm là deadline cứng theo luật, penalty cố định 0.03%/ngày không thương lượng được, và hậu quả vi phạm nặng hơn nhiều so với nợ thương mại (bị phong tỏa tài khoản, bị cưỡng chế). Loại này phải được ưu tiên xử lý trước khi quá hạn.

**Nợ nội bộ**

Vay mượn giữa các pháp nhân trong cùng tập đoàn, hoặc cổ đông cho công ty vay. Lãi suất do nội bộ thỏa thuận, thường thấp hơn thị trường. Penalty thường bằng 0. Điểm đặc biệt là khoản nợ này phải báo cáo riêng — không được gộp vào báo cáo thương mại.

---

## 3. Vòng Đời Một Khoản Nợ Trước Khi Có Thanh Toán

Trước khi nghĩ đến thanh toán, cần hiểu rõ một khoản nợ đi qua những giai đoạn nào từ lúc phát sinh đến lúc được ghi nhận vào hệ thống.

**Bước 1 — Sự kiện phát sinh:**

Ký hợp đồng, nhận hóa đơn, giải ngân vay, hoặc phát sinh nghĩa vụ thuế. Đây là thời điểm khoản nợ "tồn tại" về mặt pháp lý, dù tiền chưa chuyển.

**Bước 2 — Xác định các tham số:**

Số tiền gốc, ngày phát sinh, ngày đến hạn, lãi suất (nếu có), phương thức trả (một lần hay nhiều kỳ), điều khoản phạt. Những tham số này phải được xác định rõ ngay lúc tạo — không được để "điền sau" vì sẽ không điền bao giờ.

**Bước 3 — Ghi nhận vào hệ thống:**

Tạo hồ sơ khoản nợ, đính kèm tài liệu gốc (hợp đồng, hóa đơn, giấy nhận nợ), chuyển trạng thái từ DRAFT sang ACTIVE.

---

## 4. Thông Tin Cần Thu Thập Khi Tạo Khoản Nợ

**Thông tin bắt buộc — không có không tạo được:**

Chiều nợ (RECEIVABLE hoặc PAYABLE) — phải chọn đầu tiên vì nó quyết định toàn bộ luồng xử lý sau đó.

Đối tác — phải chọn từ danh sách đã có trong Module 1. Không cho nhập tên tự do vì sẽ sinh ra đối tác "ảo" không có hồ sơ.

Số tiền gốc — là số tiền tại thời điểm phát sinh, trước khi tính bất kỳ lãi hay phạt nào. Đây là con số cố định, không bao giờ thay đổi dù sau này có điều chỉnh.

Ngày phát sinh — ngày ký hợp đồng, ngày nhận hóa đơn, hoặc ngày giải ngân. Không phải ngày nhập liệu vào hệ thống.

Ngày đến hạn — deadline phải thanh toán. Với khoản nhiều kỳ thì đây là ngày đến hạn của kỳ cuối cùng.

Nguồn gốc — thuộc loại nào trong 4 loại ở mục 2. Bắt buộc vì quyết định rule tính phạt.

**Thông tin quan trọng — có thể bổ sung nhưng nên điền ngay:**

Số hợp đồng hoặc số hóa đơn tham chiếu — để sau này đối chiếu với kế toán.

Người phụ trách theo dõi khoản nợ này (có thể khác với người phụ trách đối tác).

Tài liệu đính kèm — hợp đồng, hóa đơn, biên bản bàn giao. Không bắt buộc lúc tạo nhưng bắt buộc trước khi chuyển sang ACTIVE.

**Thông tin cho khoản có lãi:**

Lãi suất và đơn vị (năm/tháng/ngày). Phương thức tính lãi — Reducing Balance, EMI, hay Bullet. Ba phương thức này cho kết quả khác nhau đáng kể nên phải chọn đúng từ đầu, không sửa được sau khi đã sinh lịch.

---

## 5. Ba Phương Thức Tính Lãi — Logic Nghiệp Vụ

**Reducing Balance (Dư nợ giảm dần)**

Lãi mỗi kỳ tính trên dư nợ còn lại sau khi trả gốc. Kỳ đầu lãi cao nhất, càng về sau lãi càng thấp vì gốc giảm dần. Tổng tiền trả mỗi kỳ không cố định.

Phù hợp với: vay ngân hàng thông thường, khoản vay có kỳ hạn trả gốc đều.

Điểm cần lưu ý: nếu khách hàng trả gốc trước hạn một khoản, lãi các kỳ tiếp theo phải được tính lại trên dư nợ mới. Hệ thống phải tự tính lại lịch, không để người dùng nhập tay.

**EMI (Equal Monthly Installment)**

Số tiền trả mỗi kỳ cố định, gồm cả gốc lẫn lãi. Trong đó phần lãi giảm dần theo thời gian, phần gốc tăng dần — nhưng tổng mỗi kỳ luôn bằng nhau.

Phù hợp với: vay mua tài sản cố định, khoản vay dài hạn cần kế hoạch dòng tiền ổn định.

Điểm cần lưu ý: nếu trả trước hạn hoặc trả thêm, cần quyết định rõ là giảm số kỳ hay giảm số tiền mỗi kỳ — đây là hai lựa chọn khác nhau về tài chính và phải hỏi người dùng chứ không được tự quyết.

**Bullet (Trả gốc cuối kỳ)**

Mỗi kỳ chỉ trả lãi. Đến kỳ cuối trả toàn bộ gốc cộng với lãi kỳ cuối. Tổng lãi phải trả cao nhất trong 3 phương thức vì gốc không giảm trong suốt thời hạn.

Phù hợp với: trái phiếu doanh nghiệp, vay dự án (chờ dự án sinh lời mới trả gốc).

Điểm cần lưu ý: rủi ro thanh khoản cao vào kỳ cuối vì phải có một khoản tiền lớn đột ngột. Hệ thống phải cảnh báo sớm — ít nhất 90 ngày trước kỳ cuối.

---

## 6. Khoản Nợ Nhiều Kỳ — Sinh Lịch Tự Động

Khi người dùng chọn trả nhiều kỳ và xác nhận phương thức tính lãi, hệ thống phải tự sinh ra toàn bộ lịch trả (`debt_schedules`) ngay lúc đó. Không cho người dùng nhập tay từng kỳ vì sẽ sinh ra sai sót và không nhất quán với công thức.

Mỗi dòng trong lịch bao gồm: số thứ tự kỳ, ngày đến hạn của kỳ đó, số tiền gốc phải trả kỳ đó, số tiền lãi phải trả kỳ đó, tổng phải trả kỳ đó, dư nợ đầu kỳ, dư nợ cuối kỳ.

Lịch này là căn cứ để hệ thống biết kỳ nào đến hạn, kỳ nào quá hạn, và tính penalty đúng kỳ — không phải penalty toàn bộ khoản nợ.

**Trường hợp đặc biệt khi lịch cần tính lại:**

Trả trước hạn một phần — dư nợ thay đổi, lãi các kỳ sau thay đổi theo. Với EMI còn phải hỏi thêm: rút ngắn kỳ hạn hay giữ nguyên số kỳ nhưng giảm số tiền mỗi kỳ.

Ngân hàng điều chỉnh lãi suất (floating rate) — toàn bộ lịch từ kỳ hiện tại trở đi phải được tính lại với lãi suất mới. Lịch cũ phải được lưu lại để đối chiếu, không xóa.

Gia hạn nợ — ngày đến hạn của một hoặc nhiều kỳ được dời lại. Đây là sự kiện quan trọng, phải ghi log riêng với lý do gia hạn và người phê duyệt.

---

## 7. Validate Quan Trọng

**Khi tạo khoản nợ:**

Ngày đến hạn phải sau ngày phát sinh — nghe có vẻ hiển nhiên nhưng hay bị bỏ sót, đặc biệt khi người dùng nhập nhầm năm.

Số tiền gốc phải lớn hơn 0 và có giới hạn tối đa hợp lý để tránh nhập nhầm (ví dụ nhập 5000 thay vì 500,000,000).

Nếu đối tác là RECEIVABLE, kiểm tra tổng Receivable hiện tại so với hạn mức tín dụng của đối tác đó. Nếu vượt hạn mức thì cảnh báo rõ, yêu cầu xác nhận có chủ ý trước khi cho tạo.

Nếu chọn lãi suất, phải chọn phương thức tính lãi — không được để trống một trong hai.

Số kỳ với khoản nhiều kỳ phải là số nguyên dương, và ngày đến hạn kỳ cuối phải khớp với ngày đến hạn tổng của khoản nợ.

**Khi chỉnh sửa:**

Số tiền gốc không được sửa sau khi đã có transaction thanh toán. Nếu cần điều chỉnh (do sai sót ban đầu), phải tạo transaction loại ADJUSTMENT với lý do rõ ràng, không được sửa trực tiếp vào gốc.

Ngày đến hạn chỉ được dời ra xa hơn (gia hạn), không được rút lại gần hơn — trừ trường hợp đặc biệt có người có quyền cao hơn phê duyệt.

Phương thức tính lãi không được sửa sau khi đã sinh lịch và đã có kỳ được thanh toán.

---

## 8. Những Trường Hợp Hay Bị Bỏ Sót

**Khoản nợ phát sinh từ điều chỉnh hóa đơn:** Khách hàng trả đủ theo hóa đơn gốc, nhưng sau đó hóa đơn được điều chỉnh tăng. Phần chênh lệch trở thành khoản nợ mới, không phải sửa khoản cũ đã PAID.

**Khoản nợ bằng ngoại tệ:** Nếu hợp đồng ký bằng USD nhưng thanh toán bằng VND, phải ghi nhận cả hai: số tiền gốc theo ngoại tệ và tỷ giá quy đổi tại thời điểm phát sinh. Chênh lệch tỷ giá khi thanh toán là một loại gain/loss riêng, không phải giảm nợ.

**Khoản nợ có điều kiện:** Ví dụ thanh toán 30% khi ký hợp đồng, 40% khi nghiệm thu, 30% sau bảo hành 6 tháng. Mỗi mốc là một kỳ trong `debt_schedules`, nhưng ngày đến hạn của kỳ 2 và kỳ 3 phụ thuộc vào sự kiện nghiệp vụ (nghiệm thu xong, hết bảo hành) chứ không phải ngày cố định. Hệ thống phải hỗ trợ trigger thủ công để "kích hoạt" kỳ tiếp theo khi sự kiện xảy ra.

**Khoản nợ được bảo lãnh:** Một bên thứ ba đứng ra bảo lãnh cho khoản vay. Nếu bên vay không trả được, bên bảo lãnh phải trả. Thông tin bảo lãnh cần được ghi nhận vào khoản nợ để khi xử lý nợ xấu biết còn có bên thứ ba có thể liên hệ.

---

## 9. Dữ Liệu Đầu Ra Của Module Này

Module 2 cung cấp cho các module sau:

Cho Module 3 (State Machine) — toàn bộ thông tin khoản nợ để validate transition hợp lệ.

Cho Module 4 (Thanh toán) — `debt_schedules` để biết kỳ nào đang được thanh toán, `outstanding` hiện tại để validate số tiền.

Cho Module 5 (Scheduled Job) — danh sách khoản nợ ACTIVE/PARTIAL cùng `due_date` và loại nợ để tính đúng penalty.

Cho Module 7 (Repayment Planner) — outstanding, lãi suất, loại nợ, overdue_days của từng khoản để planner có đủ dữ liệu tính toán chiến lược.

Cho Module 8 (Báo cáo) — toàn bộ để tổng hợp aging report, cash flow forecast, và KPI dashboard.

---

Bạn muốn tiếp Module 3 (State Machine) không?