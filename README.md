<div align="center">
  <img src="https://img.shields.io/badge/WDA-2026-CA4245?style=for-the-badge" alt="WDA 2026" />
  <h1>FINSIGHT — AI FINANCIAL ADVISOR</h1>
  <p><b>Giải pháp Quản lý Tài chính Chủ động & Cố vấn Đầu tư Thông minh</b></p>
</div>

> **Đề tài dự thi WebDev Adventure 2026 (WDA2026) — Chủ đề: Tài chính**

---

## 1. Tổng quan Dự án (Executive Summary)
**FinSight** là một nền tảng Web Application được thiết kế như một **"Cố vấn Tài chính Ảo"**. Ứng dụng tập trung xử lý hai nỗi đau lớn nhất (pain-points) của giới trẻ hiện nay: **Bẫy tín dụng tiêu dùng (Debt Trap)** và **Hội chứng Tê liệt Phân tích trong Đầu tư (Analysis Paralysis)**. 

Bằng cách áp dụng các mô hình tài chính thực tế và Dữ liệu Cảm xúc Thị trường (Market Sentiment), FinSight vạch trần các "chi phí ẩn" của nợ xấu, đồng thời tự động hóa lộ trình gỡ nợ và phân bổ tài sản an toàn chống tình trạng lạm phát. Dự án được lập trình 100% bằng code từ đầu (zero no-code tools), sở hữu UI/UX đậm chất SaaS chuyên nghiệp, đảm bảo sự mượt mà cho trải nghiệm Pitching/Demo.

---

## 2. Các Nền tảng Lý thuyết Tài chính (Financial Concepts)
Dự án không chỉ là một ứng dụng CRUD đơn thuần. Chúng tôi áp dụng trực tiếp các kiến thức Tài chính chuyên sâu làm Hệ tư tưởng (Core Engine) cho hệ thống:

- **EAR (Effective Annual Rate):** Khác với APR (danh nghĩa), EAR bóc trần sự thật về tác động của **Lãi kép (Compounding)** cùng các loại *Phí ẩn (Phí bảo hiểm, Phí làm hồ sơ)*. 
- **DTI Ratio (Tỷ lệ Dư nợ trên Thu nhập):** Công cụ đo lường sức khỏe dòng tiền. Đóng vai trò như "chỉ báo màu vàng/đỏ" cho khả năng thanh khoản của cá nhân.
- **Rủi ro Domino (Domino Effect):** Dạng khủng hoảng nợ dây chuyền (vay mới trả cũ) khi nhiều khoản tín dụng đáo hạn dồn dập.
- **Snowball & Avalanche Strategy:** Hai chiến lược tất toán nợ khoa học. *Snowball (Quả cầu tuyết)* đánh vào động lực tâm lý, *Avalanche (Tuyết lở)* chặn đứng sự bào mòn của lãi suất cao.
- **Market Sentiment (Fear & Greed Index):** Định hướng dòng tiền dựa trên tâm lý đám đông, phân bổ tài sản nghịch vòng chu kỳ để phòng vệ rủi ro.

---

## 3. Phân tích Module Nghiệp vụ (Core Modules)

### 📊 3.1. Module Quản Lý Nợ (Debt Management) - *Xóa bỏ "Bẫy Tín Dụng"*
Đây là module cốt lõi phân tích sức khỏe khoản vay của người dùng, mang lại cái nhìn minh bạch tuyệt đối về nợ gốc và lãi.
- **Tổng kết & Thống kê Dư nợ (Debt Dashboard):** Quản lý và trực quan hóa toàn bộ số dư nợ từ nhiều nguồn (Thẻ tín dụng, SPayLater, MoMo...). Đo lường sức túng quẫn qua **Chỉ số DTI**.
- **Phân tích Lãi suất thực tế (EAR X-Ray):** So sánh bằng đồ thị diện tích giữa APR và EAR, bóc tách toàn bộ **Chi phí ẩn** tạo ra vòng lặp nợ nần.
- **Chiến lược Trả nợ Tự động (Repayment Simulator):** Thuật toán mô phỏng chặng đường tất toán trong 3 năm tới bằng phương pháp **Avalanche** hoặc **Snowball** phụ thuộc vào "Extra Budget" cố định hàng tháng.
- **Hệ thống Cảnh báo Thông minh (Smart Alerts & Cron Jobs):** Tự động quét dữ liệu định kỳ để bảo vệ người dùng:
  - **Sắp đáo hạn (DUE_DATE):** Cảnh báo khi khoản nợ cách ngày thanh toán <= 3 ngày. Tự động chuyển cấp độ **KHẨN CẤP** khi chỉ còn 1 ngày để hối thúc hành động.
  - **Rủi ro Domino (DOMINO_RISK):** Thuật toán phát hiện sớm nguy cơ vỡ nợ chuỗi khi có >= 2 nợ đáo hạn cùng tuần hoặc chỉ số DTI vượt ngưỡng an toàn (50%).
  - **Đa kênh:** Tích hợp thông báo In-app và hệ thống **Email Service (Mailtrap/SMTP)** chuyên nghiệp với template hiện đại.
- **Thêm & Sửa nợ linh hoạt:** Tích hợp Chatbot AI/OCR để trích xuất hóa đơn và giao diện chỉnh sửa thông số nợ/phí ẩn chuyên sâu.

### 📈 3.2. Module Cố vấn Đầu tư (Investment Advisor) - *Kiến tạo Dòng tiền*
Module đóng vai trò "kiến trúc sư trưởng" phân bổ tài sản thông minh dựa trên định lượng dữ liệu thay vì cảm tính:
- **Cập nhật & Nghiên cứu Thị trường:** Phân tích thời gian thực qua Public API (CoinGecko, Alternative.me, NewsAPI) các loại tài sản cốt lõi: **Vàng SJC, Crypto (Bitcoin), Chứng khoán (VNIndex)** và Tin tức vĩ mô.
- **Thống kê Cảm xúc Thị trường (Fear & Greed Index):** Đo lường tâm lý đám đông (Sợ hãi, Trung lập, Tham lam) để làm đầu vào (input) cho thuật toán.
- **Khảo sát Hồ sơ Rủi ro (Risk Profile):** Đánh giá khẩu vị rủi ro qua trắc nghiệm đi kèm thông số cá nhân cốt lõi: 
  - Số vốn hiện có và Dòng tiền nhàn rỗi (Monthly Add).
  - Mục tiêu tài chính và Thời gian đầu tư.
- **Ma trận Phân bổ Động (Dynamic Allocation Engine):** Tự động đưa ra cấu trúc tỷ lệ % cho danh mục (Tiết kiệm, Vàng, Cổ phiếu, Trái phiếu, Crypto) dựa trên sự giao thoa giữa **Khẩu vị rủi ro cá nhân** và **Tâm lý thị trường** *(Mua khi sợ hãi, phòng thủ chốt lời khi tham lam tột độ)*.
- **Mô phỏng/Giả lập Lợi nhuận (Portfolio Projection):** Chạy mô phỏng tài sản tương lai trong khung 1 năm, 3 năm, 5 năm, 10 năm theo Tỷ suất sinh lời kỳ vọng (Expected Return) của danh mục.
- **Cảnh báo Tái cơ cấu (Auto-Rebalance):** Hệ thống tiến trình ngầm (Background Jobs) gửi cảnh báo Notification/Email khi thị trường biến động mạnh nhằm nhắc nhở người dùng cấu trúc lại danh mục.

### 🛠 3.3. Các Tính năng Toàn hệ thống
| Chức năng | Phân hệ | Tình trạng |
| :--- | :--- | :---: |
| **Authentication System** | Xác thực JWT bảo mật cường độ cao | `Hoàn tất` |
| **Unified Dashboard** | Tóm lược Net Worth và Báo cáo Tổng | `Hoàn tất` |
| **Theming (Dark/Light)** | CSS Variables linh hoạt chuẩn SaaS | `Hoàn tất` |
| **Responsive UI/UX** | Framer Motion cho trải nghiệm Flow mượt mà | `Hoàn tất` |

---

## 4. Công nghệ sử dụng (Tech Stack)
Dự án được triển khai bằng các giải pháp hiệu suất cao và chuẩn Công nghiệp:

❖ **Frontend:**
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Framer](https://img.shields.io/badge/Framer_Motion-white?style=for-the-badge&logo=framer&logoColor=black)

❖ **Backend:**
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)

❖ **Database & DevOps:**
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

---

## 5. Sơ đồ Hệ thống (Architecture Diagrams)

### 5.1 Kiến trúc Client - Server
```mermaid
graph TD
    Client[Client Browser - React] <-->|HTTP/REST| Server[API Express Server]
    Server <--> Database[(PostgreSQL - Prisma)]
    Server <--> Cache[(Redis Server)]
    
    subgraph Architecture
        UI[Tailwind & UI Components]
        Logic[Controllers & Services Logic]
    end
```

### 5.2 Luồng Logic Phân tích Nợ (Avalanche / EAR)
```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend App
    participant B as Backend API
    participant DB as System DB

    U->>F: Khai báo Hợp đồng Tín dụng
    F->>B: Gửi data (APR, Kỳ hạn, Số tiền, Phí ẩn)
    Note over B: Engine Tính toán: <br/> Phân tích DTI & Tính giá trị EAR
    B->>DB: Trích xuất lịch sử nợ
    B-->>F: Gửi về Bảng so sánh EAR vs APR
    F-->>U: Hiển thị Biểu đồ Area Chart
    Note over U,F: Đề xuất Chạy Mô phỏng (Simulator) <br/>Phương án Avalanche vs Snowball
```

---

## 6. Khởi chạy & Triển khai Local (Setup Guide)

Yêu cầu máy tính cài sẵn Node.js (Phiên bản v18+) và PostgreSQL/Redis.

**Bước 1: Clone dự án**
```bash
git clone https://github.com/maaitlunghau/finance-webdev-adventure.git
cd finance-webdev-adventure
```

**Bước 2: Chạy API Server (Backend)**
```bash
cd server
npm install
npm run dev
# Server lắng nghe tại cổng http://localhost:5001
```

**Bước 3: Chạy Client (Frontend)**
*(Mở tab Terminal mới)*
```bash
cd client
npm install
npm run dev
# Dashboard mở tại http://localhost:5173
```

---

## 7. Tính Đổi mới & Định vị Sản phẩm
- **UX phi tập trung:** Không sử dụng các Template Bootstrap lỗi thời, FinSight đầu tư vào trải nghiệm tinh tế nhờ Design Tokens và Component Re-usability của hệ sinh thái React.
- **Chuyên môn Sâu sắc:** 100% logic thuật toán tài chính (EAR, DTI, Cảm xúc thị trường) được code thủ công, tạo ra "giá trị khai sáng" cho người dùng khi đối diện với các báo cáo số liệu khô khan truyền thống.
- **Sẵn sàng chinh chiến:** Luồng Flow UX đã khóa và tối ưu hoàn thành; tích hợp các chế độ *Demo* để trực quan hóa trong ngày Demo Day của cuộc thi. 
