import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  body: any;
  params: any;
  query: any;
  headers: any;
  files?: any;
  ip: string;
  on: any;
}
