import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { TOOLTIP_STYLE } from './InvestmentConstants';
import { formatVND } from '../../utils/calculations';

const CHART_MARGIN = { top: 20, right: 30, left: 20, bottom: 10 };
const AXIS_TICK = { fill: '#94a3b8', fontSize: 11, fontWeight: 600 };

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function compactVND(value) {
  const number = toNumber(value);
  const abs = Math.abs(number);

  if (abs >= 1_000_000_000) {
    const amount = number / 1_000_000_000;
    return `${amount >= 10 ? amount.toFixed(0) : amount.toFixed(1)} tỷ`;
  }

  return `${Math.round(number / 1_000_000)}tr`;
}

function FanLegend() {
  const items = [
    { label: 'Vùng 90%', className: 'bg-blue-500/20' },
    { label: 'Vùng 50%', className: 'bg-blue-400/35' },
    { label: 'Trung vị', className: 'bg-blue-400' },
    { label: 'Tiết kiệm', className: 'bg-slate-500' },
  ];

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-300">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`h-2 w-7 rounded-full ${item.className}`} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function FanChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload || {};
  const rows = [
    ['P95', row.p95, 'text-emerald-300'],
    ['P75', row.p75, 'text-blue-300'],
    ['Trung vị', row.median, 'text-white'],
    ['P25', row.p25, 'text-sky-300'],
    ['P5', row.p5, 'text-red-300'],
    ['Tiết kiệm', row.savings, 'text-slate-300'],
  ];

  return (
    <div
      className="rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl"
      style={{ maxWidth: 'min(18rem, calc(100vw - 3rem))' }}
    >
      <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">
        {label}
      </div>
      <div className="space-y-1.5">
        {rows.map(([name, value, className]) => (
          <div key={name} className="flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-slate-500">{name}</span>
            <span className={`font-black ${className}`}>{formatVND(toNumber(value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FanChart({ data }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={CHART_MARGIN}>
            <defs>
              <linearGradient id="wealthFan90" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="wealthFan50" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.38} />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.12} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="year"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={compactVND}
              dx={-15}
            />
            <Tooltip
              content={<FanChartTooltip />}
              wrapperStyle={{ outline: 'none' }}
              cursor={{ stroke: 'rgba(148,163,184,0.25)', strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="band90Base"
              stackId="band90"
              stroke="transparent"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="band90Range"
              stackId="band90"
              name="Vùng 90%"
              stroke="transparent"
              fill="url(#wealthFan90)"
              activeDot={false}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="band50Base"
              stackId="band50"
              stroke="transparent"
              fill="transparent"
              isAnimationActive={false}
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="band50Range"
              stackId="band50"
              name="Vùng 50%"
              stroke="transparent"
              fill="url(#wealthFan50)"
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="savings"
              name="Tiết kiệm"
              stroke="#64748b"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              activeDot={{ r: 5, fill: '#64748b', stroke: '#0F172A', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="median"
              name="Trung vị"
              stroke="#3b82f6"
              strokeWidth={4}
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0F172A' }}
              activeDot={{ r: 7, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }}
              style={{ filter: 'drop-shadow(0 4px 6px rgba(59,130,246,0.3))' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <FanLegend />
    </div>
  );
}

function LegacyLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={CHART_MARGIN}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="year"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          dy={15}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          tickFormatter={compactVND}
          dx={-15}
        />
        <Tooltip
          contentStyle={{ ...TOOLTIP_STYLE, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)' }}
          formatter={(v) => [formatVND(v), '']}
          labelStyle={{ fontWeight: 'bold', marginBottom: '8px', color: '#94a3b8', fontSize: '12px' }}
          itemStyle={{ fontWeight: 'bold', fontSize: '13px' }}
        />
        <Legend
          wrapperStyle={{ paddingTop: '30px', fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="monotone"
          dataKey="savings"
          name="100% Tiết kiệm"
          stroke="#64748b"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: '#64748b', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="optimistic"
          name="Lạc quan"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          strokeOpacity={0.5}
          activeDot={{ r: 5, fill: '#10b981', stroke: '#0F172A', strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="base"
          name="Chiến lược AI"
          stroke="#3b82f6"
          strokeWidth={4}
          dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#0F172A' }}
          activeDot={{ r: 7, strokeWidth: 2, fill: '#3b82f6', stroke: '#fff' }}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(59,130,246,0.3))' }}
        />
        <Line
          type="monotone"
          dataKey="pessimistic"
          name="Thận trọng"
          stroke="#ef4444"
          strokeWidth={2}
          dot={false}
          strokeOpacity={0.5}
          activeDot={{ r: 5, fill: '#ef4444', stroke: '#0F172A', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function WealthProjection({ projectionData, monteCarloData, mockProfile }) {
  const hasMonteCarlo = Array.isArray(monteCarloData) && monteCarloData.length >= 2;
  const modelLabel = hasMonteCarlo ? 'Monte Carlo' : 'Xác suất';
  const modelTone = hasMonteCarlo ? 'text-emerald-400' : 'text-blue-400';

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            Công cụ Dự phóng Tài sản
          </h3>
          <p className="text-sm font-medium text-slate-400 mt-2">Dự phóng tăng trưởng tài sản dài hạn</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-full shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Lạm phát:</span>
            <span className="text-sm font-bold text-white">{mockProfile?.inflationRate ?? 3.5}%</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Mô hình:</span>
            <span className={`text-sm font-bold ${modelTone}`}>{modelLabel}</span>
          </div>
        </div>
      </div>

      <div className="h-[360px] md:h-[380px] w-full relative z-10">
        {hasMonteCarlo
          ? <FanChart data={monteCarloData} />
          : <LegacyLineChart data={projectionData} />}
      </div>

      <div className="mt-8 p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4 relative z-10">
        <div className="p-1.5 rounded-full bg-blue-500/10 shrink-0 mt-0.5">
          <Info size={16} className="text-blue-400" />
        </div>
        <p className="text-xs font-medium text-slate-400 leading-relaxed">
          Giá trị dự phóng đã tính chiết khấu lạm phát ({mockProfile?.inflationRate ?? 3.5}%/năm).
          {' '}
          {hasMonteCarlo
            ? 'Vùng xác suất dùng percentile từ mô phỏng Monte Carlo; đường trung vị thể hiện kịch bản kỳ vọng cân bằng.'
            : 'Mô hình sử dụng phương pháp mô phỏng xác suất để tính toán 3 kịch bản thị trường.'}
          {' '}
          Kết quả phản ánh giá trị tài sản ròng quy đổi về sức mua hiện tại.
        </p>
      </div>
    </div>
  );
}
