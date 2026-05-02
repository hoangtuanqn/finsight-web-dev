# Module 4: Ghi Nhận Thanh Toán — Logic Nghiệp Vụ Chi Tiết

---

## 1. Thanh Toán Là Gì Trong Hệ Thống Này

Thanh toán là **một sự kiện tài chính làm giảm outstanding của khoản nợ**. Nghe đơn giản nhưng thực tế phức tạp hơn nhiều vì:

Một lần chuyển tiền không nhất thiết là một lần thanh toán — công ty có thể chuyển một lần 500 triệu nhưng số tiền đó được phân bổ cho 3 khoản nợ khác nhau.

Một lần thanh toán không nhất thiết làm giảm gốc — nếu đang quá hạn, tiền vào phải trả phạt và lãi trước, phần còn lại mới được trừ vào gốc.

Thanh toán không thể bị xóa — nếu nhập sai, phải tạo bút toán đảo (reversal), không được xóa transaction gốc. Đây là nguyên tắc audit trail cơ bản nhất.

---

## 2. Các Loại Transaction

Trước khi nói đến flow thanh toán, cần phân biệt rõ các loại transaction tồn tại trong hệ thống vì chúng có logic xử lý khác nhau hoàn toàn.

**PAYMENT — Thanh toán thực tế**

Tiền thực sự chuyển từ bên này sang bên kia. Đây là loại phổ biến nhất và là trọng tâm của module này.

**PENALTY — Phạt tích lũy**

Không phải tiền thực sự chuyển — đây là bút toán do hệ thống tự tạo mỗi ngày khi khoản nợ ở trạng thái OVERDUE. Penalty làm tăng tổng nghĩa vụ tài chính của khoản nợ chứ không làm giảm outstanding gốc.

**ADJUSTMENT — Điều chỉnh**

Dùng khi phát hiện sai sót trong số tiền gốc ban đầu, hoặc khi có thỏa thuận điều chỉnh số nợ giữa hai bên. Phải có lý do rõ ràng và người có thẩm quyền phê duyệt.

**REVERSAL — Đảo bút toán**

Dùng khi một PAYMENT trước đó bị nhập sai — sai số tiền, sai khoản nợ, hoặc tiền thực tế chưa về nhưng đã ghi nhận nhầm. Reversal tạo ra một transaction âm bù đắp lại transaction sai, không xóa transaction gốc.

**WRITE_OFF — Xóa nợ**

Transaction cuối cùng khi khoản nợ chuyển sang trạng thái WRITTEN_OFF. Phần outstanding còn lại được ghi nhận là mất mát.

**OFFSET — Bù trừ công nợ**

Khi hai khoản nợ ngược chiều giữa cùng hai bên được bù trừ vào nhau. Một transaction OFFSET trên Receivable đi kèm với một transaction OFFSET tương ứng trên Payable.

---

## 3. Flow Ghi Nhận Thanh Toán Chuẩn

### Bước 1 — Tiếp nhận thông tin

Người dùng cần cung cấp:

Khoản nợ cần thanh toán — chọn từ danh sách đang ACTIVE, PARTIAL, hoặc OVERDUE. Không cho thanh toán khoản đang DRAFT, DISPUTED, PAID, WRITTEN_OFF.

Số tiền thanh toán — là số tiền thực tế chuyển, chưa biết sẽ phân bổ thế nào.

Ngày thanh toán — ngày tiền thực sự chuyển, không phải ngày nhập liệu. Đây là điểm hay bị nhầm — kế toán nhập liệu ngày hôm nay nhưng tiền thực ra đã chuyển hôm qua, phải ghi đúng ngày thực tế.

Hình thức thanh toán — chuyển khoản ngân hàng, tiền mặt, bù trừ công nợ.

Số tham chiếu — mã giao dịch ngân hàng, số phiếu thu/chi. Dùng để đối chiếu sau này.

Bằng chứng — ảnh chụp sao kê ngân hàng, phiếu thu. Không bắt buộc nhưng nên có.

### Bước 2 — Validate trước khi xử lý

Validate số tiền:

Số tiền phải lớn hơn 0 — hiển nhiên nhưng cần check.

Số tiền không được vượt tổng nghĩa vụ hiện tại của khoản nợ (outstanding gốc + lãi tích lũy + penalty tích lũy). Nếu vượt thì reject cứng — không được để outstanding âm.

Với khoản nhiều kỳ, kiểm tra thêm số tiền có khớp với kỳ đang thanh toán không. Nếu người dùng muốn trả nhiều hơn một kỳ thì phải xác nhận rõ ý định.

Validate trạng thái:

Khoản nợ phải đang ở ACTIVE, PARTIAL, hoặc OVERDUE. Bất kỳ trạng thái nào khác đều reject với lý do cụ thể — không phải thông báo chung chung "không hợp lệ".

Validate đối soát (nếu bật):

Nếu hệ thống yêu cầu đối soát ngân hàng, số tham chiếu phải tồn tại trong dữ liệu sao kê đã import. Tránh ghi nhận thanh toán "ảo" chưa thực sự về tài khoản.

### Bước 3 — Phân bổ số tiền thanh toán

Đây là bước quan trọng nhất và hay bị làm sai nhất.

**Thứ tự phân bổ bắt buộc: Penalty → Lãi → Gốc**

Đây là chuẩn kế toán, không phải tùy chọn. Lý do:

Penalty và lãi là chi phí phát sinh do chậm trả — phải được thanh toán trước để tránh tiếp tục tích lũy. Nếu trả gốc trước, dư nợ giảm nhưng penalty và lãi vẫn tích lũy trên phần lãi chưa trả, tạo ra "lãi trên lãi" — điều này sai về mặt kế toán và thiệt cho doanh nghiệp.

Ví dụ cụ thể:

```
Khoản nợ gốc:     100,000,000đ
Lãi tích lũy:       5,000,000đ
Penalty tích lũy:   1,500,000đ
Tổng nghĩa vụ:    106,500,000đ

Người dùng thanh toán: 20,000,000đ

Phân bổ đúng:
  → Trả penalty:   1,500,000đ  (penalty còn lại: 0)
  → Trả lãi:       5,000,000đ  (lãi còn lại: 0)
  → Trả gốc:      13,500,000đ  (gốc còn lại: 86,500,000đ)

Phân bổ sai (trả gốc trước):
  → Trả gốc:      20,000,000đ  (gốc còn lại: 80,000,000đ)
  → Penalty và lãi vẫn còn: 6,500,000đ
  → Lãi tiếp tục tính trên 6,500,000đ chưa trả → sai nghiệp vụ
```

**Trường hợp số tiền không đủ trả hết một hạng mục:**

Nếu số tiền thanh toán chỉ đủ trả một phần penalty, thì toàn bộ số tiền đó dùng để trả penalty, không có gì vào lãi hay gốc. Hệ thống phải ghi nhận rõ từng đồng đi vào đâu.

### Bước 4 — Tạo transaction record

Sau khi phân bổ xong, tạo một transaction record với đầy đủ thông tin:

Số tiền tổng đã thanh toán, chia ra: bao nhiêu vào penalty, bao nhiêu vào lãi, bao nhiêu vào gốc.

Ngày thanh toán thực tế.

Số tham chiếu và hình thức thanh toán.

Trạng thái outstanding trước và sau khi thanh toán — snapshot này quan trọng để audit sau này.

### Bước 5 — Cập nhật outstanding và chuyển trạng thái

Sau khi tạo transaction, tính lại outstanding:

```
Outstanding mới = Outstanding cũ - Phần trả vào gốc
```

Lưu ý: chỉ phần trả vào gốc mới làm giảm outstanding. Phần trả penalty và lãi không làm giảm outstanding gốc — chúng chỉ xóa các khoản phí phát sinh thêm.

Sau đó gọi Module 3 để xử lý transition:

Nếu outstanding mới = 0 → chuyển sang PAID.

Nếu outstanding mới > 0 và đang ACTIVE → chuyển sang PARTIAL.

Nếu outstanding mới > 0 và đang OVERDUE → giữ OVERDUE, cập nhật số dư mới.

### Bước 6 — Ghi log và notify

Ghi audit log đầy đủ cho transaction vừa tạo.

Notify người phụ trách khoản nợ — đặc biệt quan trọng khi khoản nợ vừa chuyển sang PAID, cần xác nhận để đối chiếu với ngân hàng.

---

## 4. Thanh Toán Cho Khoản Nợ Nhiều Kỳ

Khoản nhiều kỳ phức tạp hơn đáng kể vì tiền thanh toán phải được map vào đúng kỳ trong `debt_schedules`.

**Nguyên tắc map kỳ:**

Luôn thanh toán kỳ cũ nhất trước — nếu kỳ 2 và kỳ 3 đều chưa trả, tiền vào phải trả kỳ 2 trước, sau đó mới đến kỳ 3. Không cho phép bỏ qua kỳ cũ để trả kỳ mới hơn.

**Khi số tiền thanh toán lớn hơn một kỳ:**

Sau khi tất toán kỳ hiện tại, phần dư tự động chuyển sang tất toán kỳ tiếp theo, cứ thế cho đến hết số tiền. Người dùng không cần biết chi tiết — hệ thống tự xử lý và hiển thị kết quả cuối cùng.

**Khi người dùng muốn trả trước kỳ chưa đến hạn:**

Cho phép nhưng phải cảnh báo rõ và yêu cầu xác nhận. Sau khi trả trước, hệ thống phải tính lại lãi các kỳ còn lại vì dư nợ đã thay đổi (với Reducing Balance và EMI). Với EMI còn phải hỏi thêm: rút ngắn số kỳ hay giảm số tiền mỗi kỳ.

---

## 5. Reversal — Đảo Bút Toán Khi Nhập Sai

Đây là nghiệp vụ hay bị bỏ qua nhưng thực tế rất cần thiết. Kế toán nhập nhầm là chuyện bình thường — cần có cơ chế xử lý đúng.

**Khi nào cần reversal:**

Nhập sai số tiền — ví dụ nhập 5,000,000 thay vì 50,000,000.

Nhập sai khoản nợ — tiền thực ra thanh toán cho khoản A nhưng ghi nhầm vào khoản B.

Ghi nhận thanh toán nhưng tiền thực tế chưa về — séc bị từ chối, chuyển khoản bị hoàn trả.

**Flow reversal:**

Tạo một transaction mới với type = REVERSAL, liên kết đến transaction gốc bị sai, số tiền bằng đúng transaction gốc nhưng âm, lý do bắt buộc phải điền.

Outstanding được cộng lại như trước khi có transaction sai. Trạng thái khoản nợ quay về trạng thái trước đó — ví dụ nếu transaction sai đã chuyển khoản nợ từ PARTIAL sang PAID, sau reversal phải quay về PARTIAL.

Transaction gốc sai và transaction reversal đều được giữ lại trong lịch sử, không xóa cái nào.

**Ai được phép reversal:**

Không phải ai cũng được — chỉ người có quyền kế toán trưởng trở lên. Và chỉ được reversal trong vòng thời gian nhất định (ví dụ 30 ngày kể từ ngày transaction gốc) — sau đó phải làm thủ tục điều chỉnh phức tạp hơn.

---

## 6. Bù Trừ Công Nợ (Offset)

Khi công ty A vừa là khách hàng vừa là nhà cung cấp, hai bên có thể thỏa thuận bù trừ thay vì chuyển tiền hai chiều.

**Ví dụ:**

```
Receivable từ công ty A: 300,000,000đ (A đang nợ mình)
Payable cho công ty A:   200,000,000đ (mình đang nợ A)

Thỏa thuận bù trừ:
→ Receivable còn lại: 100,000,000đ
→ Payable: 0đ (tất toán)
```

**Flow offset:**

Chọn cặp khoản nợ cần bù trừ — một Receivable và một Payable của cùng một đối tác.

Xác nhận số tiền bù trừ — tối đa bằng khoản nhỏ hơn trong hai khoản.

Tạo hai transaction OFFSET đồng thời — một transaction âm trên Receivable, một transaction âm trên Payable, cùng số tiền, liên kết với nhau.

Hai transaction này phải được tạo trong cùng một database transaction — không được tạo một cái thành công mà cái kia thất bại.

**Lưu ý nghiệp vụ:**

Bù trừ công nợ cần có biên bản xác nhận giữa hai bên — đây là tài liệu pháp lý quan trọng, phải đính kèm vào hệ thống trước khi xác nhận offset.

---

## 7. Những Trường Hợp Đặc Biệt Hay Bị Bỏ Sót

**Thanh toán bằng ngoại tệ:**

Hợp đồng ký bằng USD, thanh toán bằng USD nhưng quy đổi ra VND theo tỷ giá ngày thanh toán. Chênh lệch tỷ giá giữa ngày phát sinh và ngày thanh toán là lãi/lỗ tỷ giá — không được gộp vào phần trả gốc. Đây là một loại thu nhập/chi phí tài chính riêng.

**Thanh toán trễ nhưng trong ngày grace period:**

Một số hợp đồng có grace period — ví dụ cho phép trả trễ 3 ngày mà không tính phạt. Hệ thống phải biết grace period của từng khoản để không tính penalty nhầm trong khoảng thời gian này. Grace period phải được ghi nhận ngay khi tạo khoản nợ, không thể thêm sau.

**Thanh toán từ bên thứ ba:**

Bên bảo lãnh trả thay cho bên vay. Tiền về đúng nhưng người trả không phải là đối tác chính. Hệ thống phải ghi nhận được "người thực sự trả" khác với "đối tác của khoản nợ" để sau này có thể truy đòi bên bảo lãnh nếu cần.

**Khoản thanh toán bị ngân hàng giữ lại (hold):**

Tiền đã rời tài khoản người trả nhưng chưa về tài khoản người nhận do ngân hàng đang xử lý. Không được ghi nhận là đã thanh toán trong trường hợp này — phải đợi tiền thực sự về mới ghi nhận. Đây là điểm hay gây tranh cãi giữa hai bên.

**Nhiều khoản nợ được thanh toán cùng một lần chuyển tiền:**

Công ty B chuyển 1 tỷ để thanh toán cho 5 hóa đơn khác nhau. Hệ thống phải hỗ trợ phân bổ một lần chuyển tiền vào nhiều khoản nợ, với số tiền cụ thể cho từng khoản. Không bắt người dùng tạo 5 transaction riêng lẻ — vì thực tế ngân hàng chỉ ghi nhận một giao dịch.

---

## 8. Validate Tổng Hợp

**Validate cứng — reject nếu sai:**

Số tiền ≤ 0: reject.

Số tiền > tổng nghĩa vụ (outstanding + lãi + penalty): reject, không để âm.

Khoản nợ không ở trạng thái cho phép thanh toán: reject với lý do cụ thể.

Ngày thanh toán trong tương lai: reject — không cho ghi nhận thanh toán chưa xảy ra.

**Validate mềm — cảnh báo nhưng vẫn cho tiếp tục:**

Ngày thanh toán cách đây hơn 30 ngày — có thể nhập nhầm, hỏi lại.

Số tiền tròn chẵn bất thường — ví dụ đúng bằng outstanding — có thể là tất toán nhưng cũng có thể nhập nhầm, xác nhận lại.

Không có số tham chiếu ngân hàng — cảnh báo nhưng không block.

---

## 9. Mối Quan Hệ Với Các Module Khác

Module 4 là module duy nhất được phép làm giảm outstanding của khoản nợ. Không module nào khác được trực tiếp thay đổi con số này.

Sau khi ghi nhận thanh toán, Module 4 phải gọi Module 3 để xử lý transition trạng thái — không tự ý chuyển trạng thái.

Module 7 (Repayment Planner) đọc dữ liệu từ Module 4 để biết lịch sử thanh toán và outstanding hiện tại của từng khoản, từ đó tính toán chiến lược.

Module 8 (Báo cáo) aggregate toàn bộ transaction từ Module 4 để tính tổng đã thu, tổng đã trả, tổng lãi đã phát sinh, tổng penalty đã tích lũy theo từng kỳ.
    