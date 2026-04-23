import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchKnowledge } from "../rag/retriever.js";

/**
 * CÔNG CỤ: Tìm Kiếm Kiến Thức (knowledgeSearchTool)
 * - Mục đích: Thực hiện tìm kiếm Vector (RAG) trong cơ sở dữ liệu tri thức nội bộ của FinSight.
 * - Khi nào dùng: Khi người dùng hỏi các câu hỏi mang tính chất lý thuyết hoặc chiến lược (VD: "Phương pháp Avalanche là gì?").
 */
export const knowledgeSearchTool = tool(
  async ({ query, category }) => {
    try {
      // Gọi module retriever để thực hiện tìm kiếm ngữ nghĩa (Semantic Search)
      // Lấy ra 3 kết quả phù hợp nhất (limit: 3)
      const results = await searchKnowledge(query, 3, category || null);
      
      if (results.length === 0) {
        return JSON.stringify({ message: "Không tìm thấy tài liệu liên quan trong knowledge base." });
      }
      
      // Trả về mảng các đoạn văn bản tri thức để Agent tổng hợp câu trả lời
      return JSON.stringify(results);
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
      category: z.string().optional().describe("Lọc theo danh mục: CONCEPT (Khái niệm), STRATEGY (Chiến lược) hoặc REGULATION (Quy định)"),
    }),
  }
);
