import { PieChart as PieChartIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CardHeader } from './Card';

const PALETTE = [
  { fill: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { fill: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  { fill: '#f59e0b', glow: 'rgba(245,158,11,0.4)' },
  { fill: '#10b981', glow: 'rgba(16,185,129,0.4)' },
  { fill: '#8b5cf6', glow: 'rgba(139,92,246,0.4)' },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl px-3 py-2 shadow-2xl text-[12px]">
      <span className="font-black text-white">{payload[0].name}</span>
      <span className="text-slate-400 ml-2">{payload[0].value} khoản</span>
    </div>
  );
};

export default function PlatformPie({ platformPieData = [] }: { platformPieData?: any[] }) {
  const total = platformPieData.reduce((s, p) => s + p.value, 0);

  return (
    <div
      className="relative rounded-3xl p-6 h-full flex flex-col overflow-hidden border"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: 'rgba(139,92,246,0.12)',
        boxShadow: '0 4px 30px rgba(139,92,246,0.06), 0 1px 0 rgba(139,92,246,0.15) inset',
      }}
    >
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-purple-600/8 blur-3xl pointer-events-none" />

      <CardHeader icon={<PieChartIcon size={16} />} title="Phân bổ nền tảng" subtitle="Theo số lượng khoản nợ" />

      {platformPieData.length > 0 ? (
        <div className="flex-1 flex flex-col">
          {/* Donut */}
          <div className="h-[150px] shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {PALETTE.map((p, i) => (
                    <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>
                <Pie
                  data={platformPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={64}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                >
                  {platformPieData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length].fill} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-[22px] font-black text-[var(--color-text-primary)]">{total}</div>
                <div className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">
                  khoản nợ
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-4 flex-1">
            {platformPieData.map((p, i) => {
              const pct = Math.round((p.value / total) * 100);
              const color = PALETTE[i % PALETTE.length].fill;
              return (
                <div key={i} className="flex items-center gap-2.5 group">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                  <span className="text-[12px] text-[var(--color-text-secondary)] flex-1 truncate">{p.name}</span>
                  <span className="text-[11px] font-black" style={{ color }}>
                    {pct}%
                  </span>
                  <div className="w-14 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color, boxShadow: `0 0 4px ${color}` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[13px] text-[var(--color-text-muted)]">Chưa có dữ liệu</p>
        </div>
      )}
    </div>
  );
}
