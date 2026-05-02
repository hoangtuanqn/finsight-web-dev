import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatVND } from '../../utils/calculations';

export default function DebtFluctuationChart({ data }) {
  if (!data || data.length === 0) return null;

  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' }),
    formattedAmount: formatVND(item.paidAmount),
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-3 rounded-xl shadow-xl">
          <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
            {data.formattedDate}
          </p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">Đã thanh toán</p>
          </div>
          <p className="text-[16px] font-black text-emerald-400">{data.formattedAmount}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-5 relative overflow-hidden mt-6"
      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
    >
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-black text-[var(--color-text-primary)] flex items-center gap-2">
          <Calendar size={15} className="text-emerald-400" /> Thanh toán hàng tháng
        </h3>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
            <XAxis
              dataKey="formattedDate"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 600 }}
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(0)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                return val;
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(16,185,129,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="paidAmount"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorPaid)"
              activeDot={{ r: 6, fill: '#10b981', stroke: '#1e293b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
