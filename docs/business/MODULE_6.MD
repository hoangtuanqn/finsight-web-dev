# Module 6: Cảnh Báo & Nhắc Nhở — Logic Nghiệp Vụ Chi Tiết

---

## 1. Tại Sao Module Này Quan Trọng Hơn Người Ta Nghĩ

Hầu hết hệ thống quản lý nợ xây notification như một tính năng phụ — thêm vào cuối, làm qua loa. Thực tế thì đây là **điểm tiếp xúc trực tiếp giữa hệ thống và con người** — nếu notification sai, trễ, hoặc spam, người dùng sẽ bỏ qua toàn bộ. Khi đó toàn bộ logic nghiệp vụ phía sau dù chuẩn đến đâu cũng vô nghĩa vì không ai hành động dựa trên nó.

Có ba vấn đề phổ biến nhất với notification trong hệ thống quản lý nợ:

Notification đến sai người — cảnh báo khoản nợ của team kinh doanh nhưng lại notify cho kế toán.

Notification đến đúng người nhưng quá nhiều — mỗi ngày nhận 20 cảnh báo, người dùng tắt hết.

Notification đến đúng người, đúng số lượng nhưng thiếu context — chỉ nói "khoản nợ sắp đến hạn" mà không nói bao nhiêu tiền, của ai, cần làm gì.

Module này phải giải quyết cả ba vấn đề trên.

---

## 2. Phân Loại Notification

Có hai chiều phân loại cần hiểu rõ trước khi thiết kế:

**Phân loại theo trigger:**

Notification dựa trên thời gian — phát sinh do job định kỳ scan và phát hiện điều kiện (sắp đến hạn, mới quá hạn). Loại này có thể dự đoán được và lên lịch trước.

Notification dựa trên sự kiện — phát sinh ngay khi có hành động xảy ra (khoản nợ mới được activate, thanh toán vừa được ghi nhận, khoản bị chuyển sang DISPUTED). Loại này không theo lịch, xảy ra bất kỳ lúc nào.

**Phân loại theo mức độ:**

```
Khẩn cấp   — cần hành động ngay trong ngày hôm nay
Quan trọng  — cần hành động trong 1–3 ngày tới
Nhắc nhở   — cần lên kế hoạch, không cần làm ngay
Thông tin   — để biết, không cần hành động
```

Mức độ này quyết định kênh gửi và tần suất nhắc lại — không phải mọi notification đều phải gửi qua mọi kênh.

---

## 3. Các Loại Notification Cụ Thể

### Nhóm 1 — Cảnh báo thời hạn (Time-based)

**Sắp đến hạn T-30:**

Mức độ: Nhắc nhở.

Nội dung cần có: tên đối tác, số tiền còn lại, ngày đến hạn cụ thể, người phụ trách.

Mục đích: để người phụ trách lên kế hoạch — nếu là Receivable thì chuẩn bị liên hệ đối tác, nếu là Payable thì chuẩn bị dòng tiền.

**Sắp đến hạn T-15:**

Mức độ: Nhắc nhở, tần suất tăng lên.

Nội dung bổ sung so với T-30: lịch sử thanh toán của đối tác này — họ có hay trả trễ không. Thông tin này giúp người phụ trách đánh giá rủi ro và quyết định có cần liên hệ sớm không.

**Sắp đến hạn T-7:**

Mức độ: Quan trọng.

Nội dung bổ sung: số điện thoại và email của người liên hệ phía đối tác — để người phụ trách có thể hành động ngay mà không cần mở thêm màn hình.

**Sắp đến hạn T-1:**

Mức độ: Khẩn cấp.

Nội dung bổ sung: nếu thanh toán qua ngày mai sẽ phát sinh penalty bao nhiêu — con số cụ thể tạo cảm giác cấp bách thực sự chứ không phải cảnh báo chung chung.

**Vừa quá hạn (D+0):**

Mức độ: Khẩn cấp.

Nội dung: tổng số tiền quá hạn, penalty bắt đầu tích lũy từ hôm nay là bao nhiêu mỗi ngày, tổng penalty dự kiến nếu trả sau 7 ngày / 30 ngày. Con số dự chiếu này tạo áp lực hành động.

Người nhận: thêm cấp quản lý trực tiếp so với các mốc trước.

### Nhóm 2 — Cảnh báo leo thang (Escalation)

Đây là nhóm quan trọng nhất và hay bị bỏ qua. Nếu T-1 đã cảnh báo mà không có ai hành động, hệ thống phải tự leo thang — không phụ thuộc vào việc ai đó nhớ báo cáo lên trên.

**D+7 vẫn chưa có thanh toán:**

Notify thêm trưởng phòng của người phụ trách. Nội dung phải rõ: "Khoản nợ X đã quá hạn 7 ngày, penalty tích lũy đến nay là Y đồng, chưa có liên lạc từ đối tác."

**D+15 vẫn chưa có thanh toán:**

Notify thêm giám đốc tài chính. Đề xuất hành động cụ thể: xem xét chuyển sang DISPUTED nếu có tranh chấp, hoặc bắt đầu quy trình đòi nợ chuyên nghiệp.

**D+30 vẫn chưa có thanh toán:**

Notify giám đốc điều hành. Đề xuất xem xét WRITTEN_OFF hoặc thuê đơn vị thu hồi nợ bên ngoài. Đây là điểm cuối của escalation — sau đây là quyết định của ban lãnh đạo, hệ thống chỉ có thể cung cấp thông tin.

**Điều kiện dừng escalation:**

Khi có thanh toán (dù một phần) — escalation reset, bắt đầu lại từ đầu nếu vẫn còn outstanding.

Khi khoản chuyển sang DISPUTED — escalation dừng, chờ kết quả giải quyết tranh chấp.

Khi khoản chuyển sang WRITTEN_OFF — escalation kết thúc.

### Nhóm 3 — Notification sự kiện (Event-based)

**Khoản nợ mới được activate:**

Notify người phụ trách: "Khoản nợ mới X vừa được kích hoạt, đến hạn ngày Y."

Mục đích: người phụ trách biết mình đang theo dõi thêm một khoản — không bị bất ngờ khi nhận cảnh báo về khoản nợ mà họ không biết là mình phụ trách.

**Thanh toán được ghi nhận:**

Notify người phụ trách khoản nợ và người phụ trách đối tác.

Nội dung: số tiền vừa thanh toán, outstanding còn lại, ngày đến hạn tiếp theo (nếu còn).

Quan trọng: nếu khoản vừa chuyển sang PAID thì nội dung phải khác — "Khoản nợ X đã được tất toán hoàn toàn."

**Khoản chuyển sang DISPUTED:**

Notify người phụ trách và cấp trên trực tiếp.

Nội dung: lý do tranh chấp, số tiền đang tranh chấp, ai là người tạo dispute.

**Khoản bị WRITTEN_OFF:**

Notify toàn bộ liên quan: người phụ trách, quản lý, kế toán trưởng.

Nội dung: số tiền bị xóa, lý do, ai phê duyệt, ảnh hưởng đến báo cáo tháng này.

**Vượt hạn mức tín dụng:**

Khi tổng Receivable của một đối tác vượt hạn mức — notify ngay dù không có khoản nào quá hạn. Đây là cảnh báo rủi ro tiềm ẩn.

---

## 4. Logic Xác Định Người Nhận

Đây là phần phức tạp nhất của module này. Sai ở đây thì toàn bộ notification vô nghĩa.

**Tầng 1 — Người phụ trách trực tiếp:**

Là người được gán vào khoản nợ cụ thể đó trong Module 2. Đây là người nhận mọi notification trừ khi có escalation.

Nếu không có người gán vào khoản nợ — fallback về người phụ trách đối tác từ Module 1.

Nếu vẫn không có — fallback về một email mặc định của nhóm kế toán. Không được để notification không đến được ai.

**Tầng 2 — Quản lý trực tiếp:**

Nhận notification khi escalation lên mức D+7 trở lên, hoặc khi khoản nợ có giá trị vượt ngưỡng lớn (ví dụ trên 1 tỷ đồng thì notify quản lý ngay từ T-7 thay vì D+7).

**Tầng 3 — Cấp cao:**

Chỉ nhận notification khi escalation lên D+15 trở lên, hoặc khi có sự kiện đặc biệt nghiêm trọng như WRITTEN_OFF.

**Xử lý trường hợp người phụ trách nghỉ việc hoặc nghỉ phép:**

Khi người phụ trách có trạng thái "nghỉ phép" hoặc "đã nghỉ việc" trong hệ thống nhân sự, notification phải được chuyển tự động sang người thay thế hoặc quản lý trực tiếp. Không được để notification rơi vào hòm thư không có ai đọc.

Đây là điểm rất hay bị bỏ qua. Thực tế nhân viên nghỉ phép mà không bàn giao — khoản nợ không ai theo dõi — quá hạn không ai hay. Hệ thống phải xử lý được tình huống này tự động.

---

## 5. Chống Notification Spam — Quan Trọng Nhất

Nếu mỗi khoản nợ quá hạn gửi một notification mỗi ngày, một doanh nghiệp có 50 khoản quá hạn sẽ tạo ra 50 notification mỗi ngày cho cùng một người — họ sẽ tắt hết sau ngày đầu tiên.

**Nguyên tắc 1 — Gộp notification cùng loại:**

Thay vì gửi 50 email riêng, gửi một email tổng hợp "Bạn có 50 khoản nợ cần chú ý hôm nay" kèm danh sách. Chỉ gửi notification riêng lẻ cho những khoản có mức độ KHẨN CẤP.

**Nguyên tắc 2 — Tần suất theo mức độ:**

```
Khẩn cấp:    Gửi ngay khi phát sinh, nhắc lại mỗi ngày nếu chưa có hành động
Quan trọng:  Gửi khi phát sinh, nhắc lại sau 3 ngày nếu chưa có hành động
Nhắc nhở:   Gửi một lần tại mốc đó, không nhắc lại
Thông tin:   Gửi một lần, không nhắc lại bao giờ
```

**Nguyên tắc 3 — Điều kiện dừng nhắc lại:**

Khi người dùng đã "acknowledge" notification — bấm xác nhận đã đọc và đang xử lý. Sau acknowledge, hệ thống dừng nhắc lại trong một khoảng thời gian nhất định (cấu hình được).

Khi có bất kỳ hành động nào trên khoản nợ — ghi nhận thanh toán, đổi trạng thái, thêm ghi chú. Hành động cho thấy người phụ trách đang xử lý.

**Nguyên tắc 4 — Giờ gửi notification:**

Notification thông tin và nhắc nhở chỉ gửi trong giờ hành chính (8:00–18:00). Notification khẩn cấp mới gửi ngoài giờ.

Cuối tuần — chỉ gửi notification mức KHẨN CẤP. Không gửi nhắc nhở và thông tin vào thứ Bảy Chủ Nhật vì người nhận không thể hành động.

---

## 6. Nội Dung Notification — Phải Đủ Để Hành Động Ngay

Mỗi notification phải trả lời được 5 câu hỏi mà không cần người nhận phải mở thêm màn hình nào:

**Ai?** — Tên đối tác, mã đối tác.

**Bao nhiêu?** — Số tiền outstanding còn lại, không phải số tiền gốc ban đầu.

**Khi nào?** — Ngày đến hạn cụ thể hoặc đã quá hạn bao nhiêu ngày.

**Hậu quả nếu không làm?** — Penalty tích lũy mỗi ngày là bao nhiêu, hoặc nếu là Receivable thì dòng tiền bị ảnh hưởng thế nào.

**Cần làm gì?** — Link trực tiếp vào màn hình xử lý khoản nợ đó, không phải link vào trang chủ rồi tự tìm.

Notification thiếu bất kỳ thông tin nào trong 5 điểm trên đều làm giảm khả năng người nhận hành động.

---

## 7. Kênh Gửi Notification

**In-app notification:**

Luôn luôn phải có — đây là kênh cơ bản nhất. Badge số lượng trên header, danh sách notification có thể xem lại, phân loại theo đã đọc và chưa đọc. Notification in-app không bao giờ hết hạn — người dùng có thể xem lại lịch sử.

**Email:**

Dùng cho notification quan trọng và khẩn cấp. Ưu điểm là người nhận có thể đọc ngay cả khi không vào hệ thống. Nhược điểm là dễ bị bỏ qua nếu hòm thư quá nhiều email.

Format email phải có bảng tóm tắt ở đầu — không để người đọc phải scroll xuống mới thấy thông tin quan trọng.

**Trong scope cuộc thi:**

Không cần tích hợp email thật hay SMS thật. Chỉ cần implement in-app notification hoàn chỉnh và hiển thị email template — giám khảo sẽ hiểu đây là demo.

---

## 8. Notification Center — Màn Hình Quản Lý Notification

Người dùng cần có một nơi để xem tất cả notification, không chỉ nhận thụ động.

**Những gì cần hiển thị:**

Danh sách notification theo thứ tự mới nhất — phân loại rõ đã đọc và chưa đọc.

Filter theo loại — cảnh báo thời hạn, escalation, sự kiện.

Filter theo mức độ — khẩn cấp, quan trọng, nhắc nhở, thông tin.

Filter theo khoản nợ hoặc đối tác cụ thể.

Mỗi notification có link trực tiếp vào khoản nợ liên quan.

**Acknowledge và Snooze:**

Acknowledge — xác nhận đã đọc và đang xử lý. Hệ thống ghi nhận thời điểm acknowledge và người acknowledge.

Snooze — tạm hoãn nhắc lại trong N ngày. Hữu ích khi người phụ trách biết tình huống nhưng chưa thể xử lý ngay — snooze để tránh bị spam trong thời gian đó. Khi snooze hết hạn, notification xuất hiện lại tự động.

**Dashboard nhỏ trong Notification Center:**

Tổng số notification chưa đọc phân theo mức độ. Số khoản nợ đang trong trạng thái cần hành động. Số ngày trung bình từ khi cảnh báo đến khi có hành động — chỉ số này phản ánh hiệu quả của team phụ trách.

---

## 9. Những Trường Hợp Đặc Biệt Hay Bị Bỏ Sót

**Khoản nợ được gia hạn sau khi đã gửi cảnh báo:**

Khi due_date được dời lại, tất cả notification đã lên lịch cho khoản này phải được hủy và tính lại theo due_date mới. Nếu không, người nhận sẽ tiếp tục nhận cảnh báo "sắp đến hạn ngày cũ" dù đã gia hạn rồi — gây nhầm lẫn và mất tin tưởng vào hệ thống.

**Nhiều khoản nợ cùng đến hạn một ngày:**

Thay vì gửi N notification riêng lẻ, gộp thành một notification tổng hợp: "Ngày mai có 5 khoản đến hạn, tổng giá trị X đồng." Kèm theo danh sách chi tiết.

**Khoản nợ được thanh toán một phần ngay trước khi hết hạn:**

Hệ thống không được dừng cảnh báo chỉ vì có thanh toán — phải check outstanding còn lại. Nếu vẫn còn outstanding và vẫn đến hạn ngày mai, cảnh báo T-1 vẫn phải gửi cho phần còn lại.

**Người phụ trách mới được gán vào khoản nợ đang quá hạn:**

Phải gửi ngay một notification "onboarding" cho người mới: "Bạn vừa được gán phụ trách khoản nợ X, hiện đang quá hạn Y ngày, penalty tích lũy Z đồng." Không để người mới phụ trách mà không biết tình trạng hiện tại của khoản nợ.

---

## 10. Mối Quan Hệ Với Các Module Khác

Module 6 là module **chỉ đọc và phát ra thông báo** — không bao giờ tự ý thay đổi trạng thái khoản nợ hay ghi nhận transaction.

Nhận trigger từ Module 5 (Job 3) để biết khi nào cần gửi cảnh báo thời gian.

Nhận trigger từ Module 3 khi có transition trạng thái để gửi event-based notification.

Nhận trigger từ Module 4 khi có thanh toán để gửi notification xác nhận.

Đọc từ Module 1 để biết người nhận notification là ai.

Đọc từ Module 2 để có đủ context (số tiền, ngày hạn, loại nợ) trong nội dung notification.

Cung cấp cho Module 8 dữ liệu về lịch sử notification — bao nhiêu cảnh báo được gửi, bao nhiêu được acknowledge, thời gian phản hồi trung bình — để đo lường hiệu quả của team.