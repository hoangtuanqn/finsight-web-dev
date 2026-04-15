import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

/**
 * Khởi tạo Chat Model (Default sử dụng FPT Cloud SaoLa4-medium qua chuẩn OpenAI)
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
      temperature: options.temperature ?? 0.3,
      streaming: options.streaming ?? true,
      maxTokens: options.maxTokens ?? 1024,
      ...options
    });
  }

  throw new Error(`Unsupported LLM provider: ${provider}`);
}

/**
 * Khởi tạo Embedding Model (Default sử dụng Vietnamese_Embedding)
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
      dimensions: 1024 // Hardcode for Vietnamese_Embedding
    });
  }

  throw new Error(`Unsupported Embedding provider: ${provider}`);
}
