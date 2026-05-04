import { motion } from 'framer-motion';
import { BarChart2, CreditCard, HeartPulse, Thermometer } from 'lucide-react';
import { formatPercent, formatVND } from '../../../utils/calculations';
const CARDS = [
  {
    key: 'health',
    icon: HeartPulse,
    label: 'Sức khỏe',
    gradient: 'from-emerald-500 to-teal-400',
    glow: '#10b981',
    bg: 'from-emerald-950/60 via-slate-900/80 to-slate-900/90',
  },
  {
    key: 'debt',
    icon: CreditCard,
    label: 'Tổng nợ',
    gradient: 'from-red-500 to-rose-400',
    glow: '#ef4444',
    bg: 'from-red-950/60 via-slate-900/80 to-slate-900/90',
  },
  {
    key: 'ear',
    icon: BarChart2,
    label: 'EAR trung bình',
    gradient: 'from-purple-500 to-violet-400',
    glow: '#8b5cf6',
    bg: 'from-purple-950/60 via-slate-900/80 to-slate-900/90',
  },
  {
    key: 'sentiment',
    icon: Thermometer,
    label: 'Tâm lý TT',
    gradient: 'from-blue-500 to-cyan-400',
    glow: '#3b82f6',
    bg: 'from-blue-950/60 via-slate-900/80 to-slate-900/90',
  },
];

function AnimatedBar({ value, max = 100, gradient }: { value: number; max?: number; gradient: string }) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mt-3">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1.2, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

interface KPICardsProps {
  debtSummary: any;
  debts: any[];
  sentiment: any;
  healthScore: number;
  healthColor: string;
  healthLabel: string;
  sentimentColor: string;
  onHealthClick: () => void;
}

export default function KPICards({
  debtSummary,
  debts,
  sentiment,
  healthScore,
  healthColor,
  healthLabel,
  sentimentColor,
  onHealthClick,
}: KPICardsProps) {
  const configs = [
    {
      ...CARDS[0],
      glow: healthColor,
      value: `${healthScore}`,
      unit: '/850',
      sub: healthLabel,
      barValue: healthScore,
      barMax: 850,
    },
    {
      ...CARDS[1],
      value: formatVND(debtSummary.totalBalance || 0),
      unit: undefined,
      sub: `${debts.length} khoản • tối thiểu ${formatVND(debtSummary.totalMinPayment || 0)}/tháng`,
      barValue: null,
    },
    {
      ...CARDS[2],
      value: formatPercent(debtSummary.averageEAR || 0),
      unit: undefined,
      sub: 'Chi phí thực tế / năm',
      barValue: null,
    },
    {
      ...CARDS[3],
      glow: sentimentColor,
      value: `${sentiment.value || 50}`,
      unit: '/100',
      sub: sentiment.labelVi || 'Trung lập',
      barValue: sentiment.value || 50,
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {configs.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className={`group ${card.key === 'health' ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500/50 rounded-3xl' : 'cursor-default'}`}
          onClick={() => {
            if (card.key === 'health') {
              onHealthClick();
            }
          }}
        >
          {/* Outer glow ring */}
          <div
            className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, ${card.glow}40, transparent 60%)` }}
          />

          <div
            className="relative rounded-3xl overflow-hidden border h-full transition-all"
            style={{
              borderColor: `${card.glow}30`,
              boxShadow: `0 4px 24px ${card.glow}15, 0 1px 0 ${card.glow}20 inset`,
              background: 'var(--color-bg-card)',
            }}
          >
            {/* Gradient top streak */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${card.glow}80, transparent)` }}
            />
            {/* Corner glow */}
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              style={{ background: card.glow }}
            />

            <div className="relative p-5 flex flex-col h-full">
              {/* Icon + Label */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${card.glow}20`, boxShadow: `0 0 12px ${card.glow}30` }}
                  >
                    <card.icon size={18} style={{ color: card.glow }} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                    {card.label}
                  </span>
                </div>
                {card.key === 'health' && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full animate-pulse">
                    Xem lịch sử
                  </span>
                )}
              </div>

              {/* Value */}
              <div className="flex items-end gap-1 mb-1">
                <span
                  className={`font-black leading-none tracking-tighter bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}
                  style={{ fontSize: card.value.length > 12 ? '20px' : '32px' }}
                >
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-sm text-[var(--color-text-muted)] mb-0.5 font-medium">{card.unit}</span>
                )}
              </div>

              {/* Subtitle */}
              <p className="text-[11px] text-[var(--color-text-muted)] leading-snug mt-auto">{card.sub}</p>

              {/* Progress bar */}
              {card.barValue !== null && card.barValue !== undefined && (
                <AnimatedBar value={card.barValue} max={(card as any).barMax} gradient={card.gradient} />
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
