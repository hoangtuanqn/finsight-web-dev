import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { TOOLTIP_STYLE } from './InvestmentConstants.js';
import { formatVND } from '../../utils/calculations';

export default function WealthProjection({ projectionData, mockProfile }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Ambient Glow */}
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
        
        <div className="flex items-center gap-4 bg-white/[0.02] border border-white/5 px-5 py-2.5 rounded-full shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Lạm phát:</span>
            <span className="text-sm font-bold text-white">{mockProfile.inflationRate ?? 3.5}%</span>
          </div>
          <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Mô hình:</span>
            <span className="text-sm font-bold text-blue-400">Xác suất</span>
          </div>
        </div>
      </div>

      <div className="h-[380px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="year" 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} 
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v / 1000000).toFixed(0)}M`}
              dx={-15}
            />
            <Tooltip 
              contentStyle={{...TOOLTIP_STYLE, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)'}} 
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
      </div>

      <div className="mt-8 p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-start gap-4 relative z-10">
        <div className="p-1.5 rounded-full bg-blue-500/10 shrink-0 mt-0.5">
           <Info size={16} className="text-blue-400" />
        </div>
        <p className="text-xs font-medium text-slate-400 leading-relaxed">
          Giá trị dự phóng đã tính chiết khấu lạm phát ({mockProfile.inflationRate ?? 3.5}%/năm). 
          Mô hình sử dụng phương pháp mô phỏng xác suất để tính toán 3 kịch bản thị trường. 
          Kết quả phản ánh giá trị tài sản ròng quy đổi về sức mua hiện tại.
        </p>
      </div>
    </div>
  );
}
