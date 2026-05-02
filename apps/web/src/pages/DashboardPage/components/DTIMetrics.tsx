import { motion } from 'framer-motion';
import { ArrowRight, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPercent, formatVND } from '../../../utils/calculations';
import { CardHeader } from './Card';

interface DTIMetricsProps {
  dtiRatio: number;
  dtiColor: string;
  dtiZoneLabel: string;
  dtiLabel: string;
  debtSummary: any;
  monthlyIncome: number | undefined;
}

export default function DTIMetrics({
  dtiRatio,
  dtiColor,
  dtiZoneLabel,
  dtiLabel,
  debtSummary,
  monthlyIncome,
}: DTIMetricsProps) {
  const circumference = 2 * Math.PI * 48;
  const dash = Math.min(100, dtiRatio) / 100;

  const cashflow = [
    { label: 'Thu nhập / tháng', value: monthlyIncome || 0, gradient: 'from-emerald-500 to-teal-400', glow: '#10b981' },
    {
      label: 'Trả nợ / tháng',
      value: debtSummary.totalMinPayment || 0,
      gradient: 'from-red-500 to-rose-400',
      glow: '#ef4444',
    },
    {
      label: 'Còn lại / tháng',
      value: (monthlyIncome || 0) - (debtSummary.totalMinPayment || 0),
      gradient: 'from-blue-500 to-cyan-400',
      glow: '#3b82f6',
    },
  ];

  return (
    <div
      className="relative rounded-3xl p-6 h-full flex flex-col overflow-hidden border"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: `${dtiColor}20`,
        boxShadow: `0 4px 30px ${dtiColor}08, 0 1px 0 ${dtiColor}20 inset`,
      }}
    >
      <div
        className="absolute top-0 left-6 right-6 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${dtiColor}60, transparent)` }}
      />
      <div
        className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none"
        style={{ background: dtiColor }}
      />

      <CardHeader icon={<Ruler size={16} />} title="Chỉ số tài chính" subtitle="DTI & Cashflow hàng tháng" />

      <div className="flex-1 flex flex-col gap-5">
        {/* DTI Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative w-[100px] h-[100px] shrink-0">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-md opacity-30"
              style={{ background: `conic-gradient(${dtiColor} ${dash * 100}%, transparent 0%)` }}
            />
            <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
              {/* Track */}
              <circle cx="55" cy="55" r="48" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              {/* Animated progress */}
              <motion.circle
                cx="55"
                cy="55"
                r="48"
                fill="none"
                stroke={dtiColor}
                strokeWidth="8"
                strokeLinecap="round"
                filter={`drop-shadow(0 0 6px ${dtiColor})`}
                strokeDasharray={`${dash * circumference} ${circumference}`}
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ strokeDasharray: `${dash * circumference} ${circumference}` }}
                transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[18px] font-black leading-none" style={{ color: dtiColor }}>
                {formatPercent(dtiRatio)}
              </span>
              <span className="text-[9px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mt-0.5">
                DTI
              </span>
            </div>
          </div>

          <div className="flex-1">
            <div
              className="inline-block px-2.5 py-1 rounded-lg text-[10px] font-black mb-2"
              style={{ background: `${dtiColor}20`, color: dtiColor, boxShadow: `0 0 10px ${dtiColor}20` }}
            >
              {dtiZoneLabel}
            </div>
            <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-3">{dtiLabel}</p>
            <Link
              to="/debts/dti"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors group"
            >
              Phân tích chi tiết <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="h-px bg-white/5" />

        {/* Cashflow Breakdown */}
        <div className="space-y-3">
          {cashflow.map(({ label, value, gradient, glow }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${gradient}`}
                  style={{ boxShadow: `0 0 8px ${glow}60` }}
                />
                <span className="text-[12px] text-[var(--color-text-secondary)]">{label}</span>
              </div>
              <span className={`text-[13px] font-black bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                {formatVND(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
