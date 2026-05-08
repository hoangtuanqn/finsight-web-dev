import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { type AgentGraphState } from '../graph-state.js';
import { getChatModel } from '../llm-provider.js';
import { type UiSignal } from '../ui-signal.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── Tool: extract_repayment_setup ───────────────────────────────────────────

/**
 * All fields nullable — extract only what the user explicitly stated.
 * This tool NEVER writes to the database.
 */
const extractRepaymentSetupTool = tool(
  async ({ extraBudget, targetDate, strategy }) => {
    return JSON.stringify({
      extraBudget: extraBudget ?? null,
      targetDate: targetDate ?? null,
      strategy: strategy ?? null,
    });
  },
  {
    name: 'extract_repayment_setup',
    description:
      'Trích xuất thông tin kế hoạch trả nợ từ tin nhắn người dùng. Chỉ điền các trường người dùng đề cập rõ ràng. Gọi tool này ngay khi người dùng đề cập đến việc trả thêm tiền hoặc thiết lập kế hoạch trả nợ.',
    schema: z.object({
      extraBudget: z
        .union([z.number(), z.string()])
        .transform((v) => {
          if (typeof v === 'number') return v;
          const num = parseFloat(v.replace(/[^\d.-]/g, ''));
          return isNaN(num) ? null : num;
        })
        .nullable()
        .optional()
        .describe('Số tiền trả thêm mỗi tháng (VNĐ); null nếu không rõ'),
      targetDate: z
        .string()
        .nullable()
        .optional()
        .describe('Ngày mong muốn kết thúc (YYYY-MM-DD); null nếu không đề cập'),
      strategy: z
        .enum(['AVALANCHE', 'SNOWBALL', 'CUSTOM'])
        .nullable()
        .optional()
        .describe('Chiến lược trả nợ: AVALANCHE (lãi cao trước), SNOWBALL (nợ nhỏ trước), CUSTOM; null nếu không rõ'),
    }),
  },
);

// ─── System prompt ────────────────────────────────────────────────────────────

const REPAYMENT_SETUP_SYSTEM = `Bạn là FinSight Repayment Planner. Nhiệm vụ duy nhất của bạn:
1. Gọi tool "extract_repayment_setup" ngay lập tức với dữ liệu trích xuất từ tin nhắn người dùng.
2. Chỉ điền những trường người dùng đề cập rõ ràng, để null cho những trường không rõ.
3. KHÔNG tự tạo kế hoạch chi tiết hay tính toán trong chat — chỉ trích xuất thông tin.
4. KHÔNG tự điền số tiền hay ngày nếu người dùng không nói.
5. Sau khi tool trả kết quả, trả lời ngắn gọn 1-2 câu hướng dẫn user kiểm tra và xác nhận popup.

User ID: {userId}`;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const repaymentWorker: AgentWorker = {
  id: 'repayment',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    const llm = getChatModel({ streaming: true });

    const agent = createReactAgent({
      llm,
      tools: [extractRepaymentSetupTool] as any,
    });

    const systemPrompt = REPAYMENT_SETUP_SYSTEM.replace('{userId}', state.userId);

    // Build context from memory
    const recentCtx = state.recentMessages
      .slice(0, -1) // exclude last item (current user message already in state.input)
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const contextBlock = state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}\n\n${recentCtx}` : recentCtx;
    const userContent = contextBlock ? `${contextBlock}\n\nNgười dùng: ${state.input}` : state.input;

    const inputs = {
      messages: [new SystemMessage(systemPrompt), new HumanMessage(userContent)],
    };

    let fullText = '';
    let parsedData: Record<string, unknown> | null = null;

    onToolStatus('💰 Đang trích xuất thông tin kế hoạch trả nợ...');

    try {
      const stream = await agent.streamEvents(inputs, { version: 'v2' });

      for await (const event of stream) {
        if (isAborted?.()) break;

        if (event.event === 'on_chat_model_stream') {
          const chunk = event.data?.chunk?.content;
          if (chunk) {
            fullText += chunk;
            onToolStatus(null);
            onToken(chunk);
          }
        }

        if (event.event === 'on_tool_end' && event.name === 'extract_repayment_setup') {
          try {
            const raw =
              typeof event.data.output === 'string'
                ? event.data.output
                : (event.data.output?.content ?? JSON.stringify(event.data.output));
            parsedData = JSON.parse(raw);
          } catch (e: any) {
            console.error('[RepaymentWorker] extract_repayment_setup output parse error:', e.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[RepaymentWorker] stream error:', err.message);
    }

    onToolStatus(null);

    // Provide fallback text if LLM produced nothing
    if (!fullText.trim()) {
      fullText =
        'Tôi đã ghi nhận kế hoạch trả nợ của bạn. Vui lòng kiểm tra và xác nhận thông tin trong popup bên dưới.';
      onToken(fullText);
    }

    // Build UiSignal regardless of whether data is complete
    const uiSignal: UiSignal = {
      type: 'SHOW_POPUP',
      action: 'REPAYMENT_CONFIRMATION',
      data: parsedData
        ? {
            extraBudget: (parsedData.extraBudget as number | null) ?? null,
            targetDate: (parsedData.targetDate as string | null) ?? null,
            strategy: (parsedData.strategy as 'AVALANCHE' | 'SNOWBALL' | 'CUSTOM' | null) ?? null,
          }
        : null,
    };

    return { text: fullText, uiSignal };
  },
};
