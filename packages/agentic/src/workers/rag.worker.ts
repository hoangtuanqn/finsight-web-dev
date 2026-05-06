import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { type AgentGraphState } from '../graph-state.js';
import { getChatModel } from '../llm-provider.js';
import { knowledgeSearchTool, RAG_NO_ANSWER_REPLY, type RagToolResult } from '../tools/rag.tools.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── System prompt ────────────────────────────────────────────────────────────

/**
 * Grounded RAG system prompt.
 * The LLM receives retrieved chunks in the HumanMessage and must answer
 * solely from that context — no external knowledge allowed.
 */
const RAG_SYSTEM = `Bạn là FinSight Knowledge Advisor — chuyên gia tư vấn tài chính cá nhân.

QUY TẮC BẮT BUỘC:
1. Trả lời DỰA HOÀN TOÀN vào phần "--- Tài liệu tham khảo ---" được cung cấp trong tin nhắn.
2. TUYỆT ĐỐI không bịa thêm thông tin ngoài tài liệu, kể cả khi bạn biết từ kiến thức chung.
3. Không gắn popup hay interactive card — chỉ trả lời văn bản thuần túy.
4. Cấu trúc câu trả lời theo thứ tự: Định nghĩa → Công thức (nếu có) → Ví dụ thực tế (nếu có) → Khuyến nghị (nếu có).
5. Với câu hỏi định nghĩa ("X là gì?"), bắt đầu TRỰC TIẾP bằng định nghĩa — KHÔNG lặp lại câu hỏi, KHÔNG nói "Theo tài liệu...".
6. Ngắn gọn, rõ ràng; dùng bullet point khi liệt kê nhiều mục.
7. Nếu tài liệu không đề cập đến thông tin người dùng cần, nói rõ: "Tài liệu hiện tại chưa có thông tin chi tiết về vấn đề này."
8. Trả lời bằng tiếng Việt.`;

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

    // ── Step 1: Retrieve relevant knowledge chunks ─────────────────────────────
    const searchQuery = state.summary ? `${state.summary} - ${state.input}` : state.input;

    let ragResult: RagToolResult | null = null;
    try {
      const raw = await knowledgeSearchTool.invoke({ query: searchQuery });
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

    // ── Step 3: Build grounded context block & message array ──────────────────
    const contextBlock = ragResult.results
      .map((r, i) => `[${i + 1}] ${r.title} (${r.category})\n${r.chunk}`)
      .join('\n\n---\n\n');

    const systemPrompt = `${RAG_SYSTEM}\n\n--- TÀI LIỆU THAM KHẢO ---\n${contextBlock}`;

    const roleMap: Record<string, (c: string) => SystemMessage | HumanMessage | AIMessage> = {
      user: (c) => new HumanMessage(c),
      assistant: (c) => new AIMessage(c.replace(/^\(Trợ lý đã trả lời:\s*|\)$/g, '').trim()),
      system: (c) => new SystemMessage(c),
    };

    const historyMessages = state.recentMessages
      // Loại trừ câu hỏi hiện tại bị lọt vào mảng lịch sử (do sliding window có thể đã lưu)
      .filter((m) => !(m.role === 'user' && m.content === state.input))
      .map((m) => (roleMap[m.role] ?? roleMap.assistant)(m.content));

    const messages = [new SystemMessage(systemPrompt), ...historyMessages, new HumanMessage(state.input)];

    // ── Step 4: Stream LLM response grounded in retrieved context ──────────────
    const llm = getChatModel({ streaming: true });

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

    if (isAborted?.()) {
      return { text: fullText, uiSignal: null };
    }

    // Fallback if LLM returned nothing
    if (!fullText.trim()) {
      onToken(RAG_NO_ANSWER_REPLY);
      return { text: RAG_NO_ANSWER_REPLY, uiSignal: null };
    }

    return { text: fullText, uiSignal: null };
  },
};
