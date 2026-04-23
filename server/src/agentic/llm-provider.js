import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

/**
 * Khởi tạo Chat Model (Bộ não chính của Agent)
 * Mặc định sử dụng FPT Cloud SaoLa4-medium thông qua thư viện chuẩn của OpenAI.
 * Điều này cho phép hệ thống dễ dàng chuyển đổi sang GPT-4 nếu cần chỉ bằng cách đổi biến môi trường.
 * @param {Object} options - Các tùy chọn như temperature (độ sáng tạo), streaming...
 */
export function getChatModel(options = {}) {
  const provider = process.env.LLM_PROVIDER || 'fptcloud';

  if (provider === 'fptcloud' || provider === 'openai') {
    return new ChatOpenAI({
      modelName: process.env.LLM_MODEL || 'SaoLa4-medium',
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
      configuration: {
        baseURL: process.env.LLM_BASE_URL || 'https://mkp-api.fptcloud.com',
      },
      temperature: options.temperature ?? 0.3, // 0.3 là mức an toàn, không quá ảo giác
      streaming: options.streaming ?? true,   // Bật stream để UI có hiệu ứng gõ chữ
      maxTokens: options.maxTokens ?? 1024,
      ...options
    });
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}

/**
 * Khởi tạo Embedding Model (Dùng để tìm kiếm vector - RAG)
 * Mặc định sử dụng Vietnamese_Embedding để hỗ trợ tiếng Việt tốt nhất.
 */
export function getEmbeddingModel() {
  const provider = process.env.EMBEDDING_PROVIDER || 'fptcloud';

  if (provider === 'fptcloud' || provider === 'openai') {
    return new OpenAIEmbeddings({
      modelName: process.env.EMBEDDING_MODEL || 'Vietnamese_Embedding',
      apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
      configuration: {
        baseURL: process.env.LLM_BASE_URL || 'https://mkp-api.fptcloud.com',
      },
      dimensions: 1024 // Hardcode cho Vietnamese_Embedding (Bắt buộc phải đúng kích thước vector)
    });
  }

  throw new Error(`Unsupported Embedding provider: ${provider}`);
}
