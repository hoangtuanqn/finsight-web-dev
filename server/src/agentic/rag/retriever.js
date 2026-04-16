import prisma from '../../lib/prisma.js';
import { getEmbeddingModel } from '../llm-provider.js';

/**
 * Search knowledge base using pgvector cosine similarity.
 * @param {string} query - User's query text
 * @param {number} topK - Number of results (default 3)
 * @param {string|null} category - Optional filter: "CONCEPT" | "STRATEGY" | "REGULATION"
 * @returns {Array} Top-k matching chunks with similarity scores
 */
export async function searchKnowledge(query, topK = 3, category = null) {
  const embeddingModel = getEmbeddingModel();
  const queryEmbedding = await embeddingModel.embedQuery(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  let sql;
  let params;

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

  const results = await prisma.$queryRawUnsafe(sql, ...params);

  return results.map(r => ({
    title: r.title,
    chunk: r.chunk,
    category: r.category,
    similarity: parseFloat(r.similarity).toFixed(4),
  }));
}
