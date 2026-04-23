import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import axios from 'axios';

export async function facebookLogin(req, res) {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return error(res, 'Facebook access token is required', 400);

    // Verify token with Facebook Graph API
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );

    const { id, name, email, picture } = fbResponse.data;
    if (!email || !id) return error(res, 'Invalid Facebook Data or Email missing', 400);

    const avatarUrl = picture?.data?.url || null;

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: { email, fullName: name, avatar: avatarUrl, facebookId: id },
      });
    } else {
      // Merge account
      if (!user.facebookId || (!user.avatar && avatarUrl)) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { facebookId: id, avatar: user.avatar || avatarUrl },
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { investorProfile: true }
    });
    
    const { password: _, ...userData } = fullUser;
    
    return success(res, { user: userData, token }, 200);
  } catch (err) {
    console.error('Facebook Login error:', err.response?.data || err.message);
    return error(res, 'Authentication failed during Facebook login', 500);
  }
}

export async function getFacebookConfig(req, res) {
  return success(res, { appId: process.env.FACEBOOK_APP_ID });
}
