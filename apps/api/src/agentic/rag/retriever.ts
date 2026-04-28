import prisma from '../../lib/prisma';
import { getEmbeddingModel } from '../llm-provider';

export async function searchKnowledge(query: string, topK: number = 3, category: string | null = null): Promise<any[]> {
  const embeddingModel = getEmbeddingModel();
  const queryEmbedding = await embeddingModel.embedQuery(query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  let sql: string;
  let params: any[];

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

  const results: any = await (prisma as any).$queryRawUnsafe(sql, ...params);

  return results.map((r: any) => ({
    title: r.title,
    chunk: r.chunk,
    category: r.category,
    similarity: parseFloat(r.similarity).toFixed(4),
  }));
}
