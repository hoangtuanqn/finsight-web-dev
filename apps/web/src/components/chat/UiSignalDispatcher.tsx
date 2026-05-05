import { useNavigate } from 'react-router-dom';
import { type UiSignal } from '../../hooks/useAgenticChat';
import DebtConfirmModal from './DebtConfirmModal';
import DebtSummaryCard from './DebtSummaryCard';
import RepaymentConfirmModal from './RepaymentConfirmModal';

interface Props {
  signal: UiSignal | null;
  onDismiss: () => void;
  onConfirmed?: (signal: UiSignal) => void;
  /** Optional: send feedback text back into the chat session */
  onFeedback?: (status: 'confirmed' | 'cancelled' | 'failed', reason?: string) => void;
  /** Whether the user is currently filling a modal (blocks auto-redirect). */
  isModalOpen?: boolean;
}

// Known routes in apps/web — unknown routes fall back gracefully.
const KNOWN_ROUTES = new Set([
  '/',
  '/home',
  '/debts',
  '/debts/repayment',
  '/debts/goal',
  '/investment',
  '/investment/my-portfolio',
  '/risk-assessment',
  '/expenses',
  '/profile',
  '/upgrade',
  '/knowledge',
  '/affiliate',
  '/kyc',
]);

function isSafeRoute(route: string): boolean {
  if (KNOWN_ROUTES.has(route)) return true;
  // Allow parametric routes like /wallets/:id
  if (/^\/wallets\/[^/]+$/.test(route)) return true;
  if (/^\/investment\/[^/]+$/.test(route)) return true;
  if (/^\/debts\/[^/]+$/.test(route)) return true;
  return false;
}

export default function UiSignalDispatcher({ signal, onDismiss, onConfirmed, onFeedback, isModalOpen = false }: Props) {
  const navigate = useNavigate();

  if (!signal || signal.type === 'NONE') return null;

  // ── REDIRECT (Task 4.7) ──────────────────────────────────────────────────────
  if (signal.type === 'REDIRECT') {
    const route = (signal as any).targetRoute ?? (signal as any).data?.route;

    if (!route) {
      console.warn('[UiSignalDispatcher] REDIRECT signal missing targetRoute');
      onDismiss();
      return null;
    }

    // Do not redirect if a modal is open (user might be filling a form)
    if (isModalOpen) {
      console.info('[UiSignalDispatcher] REDIRECT deferred — modal is open');
      onDismiss();
      return null;
    }

    if (!isSafeRoute(route)) {
      console.warn('[UiSignalDispatcher] REDIRECT to unknown route, ignoring:', route);
      onDismiss();
      return null;
    }

    // Delay so the user can read any accompanying text message
    const delay = (signal as any).message ? 1200 : 600;
    setTimeout(() => {
      try {
        navigate(route);
      } catch (e) {
        console.warn('[UiSignalDispatcher] navigate failed:', route, e);
      }
    }, delay);

    onDismiss();
    return null;
  }

  // ── SHOW_POPUP ───────────────────────────────────────────────────────────────
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
        return (
          <RepaymentConfirmModal data={(signal as any).data ?? null} onDismiss={onDismiss} onFeedback={onFeedback} />
        );

      case 'INVESTMENT_CONFIRMATION':
        console.info('[UiSignalDispatcher] INVESTMENT_CONFIRMATION — modal not yet implemented (Task 4.5)');
        return null;

      default:
        console.warn('[UiSignalDispatcher] Unknown SHOW_POPUP action:', (signal as any).action);
        return null;
    }
  }

  // ── SHOW_INTERACTIVE_CARD (Task 4.6) ─────────────────────────────────────────
  if (signal.type === 'SHOW_INTERACTIVE_CARD') {
    switch (signal.action) {
      case 'DEBT_SUMMARY_ACTIONS':
        return <DebtSummaryCard buttons={(signal as any).buttons ?? []} onNavigated={onDismiss} />;

      default:
        console.warn('[UiSignalDispatcher] Unknown SHOW_INTERACTIVE_CARD action:', (signal as any).action);
        return null;
    }
  }

  console.warn('[UiSignalDispatcher] Unhandled UiSignal type:', (signal as any).type);
  return null;
}
