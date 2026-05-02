import crypto from 'crypto';

const memoryCache = new Map<string, { response: string; timestamp: number }>();

// TTL mặc định: 24 giờ
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeQuery = (query: string): string => {
  return query
    .toLowerCase()
    .replace(/[.,!?]/g, '')
    .trim();
};

const hashQuery = (text: string): string => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

export const checkSemanticCache = async (query: string): Promise<string | null> => {
  const normalized = normalizeQuery(query);
  const hashKey = hashQuery(normalized);

  if (memoryCache.has(hashKey)) {
    const entry = memoryCache.get(hashKey)!;

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      memoryCache.delete(hashKey);
      console.log('[Cache] EXPIRED for query:', query.substring(0, 50));
      return null;
    }

    console.log('[Cache] HIT for query:', query.substring(0, 50));
    return entry.response;
  }
  console.log('[Cache] MISS for query:', query.substring(0, 50));
  return null;
};

export const setSemanticCache = async (query: string, response: string, intentType: string): Promise<void> => {
  if (!response || response.trim().length < 20) {
    console.log('[Cache] SKIP: Response too short to cache:', response?.substring(0, 50));
    return;
  }

  const normalized = normalizeQuery(query);
  const hashKey = hashQuery(normalized);

  if (intentType === 'KNOWLEDGE') {
    memoryCache.set(hashKey, {
      response,
      timestamp: Date.now(),
    });
  }
};
