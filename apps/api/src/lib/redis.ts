import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

let redis: Redis | null = null;

try {
  const redisInstance = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) {
        console.warn('Redis: max retries reached, running without cache');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redisInstance.on('error', (err: any) => {
    console.warn('Redis connection error (cache disabled):', err.message);
  });

  redisInstance.on('connect', () => {
    console.log('✅ Redis connected');
  });

  await redisInstance.connect().catch(() => {
    console.warn('⚠️  Redis not available — running without cache');
  });
  
  redis = redisInstance;
} catch {
  console.warn('⚠️  Redis not available — running without cache');
  redis = null;
}

export default redis;
