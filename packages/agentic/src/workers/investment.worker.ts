import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { type AgentGraphState } from '../graph-state.js';
import { getInvestmentQuotaSnapshot } from '../investment-quota.helper.js';
import { getChatModel } from '../llm-provider.js';
import { parseInvestmentInformationTool } from '../tools/investment.tools.js';
import { type UiSignal } from '../ui-signal.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── System prompts ───────────────────────────────────────────────────────────

const INVESTMENT_SYSTEM_QUOTA_OK = `Bạn là FinSight Investment Advisor. Thông tin hồ sơ đầu tư của người dùng:
- Thu nhập hàng tháng: {monthlyIncome}
- Số vốn đầu tư: {capital}
- Khẩu vị rủi ro: {riskLevel}
- Lượt tạo chiến lược còn lại: {quota}

Nhiệm vụ:
1. Gọi tool "parse_investment_information" nếu người dùng có cung cấp BẤT KỲ thông tin nào về: số vốn, thu nhập hàng tháng, hoặc khẩu vị rủi ro. Điền đúng giá trị họ nói, để null nếu họ không nhắc đến.
**QUAN TRỌNG**: Nếu bạn quyết định gọi tool, TUYỆT ĐỐI KHÔNG sinh ra bất kỳ văn bản (content) nào trong cùng bước đó. Bạn chỉ được phép trả lời văn bản ở bước tiếp theo sau khi tool đã chạy xong.
2. Trả lời ngắn gọn 2-3 câu giới thiệu ngữ cảnh đầu tư sau khi trích xuất.
3. Thông báo rằng bạn sẽ hiển thị popup để xác nhận thông tin trước khi tạo chiến lược.
4. Luôn kết thúc bằng disclaimer ngắn: "⚠️ Đây chỉ là gợi ý tham khảo đầu tư tài chính từ AI."
5. KHÔNG tự tạo chiến lược hay phân tích số liệu chi tiết trong chat.`;

const INVESTMENT_SYSTEM_QUOTA_EXHAUSTED = `Bạn là FinSight Investment Advisor.
Người dùng đã hết lượt tạo chiến lược AI ({quota} lượt còn lại).
Trả lời ngắn gọn 2-3 câu:
1. Thông báo lịch sự rằng họ đã sử dụng hết lượt.
2. Đề xuất xem lại các chiến lược cũ tại trang Đầu tư, hoặc nâng cấp tài khoản để nhận thêm lượt.
3. KHÔNG gửi popup đầu tư khi hết quota.`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number | null): string {
  if (v == null) return 'Chưa cập nhật';
  return v.toLocaleString('vi-VN') + 'đ';
}

function formatRiskLevel(v: string | null): string {
  if (!v) return 'Chưa cập nhật';
  const map: Record<string, string> = {
    LOW: 'Thấp (An toàn)',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao (Chấp nhận rủi ro)',
  };
  return map[v] ?? v;
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const investmentWorker: AgentWorker = {
  id: 'investment',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    onToolStatus('📊 Đang kiểm tra hồ sơ đầu tư...');

    // 1. Read quota snapshot — read-only, never decrements
    const snapshot = await getInvestmentQuotaSnapshot(state.userId);

    onToolStatus(null);

    if (!snapshot) {
      const text = 'Không tìm thấy thông tin tài khoản. Vui lòng thử lại sau.';
      onToken(text);
      return { text, uiSignal: null };
    }

    // 2. Guard: quota exhausted → text refusal, no popup
    if (snapshot.isQuotaExhausted) {
      const systemPrompt = INVESTMENT_SYSTEM_QUOTA_EXHAUSTED.replace('{quota}', String(snapshot.strategyQuota));

      const recentCtx = state.recentMessages
        .slice(0, -1) // exclude last item (current user message already in state.input)
        .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
        .join('\n');
      const userContent = recentCtx ? `${recentCtx}\n\nNgười dùng: ${state.input}` : state.input;

      const llm = getChatModel({ streaming: true });
      let fullText = '';

      try {
        const stream = await llm.stream([new SystemMessage(systemPrompt), new HumanMessage(userContent)]);
        for await (const chunk of stream) {
          if (isAborted?.()) break;
          const token = typeof chunk.content === 'string' ? chunk.content : '';
          if (token) {
            fullText += token;
            onToken(token);
          }
        }
      } catch (err: any) {
        console.error('[InvestmentWorker] quota-exhausted stream error:', err.message);
      }

      if (!fullText.trim()) {
        fullText =
          'Bạn đã sử dụng hết lượt tạo chiến lược AI. Hãy xem lại chiến lược cũ tại trang Đầu tư hoặc nâng cấp tài khoản để nhận thêm lượt.';
        onToken(fullText);
      }

      // No popup when quota exhausted
      return { text: fullText, uiSignal: null };
    }

    // 3. Quota available → stream intro text + emit INVESTMENT_CONFIRMATION popup
    const systemPrompt = INVESTMENT_SYSTEM_QUOTA_OK.replace('{monthlyIncome}', formatCurrency(snapshot.monthlyIncome))
      .replace('{capital}', formatCurrency(snapshot.capital))
      .replace('{riskLevel}', formatRiskLevel(snapshot.riskLevel))
      .replace('{quota}', String(snapshot.strategyQuota));

    const recentCtx = state.recentMessages
      .slice(0, -1) // exclude last item (current user message already in state.input)
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');
    const contextBlock = state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}\n\n${recentCtx}` : recentCtx;
    const userContent = contextBlock ? `${contextBlock}\n\nNgười dùng: ${state.input}` : state.input;

    const llm = getChatModel({ streaming: true });
    const agent = createReactAgent({
      llm,
      tools: [parseInvestmentInformationTool] as any,
    });

    const inputs = {
      messages: [new SystemMessage(systemPrompt), new HumanMessage(userContent)],
    };

    let fullText = '';
    let parsedData: Record<string, unknown> | null = null;

    try {
      const stream = await agent.streamEvents(inputs, { version: 'v2' });

      for await (const event of stream) {
        if (isAborted?.()) break;

        if (event.event === 'on_chat_model_stream') {
          const chunk = event.data?.chunk?.content;
          if (chunk) {
            fullText += chunk;
            onToken(chunk);
          }
        }

        if (event.event === 'on_tool_end' && event.name === 'parse_investment_information') {
          try {
            const raw =
              typeof event.data.output === 'string'
                ? event.data.output
                : (event.data.output?.content ?? JSON.stringify(event.data.output));
            parsedData = JSON.parse(raw);
          } catch (e: any) {
            console.error('[InvestmentWorker] parse_investment_information parse error:', e.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[InvestmentWorker] stream error:', err.message);
    }

    if (!fullText.trim()) {
      fullText =
        'Tôi đã ghi nhận yêu cầu tư vấn đầu tư của bạn. Vui lòng kiểm tra và xác nhận thông tin trong popup bên dưới.\n\n⚠️ Đây là gợi ý tham khảo, không phải lời khuyên tài chính chính thức.';
      onToken(fullText);
    }

    // Combine parsed data with DB snapshot
    const uiSignalData = {
      monthlyIncome: (parsedData?.monthlyIncome as number | null) ?? snapshot.monthlyIncome ?? null,
      capital: (parsedData?.capital as number | null) ?? snapshot.capital ?? null,
      riskLevel: (parsedData?.riskLevel as string | null) ?? snapshot.riskLevel ?? null,
      strategyQuotaRemaining: snapshot.strategyQuota,
    };

    // 4. Build UiSignal — never decrement quota here
    const uiSignal: UiSignal = {
      type: 'SHOW_POPUP',
      action: 'INVESTMENT_CONFIRMATION',
      data: uiSignalData,
    };

    return { text: fullText, uiSignal };
  },
};
