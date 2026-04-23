import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { formatVND } from '../../utils/calculations';
import { TrendingDown, Activity } from 'lucide-react';

export default function DebtFluctuationChart({ data }) {
  if (!data || data.length < 2) return null;

  const formattedData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }),
    formattedBalance: formatVND(item.balance),
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] p-3 rounded-xl shadow-xl">
          <p className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">{data.formattedDate}</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <p className="text-[13px] text-[var(--color-text-secondary)]">{data.label}</p>
          </div>
          <p className="text-[16px] font-black text-[var(--color-text-primary)]">{data.formattedBalance}</p>
          {data.amount > 0 && (
            <p className="text-[12px] font-bold text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingDown size={12} /> Đã trả: {formatVND(data.amount)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border p-5 relative overflow-hidden mt-6"
      style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-black text-[var(--color-text-primary)] flex items-center gap-2">
          <Activity size={15} className="text-blue-400" /> Biến động dư nợ
        </h3>
      </div>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(59,130,246,0.2)', strokeWidth: 2, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#3b82f6" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#1e293b', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
