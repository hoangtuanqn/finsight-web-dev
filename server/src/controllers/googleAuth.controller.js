import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { success, error } from '../utils/apiResponse.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
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

    // Check if user exists (to merge accounts)
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      // Create new user, auto-login
      user = await prisma.user.create({
        data: { email, fullName: name, avatar: picture, googleId: sub },
      });
    } else {
      // Merge account if missing googleId or avatar
      if (!user.googleId || !user.avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: sub, avatar: user.avatar || picture },
        });
      }
    }

    // Issue internal token
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
    console.error('Google Login error:', err);
    return error(res, 'Authentication failed during Google login', 500);
  }
}

export async function getGoogleConfig(req, res) {
  return success(res, { clientId: process.env.GOOGLE_CLIENT_ID });
}
