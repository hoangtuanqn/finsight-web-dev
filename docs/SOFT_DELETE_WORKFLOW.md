# Tài Liệu Thiết Kế Kiến Trúc: Cơ Chế Xoá Mềm Thông Minh (Smart Soft Delete Workflow)

*Tài liệu này mô tả chi tiết luồng nghiệp vụ, cấu trúc dữ liệu và các hệ lụy hệ thống khi triển khai tính năng Xoá mềm (Soft Delete) cho hệ thống quản lý khoản nợ của ứng dụng FinSight.*

---

## 1. Triết Lý Thiết Kế (Philosophy)

Trong hệ thống FinTech, **Data is King** và **Auditability** (Khả năng kiểm toán) là bắt buộc. Lệnh `DELETE` cứng (Hard Delete) ngay lập tức bị cấm vì:
- Người dùng dễ thao tác nhầm.
- Làm đứt gãy luồng phân tích dữ liệu (Data Analytics) về hành vi "từ bỏ" (churn).
- Mất dấu vết tài chính nếu khoản nợ đó có liên quan đến các khoản tiền đã thanh toán.

**Giải pháp:** Áp dụng mô hình **Smart Soft Delete** kết hợp **Garbage Collection (Purge)** theo thời gian lưu trữ (Retention Policy).

---

## 2. Cấu Trúc Cơ Sở Dữ Liệu (Database Schema)

Không sử dụng cột `status = 'DELETED'` để tránh trùng lặp và xung đột với các trạng thái nghiệp vụ (như `ACTIVE`, `SETTLED`). Soft Delete sẽ được quản lý bằng metadata kỹ thuật độc lập.

**Cập nhật `server/prisma/schema.prisma`:**

```prisma
model Debt {
  // ... các field hiện tại
  status                 String    @default("ACTIVE") // Chỉ dùng ACTIVE hoặc SETTLED
  
  // ── Smart Deletion System ──
  deletedAt              DateTime? // Thời điểm user thực hiện xoá mềm
  scheduledPurgeAt       DateTime? // Thời điểm Cronjob sẽ Hard Delete (Không phụ thuộc múi giờ)
  deleteReason           String?   // Lý do xoá: "WRONG_INFO", "AVOIDANCE"...
  deleteCommitment       Boolean   @default(false) // Trạng thái đã xác nhận rủi ro
}
```

*Lưu ý: Bảng `Payment` vẫn giữ nguyên `onDelete: Cascade` với `Debt`. Khi `Debt` bị Hard Delete bởi hệ thống dọn dẹp, toàn bộ lịch sử thanh toán liên quan sẽ bị xoá vĩnh viễn theo.*

---

## 3. Luồng Hoạt Động Cốt Lõi (Core Workflow)

### Case A: Khoản nợ ĐÃ GIẢI QUYẾT (Balance = 0)
Đây là dữ liệu lịch sử. Việc xoá mang tính chất dọn dẹp giao diện.
1. **Trigger**: Người dùng bấm xoá.
2. **UI**: Bật Modal nhỏ xác nhận: *"Bạn có chắc muốn đưa khoản nợ này vào thùng rác?"*
3. **Backend**:
   - `deletedAt = now()`
   - `scheduledPurgeAt = now() + X days` (Tuỳ gói dịch vụ: Free 15 ngày, Pro 90 ngày).
4. **UX**: Hiển thị Toast thông báo thành công và có nút **[Hoàn tác]**.

### Case B: Khoản nợ CHƯA GIẢI QUYẾT (Balance > 0)
Đây là hành động nguy hiểm. Xoá khoản nợ này làm thay đổi cấu trúc tài chính và điểm tín dụng ảo.
1. **Trigger**: Người dùng bấm xoá.
2. **UI (Friction Design)**: Bật Modal "Danger Zone" màu đỏ.
   - Bắt buộc chọn **Lý do xoá**.
   - Bắt buộc tick chọn Checkbox **Cam kết**: *"Tôi hiểu việc xoá này làm sai lệch biểu đồ tài chính và tư vấn AI."*
3. **Backend**: Ghi nhận `deletedAt`, tính `scheduledPurgeAt` và lưu `deleteReason`.

---

## 4. Kiến Trúc UI/UX (Frontend)

Trong trang Tổng quan/Quản lý nợ (`/debts`), thiết kế UI cần phân tách rõ ràng các trạng thái của khoản nợ thành các khu vực hiển thị (Views) khác nhau bằng kỹ thuật **State Filtering** (thay vì nhảy trang):

1. **Tab Đang Nợ (ACTIVE)**: Khu vực mặc định. Chỉ hiển thị các khoản nợ có `status = 'ACTIVE'` và `deletedAt = null`.
2. **Tab Đã Tất Toán (PAID)**: Hiển thị như một khu vực "Thành tựu" (Achievement). Chỉ load các khoản nợ có `status = 'PAID'` và `deletedAt = null`.
3. **Thùng Rác (TRASH)**: Hiển thị như một công cụ hệ thống (system tool) ở góc màn hình. Nơi chứa các khoản nợ bị Xoá Mềm (`deletedAt != null`), chờ được khôi phục hoặc chờ Purge vĩnh viễn.

*Cách bố trí lý tưởng (Premium UX)*: Dùng Segmented Control `[ Đang nợ ] | [ Đã tất toán ]` ngay cạnh Tiêu đề trang, và đặt nút `[ 🗑️ Thùng rác ]` nhỏ gọn cạnh nút cấu hình Grid/List.

---

## 5. Hệ Luỵ Hệ Thống & Middleware (System Impact)

Để không cần phải đi sửa từng query `findMany` trong toàn bộ Project, chúng ta sử dụng **Prisma Client Extension** như một lớp khiên bảo vệ (Shield) ở mức Global.

### Prisma Middleware / Extension
Mọi truy vấn lấy danh sách nợ sẽ tự động loại bỏ các khoản nợ trong thùng rác:

```javascript
// server/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient().$extends({
  query: {
    debt: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      },
      async count({ args, query }) {
        args.where = { ...args.where, deletedAt: null };
        return query(args);
      }
    }
  }
});
```

### Module Cố vấn Đầu tư AI (AI Advisor)
Áp dụng khái niệm **Shadow DTI**:
- UI Dashboard hiển thị DTI (Debt-to-Income) loại trừ rác.
- Module AI nhận 2 thông số: `DTI bình thường` và `Tổng dư nợ trong Thùng rác`.
- Nếu có nợ rác, AI phải đính kèm Disclaimer: *"AI đang tư vấn với giả định bạn không còn trách nhiệm với khoản nợ đang nằm trong thùng rác."*

---

## 6. Dọn Dẹp Tự Động & Khôi Phục (Garbage Collection)

### Khôi phục (Restore)
- Cung cấp trang `/debts/trash`.
- API `/restore` chỉ đơn giản là `UPDATE deletedAt = null, scheduledPurgeAt = null`.

### Hard Delete (The Purge)
Cronjob chạy mỗi đêm lúc `02:00 AM`. Không cần quan tâm Timezone vì đã có `scheduledPurgeAt` (lưu chuẩn UTC trong DB).

```javascript
// Worker chạy ngầm
import cron from 'node-cron';

cron.schedule('0 2 * * *', async () => {
  const now = new Date();
  
  // HARD DELETE an toàn và tự động
  await prisma.debt.deleteMany({
    where: {
      scheduledPurgeAt: {
        lte: now
      }
    }
  });
  
  console.log('[CRON] Đã dọn dẹp các khoản nợ quá hạn lưu trữ.');
});
```

---
*Tài liệu này được soạn thảo dựa trên quy chuẩn System Design của các nền tảng FinTech Enterprise.*
