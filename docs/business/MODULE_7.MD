# Module 7: Kế Hoạch Trả Nợ (Repayment Planner) — Logic Nghiệp Vụ Chi Tiết

---

## 1. Module Này Giải Quyết Bài Toán Gì

Các module trước (1–6) trả lời câu hỏi **"thực trạng nợ đang thế nào"** — bao nhiêu tiền, ai nợ ai, quá hạn chưa, penalty bao nhiêu.

Module 7 trả lời câu hỏi khác hẳn: **"với số tiền có trong tay tháng này, nên trả khoản nào trước để thiệt hại ít nhất?"**

Đây là sự khác biệt giữa hệ thống chỉ theo dõi và hệ thống thực sự hỗ trợ ra quyết định. Thực tế doanh nghiệp luôn ở trạng thái dòng tiền có giới hạn — không bao giờ có đủ tiền để trả tất cả cùng một lúc. Câu hỏi "trả cái nào trước" là câu hỏi quan trọng nhất mà không hệ thống nội địa nào hiện tại trả lời được.

---

## 2. Input Của Planner

Planner cần hai loại input để hoạt động:

**Input từ người dùng — thay đổi mỗi lần dùng:**

Ngân sách trả nợ tháng này — tổng số tiền doanh nghiệp có thể dùng để trả nợ trong tháng. Không phải tổng tiền mặt, mà là phần được phân bổ riêng cho việc trả nợ sau khi đã trừ chi phí vận hành.

Chiến lược ưu tiên — người dùng chọn một trong bốn chiến lược. Mỗi chiến lược phản ánh một mục tiêu tài chính khác nhau.

Khoản nợ muốn loại trừ khỏi kế hoạch — đôi khi có khoản đang tranh chấp hoặc đang đàm phán gia hạn, không muốn đưa vào kế hoạch tháng này. Phải hỗ trợ exclude thủ công.

**Input từ hệ thống — tự động lấy từ các module trước:**

Danh sách toàn bộ khoản Payable đang ACTIVE, PARTIAL, OVERDUE — kèm outstanding, lãi suất, penalty rate, overdue_days, loại nợ, due_date.

Lịch debt_schedules của từng khoản — để biết kỳ nào đến hạn trong tháng này.

Thông tin covenant của từng khoản vay ngân hàng — D/E ratio, DSCR ngưỡng hiện tại.

Lịch sử thanh toán — để đánh giá pattern trả nợ và phát hiện khoản nào đang có xu hướng xấu đi.

---

## 3. Bốn Chiến Lược Ưu Tiên — Logic Chi Tiết

### Chiến Lược 1: Avalanche (Lãi Cao Nhất Trước)

**Mục tiêu:** Tối thiểu hóa tổng chi phí lãi và penalty phải trả trong dài hạn.

**Logic sắp xếp:**

Tính effective annual rate cho từng khoản:
```
Vay ngân hàng:    dùng lãi suất hợp đồng
Nợ thương mại:    dùng penalty rate × 365
Thuế quá hạn:     0.03% × 365 = 10.95%/năm
Nội bộ:           dùng lãi suất thỏa thuận, có thể = 0
```

Sort giảm dần theo effective annual rate. Khoản nào rate cao nhất được phân bổ tiền trước.

**Khi nào dùng:** Khi doanh nghiệp ổn định, không có áp lực bên ngoài, muốn tối ưu chi phí tài chính thuần túy về dài hạn.

**Điểm yếu cần nói rõ với người dùng:** Khoản nhỏ có thể tồn tại rất lâu vì tiền luôn đổ vào khoản lớn hơn có rate cao hơn. Số lượng khoản nợ không giảm nhanh — gây khó khăn cho việc quản lý và đối chiếu.

### Chiến Lược 2: Snowball (Số Dư Nhỏ Nhất Trước)

**Mục tiêu:** Giảm số lượng khoản nợ nhanh nhất có thể, tạo momentum tâm lý và giải phóng bandwidth quản lý.

**Logic sắp xếp:**

Sort tăng dần theo outstanding còn lại. Khoản nào ít tiền nhất được tất toán trước.

Sau mỗi lần tất toán một khoản, số tiền dành ra để trả khoản đó cộng dồn vào ngân sách cho khoản tiếp theo — đây là "snowball effect" tạo ra tên gọi của chiến lược này.

**Khi nào dùng:** Khi doanh nghiệp đang có nhiều khoản nợ nhỏ lặt vặt gây rối loạn quản lý. Khi cần giải phóng hạn mức tín dụng với nhiều NCC khác nhau để tiếp tục mua hàng. Khi team kế toán ít người, cần giảm số đầu khoản phải theo dõi.

**Điểm yếu:** Tổng lãi phải trả cao hơn Avalanche vì giữ nguyên các khoản lớn có rate cao lâu hơn. Về dài hạn tốn tiền hơn.

### Chiến Lược 3: Quá Hạn Trước (Overdue First)

**Mục tiêu:** Dừng penalty đang chảy, bảo vệ credit score, và giải quyết rủi ro pháp lý ngay lập tức.

**Logic sắp xếp:**

Bước 1: Tách riêng tất cả khoản đang OVERDUE.

Bước 2: Trong nhóm OVERDUE, sort theo mức độ nghiêm trọng:

```
Ưu tiên 1: Thuế và BHXH quá hạn — rủi ro pháp lý cao nhất (phong tỏa tài khoản)
Ưu tiên 2: Vay ngân hàng quá hạn — ảnh hưởng credit score, nguy cơ vi phạm covenant
Ưu tiên 3: Nợ thương mại quá hạn — sort thêm theo overdue_days giảm dần
Ưu tiên 4: Nợ nội bộ quá hạn — ít rủi ro nhất
```

Bước 3: Sau khi xử lý hết nhóm OVERDUE, phần ngân sách còn lại mới phân bổ cho khoản sắp đến hạn — sort theo due_date tăng dần.

**Khi nào dùng:** Khi đang trong quá trình thẩm định vay vốn mới — ngân hàng sẽ kiểm tra lịch sử trả nợ. Khi có nguy cơ bị cơ quan thuế kiểm tra. Khi đang đàm phán hợp đồng lớn với đối tác mới — họ thường check tình trạng công nợ.

**Điểm yếu:** Không tối ưu chi phí tài chính. Có thể để khoản lãi cao nhưng chưa quá hạn tiếp tục tích lũy.

### Chiến Lược 4: Covenant Risk (Rủi Ro Vi Phạm Điều Khoản)

**Mục tiêu:** Bảo vệ các điều kiện trong hợp đồng vay ngân hàng để tránh bị yêu cầu trả nợ trước hạn toàn bộ.

**Tại sao chiến lược này quan trọng nhất với doanh nghiệp có vay ngân hàng:**

Vi phạm covenant không phải là bị phạt tiền — nó có thể kéo theo điều khoản "acceleration" nghĩa là ngân hàng có quyền yêu cầu trả toàn bộ dư nợ ngay lập tức. Một khoản vay 5 tỷ đang trả từng tháng bỗng nhiên phải trả hết ngay — đây là rủi ro thanh khoản nghiêm trọng nhất có thể xảy ra với doanh nghiệp.

**Logic scoring:**

Tính score rủi ro cho từng khoản:

```
+10 điểm: Khoản vay ngân hàng đang OVERDUE (vi phạm covenant ngay lập tức)
+8 điểm:  Khoản thuế quá hạn (ảnh hưởng điều kiện vay — ngân hàng có thể biết)
+6 điểm:  Khoản vay ngân hàng sắp đến hạn trong 7 ngày
+4 điểm:  D/E ratio đang tiệm cận ngưỡng covenant (ví dụ đang ở 2.8x, ngưỡng là 3.0x)
+3 điểm:  DSCR đang tiệm cận ngưỡng covenant
+2 điểm:  Khoản có lãi suất floating đang tăng
+1 điểm:  Mỗi 10 ngày quá hạn
```

Sort giảm dần theo tổng score. Khoản score cao nhất được ưu tiên trước.

**Điều kiện đặc biệt — Hard Priority Override:**

Nếu bất kỳ khoản nào có nguy cơ vi phạm covenant trong vòng 3 ngày tới, khoản đó phải được đưa lên đầu bất kể score của các khoản khác. Đây là override cứng — không thể bị ghi đè bởi bất kỳ lý do nào khác.

**Khi nào dùng:** Khi doanh nghiệp đang có dư nợ ngân hàng lớn với nhiều điều khoản covenant. Khi đang trong giai đoạn ngân hàng review định kỳ (thường là cuối quý, cuối năm).

---

## 4. Thuật Toán Phân Bổ Ngân Sách — Waterfall

Sau khi đã sort theo chiến lược, bước tiếp theo là phân bổ ngân sách vào từng khoản. Thuật toán phải là **waterfall** — đổ đầy khoản ưu tiên 1 trước, rồi mới xuống khoản 2, không chia đều.

**Tại sao không chia đều:**

Chia đều nghe có vẻ công bằng nhưng không hiệu quả. Nếu chia đều 100 triệu cho 5 khoản, mỗi khoản nhận 20 triệu — không khoản nào được tất toán, tất cả vẫn tiếp tục tích lũy lãi. Nếu waterfall, khoản nhỏ nhất có thể được tất toán hoàn toàn, giảm số đầu khoản phải theo dõi.

**Logic waterfall cụ thể:**

```
Bắt đầu với budget = ngân sách tháng
Với từng khoản theo thứ tự ưu tiên:
  Tính tổng nghĩa vụ = outstanding + lãi tháng này + penalty tích lũy
  Nếu budget >= tổng nghĩa vụ:
    Phân bổ = tổng nghĩa vụ (tất toán hoàn toàn)
    budget = budget - tổng nghĩa vụ
    Tiếp tục khoản tiếp theo
  Nếu budget < tổng nghĩa vụ:
    Phân bổ = budget (dùng hết số còn lại)
    budget = 0
    Dừng, các khoản còn lại = 0 phân bổ
```

**Xử lý trường hợp budget không đủ trả penalty:**

Nếu ngân sách thậm chí không đủ trả penalty đang tích lũy của khoản ưu tiên 1 — đây là dấu hiệu "bẫy nợ". Hệ thống phải cảnh báo rõ: "Ngân sách hiện tại không đủ để dừng penalty tích lũy. Mỗi tháng nợ đang tăng thêm X đồng dù có trả."

---

## 5. Tính Months To Payoff — Dự Báo Thời Gian Tất Toán

Với mỗi khoản nợ và số tiền phân bổ hàng tháng, planner phải tính được bao nhiêu tháng nữa khoản đó sẽ được tất toán.

**Công thức cơ bản:**

Với khoản không có lãi (nợ thương mại, thuế):
```
Months = CEILING(Outstanding / Monthly Allocation)
```

Với khoản có lãi:
```
Monthly Interest = Outstanding × (Annual Rate / 12)
Nếu Monthly Allocation <= Monthly Interest:
  → Không bao giờ tất toán được — cảnh báo "bẫy lãi"
Nếu Monthly Allocation > Monthly Interest:
  Net Payment = Monthly Allocation - Monthly Interest
  Months = CEILING(Outstanding / Net Payment)
```

**Trường hợp phân bổ = 0:**

Khoản không được phân bổ tiền tháng này — dự báo hiển thị "Không trong kế hoạch tháng này" kèm theo outstanding sẽ tăng thêm bao nhiêu do lãi và penalty tích lũy.

Đây là thông tin quan trọng — người dùng cần thấy cái giá của việc không trả khoản đó tháng này.

---

## 6. Phát Hiện Và Cảnh Báo Các Tình Huống Nguy Hiểm

Planner không chỉ tính toán — nó phải chủ động phát hiện những tình huống nguy hiểm và cảnh báo trước khi người dùng submit kế hoạch.

**Cảnh báo 1 — Bẫy Nợ (Debt Trap):**

Phát hiện khi: tổng lãi và penalty tích lũy mỗi tháng > tổng ngân sách có thể dùng để trả. Nghĩa là dù có trả đều đặn, tổng nợ vẫn tăng mỗi tháng.

Nội dung cảnh báo phải rõ: "Với ngân sách X đồng/tháng, tổng nợ đang tăng thêm Y đồng/tháng. Cần tăng ngân sách lên ít nhất Z đồng/tháng để dừng nợ tăng."

**Cảnh báo 2 — Covenant Nguy Hiểm:**

Phát hiện khi: sau khi áp dụng kế hoạch này, D/E ratio hoặc DSCR sẽ vượt ngưỡng covenant trong tháng tới. Hệ thống tính toán dựa trên số liệu tài chính hiện tại kết hợp với kế hoạch trả nợ.

**Cảnh báo 3 — Khoản Bị Bỏ Lại Quá Lâu:**

Phát hiện khi: có khoản không được phân bổ tiền nào trong kế hoạch, và khoản đó sẽ quá hạn trong vòng 30 ngày tới. Dù chiến lược ưu tiên khoản khác, nhưng để khoản này quá hạn sẽ có hậu quả cụ thể — hệ thống phải nói rõ hậu quả đó là gì.

**Cảnh báo 4 — Ngân Sách Không Thực Tế:**

Phát hiện khi: ngân sách nhập vào quá thấp so với tổng nghĩa vụ tối thiểu phải trả tháng này (các khoản đến hạn trong tháng). Cảnh báo: "Ngân sách X đồng không đủ để trả các khoản đến hạn trong tháng (tổng Y đồng). Thiếu Z đồng."

**Cảnh báo 5 — Tình Trạng Cải Thiện Hay Xấu Đi:**

So sánh kế hoạch tháng này với tháng trước. Nếu tổng outstanding sau kế hoạch tháng này cao hơn tháng trước — nợ đang tăng lên. Đây là chỉ số sức khỏe tài chính quan trọng mà người dùng cần thấy rõ.

---

## 7. Simulation — Thử Nghiệm Trước Khi Quyết Định

Planner phải cho phép người dùng thử nghiệm các kịch bản khác nhau trước khi commit vào kế hoạch thực tế.

**Simulation theo chiến lược:**

Cho phép so sánh song song hai chiến lược — ví dụ Avalanche vs Snowball với cùng ngân sách. Hiển thị side-by-side: tổng lãi phải trả, số tháng trung bình tất toán, số khoản được tất toán trong tháng này.

**Simulation theo ngân sách:**

Kéo slider ngân sách và thấy ngay kết quả thay đổi realtime — bao nhiêu khoản được tất toán, tổng penalty tiết kiệm được nếu tăng thêm X triệu.

**Điểm ngân sách tối ưu:**

Hệ thống tính và highlight ngưỡng ngân sách mà tại đó hiệu quả tăng cao nhất — ví dụ "Nếu tăng thêm 50 triệu (từ 800 lên 850 triệu), bạn tất toán thêm được 2 khoản và tiết kiệm 15 triệu penalty trong 3 tháng tới." Đây là thông tin để người dùng quyết định có nên điều chỉnh ngân sách không.

---

## 8. Lưu Và Theo Dõi Kế Hoạch

Planner không chỉ là công cụ tính toán one-time — kế hoạch phải được lưu lại và theo dõi.

**Lưu kế hoạch:**

Khi người dùng hài lòng với kế hoạch, có thể "commit" — lưu kế hoạch tháng này vào hệ thống. Kế hoạch đã commit gồm: ngày tạo, ngân sách, chiến lược, danh sách khoản và số tiền phân bổ cho từng khoản.

**Theo dõi thực tế vs kế hoạch:**

Cuối tháng, hệ thống so sánh kế hoạch đã commit với những gì thực sự xảy ra — thực tế trả được bao nhiêu, có đúng thứ tự ưu tiên không, khoản nào bị bỏ lỡ.

Chênh lệch này là thông tin quan trọng: nếu liên tục thực tế thấp hơn kế hoạch thì ngân sách đang được đặt không thực tế. Nếu thực tế cao hơn kế hoạch thì có thể đặt ngân sách cao hơn để trả nợ nhanh hơn.

**Lịch sử kế hoạch:**

Lưu toàn bộ kế hoạch các tháng trước. Người dùng có thể xem lại tiến độ theo thời gian — tổng outstanding đang giảm hay tăng, penalty tích lũy đang giảm hay tăng. Đây là bức tranh dài hạn quan trọng để ban lãnh đạo đánh giá sức khỏe tài chính.

---

## 9. Những Trường Hợp Đặc Biệt Hay Bị Bỏ Sót

**Khoản nợ có điều kiện trả trước hạn:**

Một số hợp đồng vay có phí trả trước hạn (prepayment penalty) — nếu trả trước một khoản vay dài hạn, phải trả thêm 1–2% số tiền trả sớm. Planner phải tính phí này vào khi so sánh chiến lược — đôi khi trả trước hạn lại tốn hơn là tiếp tục trả theo lịch.

**Ngân sách thay đổi giữa tháng:**

Doanh nghiệp đang theo kế hoạch A, giữa tháng nhận được khoản thu bất ngờ (khách hàng trả sớm, bán tài sản). Phần ngân sách tăng thêm nên được phân bổ thế nào? Planner phải hỗ trợ điều chỉnh kế hoạch giữa tháng và tính lại từ điểm hiện tại.

**Khoản nợ đang trong quá trình đàm phán tái cơ cấu:**

Đang chờ ngân hàng chấp thuận giảm lãi suất hoặc gia hạn. Khoản này nên được exclude khỏi kế hoạch tháng này và đánh dấu "đang xử lý riêng" — không để planner phân bổ tiền vào khoản đang đàm phán vì kết quả đàm phán có thể thay đổi hoàn toàn điều kiện của khoản nợ.

**Nhiều người cùng lập kế hoạch:**

Kế toán trưởng và CFO cùng dùng planner. Kế toán trưởng đang lập kế hoạch dở dang thì CFO vào thay đổi chiến lược. Phải có version control cho draft kế hoạch — không override lẫn nhau. Chỉ kế hoạch đã "commit" mới là kế hoạch chính thức.

---

## 10. Mối Quan Hệ Với Các Module Khác

Module 7 là module **chỉ đọc dữ liệu và xuất ra đề xuất** — không bao giờ tự ý ghi nhận thanh toán hay thay đổi trạng thái khoản nợ.

Đọc từ Module 1 thông tin đối tác để hiển thị tên trong kế hoạch.

Đọc từ Module 2 toàn bộ thông tin khoản nợ, lãi suất, debt_schedules để tính toán.

Đọc từ Module 3 trạng thái hiện tại của từng khoản — chỉ lấy khoản đang ACTIVE, PARTIAL, OVERDUE vào planner.

Đọc từ Module 4 lịch sử transaction để tính outstanding chính xác và phát hiện pattern thanh toán.

Đọc từ Module 5 thông tin penalty đang tích lũy để cộng vào tổng nghĩa vụ khi phân bổ.

Khi người dùng thực hiện theo kế hoạch và ghi nhận thanh toán thực tế — họ làm điều đó qua Module 4, không phải qua Module 7. Module 7 chỉ là bản đồ chỉ đường, Module 4 mới là nơi thực sự lái xe.
