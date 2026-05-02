Okay, mình tổng hợp thẳng vào đây.

---

## Tổng hợp: FinSight Enterprise Architecture

### 1. Bối cảnh & Vấn đề

Repo `finsight-web-dev` là project dự thi WDA2026 — một Turborepo Monorepo với 2 app hiện tại: `apps/web` (React personal) và `apps/api` (Express). Yêu cầu mới là build thêm module quản lý nợ cho doanh nghiệp mà không làm phình to codebase hiện tại.

**Kết luận cốt lõi:** Đây không phải bài toán thêm feature — đây là 2 product khác nhau dùng chung infrastructure. Nợ cá nhân và hợp đồng doanh nghiệp là 2 domain object khác nhau về bản chất, không thể dùng chung entity.

---

### 2. Cấu trúc thư mục target

```
finsight-web-dev/
│
├── apps/
│   ├── web/                      ← giữ nguyên, personal
│   ├── web-enterprise/           ← NEW, FE riêng cho enterprise
│   └── api/                      ← giữ nguyên core, thêm enterprise routes
│       └── src/
│           ├── routes/
│           │   ├── personal/     ← giữ nguyên
│           │   └── enterprise/   ← NEW
│           ├── middlewares/
│           │   ├── auth.ts       ← giữ nguyên
│           │   └── permission.ts ← NEW
│           └── prisma/
│               ├── personal.client.ts
│               └── enterprise.client.ts ← NEW
│
├── packages/
│   ├── ui/                       ← shared components (Button, Chart, Modal)
│   ├── types/                    ← shared TypeScript types
│   ├── financial-core/           ← NEW, extract algorithms ra đây
│   │   └── src/
│   │       ├── ear.ts
│   │       ├── dti.ts
│   │       ├── avalanche.ts
│   │       └── snowball.ts
│   ├── auth/                     ← NEW, permission system
│   │   └── src/
│   │       ├── permissions.ts
│   │       ├── usePermission.ts
│   │       └── middleware.ts
│   └── domains/
│       ├── personal/             ← giữ nguyên
│       └── enterprise/           ← NEW
│           ├── ContractService.ts
│           ├── ApprovalService.ts
│           ├── OrganizationService.ts
│           ├── CostCenterService.ts
│           └── RepaymentService.ts
```

---

### 3. Database: 1 PostgreSQL instance, 2 schema riêng

Không tách DB hoàn toàn ở giai đoạn này. Dùng PostgreSQL schema separation — migrate độc lập, index độc lập, nhưng vẫn JOIN được khi cần. Khi cần scale thật sự chỉ đổi connection string, không đổi code.

```
PostgreSQL (1 instance)
├── schema: public        ← personal (hiện tại, không đụng)
│   ├── users
│   ├── debts
│   └── alerts
│
└── schema: enterprise    ← NEW
    ├── organizations
    ├── contracts
    ├── contract_approvals
    ├── cost_centers
    ├── disbursements
    └── repayments
```

2 Prisma client tách biệt:

```typescript
// personal.client.ts — schema=public
export const personalDb = new PrismaClient()

// enterprise.client.ts — schema=enterprise
export const enterpriseDb = new PrismaClient()
```

Migrate hoàn toàn độc lập:

```bash
npx prisma migrate dev --schema=prisma/personal/schema.prisma
npx prisma migrate dev --schema=prisma/enterprise/schema.prisma
```

---

### 4. Domain Model — không dùng chung entity Debt

**Personal:** `PersonalDebt` — đơn giản, gắn với 1 user, 1 nguồn vay.

**Enterprise:** `Contract` — có số hợp đồng, bên vay/cho vay, tài sản thế chấp, người ký, approval chain, lịch giải ngân, lịch trả nợ. Hoàn toàn khác về mặt nghiệp vụ.

```prisma
// Enterprise schema — các bảng cốt lõi
model Contract {
  id               String   @id
  contractNumber   String   @unique   // "HD2024/001"
  organizationId   String
  lenderName       String
  principalAmount  Float
  apr              Float
  termMonths       Int
  collateral       String?
  signedBy         String
  status           ContractStatus
  approvals        ContractApproval[]
  disbursements    Disbursement[]
  repayments       Repayment[]
}

model ContractApproval {
  id         String
  contractId String
  approvedBy String
  role       String   // "Kế toán trưởng", "Giám đốc"
  status     ApprovalStatus
}
```

**Nguyên tắc bất di bất dịch:** không thêm nullable column vào bảng cũ, không dùng `isEnterprise: boolean`. Đó là con đường dẫn đến bảng 40 cột với 20 cột null mỗi row.

---

### 5. Permission System — tránh if-role rải lung tung

```typescript
// packages/auth/src/permissions.ts
export const PERMISSIONS = {
  'debt:read':           ['personal', 'enterprise'],
  'debt:write':          ['personal', 'enterprise'],
  'debt:approve':        ['enterprise'],
  'debt:multi-entity':   ['enterprise'],
  'org:manage':          ['enterprise'],
  'report:export-pdf':   ['enterprise'],
} as const

// Dùng trong component
const { can } = usePermission()
{can('debt:approve') && <ApprovalFlow />}

// Dùng trong Express middleware
router.post('/contracts/:id/approve',
  requirePermission('debt:approve'),
  approveController
)
```

---

### 6. Shared — chỉ dùng chung algorithms, không dùng chung entity

Cái thật sự dùng chung là `packages/financial-core` — các hàm tính toán thuần túy không biết đang chạy cho ai:

```typescript
// Cả PersonalDebtService lẫn ContractService đều import hàm này
import { calculateEAR, calculateDTI } from '@finsight/financial-core'
```

Cái **không** dùng chung: DB schema, Service layer, API routes, UI pages.

---

### 7. API Routes — mount tách biệt

```typescript
app.use('/api/v1', personalRouter)          // personal
app.use('/api/v1/enterprise',
  requirePermission('org:manage'),
  enterpriseRouter                           // enterprise
)
```

---

### 8. Dependency rule — một chiều, không vi phạm

```
apps/*  →  packages/domains/*  →  packages/financial-core
                               →  packages/auth
                               →  packages/types
```

`packages/` không bao giờ import từ `apps/`. `financial-core` không import từ `domains`. Vi phạm rule này là dấu hiệu đầu tiên của circular dependency.

---

### 9. Migration path — 3 tháng, không break existing

**Tháng 1, tuần 1–2:** Extract `packages/financial-core` và `packages/auth` từ code cũ. Chạy test — mọi thứ pass y như cũ.

**Tháng 1, tuần 3–4:** Tạo enterprise Prisma schema, chạy migration. Không đụng bảng cũ.

**Tháng 2:** Build `packages/domains/enterprise` + `apps/api/routes/enterprise`. Unit test từng service.

**Tháng 3:** Build `apps/web-enterprise`. Reuse component từ `packages/ui`, gọi enterprise API.
