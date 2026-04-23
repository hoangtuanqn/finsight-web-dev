# Kế hoạch Thiết kế lại Landing Page

## Mục tiêu
- Xây dựng lại giao diện trang chủ theo hướng tài chính hiện đại (Modern Tech & Crypto) và chuẩn UX/UI.
- Sử dụng hoàn toàn Tailwind CSS cho mọi thao tác style.
- Tối ưu Responsive, đặc biệt tắt bỏ bớt hoạt ảnh nặng trên Mobile.
- Tách components logic gọn gàng, chia ra từng file riêng.
- Chuyển toàn bộ Emojis sang dùng Emojis chuyên nghiệp bằng `lucide-react`.

## Phân chia cấu trúc File Components
Các thư mục con mới sẽ được lưu trữ tại `client/src/pages/LandingPage/components/`.
1. **`Shared.jsx`**: Chứa các custom hooks và wrapper dùng chung. Xử lý tính năng tự động tắt hiệu ứng trên màn hình di động thông qua hook `useIsMobile`.
2. **`Navigation.jsx`**: Thanh Navbar bao gồm Logo, Menu Links, Nút chuyển Dark/Light, CTAs.
3. **`Hero.jsx`**: Vùng màn hình Header lớn gây ấn tượng đầu tiên.
4. **`Problems.jsx`**: Component nêu các vấn đề tài chính hiện nay.
5. **`Features.jsx`**: Liệt kê sâu vào các giải pháp nổi bật cốt lõi của ứng dụng.
6. **`HowItWorks.jsx`**: Cụm số liệu thực tế (Counters) và 3 bước làm quen với App.
7. **`FAQ.jsx`**: Các câu hỏi thường gặp, tích hợp hiệu ứng Accordion mượt mà bằng framer-motion.
8. **`CTA.jsx`**: Banner "Kêu gọi hành động".
9. **`Footer.jsx`**: Phân chia chân trang cuối cùng.
