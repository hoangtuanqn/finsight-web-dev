import { tool } from "@langchain/core/tools";

/**
 * Tạo bản sao của danh sách tools với userId được inject cứng từ auth session.
 * ĐẢM BẢO AN TOÀN: LLM không thể override userId qua prompt injection.
 * 
 * Cơ chế: Với mỗi tool yêu cầu userId trong schema, tạo một wrapper function
 * tự động truyền userId cứng từ req.userId, bỏ qua mọi giá trị userId mà LLM cung cấp.
 * 
 * @param {Array} tools - Danh sách tools gốc từ ALL_TOOLS.
 * @param {string} userId - userId đã xác thực từ auth middleware (req.userId).
 * @returns {Array} - Danh sách tools mới đã được bind userId.
 */
export function createBoundTools(tools, userId) {
  return tools.map(t => {
    // Kiểm tra xem tool schema có yêu cầu trường userId không
    const hasUserIdField = t.schema?.shape?.userId;

    if (hasUserIdField) {
      // Tạo tool wrapper: tự động inject userId cứng, LLM không thể thay đổi
      return tool(
        async (input) => {
          // Ghi đè userId bằng giá trị cứng từ auth, bất kể LLM truyền gì
          return t.invoke({ ...input, userId });
        },
        {
          name: t.name,
          description: t.description,
          schema: t.schema,
        }
      );
    }

    // Tool không cần userId (VD: market tools, knowledge_search) → giữ nguyên
    return t;
  });
}
