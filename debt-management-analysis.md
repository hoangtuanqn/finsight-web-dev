# Phân Tích Chuyên Sâu: Tính Năng Quản Lý Nợ (Debt Management)

Dưới đây là báo cáo phân tích toàn diện về hệ thống Quản lý nợ (Debt Management) hiện tại của FinSight. Báo cáo này quét từ Database (Prisma), Backend (Node.js/Express API), Cron Jobs, cho đến Frontend (React/Vite).

## 1. Các Tính Năng Đã Hoàn Thiện (Hiện Có)

Hệ thống hiện tại đã xây dựng được một nền tảng quản lý nợ khá đồ sộ và chi tiết:

### Database & Backend Models
- **Mô hình `Debt` đầy đủ:** Lưu trữ chi tiết khoản nợ, lãi suất (APR), phân loại lãi (`rateType`: FLAT), các loại phí ẩn (phí xử lý, bảo hiểm, quản lý, phí phạt trễ hạn).
- **Cơ chế Soft Delete (Thùng rác):** Xóa nợ không xóa ngay lập tức (trừ khi nợ đã trả hết 100%). Nếu còn nợ, yêu cầu người dùng xác nhận cam kết rủi ro, chuyển vào trạng thái `deletedAt` và chờ dọn dẹp sau 30 ngày (`scheduledPurgeAt`).
- **Theo dõi lịch sử (`DebtSnapshot` & `Payment`):** Lưu trữ lịch sử thanh toán, tự động trừ nợ (`balance`) và cập nhật số kỳ còn lại (`remainingTerms`). Mỗi ngày đều lưu lại tổng nợ và chỉ số DTI để vẽ biểu đồ.

### Các Logic Business Tài Chính (Calculations)
- **Tính toán EAR (Lãi suất thực tế):** Đã có hàm tính toán APY và EAR dựa trên lãi suất danh nghĩa + các phí ẩn.
- **Phân tích DTI (Debt-to-Income):** Tự động phân loại rủi ro dòng tiền người dùng (SAFE, CAUTION, WARNING, CRITICAL) dựa trên tỷ lệ nợ / thu nhập. Có tính toán "What-if" (Cần thêm bao nhiêu thu nhập để an toàn).
- **Mô phỏng trả nợ (Repayment Plans):** API `/repayment-plan` giả lập trả nợ theo phương pháp **Avalanche** (trả lãi cao trước) và **Snowball** (trả nợ nhỏ trước). Có hỗ trợ nạp thêm `extraBudget` để tăng tốc trả nợ.

### Tích hợp Gửi Email & Cảnh Báo (Đã Tích Hợp Đầy Đủ)
Bạn đã có sự chuẩn bị rất tốt cho phần Email. Mọi logic cảnh báo nợ đều đã được móc nối:
1. **Thanh toán đạt mốc (Milestones):** Khi người dùng trả nợ qua các mốc 25%, 50%, 75%, 100% -> Tự động bắn In-App Notification và gửi email `sendMilestoneCongrats`.
2. **Cronjob Hàng Ngày (Quét nợ):**
   - **Sắp đến hạn (1-3 ngày):** Gửi cảnh báo In-App + Email `sendDebtAlert`.
   - **Đến hạn hôm nay:** Gửi cảnh báo khẩn cấp + Email `sendDueTodayAlert`.
   - **Quá hạn (< 0 ngày):** Gửi cảnh báo đỏ + Email `sendOverdueAlert`.
   - **Hiệu ứng Domino:** Nếu có $\geq 2$ khoản nợ đáo hạn trong 1 tuần, HOẶC chỉ số DTI > 50% -> Gửi Email `sendDominoRiskAlert` khẩn cấp để cơ cấu lại dòng tiền.

---

## 2. Những Lỗ Hổng / Gán Cứng / Chưa Hoàn Thiện Cần Xử Lý

Mặc dù nền tảng tốt, nhưng có một số chỗ đang bị gán cứng hoặc "râu ông nọ cắm cằm bà kia" cần được giải quyết ngay để business logic chạy trơn tru:

### 🔴 Backend (API) Cần Bổ Sung
1. **Thiếu API Export Report (PDF/Excel):** Frontend có Modal `ExportReportModal.tsx` để xuất báo cáo nợ, nhưng trong `debt.routes.ts` **hoàn toàn chưa có endpoint** (ví dụ: `GET /debts/export`). Chức năng này trên UI nhấn vào sẽ bị lỗi.
2. **Logic Lãi Suất (Rate Type) Bị Bỏ Ngỏ:** Database có `rateType` (Flat - dư nợ ban đầu, và có thể là Dư nợ giảm dần). Nhưng các hàm tính toán hiện tại (`calcEAR`, mô phỏng Avalanche/Snowball) **chưa phân biệt** hai loại này. Tất cả đang tính theo Flat. Cần bổ sung thuật toán tính tiền lãi theo dư nợ giảm dần.
3. **Mồ Côi `DebtGoal`:** Trong Schema có bảng `DebtGoal` để người dùng đặt mục tiêu tất toán, Frontend có trang `DebtGoalPage.tsx`. Nhưng **không có** bất kỳ API nào (Controller/Routes) để lưu trữ và lấy dữ liệu mục tiêu nợ.
4. **Phạt Quá Hạn (Penalty Fee) Chưa Trừ Tiền:** Cronjob đã phát hiện nợ quá hạn và gửi email, nhưng chưa có logic tự động cộng dồn `feePenaltyPerDay` vào `balance` hoặc ghi nhận khoản nợ tăng lên theo thời gian thực.

### 🟡 Frontend (UI/UX) Cần Chỉnh Chu
1. **Giao Diện Thùng Rác (Trash):** API có hỗ trợ query `?status=TRASH` và chức năng `restoreDebt`. Nhưng trên `DebtOverviewPage.tsx` cần bổ sung rõ ràng bộ lọc hoặc một nút "Thùng rác" để người dùng vào xem và khôi phục nợ lỡ tay xóa.
2. **Nút "Thanh toán (Log Payment)":** Khi ấn thanh toán ở trang chi tiết, cần có UI mượt mà để nhập số tiền (amount) và ghi chú. Khi thanh toán xong cần gọi API để update lại biểu đồ dư nợ ngay lập tức mà không cần reload.
3. **Hiển Thị Tối Ưu Lãi Suất Ẩn:** Ở trang thêm nợ mới (`AddDebtPage`), cần giải thích rõ cho người dùng sự khác biệt giữa Lãi suất danh nghĩa (APR) và Lãi suất thực tế (EAR) ngay lúc điền các khoản "Phí bảo hiểm khoản vay", "Phí quản lý".
4. **Đồng Bộ Dữ Liệu `extraBudget`:** Trình giả lập Avalanche/Snowball hiện có tham số `extraBudget`, nhưng ở UI cần có chỗ cho người dùng nhập số tiền "sẵn sàng hi sinh thêm mỗi tháng" để thấy được biểu đồ nợ rút ngắn lại bao nhiêu năm.

---

## 3. Kế Hoạch Triển Khai Tiếp Theo (Đề Xuất)

Dựa trên phân tích, chúng ta nên ưu tiên làm theo trình tự sau để dứt điểm phần Nợ:

- **Giai đoạn 1 (Backend Core):** 
  - Thêm các API còn thiếu cho `DebtGoal` (Mục tiêu trả nợ).
  - Tích hợp endpoint `GET /debts/export` để tải báo cáo PDF/Excel.
  - Cập nhật thuật toán tính toán phân biệt rõ `FLAT` (Dư nợ gốc) và `REDUCING_BALANCE` (Dư nợ giảm dần).
- **Giai đoạn 2 (Frontend Integration):**
  - Móc nối API `DebtGoal` vào trang `DebtGoalPage.tsx`.
  - Bổ sung UI "Thùng rác" (Trash) vào `DebtOverviewPage`.
  - Tích hợp chức năng xuất báo cáo.
- **Giai đoạn 3 (Polish & Logic):**
  - Viết logic tự động tính phí phạt mỗi ngày (`feePenaltyPerDay`) khi nợ quá hạn vào CronJob.
  - Test luồng gửi Email thực tế để đảm bảo email đẹp và chính xác.

Bạn xem qua file báo cáo này. Khi bạn đồng ý, chúng ta sẽ bắt tay vào giải quyết ngay **Giai đoạn 1** (Backend Core) trước nhé!
