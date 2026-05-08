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
6. Với câu hỏi định nghĩa như "DTI là gì?", trả lời trực tiếp bằng định nghĩa trong context trước, sau đó thêm công thức hoặc ngưỡng nếu context có.
7. Không bịa thông tin khi context không đề cập.`;

function normalizeForIntent(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isSimpleDefinitionQuestion(query: string): boolean {
  const normalized = normalizeForIntent(query);
  const isDefinition = /\b(la gi|dinh nghia|khai niem|giai thich)\b/.test(normalized);
  return isDefinition && normalized.length <= 120;
}

function cleanMarkdownLine(line: string): string {
  return line
    .replace(/^#+\s*/, '')
    .replace(/^[-*]\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferQueryTerm(query: string, results: Array<{ title: string; chunk: string }>): string | null {
  const acronym = query.match(/\b[A-Z]{2,8}\b/);
  if (acronym) return acronym[0];

  const normalizedQuery = normalizeForIntent(query);
  for (const result of results) {
    const titleAcronym = result.title.match(/\(([A-Z]{2,8})\)/);
    if (titleAcronym && normalizedQuery.includes(titleAcronym[1].toLowerCase())) return titleAcronym[1];

    const chunkAcronym = result.chunk.match(/\b([A-Z]{2,8})\b/);
    if (chunkAcronym && normalizedQuery.includes(chunkAcronym[1].toLowerCase())) return chunkAcronym[1];
  }

  return null;
}

function buildExtractiveKnowledgeAnswer(
  query: string,
  results: Array<{ title: string; chunk: string }>,
): string | null {
  const term = inferQueryTerm(query, results);
  const normalizedTerm = term ? normalizeForIntent(term) : null;
  const lines = results.flatMap((result) => result.chunk.split(/\r?\n/));
  const cleanedLines = lines.map(cleanMarkdownLine).filter(Boolean);
  const normalizedQuery = normalizeForIntent(query);

  const definitionLine =
    cleanedLines.find((line) => {
      const normalizedLine = normalizeForIntent(line);
      if (!/\b(la|duoc hieu la)\b/.test(normalizedLine)) return false;
      return normalizedTerm ? normalizedLine.includes(normalizedTerm) : true;
    }) ?? null;

  if (!definitionLine) return null;

  const answerParts = [definitionLine];

  const formulaLine = cleanedLines.find((line) => {
    if (!normalizedTerm || !term) return line.includes('=') && line.includes('100');
    return new RegExp(`\\b${escapeRegExp(term)}\\s*=`, 'i').test(line);
  });

  if (formulaLine && !definitionLine.includes(formulaLine)) {
    answerParts.push(`Công thức: ${formulaLine}`);
  }

  const wantsThreshold = /\b(muc|nguong|duy tri|an toan|canh bao|bao nhieu)\b/.test(normalizedQuery);
  if (wantsThreshold) {
    const thresholdLines = cleanedLines
      .filter((line) => /SAFE|WARNING|DANGER|CRITICAL|dưới|trên|35%|50%/i.test(line))
      .slice(0, 3);

    if (thresholdLines.length > 0) {
      answerParts.push(`Ngưỡng tham khảo: ${thresholdLines.join(' ')}`);
    }
  }

  return answerParts.join('\n\n');
}

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

    const directAnswer = isSimpleDefinitionQuestion(state.input)
      ? buildExtractiveKnowledgeAnswer(state.input, ragResult.results)
      : null;

    if (directAnswer) {
      onToken(directAnswer);
      return { text: directAnswer, uiSignal: null };
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

    if (isAborted?.()) {
      return { text: fullText, uiSignal: null };
    }

    // Fallback if LLM returned nothing
    if (!fullText.trim()) {
      fullText = buildExtractiveKnowledgeAnswer(state.input, ragResult.results) ?? RAG_NO_ANSWER_REPLY;
      onToken(fullText);
    }

    return { text: fullText, uiSignal: null };
  },
};
