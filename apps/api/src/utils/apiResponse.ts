import { Response } from 'express';

export function success(res: Response, data: any, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function error(res: Response, message: string, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function paginated(res: Response, data: any[], total: number, page: number, limit: number) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
