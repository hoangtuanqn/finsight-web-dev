import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { success, error } from '../utils/apiResponse';
import { handleUserLoginResponse } from '../utils/auth';
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

    return handleUserLoginResponse(req, res, user);
  } catch (err) {
    console.error('Google Login error:', err);
    return error(res, 'Authentication failed during Google login', 500);
  }
}

export async function getGoogleConfig(req: Request, res: Response) {
  return success(res, { clientId: process.env.GOOGLE_CLIENT_ID });
}
