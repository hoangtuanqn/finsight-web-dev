import { Request, Response } from 'express';
import { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';
import { handleUserLoginResponse } from '../utils/auth';

const FACE_DISTANCE_THRESHOLD = 0.6;
const JWT_SECRET = () => (process.env.JWT_SECRET as string).trim();
const JWT_EXPIRES = () => (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

// GET /api/face/status — check if authenticated user has face registered
export async function getFaceStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await (prisma as any).$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count
      FROM face_descriptors
      WHERE "userId" = ${req.userId}
    `;
    const hasRegistered = Number(count[0]?.count ?? 0) > 0;
    return success(res, { hasRegistered });
  } catch (err) {
    console.error('getFaceStatus error:', err);
    return error(res, 'Internal server error');
  }
}

// POST /api/face/register — save face descriptor for authenticated user
export async function registerFace(req: AuthenticatedRequest, res: Response) {
  try {
    const { descriptor } = req.body as { descriptor: number[] };

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return error(res, 'Invalid face descriptor: must be an array of 128 numbers', 400);
    }

    // Remove existing descriptor(s) for this user before inserting new one
    await (prisma as any).$executeRaw`
      DELETE FROM face_descriptors WHERE "userId" = ${req.userId}
    `;

    const vectorStr = `[${descriptor.join(',')}]`;
    await (prisma as any).$executeRaw`
      INSERT INTO face_descriptors ("id", "userId", descriptor, "createdAt")
      VALUES (
        gen_random_uuid()::text,
        ${req.userId},
        ${vectorStr}::vector,
        NOW()
      )
    `;

    return success(res, { message: 'Face registered successfully' });
  } catch (err) {
    console.error('registerFace error:', err);
    return error(res, 'Internal server error');
  }
}

// POST /api/face/login — match descriptor against all stored, return token or list
export async function faceLogin(req: Request, res: Response) {
  try {
    const { descriptor } = req.body as { descriptor: number[] };

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return error(res, 'Invalid face descriptor', 400);
    }

    const vectorStr = `[${descriptor.join(',')}]`;

    const matches = await (prisma as any).$queryRaw<
      { userId: string; username: string; avatar: string | null; distance: number }[]
    >`
      SELECT
        u.id           AS "userId",
        u."fullName"   AS username,
        u.avatar       AS avatar,
        fd.descriptor  <-> ${vectorStr}::vector AS distance
      FROM face_descriptors fd
      JOIN users u ON u.id = fd."userId"
      WHERE fd.descriptor <-> ${vectorStr}::vector < ${FACE_DISTANCE_THRESHOLD}
      ORDER BY distance ASC
      LIMIT 10
    `;

    if (matches.length === 0) {
      return success(res, { type: 'not_found' });
    }

    if (matches.length === 1) {
      const user = await (prisma as any).user.findUnique({ where: { id: matches[0].userId } });
      if (!user) return error(res, 'User not found', 404);
      return handleUserLoginResponse(req, res, user);
    }

    // Multiple matches — return list for user to pick
    return success(res, {
      type: 'multiple',
      accounts: matches.map((m) => ({
        userId: m.userId,
        username: m.username,
        avatar: m.avatar,
        distance: Number(m.distance).toFixed(4),
      })),
    });
  } catch (err) {
    console.error('faceLogin error:', err);
    return error(res, 'Internal server error');
  }
}

// POST /api/face/select-account — user picks from multiple-match list
// Re-verifies the descriptor against this specific user's stored vector
export async function selectAccount(req: Request, res: Response) {
  try {
    const { userId, descriptor } = req.body as { userId: string; descriptor: number[] };

    if (!userId || !descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
      return error(res, 'Invalid payload', 400);
    }

    const vectorStr = `[${descriptor.join(',')}]`;

    // Re-verify: make sure the descriptor actually matches this specific user
    const verify = await (prisma as any).$queryRaw<{ distance: number }[]>`
      SELECT fd.descriptor <-> ${vectorStr}::vector AS distance
      FROM face_descriptors fd
      WHERE fd."userId" = ${userId}
      ORDER BY distance ASC
      LIMIT 1
    `;

    if (!verify.length || Number(verify[0].distance) >= FACE_DISTANCE_THRESHOLD) {
      return error(res, 'Face verification failed for selected account', 401);
    }

    const user = await (prisma as any).user.findUnique({ where: { id: userId } });
    if (!user) return error(res, 'User not found', 404);

    return handleUserLoginResponse(req, res, user);
  } catch (err) {
    console.error('selectAccount error:', err);
    return error(res, 'Internal server error');
  }
}

// DELETE /api/face/remove — remove face registration for authenticated user
export async function removeFace(req: AuthenticatedRequest, res: Response) {
  try {
    const deleted = await (prisma as any).$executeRaw`
      DELETE FROM face_descriptors WHERE "userId" = ${req.userId}
    `;

    if (Number(deleted) === 0) {
      return error(res, 'No face descriptor registered', 404);
    }

    return success(res, { message: 'Face registration removed successfully' });
  } catch (err) {
    console.error('removeFace error:', err);
    return error(res, 'Internal server error');
  }
}
