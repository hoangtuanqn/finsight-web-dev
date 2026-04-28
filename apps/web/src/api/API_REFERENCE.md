# 📡 API Reference - Client (`src/api/index.js`)

> Tất cả các request đều dùng **Axios** và được gắn base URL từ biến môi trường `VITE_API_URL` (mặc định: `/api`).
> Auth token được tự động đính kèm vào header `Authorization: Bearer <token>` (lấy từ `localStorage` key `finsight_token`).

---

## 🔐 Auth - `authAPI`

| Hàm              | Method | Endpoint         | Mô tả                       |
| ---------------- | ------ | ---------------- | --------------------------- |
| `register(data)` | POST   | `/auth/register` | Đăng ký tài khoản mới       |
| `login(data)`    | POST   | `/auth/login`    | Đăng nhập                   |
| `me()`           | GET    | `/auth/me`       | Lấy thông tin user hiện tại |
| `logout()`       | POST   | `/auth/logout`   | Đăng xuất                   |

---

## 👤 User - `userAPI`

| Hàm                   | Method | Endpoint                        | Mô tả                     |
| --------------------- | ------ | ------------------------------- | ------------------------- |
| `getProfile()`        | GET    | `/users/profile`                | Lấy hồ sơ người dùng      |
| `updateProfile(data)` | PUT    | `/users/profile`                | Cập nhật hồ sơ            |
| `getNotifications()`  | GET    | `/users/notifications`          | Lấy danh sách thông báo   |
| `markRead(id)`        | PUT    | `/users/notifications/:id/read` | Đánh dấu thông báo đã đọc |
| `markAllRead()`       | DELETE | `/users/notifications/read-all` | Đánh dấu tất cả đã đọc    |

---

## 💳 Debts - `debtAPI`

| Hàm                        | Method | Endpoint                | Mô tả                             |
| -------------------------- | ------ | ----------------------- | --------------------------------- |
| `getAll()`                 | GET    | `/debts`                | Lấy tất cả khoản nợ               |
| `create(data)`             | POST   | `/debts`                | Tạo khoản nợ mới                  |
| `getById(id)`              | GET    | `/debts/:id`            | Lấy chi tiết khoản nợ             |
| `update(id, data)`         | PUT    | `/debts/:id`            | Cập nhật khoản nợ                 |
| `delete(id)`               | DELETE | `/debts/:id`            | Xóa khoản nợ                      |
| `logPayment(id, data)`     | POST   | `/debts/:id/payments`   | Ghi nhận thanh toán               |
| `getRepaymentPlan(params)` | GET    | `/debts/repayment-plan` | Lấy kế hoạch trả nợ               |
| `getEarAnalysis()`         | GET    | `/debts/ear-analysis`   | Phân tích lãi suất thực (EAR)     |
| `getDtiAnalysis()`         | GET    | `/debts/dti`            | Phân tích tỷ lệ nợ/thu nhập (DTI) |

---

## 📈 Investment - `investmentAPI`

| Hàm                          | Method | Endpoint                      | Mô tả                   |
| ---------------------------- | ------ | ----------------------------- | ----------------------- |
| `getProfile()`               | GET    | `/investment/profile`         | Lấy hồ sơ đầu tư        |
| `createProfile(data)`        | POST   | `/investment/profile`         | Tạo hồ sơ đầu tư        |
| `updateProfile(data)`        | PUT    | `/investment/profile`         | Cập nhật hồ sơ đầu tư   |
| `getAllocation(params)`      | GET    | `/investment/allocation`      | Lấy phân bổ danh mục    |
| `getHistory()`               | GET    | `/investment/history`         | Lịch sử đầu tư          |
| `submitRiskAssessment(data)` | POST   | `/investment/risk-assessment` | Nộp bài đánh giá rủi ro |
| `getCryptoPrices()`          | GET    | `/investment/crypto-prices`   | Giá crypto              |
| `getStockPrices(params)`     | GET    | `/investment/stock-prices`    | Giá cổ phiếu            |
| `getGoldPrices()`            | GET    | `/investment/gold-prices`     | Giá vàng                |
| `getSavingsRates(params)`    | GET    | `/investment/savings-rates`   | Lãi suất tiết kiệm      |
| `getBondsRates(params)`      | GET    | `/investment/bonds-rates`     | Lãi suất trái phiếu     |

---

## 🌐 Market - `marketAPI`

| Hàm              | Method | Endpoint            | Mô tả                |
| ---------------- | ------ | ------------------- | -------------------- |
| `getSentiment()` | GET    | `/market/sentiment` | Tâm lý thị trường    |
| `getPrices()`    | GET    | `/market/prices`    | Giá thị trường       |
| `getNews()`      | GET    | `/market/news`      | Tin tức thị trường   |
| `getSummary()`   | GET    | `/market/summary`   | Tổng quan thị trường |

---

## 🤖 Agentic AI - `agenticAPI`

| Hàm                 | Method | Endpoint                | Mô tả                    |
| ------------------- | ------ | ----------------------- | ------------------------ |
| `getSessions()`     | GET    | `/agentic/sessions`     | Lấy danh sách session AI |
| `getSession(id)`    | GET    | `/agentic/sessions/:id` | Lấy chi tiết session     |
| `deleteSession(id)` | DELETE | `/agentic/sessions/:id` | Xóa session              |

---

## ⚙️ Cách sử dụng

```js
import { authAPI, debtAPI, investmentAPI } from "@/api";

// Đăng nhập
const res = await authAPI.login({ email, password });

// Lấy danh sách nợ
const debts = await debtAPI.getAll();

// Lấy giá crypto
const crypto = await investmentAPI.getCryptoPrices();
```

> **Lưu ý:** Token sẽ tự động được gửi kèm nếu đã lưu vào `localStorage` với key `finsight_token`.
