import crypto from 'crypto';

// A simple in-memory mock for semantic cache.
// In actual production, this would be backed by Redis `ioredis`.
const memoryCache = new Map();

const normalizeQuery = (query) => {
  return query.toLowerCase().replace(/[.,!?]/g, '').trim();
};

const hashQuery = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

export const checkSemanticCache = async (query) => {
  const normalized = normalizeQuery(query);
  const hashKey = hashQuery(normalized);
  
  if (memoryCache.has(hashKey)) {
    return memoryCache.get(hashKey);
  }
  return null;
};

export const setSemanticCache = async (query, response, intentType) => {
  const normalized = normalizeQuery(query);
  const hashKey = hashQuery(normalized);
  
  // Only cache stable knowledge queries
  if (intentType === 'KNOWLEDGE') {
    memoryCache.set(hashKey, response);
    // Redis TTL logic: await redis.setex(`cache:${hashKey}`, 86400, response);
  }
};
