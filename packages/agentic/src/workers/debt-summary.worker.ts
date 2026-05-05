import { type AgentGraphState } from '../graph-state.js';
import { getAgentActiveDebts, getAgentDtiSnapshot, getAgentUserProfile } from '../personal-data.repository.js';
import { type UiSignal } from '../ui-signal.js';
import { type AgentWorker, type WorkerOutput } from '../worker.interface.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVND(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} triệu`;
  return amount.toLocaleString('vi-VN') + ' đ';
}

function dtiHealthLabel(level: 'SAFE' | 'WARNING' | 'DANGER' | 'UNKNOWN'): string {
  switch (level) {
    case 'SAFE':
      return '✅ Tốt';
    case 'WARNING':
      return '⚠️ Cần chú ý';
    case 'DANGER':
      return '🚨 Rủi ro cao';
    default:
      return '❓ Chưa xác định (cần cập nhật thu nhập)';
  }
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const debtSummaryWorker: AgentWorker = {
  id: 'debt_summary',

  async run(
    state: AgentGraphState,
    onToken: (token: string) => void,
    onToolStatus: (status: string | null) => void,
    _isAborted?: (() => boolean) | null,
  ): Promise<WorkerOutput> {
    onToolStatus('📊 Đang tổng hợp thông tin nợ...');

    try {
      const [debtSummary, dtiSnapshot, userProfile] = await Promise.all([
        getAgentActiveDebts(state.userId),
        getAgentDtiSnapshot(state.userId),
        getAgentUserProfile(state.userId),
      ]);

      onToolStatus(null);

      const { totalActive, totalBalance, totalMonthlyObligation } = debtSummary;
      const { dtiPercent, alertLevel } = dtiSnapshot;

      // ── Build 3-point summary text ──────────────────────────────────────────
      const line1 = `• **Tổng dư nợ active:** ${totalActive} khoản — ${formatVND(totalBalance)}`;

      const line2 = `• **Nghĩa vụ tháng này:** ${formatVND(totalMonthlyObligation)}/tháng`;

      const dtiLine =
        dtiPercent !== null
          ? `DTI hiện tại **${dtiPercent.toFixed(1)}%** — Sức khỏe tài chính: ${dtiHealthLabel(alertLevel)}`
          : `DTI chưa tính được (chưa có thông tin thu nhập) — ${dtiHealthLabel(alertLevel)}`;
      const line3 = `• **DTI & Sức khỏe:** ${dtiLine}`;

      const greeting = userProfile?.fullName ? `Xin chào **${userProfile.fullName}**! ` : '';
      const text = `${greeting}Đây là tóm tắt tình trạng nợ của bạn:\n\n${line1}\n${line2}\n${line3}\n\nBạn muốn xem biểu đồ tổng quan hay chi tiết từng khoản?`;

      // Stream text token by token (emit as single chunk for simplicity)
      onToken(text);

      // ── Build interactive card UI signal ────────────────────────────────────
      const uiSignal: UiSignal = {
        type: 'SHOW_INTERACTIVE_CARD',
        action: 'DEBT_SUMMARY_ACTIONS',
        buttons: [
          { label: '📈 Xem biểu đồ tổng quan', targetRoute: '/home' },
          { label: '📋 Xem chi tiết từng khoản', targetRoute: '/debts' },
        ],
      };

      return { text, uiSignal };
    } catch (err: any) {
      console.error('[DebtSummaryWorker] error:', err.message);
      onToolStatus(null);

      const fallback =
        'Xin lỗi, tôi không thể tải thông tin nợ lúc này. Vui lòng thử lại sau hoặc kiểm tra trực tiếp tại mục Quản lý nợ.';
      onToken(fallback);
      return { text: fallback, uiSignal: null };
    }
  },
};
