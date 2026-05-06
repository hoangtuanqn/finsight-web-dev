import { BarChart2, ChevronRight, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CardButton {
  label: string;
  targetRoute: string;
}

interface Props {
  buttons: CardButton[];
  onNavigated?: () => void;
}

/**
 * Task 4.6 — Compact interactive card rendered inside the chat bubble area.
 * Shows 2 navigation actions for the Debt Summary intent.
 * Must stay within the 400px chat column — no heavy tables or charts.
 */
export default function DebtSummaryCard({ buttons, onNavigated }: Props) {
  const navigate = useNavigate();

  const getIcon = (route: string) => {
    if (route === '/home') return <BarChart2 className="w-4 h-4 flex-shrink-0" />;
    if (route === '/debts') return <List className="w-4 h-4 flex-shrink-0" />;
    return <ChevronRight className="w-4 h-4 flex-shrink-0" />;
  };

  const handleClick = (targetRoute: string) => {
    try {
      navigate(targetRoute);
      onNavigated?.();
    } catch (e) {
      console.warn('[DebtSummaryCard] Unknown route:', targetRoute, e);
    }
  };

  return (
    <div
      className="mt-2 rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-secondary)',
        maxWidth: '100%',
      }}
    >
      {/* Card header */}
      <div
        className="px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
        style={{
          borderBottom: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          background: 'var(--color-bg-elevated)',
        }}
      >
        <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
        Hành động nhanh
      </div>

      {/* Action buttons */}
      <div className="flex flex-col divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {buttons.map((btn) => (
          <button
            key={btn.targetRoute}
            onClick={() => handleClick(btn.targetRoute)}
            className="flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-blue-500/8 group"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span className="flex items-center gap-2 text-blue-400 group-hover:text-blue-300 transition-colors">
              {getIcon(btn.targetRoute)}
              <span style={{ color: 'var(--color-text-primary)' }}>{btn.label}</span>
            </span>
            <ChevronRight
              className="w-3.5 h-3.5 flex-shrink-0 opacity-40 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all"
              style={{ color: 'var(--color-text-secondary)' }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
