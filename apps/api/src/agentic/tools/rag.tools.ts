import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchKnowledge } from "../rag/retriever";

const MIN_SIMILARITY_THRESHOLD = 0.7;

export const knowledgeSearchTool = tool(
  async ({ query, category }) => {
    try {
      const results = await searchKnowledge(query, 3, category || null);

      if (results.length === 0) {
        return JSON.stringify({ message: "Không tìm thấy tài liệu liên quan trong knowledge base." });
      }

      const filteredResults = results.filter(
        (r: any) => parseFloat(r.similarity) >= MIN_SIMILARITY_THRESHOLD
      );

      if (filteredResults.length === 0) {
        return JSON.stringify({
          message: `Không tìm thấy tài liệu đủ liên quan đến "${query}" trong knowledge base. Các kết quả tìm được có độ tương đồng quá thấp (dưới ${MIN_SIMILARITY_THRESHOLD}).`,
          topSimilarity: results[0]?.similarity || null,
          topTitle: results[0]?.title || null,
        });
      }

      return JSON.stringify(filteredResults);
    } catch (e) {
      console.error("Knowledge search error:", e);
      return JSON.stringify({ error: "Lỗi khi tìm kiếm kiến thức." });
    }
  },
  {
    name: "knowledge_search",
    description: "Tìm kiếm kiến thức tài chính từ cơ sở dữ liệu nội bộ (DTI, EAR/APR, chiến lược Snowball/Avalanche, đầu tư, thị trường). Sử dụng khi người dùng hỏi về khái niệm hoặc kiến thức tài chính.",
    schema: z.object({
      query: z.string().describe("Câu hỏi hoặc từ khóa cần tìm kiếm"),
      category: z.string().optional().describe("Lọc theo danh mục: CONCEPT (Khái niệm), STRATEGY (Chi lược) hoặc REGULATION (Quy định)"),
    }),
  }
);
