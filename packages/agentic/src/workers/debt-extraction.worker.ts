import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { type AgentGraphState } from '../graph-state.js';
import { getChatModel } from '../llm-provider.js';
import { parseDebtInformationTool } from '../tools/debt.tools.js';
import { type UiSignal } from '../ui-signal.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── System prompt ────────────────────────────────────────────────────────────

const DEBT_EXTRACTION_SYSTEM = `Bạn là FinSight Debt Extractor. Nhiệm vụ duy nhất của bạn:
1. Gọi tool "parse_debt_information" ngay lập tức với dữ liệu trích xuất từ tin nhắn người dùng.
2. Chỉ điền những trường có trong tin nhắn, để null cho những trường không rõ.
3. KHÔNG tự đặt giá trị mặc định (không tự điền APR, kỳ hạn, ngày vay, v.v.).
4. KHÔNG hỏi thêm câu hỏi dài dòng — luôn gọi tool rồi kết thúc.
5. Sau khi tool trả kết quả, trả lời ngắn gọn 1-2 câu hướng dẫn user kiểm tra popup.

User ID: {userId}`;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const debtExtractionWorker: AgentWorker = {
  id: 'debt_extraction',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    const llm = getChatModel({ streaming: true });

    const agent = createReactAgent({
      llm,
      tools: [parseDebtInformationTool] as any,
    });

    const systemPrompt = DEBT_EXTRACTION_SYSTEM.replace('{userId}', state.userId);

    // Build recent messages context
    const recentCtx = state.recentMessages
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const contextBlock = state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}\n\n${recentCtx}` : recentCtx;

    const userContent = contextBlock ? `${contextBlock}\n\nNgười dùng: ${state.input}` : state.input;

    const inputs = {
      messages: [new SystemMessage(systemPrompt), new HumanMessage(userContent)],
    };

    let fullText = '';
    let parsedData: Record<string, unknown> | null = null;

    onToolStatus('🔍 Đang trích xuất thông tin khoản nợ...');

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

        if (event.event === 'on_tool_end' && event.name === 'parse_debt_information') {
          try {
            const raw =
              typeof event.data.output === 'string'
                ? event.data.output
                : (event.data.output?.content ?? JSON.stringify(event.data.output));
            parsedData = JSON.parse(raw);
          } catch (e: any) {
            console.error('[DebtExtractionWorker] parse_debt_information output parse error:', e.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[DebtExtractionWorker] stream error:', err.message);
    }

    onToolStatus(null);

    // If no text was generated but tool ran, provide minimal guidance
    if (!fullText.trim()) {
      fullText =
        'Tôi đã trích xuất thông tin khoản nợ. Vui lòng kiểm tra và bổ sung các trường còn thiếu trong popup bên dưới.';
      onToken(fullText);
    }

    // Build UiSignal regardless of whether parsedData is complete
    const uiSignal: UiSignal = {
      type: 'SHOW_POPUP',
      action: 'DEBT_CONFIRMATION',
      data: parsedData
        ? {
            loanName: (parsedData.loanName as string | null) ?? null,
            principalAmount: (parsedData.principalAmount as number | null) ?? null,
            interestRateAPR: (parsedData.interestRateAPR as number | null) ?? null,
            borrowDate: (parsedData.borrowDate as string | null) ?? null,
            termMonths: (parsedData.termMonths as number | null) ?? null,
            rateType: (parsedData.rateType as 'FLAT' | 'REDUCING' | null) ?? null,
            balance: (parsedData.balance as number | null) ?? null,
            minPayment: (parsedData.minPayment as number | null) ?? null,
            dueDay: (parsedData.dueDay as number | null) ?? null,
            notes: (parsedData.notes as string | null) ?? null,
          }
        : null,
    };

    return { text: fullText, uiSignal };
  },
};
