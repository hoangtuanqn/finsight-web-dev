import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { CardHeader } from './Card';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl p-3 shadow-2xl">
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-[12px]">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-300 font-medium">{p.name}:</span>
          <span className="font-black text-white">{p.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
};

export default function EARChart({ earChartData = [] }) {
  return (
    <div
      className="relative rounded-3xl p-6 h-full flex flex-col overflow-hidden border"
      style={{
        background:  'var(--color-bg-card)',
        borderColor: 'rgba(59,130,246,0.15)',
        boxShadow:   '0 4px 30px rgba(59,130,246,0.08), 0 1px 0 rgba(59,130,246,0.2) inset',
      }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      {/* Background glow */}
      <div className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <CardHeader
        icon={<BarChart2 size={16} />}
        title="APR vs EAR — Chi phí ẩn"
        subtitle="Lãi suất quảng cáo so với chi phí thực tế hàng năm"
      />

      <div className="flex-1 min-h-[200px] relative">
        {earChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={earChartData} barGap={4} barCategoryGap="30%">
              <defs>
                <linearGradient id="gradAPR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
                <linearGradient id="gradEAR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                width={36}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }} />
              <Bar dataKey="APR" fill="url(#gradAPR)" radius={[6, 6, 0, 0]} barSize={20} name="APR (quảng cáo)" />
              <Bar dataKey="EAR" fill="url(#gradEAR)" radius={[6, 6, 0, 0]} barSize={20} name="EAR (thực tế)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <BarChart2 size={28} className="text-blue-500/50" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-muted)]">Chưa có dữ liệu nợ</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 pt-4 mt-2 border-t border-white/5">
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-blue-400 to-blue-600" /> APR (quảng cáo)
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-red-400 to-red-600" /> EAR (thực tế)
        </div>
      </div>
    </div>
  );
}
