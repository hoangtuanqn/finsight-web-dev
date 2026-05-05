import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface CashFlowData {
  date: string;
  in: number;
  out: number;
  net: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return value.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Dự báo dòng tiền 30 ngày</h3>
          <p className="text-xs text-slate-500 mt-1 italic">Dựa trên lịch thanh toán các khoản nợ trong hạn</p>
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 10, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid rgba(148,163,184,0.15)',
                backgroundColor: '#0f172a',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                fontSize: '12px',
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 700 }}
              itemStyle={{ color: '#e2e8f0' }}
              cursor={{ fill: 'rgba(148,163,184,0.06)' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
              formatter={(value: number) => [formatCurrency(value) + 'đ', '']}
            />
            <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
            <ReferenceLine y={0} stroke="#CBD5E1" />
            <Bar dataKey="in" name="Tiền thu (In)" fill="#10B981" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="out" name="Tiền chi (Out)" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
