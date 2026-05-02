# Module 3: Vòng Đời Khoản Nợ (State Machine) — Logic Nghiệp Vụ Chi Tiết

---

## 1. Tại Sao Cần State Machine

Khoản nợ không phải là một con số tĩnh — nó thay đổi trạng thái liên tục trong suốt vòng đời. Vấn đề là **không phải mọi thay đổi trạng thái đều hợp lệ**. Một khoản đã PAID không thể quay lại ACTIVE. Một khoản DRAFT không thể nhảy thẳng sang OVERDUE. Nếu không có State Machine kiểm soát, hệ thống sẽ rơi vào tình trạng dữ liệu inconsistent — khoản nợ hiển thị PAID nhưng vẫn có outstanding dương, hoặc khoản DRAFT bị tính penalty.

State Machine ở đây không phải khái niệm kỹ thuật — nó là **quy trình nghiệp vụ được hình thức hóa**. Mỗi trạng thái đại diện cho một thực tế tài chính cụ thể. Mỗi transition đại diện cho một sự kiện nghiệp vụ cụ thể. Không có gì xảy ra ngoài những gì được định nghĩa.

---

## 2. Toàn Bộ Các Trạng Thái

**DRAFT — Bản nháp**

Khoản nợ đã được khởi tạo nhưng chưa có hiệu lực. Thông tin có thể chưa đầy đủ, tài liệu chưa đính kèm, chưa được xác nhận bởi người có thẩm quyền. Ở trạng thái này khoản nợ không được tính vào bất kỳ báo cáo nào, không được tính lãi, không được nhận thanh toán.

Đây là trạng thái "vùng an toàn" — người dùng có thể tạo và chỉnh sửa thoải mái mà không ảnh hưởng đến số liệu thực tế.

**ACTIVE — Đang hiệu lực**

Khoản nợ đã được xác nhận đầy đủ, có hiệu lực pháp lý, chưa có thanh toán nào. Từ thời điểm này khoản nợ xuất hiện trong báo cáo, được tính lãi nếu có, và scheduled job bắt đầu theo dõi ngày đến hạn.

**PARTIAL — Thanh toán một phần**

Đã có ít nhất một lần thanh toán nhưng outstanding vẫn còn dương. Trạng thái này cho thấy đối tác có thiện chí trả nợ nhưng chưa hoàn tất. Vẫn tính lãi trên phần dư nợ còn lại.

**OVERDUE — Quá hạn**

Đã qua ngày đến hạn nhưng outstanding vẫn còn. Penalty bắt đầu tích lũy từ ngày này. Đây là trạng thái cần theo dõi chặt nhất vì chi phí tăng theo từng ngày.

Lưu ý quan trọng: OVERDUE không phủ nhận PARTIAL. Một khoản có thể PARTIAL rồi OVERDUE — nghĩa là đã trả một phần nhưng phần còn lại quá hạn. State machine phải xử lý được trường hợp này.

**DISPUTED — Đang tranh chấp**

Có bất đồng giữa hai bên về số tiền, về điều khoản, hoặc về chất lượng hàng hóa dịch vụ. Trong thời gian tranh chấp, penalty có thể bị tạm dừng tính (tùy thỏa thuận) nhưng khoản nợ vẫn phải hiển thị trong báo cáo với flag riêng.

Đây là trạng thái hay bị thiếu trong các hệ thống đơn giản. Thực tế doanh nghiệp hay gặp tình huống này — khách hàng không chịu trả vì cho rằng hàng bị lỗi, hoặc hai bên lệch số do hóa đơn điều chỉnh. Nếu không có trạng thái DISPUTED thì không biết xử lý thế nào cho đúng.

**PAID — Đã thanh toán đầy đủ**

Outstanding về 0. Đây là trạng thái terminal tích cực — không có transition nào đi ra từ đây. Khoản nợ vẫn lưu trong hệ thống để tra cứu lịch sử nhưng không xuất hiện trong các báo cáo công nợ hiện tại.

**WRITTEN_OFF — Xóa nợ**

Khoản nợ được xác định không thu hồi được (với Receivable) hoặc được miễn giảm (với Payable). Đây cũng là trạng thái terminal. Khác với PAID ở chỗ outstanding không về 0 một cách thực sự — phần outstanding còn lại được ghi nhận là mất mát, ảnh hưởng đến báo cáo lãi lỗ.

---

## 3. Sơ Đồ Transition Đầy Đủ

```
DRAFT ──[activate]──────────────────────→ ACTIVE
                                              │
                          ┌───────────────────┤
                          │                   │
                    [partial_pay]        [overdue_trigger]
                          │              (scheduled job)
                          ↓                   ↓
                       PARTIAL ──[overdue]──→ OVERDUE
                          │                   │
                          │         ┌─────────┤
                          │         │         │
                    [full_pay]  [full_pay] [write_off]
                          │         │         │
                          ↓         ↓         ↓
                        PAID      PAID    WRITTEN_OFF

ACTIVE ──[dispute]──→ DISPUTED ──[resolve]──→ ACTIVE
PARTIAL ──[dispute]──→ DISPUTED ──[resolve]──→ PARTIAL
OVERDUE ──[dispute]──→ DISPUTED ──[resolve]──→ OVERDUE

ACTIVE/PARTIAL/OVERDUE ──[write_off]──→ WRITTEN_OFF
```

---

## 4. Chi Tiết Từng Transition

### DRAFT → ACTIVE (activate)

**Ai trigger:** Người dùng có quyền — không phải mọi người đều được activate. Cần phân quyền rõ: người tạo có thể là nhân viên kế toán, nhưng người activate phải là kế toán trưởng hoặc quản lý.

**Điều kiện bắt buộc trước khi cho phép activate:**
- Số tiền gốc đã xác nhận và lớn hơn 0
- Đối tác đã chọn và đang ở trạng thái ACTIVE
- Ngày phát sinh và ngày đến hạn đã có, ngày đến hạn sau ngày phát sinh
- Nguồn gốc khoản nợ đã phân loại
- Có ít nhất một tài liệu đính kèm (hợp đồng hoặc hóa đơn)
- Nếu có lãi suất thì phương thức tính lãi đã được chọn
- Nếu nhiều kỳ thì `debt_schedules` đã được sinh

**Điều kiện cảnh báo (không block nhưng phải xác nhận):**
- Tổng Receivable của đối tác sẽ vượt hạn mức tín dụng sau khi activate
- Ngày đến hạn quá ngắn (dưới 3 ngày kể từ hôm nay) — có thể nhập nhầm

**Khi activate xong:**
- Ghi log: ai activate, thời điểm nào
- Nếu có lãi suất, bắt đầu tính lãi từ ngày phát sinh (không phải ngày activate)
- Khoản nợ xuất hiện trong dashboard và báo cáo ngay lập tức

---

### ACTIVE → PARTIAL (partial_pay)

**Ai trigger:** Hệ thống tự chuyển khi nhận được một khoản thanh toán mà outstanding sau khi trừ vẫn còn dương.

**Điều kiện:** Số tiền thanh toán hợp lệ, nhỏ hơn outstanding hiện tại.

**Lưu ý nghiệp vụ:** Trạng thái PARTIAL không phải do người dùng chọn — đây là kết quả tự động sau khi ghi nhận thanh toán. Không bao giờ cho người dùng manually chuyển sang PARTIAL.

---

### ACTIVE/PARTIAL → OVERDUE (overdue_trigger)

**Ai trigger:** Chỉ scheduled job. Không bao giờ cho người dùng manually chuyển sang OVERDUE — vì nếu cho phép, người dùng có thể chuyển nhầm hoặc cố tình chuyển để tránh trách nhiệm.

**Điều kiện:** `due_date < today` và outstanding > 0.

**Với khoản nhiều kỳ:** Không phải toàn bộ khoản nợ chuyển sang OVERDUE khi một kỳ quá hạn. Chỉ kỳ đó bị đánh dấu overdue. Khoản nợ tổng vẫn ở ACTIVE/PARTIAL, nhưng trong `debt_schedules` kỳ đó có flag `is_overdue = true`. Điều này quan trọng vì ảnh hưởng đến cách tính penalty — chỉ tính trên phần dư nợ của kỳ quá hạn, không phải toàn bộ.

**Khi chuyển sang OVERDUE:**
- Ghi `overdue_since = today`
- Bắt đầu tích lũy penalty theo đúng rate của loại nợ
- Trigger notification cho người phụ trách

---

### ACTIVE/PARTIAL/OVERDUE → DISPUTED (dispute)

**Ai trigger:** Người dùng có quyền, phải nhập lý do tranh chấp bắt buộc. Lý do này rất quan trọng về mặt pháp lý sau này.

**Điều kiện:** Phải có lý do cụ thể — tranh chấp về số tiền, về chất lượng hàng hóa, về điều khoản hợp đồng, hay về tính hợp lệ của hóa đơn.

**Khi ở trạng thái DISPUTED:**

Penalty — đây là điểm phức tạp nhất. Thực tế có hai hướng xử lý tùy thỏa thuận. Hướng 1: tiếp tục tính penalty vì tranh chấp không xóa nghĩa vụ tài chính. Hướng 2: tạm dừng tính penalty trong thời gian tranh chấp. Hệ thống phải hỗ trợ cả hai và để người dùng chọn khi tạo dispute.

Báo cáo — khoản DISPUTED vẫn hiện trong báo cáo công nợ nhưng phải được tách riêng hoặc đánh dấu rõ. Không được gộp vào tổng outstanding bình thường vì con số này không chắc sẽ thu được.

**DISPUTED → ACTIVE/PARTIAL/OVERDUE (resolve):**

Khi tranh chấp được giải quyết, khoản nợ quay về trạng thái phù hợp với thực tế — không phải luôn luôn về ACTIVE. Nếu trong thời gian tranh chấp đã qua due_date thì resolve xong phải về OVERDUE. Nếu đã có thanh toán thì về PARTIAL. Hệ thống phải tự xác định trạng thái đúng dựa trên outstanding và due_date tại thời điểm resolve, không để người dùng chọn.

---

### ACTIVE/PARTIAL/OVERDUE → PAID (full_pay)

**Ai trigger:** Hệ thống tự chuyển khi outstanding về đúng 0 sau khi ghi nhận thanh toán.

**Điều kiện cứng:** Outstanding phải bằng đúng 0, không được âm, không được còn dù 1 đồng.

**Vấn đề làm tròn số:** Thực tế hay gặp tình huống outstanding còn 500đ hoặc 1,000đ do làm tròn lãi suất. Phải định nghĩa ngưỡng "coi như tất toán" — ví dụ nếu outstanding < 1,000đ thì tự động write-off phần lẻ và chuyển PAID. Ngưỡng này phải được cấu hình, không hard-code.

**Khi chuyển sang PAID:**
- Ghi `paid_at = today`
- Tính tổng lãi đã trả, tổng penalty đã trả để lưu vào summary
- Khoản nợ biến mất khỏi dashboard công nợ hiện tại nhưng vẫn truy cập được qua lịch sử

---

### ACTIVE/PARTIAL/OVERDUE → WRITTEN_OFF (write_off)

**Ai trigger:** Phải có người có thẩm quyền cao nhất (giám đốc tài chính hoặc tương đương). Đây là quyết định nghiêm trọng vì ảnh hưởng trực tiếp đến báo cáo lãi lỗ.

**Điều kiện bắt buộc:**
- Phải có lý do rõ ràng: đối tác phá sản, không liên lạc được, đã qua thời hiệu khởi kiện, hay thỏa thuận miễn giảm
- Phải có tài liệu minh chứng đính kèm
- Phải có phê duyệt của người có thẩm quyền

**Khi write-off:**

Với Receivable — phần outstanding còn lại được ghi nhận là bad debt expense, ảnh hưởng đến lãi lỗ kỳ này. Nếu trước đó đã trích lập dự phòng (từ Aging Report) thì phần dự phòng được dùng để bù đắp trước.

Với Payable — phần được miễn giảm ghi nhận là thu nhập khác. Ít phổ biến hơn nhưng vẫn xảy ra, ví dụ NCC đồng ý giảm nợ trong trường hợp tái cơ cấu.

**Sau write-off:** Không có transition nào nữa. Nhưng nếu sau này thu hồi được một phần (đối tác đột nhiên trả) thì phải tạo khoản nợ mới, không được reopen khoản đã WRITTEN_OFF.

---

## 5. Audit Trail — Không Thể Thiếu

Mọi transition đều phải ghi lại đầy đủ:

**Ai thực hiện** — user_id của người trigger hoặc "SYSTEM" nếu là scheduled job.

**Thời điểm** — timestamp chính xác đến giây.

**Từ trạng thái nào sang trạng thái nào** — không chỉ ghi trạng thái mới.

**Lý do** — bắt buộc với dispute và write-off, tùy chọn với các transition khác nhưng nên khuyến khích điền.

**Dữ liệu tại thời điểm transition** — outstanding lúc đó là bao nhiêu, penalty tích lũy là bao nhiêu. Vì sau này outstanding sẽ thay đổi, cần snapshot để tra cứu.

Audit trail không được xóa, không được sửa. Nếu có sai sót phải tạo entry mới để đính chính, không được overwrite entry cũ.

---

## 6. Những Trường Hợp Đặc Biệt Hay Bị Bỏ Sót

**Khoản nợ hết hạn nhưng đối tác đang trong quá trình phá sản:** Không nên để OVERDUE bình thường mà nên chuyển sang DISPUTED ngay khi biết thông tin này, ghi chú rõ lý do là "đối tác trong thủ tục phá sản". Điều này giúp kế toán trích lập dự phòng đúng mức (100%) thay vì theo aging bình thường.

**Khoản nợ được tái cơ cấu:** Ngân hàng đồng ý giãn thời hạn, giảm lãi suất. Đây không phải là tạo khoản nợ mới — mà là sửa điều khoản của khoản nợ hiện tại. Nhưng sửa điều khoản của khoản đang OVERDUE phải kèm theo reset `overdue_since` và tính lại lịch. Toàn bộ điều khoản cũ phải được lưu lại trước khi sửa.

**Nhiều khoản nợ giữa hai bên được bù trừ:** Công ty A nợ mình 100 triệu (Payable), mình nợ công ty A 60 triệu (Receivable). Hai bên thỏa thuận bù trừ — kết quả là mình còn nợ A 40 triệu. Đây là nghiệp vụ bù trừ công nợ (offset), không phải thanh toán thông thường. Cả hai khoản nợ phải được xử lý đồng thời — không được chỉ xử lý một chiều.

**Khoản nợ bị chuyển nhượng:** Công ty A chuyển quyền thu nợ cho công ty B (factoring). Lúc này đối tác của khoản nợ thay đổi từ A sang B, nhưng lịch sử với A phải được giữ nguyên. Đây là edge case phức tạp — nếu không có trong scope cuộc thi thì ghi chú là "chưa hỗ trợ" còn hơn là xử lý sai.

---

## 7. Mối Quan Hệ Với Các Module Khác

Module 3 là trung tâm điều phối — mọi module khác đều phải đi qua đây trước khi thay đổi trạng thái khoản nợ.

Module 4 (Thanh toán) không được tự ý cập nhật trạng thái. Sau khi ghi nhận thanh toán, Module 4 phải gọi Module 3 để xử lý transition — Module 3 mới là nơi quyết định trạng thái mới là gì.

Module 5 (Scheduled Job) chỉ được trigger transition OVERDUE — không được tự ý thay đổi bất kỳ trạng thái nào khác dù phát hiện điều kiện bất thường.

Module 7 (Repayment Planner) chỉ đọc trạng thái, không bao giờ được ghi hay trigger transition.

Module 8 (Báo cáo) filter và aggregate theo trạng thái — phải hiểu rõ trạng thái nào thuộc "đang hoạt động" (ACTIVE, PARTIAL, OVERDUE, DISPUTED) và trạng thái nào là terminal (PAID, WRITTEN_OFF) để không tính nhầm vào báo cáo công nợ hiện tại.
