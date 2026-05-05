import { motion } from 'framer-motion';
import { AlertTriangle, BarChart2 } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatPercent } from '../../utils/calculations';

const COLORS: Record<string, string> = {
  apr: '#3b82f6',
  interestEffect: '#a855f7', // Màu tím cho chênh lệch lãi suất
  processingFee: '#f97316',
  insuranceFee: '#ef4444',
  managementFee: '#f59e0b',
};

interface Breakdown {
  apr: number;
  interestEffect: number;
  processingFee: number;
  insuranceFee: number;
  managementFee: number;
  totalEAR: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      className="glass-card"
      style={{
        padding: '12px 16px',
        fontSize: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: '160px',
      }}
    >
      <p className="text-slate-400 mb-2 font-medium border-b border-slate-700/50 pb-2">Chi tiết EAR</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, index: number) => {
          if (entry.value <= 0.01) return null;
          return (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-300">{entry.name}</span>
              </div>
              <span className="text-slate-100 font-bold">{entry.value.toFixed(2)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function EARBreakdown({ breakdown }: { breakdown: Breakdown }) {
  if (!breakdown) return null;

  const components = [
    { name: 'APR', value: breakdown.apr, key: 'apr' },
    { name: 'Chênh lệch lãi', value: breakdown.interestEffect, key: 'interestEffect' },
    { name: 'Phí xử lý', value: breakdown.processingFee, key: 'processingFee' },
    { name: 'Bảo hiểm', value: breakdown.insuranceFee, key: 'insuranceFee' },
    { name: 'Quản lý', value: breakdown.managementFee, key: 'managementFee' },
  ].filter((d) => d.value > 0.01);

  // For stacked bar chart, we need a single data object with all properties
  const chartData = [
    components.reduce(
      (acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      },
      { name: 'EAR' } as any,
    ),
  ];

  const totalEAR = breakdown.totalEAR;
  const hiddenCost = totalEAR - breakdown.apr;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold flex items-center gap-2 text-slate-200">
          <BarChart2 size={16} /> Phân tích EAR
        </h3>
        <div className="text-right">
          <p className="text-xl font-bold text-red-400">{formatPercent(totalEAR)}</p>
          <p className="text-[11px] text-slate-500">Chi phí thực tế/năm</p>
        </div>
      </div>

      {hiddenCost > 0.01 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-[12px] text-red-400 flex items-center gap-1">
            <AlertTriangle size={12} className="shrink-0" /> Chi phí ẩn:{' '}
            <span className="font-bold">+{formatPercent(hiddenCost)}</span> so với lãi suất quảng cáo
          </p>
        </div>
      )}

      <div className="h-24 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis type="number" hide domain={[0, totalEAR]} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />

            {/* Render stacked bars dynamically based on components */}
            {components.map((comp, index) => {
              // Custom radius to round only the first and last segments
              const isFirst = index === 0;
              const isLast = index === components.length - 1;
              const radius: [number, number, number, number] = [
                isLast ? 6 : 0,
                isLast ? 6 : 0,
                isLast ? 6 : 0,
                isLast ? 6 : 0,
              ];

              if (isFirst && isLast) {
                return (
                  <Bar
                    key={comp.key}
                    dataKey={comp.key}
                    name={comp.name}
                    stackId="a"
                    fill={COLORS[comp.key]}
                    radius={[6, 6, 6, 6]}
                    barSize={24}
                  />
                );
              } else if (isFirst) {
                return (
                  <Bar
                    key={comp.key}
                    dataKey={comp.key}
                    name={comp.name}
                    stackId="a"
                    fill={COLORS[comp.key]}
                    radius={[0, 0, 0, 0]}
                    barSize={24}
                  />
                );
              } else if (isLast) {
                return (
                  <Bar
                    key={comp.key}
                    dataKey={comp.key}
                    name={comp.name}
                    stackId="a"
                    fill={COLORS[comp.key]}
                    radius={[0, 6, 6, 0]}
                    barSize={24}
                  />
                );
              } else {
                return (
                  <Bar
                    key={comp.key}
                    dataKey={comp.key}
                    name={comp.name}
                    stackId="a"
                    fill={COLORS[comp.key]}
                    radius={[0, 0, 0, 0]}
                    barSize={24}
                  />
                );
              }
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-1">
        {components.map((d) => (
          <div key={d.key} className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[d.key] }} />
            <span className="text-slate-500">
              {d.name}: <span className="text-slate-300 font-medium">{formatPercent(d.value)}</span>
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
