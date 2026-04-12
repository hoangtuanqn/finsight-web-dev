import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { formatPercent } from '../../utils/calculations';

const COLORS = {
  apr: '#3b82f6',
  compoundEffect: '#8b5cf6',
  processingFee: '#f97316',
  insuranceFee: '#ef4444',
  managementFee: '#f59e0b',
};

const tooltipStyle = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
};

export default function EARBreakdown({ breakdown }) {
  if (!breakdown) return null;

  const chartData = [
    { name: 'APR', value: breakdown.apr, key: 'apr' },
    { name: 'Lãi kép', value: breakdown.compoundEffect, key: 'compoundEffect' },
    { name: 'Phí xử lý', value: breakdown.processingFee, key: 'processingFee' },
    { name: 'Bảo hiểm', value: breakdown.insuranceFee, key: 'insuranceFee' },
    { name: 'Quản lý', value: breakdown.managementFee, key: 'managementFee' },
  ].filter(d => d.value > 0);

  const totalEAR = breakdown.totalEAR;
  const hiddenCost = totalEAR - breakdown.apr;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-white flex items-center gap-2">
          <span>📊</span> Phân tích EAR
        </h3>
        <div className="text-right">
          <p className="text-xl font-bold text-red-400">{formatPercent(totalEAR)}</p>
          <p className="text-[11px] text-slate-500">Chi phí thực tế/năm</p>
        </div>
      </div>

      {hiddenCost > 0 && (
        <div className="bg-red-500/6 border border-red-500/15 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-[12px] text-red-400">
            ⚠️ Chi phí ẩn: <span className="font-bold">+{formatPercent(hiddenCost)}</span> so với lãi suất quảng cáo
          </p>
        </div>
      )}

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => `${v.toFixed(1)}%`} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#e2e8f0' }} formatter={(val) => [`${val.toFixed(2)}%`, '']} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.key] || '#64748b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4">
        {chartData.map(d => (
          <div key={d.key} className="flex items-center gap-1.5 text-[11px]">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[d.key] }} />
            <span className="text-slate-500">{d.name}: <span className="text-slate-400 font-medium">{formatPercent(d.value)}</span></span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
