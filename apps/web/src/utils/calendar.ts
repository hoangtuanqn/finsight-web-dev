/**
 * Utility to generate Google Calendar event links for debt reminders
 */

export function generateGoogleCalendarLink({ name, amount, dueDay, platform, id }) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth(); // 0-indexed

  // If dueDay has already passed this month, schedule for next month
  if (now.getDate() > dueDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  // Create start date (e.g., 9:00 AM on the due day)
  const startDate = new Date(year, month, dueDay, 9, 0, 0);
  const endDate = new Date(year, month, dueDay, 9, 30, 0);

  const formatGCalDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const title = encodeURIComponent(`[FinSight] Trả nợ: ${name}`);
  const details = encodeURIComponent(
    `Cần thanh toán khoản nợ: ${name}\n` +
      `Nền tảng: ${platform}\n` +
      `Số tiền: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}\n\n` +
      `--- \n` +
      `Quản lý tài chính thông minh cùng FinSight Advisor.`,
  );
  const location = encodeURIComponent('Tại ứng dụng ngân hàng/ví điện tử của bạn');
  const dates = `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}
