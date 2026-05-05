import { useNavigate } from 'react-router-dom';
import { type UiSignal } from '../../hooks/useAgenticChat';
import DebtConfirmModal from './DebtConfirmModal';

interface Props {
  signal: UiSignal | null;
  onDismiss: () => void;
  onConfirmed?: (signal: UiSignal) => void;
  /** Optional: send feedback text back into the chat session */
  onFeedback?: (status: 'confirmed' | 'cancelled' | 'failed', reason?: string) => void;
}

export default function UiSignalDispatcher({ signal, onDismiss, onConfirmed, onFeedback }: Props) {
  const navigate = useNavigate();

  if (!signal || signal.type === 'NONE') return null;

  // ── REDIRECT ────────────────────────────────────────────────────────
  if (signal.type === 'REDIRECT') {
    // Schema field is `targetRoute` (not data.route)
    const route = (signal as any).targetRoute ?? (signal.data as any)?.route;
    if (route) {
      setTimeout(() => {
        try {
          navigate(route);
        } catch (e) {
          console.warn('[UiSignalDispatcher] Unknown redirect route:', route, e);
        }
      }, 600);
    } else {
      console.warn('[UiSignalDispatcher] REDIRECT signal missing targetRoute');
    }
    onDismiss();
    return null;
  }

  // ── SHOW_POPUP ──────────────────────────────────────────────────────
  if (signal.type === 'SHOW_POPUP') {
    switch (signal.action) {
      case 'DEBT_CONFIRMATION':
        return (
          <DebtConfirmModal
            data={signal.data ?? null}
            onConfirm={() => {
              onConfirmed?.(signal);
              onDismiss();
            }}
            onDismiss={onDismiss}
            onFeedback={onFeedback}
          />
        );

      case 'REPAYMENT_CONFIRMATION':
        console.info('[UiSignalDispatcher] REPAYMENT_CONFIRMATION — modal not yet implemented (Task 4.4)');
        return null;

      case 'INVESTMENT_CONFIRMATION':
        console.info('[UiSignalDispatcher] INVESTMENT_CONFIRMATION — modal not yet implemented (Task 4.5)');
        return null;

      default:
        console.warn('[UiSignalDispatcher] Unknown SHOW_POPUP action:', signal.action);
        return null;
    }
  }

  // ── SHOW_INTERACTIVE_CARD ───────────────────────────────────────────
  if (signal.type === 'SHOW_INTERACTIVE_CARD') {
    switch (signal.action) {
      case 'DEBT_SUMMARY_ACTIONS':
        console.info('[UiSignalDispatcher] DEBT_SUMMARY_ACTIONS — card not yet implemented (Task 4.6)');
        return null;

      default:
        console.warn('[UiSignalDispatcher] Unknown SHOW_INTERACTIVE_CARD action:', signal.action);
        return null;
    }
  }

  console.warn('[UiSignalDispatcher] Unhandled UiSignal type:', signal.type);
  return null;
}
