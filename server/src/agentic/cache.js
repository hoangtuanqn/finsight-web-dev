import crypto from 'crypto';

/**
 * Một đối tượng bộ nhớ đệm (Cache) đơn giản lưu trực tiếp trên RAM.
 * MẸO: Khi hệ thống thực tế có lượng truy cập lớn (Production), 
 * nên thay Map() này bằng Redis (qua thư viện ioredis) để đồng bộ cache giữa nhiều server.
 */
const memoryCache = new Map();

// TTL mặc định: 24 giờ
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Hàm chuẩn hóa câu hỏi: Chuyển về chữ thường, xóa các dấu câu và khoảng trắng thừa.
 * Việc này giúp tăng tỉ lệ Cache Hit (VD: "DTI là gì?" và "dti là gì " sẽ tính là một).
 */
const normalizeQuery = (query) => {
  return query.toLowerCase().replace(/[.,!?]/g, '').trim();
};

/**
 * Tạo mã băm (Hash SHA-256) từ câu hỏi để làm Key trong bộ nhớ đệm.
 */
const hashQuery = (text) => {
  return crypto.createHash('sha256').update(text).digest('hex');
};

/**
 * Kiểm tra xem câu hỏi này đã từng được AI trả lời trước đó chưa.
 * Bao gồm kiểm tra TTL: nếu cache quá cũ (> 24h), tự động xóa và trả về null.
 * @param {string} query - Câu hỏi người dùng.
 * @returns {Promise<string|null>} - Câu trả lời lưu trong cache hoặc null nếu chưa có.
 */
export const checkSemanticCache = async (query) => {
  const normalized = normalizeQuery(query);
  const hashKey = hashQuery(normalized);

  if (memoryCache.has(hashKey)) {
    const entry = memoryCache.get(hashKey);

    // Kiểm tra TTL: nếu cache quá cũ, xóa và coi như miss
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      memoryCache.delete(hashKey);
      console.log('[Cache] EXPIRED for query:', query.substring(0, 50));
      return null;
    }

    console.log('[Cache] HIT for query:', query.substring(0, 50)); // Redact log
    return entry.response; // Cache Hit!
  }
  console.log('[Cache] MISS for query:', query.substring(0, 50)); // Redact log
  return null; // Cache Miss! Phải gọi LLM
};

/**
 * Lưu câu trả lời của AI vào bộ nhớ đệm.
 * Chỉ áp dụng cho các câu hỏi mang tính chất "Kiến thức chung" (KNOWLEDGE).
 * (Không lưu cache các câu tư vấn cá nhân hay tài khoản vì dữ liệu mỗi người một khác).
 * Kèm theo timestamp để kiểm tra TTL khi đọc lại.
 */
export const setSemanticCache = async (query, response, intentType) => {
  // GUARD: Không cache response rỗng, quá ngắn, hoặc là fallback error
  if (!response || response.trim().length < 20) {
    console.log('[Cache] SKIP: Response too short to cache:', response?.substring(0, 50));
    return;
  }

  const normalized = normalizeQuery(query);
  const hashKey = hashQuery(normalized);

  // Chỉ lưu cache với Intent là KNOWLEDGE
  if (intentType === 'KNOWLEDGE') {
    memoryCache.set(hashKey, {
      response,
      timestamp: Date.now(),
    });
    // Code nếu dùng Redis: await redis.setex(`cache:${hashKey}`, 86400, response); // Tồn tại 24h
  }
};
