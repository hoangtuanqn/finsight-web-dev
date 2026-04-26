import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchKnowledge } from "../rag/retriever.js";

// Ngưỡng tương đồng tối thiểu để chấp nhận kết quả RAG
// Nếu similarity < ngưỡng → kết quả không đủ liên quan, tránh trả lời sai chủ đề
const MIN_SIMILARITY_THRESHOLD = 0.7;

/**
 * CÔNG CỤ: Tìm Kiếm Kiến Thức (knowledgeSearchTool)
 * - Mục đích: Thực hiện tìm kiếm Vector (RAG) trong cơ sở dữ liệu tri thức nội bộ của FinSight.
 * - Khi nào dùng: Khi người dùng hỏi các câu hỏi mang tính chất lý thuyết hoặc chiến lược (VD: "Phương pháp Avalanche là gì?").
 * - Bao gồm ngưỡng similarity tối thiểu để tránh trả kết quả không liên quan (VD: hỏi "APK" nhưng trả về "APR").
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

      // Lọc bỏ kết quả có similarity thấp hơn ngưỡng tối thiểu
      // Tránh trường hợp vector embedding gần nhau nhưng nội dung không liên quan
      const filteredResults = results.filter(
        r => parseFloat(r.similarity) >= MIN_SIMILARITY_THRESHOLD
      );

      if (filteredResults.length === 0) {
        return JSON.stringify({
          message: `Không tìm thấy tài liệu đủ liên quan đến "${query}" trong knowledge base. Các kết quả tìm được có độ tương đồng quá thấp (dưới ${MIN_SIMILARITY_THRESHOLD}).`,
          topSimilarity: results[0]?.similarity || null,
          topTitle: results[0]?.title || null,
        });
      }

      // Trả về mảng các đoạn văn bản tri thức đã lọc để Agent tổng hợp câu trả lời
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
      category: z.string().optional().describe("Lọc theo danh mục: CONCEPT (Khái niệm), STRATEGY (Chiến lược) hoặc REGULATION (Quy định)"),
    }),
  }
);
