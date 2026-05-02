import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { error, success } from '../utils/apiResponse';
import { handleUserLoginResponse } from '../utils/auth';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req: Request, res: Response) {
  try {
    const { credential } = req.body;
    if (!credential) return error(res, 'Google credential is required', 400);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return error(res, 'Invalid Google Token', 400);

    const { email, name, picture, sub } = payload;

    let user = await (prisma as any).user.findUnique({ where: { email } });

    if (!user) {
      user = await (prisma as any).user.create({
        data: {
          email,
          fullName: name || email.split('@')[0],
          avatar: picture || null,
          googleId: sub,
        },
      });
    } else {
      if (!user.googleId || !user.avatar) {
        user = await (prisma as any).user.update({
          where: { id: user.id },
          data: { googleId: sub, avatar: user.avatar || picture },
        });
      }
    }

    if (!user.password) {
      const tempToken = jwt.sign({ userId: user.id, isTemp: true }, (process.env.JWT_SECRET as string).trim(), {
        expiresIn: '15m',
      });
      return success(res, { requirePassword: true, tempToken, email: user.email });
    }

    return handleUserLoginResponse(req, res, user);
  } catch (err) {
    console.error('Google Login error:', err);
    return error(res, 'Authentication failed during Google login', 500);
  }
}

export async function getGoogleConfig(req: Request, res: Response) {
  return success(res, { clientId: process.env.GOOGLE_CLIENT_ID });
}
