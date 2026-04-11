import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redis = null;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('Redis: max retries reached, running without cache');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('error', (err) => {
    console.warn('Redis connection error (cache disabled):', err.message);
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  await redis.connect().catch(() => {
    console.warn('⚠️  Redis not available — running without cache');
    redis = null;
  });
} catch {
  console.warn('⚠️  Redis not available — running without cache');
  redis = null;
}

export default redis;
