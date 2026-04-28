# PLAN - Repayment Plan Logic Fix

> File nội bộ để theo dõi audit/sửa chức năng "Kế hoạch trả nợ". Không commit file này lên git. Giữ riêng với `docs/PLAN-investment-advisor-upgrade.md`.

## Nguyên tắc làm việc

- Chỉ xử lý chức năng `Kế hoạch trả nợ`; không mở lại phần investment advisor, không mở đến các chức năng không liên quan.
- Chia nhỏ từng bước, test xong mới commit code của bước đó.
- TDD cho logic tài chính: viết test thể hiện bug trước, sửa implementation sau, commit khi test pass.
- File test tạm phục vụ TDD/audit cũng là nội bộ: có thể tạo để chạy kiểm chứng nhưng không đưa vào commit.
- File plan nội bộ phải được cập nhật checklist/ghi chú sau mỗi bước hoàn thành nhưng không đưa vào commit.
- Command chạy không quá 60 giây; nếu quá lâu thì dừng và chia nhỏ.
- Ưu tiên sửa contract backend trước rồi frontend consume dữ liệu đã chuẩn hóa, tránh để UI tự suy luận từ dữ liệu thô.

## Audit Snapshot - 2026-04-29

Đã rà các file chính:

| Khu vực | File | Vai trò |
| --- | --- | --- |
| Frontend page | `apps/web/src/pages/debt/RepaymentPlanPage.tsx` | UI ngân sách trả thêm, gọi repayment API, tự dựng timeline chart/DTI chart |
| Frontend hooks/API | `apps/web/src/hooks/useDebtQuery.ts`, `apps/web/src/api/index.ts` | Gửi `extraBudget` tới `/debts/repayment-plan` |
| Backend repayment API | `apps/api/src/controllers/debt.controller.ts` | Lấy debts/user, cộng `totalMin + extraBudget`, gọi simulator |
| Backend goal API | `apps/api/src/controllers/debt-goal.controller.ts` | Dùng cùng simulator cho mục tiêu trả nợ |
| Backend calc | `apps/api/src/utils/calculations.ts` | `simulateRepayment`, DTI, EAR/APY |
| Client calc mirror | `apps/web/src/utils/calculations.ts` | Có bản duplicate `simulateRepayment`, hiện là legacy/stale risk |
| Report service | `apps/api/src/services/report.service.ts` | Cũng gọi `simulateRepayment` với semantics khác |
| Schema | `apps/api/prisma/schema.prisma` | Debt/User fields: balance, apr, rateType, fees, minPayment, monthlyIncome, extraBudget |

Luồng hiện tại:

1. UI gọi `useRepaymentPlan(debouncedBudget)` với giá trị từ ô "Ngân sách trả thêm mỗi tháng".
2. API `/debts/repayment-plan` parse `extraBudget`, lấy `totalMin`, rồi tính `totalBudget = totalMin + extraBudget`.
3. API gọi `simulateRepayment(debts, totalBudget, strategy)`.
4. Simulator nhận tham số tên `extraBudget`, nhưng thực tế đang xử lý như tổng tiền có thể trả trong tháng.
5. API trả `schedule.slice(0, 24)`.
6. UI tự cộng `payments[].balance` để vẽ "Tiến trình giảm dư nợ", và cố tính DTI từ `payments[].minPayment`.

## Vấn Đề Logic

### P0 - Sai contract ngân sách trả thêm

**File:** `apps/api/src/controllers/debt.controller.ts`, `apps/api/src/utils/calculations.ts`, `apps/web/src/pages/debt/RepaymentPlanPage.tsx`

- UI gọi là "Ngân sách trả thêm mỗi tháng", nghĩa là tiền thêm ngoài khoản trả tối thiểu.
- Controller lại cộng `totalMin + extraBudget` trước khi gọi simulator.
- Simulator nhận tham số tên `extraBudget` nhưng dùng như tổng ngân sách trả nợ tháng: khởi tạo `remaining = extraBudget`, trừ dần minimum payment, rồi phần dư mới trả ưu tiên.
- Các nơi khác gọi simulator không cùng convention, nên cùng một hàm nhưng mỗi nơi hiểu tham số khác nhau.

**Tác động:**

- Dễ sai kết quả khi đổi caller hoặc tái sử dụng helper.
- Người dùng nhập 100tr "trả thêm" nhưng backend đang biến thành `minimum + 100tr`; bản thân hướng này đúng theo nhãn UI, nhưng contract hàm bị đặt tên ngược và gây bug ở goal/report.
- Khó test vì không rõ expected value là extra budget hay total monthly budget.

**Hướng sửa:**

- Chuẩn hóa public API nhận `extraBudget` đúng nghĩa: tiền thêm ngoài tổng minimum.
- Simulator nên nhận object rõ nghĩa, ví dụ `{ extraBudget, monthlyIncome, strategy }`, tự tính `minimumBudget` và `totalMonthlyBudget`.
- Response trả kèm `extraBudgetUsed`, `minimumBudget`, `totalMonthlyBudget`.

### P0 - `extraBudget=0` bị bỏ qua nếu user đã lưu extraBudget

**File:** `apps/api/src/controllers/debt.controller.ts`

Code hiện tại dùng pattern `parseFloat(req.query.extraBudget) || user.extraBudget || 0`.

**Tác động:**

- Nếu user đã lưu extra budget, UI không mô phỏng được kịch bản trả thêm 0đ.
- Đây là lỗi trực tiếp với thanh ngân sách vì 0 là giá trị hợp lệ nhưng bị coi như falsy.

**Hướng sửa:**

- Dùng nullish/finite check:
  - Nếu query param tồn tại và finite thì dùng đúng query value, kể cả 0.
  - Nếu query param không có thì fallback về `user.extraBudget`.
  - Reject hoặc clamp số âm/NaN.

### P0 - Simulator chỉ dùng phần dư cho một khoản nợ mỗi tháng

**File:** `apps/api/src/utils/calculations.ts`

Sau khi trả minimum, simulator chọn một target theo Avalanche/Snowball và trả `Math.min(remaining, target.balance)`. Nếu target được tất toán nhưng vẫn còn `remaining`, phần dư bị bỏ qua tới tháng sau.

**Tác động:**

- Với slider cao như 100tr/tháng, kết quả có thể chậm hơn thực tế và tổng lãi cao hơn.
- Biểu đồ giảm dư nợ có thể tụt theo từng nấc tháng không hợp lý thay vì tất toán nhiều khoản trong cùng tháng.
- So sánh Avalanche/Snowball bị méo khi extra budget lớn.

**Hướng sửa:**

- Sau minimum payments, chạy loop khi `remaining > 0` và còn active debts.
- Mỗi lần target được trả hết, chuyển remaining sang target tiếp theo trong cùng tháng.
- Schedule phải ghi rõ extra paid từng debt và tổng remaining unused nếu có.

### P0 - DTI chart đang sai/không có dữ liệu thật

**File:** `apps/web/src/pages/debt/RepaymentPlanPage.tsx`, `apps/api/src/controllers/debt.controller.ts`

- `getAllDebts` summary không trả `monthlyIncome`, nhưng page đọc `debtSummary?.monthlyIncome ?? 0`.
- UI tính DTI từ `payments[].minPayment`, nhưng schedule payment item không có field `minPayment`; kết quả luôn 0 nếu chart được render.
- Vì `monthlyIncome` thường là 0 ở page này, chart DTI thường không hiện; nếu hiện thì cũng dễ sai.

**Tác động:**

- "DTI sẽ giảm như thế nào?" không đáng tin.
- Tháng về ngưỡng an toàn `<20%` có thể bị tính thành tháng 1 giả tạo.

**Hướng sửa:**

- Backend repayment response nên trả `monthlyIncome` và/hoặc `schedule[].dti`.
- DTI theo tháng phải dựa trên nghĩa vụ thanh toán thực tế còn lại: tổng min payment của debts chưa tất toán hoặc tổng scheduled required payment, tùy business rule được chọn.
- UI chỉ render chart từ field backend đã tính, không tự đọc field không tồn tại.

### P0 - Debt Goal dùng simulator sai semantics

**File:** `apps/api/src/controllers/debt-goal.controller.ts`

Debt goal gọi `simulateRepayment(activeDebts, extraBudget, strategy)` với `extraBudget = user.extraBudget`, trong khi repayment plan lại gọi với `totalMin + extraBudget`.

**Tác động:**

- Projected payoff date trong debt goal có thể lệch so với trang repayment plan.
- `requiredExtraBudget` binary search đang search trên tham số bị hiểu như total monthly budget, nhưng lại đặt tên/hiển thị như extra budget.
- Cùng một hồ sơ nợ có thể cho timeline/milestone khác nhau giữa các tab.

**Hướng sửa:**

- Tất cả caller dùng một service duy nhất với contract rõ: caller truyền `extraBudget`, service tự cộng minimum.
- Debt goal dùng cùng response summary hoặc cùng core helper.

### P0 - Biểu đồ giảm dư nợ tự dựng từ rows thô thay vì backend summary

**File:** `apps/web/src/pages/debt/RepaymentPlanPage.tsx`, `apps/api/src/controllers/debt.controller.ts`

UI tính tổng dư nợ mỗi tháng bằng cách cộng `payments[].balance`.

**Tác động:**

- UI phụ thuộc vào chi tiết cấu trúc payment rows; chỉ cần backend đổi schedule là chart hỏng.
- Không có điểm tháng 0 nên chart không bắt đầu từ tổng dư nợ hiện tại.
- API chỉ trả 24 tháng đầu, trong khi `months` có thể lớn hơn 24; chart không thể hiện toàn bộ tiến trình hoặc payoff date.

**Hướng sửa:**

- Backend trả `schedule[].totalBalance` và `schedule[0]` là tháng 0.
- Nếu muốn giới hạn chart, backend trả thêm `isTruncated`, `fullMonths`, hoặc sampling rõ ràng.
- UI dùng `totalBalance` trực tiếp.

### P1 - Không phát hiện negative amortization / kế hoạch không tất toán

**File:** `apps/api/src/utils/calculations.ts`

Simulator dừng ở 360 tháng và trả `isCompleted`, nhưng controller không trả field này ra frontend.

**Tác động:**

- Nếu minimum payment thấp hơn lãi phát sinh, nợ có thể không giảm nhưng UI vẫn hiển thị như có kế hoạch.
- User không biết kế hoạch đang không khả thi.

**Hướng sửa:**

- Trả `isCompleted`, `warnings`, `negativeAmortizationDebts`.
- UI hiển thị cảnh báo nếu plan không tất toán trong giới hạn mô phỏng.

### P1 - Rate type/fees/EAR chưa được đưa vào repayment plan

**File:** `apps/api/src/utils/calculations.ts`, `apps/api/src/controllers/debt.controller.ts`, `apps/api/prisma/schema.prisma`

- Debt có `rateType`, `feeProcessing`, `feeInsurance`, `feeManagement`, `feePenaltyPerDay`, nhưng simulator chỉ dùng `balance * apr / 12`.
- Avalanche đang sort bằng APR, không phải EAR/actual cost.

**Tác động:**

- Với khoản vay flat rate hoặc có nhiều phí, tổng lãi và thứ tự ưu tiên có thể không đúng.
- Trang EAR analysis và repayment plan có thể mâu thuẫn.

**Hướng sửa:**

- Quyết định rule nghiệp vụ:
  - Nếu `balance` là dư nợ gốc còn lại: cần công thức interest theo `rateType`.
  - Nếu `minPayment` đã bao gồm lãi/phí: tránh cộng interest lần nữa.
- Avalanche nên dùng `effectiveCostRate` thống nhất với EAR nếu sản phẩm muốn tối ưu chi phí thực.

### P1 - Report service cũng gọi simulator lệch nghĩa

**File:** `apps/api/src/services/report.service.ts`

Report gọi `simulateRepayment(debts, user.monthlyIncome * 0.1, 'AVALANCHE')`.

**Tác động:**

- Nếu `monthlyIncome * 0.1` nhỏ hơn tổng minimum, simulator vẫn trả minimum đầy đủ do không kiểm tra khả năng chi trả.
- Report có thể đưa dự báo trả nợ khác repayment plan.

**Hướng sửa:**

- Report dùng cùng repayment service mới.
- Tên field trong report phải ghi rõ `extraBudget` hay `totalMonthlyDebtBudget`.

### P1 - Progress/milestone có thể tính lẫn nợ đã xóa

**File:** `apps/api/src/controllers/debt-goal.controller.ts`

`totalOriginal` đang lấy tất cả debts của user, còn `totalCurrent` chỉ cộng ACTIVE.

**Tác động:**

- Nợ trong TRASH/deleted hoặc nợ đã PAID vẫn ảnh hưởng mẫu số/tử số theo cách chưa rõ.
- Banner "Mục tiêu trả nợ" có thể hiển thị phần trăm/milestone gây khó hiểu.

**Hướng sửa:**

- Xác định progress nên tính trên toàn bộ lịch sử nợ hay chỉ các khoản thuộc goal hiện tại.
- Nếu tính toàn bộ lịch sử thì loại `deletedAt != null` khỏi mẫu số hoặc ghi rule rõ.

### P2 - Legacy duplicate client simulator

**File:** `apps/web/src/utils/calculations.ts`

Frontend có bản `simulateRepayment` duplicate với backend, hiện chưa thấy page repayment dùng trực tiếp.

**Tác động:**

- Dễ drift logic nếu sau này UI/agent/import khác dùng nhầm.

**Hướng sửa:**

- Nếu không còn reference thực tế: xóa hoặc note rõ deprecated.
- Nếu còn dùng ở chỗ khác: thay bằng API/service chung hoặc test mirror behavior.

### P2 - UX ngân sách dễ gây hiểu nhầm

**File:** `apps/web/src/pages/debt/RepaymentPlanPage.tsx`

- Input cho phép 100 tỷ, slider chỉ 100 triệu.
- Khi nhập vượt slider, app vẫn tính nhưng slider bị kẹt ở 100tr.
- API gọi lại theo debounce mỗi lần kéo slider, chưa có guard loading/error chi tiết.

**Tác động:**

- Người dùng khó biết con số đang mô phỏng là extra budget hay tổng budget.
- Kéo slider nhanh có thể tạo nhiều request.

**Hướng sửa:**

- Hiển thị rõ: `Trả tối thiểu Xđ + trả thêm Yđ = tổng Zđ/tháng`.
- Nếu giữ input vượt slider, hiển thị trạng thái "ngoài phạm vi thanh kéo" rõ hơn.
- Có thể dùng `keepPreviousData`/placeholder hoặc loading nhỏ trong chart.

## Kế Hoạch Sửa Theo TDD

### Bước 1 - Khóa contract bằng test backend

- [x] Thêm test TDD tạm cho core repayment simulator, dùng nội bộ và không commit test file.
- [x] Case: `extraBudget=0` vẫn mô phỏng đúng minimum only, không fallback sang saved value ở controller/service.
- [x] Case: extra budget lớn tất toán nhiều khoản trong cùng tháng, không bỏ phí phần dư.
- [ ] Case: Avalanche chọn debt có effective cost cao nhất; Snowball chọn balance nhỏ nhất.
- [x] Case: schedule có month 0, totalBalance giảm đúng, không âm.
- [ ] Case: plan không hoàn tất trong limit trả `isCompleted=false` và warning.
- [x] Chạy test bằng Bun với timeout 60s.
- [x] Commit implementation khi tất cả pass. Không commit file plan/test tạm.

### Bước 2 - Tách repayment service có contract rõ

- [ ] Tạo hoặc refactor service dùng chung cho repayment plan, debt goal, report.
- [ ] Input service: debts, `extraBudget`, strategy, monthlyIncome optional, maxMonths/scheduleLimit optional.
- [x] Output service/helper: `initialBalance`, `minimumBudget`, `extraBudgetUsed`, `totalMonthlyBudget`, `months`, `totalInterest`, `isCompleted`, `schedule`. `warnings` vẫn chờ bước negative amortization.
- [x] Mỗi schedule item có: `month`, `totalBalance`, `interestAccrued`, `minimumPaid`, `extraPaid`, `totalPaid`, `dti`, `payments`.
- [ ] Payments ghi rõ `minimumPaid`, `extraPaid`, `interestAccrued`, `endingBalance`.
- [ ] Commit riêng sau khi tests pass.

### Bước 3 - Sửa API repayment plan

- [x] Parse query `extraBudget` bằng finite/nullish check, giữ đúng giá trị 0.
- [x] Validate/clamp số âm, NaN, Infinity.
- [x] Trả metadata budget và monthlyIncome cho frontend.
- [x] Không tự cắt schedule mơ hồ; nếu limit thì trả `isScheduleTruncated`.
- [ ] Recommendation dùng kết quả service mới.
- [ ] Thêm test controller/service nếu phù hợp.
- [ ] Commit riêng.

### Bước 4 - Sửa Debt Goal và Report dùng chung service

- [ ] Debt goal dùng `extraBudget` đúng nghĩa, không truyền nhầm vào total budget.
- [ ] Binary search `requiredExtraBudget` search trên extra budget, service tự cộng minimum.
- [ ] Progress/milestone loại/giải thích deleted/TRASH debts theo rule đã chọn.
- [ ] Report service dùng chung repayment service để không lệch kết quả.
- [ ] Commit riêng.

### Bước 5 - Sửa frontend chart/DTI

- [x] `RepaymentPlanPage` dùng `schedule[].totalBalance` từ backend.
- [x] Thêm điểm tháng 0 vào chart.
- [x] DTI chart dùng `schedule[].dti`, không đọc `payments[].minPayment`.
- [ ] Hiển thị `minimumBudget + extraBudget = totalMonthlyBudget`.
- [ ] Hiển thị warning nếu plan không hoàn tất hoặc schedule bị cắt.
- [ ] Giữ UI đồng bộ style hiện tại, không làm ảnh hưởng các tab nợ khác.
- [ ] Commit riêng.

### Bước 6 - Dọn legacy sau khi xác nhận reference

- [ ] Rà `apps/web/src/utils/calculations.ts` xem `simulateRepayment` còn được import ở đâu.
- [ ] Nếu không dùng: xóa legacy simulator hoặc đánh dấu deprecated và không expose.
- [ ] Nếu còn dùng: thay bằng response API hoặc test rõ behavior.
- [ ] Commit riêng.

## Cần Quyết Định Trước Khi Sửa Công Thức

- `balance` hiện đang đại diện cho dư nợ gốc còn lại hay tổng nghĩa vụ còn phải trả?
- Với `rateType = FLAT`, `minPayment` đã gồm lãi/phí chưa? Nếu đã gồm, simulator không nên cộng lãi APR như reducing loan.
- Avalanche tối ưu theo APR hay EAR? Nếu mục tiêu là "tiết kiệm lãi/chi phí", nên dùng effective cost/EAR.
- DTI theo tháng nên tính trên tổng minimum obligation còn lại hay tổng số tiền user thực trả trong plan?
- Progress milestone nên tính trên toàn bộ lịch sử nợ, hay chỉ các khoản ACTIVE/thuộc mục tiêu hiện tại?

## Verification Dự Kiến

- Backend targeted tests: `bun.cmd test` cho file test repayment/simulator mới.
- Frontend type-check sau khi sửa UI: chạy trong `apps/web` bằng `bun.cmd run type-check`.
- Frontend build nếu thay UI đáng kể: chạy trong `apps/web` bằng `bun.cmd run build`.
- API type-check hiện có baseline nợ kỹ thuật từ refactor TS/import extension; không trộn cleanup đó vào repayment fix trừ khi nó chặn trực tiếp test/sửa.

## Ghi Chú

- 2026-04-29: Đã sửa bước nhỏ đầu tiên ở production code: simulator dùng hết phần dư trong cùng tháng và API repayment giữ đúng `extraBudget=0`.
- 2026-04-29: Test TDD tạm `repayment.tmp.test.ts` đã được tạo/chạy/xóa, không đưa vào commit. Kết quả targeted test trước khi xóa: `bun.cmd test src/utils/repayment.tmp.test.ts` pass 3/3.
- 2026-04-29: Commit production code: `8055c8c repayment: fix budget parsing and excess payment allocation`.
- 2026-04-29: Đã sửa bước chart/DTI: simulator trả month 0 + `totalBalance` + metadata budget + `dti`; API repayment expose metadata; frontend dùng schedule backend thay vì tự cộng `payments[].balance`/`payments[].minPayment`.
- 2026-04-29: Test TDD tạm cho enriched schedule đã được tạo/chạy/xóa, không đưa vào commit. Kết quả targeted test trước khi xóa: `bun.cmd test src/utils/repayment.tmp.test.ts` pass 1/1. `apps/web` `bun.cmd run type-check` pass.
- 2026-04-29: Chưa commit bước chart/DTI vì repo đang có nhiều staged changes ngoài phạm vi repayment, riêng `RepaymentPlanPage.tsx` đang `MM`; không tự unstage/commit lẫn thay đổi của người khác.
- 2026-04-29: `bun.cmd run type-check` trong `apps/api` vẫn fail bởi baseline refactor TS/import extension và vài lỗi sẵn có ngoài phạm vi repayment; chưa trộn cleanup này vào fix.
- Hai file plan nội bộ đang untracked và phải giữ ngoài commit: `docs/PLAN-repayment-fix.md`, `docs/PLAN-investment-advisor-upgrade.md`.
