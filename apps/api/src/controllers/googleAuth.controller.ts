import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { OAuth2Client } from 'google-auth-library';

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
          googleId: sub 
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

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      (process.env.JWT_SECRET as string),
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
    );

    const fullUser = await (prisma as any).user.findUnique({
      where: { id: user.id },
      include: { investorProfile: true }
    });
    
    const { password: _, ...userData } = fullUser;
    
    return success(res, { user: userData, token }, 200);
  } catch (err) {
    console.error('Google Login error:', err);
    return error(res, 'Authentication failed during Google login', 500);
  }
}

export async function getGoogleConfig(req: Request, res: Response) {
  return success(res, { clientId: process.env.GOOGLE_CLIENT_ID });
}
