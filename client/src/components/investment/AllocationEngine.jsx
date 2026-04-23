import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, Layers } from 'lucide-react';
import { COLORS, ASSET_LABELS, TOOLTIP_STYLE } from './InvestmentConstants.js';
import { DeltaChip } from './InvestmentUtils.jsx';
import { formatVND } from '../../utils/calculations';

export default function AllocationEngine({ pieData, portfolioBreakdown, history = [] }) {
  const prev = history?.[1] || null;
  const curr = history?.[0] || null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <PieIcon size={16} className="text-blue-400" />
          </div>
          Cấu trúc danh mục AI
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Layers size={14} />
          Chiến lược tối ưu
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Chart Side */}
        <div className="h-[320px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={pieData} 
                cx="50%" 
                cy="50%" 
                innerRadius={75} 
                outerRadius={115} 
                paddingAngle={5} 
                dataKey="value"
                stroke="none"
                cornerRadius={8}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className="hover:opacity-80 hover:scale-105 transition-all duration-300 cursor-pointer origin-center"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{...TOOLTIP_STYLE, borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)'}}
                itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: '600' }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Info */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none drop-shadow-md">
            <span className="text-4xl font-bold text-white tracking-tight">100%</span>
            <span className="text-xs font-medium text-slate-400 mt-1">Đã phân bổ</span>
          </div>
        </div>

        {/* Breakdown List Side */}
        <div className="space-y-3">
          {portfolioBreakdown.filter(p => p.percentage > 0).map((p, i) => {
            const assetKey = Object.entries(ASSET_LABELS).find(([, v]) => v === p.asset)?.[0];
            return (
              <div 
                key={i} 
                className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all duration-300 hover:shadow-md hover:border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-1.5 h-10 rounded-full shrink-0 shadow-sm" 
                    style={{ background: COLORS[i % COLORS.length], boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}40` }} 
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-400 block mb-0.5">
                      {p.asset}
                    </span>
                    <span className="text-lg font-bold text-white leading-none">
                      {formatVND(p.amount)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-4">
                    {assetKey && curr && prev && (
                      <DeltaChip 
                        current={curr[assetKey] ?? p.percentage} 
                        previous={prev[assetKey] ?? null} 
                      />
                    )}
                    <span className="text-2xl font-bold text-white tracking-tight min-w-[3rem] text-right">
                      {p.percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
