import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';

export class TOTPService {
  /**
   * Tạo secret key mới cho user
   */
  static generateSecret() {
    return generateSecret();
  }

  /**
   * Tạo URI cho mã QR (dùng cho Google Authenticator, Authy, etc.)
   */
  static generateURI(email: string, issuer: string, secret: string) {
    return generateURI({
      secret,
      label: email,
      issuer
    });
  }

  /**
   * Tạo QR Code dưới dạng DataURL (Base64) để hiển thị ở frontend
   */
  static async generateQRCode(uri: string) {
    try {
      return await QRCode.toDataURL(uri);
    } catch (err) {
      console.error('Error generating QR Code:', err);
      throw new Error('Could not generate QR Code');
    }
  }

  /**
   * Xác thực mã OTP người dùng nhập vào
   */
  static verifyToken(token: string, secret: string) {
    const result = verifySync({ token, secret });
    return result.valid;
  }

  /**
   * Tạo danh sách mã backup (mã dự phòng)
   */
  static generateBackupCodes(count: number = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Tạo mã ngẫu nhiên 6 chữ số
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      codes.push(code);
    }
    return codes;
  }
}
