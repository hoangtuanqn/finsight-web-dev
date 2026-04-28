import { Request, Response, NextFunction } from 'express';
import redis from '../lib/redis';

export function cache(keyFn: string | ((req: Request) => string), ttlSeconds: number = 300) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis) return next();

    const key = typeof keyFn === 'function' ? keyFn(req) : keyFn;
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }
    } catch {
      // cache miss, continue
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (redis && res.statusCode === 200) {
        redis.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

export async function invalidateCache(patterns: string[]) {
  if (!redis) return;
  try {
    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }
  } catch {
    // ignore cache errors
  }
}
