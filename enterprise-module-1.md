# Plan: Enterprise Module 1 & Refactoring

## Overview
Dự án yêu cầu refactor codebase hiện tại của `finsight-web-dev` để hỗ trợ phiên bản Enterprise độc lập nhưng chia sẻ hạ tầng chung (Database instance, core logic, UI components, types). Trọng tâm ban đầu là khởi tạo app `web-enterprise` và triển khai **Module 1: Quản Lý Đối Tác (Parties)** ở phía Backend và Frontend.

## Project Type
**WEB** (Bao gồm Frontend Vite/React và Backend Express.js)

## Success Criteria
1. Kiến trúc Monorepo được thiết lập chuẩn với các packages dùng chung (`financial-core`, `auth`, `ui`, `types`).
2. App `web-enterprise` chạy độc lập, giao diện thừa hưởng UI/UX của bản personal.
3. Schema `enterprise` được khởi tạo thành công trên PostgreSQL.
4. CRUD Đối tác (Module 1) hoạt động hoàn chỉnh (hỗ trợ nhiều role, kiểm tra trùng lặp MST, cảnh báo hạn mức, cờ nội bộ).

## Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand/React-Query, React Router.
- **Backend**: Express.js, Prisma (tách riêng Client cho public và enterprise).
- **Tooling**: Bun (package manager mặc định), Turborepo.

## File Structure (Dự kiến)
```text
finsight-web-dev/
├── apps/
│   ├── web/                      (giữ nguyên)
│   ├── web-enterprise/           (Tạo mới từ Vite React TS)
│   └── api/
│       ├── src/routes/enterprise/(Tạo mới)
│       └── prisma/
│           ├── personal.client.ts
│           └── enterprise/schema.prisma (Tạo mới)
├── packages/
│   ├── financial-core/           (Tạo mới, chuyển các hàm utils)
│   ├── auth/                     (Tạo mới, quản lý permission)
│   ├── types/                    (Tạo mới, share TS interfaces)
│   ├── ui/                       (Tạo mới, extract shared components)
│   └── domains/
│       └── enterprise/           (Services cho Enterprise)
```

## Task Breakdown

### Task 1a: Khởi tạo packages/financial-core + auth + types (Phase 1 Refactor)
- **Agent**: `backend-specialist`
- **Skill**: `clean-code`, `architecture`
- **Priority**: P0
- **Dependencies**: Không
- **INPUT**: Code `utils`, `auth` hiện có ở `apps/api`
- **OUTPUT**: 
  - `packages/financial-core/src/ear.ts` (calculateEAR)
  - `packages/financial-core/src/dti.ts` (calculateDTI)
  - `packages/financial-core/src/avalanche.ts` (simulateAvalanche)
  - `packages/auth/src/permissions.ts` (PERMISSIONS map + can)
  - `packages/auth/src/middleware.ts` (requirePermission)
  - `packages/types/src/enterprise.types.ts` (Contract, Party, Approval interfaces)
- **VERIFY**: Các lệnh build ở `apps/api` vẫn chạy bình thường và không báo lỗi unresolved import.

### Task 1b: Extract shared UI components -> packages/ui
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P0
- **Dependencies**: Không
- **INPUT**: Các UI components cốt lõi từ `apps/web`
- **OUTPUT**: Chuyển các component cơ bản như Button, Input, Modal, Table, Chart wrappers sang `packages/ui`
- **VERIFY**: `web-enterprise` import được UI từ `@finsight/ui` thay vì copy file.

### Task 2: Setup Enterprise Prisma schema & 2 Client instances
- **Agent**: `database-architect`
- **Skill**: `database-design`
- **Priority**: P0
- **Dependencies**: Không
- **INPUT**: Yêu cầu từ `MODULE_1.MD` (Bảng `organizations`/`parties`).
- **OUTPUT**: 
  - `apps/api/prisma/enterprise/schema.prisma`
  - `apps/api/src/prisma/enterprise.client.ts` (import từ @prisma/enterprise)
- **VERIFY**: Lệnh `bunx prisma generate` và migrate thành công. Confirm `personalDb` và `enterpriseDb` là 2 instance độc lập, không cross-import.

### Task 3: Build Backend API - Module 1 (Quản lý Đối Tác)
- **Agent**: `backend-specialist`
- **Skill**: `api-patterns`
- **Priority**: P1
- **Dependencies**: Task 2
- **INPUT**: Schema `Party` đã tạo ở Task 2.
- **OUTPUT**: APIs `POST /api/v1/enterprise/parties`, `GET /.../parties`, `PUT /.../parties/:id` xử lý tạo mới, check trùng lặp MST, validate các quy tắc kinh doanh.
- **VERIFY**: Gọi API POST trả về 201 Created và GET lấy được data hợp lệ.

### Task 4: Khởi tạo apps/web-enterprise init + Turbo config
- **Agent**: `frontend-specialist`
- **Skill**: `app-builder`
- **Priority**: P1
- **Dependencies**: Task 1a, 1b
- **INPUT**: Package.json của `apps/web`
- **OUTPUT**: Dự án `apps/web-enterprise` khởi tạo bằng `bun create vite`, update `turbo.json` và `package.json` workspaces ở root để Turbo nhận diện app mới.
- **VERIFY**: Chạy `turbo run dev` từ root khởi động đồng thời web, web-enterprise, và api thành công.

### Task 5: Triển khai UI Module 1 - Giao diện Quản lý Đối Tác
- **Agent**: `frontend-specialist`
- **Skill**: `frontend-design`
- **Priority**: P2
- **Dependencies**: Task 3, Task 4
- **INPUT**: API endpoints và shared components từ `packages/ui`.
- **OUTPUT**: Màn hình danh sách đối tác (Table), Modal tạo mới/chỉnh sửa đối tác có form chứa các trường (MST, Name, Roles, Tín dụng).
- **VERIFY**: Form validate hoạt động đúng. Giao diện tuân thủ quy tắc thiết kế, sử dụng design tokens (Màu chủ đạo, Không sử dụng màu tím - Purple Ban).

## PHASE X: VERIFICATION
- [ ] Chạy `bun run lint` không có lỗi.
- [ ] Security Scan (Script P0) không tìm thấy lỗ hổng.
- [ ] DB Schema enterprise chạy song song, không conflict với bảng public cũ.
- [ ] UI/UX tuân thủ quy tắc "Purple Ban" (Tuyệt đối không dùng mã hex thuộc tone màu tím/violet trong thiết kế UI/UX theo nguyên tắc đã đề ra).
- [ ] Các tác vụ build không bị lỗi dependency.
- [ ] Ghi log commit sử dụng đúng commitlint convention (ví dụ: `feat(enterprise):`, `fix(enterprise):`).
