import redis from '../lib/redis.js';
import { error } from '../utils/apiResponse.js';

/**
 * Redis-based rate limiter for agentic endpoints.
 * Limit: 20 requests per minute per user.
 * Graceful fallback: if Redis unavailable, allow through.
 */
export function agenticRateLimit(req, res, next) {
  if (!redis) return next(); // No Redis → skip rate limiting

  const key = `ratelimit:agentic:${req.userId}`;
  const LIMIT = 20;
  const WINDOW_SECONDS = 60;

  redis.multi()
    .incr(key)
    .expire(key, WINDOW_SECONDS)
    .exec()
    .then(results => {
      const currentCount = results[0][1];
      
      res.setHeader('X-RateLimit-Limit', LIMIT);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, LIMIT - currentCount));

      if (currentCount > LIMIT) {
        return error(res, 'Bạn đang gửi quá nhiều yêu cầu, vui lòng đợi 1 phút.', 429);
      }
      next();
    })
    .catch(() => {
      // Redis error → allow through gracefully
      next();
    });
}
