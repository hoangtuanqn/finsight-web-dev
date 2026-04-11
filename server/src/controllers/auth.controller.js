import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';

export async function register(req, res) {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return error(res, 'Email, password, and fullName are required', 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return error(res, 'Email already registered', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, fullName },
      select: { id: true, email: true, fullName: true, monthlyIncome: true, extraBudget: true, createdAt: true },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return success(res, { user, token }, 201);
  } catch (err) {
    console.error('Register error:', err);
    return error(res, 'Internal server error');
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return error(res, 'Email and password are required', 400);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return error(res, 'Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return error(res, 'Invalid email or password', 401);
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const { password: _, ...userData } = user;
    return success(res, { user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    return error(res, 'Internal server error');
  }
}

export async function me(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, fullName: true, monthlyIncome: true, extraBudget: true, createdAt: true },
    });
    if (!user) return error(res, 'User not found', 404);
    return success(res, { user });
  } catch (err) {
    console.error('Me error:', err);
    return error(res, 'Internal server error');
  }
}

export async function logout(req, res) {
  return success(res, { message: 'Logged out successfully' });
}
