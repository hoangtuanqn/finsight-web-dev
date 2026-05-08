import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { searchKnowledge } from '../rag/retriever';

/**
 * Cosine similarity threshold for RAG relevance gate.
 * `similarity = 1 - cosine_distance` — higher is more relevant.
 * Chunks below this threshold are considered unrelated to the knowledge query.
 */
export const RAG_SIMILARITY_THRESHOLD = 0.7;

/**
 * Fixed refusal sentence used by any worker when RAG finds no relevant context.
 * Must not be overridden by LLM — workers inject this literally.
 */
export const RAG_NO_ANSWER_REPLY = 'Tôi không biết về chủ đề đó. Vui lòng hỏi về lĩnh vực tài chính.';

/** Payload shape emitted by knowledgeSearchTool when no relevant chunks found. */
export interface RagNoRelevantResult {
  isRelevant: false;
  message: string;
  topSimilarity: string | null;
  topTitle: string | null;
}

/** Payload shape emitted by knowledgeSearchTool when relevant chunks are found. */
export interface RagRelevantResult {
  isRelevant: true;
  results: Array<{ title: string; chunk: string; category: string; similarity: string }>;
}

export type RagToolResult = RagRelevantResult | RagNoRelevantResult;

export const knowledgeSearchTool = tool(
  async ({ query, category }) => {
    try {
      const rawResults = await searchKnowledge(query, 3, category || null);

      if (rawResults.length === 0) {
        const noResult: RagNoRelevantResult = {
          isRelevant: false,
          message: 'Không tìm thấy tài liệu liên quan trong knowledge base.',
          topSimilarity: null,
          topTitle: null,
        };
        return JSON.stringify(noResult);
      }

      const relevantResults = rawResults.filter((r: any) => parseFloat(r.similarity) >= RAG_SIMILARITY_THRESHOLD);

      if (relevantResults.length === 0) {
        const noResult: RagNoRelevantResult = {
          isRelevant: false,
          message: `Không tìm thấy tài liệu đủ liên quan đến "${query}" trong knowledge base. Độ tương đồng cao nhất thấp hơn ngưỡng ${RAG_SIMILARITY_THRESHOLD}.`,
          topSimilarity: rawResults[0]?.similarity ?? null,
          topTitle: rawResults[0]?.title ?? null,
        };
        return JSON.stringify(noResult);
      }

      const result: RagRelevantResult = {
        isRelevant: true,
        results: relevantResults,
      };
      return JSON.stringify(result);
    } catch (e) {
      console.error('[knowledgeSearchTool] Error:', e);
      return JSON.stringify({ error: 'Lỗi khi tìm kiếm kiến thức.' });
    }
  },
  {
    name: 'knowledge_search',
    description:
      'Tìm kiếm kiến thức tài chính từ cơ sở dữ liệu nội bộ (DTI, EAR/APR, chiến lược Snowball/Avalanche, đầu tư, thị trường). Sử dụng khi người dùng hỏi về khái niệm hoặc kiến thức tài chính.',
    schema: z.object({
      query: z.string().describe('Câu hỏi hoặc từ khóa cần tìm kiếm'),
      category: z
        .string()
        .optional()
        .describe('Lọc theo danh mục: CONCEPT (Khái niệm), STRATEGY (Chiến lược) hoặc REGULATION (Quy định)'),
    }),
  },
);
