import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { type AgentGraphState } from '../graph-state.js';
import { getChatModel } from '../llm-provider.js';
import { knowledgeSearchTool, RAG_NO_ANSWER_REPLY, type RagToolResult } from '../tools/rag.tools.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── System prompt ────────────────────────────────────────────────────────────

const RAG_SYSTEM = `Bạn là FinSight Knowledge Advisor. Quy tắc BẮT BUỘC:
1. Gọi tool "knowledge_search" với câu hỏi của người dùng.
2. Nếu tool trả về isRelevant: false → trả lời CHÍNH XÁC câu: "Tôi không biết về chủ đề đó. Vui lòng hỏi về lĩnh vực tài chính."
3. Nếu tool trả về isRelevant: true → trả lời dựa HOÀN TOÀN vào nội dung context được cung cấp. KHÔNG dùng kiến thức ngoài context.
4. Không gắn popup hoặc interactive card — chỉ văn bản.
5. Câu trả lời ngắn gọn, rõ ràng, có trích dẫn từ nguồn nếu cần.
6. Không bịa thông tin khi context không đề cập.`;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const ragWorker: AgentWorker = {
  id: 'rag',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    onToolStatus('🔍 Đang tìm kiếm kiến thức tài chính...');

    // ── Step 1: Call knowledge_search directly (no ReAct loop needed) ─────────
    let ragResult: RagToolResult | null = null;
    try {
      const raw = await knowledgeSearchTool.invoke({ query: state.input });
      ragResult = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)) as RagToolResult;
    } catch (err: any) {
      console.error('[RagWorker] knowledge_search error:', err.message);
    }

    onToolStatus(null);

    // ── Step 2: Guard — no relevant result → fixed refusal ────────────────────
    if (!ragResult || !ragResult.isRelevant) {
      onToken(RAG_NO_ANSWER_REPLY);
      return { text: RAG_NO_ANSWER_REPLY, uiSignal: null };
    }

    if (isAborted?.()) {
      return { text: '', uiSignal: null };
    }

    // ── Step 3: Build context block from retrieved chunks ─────────────────────
    const contextBlock = ragResult.results
      .map((r, i) => `[${i + 1}] ${r.title} (${r.category})\n${r.chunk}`)
      .join('\n\n---\n\n');

    const recentCtx = state.recentMessages
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const userContent = [
      state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}` : '',
      recentCtx,
      `\nNgười dùng: ${state.input}`,
      `\n\n--- Tài liệu tham khảo ---\n${contextBlock}`,
    ]
      .filter(Boolean)
      .join('\n');

    // ── Step 4: Stream response from LLM ──────────────────────────────────────
    const llm = getChatModel({ streaming: true });
    const messages = [new SystemMessage(RAG_SYSTEM), new HumanMessage(userContent)];

    let fullText = '';

    try {
      const stream = await llm.stream(messages);
      for await (const chunk of stream) {
        if (isAborted?.()) break;
        const token = typeof chunk.content === 'string' ? chunk.content : '';
        if (token) {
          fullText += token;
          onToken(token);
        }
      }
    } catch (err: any) {
      console.error('[RagWorker] LLM stream error:', err.message);
    }

    // Fallback if LLM returned nothing
    if (!fullText.trim()) {
      fullText = RAG_NO_ANSWER_REPLY;
      onToken(fullText);
    }

    return { text: fullText, uiSignal: null };
  },
};
