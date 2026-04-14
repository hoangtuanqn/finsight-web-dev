import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
      port: process.env.EMAIL_PORT || 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendDebtAlert(to, userName, debtName, dueDay, diffDays) {
    const isUrgent = diffDays <= 1;
    const subject = isUrgent 
      ? `🚨 KHẨN CẤP: Khoản nợ ${debtName} của bạn sắp đáo hạn!` 
      : `📅 Nhắc nhở: Lịch thanh toán nợ ${debtName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f7f9fc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; letter-spacing: -0.5px; }
          .content { padding: 40px; color: #1e293b; line-height: 1.6; }
          .alert-badge { display: inline-block; padding: 6px 12px; border-radius: 99px; background: ${isUrgent ? '#fee2e2' : '#dbeafe'}; color: ${isUrgent ? '#dc2626' : '#2563eb'}; font-weight: 700; font-size: 12px; text-transform: uppercase; margin-bottom: 20px; }
          .debt-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin: 24px 0; }
          .debt-info { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .label { color: #64748b; }
          .value { font-weight: 600; color: #0f172a; }
          .cta-button { display: block; width: 100%; padding: 16px; background: #2563eb; color: white; text-align: center; text-decoration: none; border-radius: 12px; font-weight: 600; margin-top: 30px; transition: background 0.2s; }
          .footer { padding: 30px; text-align: center; color: #94a3b8; font-size: 12px; background: #f1f5f9; }
          .urgent-text { color: #dc2626; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FinSight AI Advisor</h1>
            <p>Bảo vệ sức khỏe tài chính của bạn</p>
          </div>
          <div class="content">
            <span class="alert-badge">${isUrgent ? 'Cảnh báo rủi ro cao' : 'Nhắc nhở quan trọng'}</span>
            <h2>Chào ${userName},</h2>
            <p>Hệ thống AI của FinSight vừa phát hiện bạn có một khoản nợ sắp đến hạn thanh toán. Việc trễ hạn có thể ảnh hưởng đến <strong>điểm tín dụng (CIC)</strong> và gây ra <strong>Hiệu ứng Domino</strong> cho dòng tiền của bạn.</p>
            
            <div class="debt-card">
              <div class="debt-info">
                <span class="label">Tên khoản vay:</span>
                <span class="value">${debtName}</span>
              </div>
              <div class="debt-info">
                <span class="label">Ngày đáo hạn:</span>
                <span class="value">Ngày ${dueDay} hàng tháng</span>
              </div>
              <div class="debt-info">
                <span class="label">Thời gian còn lại:</span>
                <span class="value ${isUrgent ? 'urgent-text' : ''}">${diffDays} ngày</span>
              </div>
            </div>

            <p>Đừng để những khoản phí phạt làm phiền bạn. Hãy kiểm tra ví và thực hiện thanh toán ngay hôm nay!</p>
            
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/debt" class="cta-button">Truy cập Quản lý nợ ngay</a>
          </div>
          <div class="footer">
            &copy; 2026 FinSight Financial Platform. Mọi quyền được bảo lưu.<br>
            Email này được gửi tự động từ hệ thống quản lý tài chính thông minh.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(to, subject, html);
  }

  async sendDominoRiskAlert(to, userName, reason) {
    const subject = `🚨 CẢNH BÁO NGUY CẤP: Rủi ro vỡ nợ chuỗi (Domino Effect)!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #0f172a; margin: 0; padding: 0; color: #f8fafc; }
          .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155; }
          .header { background: #dc2626; padding: 40px; text-align: center; }
          .content { padding: 40px; }
          .danger-box { border-left: 4px solid #dc2626; background: rgba(220, 38, 38, 0.1); padding: 20px; border-radius: 8px; margin: 25px 0; }
          .cta-button { display: block; width: 100%; padding: 18px; background: #dc2626; color: white; text-align: center; text-decoration: none; border-radius: 12px; font-weight: 700; margin-top: 30px; border: none; }
          .footer { padding: 30px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin:0; font-size:32px;">DOMINO RISK!</h1>
          </div>
          <div class="content">
            <h2>Hệ thống phát hiện Nguy hiểm, ${userName}!</h2>
            <p>Hệ thống AI Advisor của FinSight vừa phân tích dòng tiền của bạn và đưa ra cảnh báo <strong>NGUY CẤP</strong> về khả năng thanh khoản.</p>
            
            <div class="danger-box">
              <strong style="color: #ef4444;">Lý do cảnh báo:</strong><br>
              ${reason}
            </div>

            <p style="color: #94a3b8;">Nếu không có kế hoạch tái cơ cấu ngay lập tức, bạn có thể rơi vào trạng thái mất khả năng chi trả toàn hệ thống.</p>
            
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/debt" class="cta-button">XEM KẾ HOẠCH TRẢ NỢ (AVALANCHE)</a>
          </div>
          <div class="footer">
            Bạn nhận được thông báo này vì hệ thống AI phát hiện rủi ro tài chính cao.
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(to, subject, html);
  }

  async send(to, subject, html) {
    try {
      // For Demo: If NO credentials, just log to console
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình. Chỉ ghi log Email ra console.');
        console.log(`[Demo Email] TO: ${to} | SUBJECT: ${subject}`);
        return true;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || `"FinSight AI Advisor" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html
      });
      console.log(`[Email Sent] Thành công tới: ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Email Sending Error:', error);
      return false;
    }
  }
}

export default new EmailService();
