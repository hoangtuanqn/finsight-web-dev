import axios from 'axios';
import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { error, success } from '../utils/apiResponse';
import { handleUserLoginResponse } from '../utils/auth';

export async function facebookLogin(req: Request, res: Response) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return error(res, 'Facebook access token is required', 400);

    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`,
    );

    const { id, name, email, picture } = fbResponse.data;
    if (!email || !id) return error(res, 'Invalid Facebook Data or Email missing', 400);

    const avatarUrl = picture?.data?.url || null;

    let user = await (prisma as any).user.findUnique({ where: { email } });

    if (!user) {
      user = await (prisma as any).user.create({
        data: {
          email,
          fullName: name || email.split('@')[0],
          avatar: avatarUrl,
          facebookId: id,
        },
      });
    } else {
      if (!user.facebookId || (!user.avatar && avatarUrl)) {
        user = await (prisma as any).user.update({
          where: { id: user.id },
          data: { facebookId: id, avatar: user.avatar || avatarUrl },
        });
      }
    }

    return handleUserLoginResponse(req, res, user);
  } catch (err: any) {
    console.error('Facebook Login error:', err.response?.data || err.message);
    return error(res, 'Authentication failed during Facebook login', 500);
  }
}

export async function getFacebookConfig(req: Request, res: Response) {
  return success(res, { appId: process.env.FACEBOOK_APP_ID });
}
