import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';
import { TOTPService } from '../utils/totp';

export async function setup2FA(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });

    if (!user) return error(res, 'User not found', 404);

    // Nếu đã bật rồi thì không cho setup lại trừ khi tắt đi
    if (user.isTwoFactorEnabled) {
      return error(res, '2FA is already enabled', 400);
    }

    const secret = TOTPService.generateSecret();
    const uri = TOTPService.generateURI(user.email, 'FinSight', secret);
    const qrCode = await TOTPService.generateQRCode(uri);

    // Lưu tạm secret vào DB nhưng chưa bật isTwoFactorEnabled
    await (prisma as any).user.update({
      where: { id: req.userId },
      data: { twoFactorSecret: secret },
    });

    return success(res, { qrCode, secret });
  } catch (err) {
    console.error('setup2FA error:', err);
    return error(res, 'Internal server error');
  }
}

export async function enable2FA(req: AuthenticatedRequest, res: Response) {
  try {
    const { token } = req.body;
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });

    if (!user || !user.twoFactorSecret) {
      return error(res, '2FA setup not initialized', 400);
    }

    const isValid = TOTPService.verifyToken(token, user.twoFactorSecret);
    if (!isValid) {
      return error(res, 'Invalid OTP code', 400);
    }

    const backupCodes = TOTPService.generateBackupCodes();

    await (prisma as any).user.update({
      where: { id: req.userId },
      data: {
        isTwoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    });

    return success(res, { backupCodes });
  } catch (err) {
    console.error('enable2FA error:', err);
    return error(res, 'Internal server error');
  }
}

export async function disable2FA(req: AuthenticatedRequest, res: Response) {
  try {
    const { token } = req.body; // Yêu cầu OTP để tắt
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });

    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return error(res, '2FA is not enabled', 400);
    }

    const isValid = TOTPService.verifyToken(token, user.twoFactorSecret);
    if (!isValid) {
      return error(res, 'Invalid OTP code', 400);
    }

    await (prisma as any).user.update({
      where: { id: req.userId },
      data: {
        isTwoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    return success(res, { message: '2FA disabled successfully' });
  } catch (err) {
    console.error('disable2FA error:', err);
    return error(res, 'Internal server error');
  }
}

export async function verify2FALogin(req: Request, res: Response) {
  try {
    const { tempToken, otpCode, trustDevice } = req.body;

    if (!tempToken || !otpCode) {
      return error(res, 'Missing required fields', 400);
    }

    // Verify temp token
    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, (process.env.JWT_SECRET as string).trim());
    } catch (err) {
      return error(res, 'Invalid or expired session', 401);
    }

    if (!decoded.isTemp) {
      return error(res, 'Invalid session type', 401);
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) return error(res, 'User not found', 404);

    let isValid = false;

    // Check OTP
    if (user.twoFactorSecret) {
      isValid = TOTPService.verifyToken(otpCode, user.twoFactorSecret);
    }

    // Check Backup Codes if OTP failed
    if (!isValid && user.twoFactorBackupCodes) {
      const backupCodes = JSON.parse(user.twoFactorBackupCodes);
      const codeIndex = backupCodes.indexOf(otpCode.toUpperCase());
      if (codeIndex !== -1) {
        isValid = true;
        // Xoá mã backup đã dùng
        backupCodes.splice(codeIndex, 1);
        await (prisma as any).user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
        });
      }
    }

    if (!isValid) {
      return error(res, 'Invalid OTP or backup code', 401);
    }

    // Generate real JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, (process.env.JWT_SECRET as string).trim(), {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    });

    let trustToken = null;
    if (trustDevice) {
      // Logic tin cậy thiết bị
      const userAgent = req.headers['user-agent'] || 'unknown';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // Tin cậy 30 ngày

      const device = await (prisma as any).trustedDevice.create({
        data: {
          userId: user.id,
          userAgent,
          token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          expiresAt,
        },
      });
      trustToken = device.token;
    }

    const { password: _, twoFactorSecret: __, ...userData } = user;

    return success(res, {
      user: userData,
      token,
      trustToken,
    });
  } catch (err) {
    console.error('verify2FALogin error:', err);
    return error(res, 'Internal server error');
  }
}

export async function trustDevice(req: AuthenticatedRequest, res: Response) {
  try {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Tin cậy 30 ngày

    const device = await (prisma as any).trustedDevice.create({
      data: {
        userId: req.userId,
        userAgent,
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        expiresAt,
      },
    });

    return success(res, { trustToken: device.token });
  } catch (err) {
    console.error('trustDevice error:', err);
    return error(res, 'Internal server error');
  }
}
