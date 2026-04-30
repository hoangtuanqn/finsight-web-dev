import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { success } from './apiResponse';

export async function handleUserLoginResponse(req: Request, res: Response, user: any) {
  // Kiểm tra 2FA
  if (user.isTwoFactorEnabled) {
    // Kiểm tra thiết bị tin cậy (Trusted Device)
    const trustToken = req.headers['x-trust-token'];
    if (trustToken) {
      const trusted = await (prisma as any).trustedDevice.findFirst({
        where: {
          userId: user.id,
          token: trustToken as string,
          expiresAt: { gt: new Date() }
        }
      });

      if (trusted) {
        return sendFullLoginResponse(res, user);
      }
    }

    // Yêu cầu 2FA
    const tempToken = jwt.sign(
      { userId: user.id, isTemp: true },
      (process.env.JWT_SECRET as string).trim(),
      { expiresIn: '5m' }
    );

    return success(res, { 
      require2FA: true, 
      tempToken,
      message: 'Two-factor authentication required' 
    });
  }

  return sendFullLoginResponse(res, user);
}

async function sendFullLoginResponse(res: Response, user: any) {
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    (process.env.JWT_SECRET as string).trim(),
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
  );

  const fullUser = await (prisma as any).user.findUnique({
    where: { id: user.id },
    include: { investorProfile: true }
  });

  const { password: _, twoFactorSecret: __, twoFactorBackupCodes: ___, ...userData } = fullUser;
  
  return success(res, { user: userData, token });
}
