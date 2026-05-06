import { SystemMessage } from '@langchain/core/messages';
import { getDb } from './config.js';
import { type AgentGraphState, type CompactMessage } from './graph-state.js';
import { getChatModel } from './llm-provider.js';

/** Rolling window kept in the state. */
export const MEMORY_WINDOW_SIZE = 8;
/** Extra messages fetched from DB to produce a summary when overflow occurs. */
const DB_FETCH_LIMIT = MEMORY_WINDOW_SIZE * 2;

/** Sensitive patterns stripped from assistant messages before storing in state. */
const SENSITIVE_PATTERNS = [
  /("password"|"token"|"secret"|"2fa_secret")\s*:\s*"[^"]*"/gi,
  /Bearer\s+[A-Za-z0-9._~+/-]+=*/g,
];

function stripSensitive(text: string): string {
  let out = text;
  for (const p of SENSITIVE_PATTERNS) out = out.replace(p, '[REDACTED]');
  return out;
}

/**
 * Summarize messages that overflow the sliding window using a cheap,
 * non-streaming LLM call.  Falls back to a plain truncation on any error.
 */
async function summarizeMessages(msgs: any[]): Promise<string> {
  try {
    const model = getChatModel({ temperature: 0.1, streaming: false, maxTokens: 256 });
    const transcript = msgs
      .map((m) => {
        const role = m.role === 'user' ? 'Người dùng' : 'AI';
        const content = m.content.length > 200 ? `${m.content.substring(0, 200)}…` : m.content; // lỡ thônng tin quan trọng nằm sau thì chịu
        return `${role}: ${content}`;
      })
      .join('\n');

    const response = await model.invoke([
      new SystemMessage(
        `Bạn là trợ lý tóm tắt. Hãy tóm tắt cuộc hội thoại sau thành 2-3 câu ngắn gọn bằng tiếng Việt.
        Chú ý tóm tắt các thông tin chính, quan trọng như là khoản vay, ngân hàng, số tiền, ngày trả, và các quyết định của user (nếu có).
        CHỈ trả về bản tóm tắt, không thêm lời giải thích.`,
      ),
      new SystemMessage(transcript),
    ]);

    return (response.content as string).trim();
  } catch (err: any) {
    console.error('[MemoryCompressor] Summarization failed, using fallback:', err.message);
    return msgs
      .map((m) => {
        const role = m.role === 'user' ? '[User]' : '[AI]';
        return `${role}: ${m.content.substring(0, 80)}…`;
      })
      .join('\n');
  }
}

/**
 * Sanitize a DB assistant message before placing it in the recent-messages window.
 *
 * Strips raw UI signal JSON and replaces with a concise placeholder so the LLM
 * does not re-emit stale popup payloads.
 */
function sanitizeAssistantContent(msg: any): string {
  const content: string = msg.content || '';
  const actionType: string | null = msg.actionType ?? null;

  if (actionType === 'form_population' || actionType?.includes('CONFIRMATION')) {
    return '(Trợ lý đã trích xuất thông tin và hiển thị form xác nhận.)';
  }

  if (content.includes('trích xuất thông tin khoản nợ') || content.includes('bấm **Xác nhận**')) {
    return '(Trợ lý đã trích xuất khoản nợ, chờ user xác nhận trên form.)';
  }

  if (content.includes('vui lòng cung cấp') || content.includes('thông tin còn thiếu')) {
    return '(Trợ lý đã hỏi user bổ sung thông tin còn thiếu.)';
  }

  if (content.includes('Xin lỗi') && content.includes('thử lại')) {
    return '(Trợ lý gặp lỗi, yêu cầu user thử lại.)';
  }

  const strippedContent = stripSensitive(content);
  const firstSentence = strippedContent.split(/[.\n]/)[0].trim();
  const truncated = firstSentence.length > 100 ? `${firstSentence.substring(0, 97)}…` : firstSentence;
  return `(Trợ lý đã trả lời: ${truncated})`;
}

/**
 * Memory Compressor node (Task 2.2).
 *
 * Reads the session's message history and produces:
 * - `summary`: text summary of overflowed messages (or '' when none).
 * - `recentMessages`: sanitized sliding-window messages.
 * - `activeContext`: any extra context string for the orchestrator.
 *
 * The node NEVER calls the LLM when the total message count is at or below
 * `MEMORY_WINDOW_SIZE`. Falls back gracefully on DB or LLM errors.
 */
export async function memoryCompressorNode(
  state: AgentGraphState,
): Promise<Pick<AgentGraphState, 'summary' | 'recentMessages' | 'activeContext' | 'errors'>> {
  const errors = [...state.errors];

  try {
    const rawMessages = await getDb().chatMessage.findMany({
      where: { sessionId: state.sessionId },
      orderBy: { createdAt: 'desc' },
      take: DB_FETCH_LIMIT,
      select: { role: true, content: true, actionType: true, createdAt: true },
    });

    rawMessages.reverse();

    if (rawMessages.length === 0) {
      return { summary: '', recentMessages: [], activeContext: '', errors };
    }

    let summary = '';
    let windowMessages = rawMessages;

    if (rawMessages.length > MEMORY_WINDOW_SIZE) {
      const overflowPart = rawMessages.slice(0, rawMessages.length - MEMORY_WINDOW_SIZE);
      windowMessages = rawMessages.slice(rawMessages.length - MEMORY_WINDOW_SIZE);

      // Only call LLM if overflow is non-trivial (> 2 messages)
      if (overflowPart.length > 2) {
        summary = await summarizeMessages(overflowPart);
        console.log('[MemoryCompressor] Summarized', overflowPart.length, 'old messages');
      }
    }

    type RawMsg = { role: string; content: string; actionType: string | null };
    const recentMessages: CompactMessage[] = (windowMessages as RawMsg[])
      .map((m): CompactMessage | null => {
        if (m.role === 'user') {
          let content = m.content;
          if (content.length > 300) {
            const ocrMatch = content.match(/Yêu cầu của tôi:\s*(.+)/s);
            if (ocrMatch) {
              content = `(ảnh đính kèm) ${ocrMatch[1]!.trim().substring(0, 200)}`;
            } else {
              content = `${content.substring(0, 300)}…`;
            }
          }
          return { role: 'user', content };
        }

        if (m.role === 'assistant') {
          return { role: 'assistant', content: sanitizeAssistantContent(m) };
        }

        if (m.role === 'system') {
          return { role: 'system', content: m.content.substring(0, 200) };
        }

        return null;
      })
      .filter((m): m is CompactMessage => m !== null);

    return { summary, recentMessages, activeContext: '', errors };
  } catch (err: any) {
    console.error('[MemoryCompressor] Failed, falling back to empty history:', err.message);
    errors.push(`memory_compressor_error: ${err.message}`);
    // Graceful fallback: empty context, chat still works
    return { summary: '', recentMessages: [], activeContext: '', errors };
  }
}

/**
 * Build the SystemMessage block injected into the LLM context.
 * Exported so workers can reuse it.
 */
export function buildMemoryContextBlock(state: Pick<AgentGraphState, 'summary' | 'recentMessages'>): string {
  if (state.recentMessages.length === 0 && !state.summary) return '';

  const lines = state.recentMessages
    .map((m) => {
      if (m.role === 'user') return `- Người dùng: ${m.content}`;
      if (m.role === 'assistant') return `- Hệ thống: ${m.content}`;
      return null;
    })
    .filter(Boolean);

  let block = '=== NGỮ CẢNH HỘI THOẠI (chỉ để tham khảo, KHÔNG sao chép) ===\n';
  if (state.summary) block += `Tóm tắt phần trước: ${state.summary}\n---\n`;
  if (lines.length > 0) block += `Các lượt trao đổi gần đây:\n${lines.join('\n')}`;
  block += '\n=== HẾT NGỮ CẢNH ===';

  return block;
}
