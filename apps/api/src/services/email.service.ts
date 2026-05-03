import nodemailer from 'nodemailer';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendDebtAlert(to: string, userName: string, debtName: string, dueDay: number, diffDays: number) {
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

  async sendDueTodayAlert(to: string, userName: string, debtName: string, dueDay: number, minPayment: number) {
    const subject = `🚨 DANGER: Khoản nợ ${debtName} đến hạn HÔM NAY — tránh phí phạt!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 20px; text-align: center; color: white; }
          .header h1 { margin: 0 0 8px 0; font-size: 28px; }
          .header p { margin: 0; opacity: 0.85; font-size: 14px; }
          .badge { display: inline-block; padding: 5px 14px; border-radius: 99px; background: #fee2e2; color: #dc2626; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
          .content { padding: 40px; color: #e2e8f0; line-height: 1.7; }
          .debt-card { background: rgba(220,38,38,0.08); border: 1px solid rgba(220,38,38,0.3); border-radius: 16px; padding: 24px; margin: 24px 0; }
          .debt-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .label { color: #94a3b8; }
          .value { font-weight: 700; color: #f8fafc; }
          .value-danger { font-weight: 700; color: #ef4444; }
          .warning-box { background: rgba(245,158,11,0.1); border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #fcd34d; }
          .cta-button { display: block; padding: 16px; background: #dc2626; color: white !important; text-align: center; text-decoration: none; border-radius: 12px; font-weight: 700; margin-top: 28px; font-size: 15px; }
          .footer { padding: 24px; text-align: center; color: #475569; font-size: 12px; background: #0f172a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ ĐẾN HẠN HÔM NAY</h1>
            <p>FinSight AI Advisor — Cảnh báo khẩn cấp</p>
          </div>
          <div class="content">
            <span class="badge">DANGER — Hành động ngay</span>
            <h2 style="color:#f8fafc; margin-top:0;">Chào ${userName},</h2>
            <p>Hôm nay là <strong style="color:#ef4444;">ngày đáo hạn</strong> của khoản nợ bên dưới. Nếu chưa thanh toán, bạn sẽ bắt đầu chịu <strong>phí phạt chậm trả</strong> tính theo ngày.</p>

            <div class="debt-card">
              <div class="debt-info">
                <span class="label">Tên khoản vay:</span>
                <span class="value">${debtName}</span>
              </div>
              <div class="debt-info">
                <span class="label">Ngày đáo hạn:</span>
                <span class="value-danger">Ngày ${dueDay} — HÔM NAY</span>
              </div>
              <div class="debt-info">
                <span class="label">Số tiền cần trả tối thiểu:</span>
                <span class="value-danger">${new Intl.NumberFormat('vi-VN').format(minPayment)}đ</span>
              </div>
            </div>

            <div class="warning-box">
              ⚡ Phí phạt chậm trả thường dao động từ 0.05% – 0.1%/ngày trên dư nợ. Thanh toán ngay hôm nay để tránh chi phí ẩn phát sinh.
            </div>

            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/debts" class="cta-button">Thanh toán ngay trên FinSight</a>
          </div>
          <div class="footer">
            &copy; 2026 FinSight Financial Platform. Email tự động từ hệ thống AI giám sát nợ.
          </div>
        </div>
      </body>
      </html>
    `;
    return this.send(to, subject, html);
  }

  async sendOverdueAlert(to: string, userName: string, debtName: string, daysOverdue: number, minPayment: number) {
    const subject = `🔴 CRITICAL: Khoản nợ ${debtName} đã QUÁ HẠN ${daysOverdue} ngày — Phí phạt đang tích lũy!`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', -apple-system, sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #1e293b; border-radius: 20px; overflow: hidden; border: 2px solid #dc2626; }
          .header { background: #0f172a; padding: 40px 20px; text-align: center; color: white; border-bottom: 2px solid #dc2626; }
          .header h1 { margin: 0 0 8px 0; font-size: 30px; color: #ef4444; }
          .header p { margin: 0; color: #94a3b8; font-size: 13px; }
          .badge { display: inline-block; padding: 5px 14px; border-radius: 99px; background: #dc2626; color: white; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
          .content { padding: 40px; color: #e2e8f0; line-height: 1.7; }
          .overdue-banner { background: rgba(220,38,38,0.15); border: 1px solid rgba(220,38,38,0.5); border-radius: 12px; padding: 20px 24px; text-align: center; margin: 20px 0; }
          .overdue-days { font-size: 48px; font-weight: 900; color: #ef4444; line-height: 1; }
          .overdue-label { color: #94a3b8; font-size: 13px; margin-top: 4px; }
          .debt-card { background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; margin: 24px 0; }
          .debt-info { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; }
          .label { color: #64748b; }
          .value { font-weight: 700; color: #f8fafc; }
          .value-danger { font-weight: 700; color: #ef4444; }
          .penalty-box { background: rgba(220,38,38,0.1); border-left: 4px solid #dc2626; padding: 16px 20px; border-radius: 8px; margin: 20px 0; font-size: 13px; color: #fca5a5; }
          .cta-button { display: block; padding: 18px; background: #dc2626; color: white !important; text-align: center; text-decoration: none; border-radius: 12px; font-weight: 800; margin-top: 28px; font-size: 15px; letter-spacing: 0.5px; }
          .footer { padding: 24px; text-align: center; color: #475569; font-size: 12px; background: #0f172a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔴 QUÁ HẠN</h1>
            <p>FinSight AI Advisor — Cảnh báo CRITICAL</p>
          </div>
          <div class="content">
            <span class="badge">CRITICAL — Xử lý ngay lập tức</span>
            <h2 style="color:#f8fafc; margin-top:0;">Chào ${userName},</h2>
            <p>Hệ thống AI FinSight phát hiện khoản nợ của bạn đã <strong style="color:#ef4444;">vượt quá ngày đáo hạn</strong>. Phí phạt đang <strong>tích lũy theo từng ngày</strong>.</p>

            <div class="overdue-banner">
              <div class="overdue-days">+${daysOverdue}</div>
              <div class="overdue-label">ngày quá hạn</div>
            </div>

            <div class="debt-card">
              <div class="debt-info">
                <span class="label">Tên khoản vay:</span>
                <span class="value">${debtName}</span>
              </div>
              <div class="debt-info">
                <span class="label">Số ngày quá hạn:</span>
                <span class="value-danger">${daysOverdue} ngày</span>
              </div>
              <div class="debt-info">
                <span class="label">Số tiền trả tối thiểu:</span>
                <span class="value-danger">${new Intl.NumberFormat('vi-VN').format(minPayment)}đ</span>
              </div>
            </div>

            <div class="penalty-box">
              🔥 <strong>Phí phạt đang tích lũy:</strong> Mỗi ngày trễ hạn, bạn có thể bị tính thêm 0.05% – 0.1% trên tổng dư nợ. Sau ${daysOverdue} ngày, khoản phí này đã đáng kể. Thanh toán ngay để dừng tích lũy!
            </div>

            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/debts" class="cta-button">XỬ LÝ NGAY — Vào FinSight</a>
          </div>
          <div class="footer">
            &copy; 2026 FinSight Financial Platform. Email tự động từ hệ thống AI giám sát nợ.<br>
            Bạn nhận email này vì khoản nợ của bạn đã quá hạn thanh toán.
          </div>
        </div>
      </body>
      </html>
    `;
    return this.send(to, subject, html);
  }

  async sendDominoRiskAlert(to: string, userName: string, reason: string) {
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

  async sendMilestoneCongrats(to: string, userName: string, percent: number, totalPaid: number, totalOriginal: number) {
    const milestoneConfig: Record<number, any> = {
      25: {
        emoji: '🎯',
        color: '#f59e0b',
        title: 'Đã trả được 1/4 tổng nợ!',
        message: 'Bước khởi đầu tuyệt vời — bạn đã đi được 25% chặng đường thoát nợ.',
      },
      50: {
        emoji: '🔥',
        color: '#3b82f6',
        title: 'Nửa đường rồi!',
        message: 'Ấn tượng! Bạn đã xóa được một nửa tổng nợ. Đà tốt, hãy tiếp tục!',
      },
      75: {
        emoji: '⚡',
        color: '#8b5cf6',
        title: 'Chỉ còn 25% nữa là xong!',
        message: 'Gần về đích rồi! 75% tổng nợ đã được thanh toán — đừng dừng lại nhé.',
      },
      100: {
        emoji: '🏆',
        color: '#22c55e',
        title: 'TRẮNG TAY NỢ — Tự do tài chính!',
        message: 'Bạn đã làm được điều phi thường: trả hết 100% nợ! Đây là khoảnh khắc đáng tự hào.',
      },
    };

    const cfg = milestoneConfig[percent] || {
      emoji: '🎉',
      color: '#10b981',
      title: `Đạt cột mốc ${percent}%!`,
      message: `Bạn đã trả được ${percent}% tổng nợ.`,
    };
    const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));
    const remaining = Math.max(0, totalOriginal - totalPaid);
    const barW = Math.min(100, percent);

    const subject = `${cfg.emoji} FinSight: ${cfg.title}`;
    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding:40px 16px;background:#0f172a;">

      <table role="presentation" width="700" cellpadding="0" cellspacing="0" border="0"
             style="max-width:700px;width:100%;border-radius:20px;overflow:hidden;border:1px solid #334155;">
        <tr>
          <td width="240" valign="middle" align="center"
              style="width:240px;background:linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%);
                     padding:40px 28px;border-right:1px solid #334155;
                     border-left:4px solid ${cfg.color};">
            <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight" width="120" style="display:block;margin:0 auto 24px;height:auto;max-width:120px;">
            <div style="font-size:52px;line-height:1;margin-bottom:16px;">${cfg.emoji}</div>
            <p style="margin:0 0 16px;font-size:16px;font-weight:900;color:#f8fafc;line-height:1.35;letter-spacing:-0.3px;text-align:center;">${cfg.title}</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
              <tr>
                <td style="padding:6px 18px;border-radius:99px;background:${cfg.color}22;border:1px solid ${cfg.color}55;">
                  <span style="font-size:14px;font-weight:800;color:${cfg.color};">${percent}% hoàn thành</span>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-size:11px;color:#64748b;text-align:center;">FinSight ghi nhận cột mốc của bạn</p>
          </td>

          <td valign="top" style="background:#1e293b;padding:36px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#e2e8f0;line-height:1.7;">Chào <strong style="color:#f8fafc;">${userName}</strong>,<br>${cfg.message}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:6px;">
              <tr>
                <td style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Tiến độ tổng nợ</td>
                <td align="right" style="font-size:12px;font-weight:800;color:${cfg.color};">${percent}%</td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
              <tr>
                <td style="background:#334155;border-radius:99px;height:8px;padding:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="${barW}%">
                    <tr><td style="height:8px;border-radius:99px;background:linear-gradient(90deg,#ef4444,#f97316,${cfg.color});">&nbsp;</td></tr>
                  </table>
                </td>
              </tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
              <tr>
                <td align="center" width="31%" style="background:#0f172a;border-radius:10px;border:1px solid #334155;padding:12px 6px;">
                  <div style="font-size:14px;font-weight:800;color:${cfg.color};">${fmt(totalPaid)}đ</div>
                  <div style="font-size:10px;color:#64748b;margin-top:3px;">Đã trả</div>
                </td>
                <td width="3%"></td>
                <td align="center" width="31%" style="background:#0f172a;border-radius:10px;border:1px solid #334155;padding:12px 6px;">
                  <div style="font-size:14px;font-weight:800;color:#f8fafc;">${fmt(totalOriginal)}đ</div>
                  <div style="font-size:10px;color:#64748b;margin-top:3px;">Tổng gốc</div>
                </td>
                <td width="3%"></td>
                <td align="center" width="31%" style="background:#0f172a;border-radius:10px;border:1px solid #334155;padding:12px 6px;">
                  <div style="font-size:14px;font-weight:800;color:#f8fafc;">${fmt(remaining)}đ</div>
                  <div style="font-size:10px;color:#64748b;margin-top:3px;">Còn lại</div>
                </td>
              </tr>
            </table>
            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/debts/goal" style="display:block;padding:14px 24px;background:${cfg.color};color:#ffffff;text-decoration:none;border-radius:12px;font-weight:800;font-size:14px;text-align:center;">Xem tiến độ trên FinSight →</a>
            <p style="margin:20px 0 0;font-size:11px;color:#475569;text-align:center;">&copy; 2026 FinSight Financial Platform — Đồng hành cùng hành trình tự do tài chính của bạn.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

    return this.send(to, subject, html);
  }

  async send(to: string, subject: string, html: string) {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('⚠️ EMAIL_USER hoặc EMAIL_PASS chưa được cấu hình. Chỉ ghi log Email ra console.');
        console.log(`[Demo Email] TO: ${to} | SUBJECT: ${subject}`);
        return true;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || `"FinSight AI Advisor" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
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
