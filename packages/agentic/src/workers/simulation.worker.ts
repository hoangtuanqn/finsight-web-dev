import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { z } from 'zod';
import { type AgentGraphState } from '../graph-state.js';
import { getChatModel } from '../llm-provider.js';
import { getAgentActiveDebts, getAgentUserProfile } from '../personal-data.repository.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── Tool: simulate_financial_risk ───────────────────────────────────────────

export const simulateFinancialRiskSchema = z.object({
  userId: z.string().describe('ID người dùng'),
  additionalDebt: z.number().nullable().optional().describe('Tổng dư nợ vay thêm (VNĐ); 0 nếu không thêm'),
  additionalMonthlyPayment: z.number().nullable().optional().describe('Số tiền phải trả thêm hàng tháng (VNĐ)'),
  incomeShockPercent: z
    .number()
    .nullable()
    .optional()
    .describe('Phần trăm thu nhập bị giảm (0-100); 0 nếu không áp dụng'),
  oneTimeExpense: z.number().nullable().optional().describe('Chi tiêu một lần lớn (VNĐ); 0 nếu không có'),
});

/**
 * Core simulation tool.
 * All arithmetic is done here — LLM must NOT self-calculate numbers.
 */
const simulateFinancialRiskTool = tool(
  async ({ userId, additionalDebt, additionalMonthlyPayment, incomeShockPercent, oneTimeExpense }) => {
    try {
      const [userProfile, debtSummary] = await Promise.all([getAgentUserProfile(userId), getAgentActiveDebts(userId)]);

      const monthlyIncome = userProfile?.monthlyIncome ?? null;
      const currentMonthlyObligation = debtSummary.totalMonthlyObligation;
      const currentBalance = debtSummary.totalBalance;

      // ── Cash flow baseline ─────────────────────────────────────────────────
      const effectiveIncome = monthlyIncome !== null ? monthlyIncome * (1 - (incomeShockPercent ?? 0) / 100) : null;

      const newMonthlyObligation = currentMonthlyObligation + (additionalMonthlyPayment ?? 0);

      // ── DTI ────────────────────────────────────────────────────────────────
      const newDtiPercent =
        effectiveIncome && effectiveIncome > 0
          ? parseFloat(((newMonthlyObligation / effectiveIncome) * 100).toFixed(2))
          : null;

      let dtiAlertLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'UNKNOWN' = 'UNKNOWN';
      if (newDtiPercent !== null) {
        if (newDtiPercent > 50) dtiAlertLevel = 'DANGER';
        else if (newDtiPercent > 35) dtiAlertLevel = 'WARNING';
        else dtiAlertLevel = 'SAFE';
      }

      // ── Monthly cash flow ─────────────────────────────────────────────────
      const monthlyCashFlow =
        effectiveIncome !== null
          ? parseFloat((effectiveIncome - newMonthlyObligation - (oneTimeExpense ?? 0)).toFixed(0))
          : null;

      // ── New total debt ─────────────────────────────────────────────────────
      const newTotalDebt = currentBalance + (additionalDebt ?? 0);

      // ── Risk verdict ───────────────────────────────────────────────────────
      const riskFlags: string[] = [];
      if (dtiAlertLevel === 'DANGER') riskFlags.push('DTI vượt ngưỡng nguy hiểm >50%');
      if (dtiAlertLevel === 'WARNING') riskFlags.push('DTI ở mức cảnh báo 35–50%');
      if (monthlyCashFlow !== null && monthlyCashFlow < 0) riskFlags.push('Dòng tiền âm sau các khoản trả nợ');
      if ((incomeShockPercent ?? 0) > 0) riskFlags.push(`Thu nhập giảm ${incomeShockPercent}% trong kịch bản này`);

      return JSON.stringify({
        inputs: {
          additionalDebt: additionalDebt ?? 0,
          additionalMonthlyPayment: additionalMonthlyPayment ?? 0,
          incomeShockPercent: incomeShockPercent ?? 0,
          oneTimeExpense: oneTimeExpense ?? 0,
        },
        baseline: {
          monthlyIncome,
          currentMonthlyObligation,
          currentTotalDebt: currentBalance,
          activeDebts: debtSummary.totalActive,
        },
        scenario: {
          effectiveIncome,
          newMonthlyObligation,
          newTotalDebt,
          newDtiPercent,
          dtiAlertLevel,
          monthlyCashFlow,
        },
        riskFlags,
        missingIncome: monthlyIncome === null || monthlyIncome <= 0,
      });
    } catch (err: any) {
      console.error('[SimulateFinancialRiskTool] error:', err.message);
      return JSON.stringify({ error: 'Không thể thực hiện mô phỏng lúc này. Vui lòng thử lại sau.' });
    }
  },
  {
    name: 'simulate_financial_risk',
    description:
      'Mô phỏng tác động tài chính khi thêm khoản nợ, tăng thanh toán, giảm thu nhập hoặc chi tiêu một lần. ' +
      'Tool tính DTI mới, dòng tiền mới và mức độ rủi ro. Gọi ngay khi người dùng hỏi "nếu tôi vay thêm", ' +
      '"nếu thu nhập giảm", "nếu tôi chi thêm". userId được hệ thống tự động cung cấp.',
    schema: simulateFinancialRiskSchema,
  },
);

// ─── System prompt ────────────────────────────────────────────────────────────

const SIMULATION_SYSTEM = `Bạn là FinSight Risk Simulator. Nhiệm vụ duy nhất của bạn:
1. Phân tích câu hỏi người dùng để xác định các biến số kịch bản: khoản vay thêm, thanh toán thêm, sốc thu nhập, chi tiêu một lần.
2. Gọi tool "simulate_financial_risk" ngay lập tức với userId = {userId} và các biến số trích xuất được.
3. Sau khi nhận kết quả từ tool, trình bày phân tích NGẮN GỌN bằng tiếng Việt:
   - Nêu rõ số liệu định lượng (DTI mới, dòng tiền, tổng nợ mới).
   - Nêu mức độ rủi ro và cảnh báo cụ thể.
   - Nếu thiếu thông tin thu nhập, nhắc người dùng cập nhật thu nhập để tính DTI chính xác.
   - Có thể đề xuất xem chi tiết tại [Quản lý nợ](/debts) hoặc [Hồ sơ tài chính](/profile).
4. KHÔNG tự tính toán số học; tool phải tính.
5. KHÔNG gửi popup hay card UI — chỉ trả lời text.

User ID: {userId}`;

// ─── Worker ───────────────────────────────────────────────────────────────────

export const simulationWorker: AgentWorker = {
  id: 'simulation',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    const llm = getChatModel({ streaming: true });

    const agent = createReactAgent({
      llm,
      tools: [simulateFinancialRiskTool] as any,
    });

    const systemPrompt = SIMULATION_SYSTEM.split('{userId}').join(state.userId);

    // Build context from memory
    const recentCtx = state.recentMessages
      .map((m) => `${m.role === 'user' ? 'Người dùng' : 'AI'}: ${m.content}`)
      .join('\n');

    const contextBlock = state.summary ? `Tóm tắt ngữ cảnh trước: ${state.summary}\n\n${recentCtx}` : recentCtx;
    const userContent = contextBlock ? `${contextBlock}\n\nNgười dùng: ${state.input}` : state.input;

    const inputs = {
      messages: [new SystemMessage(systemPrompt), new HumanMessage(userContent)],
    };

    let fullText = '';

    onToolStatus('🔬 Đang mô phỏng kịch bản tài chính...');

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
      }
    } catch (err: any) {
      console.error('[SimulationWorker] stream error:', err.message);
    }

    onToolStatus(null);

    if (!fullText.trim()) {
      fullText =
        'Tôi không thể thực hiện mô phỏng lúc này. Vui lòng cung cấp thêm thông tin về kịch bản bạn muốn kiểm tra (khoản vay thêm, thay đổi thu nhập, v.v.).';
      onToken(fullText);
    }

    return { text: fullText, uiSignal: null };
  },
};
