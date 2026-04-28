import prisma from '../../lib/prisma.js';
import { getEmbeddingModel } from '../llm-provider.js';

/**
 * Tìm kiếm trong kho kiến thức sử dụng khoảng cách Cosine của pgvector.
 * @param {string} query - Văn bản truy vấn của người dùng
 * @param {number} topK - Số lượng kết quả muốn lấy (mặc định là 3)
 * @param {string|null} category - Lọc theo danh mục: "CONCEPT" | "STRATEGY" | "REGULATION"
 * @returns {Array} Danh sách top-k đoạn văn bản khớp nhất kèm điểm tương đồng
 */
export async function searchKnowledge(query, topK = 3, category = null) {
  const embeddingModel = getEmbeddingModel();
  
  // Chuyển đổi câu truy vấn của người dùng thành vector embedding
  const queryEmbedding = await embeddingModel.embedQuery(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  let sql;
  let params;

  // Xây dựng câu lệnh SQL để tìm kiếm vector gần nhất
  // Sử dụng toán tử <=> trong pgvector cho khoảng cách cosine (1 - similarity)
  if (category) {
    sql = `
      SELECT id, title, chunk, category,
             1 - (embedding <=> $1::vector) AS similarity
      FROM finance_knowledge
      WHERE embedding IS NOT NULL AND category = $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;
    params = [vectorStr, category, topK];
  } else {
    sql = `
      SELECT id, title, chunk, category,
             1 - (embedding <=> $1::vector) AS similarity
      FROM finance_knowledge
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;
    params = [vectorStr, topK];
  }

  // Thực thi truy vấn SQL thô thông qua Prisma
  const results = await prisma.$queryRawUnsafe(sql, ...params);

  // Trả về kết quả đã được format đẹp
  return results.map(r => ({
    title: r.title,
    chunk: r.chunk,
    category: r.category,
    similarity: parseFloat(r.similarity).toFixed(4), // Làm tròn điểm tương đồng đến 4 chữ số thập phân
  }));
}
