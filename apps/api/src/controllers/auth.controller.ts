import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { ReferralService } from '../services/referral.service';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';
import { handleUserLoginResponse } from '../utils/auth';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, fullName } = req.body;

    const existing = await (prisma as any).user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await (prisma as any).user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        referralCode: `temp_${Date.now()}`, // Sẽ được cập nhật ngay sau đây
      },
      select: { id: true, email: true, fullName: true, monthlyIncome: true, extraBudget: true, createdAt: true },
    });

    // Tạo mã giới thiệu chính thức cho user mới
    const finalCode = await ReferralService.getOrCreateReferralCode(user.id);

    // Xử lý nếu user này được giới thiệu bởi người khác
    const { referralCode } = req.body;
    if (referralCode) {
      await ReferralService.processReferral(user.id, referralCode);
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, (process.env.JWT_SECRET as string).trim(), {
      expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
    });

    return success(res, { user, token }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Internal server error');
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const user = await (prisma as any).user.findUnique({ where: { email } });
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, 'Invalid email or password', 401);
    }

    // Ghi nhận hoạt động
    await ReferralService.recordActivity(user.id);

    return handleUserLoginResponse(req, res, user);
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Internal server error');
  }
}

export async function me(req: AuthenticatedRequest, res: Response) {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
      include: { investorProfile: true },
    });
    if (!user) return error(res, 'User not found', 404);

    // Ghi nhận hoạt động
    await ReferralService.recordActivity(user.id);
    return success(res, { user });
  } catch (err) {
    console.error('Me error:', err);
    return error(res, 'Internal server error');
  }
}

export async function logout(req: Request, res: Response) {
  return success(res, { message: 'Logged out successfully' });
}

export async function verifyPassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { password } = req.body;
    if (!password) return error(res, 'Vui lòng nhập mật khẩu', 400);

    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId },
    });
    if (!user) return error(res, 'User not found', 404);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return error(res, 'Mật khẩu không chính xác', 401);

    return success(res, { message: 'Xác thực thành công' });
  } catch (err) {
    console.error('Verify password error:', err);
    return error(res, 'Internal server error');
  }
}
