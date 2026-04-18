## GOAT

## PLAN & DO

Link vòng 1: https://drive.google.com/drive/folders/1mV4RZBTkmKrBCtBU_hp4ICfYJ1yiI_dS?usp=sharing_eip&ts=69b6cc0d

Link repo: https://github.com/maaitlunghau/finance-webdev-adventure

- Finsight For Cus

  ```markdown
  # FinSight – Giới thiệu Tính Năng Dành Cho Khách Hàng

  > Tài liệu trình bày sản phẩm · Ngôn ngữ đơn giản · Không cần hiểu biết kỹ thuật

  ---

  ## FinSight là gì?

  **FinSight** là ứng dụng quản lý tài chính cá nhân thông minh, giúp bạn:

  > 💬 _"Biết mình đang nợ bao nhiêu, nên trả khoản nào trước, và còn dư bao nhiêu tiền để đầu tư – tất cả trong một ứng dụng."_

  ---

  ## TỔNG QUAN CÁC TÍNH NĂNG

  | #   | Tính năng                  | Một câu mô tả                                               |
  | --- | -------------------------- | ----------------------------------------------------------- |
  | 1   | Quản lý khoản nợ           | Ghi lại tất cả các khoản đang nợ ở một chỗ                  |
  | 2   | Trang tổng quan            | Nhìn một cái biết ngay sức khỏe tài chính                   |
  | 3   | Tính toán tài chính        | Tự động tính lãi thực và mức độ gánh nặng nợ                |
  | 4   | Theo dõi thanh toán        | Ghi lại từng lần trả tiền, tự cập nhật số dư                |
  | 5   | Cảnh báo rủi ro dây chuyền | Báo động khi có nguy cơ không trả được nhiều khoản cùng lúc |
  | 6   | Chiến lược trả nợ          | Gợi ý thứ tự trả nợ thông minh để tiết kiệm tiền nhất       |
  | 7   | Thông báo thông minh       | Nhắc nhở tự động trước khi đến hạn trả nợ                   |
  | 8   | Hồ sơ tài chính            | Lưu thông tin thu nhập và vốn của bạn                       |
  | 9   | Tư vấn đầu tư              | Gợi ý nên bỏ tiền vào đâu dựa trên tình hình thực tế        |

  ---

  ## CHI TIẾT TỪNG TÍNH NĂNG

  ---

  ## 1. 📋 QUẢN LÝ KHOẢN NỢ

  ### Vấn đề thực tế

  Nhiều người đang nợ nhiều nơi cùng lúc – ngân hàng, tín dụng, vay cá nhân – và **không biết tổng cộng đang nợ bao nhiêu**, khoản nào đến hạn trước.

  ### FinSight giải quyết thế nào?

  Bạn nhập tất cả các khoản nợ vào ứng dụng một lần. Từ đó, FinSight **tự theo dõi và cập nhật** mọi thứ cho bạn.

  ### Thông tin cần nhập cho mỗi khoản nợ

  | Thông tin                            | Ví dụ               |
  | ------------------------------------ | ------------------- |
  | Tên khoản nợ                         | "Vay ngân hàng ACB" |
  | Số tiền vay ban đầu                  | 50.000.000 VND      |
  | Lãi suất hàng năm                    | 12%                 |
  | Phí phát sinh (nếu có)               | 300.000 VND         |
  | Ngày đến hạn trả kỳ này              | 15/07/2025          |
  | Số tiền tối thiểu phải trả mỗi tháng | 2.000.000 VND       |

  ### Sau khi nhập, ứng dụng tự động làm gì?
  ```

  ✅ Tính ra lãi suất THỰC SỰ bạn đang chịu (bao gồm cả phí ẩn)
  ✅ Theo dõi số tiền còn nợ sau mỗi lần bạn trả
  ✅ Tự chuyển trạng thái khoản nợ khi bạn trả hết
  ✅ Cảnh báo khi sắp đến ngày phải trả

  ```

  ### Các thao tác bạn có thể làm
  - ➕ **Thêm** khoản nợ mới
  - ✏️ **Sửa** thông tin nếu có thay đổi
  - 👁️ **Xem** toàn bộ danh sách và lịch sử
  - 🗑️ **Xóa** khoản nợ đã tất toán *(dữ liệu lịch sử vẫn được giữ lại để đối chiếu)*

  ---

  ## 2. 📊 TRANG TỔNG QUAN (Dashboard)

  ### Vấn đề thực tế
  Mỗi sáng thức dậy bạn muốn biết ngay: *"Tài chính mình đang ổn không? Có khoản nợ nào cần lo ngay không?"* – mà không muốn phải tính toán thủ công.

  ### FinSight giải quyết thế nào?
  Trang chủ của ứng dụng hiển thị **tất cả thông tin quan trọng nhất** chỉ trong một màn hình duy nhất.

  ### Những gì bạn thấy ngay khi mở app

  ```

  ┌─────────────────────────────────────────────────────┐
  │ TỔNG QUAN TÀI CHÍNH │
  ├──────────────────────┬──────────────────────────────┤
  │ Tổng đang nợ │ 75.000.000 VND │
  ├──────────────────────┼──────────────────────────────┤
  │ Phải trả tháng này │ 8.000.000 VND │
  ├──────────────────────┼──────────────────────────────┤
  │ Gánh nặng nợ (DTI) │ 40% ⚠️ CẦN CHÚ Ý │
  ├──────────────────────┼──────────────────────────────┤
  │ Lãi suất trung bình │ 17,5% │
  ├──────────────────────┴──────────────────────────────┤
  │ ⏰ SẮP ĐẾN HẠN TRONG 7 NGÀY TỚI │
  │ → FE Credit – còn 15tr – hạn 17/06 │
  │ → Vay cá nhân – còn 10tr – hạn 20/06 │
  └─────────────────────────────────────────────────────┘

  ```

  ### Ý nghĩa của "Gánh nặng nợ" (DTI)

  > Đây là tỷ lệ **tiền trả nợ hàng tháng so với thu nhập** của bạn.

  ```

  Ví dụ dễ hiểu:
  Thu nhập tháng : 20.000.000 VND
  Tổng phải trả nợ : 8.000.000 VND
  Gánh nặng nợ (DTI) : 40%

      🟢 Dưới 40%  → An toàn      – Tài chính lành mạnh
      🟡 40% – 50% → Cần chú ý   – Hạn chế vay thêm
      🔴 Trên 50%  → Nguy hiểm   – Cần xử lý ngay

  ```

  ---

  ## 3. 🧮 TÍNH TOÁN TÀI CHÍNH TỰ ĐỘNG

  ### Vấn đề thực tế
  Ngân hàng quảng cáo lãi suất 12%/năm, nhưng sau khi tính thêm phí thẩm định, phí bảo hiểm... bạn thực ra đang trả đến 15–22%. **Hầu hết người vay không biết điều này.**

  ### FinSight giải quyết thế nào?
  Ứng dụng tự động tính ra **lãi suất thực sự** bạn đang chịu – gọi là **Lãi suất hiệu dụng**.

  ### Minh họa dễ hiểu

  ```

  Ngân hàng nói: "Lãi suất chỉ 12%/năm"

  Nhưng thực tế:
  Tiền vay : 10.000.000 VND
  Lãi 12%/năm : 1.200.000 VND
  Phí phát sinh : 300.000 VND ← Ngân hàng không nói rõ
  ─────────────────────────────────
  Tổng chi phí : 1.500.000 VND

      Lãi suất THỰC :  1.500.000 / 10.000.000 = 15%
      ⚠️ Đắt hơn 3% so với quảng cáo!

  ```

  > 💡 **Lợi ích:** Bạn biết được khoản vay nào đang "đắt" nhất để ưu tiên trả trước – thay vì chỉ nhìn vào con số lãi suất quảng cáo.

  ---

  ## 4. 💳 THEO DÕI THANH TOÁN

  ### Vấn đề thực tế
  Mỗi lần trả nợ xong, bạn không biết **còn nợ bao nhiêu**, cũng không có chỗ lưu lại lịch sử để đối chiếu khi cần.

  ### FinSight giải quyết thế nào?
  Mỗi lần trả tiền, bạn chỉ cần ghi vào app. Hệ thống **tự cập nhật số dư còn lại** và lưu toàn bộ lịch sử giao dịch.

  ### Luồng thao tác đơn giản

  ```

  Bạn trả 2.000.000 VND cho khoản nợ FE Credit
  │
  ▼
  Mở app → Chọn "FE Credit" → Nhập 2.000.000 → Xác nhận
  │
  ▼
  App tự động cập nhật:
  Số dư cũ : 15.000.000 VND
  Vừa trả : 2.000.000 VND
  Số dư mới : 13.000.000 VND ✅

      Lịch sử ghi lại:
      "Trả 2.000.000 VND – ngày 15/06/2025"

  ```

  ### Khi nào khoản nợ được đánh dấu "Đã tất toán"?

  ```

  Số dư còn lại = 0 → App tự động đánh dấu ✅ ĐÃ TẤT TOÁN
  Không cần bạn làm gì thêm

  ```

  ---

  ## 5. 🚨 CẢNH BÁO RỦI RO DÂY CHUYỀN

  ### Vấn đề thực tế
  Bạn có 3 khoản nợ đến hạn cùng 1 tuần. Tiền chỉ đủ trả 1 khoản. Trả không được khoản này → bị phạt → nợ tăng → trả không được khoản kia → vòng xoáy nợ bắt đầu.

  > Đây được gọi là **"Rủi ro dây chuyền"** – giống như hàng quân domino đổ liên tiếp.

  ### FinSight giải quyết thế nào?
  Ứng dụng **phát hiện sớm** các dấu hiệu nguy hiểm và cảnh báo bạn **trước khi** vòng xoáy xảy ra.

  ### 3 dấu hiệu nguy hiểm app sẽ phát hiện

  ```

  Dấu hiệu 1 – Nhiều khoản đến hạn cùng lúc
  Có từ 2 khoản nợ trở lên đến hạn trong vòng 7 ngày tới
  → Áp lực thanh toán tập trung, dễ bị thiếu tiền

  Dấu hiệu 2 – Gánh nặng nợ quá cao
  Tỷ lệ trả nợ/thu nhập vượt 40%
  → Không còn nhiều tiền dự phòng nếu có biến cố

  Dấu hiệu 3 – Từng trả trễ hạn
  Đã có ít nhất 1 lần thanh toán sau ngày đến hạn
  → Dấu hiệu đang mất kiểm soát dòng tiền

  ```

  ### Cảnh báo trông như thế nào?

  ```

  ┌──────────────────────────────────────────────────────┐
  │ 🚨 CẢNH BÁO: RỦI RO DÂY CHUYỀN │
  │ │
  │ Bạn có 3 khoản nợ đến hạn trong 7 ngày tới │
  │ với tổng gánh nặng nợ đang ở mức 47%. │
  │ │
  │ Hãy ưu tiên cân đối dòng tiền ngay hôm nay. │
  │ │
  │ [Xem chi tiết các khoản nợ] │
  └──────────────────────────────────────────────────────┘

  ```

  > ✅ **Cảnh báo xuất hiện tự động** mỗi sáng và ngay khi bạn thêm khoản nợ mới – không cần bạn phải kiểm tra thủ công.

  ---

  ## 6. 🎯 CHIẾN LƯỢC TRẢ NỢ THÔNG MINH

  ### Vấn đề thực tế
  Khi có nhiều khoản nợ, câu hỏi phổ biến nhất là: *"Tháng này tôi có thêm 3 triệu, nên dồn vào khoản nào để thoát nợ nhanh và tiết kiệm nhất?"*

  ### FinSight giải quyết thế nào?
  App gợi ý **2 chiến lược trả nợ** đã được chứng minh hiệu quả, kèm so sánh cụ thể để bạn tự quyết định.

  ---

  ### Chiến lược 1 – AVALANCHE (Dành cho người muốn tiết kiệm tiền nhất)

  > **Nguyên tắc:** Dồn tiền vào khoản nợ có lãi suất thực CAO NHẤT trước.

  ```

  Lý do: Khoản lãi cao đang "ăn" tiền của bạn nhiều nhất mỗi ngày.
  Xử lý nó trước = tiết kiệm được nhiều tiền lãi nhất.

  Ví dụ:
  Bạn có thêm 3.000.000 VND/tháng để trả thêm

      Khoản FE Credit  (lãi thực 25%) ← Tấn công trước
      Khoản ACB        (lãi thực 15%)
      Khoản Cá nhân   (lãi thực 10%)

      Dồn 3tr vào FE Credit → Trả hết sau 4 tháng
      Sau đó chuyển toàn bộ sang ACB → Trả hết nhanh hơn
      Cuối cùng: Tiết kiệm được 2.700.000 VND tiền lãi

  ```

  ---

  ### Chiến lược 2 – SNOWBALL (Dành cho người cần động lực)

  > **Nguyên tắc:** Dồn tiền vào khoản nợ có số dư NHỎ NHẤT trước.

  ```

  Lý do: Trả hết được 1 khoản nợ (dù nhỏ) tạo ra cảm giác chiến thắng,
  giúp bạn có động lực tiếp tục.

  Ví dụ:
  Khoản Cá nhân (còn 10tr) ← Tấn công trước
  Khoản FE Credit (còn 15tr)
  Khoản ACB (còn 50tr)

      Trả hết Vay cá nhân sau 3 tháng → ✅ Xóa được 1 khoản nợ!
      Tâm lý tốt hơn → Tiếp tục với FE Credit

  ```

  ---

  ### So sánh 2 chiến lược

  ```

  ┌────────────────────┬──────────────────┬──────────────────┐
  │ Tiêu chí │ AVALANCHE │ SNOWBALL │
  ├────────────────────┼──────────────────┼──────────────────┤
  │ Tổng lãi phải trả │ 8.500.000 VND │ 11.200.000 VND │
  │ Thời gian trả hết │ 28 tháng │ 30 tháng │
  │ Ưu điểm │ Tiết kiệm tiền │ Dễ duy trì │
  │ Phù hợp với │ Người kỷ luật │ Người cần │
  │ │ tài chính cao │ động lực │
  └────────────────────┴──────────────────┴──────────────────┘

  💡 Với Avalanche, bạn tiết kiệm 2.700.000 VND và thoát nợ
  sớm hơn 2 tháng so với Snowball.

  ```

  ---

  ## 7. 🔔 THÔNG BÁO THÔNG MINH

  ### Vấn đề thực tế
  Quên ngày đến hạn trả nợ → Bị phạt trễ hạn → Tốn thêm tiền không đáng. Điều này xảy ra với hầu hết mọi người.

  ### FinSight giải quyết thế nào?
  Hệ thống **tự động kiểm tra mỗi sáng lúc 8 giờ** và gửi thông báo phù hợp – không cần bạn phải nhớ hay cài đặt gì thêm.

  ### Các loại thông báo

  ```

  🟡 NHẮC NHỞ – Khoản nợ sắp đến hạn
  "Khoản FE Credit sẽ đến hạn sau 3 ngày.
  Số tiền cần trả: 1.500.000 VND"

  🔴 CẢNH BÁO – Khoản nợ đã quá hạn
  "Khoản Vay cá nhân đã quá hạn 1 ngày.
  Hãy thanh toán ngay để tránh phát sinh phí phạt."

  🚨 KHẨN CẤP – Gánh nặng nợ nguy hiểm
  "Tỷ lệ trả nợ/thu nhập của bạn đang ở mức 52%.
  Cần xem xét cắt giảm chi tiêu hoặc tăng thu nhập."

  🚨 CẢNH BÁO RỦI RO DÂY CHUYỀN
  (Xem mục 5 ở trên)

  ```

  ### Giao diện thông báo trong app

  ```

  Góc trên thanh điều hướng: 🔔 3 ← Con số đỏ = số thông báo chưa đọc

  Nhấn vào:
  ┌──────────────────────────────────────┐
  │ Thông báo [Đọc tất cả]│
  ├──────────────────────────────────────┤
  │ 🚨 Gánh nặng nợ 52% · 2 phút trước│
  ├──────────────────────────────────────┤
  │ 🟡 FE Credit đến hạn · 1 giờ trước │
  │ sau 2 ngày [Xem ngay →] │
  ├──────────────────────────────────────┤
  │ 🔴 Vay cá nhân quá hạn · Hôm qua │
  │ 1 ngày [Xem ngay →] │
  └──────────────────────────────────────┘

  ```

  ---

  ## 8. 👤 HỒ SƠ TÀI CHÍNH

  ### Vấn đề thực tế
  Để đưa ra lời khuyên phù hợp, ứng dụng cần biết **thu nhập và mức chấp nhận rủi ro** của bạn. Giống như bác sĩ cần biết bệnh sử trước khi kê đơn.

  ### Thông tin cần điền

  ```

  ┌──────────────────────────────────────────────────────┐
  │ HỒ SƠ TÀI CHÍNH │
  ├──────────────────────────────────────────────────────┤
  │ Thu nhập hàng tháng : 20.000.000 VND (bắt buộc)│
  │ Tổng vốn/tài sản hiện có: 50.000.000 VND (tùy chọn)│
  │ Mức chấp nhận rủi ro : TRUNG BÌNH (bắt buộc)│
  │ (Thấp / Trung bình / Cao) │
  └──────────────────────────────────────────────────────┘

  ```

  ### Thông tin này được dùng ở đâu?

  ```

  Thu nhập tháng
  └──► Tính Gánh nặng nợ (DTI) → hiển thị trên Dashboard

  Tổng vốn
  └──► Tính số tiền cụ thể khi tư vấn phân bổ đầu tư
  VD: "Nên để 30% vốn = 15.000.000 VND vào tiết kiệm"

  Mức chấp nhận rủi ro
  └──► Điều chỉnh tỷ lệ đầu tư phù hợp với bạn
  └──► Quyết định có gửi cảnh báo thị trường cho bạn không

  ```

  > ⚠️ **Lưu ý:** Nếu chưa điền thu nhập, tính năng Gánh nặng nợ (DTI) sẽ không hoạt động và app sẽ nhắc nhở bạn cập nhật.

  ---

  ## 9. 💰 TƯ VẤN ĐẦU TƯ THÔNG MINH

  ### Vấn đề thực tế
  Bạn có tiền dư nhưng không biết: *"Nên gửi tiết kiệm, mua vàng, mua cổ phiếu hay để tiền mặt?"* – và câu trả lời đúng cho MỖI NGƯỜI là khác nhau, tùy tình hình tài chính và thị trường hiện tại.

  ### FinSight giải quyết thế nào?
  App kết hợp **3 nguồn thông tin thực tế** của bạn để đưa ra gợi ý phân bổ tài sản phù hợp nhất:

  ```

  Nguồn 1: Hồ sơ tài chính của bạn
  → Bạn chấp nhận rủi ro ở mức nào?
  → Bạn đang có bao nhiêu vốn?

  Nguồn 2: Tình trạng nợ hiện tại
  → Gánh nặng nợ đang ở mức SAFE, WARNING hay DANGER?

  Nguồn 3: Tâm lý thị trường hôm nay
  → Thị trường đang Sợ hãi hay Tham lam?
  (Dữ liệu cập nhật hàng ngày từ chỉ số Fear & Greed Index)

  ```

  ### Ví dụ gợi ý thực tế

  ```

  Trường hợp 1 – Nợ nhiều, cần thận trọng:
  Gánh nặng nợ: 55% (NGUY HIỂM) + Rủi ro thấp + Thị trường sợ hãi

      Gợi ý:
      ┌────────────────────────────────────────────────────┐
      │  ⚠️  Ưu tiên trả nợ trước, tạm dừng đầu tư mới    │
      │                                                    │
      │  Nếu vẫn muốn đầu tư 50.000.000 VND:              │
      │  · Tiết kiệm ngân hàng  : 60% = 30.000.000 VND    │
      │  · Trái phiếu           : 30% = 15.000.000 VND    │
      │  · Cổ phiếu             : 10% =  5.000.000 VND    │
      │  · Vàng                 :  0%                      │
      │  · Crypto               :  0%                      │
      └────────────────────────────────────────────────────┘

      Lý do: Nợ của bạn đang ở mức nguy hiểm. Đầu tư rủi ro
      lúc này có thể dẫn đến không trả được nợ.

  ─────────────────────────────────────────────────────────

  Trường hợp 2 – Tài chính ổn, chấp nhận rủi ro cao:
  Gánh nặng nợ: 25% (AN TOÀN) + Rủi ro cao + Thị trường trung lập

      Gợi ý:
      ┌────────────────────────────────────────────────────┐
      │  ✅ Tình hình tài chính tốt, có thể đầu tư        │
      │                                                    │
      │  Phân bổ 50.000.000 VND:                          │
      │  · Tiết kiệm ngân hàng  : 20% = 10.000.000 VND    │
      │  · Trái phiếu           : 15% =  7.500.000 VND    │
      │  · Cổ phiếu             : 40% = 20.000.000 VND    │
      │  · Vàng                 : 15% =  7.500.000 VND    │
      │  · Crypto               : 10% =  5.000.000 VND    │
      └────────────────────────────────────────────────────┘

  ```

  ### Chỉ số tâm lý thị trường (Fear & Greed) là gì?

  ```

  Thang đo từ 0 đến 100, cập nhật hàng ngày:

      0 – 24   😱 Sợ hãi cực độ  → Thị trường đang bán tháo ồ ạt
      25 – 44  😟 Sợ hãi         → Nhà đầu tư bi quan
      45 – 55  😐 Trung lập      → Thị trường ổn định
      56 – 75  😊 Tham lam       → Thị trường lạc quan
      76 – 100 🤑 Tham lam cực độ→ Nguy cơ bong bóng

  Hôm nay: 26 điểm = 😟 Sợ hãi
  → App gợi ý tăng tỷ trọng tài sản an toàn như vàng, tiết kiệm

  ```

  > 💡 **Lưu ý quan trọng:** Đây là **gợi ý tham khảo**, không phải lời khuyên tài chính chuyên nghiệp. Quyết định cuối cùng luôn thuộc về bạn.

  ---

  ## 🗺️ HÀNH TRÌNH NGƯỜI DÙNG ĐIỂN HÌNH

  ```

  Ngày 1: Tạo tài khoản
  └──► Điền hồ sơ tài chính (thu nhập, vốn, mức rủi ro)
  └──► Nhập tất cả khoản nợ đang có

  Từ ngày 2 trở đi:
  └──► Mở app → Xem Dashboard → Biết ngay tình hình tài chính
  └──► Nhận thông báo nhắc trả nợ tự động mỗi sáng
  └──► Mỗi lần trả tiền → Ghi vào app → Số dư tự cập nhật

  Khi muốn trả nợ thông minh hơn:
  └──► Vào mục Chiến lược → Nhập số tiền có thể trả thêm
  └──► So sánh Avalanche vs Snowball → Chọn phương án phù hợp

  Khi có tiền dư muốn đầu tư:
  └──► Vào mục Tư vấn đầu tư
  └──► Nhận gợi ý phân bổ dựa trên tình hình thực tế hôm nay

  ```

  ---

  ## ❓ CÂU HỎI THƯỜNG GẶP

  **Q: Dữ liệu của tôi có an toàn không?**
  > Tất cả thông tin được mã hóa và lưu trữ bảo mật. Chỉ bạn mới truy cập được tài khoản của mình.

  **Q: Tôi có thể dùng cho cả nợ ngân hàng lẫn vay cá nhân không?**
  > Có. FinSight quản lý mọi loại khoản nợ: ngân hàng, tín dụng, vay cá nhân, thẻ tín dụng...

  **Q: Nếu tôi quên ghi nhận thanh toán thì sao?**
  > App sẽ phát hiện khoản nợ quá hạn và thông báo cho bạn. Bạn có thể ghi bổ sung bất cứ lúc nào.

  **Q: Tính năng tư vấn đầu tư có chính xác 100% không?**
  > Đây là gợi ý dựa trên thuật toán và dữ liệu thị trường thực tế. Không có công cụ nào dự đoán thị trường chính xác 100% – luôn cân nhắc kỹ trước khi quyết định.

  **Q: Ứng dụng có miễn phí không?**
  > *(Tùy chính sách pricing của sản phẩm – bổ sung sau)*

  ---

  *FinSight – Quản lý nợ thông minh, đầu tư đúng lúc.*

  ```

- Analysis

  ```markdown
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

  ### 1.1 Đăng ký tài khoản ✅ 

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

  ### 1.2 Đăng nhập ✅

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

  ### 1.3 Đăng xuất ✅ 

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

  ## 2. Debt Management – Quản lý khoản nợ ✅ 

  ### 2.1 Thêm khoản nợ mới

  Người dùng tạo một bản ghi khoản nợ để hệ thống theo dõi và tính toán.

  Luồng xử lý:

  1. User điền form thông tin khoản nợ.
  2. Frontend kiểm tra các trường bắt buộc.
  3. Gửi lên backend. Backend lưu vào DB, liên kết với tài khoản user đang đăng nhập.
  4. Sau khi lưu, hệ thống tự động tính chỉ số EAR cho khoản nợ này (xem mục 4.1).
  5. Trả về thông tin khoản nợ vừa tạo kèm EAR đã tính.

  Thông tin của một khoản nợ:

  | Trường            | Kiểu dữ liệu | Bắt buộc | Mô tả                                             |
  | ----------------- | ------------ | -------- | ------------------------------------------------- |
  | id                | UUID         | Tự động  | Mã định danh duy nhất                             |
  | user_id           | UUID         | Tự động  | Liên kết với tài khoản user                       |
  | name              | Chuỗi ký tự  | Có       | Tên khoản nợ, ví dụ: "Vay ngân hàng ACB"          |
  | principal         | Số thập phân | Có       | Số tiền vay gốc, đơn vị VND                       |
  | apr               | Số thập phân | Có       | Lãi suất hàng năm tính theo %                     |
  | fees              | Số thập phân | Không    | Các loại phí phát sinh, đơn vị VND. Mặc định là 0 |
  | due_date          | Ngày         | Có       | Ngày đến hạn thanh toán kỳ tiếp theo              |
  | min_payment       | Số thập phân | Có       | Số tiền tối thiểu phải trả mỗi kỳ                 |
  | remaining_balance | Số thập phân | Tự động  | Dư nợ còn lại. Khởi tạo bằng principal            |
  | status            | Trạng thái   | Tự động  | ACTIVE / PAID / OVERDUE                           |
  | ear               | Số thập phân | Tự động  | Lãi suất hiệu dụng, được tính tự động             |
  | created_at        | Thời gian    | Tự động  | Thời điểm tạo                                     |
  | updated_at        | Thời gian    | Tự động  | Thời điểm cập nhật gần nhất                       |

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

  ## 3. Dashboard – Trang tổng quan ✅ 

  Trang chủ sau khi đăng nhập. Hiển thị bức tranh tổng thể về tình trạng tài chính của user.

  Luồng xử lý:

  1. Gọi API dashboard.
  2. Backend lấy toàn bộ khoản nợ đang ACTIVE của user.
  3. Tính toán các chỉ số tổng hợp và trả về.

  Các thành phần hiển thị:

  | Thành phần                | Mô tả                                                                |
  | ------------------------- | -------------------------------------------------------------------- |
  | Tổng dư nợ                | Cộng dồn tất cả số dư còn lại của các khoản nợ đang ACTIVE           |
  | Tổng thanh toán tối thiểu | Cộng dồn số tiền tối thiểu phải trả trong kỳ này của tất cả khoản nợ |
  | DTI                       | Tỷ lệ nợ trên thu nhập, kèm phân loại mức độ SAFE / WARNING / DANGER |
  | EAR trung bình            | Trung bình lãi suất hiệu dụng của toàn bộ danh mục nợ                |
  | Khoản nợ sắp đến hạn      | Danh sách các khoản có ngày đến hạn trong vòng 7 ngày tới            |

  API:

      GET /api/dashboard
      200 : total_remaining_balance, total_min_payment, dti (value + status),
            avg_ear, upcoming_debts (id, name, due_date, remaining_balance, min_payment)

  ---

  ## 4. Financial Calculation – Tính toán tài chính ✅ 

  ### 4.1 EAR – Lãi suất hiệu dụng hàng năm ✅

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

  | Khoảng DTI  | Trạng thái | Màu gợi ý | Ý nghĩa                        |
  | ----------- | ---------- | --------- | ------------------------------ |
  | Dưới 40%    | SAFE       | Xanh lá   | Mức nợ lành mạnh               |
  | 40% đến 50% | WARNING    | Vàng      | Cần theo dõi, hạn chế vay thêm |
  | Trên 50%    | DANGER     | Đỏ        | Rủi ro cao, cần xử lý ngay     |

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

  | Trường  | Kiểu dữ liệu | Mô tả                         |
  | ------- | ------------ | ----------------------------- |
  | id      | UUID         | Mã định danh                  |
  | debt_id | UUID         | Liên kết với khoản nợ         |
  | user_id | UUID         | Liên kết với user             |
  | amount  | Số thập phân | Số tiền đã trả                |
  | paid_at | Thời gian    | Thời điểm ghi nhận thanh toán |
  | note    | Chuỗi ký tự  | Ghi chú thêm, không bắt buộc  |

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

  | Điều kiện                    | Ngưỡng                                                   | Ý nghĩa                                          |
  | ---------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
  | Nhiều khoản đến hạn cùng lúc | Từ 2 khoản trở lên có ngày đến hạn trong vòng 7 ngày tới | Áp lực thanh toán tập trung trong thời gian ngắn |
  | DTI vượt ngưỡng              | DTI trên 40%                                             | Gánh nặng nợ đã vượt mức an toàn                 |
  | Có lịch sử trả trễ           | Từng có ít nhất 1 lần thanh toán sau ngày đến hạn        | Dấu hiệu khó kiểm soát dòng tiền                 |

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

  | Chỉ số                 | Avalanche             | Snowball                |
  | ---------------------- | --------------------- | ----------------------- |
  | Tổng lãi phải trả      | X VND                 | Y VND                   |
  | Thời gian trả hết      | A tháng               | B tháng                 |
  | Khoản ưu tiên đầu tiên | Khoản có EAR cao nhất | Khoản có số dư nhỏ nhất |

  API:

      GET /api/strategy?extra_payment=[số tiền trả thêm mỗi tháng]
      200 : Kết quả của cả 2 chiến lược gồm thứ tự ưu tiên, tổng lãi và số tháng

  ---

  ## 8. Smart Notification – Thông báo thông minh

  ### 8.1 Tác vụ nền tự động (Cron Job)

  Mỗi ngày lúc 8 giờ sáng, hệ thống chạy một tác vụ nền để kiểm tra toàn bộ user và tự động tạo thông báo phù hợp.

  Các trường hợp tạo thông báo:

  | Điều kiện phát hiện                       | Loại thông báo | Mức độ   | Nội dung mẫu                                  |
  | ----------------------------------------- | -------------- | -------- | --------------------------------------------- |
  | Khoản nợ đến hạn trong 3 ngày hoặc ít hơn | DEBT_DUE_SOON  | WARNING  | "Khoản nợ [tên] sẽ đến hạn sau 3 ngày"        |
  | Khoản nợ đã quá hạn mà chưa thanh toán    | DEBT_OVERDUE   | DANGER   | "Khoản nợ [tên] đã quá hạn X ngày"            |
  | DTI vượt 50%                              | DTI_CRITICAL   | CRITICAL | "Tỷ lệ nợ của bạn đang ở mức nguy hiểm (XX%)" |
  | Thỏa điều kiện Domino Risk                | DOMINO_RISK    | WARNING  | Xem mục 6                                     |

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

  | Trường          | Kiểu dữ liệu | Mô tả                                                                    |
  | --------------- | ------------ | ------------------------------------------------------------------------ |
  | id              | UUID         | Mã định danh                                                             |
  | user_id         | UUID         | Liên kết với user                                                        |
  | type            | Loại cố định | DEBT_DUE_SOON / DEBT_OVERDUE / DTI_CRITICAL / DOMINO_RISK / MARKET_ALERT |
  | severity        | Mức độ       | INFO / WARNING / DANGER / CRITICAL                                       |
  | title           | Chuỗi        | Tiêu đề ngắn                                                             |
  | body            | Chuỗi        | Nội dung chi tiết                                                        |
  | is_read         | True/False   | Trạng thái đã đọc, mặc định là chưa đọc                                  |
  | related_debt_id | UUID         | Khoản nợ liên quan, nếu có                                               |
  | created_at      | Thời gian    | Thời điểm tạo thông báo                                                  |

  ---

  ## 9. Financial Profile – Hồ sơ tài chính

  Thông tin tài chính cá nhân của user. Được dùng làm đầu vào để tính DTI và tạo gợi ý đầu tư.

  Luồng xử lý:

  1. User vào trang hồ sơ tài chính và điền/cập nhật thông tin.
  2. Gửi lên backend, lưu vào DB theo từng user (quan hệ 1-1 với tài khoản).
  3. Các module DTI và Advisory đọc dữ liệu này mỗi khi cần tính toán.

  Thông tin hồ sơ tài chính:

  | Trường         | Kiểu dữ liệu | Bắt buộc | Mô tả                                            |
  | -------------- | ------------ | -------- | ------------------------------------------------ |
  | user_id        | UUID         | Tự động  | Liên kết 1-1 với tài khoản user                  |
  | monthly_income | Số thập phân | Có       | Thu nhập hàng tháng, đơn vị VND                  |
  | capital        | Số thập phân | Không    | Tổng tài sản hoặc vốn hiện có, đơn vị VND        |
  | risk_level     | Mức cố định  | Có       | Mức chấp nhận rủi ro đầu tư: LOW / MEDIUM / HIGH |
  | updated_at     | Thời gian    | Tự động  | Lần cập nhật gần nhất                            |

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

  | Điều kiện                                     | Gợi ý hành động                                      |
  | --------------------------------------------- | ---------------------------------------------------- |
  | Mức rủi ro thấp (LOW)                         | Tăng tỷ trọng tiết kiệm, giảm cổ phiếu và crypto     |
  | Chỉ số Fear & Greed ở vùng Fear (0 đến 40)    | Tăng tài sản an toàn như vàng, tiết kiệm, trái phiếu |
  | Chỉ số Fear & Greed ở vùng Greed (60 đến 100) | Giảm tỷ trọng cổ phiếu để tránh rủi ro bong bóng     |
  | DTI đang ở mức DANGER                         | Ưu tiên trả nợ trước, tạm dừng đầu tư mới            |
  | DTI ở mức SAFE và mức rủi ro cao (HIGH)       | Có thể tăng tỷ trọng cổ phiếu và crypto              |

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

  | Trường     | Mô tả                                                       |
  | ---------- | ----------------------------------------------------------- |
  | value      | Điểm số từ 0 đến 100                                        |
  | label      | Nhãn: Extreme Fear / Fear / Neutral / Greed / Extreme Greed |
  | fetched_at | Thời điểm lấy dữ liệu                                       |

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

  | Sprint   | Module cần làm                          | Lý do ưu tiên                                          |
  | -------- | --------------------------------------- | ------------------------------------------------------ |
  | Sprint 1 | Đăng ký, đăng nhập, đăng xuất, bảo mật  | Nền tảng bắt buộc, không có thì không làm được gì khác |
  | Sprint 1 | Hồ sơ tài chính                         | Cần có thu nhập để tính DTI ngay từ đầu                |
  | Sprint 2 | Quản lý khoản nợ (thêm/sửa/xóa/xem)     | Chức năng cốt lõi của toàn hệ thống                    |
  | Sprint 2 | Tính EAR và DTI                         | Gắn liền với Debt CRUD, cần có ngay                    |
  | Sprint 3 | Dashboard tổng quan                     | Tổng hợp dữ liệu từ các module trước                   |
  | Sprint 3 | Theo dõi thanh toán                     | Luồng nghiệp vụ cơ bản                                 |
  | Sprint 4 | Thông báo thông minh và cron job        | Tự động hóa cảnh báo                                   |
  | Sprint 4 | Domino Risk                             | Phụ thuộc lịch sử thanh toán và DTI                    |
  | Sprint 5 | Chiến lược trả nợ Avalanche và Snowball | Tính năng tư vấn nâng cao                              |
  | Sprint 6 | Market Sentiment và Market Alert        | Cần tích hợp API bên ngoài                             |
  | Sprint 6 | Investment Advisory                     | Phụ thuộc hồ sơ tài chính và Market Sentiment          |
  | Sprint 7 | AI Chatbot                              | Cần tích hợp NLP hoặc LLM                              |
  | Sprint 7 | OCR                                     | Cần tích hợp dịch vụ OCR                               |

  ---

  ## 16. Phụ lục

  ### Database Schema

  **Bảng users** – Lưu thông tin tài khoản

  | Trường          | Mô tả                              |
  | --------------- | ---------------------------------- |
  | id              | Mã định danh                       |
  | email           | Địa chỉ email đăng ký              |
  | password_hash   | Mật khẩu đã mã hóa                 |
  | failed_attempts | Số lần nhập sai mật khẩu liên tiếp |
  | locked          | Tài khoản có đang bị khóa không    |
  | locked_until    | Thời điểm tự động mở khóa          |

  ---

  **Bảng financial_profiles** – Hồ sơ tài chính của user

  | Trường         | Mô tả                                  |
  | -------------- | -------------------------------------- |
  | id             | Mã định danh                           |
  | user_id        | Liên kết với bảng users                |
  | monthly_income | Thu nhập hàng tháng                    |
  | capital        | Tổng vốn/tài sản hiện có               |
  | risk_level     | Mức rủi ro đầu tư: LOW / MEDIUM / HIGH |

  ---

  **Bảng debts** – Danh sách khoản nợ

  | Trường            | Mô tả                                |
  | ----------------- | ------------------------------------ |
  | id                | Mã định danh                         |
  | user_id           | Liên kết với bảng users              |
  | name              | Tên khoản nợ                         |
  | principal         | Tiền vay gốc                         |
  | apr               | Lãi suất năm (%)                     |
  | fees              | Phí phát sinh                        |
  | due_date          | Ngày đến hạn                         |
  | min_payment       | Thanh toán tối thiểu mỗi kỳ          |
  | remaining_balance | Dư nợ còn lại                        |
  | status            | ACTIVE / PAID / OVERDUE              |
  | ear               | Lãi suất hiệu dụng đã tính           |
  | created_at        | Thời điểm tạo                        |
  | updated_at        | Thời điểm cập nhật                   |
  | deleted_at        | Thời điểm xóa mềm, null nếu chưa xóa |

  ---

  **Bảng payments** – Lịch sử thanh toán

  | Trường  | Mô tả                   |
  | ------- | ----------------------- |
  | id      | Mã định danh            |
  | debt_id | Liên kết với bảng debts |
  | user_id | Liên kết với bảng users |
  | amount  | Số tiền đã trả          |
  | paid_at | Thời điểm thanh toán    |
  | note    | Ghi chú                 |

  ---

  **Bảng notifications** – Thông báo

  | Trường          | Mô tả                                        |
  | --------------- | -------------------------------------------- |
  | id              | Mã định danh                                 |
  | user_id         | Liên kết với bảng users                      |
  | type            | Loại thông báo (xem danh sách bên dưới)      |
  | severity        | Mức độ nghiêm trọng (xem danh sách bên dưới) |
  | title           | Tiêu đề ngắn                                 |
  | body            | Nội dung đầy đủ                              |
  | is_read         | Đã đọc hay chưa                              |
  | related_debt_id | Khoản nợ liên quan, có thể để trống          |
  | created_at      | Thời điểm tạo                                |

  ---

  **Bảng market_sentiment** – Dữ liệu tâm lý thị trường

  | Trường     | Mô tả                                |
  | ---------- | ------------------------------------ |
  | id         | Mã định danh                         |
  | source     | Nguồn dữ liệu, ví dụ: alternative.me |
  | value      | Điểm số từ 0 đến 100                 |
  | label      | Nhãn phân loại                       |
  | fetched_at | Thời điểm lấy dữ liệu                |

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

  | Biến               | Mô tả                                           |
  | ------------------ | ----------------------------------------------- |
  | DATABASE_URL       | Chuỗi kết nối database                          |
  | JWT_SECRET         | Khóa bí mật để ký JWT                           |
  | JWT_EXPIRES_IN     | Thời gian sống của token, ví dụ: 86400 (1 ngày) |
  | BCRYPT_SALT_ROUNDS | Số vòng mã hóa bcrypt, khuyến nghị 10           |
  | OCR_API_KEY        | API key của dịch vụ OCR                         |
  | AI_API_KEY         | API key của dịch vụ AI/NLP                      |
  | MARKET_API_URL     | URL lấy dữ liệu thị trường                      |
  | CRON_DAILY_TIME    | Giờ chạy cron hàng ngày, ví dụ: 08:00           |
  ```

- Deep

  ```markdown
  # FinSight – Phân Tích Sâu Các Chức Năng Nợ & Tài Chính

  > Tài liệu nội bộ · Dành cho team phát triển · Phiên bản demo

  ---

  ## 📖 GIẢI THÍCH THUẬT NGỮ & KEY WORDS

  Trước khi đọc tài liệu, hãy nắm chắc các thuật ngữ tài chính được dùng xuyên suốt hệ thống.

  ---

  ### 💰 Principal – Tiền vay gốc

  Số tiền thực tế người dùng vay ban đầu, chưa bao gồm lãi suất hay phí.
  ```

  Ví dụ: Vay ngân hàng ACB 50.000.000 VND
  → Principal = 50.000.000 VND

  ```

  ---

  ### 📈 APR – Annual Percentage Rate (Lãi suất danh nghĩa hàng năm)
  Lãi suất được ngân hàng/tổ chức tín dụng công bố chính thức trên hợp đồng vay.
  Đây là con số "trên giấy tờ", chưa tính các loại phí phát sinh đi kèm.

  ```

  Ví dụ: Hợp đồng ghi lãi suất 12%/năm
  → APR = 12%

  Lưu ý: APR thấp không có nghĩa là khoản vay rẻ,
  vì còn phải tính thêm phí (xem EAR bên dưới).

  ```

  ---

  ### 🏷️ FEE – Phí phát sinh
  Các khoản chi phí phụ thêm ngoài lãi suất mà người vay phải chịu.
  Ví dụ thực tế: phí thẩm định hồ sơ, phí bảo hiểm khoản vay, phí quản lý tài khoản, phí trả nợ trước hạn.

  ```

  Ví dụ:
  Phí thẩm định hồ sơ : 100.000 VND
  Phí bảo hiểm vay : 200.000 VND
  ─────────────────────────────────
  Tổng fees : 300.000 VND

  ```

  ---

  ### ✅ EAR – Effective Annual Rate (Lãi suất hiệu dụng hàng năm)
  Chi phí thực tế hàng năm của khoản vay, đã bao gồm cả lãi suất lẫn toàn bộ phí phát sinh.
  EAR luôn ≥ APR. EAR càng cao so với APR → khoản vay càng đắt hơn so với quảng cáo.

  ```

  Công thức:
  Lãi trong năm = Principal × (APR / 100)
  EAR (%) = (Lãi trong năm + Tổng fees) / Principal × 100

  Ví dụ 1 – Có phí:
  Principal = 10.000.000 VND
  APR = 12% → Lãi năm = 1.200.000 VND
  Fees = 300.000 VND
  EAR = (1.200.000 + 300.000) / 10.000.000 × 100 = 15%
  → Chi phí thực cao hơn 3% so với con số ngân hàng quảng cáo

  Ví dụ 2 – Không có phí:
  EAR = APR = 12%
  → Khi fees = 0, EAR bằng đúng APR

  Ví dụ 3 – Phí cao:
  Fees = 1.000.000 VND
  EAR = (1.200.000 + 1.000.000) / 10.000.000 × 100 = 22%
  → Phí cao có thể đẩy chi phí thực lên gần gấp đôi lãi suất công bố

  ```

  ---

  ### 📊 DTI – Debt-to-Income Ratio (Tỷ lệ nợ trên thu nhập)
  Thước đo mức độ gánh nặng nợ so với thu nhập hàng tháng.
  Ngân hàng dùng DTI để đánh giá khả năng trả nợ trước khi cho vay thêm.

  ```

  Công thức:
  DTI (%) = (Tổng tiền trả nợ tối thiểu mỗi tháng / Thu nhập tháng) × 100

  Ví dụ:
  Thu nhập tháng : 20.000.000 VND
  Nợ ACB – min_payment : 3.000.000 VND
  Nợ FE Credit – min_pay : 2.000.000 VND
  Nợ cá nhân – min_pay : 3.000.000 VND
  ─────────────────────────────────────────
  Tổng trả nợ tháng : 8.000.000 VND

      DTI = 8.000.000 / 20.000.000 × 100 = 40% → ⚠️ WARNING

  Phân loại mức độ rủi ro:
  Dưới 40% → 🟢 SAFE – Mức nợ lành mạnh
  40% – 50% → 🟡 WARNING – Cần theo dõi, hạn chế vay thêm
  Trên 50% → 🔴 DANGER – Rủi ro cao, cần xử lý ngay

  ```

  ---

  ### 💳 Min Payment – Thanh toán tối thiểu
  Số tiền nhỏ nhất bắt buộc phải trả mỗi kỳ theo hợp đồng để không bị phạt hoặc bị đánh dấu quá hạn.
  Trả đúng min_payment không có nghĩa là khoản nợ đang giảm nhanh, vì phần lớn có thể đang trả lãi.

  ```

  Ví dụ: Hợp đồng yêu cầu trả tối thiểu 2.000.000 VND/tháng
  → Trả đúng 2tr: hợp lệ, không bị phạt
  → Trả dưới 2tr: vi phạm hợp đồng, bị phạt trễ hạn
  → Trả nhiều hơn 2tr: hợp lệ, giảm nợ nhanh hơn

  ```

  ---

  ### 📉 Remaining Balance – Dư nợ còn lại
  Số tiền thực tế còn phải trả tính đến thời điểm hiện tại.
  Giảm dần mỗi lần ghi nhận thanh toán. Khi = 0 thì khoản nợ được đánh dấu PAID.

  ```

  Ví dụ:
  Vay gốc (Principal) : 50.000.000 VND
  Đã trả tháng 1 : 2.000.000 VND
  Đã trả tháng 2 : 3.000.000 VND
  ──────────────────────────────────────────
  Remaining Balance hiện tại: 45.000.000 VND

  ```

  ---

  ### 🏦 Avalanche & Snowball – Hai chiến lược trả nợ
  Hai phương pháp tối ưu hóa thứ tự trả nợ khi có nhiều khoản nợ cùng lúc.

  ```

  AVALANCHE: Tấn công khoản có EAR cao nhất trước
  Mục tiêu : Tiết kiệm tổng lãi phải trả (tối ưu về tài chính)
  Phù hợp : Người có kỷ luật tài chính cao

  SNOWBALL: Tấn công khoản có số dư nhỏ nhất trước
  Mục tiêu : Xóa sổ nhanh từng khoản nợ (tối ưu về tâm lý)
  Phù hợp : Người cần động lực, dễ nản chí

  ```

  ---

  ### 🌡️ Fear & Greed Index – Chỉ số tâm lý thị trường
  Thang đo từ 0–100 phản ánh cảm xúc tổng thể của nhà đầu tư trên thị trường tài chính.
  Nguồn dữ liệu: Alternative.me API (cập nhật hàng giờ).

  ```

  0 – 24 : Extreme Fear – Sợ hãi cực độ (thị trường bán tháo)
  25 – 44 : Fear – Sợ hãi (nhà đầu tư bi quan)
  45 – 55 : Neutral – Trung lập
  56 – 75 : Greed – Tham lam (thị trường lạc quan)
  76 – 100 : Extreme Greed – Tham lam cực độ (nguy cơ bong bóng)

  Ứng dụng trong FinSight:
  Fear zone (0–40) → Gợi ý tăng tài sản an toàn (vàng, trái phiếu)
  Greed zone (60+) → Gợi ý giảm cổ phiếu, tránh bong bóng

  ```

  ---

  ### 🔔 Notification Severity – Mức độ thông báo
  Hệ thống phân loại 4 mức độ nghiêm trọng của thông báo:

  ```

  INFO ⚪ – Thông tin tham khảo, không cần hành động ngay
  WARNING 🟡 – Cần chú ý, nên hành động sớm
  DANGER 🔴 – Nguy hiểm, cần hành động ngay
  CRITICAL 🚨 – Khẩn cấp, ảnh hưởng nghiêm trọng đến tài chính

  ```

  ---

  ### 🗑️ Soft Delete – Xóa mềm
  Kỹ thuật "xóa" dữ liệu mà không thực sự xóa khỏi cơ sở dữ liệu.
  Thay vào đó, ghi lại thời điểm xóa vào trường `deleted_at`.

  ```

  Xóa cứng (Hard Delete): DELETE FROM debts WHERE id = ?
  → Mất toàn bộ dữ liệu, không khôi phục được

  Xóa mềm (Soft Delete): UPDATE debts SET deleted_at = NOW() WHERE id = ?
  → Dữ liệu vẫn còn trong DB
  → Lịch sử thanh toán được giữ nguyên
  → Có thể khôi phục nếu cần
  → Query bình thường thêm: WHERE deleted_at IS NULL

  ```

  ---

  ### ⚙️ Cron Job – Tác vụ nền tự động
  Chương trình được lập lịch chạy tự động theo thời gian định sẵn, không cần người dùng thao tác.

  ```

  Ví dụ trong FinSight:
  08:00 mỗi ngày → Kiểm tra khoản nợ sắp đến hạn, quá hạn, DTI
  Mỗi giờ → Cập nhật chỉ số Fear & Greed từ API ngoài

  ```

  ---

  ## MỤC LỤC PHÂN TÍCH

  1. [Debt Management – Quản lý khoản nợ](#module-2)
  2. [Dashboard – Trang tổng quan](#module-3)
  3. [Financial Calculation – Tính toán tài chính (EAR & DTI)](#module-4)
  4. [Payment Tracking – Theo dõi thanh toán](#module-5)
  5. [Domino Risk – Cảnh báo rủi ro dây chuyền](#module-6)
  6. [Debt Strategy – Chiến lược trả nợ](#module-7)
  7. [Smart Notification – Thông báo thông minh](#module-8)
  8. [Financial Profile – Hồ sơ tài chính](#module-9)
  9. [Investment Advisory – Tư vấn đầu tư](#module-10)
  10. [Sơ đồ quan hệ tổng thể](#so-do-tong-the)
  11. [Bảng tóm tắt điểm demo](#tom-tat-demo)

  ---

  ## MODULE 2 – DEBT MANAGEMENT · Quản lý khoản nợ {#module-2}

  ### Vai trò trong hệ thống

  Đây là **module trung tâm** của toàn bộ FinSight. Hầu như mọi module khác đều đọc hoặc ghi vào bảng `debts`. Không có Debt Management thì Dashboard, EAR, DTI, Payment, Domino Risk, Strategy, Notification đều không hoạt động được.

  ---

  ### Cấu trúc dữ liệu (Bảng `debts`)

  ```

  ┌──────────────────┬─────────────┬─────────────────────────────────────┐
  │ Trường │ Nguồn │ Mô tả │
  ├──────────────────┼─────────────┼─────────────────────────────────────┤
  │ id │ Tự động │ UUID – Mã định danh duy nhất │
  │ user_id │ Tự động │ FK → users.id (lấy từ JWT token) │
  │ name │ User nhập │ Tên khoản nợ, VD: "Vay ngân hàng X" │
  │ principal │ User nhập │ Tiền vay gốc ban đầu (VND) │
  │ apr │ User nhập │ Lãi suất năm công bố (%) │
  │ fees │ User nhập │ Phí phát sinh, mặc định = 0 │
  │ due_date │ User nhập │ Ngày đến hạn thanh toán kỳ tiếp │
  │ min_payment │ User nhập │ Số tiền tối thiểu phải trả mỗi kỳ │
  │ remaining_balance│ Tự động │ Khởi tạo = principal, giảm dần │
  │ status │ Tự động │ ACTIVE → OVERDUE → PAID │
  │ ear │ Tự động │ Tính ngay sau khi lưu │
  │ created_at │ Tự động │ Thời điểm tạo │
  │ updated_at │ Tự động │ Cập nhật mỗi lần sửa đổi │
  │ deleted_at │ Tự động │ NULL = chưa xóa, có giá trị = đã xóa│
  └──────────────────┴─────────────┴─────────────────────────────────────┘

  ```

  ---

  ### Luồng: Thêm khoản nợ mới (2.1)

  ```

  [USER] Điền form khoản nợ
  │
  ▼
  [FRONTEND] Validate phía client:
  ✅ name – không được để trống
  ✅ principal – phải > 0
  ✅ apr – phải > 0
  ✅ due_date – không phải ngày trong quá khứ
  ✅ min_payment – phải > 0
  │
  ▼
  POST /api/debts
  Header: Authorization: Bearer [token]
  Body : { name, principal, apr, fees, due_date, min_payment }
  │
  ▼
  [BACKEND] Xác thực token → lấy user_id
  │
  ▼
  [BACKEND] Tạo record trong DB:
  remaining_balance = principal ← Dư nợ ban đầu bằng tiền vay gốc
  status = ACTIVE
  ear = null ← Chưa tính, sẽ tính ngay bước tiếp
  │
  ▼
  [BACKEND] Gọi module EAR tính toán:
  ear = (principal × apr/100 + fees) / principal × 100
  UPDATE debts SET ear = [kết quả]
  │
  ▼
  [BACKEND] Kích hoạt kiểm tra Domino Risk ngay lập tức
  (Vì thêm nợ mới có thể làm DTI tăng hoặc tăng số khoản đến hạn cùng lúc)
  │
  ▼
  201 Created: { toàn bộ thông tin khoản nợ + ear đã tính }

  ```

  ---

  ### Luồng: Cập nhật khoản nợ (2.4)

  ```

  [USER] Chỉnh sửa thông tin khoản nợ
  │
  ▼
  PUT /api/debts/:id
  │
  ▼
  Backend kiểm tra: khoản nợ này có thuộc user đang đăng nhập không?
  │
  ▼
  Có thay đổi principal, apr, hoặc fees?
  │
  ┌────┴────┐
  CÓ KHÔNG
  │ │
  ▼ ▼
  Tính lại Giữ nguyên
  EAR EAR
  │ │
  └─────┬─────┘
  ▼
  Lưu DB, updated_at = NOW()
  ▼
  200 OK: { debt object mới + ear mới nếu có }

  ```

  ---

  ### Luồng: Xóa khoản nợ – Soft Delete (2.5)

  ```

  DELETE /api/debts/:id
  │
  ▼
  KHÔNG chạy lệnh DELETE trong DB
  │
  ▼
  UPDATE debts SET deleted_at = NOW() WHERE id = ?
  │
  ▼
  Tất cả query bình thường: WHERE deleted_at IS NULL
  Lịch sử / báo cáo : Có thể truy vấn cả bản ghi đã xóa

  Tại sao dùng Soft Delete?
  → Bảng payments có debt_id trỏ đến bảng debts
  → Nếu xóa cứng khoản nợ, toàn bộ lịch sử thanh toán bị mồ côi
  → Dữ liệu tài chính quan trọng, cần giữ để đối chiếu

  ```

  ---

  ### Vòng đời trạng thái (Status Flow)

  ```

                     ┌─────────┐
      Tạo mới ──►   │ ACTIVE  │
                     └────┬────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
       Quá due_date          remaining_balance = 0
       chưa thanh toán       (trả hết nợ)
              │                       │
              ▼                       ▼
         ┌─────────┐            ┌──────────┐
         │ OVERDUE │            │   PAID   │
         └────┬────┘            └──────────┘
              │
              ▼
       Ghi nhận thanh
       toán, trả hết
              │
              ▼
         ┌──────────┐
         │   PAID   │
         └──────────┘

  ```

  ---

  ## MODULE 3 – DASHBOARD · Trang tổng quan {#module-3}

  ### Vai trò
  Trang chủ sau đăng nhập. Tổng hợp dữ liệu từ nhiều module thành một bức tranh tài chính toàn cảnh.

  ---

  ### Luồng tổng hợp dữ liệu

  ```

  GET /api/dashboard
  │
  ▼
  Query 1: Lấy tất cả khoản nợ ACTIVE của user
  SELECT \* FROM debts
  WHERE user_id = ?
  AND status = 'ACTIVE'
  AND deleted_at IS NULL
  │
  ▼
  Tính toán song song 4 chỉ số:

  ┌───────────────────────┬──────────────────────────────────────────┐
  │ Chỉ số │ Cách tính │
  ├───────────────────────┼──────────────────────────────────────────┤
  │ total*remaining* │ SUM(remaining_balance) của tất cả ACTIVE │
  │ balance │ │
  ├───────────────────────┼──────────────────────────────────────────┤
  │ total_min_payment │ SUM(min_payment) của tất cả ACTIVE │
  ├───────────────────────┼──────────────────────────────────────────┤
  │ avg_ear │ AVG(ear) của tất cả ACTIVE │
  ├───────────────────────┼──────────────────────────────────────────┤
  │ dti │ total_min_payment / monthly_income × 100 │
  │ │ (monthly_income lấy từ financial_profile)│
  └───────────────────────┴──────────────────────────────────────────┘

  Query 2: Lấy khoản nợ sắp đến hạn (trong 7 ngày tới)
  SELECT id, name, due_date, remaining_balance, min_payment
  FROM debts
  WHERE user_id = ?
  AND status = 'ACTIVE'
  AND due_date BETWEEN TODAY AND TODAY + 7
  ORDER BY due_date ASC
  │
  ▼
  Response trả về frontend:
  {
  total_remaining_balance : 75.000.000,
  total_min_payment : 8.000.000,
  dti: {
  value : 40,
  status : "WARNING"
  },
  avg_ear : 17.5,
  upcoming_debts: [
  { id, name: "FE Credit", due_date: "2025-06-17", remaining_balance: 15tr, min_payment: 1.5tr },
  { id, name: "Vay cá nhân", due_date: "2025-06-20", remaining_balance: 10tr, min_payment: 1tr }
  ]
  }

  ```

  ---

  ### Xử lý các trường hợp đặc biệt

  ```

  ┌──────────────────────────────────┬───────────────────────────────────────┐
  │ Tình huống │ Xử lý │
  ├──────────────────────────────────┼───────────────────────────────────────┤
  │ User chưa nhập thu nhập │ dti = null, kèm message: │
  │ trong Financial Profile │ "Vui lòng cập nhật hồ sơ tài chính" │
  ├──────────────────────────────────┼───────────────────────────────────────┤
  │ Không có khoản nợ nào │ Tất cả tổng = 0, upcoming_debts = [] │
  ├──────────────────────────────────┼───────────────────────────────────────┤
  │ Tất cả khoản nợ đã PAID │ total = 0, DTI = 0% → SAFE 🟢 │
  └──────────────────────────────────┴───────────────────────────────────────┘

  ```

  ---

  ## MODULE 4 – FINANCIAL CALCULATION · Tính toán tài chính {#module-4}

  ### 4.1 EAR – Lãi suất hiệu dụng

  #### Công thức

  ```

  Bước 1: Lãi trong năm = Principal × (APR / 100)
  Bước 2: EAR (%) = (Lãi trong năm + Fees) / Principal × 100

  ```

  #### Ba ví dụ so sánh

  ```

  ──────────────────────────────────────────────────────────────────
  Ví dụ 1: Khoản vay không có phí
  Principal = 10.000.000 | APR = 12% | Fees = 0
  EAR = (1.200.000 + 0) / 10.000.000 × 100 = 12%
  → EAR = APR: khoản vay minh bạch, không có chi phí ẩn
  ──────────────────────────────────────────────────────────────────
  Ví dụ 2: Khoản vay có phí nhỏ
  Principal = 10.000.000 | APR = 12% | Fees = 300.000
  EAR = (1.200.000 + 300.000) / 10.000.000 × 100 = 15%
  → EAR cao hơn APR 3%: chi phí thực cao hơn quảng cáo
  ──────────────────────────────────────────────────────────────────
  Ví dụ 3: Khoản vay có phí cao
  Principal = 10.000.000 | APR = 12% | Fees = 1.000.000
  EAR = (1.200.000 + 1.000.000) / 10.000.000 × 100 = 22%
  → EAR gần gấp đôi APR: phí ẩn rất lớn, cần cân nhắc kỹ
  ──────────────────────────────────────────────────────────────────

  ```

  #### Khi nào EAR được tính lại?

  ```

  ┌──────────────────────────────────┬──────────────────┐
  │ Sự kiện │ Hành động EAR │
  ├──────────────────────────────────┼──────────────────┤
  │ Tạo khoản nợ mới │ ✅ Tính ngay │
  │ Sửa Principal │ ✅ Tính lại │
  │ Sửa APR │ ✅ Tính lại │
  │ Sửa Fees │ ✅ Tính lại │
  │ Sửa name hoặc due_date │ ❌ Không tính lại│
  │ Ghi nhận thanh toán │ ❌ Không tính lại│
  └──────────────────────────────────┴──────────────────┘

  EAR được dùng ở đâu?
  → Dashboard : Hiển thị avg_ear (lãi suất trung bình toàn danh mục)
  → Strategy : Sắp xếp thứ tự ưu tiên theo chiến lược Avalanche

  ```

  ---

  ### 4.2 DTI – Tỷ lệ nợ trên thu nhập

  #### Công thức

  ```

  Bước 1: Tổng trả nợ tháng = SUM(min_payment) của tất cả khoản nợ ACTIVE
  Bước 2: DTI (%) = (Tổng trả nợ tháng / monthly_income) × 100
  monthly_income lấy từ bảng financial_profiles

  ```

  #### Ví dụ thực tế

  ```

  Thu nhập tháng : 20.000.000 VND

  Khoản nợ 1 – Ngân hàng ACB : min_payment = 3.000.000 VND
  Khoản nợ 2 – Tín dụng FE : min_payment = 2.000.000 VND
  Khoản nợ 3 – Vay cá nhân : min_payment = 3.000.000 VND
  ──────────────────────────
  Tổng trả nợ tháng : 8.000.000 VND

  DTI = 8.000.000 / 20.000.000 × 100 = 40% → 🟡 WARNING

  ```

  #### Bảng phân loại mức độ rủi ro

  ```

  ┌──────────────┬──────────┬───────────┬────────────────────────────────────┐
  │ Khoảng DTI │ Trạng thái│ Màu hiển │ Ý nghĩa thực tế │
  ├──────────────┼──────────┼───────────┼────────────────────────────────────┤
  │ Dưới 40% │ SAFE │ 🟢 Xanh │ Nợ lành mạnh, còn dư địa vay thêm │
  │ 40% – 50% │ WARNING │ 🟡 Vàng │ Cần theo dõi, hạn chế vay thêm │
  │ Trên 50% │ DANGER │ 🔴 Đỏ │ Rủi ro mất khả năng thanh toán │
  └──────────────┴──────────┴───────────┴────────────────────────────────────┘

  ```

  #### DTI được tính lại khi nào?

  ```

  ✅ Mỗi lần mở Dashboard
  ✅ Khi thêm khoản nợ mới (tăng tổng min_payment)
  ✅ Khi sửa min_payment của một khoản nợ
  ✅ Khi khoản nợ chuyển sang PAID (giảm tổng min_payment)
  ✅ Khi user cập nhật monthly_income trong Financial Profile

  ```

  ---

  ## MODULE 5 – PAYMENT TRACKING · Theo dõi thanh toán {#module-5}

  ### Vai trò
  Ghi nhận mỗi lần trả tiền của user, cập nhật dư nợ và lưu lịch sử giao dịch.

  ---

  ### Luồng ghi nhận thanh toán

  ```

  [USER] Chọn khoản nợ → Nhập số tiền trả + ghi chú
  │
  ▼
  POST /api/debts/:id/payments
  Body: { amount: 2.000.000, note: "Trả kỳ tháng 6" }
  │
  ▼
  [BACKEND] Validate:
  ✅ amount > 0
  ✅ Khoản nợ thuộc về user này (kiểm tra qua JWT)
  ✅ Khoản nợ đang ở trạng thái ACTIVE (không cho trả nợ đã PAID)
  │
  ▼
  [BACKEND] Tạo bản ghi trong bảng payments:
  {
  id : [UUID mới],
  debt_id : [id khoản nợ],
  user_id : [id user],
  amount : 2.000.000,
  paid_at : NOW(),
  note : "Trả kỳ tháng 6"
  }
  │
  ▼
  [BACKEND] Tính lại dư nợ:
  remaining_balance_mới = remaining_balance_cũ - amount

           remaining_balance_mới ≤ 0?
                │
           ┌────┴────┐
          CÓ        KHÔNG
           │           │
           ▼           ▼
      remaining = 0   remaining = remaining_balance_mới
      status = PAID   status giữ nguyên ACTIVE
           │           │
           └─────┬─────┘
                 ▼
      UPDATE debts SET
        remaining_balance = ?,
        status = ?,
        updated_at = NOW()
                 │
                 ▼
      Kiểm tra Domino Risk ngay lập tức
      (nếu paid_at > due_date → ghi nhận lịch sử trả trễ → kích hoạt ĐK3)
                 │
                 ▼
      201 Created: { payment record mới + debt đã cập nhật }

  ```

  ---

  ### Xử lý các trường hợp đặc biệt

  ```

  ┌────────────────────────────────┬──────────────────────────────────────────┐
  │ Tình huống │ Cách xử lý │
  ├────────────────────────────────┼──────────────────────────────────────────┤
  │ Trả nhiều hơn dư nợ còn lại │ remaining = 0, status = PAID │
  │ VD: còn 500k mà trả 1tr │ Không hoàn lại phần dư │
  ├────────────────────────────────┼──────────────────────────────────────────┤
  │ Trả đúng bằng dư nợ │ remaining = 0, status = PAID │
  ├────────────────────────────────┼──────────────────────────────────────────┤
  │ Trả ít hơn min_payment │ Cho phép, nhưng UI nên hiển thị cảnh báo │
  │ VD: trả 500k thay vì 2tr │ "Số tiền thấp hơn mức tối thiểu" │
  ├────────────────────────────────┼──────────────────────────────────────────┤
  │ Khoản nợ đã PAID │ Từ chối (400 Bad Request) │
  ├────────────────────────────────┼──────────────────────────────────────────┤
  │ paid_at > due_date │ Đánh dấu trả trễ → kích hoạt Domino Risk │
  └────────────────────────────────┴──────────────────────────────────────────┘

  ```

  ---

  ### Minh họa lịch sử thanh toán

  ```

  GET /api/debts/:id/payments
  Sắp xếp: mới nhất lên đầu

  Response:
  [
  { amount: 2.000.000, paid_at: "2025-06-15", note: "Trả kỳ tháng 6" },
  { amount: 2.000.000, paid_at: "2025-05-14", note: "Trả kỳ tháng 5" },
  { amount: 3.000.000, paid_at: "2025-04-10", note: "Trả thêm tháng 4" },
  ]

  remaining_balance ban đầu : 50.000.000
  Sau tháng 4 : 47.000.000 (trả 3tr)
  Sau tháng 5 : 45.000.000 (trả 2tr)
  Sau tháng 6 : 43.000.000 (trả 2tr)

  ```

  ---

  ## MODULE 6 – DOMINO RISK · Cảnh báo rủi ro dây chuyền {#module-6}

  ### Khái niệm
  "Rủi ro dây chuyền" là tình trạng không trả được khoản nợ A dẫn đến không trả được khoản nợ B, C, D... – giống như quân domino đổ hàng loạt.

  ---

  ### Ba điều kiện kích hoạt (chỉ cần 1 trong 3)

  ```

  ┌────────────────────────────────────────────────────────────────┐
  │ ĐIỀU KIỆN 1: Nhiều khoản đến hạn cùng lúc │
  │ │
  │ SELECT COUNT(_) FROM debts │
  │ WHERE user_id = ? │
  │ AND status = 'ACTIVE' │
  │ AND due_date BETWEEN TODAY AND TODAY + 7 │
  │ │
  │ Kết quả ≥ 2 → ✅ TRIGGER │
  │ │
  │ Lý do: Áp lực thanh toán tập trung trong thời gian ngắn, │
  │ nếu thiếu tiền một khoản sẽ kéo theo các khoản khác │
  ├────────────────────────────────────────────────────────────────┤
  │ ĐIỀU KIỆN 2: DTI vượt ngưỡng nguy hiểm │
  │ │
  │ dti_value ≥ 40% → ✅ TRIGGER │
  │ │
  │ Lý do: Gánh nặng nợ đã vượt mức an toàn, thu nhập không │
  │ còn dư địa để xử lý bất ngờ tài chính │
  ├────────────────────────────────────────────────────────────────┤
  │ ĐIỀU KIỆN 3: Có lịch sử trả trễ │
  │ │
  │ SELECT COUNT(_) FROM payments p │
  │ JOIN debts d ON p.debt_id = d.id │
  │ WHERE p.user_id = ? │
  │ AND p.paid_at > d.due_date │
  │ │
  │ Kết quả ≥ 1 → ✅ TRIGGER │
  │ │
  │ Lý do: Đã từng trả trễ là dấu hiệu mất kiểm soát dòng tiền │
  └────────────────────────────────────────────────────────────────┘

  ```

  ---

  ### Hai thời điểm kiểm tra

  ```

  1. ĐỊNH KỲ – Cron job 08:00 mỗi ngày
     → Quét toàn bộ user có khoản nợ ACTIVE
     → Phù hợp cho: theo dõi liên tục, cảnh báo sớm

  2. TỨC THỜI – Kích hoạt ngay khi:
     → User thêm khoản nợ mới (có thể đạt ngưỡng ĐK1 hoặc ĐK2)
     → User ghi nhận thanh toán trễ (kích hoạt ĐK3)

  ```

  ---

  ### Nội dung cảnh báo & vị trí hiển thị

  ```

  Vị trí: Nổi bật trên Dashboard (banner hoặc card đỏ ở đầu trang)
  Loại : Notification type = DOMINO_RISK, severity = WARNING

  Nội dung mẫu:
  ┌──────────────────────────────────────────────────────────────┐
  │ 🚨 CẢNH BÁO RỦI RO DÂY CHUYỀN │
  │ │
  │ Bạn có 3 khoản nợ đến hạn trong 7 ngày tới với │
  │ tổng DTI 47%. Hãy ưu tiên cân đối dòng tiền ngay │
  │ hôm nay. │
  │ │
  │ [Xem chi tiết các khoản nợ] │
  └──────────────────────────────────────────────────────────────┘

  ```

  ---

  ## MODULE 7 – DEBT STRATEGY · Chiến lược trả nợ {#module-7}

  ### Đầu vào

  ```

  GET /api/strategy?extra_payment=3000000

  extra_payment = 3.000.000 VND/tháng
  Đây là số tiền user có thể trả THÊM mỗi tháng,
  ngoài khoản tối thiểu (min_payment) đã bắt buộc.

  ```

  ---

  ### 7.1 Chiến lược AVALANCHE – Trả lãi cao nhất trước

  **Nguyên tắc:** Dồn tiền extra vào khoản nợ có EAR cao nhất trước.

  ```

  Danh sách nợ – Sắp theo EAR giảm dần:
  ┌───────────────┬─────────────────┬─────────┬─────────────┐
  │ Khoản nợ │ Số dư còn lại │ EAR │ min_payment │
  ├───────────────┼─────────────────┼─────────┼─────────────┤
  │ FE Credit │ 15.000.000 VND │ 25% │ 1.500.000 │ ← TẤN CÔNG TRƯỚC
  │ ACB │ 50.000.000 VND │ 15% │ 2.000.000 │
  │ Vay cá nhân │ 10.000.000 VND │ 10% │ 1.000.000 │
  └───────────────┴─────────────────┴─────────┴─────────────┘

  Tháng 1 đến hết FE Credit:
  FE Credit : 1.500.000 (min) + 3.000.000 (extra) = 4.500.000/tháng
  ACB : 2.000.000 (min)
  Vay cá nhân: 1.000.000 (min)
  FE Credit trả hết sau ≈ 4 tháng ✅

  Sau khi FE Credit hết → chuyển toàn bộ sang ACB:
  ACB : 2.000.000 + 1.500.000 (freed FE) + 3.000.000 (extra) = 6.500.000/tháng

  Kết quả: Tiết kiệm nhiều nhất tổng lãi phải trả

  ```

  ---

  ### 7.2 Chiến lược SNOWBALL – Trả khoản nhỏ nhất trước

  **Nguyên tắc:** Dồn tiền extra vào khoản nợ có số dư nhỏ nhất trước.

  ```

  Danh sách nợ – Sắp theo số dư tăng dần:
  ┌───────────────┬─────────────────┬─────────┬─────────────┐
  │ Khoản nợ │ Số dư còn lại │ EAR │ min_payment │
  ├───────────────┼─────────────────┼─────────┼─────────────┤
  │ Vay cá nhân │ 10.000.000 VND │ 10% │ 1.000.000 │ ← TẤN CÔNG TRƯỚC
  │ FE Credit │ 15.000.000 VND │ 25% │ 1.500.000 │
  │ ACB │ 50.000.000 VND │ 15% │ 2.000.000 │
  └───────────────┴─────────────────┴─────────┴─────────────┘

  Tháng 1 đến hết Vay cá nhân:
  Vay cá nhân: 1.000.000 (min) + 3.000.000 (extra) = 4.000.000/tháng
  FE Credit : 1.500.000 (min)
  ACB : 2.000.000 (min)
  Vay cá nhân trả hết sau ≈ 3 tháng ✅ TÂM LÝ: Xóa được 1 khoản nợ!

  Sau khi Vay cá nhân hết → chuyển sang FE Credit:
  FE Credit : 1.500.000 + 1.000.000 (freed) + 3.000.000 (extra) = 5.500.000/tháng

  Kết quả: Xóa nhiều khoản nợ nhanh hơn, tạo động lực
  nhưng tổng lãi phải trả CAO HƠN so với Avalanche

  ```

  ---

  ### 7.3 Bảng so sánh output

  ```

  Response của GET /api/strategy?extra_payment=3000000:

  ┌────────────────────┬─────────────────────────┬──────────────────────────┐
  │ Chỉ số │ Avalanche │ Snowball │
  ├────────────────────┼─────────────────────────┼──────────────────────────┤
  │ Thứ tự ưu tiên │ FE (25%) → ACB (15%) │ Cá nhân (10tr) → │
  │ │ → Cá nhân (10%) │ FE (15tr) → ACB (50tr) │
  ├────────────────────┼─────────────────────────┼──────────────────────────┤
  │ Tổng lãi phải trả │ 8.500.000 VND │ 11.200.000 VND │
  ├────────────────────┼─────────────────────────┼──────────────────────────┤
  │ Thời gian trả hết │ 28 tháng │ 30 tháng │
  ├────────────────────┼─────────────────────────┼──────────────────────────┤
  │ Lãi tiết kiệm được │ ────────────────────── │ Mất thêm 2.700.000 VND │
  ├────────────────────┼─────────────────────────┼──────────────────────────┤
  │ Ưu điểm │ Tối ưu tài chính tuyệt │ Tâm lý tốt, ít khoản │
  │ │ đối, tiết kiệm lãi nhiều│ nợ nhanh, dễ duy trì │
  └────────────────────┴─────────────────────────┴──────────────────────────┘

  Gợi ý hiển thị:
  "Avalanche giúp bạn tiết kiệm 2.700.000 VND tiền lãi
  và trả hết nợ sớm hơn 2 tháng so với Snowball."

  ```

  ---

  ## MODULE 8 – SMART NOTIFICATION · Thông báo thông minh {#module-8}

  ### 8.1 Cron Job 08:00 sáng – Luồng xử lý

  ```

  [CRON 08:00 mỗi ngày]
  │
  ▼
  Lấy danh sách user có khoản nợ ACTIVE:
  SELECT DISTINCT user_id FROM debts
  WHERE status = 'ACTIVE' AND deleted_at IS NULL
  │
  ▼
  FOR EACH user → Kiểm tra 4 điều kiện:

  ┌─────────────────────────────────────────────────────────────┐
  │ CHECK 1: Khoản nào sắp đến hạn trong 3 ngày? │
  │ due_date BETWEEN TODAY AND TODAY + 3 │
  │ → Tạo DEBT_DUE_SOON (severity: WARNING) cho từng khoản │
  │ Nội dung: "Khoản [tên] sẽ đến hạn sau [N] ngày" │
  ├─────────────────────────────────────────────────────────────┤
  │ CHECK 2: Khoản nào đã quá hạn chưa trả? │
  │ due_date < TODAY AND status = 'ACTIVE' │
  │ → UPDATE status = 'OVERDUE' │
  │ → Tạo DEBT_OVERDUE (severity: DANGER) │
  │ Nội dung: "Khoản [tên] đã quá hạn [N] ngày" │
  ├─────────────────────────────────────────────────────────────┤
  │ CHECK 3: DTI > 50%? │
  │ → Tạo DTI_CRITICAL (severity: CRITICAL) │
  │ Nội dung: "Tỷ lệ nợ đang ở mức nguy hiểm ([DTI]%)" │
  ├─────────────────────────────────────────────────────────────┤
  │ CHECK 4: Thỏa điều kiện Domino Risk? │
  │ → Tạo DOMINO_RISK (severity: WARNING) │
  └─────────────────────────────────────────────────────────────┘
  │
  ▼
  INSERT INTO notifications (user_id, type, severity, title, body, ...)

  ```

  ---

  ### 8.2 Giao diện hiển thị thông báo

  ```

  Thanh điều hướng:
  FinSight 🔔 3 ← Badge = số chưa đọc
  │
  ▼ (Nhấn vào)
  ┌──────────────────────────────────────┐
  │ Thông báo [Đọc tất]│
  ├──────────────────────────────────────┤
  │ 🚨 KHẨN CẤP 2 phút trước│
  │ DTI đang ở mức nguy hiểm (52%) │
  │ │
  ├──────────────────────────────────────┤
  │ 🟡 CẢNH BÁO 1 giờ trước│
  │ "FE Credit" đến hạn sau 2 ngày │
  │ [→ Xem] │
  ├──────────────────────────────────────┤
  │ 🔴 NGUY HIỂM Hôm qua │
  │ "Vay cá nhân" đã quá hạn 1 ngày │
  │ [→ Xem] │
  └──────────────────────────────────────┘

  Nhấn vào thông báo:
  → Đánh dấu is_read = true
  → Chuyển đến trang chi tiết khoản nợ liên quan (nếu có related_debt_id)

  ```

  ---

  ### Bảng màu sắc theo mức độ

  ```

  ┌──────────────┬────────────┬─────────────────────────────────────────┐
  │ Severity │ Màu sắc │ Loại thông báo sử dụng │
  ├──────────────┼────────────┼─────────────────────────────────────────┤
  │ INFO │ ⚪ Xám │ Thông tin thông thường │
  │ WARNING │ 🟡 Vàng │ DEBT_DUE_SOON, DOMINO_RISK │
  │ DANGER │ 🔴 Đỏ │ DEBT_OVERDUE, MARKET_ALERT │
  │ CRITICAL │ 🚨 Đỏ đậm │ DTI_CRITICAL │
  └──────────────┴────────────┴─────────────────────────────────────────┘

  ```

  ---

  ## MODULE 9 – FINANCIAL PROFILE · Hồ sơ tài chính {#module-9}

  ### Vai trò trong hệ thống

  ```

  financial_profiles
  │
  ├──► monthly_income ─────► Tính DTI (Module 4.2)
  │ ─────► Hiển thị DTI trên Dashboard
  │
  ├──► capital ────────────► Investment Advisory (Module 10)
  │ (Tính tỷ lệ phân bổ trên tổng vốn)
  │
  └──► risk_level ─────────► Investment Advisory (logic gợi ý)
  ─────► Market Alert (lọc user nhận cảnh báo)

  ```

  ---

  ### Quan hệ 1-1 với tài khoản

  ```

  users (1) ─────────────────── (1) financial_profiles

  Khi user mới đăng ký : financial_profile CHƯA tồn tại → DTI = null
  Lần đầu cập nhật : INSERT record mới
  Các lần sau : UPDATE record hiện tại

  Hệ quả: Nếu user chưa điền thu nhập → DTI không tính được
  → Dashboard hiển thị nhắc nhở

  ```

  ---

  ### Tác động khi cập nhật

  ```

  PUT /api/profile/financial
  Body: { monthly_income: 25.000.000, capital: 50.000.000, risk_level: "MEDIUM" }
  │
  ▼
  Lưu vào DB (updated_at = NOW())
  │
  ▼
  DTI tính lại tự động với monthly_income mới
  │
  ▼
  Advisory sẽ cho kết quả mới ở lần gọi tiếp theo
  │
  ▼
  Nếu DTI vượt ngưỡng sau khi cập nhật thu nhập → Cron đêm sẽ thông báo

  ```

  ---

  ## MODULE 10 – INVESTMENT ADVISORY · Tư vấn đầu tư {#module-10}

  ### Dữ liệu đầu vào – Ba nguồn kết hợp

  ```

  ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
  │ Financial Profile │ │ DTI hiện tại │ │ Fear & Greed Index │
  │ ───────────────── │ │ ───────────────── │ │ ───────────────── │
  │ risk_level: │ │ Tính real-time từ │ │ Lấy từ DB cache │
  │ LOW/MEDIUM/HIGH │ │ debts + income │ │ (cập nhật mỗi giờ) │
  │ capital: [số tiền] │ │ → SAFE/WARNING/ │ │ Nguồn: │
  │ │ │ DANGER │ │ alternative.me API │
  └──────────────────────┘ └──────────────────────┘ └──────────────────────┘
  │ │ │
  └────────────────────────┼──────────────────────────┘
  ▼
  RULE ENGINE

  ```

  ---

  ### Rule Engine – Logic gợi ý chi tiết

  ```

  Rule 1: DTI = DANGER (> 50%)
  Ưu tiên trả nợ, TẠM DỪNG đầu tư mới
  Phân bổ: { saving: 60%, bond: 30%, stock: 10%, crypto: 0%, gold: 0% }
  Lý do : Đầu tư khi nợ quá nhiều = rủi ro nhân đôi

  Rule 2: risk_level = LOW
  Giảm cổ phiếu & crypto, tăng tiết kiệm & trái phiếu
  Phân bổ: { saving: 40%, bond: 30%, stock: 20%, crypto: 0%, gold: 10% }

  Rule 3: Fear & Greed = 0–40 (Fear zone)
  Tăng tài sản an toàn: vàng, tiết kiệm, trái phiếu
  Lý do: Thị trường đang hoảng loạn, rủi ro cao, nên phòng thủ

  Rule 4: Fear & Greed = 60–100 (Greed zone)
  Giảm tỷ trọng cổ phiếu
  Lý do: Thị trường quá lạc quan → nguy cơ bong bóng, cần cảnh giác

  Rule 5: DTI = SAFE + risk_level = HIGH
  Có thể tăng tỷ trọng cổ phiếu & crypto
  Lý do: Nợ ổn định, thu nhập dư địa, chấp nhận rủi ro cao

  ```

  ---

  ### Ví dụ tổ hợp thực tế

  ```

  Ví dụ 1 – User thận trọng, nợ nhiều:
  DTI = DANGER (55%) + risk = LOW + Fear&Greed = 30 (Fear)
  → Rule 1 kích hoạt: Tạm dừng đầu tư, ưu tiên trả nợ
  Phân bổ: { saving: 70%, bond: 25%, stock: 5%, crypto: 0%, gold: 0% }

  Ví dụ 2 – User cân bằng, thị trường ổn:
  DTI = SAFE (30%) + risk = MEDIUM + Fear&Greed = 50 (Neutral)
  → Không có rule đặc biệt, dùng phân bổ cân bằng
  Phân bổ: { saving: 30%, bond: 20%, stock: 35%, crypto: 5%, gold: 10% }

  Ví dụ 3 – User mạo hiểm, nợ ổn, thị trường sợ hãi:
  DTI = SAFE (25%) + risk = HIGH + Fear&Greed = 35 (Fear)
  → Rule 3 + Rule 5 cùng hoạt động
  → Tăng tài sản an toàn nhưng vẫn giữ tỷ trọng cổ phiếu nhất định
  Phân bổ: { saving: 25%, bond: 25%, stock: 25%, crypto: 10%, gold: 15% }

  ```

  ---

  ### Output mẫu

  ```

  GET /api/advisory

  Response:
  {
  "allocation": {
  "saving" : 30, // 30% vốn → 15.000.000 VND (nếu capital = 50tr)
  "bond" : 20, // 20% vốn → 10.000.000 VND
  "stock" : 35, // 35% vốn → 17.500.000 VND
  "crypto" : 5, // 5% vốn → 2.500.000 VND
  "gold" : 10 // 10% vốn → 5.000.000 VND
  },
  "reason": "DTI của bạn đang ở mức an toàn (30%). Chỉ số Fear & Greed
  đang ở vùng Neutral (50). Với mức rủi ro MEDIUM, bạn có thể
  duy trì tỷ trọng cổ phiếu ở mức vừa phải."
  }

  ```

  ---

  ## SƠ ĐỒ QUAN HỆ TỔNG THỂ {#so-do-tong-the}

  ```

                             ┌──────────────────────┐
                             │   Financial Profile  │
                             │  monthly_income      │
                             │  capital             │
                             │  risk_level          │
                             └───────────┬──────────┘
                                         │ cung cấp dữ liệu
                   ┌─────────────────────┼───────────────────────┐
                   │                     │                       │
                   ▼                     ▼                       ▼
            ┌─────────────┐    ┌──────────────────┐   ┌──────────────────────┐
            │  DTI Calc   │    │    Dashboard     │   │ Investment Advisory  │
            │  (Module 4) │    │   (Module 3)     │   │    (Module 10)       │
            └──────┬──────┘    └────────┬─────────┘   └──────────┬───────────┘
                   │                   │                         │
                   │            ┌──────┘                         │
                   ▼            ▼                                │
           ┌───────────────────────────┐                         │
           │      Debt Management     │              ┌───────────┴──────────┐
           │       (Module 2)         │              │   Market Sentiment   │
           │  CRUD khoản nợ           │              │     (Module 11)      │
           │  status: ACTIVE/PAID/    │              │  Fear & Greed Index  │
           │          OVERDUE         │              └──────────────────────┘
           └────────────┬─────────────┘                         │
                        │                                        ▼
              ┌─────────┼───────────────┐             ┌──────────────────────┐
              │         │               │             │    Market Alert      │
              ▼         ▼               ▼             │     (Module 12)      │
       ┌──────────┐ ┌──────────┐ ┌──────────────┐    └──────────────────────┘
       │ EAR Calc │ │ Payment  │ │ Domino Risk  │
       │(Module 4)│ │ Tracking │ │  (Module 6)  │
       └──────────┘ │(Module 5)│ └──────┬───────┘
                    └──────────┘        │
                                        ▼
                               ┌──────────────────┐
                               │ Smart Notif.     │
                               │  (Module 8)      │
                               │  Cron 08:00      │
                               │  Badge + In-app  │
                               └──────────────────┘
                                        │
                               ┌────────┘
                               ▼
                      ┌──────────────────┐
                      │  Debt Strategy   │
                      │   (Module 7)     │
                      │  Avalanche &     │
                      │  Snowball        │
                      └──────────────────┘

  ```

  ---

  ### Luồng dữ liệu theo thứ tự Sprint

  ```

  Sprint 1: Financial Profile ──► Cung cấp monthly_income
  ──► Không có → DTI = null

  Sprint 2: Debt Management ──► Tạo khoản nợ
  │ ──► EAR tính tự động
  ▼
  DTI = SUM(min_payment) / monthly_income

  Sprint 3: Dashboard ──► Tổng hợp: total_balance, DTI, avg_ear
  Payment Tracking ──► Ghi nhận thanh toán, cập nhật remaining_balance

  Sprint 4: Notifications ──► Cron 08:00: DEBT_DUE_SOON, OVERDUE, DTI_CRITICAL
  Domino Risk ──► Real-time + Cron: kiểm tra 3 điều kiện

  Sprint 5: Debt Strategy ──► Avalanche & Snowball dựa trên EAR và remaining_balance

  Sprint 6: Market Sentiment ──► Cron mỗi giờ: cập nhật Fear & Greed
  Advisory ──► Kết hợp Profile + DTI + Fear&Greed

  ```

  ---

  ## BẢNG TÓM TẮT ĐIỂM QUAN TRỌNG ĐỂ DEMO {#tom-tat-demo}

  | # | Điểm cần nhấn mạnh | Module | Lý do quan trọng |
  |---|---|---|---|
  | 1 | `remaining_balance` tự động giảm khi ghi thanh toán | 5 | Theo dõi dư nợ real-time |
  | 2 | EAR tính lại tự động khi sửa principal / apr / fees | 4.1 | Phản ánh đúng chi phí thực |
  | 3 | DTI là cầu nối sống giữa Debt và Financial Profile | 4.2 | Trung tâm đánh giá sức khỏe tài chính |
  | 4 | Soft delete giữ toàn vẹn lịch sử thanh toán | 2.5 | Không bao giờ mất dữ liệu tài chính |
  | 5 | Domino Risk trigger cả real-time lẫn cron | 6 | Cảnh báo sớm, không bỏ sót |
  | 6 | Avalanche tiết kiệm lãi, Snowball tốt cho tâm lý | 7 | User tự chọn phù hợp với bản thân |
  | 7 | Advisory kết hợp 3 nguồn: Profile + DTI + Market | 10 | Gợi ý cá nhân hóa, không one-size-fits-all |
  | 8 | Cron 08:00 sáng là "trái tim" của hệ thống cảnh báo | 8 | Tự động hóa hoàn toàn, không cần user thao tác |
  | 9 | status khoản nợ tự chuyển ACTIVE → OVERDUE → PAID | 2 | Vòng đời nợ minh bạch, nhất quán |
  | 10 | Advisory KHÔNG cache, tính real-time mỗi lần gọi | 10 | Luôn phản ánh tình trạng mới nhất |

  ---

  *Tài liệu được tạo từ FinSight_Feature_Specification.md · Phiên bản phân tích sâu cho team demo*

  ```

- Danh sách chức năng

  | **STT** | **Tên chức năng** | **Mô tả ngắn** | **Tình trạng (Đã hoàn thành, Đang thực hiện,**
  **…)** | **Demo** |
  | --- | --- | --- | --- | --- |
  | 1 | Xác thực người dùng | Đăng ký, đăng nhập bằng email, JWT, bảo mật tài khoản | Xong | |
  | 2 | Quản lý khoản nợ | Thêm, sửa, xóa, xem các khoản nợ | Xong | |
  | 3 | Dashboard tài chính | Hiển thị tổng nợ, DTI, EAR, lịch thanh toán | Rồi (chưa validate các trường nhập liệu) | |
  | 4 | Tính toán EAR | Tính lãi suất thực tế bao gồm phí ẩn | Đã xong | |
  | 5 | Ghi nhận thanh toán | Cập nhật tiến độ trả nợ và lịch sử | Đã xong | |
  | 6 | Domino Risk | Phát hiện rủi ro vỡ nợ | Chưa có cảnh báo | |
  | 7 | Tối ưu trả nợ | Avalanche và Snowball | Xong | |
  | 8 | Smart Notification | Cảnh báo 2 tầng Cron + In-app | Chưa có | |
  | 9 | Hồ sơ tài chính | Nhập thông tin thu nhập, vốn, mục tiêu | Đã xong (Còn thiếu khả năng trả nợ ) | |
  | 10 | Cố vấn đầu tư | Gợi ý danh mục đầu tư cá nhân hóa | Chưa có | |
  | 11 | Market Sentiment | Phân tích tâm lý thị trường | Cơ bản | |
  | 12 | OCR | Trích xuất dữ liệu từ ảnh | Chưa có | |
  | 13 | Market Alert |

   
  Cảnh báo biến động thị trường
  | Chưa có | |
  | 14 | AI Chatbot | Nhập liệu nợ bằng hội thoại | Đang phát triển | |

  ![image.png](attachment:7d2aada6-5121-4b2a-b718-1d0580e7faf3:image.png)

  ⇒ Trải nghiệm nhập khó chịu

  ![image.png](attachment:e01d7d12-d567-473c-a0d0-4b6574f3d2f5:image.png)
  - [ ] Đề xuất thêm trang cộng đồng
  - [ ] Đề xuất thêm tính năng đó là có các gói nâng cấp
  - [ ] Đề xuất thêm đó là có một trang chia sẻ kiến thức
  - [ ] Đề xuất thêm có trang Q&A

  ⇒ cho nhập đi bị limit 5 triệu

### Task nâng cấp ứng dụng giúp hay hơn trong demo

![image.png](attachment:0e7c4c93-e797-4db1-9cda-a83eec1efe36:image.png)

⇒ Tính năng đáo hạn nợ nó chưa rõ ràng. Ví dụ hôm nay là ngày 4 đi mà ngày đáo hạn á để là ngày 15 thì ứng dụng không có hiện, chưa có rõ logic về ngày đáo hạn á các pro ơi

![image.png](attachment:4bd886ae-bb4b-4a27-b7ff-e05ac37c32a3:image.png)

⇒ Tính năng chat liên hồi chưa đồng nhất

Một tính năng nữa là Email nha, chưa hiểu nó test sao

### Task ✅

- [x] Tổng hợp docs
- [x] Đọc, phân tích docs → Kiến trúc tổng thể
- [x] Kiểm tra src dự án
- [x] Src chưa tuân theo cấu trúc thư mục → Cải thiện
- [x] Kiểm tra các API
- [x] Sửa lặt vặt còn thiếu các tính năng: Hướng dẫn sửa: Viết plan → Đọc để xem nó xác nhận đúng không → Kêu nó thực hiện
- [x] Thiếu tính năng thông báo qua Email

  ![image.png](attachment:fa4cd403-9a20-4829-a308-5bc34726ddd7:image.png)

  ![image.png](attachment:f0ac7b66-8f1d-4dc0-9f21-50ced3ae0307:image.png)

- [x] Lỗi nhập liệu 0
- [x] Ấn vào logo bên trái trả về landing page
- [x] Thêm chỉ số DTI

![image.png](attachment:4869a6aa-1841-4474-ae38-e40dd140f0e2:image.png)

- [x] Sáng một vùng thôi

![image.png](attachment:395e8a66-0cc4-4c4f-83be-5597ee999a23:image.png)

- [x] Đề xuất là cho nhập liệu thay vì kéo thả

![image.png](attachment:47ff42c9-ab1b-4338-8606-96a8db937b92:image.png)

- [x] Lỗi giao diện kéo thả toàn bộ luôn, chỗ nào có kéo thả đều bị lỗi trong màn hình đen

![image.png](attachment:983d19ef-0722-45af-a4dd-ccad30d66719:image.png)

![image.png](attachment:a4c1c57c-5f5c-47bc-bef5-96a3d9df2e5d:image.png)

- [x] Lỗi hiển thị khoản nợ, mấy cái tiêu đề đều bị lỗi tương phản

![image.png](attachment:622b32e9-22e1-423a-bec3-84f587c10ec5:image.png)

- [x] Nút thêm trò chuyện đẹp hơn được hong

![image.png](attachment:48aede61-c3e5-45c7-b8f4-1db220cf634a:image.png)

- [x] Trong trang web tab Hồ sơ đang thiếu thời hạn đầu tư; Khẩu vị rủi ro. Chưa thấy mối liên kết giữa đánh giá rủi ro và khẩu vị rủi ro đang thiếu

![image.png](attachment:3a1d4432-fcd9-4fbb-bd82-745655064111:image.png)

- [x] Trong ứng dụng còn thiếu chỉ số lãi sốt, tỷ giá, CPI → Đề xuất dựa trên thông tin gì cần thì thêm vào

![image.png](attachment:140b983e-d7d9-4272-8035-6694c718a266:image.png)

- [x] Thiếu OCR

![image.png](attachment:d86d3686-8f4d-4bf6-812c-b13a557091de:image.png)

- [x] Cân nhắc có thêm mô hình Gemini phụ trợ → Đã làm tốt cái này

![image.png](attachment:7f71442a-248e-4892-bee3-9fafaf60c4a5:image.png)

- [x] Thêm validate Trần với Âm tiền
- [x] Set giới hạn 10 câu hỏi trên phút
- [x] Tính năng nhập nợ cần có thêm thông tin, tài liệu giải thích
- Cách thức hình thức cho vay và trả nợ ở việt nam ?
  - Qua đó chúng ta thấy được dự án chúng ta thiếu cho phép nhập ngày cho vay + thời hạn vay mà thay vào đó là kỳ hạn kỳ hạn còn lại
  - Thuật ngữ ngày đáo hạn còn mơ hồ → Nó là ngày trả lãi hàng tháng
  - Thiếu phí phạt khi không trả nợ đúng theo tháng
  - Hình thức chỉ trả lãi mỗi tháng đã có rồi. → còn mơ hồ với người dùng là tổng số tiền cần trả mỗi tháng chưa lãi hay tính lãi rồi, …
  - Liệu có số nợ mỗi tháng cần trả có thông báo phải trả chưa ? Có theo dõi phí phạt chưa ?
- [x] Sửa lại thêm theo dõi lãi xuất tiết kiệm vì đang fix cứng → kiểm tra
- [x] Sửa lại tính năng kế hoạch đầu tư: Bị sai khi theo dõi vào thị trường bitcoin,… mà không đề xuất phân bổ vào
- [x] Thêm LandingPage
- [x] Research thêm pp đề xuất kế hoạch trả nợ → Khắc phục nhược điểm
- [x] Xây dựng tính năng ChatBot
  - [x] Dùng Node ? Python ? → Liệu ông kia có quá yếu không ?
  - [x] Tổng hợp tài liệu xây dụng kho kiến thức cho AI
  - [x] Làm truy vấn cơ bản ? Hay tích hợp cả Agentic để dùng tools ?
  - [x] Chọn phương án build code ? công cụ
  - [x] Thiết kế kiến trúc
  - [x] Xây dựng và tích hợp
  - [x] Test
- [x] OCR
- [x] Viết tài liệu
- [x] Thêm tính năng
- [x] Test kiểm tra lỗi
- [x] Sửa lỗi:
- [x] Xong
  - [x] Cảnh báo nợ khi quá nhiều nợ

  ![image.png](attachment:bc91eccf-5e34-477f-a6c1-f3fd4b94906f:image.png)

  ![image.png](attachment:5831876d-20e3-44a4-b19e-3fd73fc2368a:image.png)

- [x] Một tài liệu kỹ thuật PDF theo template
- [x] Poster

Thêm chức năng gợi ý đầu tư phân bổ như thế nào ở trang đầu tư

Kiểm tra Validate lại các input trong chức năng thêm khoản nợ

phần thêm khoạn nợ thay đổi trường kì hạn thành ngày vay và thời gian vay để hệ thống tự tính

Thêm phần quiz vào đánh giá rủi ro để có nhiều câu hỏi hơn

Phần thông báo ngày đáo hạn sắp tới chưa hiển thị ở trang dashboard

kiểm tra lại logic của phần lãi kép APY

Phần chat box khi gửi hình ảnh trước thì hỏi lại bằng text sẽ bị lỗi báo null, text trước thì được,

khi promt nhập nợ bằng text nó không hiển thị xác nhận thêm khoản nợ

- Run ✅

  ## **Cách chạy**

  ```
  bash
  # 1. Start infrastructure
  dockercomposeup-dpostgresredis

  # 2. Start backend
  cdserver &&npmrundev

  # 3. Ingest RAG documents (chỉ cần chạy 1 lần)
  cdserver &&npmrunrag:ingest

  # 4. Start frontend
  cdclient &&npmrundev

  # 5. Mở http://localhost:5173 → đăng nhập → click nút chat góc phải dưới
  ```

### ChatBot ❌ → Nâng cấp lên Agentic RAG - Xong ✅

- Tổng hợp nhu cầu → Khả năng, hạn chết Bot

  Trong môi trường tài chính (Fintech), một Chatbot không chỉ cần thông minh mà yêu cầu số 1 là **sự chính xác** và **tính bảo mật**. Sự sai lệch trong tính toán (Hallucination) có thể dẫn đến hậu quả lớn cho người dùng.

  ***

  ## **1. Khả năng mang lại (Capabilities)**

  Chatbot chúng ta xây dựng sẽ có 3 năng lực cốt lõi (từ cơ bản đến nâng cao):
  - **Tư vấn Kiến thức Tài chính (Knowledge-Based):**
    - Hỗ trợ giải đáp ngay lập tức các thuật ngữ phức tạp: *EAR là gì? APR khác EAR thế nào? Phương pháp Snowball so với Avalanche?*
    - Truy xuất dựa trên cơ sở dữ liệu chuyên ngành (Tài liệu nội bộ/RAG) đảm bảo nguồn thông tin đáng tin cậy.
  - **Thấu hiểu Ngữ cảnh Cá nhân (Context-Aware):**
    - Kết nối trực tiếp vào Database thông qua `user_id` hiện tại. Khi user hỏi *"Tình hình nợ của tôi tháng này thế nào?"*, AI tự động thu thập số dư từ PostgreSQL và tổng hợp, cảnh báo nguy cơ Domino vỡ nợ nếu có.
    - Phân tích hồ sơ rủi ro (Risk Profile) của user để đưa ra lời khuyên phân bổ danh mục đầu tư phù hợp.
  - **Trợ lý Tương tác (Interactive Assistant):**
    - Kết hợp luồng dữ liệu thời gian thực (Market Sentiment: Fear & Greed Index).
    - Thực hiện các phép mô phỏng tài chính (Ví dụ: *"Nếu mỗi tháng tôi trả thêm 2 triệu, khi nào tôi hết nợ?"* - AI gọi hàm tính toán ở backend thay vì tự tạo ảo giác ra con số).

  ## **2. Hạn chế và Rủi ro (Limitations & Risks)**

  Để hệ thống đáng tin cậy, chúng ta phải thừa nhận và cô lập các hạn chế của LLM hiện hành:

  **WARNING**

  **Điểm mù của Toán học (Math Hallucinations)** Mô hình ngôn ngữ (LLM) bản chất là đoán chữ (token), không phải máy tính. Do đó, tuyệt đối **không để LLM tự tính toán lãi suất (EAR, APY)** hoặc kỳ hạn trả nợ. *Giải pháp:* LLM chỉ đóng vai trò "cầu nối". Nó nhận câu hỏi, sau đó gọi **Tool (Hàm/API)** chuẩn của Node.js (ví dụ `calcEAR()`) để lấy kết quả, rồi mới biên dịch thành câu trả lời tự nhiên.

  **CAUTION**

  **Trách nhiệm Pháp lý và Khuyên Đầu tư** Chatbot không phải là cố vấn tín dụng được cấp phép. *Giải pháp:* Luôn gài một System Prompt cứng: *"Tôi là trợ lý ảo AI. Các phân tích chỉ mang tính tham khảo và mô phỏng toán học, không phải lời khuyên đầu tư tài chính..."*

  **TIP**

  **Bảo mật dữ liệu (Data Privacy)** Khi nhúng thông tin user vào Prompt để chat với OpenAI (nếu dùng cloud), dữ liệu nợ/lương của user sẽ bị gửi ra ngoài. *Giải pháp:* Khỏa lấp tên thật, mã hóa thông tin nhạy cảm. Hoặc nếu muốn bảo mật 100%, hãy chạy một mô hình Local (như Llama-3 qua LM Studio) trên máy chủ riêng.

  ***

  ## **3. Lộ trình Triển khai Đề xuất (Roadmap)**

  Tôi đề xuất chia việc xây dựng Chatbot làm 3 Giai đoạn (Phases) để vừa kiểm soát rủi ro, vừa ra mắt được tính năng sớm nhất.

  ### **Phase 1: Chatbot Kiến thức (RAG Cơ Bản)**

  _Mục tiêu: Xây dựng nền tảng RAG, Chatbot biết giải thích khái niệm._
  - **Công nghệ:** Node.js, LangChain.js, PostgreSQL (`pgvector`), OpenAI / Local LLM.
  - **Hoạt động:** Ta load cẩm nang tài chính (Luật vay, khái niệm EAR, phương pháp trả nợ) vào `pgvector`. Khi user hỏi, AI Search Vector để trả lời lý thuyết chính xác. Chưa truy cập dữ liệu cá nhân user.

  ### **Phase 2: Chatbot Cá nhân hóa (Context-injected Chat)**

  _Mục tiêu: Chatbot hiểu sơ yếu lý lịch tài chính của user._
  - **Công nghệ:** Tích hợp Prisma ORM vào luồng LangChain của user request.
  - **Hoạt động:** Trước khi gửi câu hỏi cho AI, server đính kèm một `User_Context`. (Vd: *"User Name: Anna, Total Debt: 50m, Income: 20m"*).
  - **Kết quả:** User có thể hỏi *"Tôi có nên vay thêm không?"*. AI căn cứ vào DTI (Debt-to-Income) hiện tại để khuyên.

  ### **Phase 3: Agentic Finance (Sử dụng Công cụ - Tools/Functions)**

  _Mục tiêu: Trở thành "Financial Agent" thực thụ._
  - **Công nghệ:** LangGraph.js hoặc Function Calling (Tool Calling của OpenAI).
  - **Hoạt động:** Chatbot có khả năng tự động hiểu ý định người dùng và kích hoạt tool.
    - User: *"Lập cho tôi lịch trả nợ Avalanche với ngân sách dư 5 triệu"*
    - AI -> Gọi hàm `simulateRepayment(debts, 5000000, 'AVALANCHE')` ở backend.
    - AI -> Nhận kết quả từ hàm, xuất ra lịch trả nợ cho user trên khung chat.

- Build với Python

  # **Kế hoạch Tích hợp Python Microservice (LangGraph + Node.js)**

  Lựa chọn tận dụng dự án **Sales RAG Agent (Python, LangGraph)** cũ của bạn là một chiến lược rất thông minh. Python hiện tại vô đối về hệ sinh thái AI (đặc biệt là tính năng Agentic Workflow của LangGraph).

  Để ghép một Agent Python vào hệ thống Node.js/React hiện có, chúng ta sẽ sử dụng kiến trúc **Microservices (2 Backend chạy song song)**. Dưới đây là quá trình triển khai chi tiết:

  ***

  ## **1. Kiến trúc luồng dữ liệu (Data Flow)**

  Thay vì Frontend chọc thẳng vào Python, ta lấy Node.js làm màng bọc bảo vệ (API Gateway).

  **[1. FRONTEND React]**

  > 👤 User gõ: *"Phân tích nợ của tôi tháng này"* ➜ Gửi HTTP POST tới `http://localhost:5000/api/ai/chat` (Server Node.js) kèm Token.

  **[2. BACKEND Node.js (Express)]**

  > 🛡️ *Middleware*: Xác thực Token JWT thành công (Đúng là User A). 🗄️ *Context Fetching*: Dùng thư viện Prisma truy vấn DB: "User A đang nợ tổng cộng 50 triệu, lương 20 triệu". 🚀 *Proxy Forwarding*: Đóng gói (Câu hỏi AI + Dữ liệu DB) gửi sang Server Python nội bộ qua Axios.

  **[3. AI SERVICE Python (FastAPI + LangGraph)]**

  > 🧠 Nhận payload từ Node.js ở cổng `localhost:8000/stream`. 🕵️ *Router Node (LangGraph)*: Điểu hướng câu hỏi (Câu hỏi này về nợ cá nhân hay kiến thức chung?). 📚 *Retriever Node*: Nếu cần lý thuyết, query thẳng vào bảng `Knowledge` (qua pgvector) chung chung của PostgresDB. 🤖 *LLM Node*: Build Prompt: `"User này nợ 50tr, lương 20tr. Hãy khuyên họ. Câu hỏi: <Phân tích nợ...>"` -> Gọi API LM Studio. 🌊 *Streaming*: Bắn kết quả streaming (từng chữ) ngược lại cho Node.js.

  **[4. BACKEND Node.js]**

  > 🌊 Gởi streaming thẳng về cho Frontend thông qua SSE (Server-Sent Events) hoặc WebSocket.

  ***

  ## **2. Kế hoạch tận dụng source code dự án cũ**

  Từ source `app.py` và thư mục `agent/graph.py` của dự án Sales cũ, chúng ta tái sử dụng:

  ### **A. Giữ lại (Re-use):**
  1. **Cấu trúc thư mục LangGraph**: Các Node (Retriever, Grader, Generator) và Conditional Edges (Vòng lặp tự sửa lỗi nếu AI ảo giác).
  2. **LM Studio Connection**: Base base URL trỏ vào `http://localhost:1234/v1` để chạy mô hình AI Offline hoàn toàn miễn phí và bảo mật.

  ### **B. Chuyển đổi (Refactor):**
  1. **Đổi Prompt**: Từ "Sales Agent" thành "Finance & Debt Advisor".
  2. **Thêm API Layer**: Bọc vòng `graph.invoke()` cũ vào một endpoint API của thư viện `FastAPI` (Python) để bên Node.js có thể gọi được qua HTTP.
  3. **Vector DB**: Chuyển vector store từ ChromaDB (dự án cũ dùng thường xuyên) sang dùng chung **PostgreSQL (pgvector)** với Node.js để quản lý tài nguyên tập trung.

  ## **3. Cấu trúc thư mục tổng thể đề xuất (Mono-repo)**

  Dự án mới của bạn sẽ bao gồm 3 phần chạy cùng lúc khi code gõ lệnh `npm run dev` ở từng folder:

  ```
  text
  finance-webdev-adventure/
  ├── client/              (React chạy cổng 5173)
  ├── server/              (Node.js Express chạy cổng 5000)
  │   └── src/routes/ai.routes.js   # Cầu nối gửi data qua python
  ├── ai-service/          (THƯ MỤC MỚI: Python FastAPI chạy cổng 8000)
  │   ├── venv/
  │   ├── app.py           # FastAPI Server
  │   └── agent/           # Copy nguyên cấu trúc LangGraph từ dự án cũ sang
  └── docker-compose.yml   # Chứa 1 cục DB Postgres (có pgvector) cho cả Express và Python
  ```

  ## **User Review Required**

  **CAUTION**

  **Điểm cần lưu ý khi chạy 2 Backend** Máy tính của bạn sẽ cần cấu hình tốt một chút để cân nhiều dịch vụ:
  1. React (Vite)
  2. Node.js server
  3. Python FastAPI server
  4. LM Studio (Chạy LLM Local ngốn RAM và GPU)
  5. Database PostgreSQL + Redis.

  **Bạn thấy cấu trúc này ổn chứ? Việc để Node.js kẹp giữa làm bảo vệ và lấy dữ liệu cá nhân trước khi giao cho Python xử lý là phương pháp an toàn và chuẩn ngành nhất hiện nay (BFF Pattern - Backend For Frontend).** Nếu bạn đồng ý, bước thi công đầu tiên của chúng ta sẽ là khởi tạo thư mục `ai-service` bằng Python song song với folder `server`.
  -
  -
  -
  -
  -

- Build với N8N

  # Đánh giá Phương án Tích hợp bằng n8n (Low-Code AI)

  Bạn vừa đưa ra một ý tưởng vô cùng hiện đại: **Sử dụng n8n làm bộ não điều phối AI thay thế cho việc đục code thủ công (bằng Python FastAPI hay Node.js Langchain).**

  Câu trả lời ngắn gọn là: **CÓ! Rất dễ dàng và thậm chí đây là xu hướng mạnh nhất (AI Automation) hiện nay!**

  n8n có một thư viện Advanced AI (tích hợp sẵn LangChain) cho phép bạn kéo thả các Agent, Memory, Vector Store, LLM (OpenAI, LM Studio) thành một Flow giao diện đồ họa.

  ***

  ## 1. So sánh n8n với Python LangGraph (Dự án cũ)

  | Tiêu chí                 | Dùng n8n (Kéo thả đồ họa)                                  | Dùng Python (LangGraph)                                 |
  | ------------------------ | ---------------------------------------------------------- | ------------------------------------------------------- |
  | **Độ khó bảo trì**       | Rất thấp (Nhìn vào sơ đồ là hiểu ngay logic)               | Cần đọc code, trace log kỹ thuật.                       |
  | **Quá trình tích hợp**   | Gắn N8N vào Docker ➔ Cấu hình Webhook ➔ Xong.              | Khởi tạo venv, FastAPI router, cài tỷ loại package pip. |
  | **Khả năng Debug**       | Trực quan, xem từng bước In/Out ngay trên trình duyệt.     | Phải dùng command line hoặc tool chuyên dụng.           |
  | **Giao tiếp API**        | **N8N tỏa sáng:** Nó sinh ra để gọi HTTP Webhook liên tục. | Phải tự code hàm Axios/Request.                         |
  | **Tái sử dụng dự án cũ** | Cần "vẽ" lại logic của dụ án cũ sang n8n.                  | Chỉ cần Copy - Paste code cũ, chỉnh sửa nhanh.          |

  ***

  ## 2. Kiến trúc cụ thể nếu tích hợp n8n

  Kiến trúc "BFF (Backend For Frontend)" vẫn được giữ nguyên để kiểm soát bảo mật, n8n đóng vai trò như một bộ não ẩn phía sau.

  **[1. BACKEND Node.js (Express)]**
  Thay vì gọi sang server Python, ta sẽ tạo một hàm gọi qua Webhook của n8n.
  - Vẫn Get thông tin cá nhân của User từ PostgreSQL (VD: Nợ 20tr).
  - Gửi HTTP POST dội thẳng vào 1 đường link Webhook do n8n tạo ra: `http://localhost:5678/webhook/chat-agent-ai`
  - Dữ liệu gửi đi: `{ "user_query": "Nợ tháng này sao?", "context": "Nợ 20tr", "user_id": 123 }`.

  **[2. DỊCH VỤ n8n (Chạy chung Server)]**
  Bạn không khởi tạo thư mục code nào cả. Mở `docker-compose.yml` ở thư mục hiện tại lên, chèn n8n vào dưới Postgres và Redis.
  - Flow n8n được trigger bằng Webhook.
  - Luồng n8n lấy dữ liệu. Nếu cần nó móc lại vào PostgreSQL chung của dự án để search Vector.
  - Kết nối tới LM Studio (qua giao thức OpenAI Local API).
  - Xử lý câu trả lời và Return HTTP Response cho Node.js gốc.

  **[3. LOCAL LM STUDIO]**
  Nằm ngoan ngoãn chờ n8n gửi request gọi nhả chữ.

  ***

  ## 3. Cách thêm n8n vào dự án liền tay (Cực gọn)

  Vì dự án của bạn CÓ SẴN file `server/docker-compose.yml` nên ta chỉ việc mở file đó ra và thêm một block vài dòng, xong gõ lệnh `docker compose up -d` là bạn có giao diện quản lý n8n tại `localhost:5678`.

  ```yaml
  n8n:
    image: docker.n8n.io/n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
      # N8n hỗ trợ kết nối ngược sang API của LM Studio trên cổng 1234
    volumes:
      - n8n_data:/home/node/.n8n
  ```

  ## User Review Required

  > [!TIP]
  > Việc dùng n8n biến toàn bộ những gì bạn cần lập trình phía backend cho AI chỉ còn là **"Kéo thả luồng, vẽ nút, và bắn Webhook từ môi trường Express"**. Bạn sẽ không phải viết các file AI phức tạp nữa.
  > Bù lại, bạn phải học tư duy ráp lệnh của giao diện n8n, nhưng vì bạn đã biết LangGraph, bạn master n8n AI trong tầm 1-2 tiếng!

  **Vậy theo bạn, chúng ta hướng theo:**
  1. Code chay bằng Node.js (LangChain in Node)
  2. Code chay bằng Python (Tái dùng LangGraph)
  3. **Mới nhất: Setup bằng N8N để thiết kế giao diện AI trực quan?** (Khuyên dùng nếu muốn Fast-Prototype).

- Thực hiện build & Fix

  https://youtu.be/Uq9WlPnT5iw?si=dRYQK-pv4NYigCj1

- Sửa lỗi

### Kiến trúc hệ thống OCR ✅

Tôi muốn dùng tesseratc.js nhưng kiến trúc bạn gợi ý này có thể dễ dàng thay đổi sangg gg cloud vison hay poenAI GPT-4o VIssion khôn g? Hãy giới hạn upload ảnh ở bên front-end. Liệu kiến trúc chúng ta định làm nó có xử lý trường hợp người dùng nộp định dạng khác như PDF không ? Và Liệu thông tin người dùng gửi ảnh lên không đủ thì hệ thống xử lý làm sao ? Hãy làm rõ những câu hỏi này

- Những file ảnh hưởng

  Dựa vào lịch sử commit trên nhánh `feature/ocr-integration`, tính năng trích xuất dữ liệu từ ảnh (OCR - Optical Character Recognition) được hiện thực thông qua các file chính sau đây:

  ### **1. Phía Front-End (Client)**
  - **`client/src/utils/ocr.js`**: **(File cốt lõi)** Chứa logic chính xử lý OCR ở dưới client (ví dụ: cấu hình và gọi thư viện như `Tesseract.js` để đọc văn bản từ hình ảnh file tải lên).
  - **`client/src/components/chat/AIChatbotModal.jsx`**: Giao diện Chatbot đã được cập nhật nút upload (đính kèm hình ảnh hóa đơn), đồng thời hiển thị trạng thái đang scan ảnh cho UI.
  - **`client/src/hooks/useAgenticChat.js`**: Hook xử lý luồng logic (state) từ khi người dùng đính kèm file ảnh, tích hợp gọi module OCR thông qua hàm chat.
  - **`client/src/api/agentic.js`**: Cập nhật hàm gọi API gửi request (chứa thông tin ảnh hoặc nội dung OCR được đọc ra) xuống Backend.
  - **`client/package.json`**: Có thêm các package liên quan đến OCR (thường là `tesseract.js`).

  ### **2. Phía Back-End (Server)**
  - **`server/src/controllers/agentic.controller.js`**: Nhận request từ phía Client (có thể bao gồm thông tin văn bản OCR đã scan được) và điều phối xử lý qua framework Agentic AI.
  - **`server/src/agentic/prompts.js`**: Được cập nhật thêm System Prompt để hướng dẫn AI cách nhận diện và trích xuất (parse) các thông số khoản nợ cụ thể từ chuỗi kết quả scan OCR.

  Nếu bạn cần tinh chỉnh logic đọc chữ, hãy vào `client/src/utils/ocr.js`. Còn nếu muốn tùy chỉnh cách giao diện hiển thị khi up ảnh hóa đơn, thì bạn vào `client/src/components/chat/AIChatbotModal.jsx`.
