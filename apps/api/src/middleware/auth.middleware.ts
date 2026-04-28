import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized — token required', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch {
    return error(res, 'Unauthorized — invalid token', 401);
  }
}
