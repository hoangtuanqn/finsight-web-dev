# 🗺️ Client — Tổng quan codebase

> Stack: **React + Vite** · **React Router v6** · **TanStack Query** · **Axios** · **Tesseract.js (OCR)**

---

## 📁 Cấu trúc thư mục

```
src/
├── api/              # Toàn bộ giao tiếp với backend
├── components/       # UI components tái sử dụng
├── context/          # Global state (Auth)
├── hooks/            # Custom React hooks
├── pages/            # Các trang chính
├── utils/            # Hàm tính toán & OCR
└── styles/           # CSS bổ sung
```

---

## 🔀 Routing (`App.jsx`)

| Path | Component | Ghi chú |
|---|---|---|
| `/` | `LandingPage` | Trang giới thiệu công khai |
| `/login` | `LoginPage` | Public route (đã login → redirect) |
| `/register` | `RegisterPage` | Public route |
| `/home` | `DashboardPage` | Cần đăng nhập |
| `/debts` | `DebtOverviewPage` | Danh sách nợ |
| `/debts/add` | `AddDebtPage` | Thêm nợ mới |
| `/debts/ear-analysis` | `EarAnalysisPage` | Phân tích lãi suất thực EAR |
| `/debts/repayment` | `RepaymentPlanPage` | Kế hoạch trả nợ |
| `/debts/dti` | `DtiAnalysisPage` | Phân tích tỷ lệ DTI |
| `/debts/:id` | `DebtDetailPage` | Chi tiết khoản nợ |
| `/debts/:id/edit` | `EditDebtPage` | Chỉnh sửa khoản nợ |
| `/investment` | `InvestmentPage` | Đầu tư & phân bổ danh mục |
| `/risk-assessment` | `RiskAssessmentPage` | Đánh giá khẩu vị rủi ro |
| `/profile` | `ProfilePage` | Hồ sơ người dùng |
| `*` | redirect → `/home` | Fallback |

> **Layout:** Các route cần đăng nhập được bọc trong `<Layout />` (có Sidebar + Header).  
> **PublicRoute:** Tự động redirect sang `/home` nếu đã đăng nhập.

---

## 🔐 Authentication (`context/AuthContext.jsx`)

Global state quản lý user, cung cấp qua hook `useAuth()`.

| Hàm / State | Mô tả |
|---|---|
| `user` | Object user hiện tại (`null` nếu chưa đăng nhập) |
| `loading` | `true` khi đang verify token lúc khởi động app |
| `login(email, password)` | Gọi API → lưu token vào `localStorage` → set `user` |
| `register(email, password, fullName)` | Tương tự login |
| `logout()` | Xóa token khỏi `localStorage`, set `user = null` |
| `setUser(user)` | Cập nhật user thủ công (dùng khi update profile) |

**Token key:** `finsight_token` (localStorage)

```jsx
import { useAuth } from '../context/AuthContext';

const { user, login, logout } = useAuth();
```

---

## 📡 API Layer (`src/api/`)

### `index.js` — Axios instance + các nhóm REST API

Base URL lấy từ `VITE_API_URL` (mặc định `/api`). Token tự động đính kèm qua interceptor.

| Export | Nhóm | Các hàm chính |
|---|---|---|
| `authAPI` | Auth | `login`, `register`, `me`, `logout` |
| `userAPI` | User | `getProfile`, `updateProfile`, `getNotifications`, `markRead`, `markAllRead` |
| `debtAPI` | Debts | `getAll`, `create`, `getById`, `update`, `delete`, `logPayment`, `getRepaymentPlan`, `getEarAnalysis`, `getDtiAnalysis` |
| `investmentAPI` | Investment | `getProfile`, `createProfile`, `updateProfile`, `getAllocation`, `getHistory`, `submitRiskAssessment`, `getCryptoPrices`, `getStockPrices`, `getGoldPrices`, `getSavingsRates`, `getBondsRates` |
| `marketAPI` | Market | `getSentiment`, `getPrices`, `getNews`, `getSummary` |
| `agenticAPI` | Agentic AI | `getSessions`, `getSession`, `deleteSession` |

### `agentic.js` — Streaming chat (SSE)

Dùng **native `fetch` + `ReadableStream`** thay vì Axios vì cần stream real-time.

```js
import { streamChat } from '../api/agentic.js';

await streamChat(
  message,      // string — tin nhắn người dùng
  sessionId,    // string|null — ID session hiện tại
  onToken,      // (token: string) => void — nhận từng chữ streaming
  onDone,       // (meta) => void — kết thúc stream
  onError,      // (err: string) => void — lỗi
  onStatus,     // (status: string) => void — trạng thái tool AI
  imageBase64,  // string|null — ảnh OCR đã encode Base64
);
```

| Hàm | Mô tả |
|---|---|
| `streamChat(...)` | Chat với AI, nhận response theo stream SSE |
| `getSessions()` | Lấy danh sách session chat |
| `getSessionMessages(sessionId)` | Lấy lịch sử chat của session |
| `deleteSession(sessionId)` | Xóa session |

---

## 🪝 Custom Hooks (`src/hooks/`)

### `useAgenticChat()` — Hook quản lý AI Chat

Hook trung tâm cho toàn bộ luồng chat với AI.

| Trả về | Mô tả |
|---|---|
| `messages` | Mảng `{ id, role: 'user'|'assistant', content }` |
| `isStreaming` | `true` khi AI đang trả lời |
| `sessionId` | ID session hiện tại |
| `sessions` | Danh sách session đã lưu |
| `pendingAction` | Payload khi AI muốn tự động điền form |
| `toolStatus` | Text trạng thái ("🤔 Đang suy nghĩ...", tên tool...) |
| `sendMessage(text, ocrText?, displayOverride?)` | Gửi tin nhắn |
| `loadSessions()` | Load danh sách session từ server |
| `loadSession(id)` | Mở lại session cũ |
| `removeSession(id)` | Xóa session |
| `newChat()` | Bắt đầu chat mới |
| `dismissAction()` | Bỏ qua `pendingAction` |

### `useDarkMode()` — Toggle dark/light mode

### `useTour()` — Hướng dẫn onboarding tour

---

## 🧮 Utilities (`src/utils/`)

### `calculations.js` — Tính toán tài chính (chạy ở client)

| Hàm | Mô tả |
|---|---|
| `calcAPY(apr, n=12)` | Tính APY từ APR danh nghĩa |
| `calcEAR(apr, feeProcessing, feeInsurance, feeManagement, termMonths)` | Lãi suất thực tế có tính phí |
| `calcReducingMonthlyPayment(principal, apr, termMonths)` | Trả góp dư nợ giảm dần |
| `calcFlatMonthlyPayment(principal, apr, termMonths)` | Trả góp lãi phẳng |
| `simulateRepayment(debts, extraBudget, method)` | Mô phỏng kế hoạch trả nợ (Avalanche / Snowball) |
| `calcDebtToIncomeRatio(totalMonthly, income)` | Tỷ lệ nợ/thu nhập (DTI %) |
| `detectDominoRisk(debts, income)` | Phát hiện cảnh báo DTI nguy hiểm |
| `getAllocation(profile, sentimentValue)` | Tính phân bổ danh mục đầu tư |
| `getSentimentLabel(value)` | `0-100` → `EXTREME_FEAR / FEAR / NEUTRAL / GREED / EXTREME_GREED` |
| `getSentimentVietnamese(label)` | Dịch label sang tiếng Việt |
| `formatVND(amount)` | Format số tiền VND |
| `formatPercent(value, decimals?)` | Format phần trăm |

**Phân bổ danh mục** dựa trên 3 yếu tố:
- **Risk level:** `LOW / MEDIUM / HIGH`
- **Market sentiment:** `EXTREME_FEAR → EXTREME_GREED`
- **Profile:** horizon (`SHORT/LONG`), goal (`STABILITY/SPECULATION`), capital, savingsRate

### `ocr.js` — OCR quét ảnh trên trình duyệt

Dùng **Tesseract.js** (Web Worker, hỗ trợ Tiếng Việt + Tiếng Anh).

```js
import { runOCR } from '../utils/ocr';

const result = await runOCR(base64Image, (progress) => console.log(progress + '%'));
// result: { success: true, text: '...' }
//      or { success: false, error: '...' }
```

> Worker được tạo 1 lần và tái sử dụng (singleton `sharedWorker`).

---

## 🧩 Components

### Layout
| Component | Mô tả |
|---|---|
| `Layout` | Shell bọc các trang cần auth (Sidebar + Header + Outlet) |
| `Sidebar` | Menu điều hướng trái |
| `Header` | Thanh trên cùng (thông báo, user menu) |
| `PublicRoute` | Redirect nếu đã đăng nhập |
| `ToggleMode` | Nút dark/light mode |

### Common
| Component | Mô tả |
|---|---|
| `MetricCard` | Card hiển thị chỉ số KPI |
| `LoadingSpinner` | Spinner loading |
| `MockMarketControl` | Control giả lập dữ liệu thị trường (dev) |
| `TourButton` | Nút bắt đầu tour hướng dẫn |

### Chat (AI Chatbot)
| Component | Mô tả |
|---|---|
| `AIChatbotModal` | Modal chat chính với AI |
| `ChatHistory` | Sidebar danh sách session cũ |
| `MessageRenderer` | Render markdown message |
| `DebtConfirmModal` | Confirm trước khi AI tự thêm khoản nợ |

### Debt
| Component | Mô tả |
|---|---|
| `EARBreakdown` | Bảng phân tích chi tiết EAR |

### Investment
| Component | Mô tả |
|---|---|
| `SentimentGauge` | Đồng hồ đo tâm lý thị trường |

---

## ⚙️ Cấu hình

| Biến môi trường | Mặc định | Mô tả |
|---|---|---|
| `VITE_API_URL` | `/api` | Base URL của backend API |

**TanStack Query:** `staleTime = 30s`, `retry = 1`

---

## 🔄 Luồng hoạt động chính

```
User mở app
  → AuthContext check localStorage token
  → Nếu có token: gọi /auth/me để verify
  → Nếu hợp lệ: set user, vào /home (DashboardPage)
  → Nếu không: redirect về /login

User chat với AI (AIChatbotModal)
  → useAgenticChat.sendMessage(text)
  → streamChat() gọi POST /agentic/chat
  → Server trả về SSE stream (token từng chữ)
  → AI có thể trả về pendingAction → mở DebtConfirmModal
  → User confirm → tự động thêm nợ vào hệ thống

User upload ảnh hóa đơn
  → runOCR(base64) → Tesseract.js xử lý trong browser
  → Text OCR gửi kèm sendMessage() để AI phân tích
```
