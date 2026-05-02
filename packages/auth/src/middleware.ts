import { NextFunction, Request, Response } from 'express';
import { can, Permission } from './permissions';

export interface AuthRequest extends Request {
  userRole?: string;
  userId?: string;
}

export function requirePermission(permission: Permission) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    // In a real app, role would be extracted from JWT payload
    const role = req.userRole || 'personal';
    if (!can(role as any, permission)) {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
}
