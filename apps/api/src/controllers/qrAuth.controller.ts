import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import redis from '../lib/redis';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

const QR_TTL = 60; // 60 seconds session

export async function generateQR(req: Request, res: Response) {
  try {
    if (!redis) return error(res, 'Dịch vụ xác thực QR tạm thời không khả dụng (Redis Offline)', 503);

    const qrToken = uuidv4();
    const expiresAt = Math.floor(Date.now() / 1000) + QR_TTL;

    await redis.setex(
      `qr:${qrToken}`,
      QR_TTL,
      JSON.stringify({
        status: 'pending',
        userId: null,
      }),
    );

    return success(res, {
      qrToken,
      expiresAt,
    });
  } catch (err) {
    console.error('QR Generate error:', err);
    return error(res, 'Không thể tạo mã QR. Vui lòng thử lại.');
  }
}

export async function checkQRStatus(req: Request, res: Response) {
  try {
    const { token } = req.params;
    if (!redis) return error(res, 'Redis Offline', 503);

    const dataRaw = await redis.get(`qr:${token}`);
    if (!dataRaw) return success(res, { status: 'expired' });

    const data = JSON.parse(dataRaw);

    if (data.status === 'approved' && data.accessToken) {
      await redis.del(`qr:${token}`);
      return success(res, {
        status: 'approved',
        accessToken: data.accessToken,
        user: data.user,
      });
    }

    return success(res, { status: data.status });
  } catch (err) {
    return error(res, 'Lỗi kiểm tra trạng thái QR');
  }
}

export async function markQRScanned(req: AuthenticatedRequest, res: Response) {
  try {
    const { qrToken } = req.body;
    const userId = req.userId;

    if (!redis) return error(res, 'Redis Offline', 503);

    const dataRaw = await redis.get(`qr:${qrToken}`);
    if (!dataRaw) return error(res, 'Phiên đăng nhập đã hết hạn', 410);

    const data = JSON.parse(dataRaw);
    if (data.status !== 'pending') return error(res, 'Mã QR đã được xử lý hoặc không hợp lệ', 400);

    await redis.setex(
      `qr:${qrToken}`,
      QR_TTL,
      JSON.stringify({
        ...data,
        status: 'scanned',
        userId,
      }),
    );

    return success(res, {
      deviceInfo: req.headers['user-agent'] || 'Mobile App',
      requestedAt: new Date().toISOString(),
    });
  } catch (err) {
    return error(res, 'Lỗi xử lý quét mã QR');
  }
}

export async function confirmQRLogin(req: AuthenticatedRequest, res: Response) {
  try {
    const { qrToken, action } = req.body;
    const userId = req.userId;

    if (!redis) return error(res, 'Redis Offline', 503);

    const dataRaw = await redis.get(`qr:${qrToken}`);
    if (!dataRaw) return error(res, 'Phiên đăng nhập đã hết hạn', 410);

    const data = JSON.parse(dataRaw);
    if (data.status !== 'scanned' || data.userId !== userId) {
      return error(res, 'Phiên đăng nhập không hợp lệ hoặc không phải của bạn', 400);
    }

    if (action === 'reject') {
      await redis.del(`qr:${qrToken}`);
      return success(res, { message: 'Đã từ chối yêu cầu đăng nhập' });
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true },
    });

    const accessToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET as string, {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    });

    await redis.setex(
      `qr:${qrToken}`,
      QR_TTL,
      JSON.stringify({
        ...data,
        status: 'approved',
        accessToken,
        user,
      }),
    );

    return success(res, { message: 'Đăng nhập thành công' });
  } catch (err) {
    console.error('QR Confirm error:', err);
    return error(res, 'Lỗi xác nhận đăng nhập');
  }
}
