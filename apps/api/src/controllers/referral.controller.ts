import { Response } from 'express';
import { ReferralService } from '../services/referral.service';
import { success, error } from '../utils/apiResponse';
import { AuthenticatedRequest } from '../types';

export class ReferralController {
  /**
   * Lấy thống kê giới thiệu của user
   */
  static async getMyStats(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) return error(res, 'Unauthorized', 401);

      const stats = await ReferralService.getStats(userId);
      return success(res, stats);
    } catch (err: any) {
      console.error('[ReferralController] Error getting stats:', err);
      return error(res, 'Internal server error');
    }
  }

  /**
   * Ghi nhận lượt nhấp link giới thiệu (Public API)
   */
  static async trackClick(req: AuthenticatedRequest, res: Response) {
    try {
      const { code } = req.params;
      const ip = req.ip || req.headers['x-forwarded-for'] as string;
      const userAgent = req.headers['user-agent'];

      await ReferralService.trackClick(code, ip, userAgent);
      
      // Chuyển hướng hoặc trả về success
      // Ở đây ta trả về success, frontend sẽ xử lý logic chuyển hướng nếu cần
      return success(res, { message: 'Click tracked' });
    } catch (err: any) {
      console.error('[ReferralController] Error tracking click:', err);
      return error(res, 'Internal server error');
    }
  }
}
