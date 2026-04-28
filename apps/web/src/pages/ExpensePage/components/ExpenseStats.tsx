import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { PieChart as PieChartIcon, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface ExpenseStatsProps {
  stats: any;
  loading: boolean;
}

export function ExpenseStats({ stats, loading }: ExpenseStatsProps) {
  const data = stats?.byCategory || [];

  if (loading) {
    return (
      <div className="h-[400px] bg-[var(--color-bg-secondary)]/50 animate-pulse rounded-3xl" />
    );
  }

  return (
    <div className="rounded-3xl border bg-[var(--color-bg-card)] border-[var(--color-border)] p-6 space-y-8 shadow-sm">
      <div>
        <h3 className="font-bold text-[15px] flex items-center gap-2 mb-6">
          <PieChartIcon size={18} className="text-blue-500" />
          Phân bổ chi tiêu
        </h3>
        
        {data.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--color-bg-card)', 
                    borderColor: 'var(--color-border)',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }} 
                  itemStyle={{ color: 'var(--color-text-primary)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-50">
            <PieChartIcon size={40} className="text-[var(--color-text-muted)]" />
            <p className="text-[12px] font-medium">Chưa có dữ liệu chi tiêu để hiển thị biểu đồ.</p>
          </div>
        )}
      </div>

      {/* Legend & Breakdown */}
      <div className="space-y-4">
        {data.map((item: any) => {
          const percentage = stats?.totalExpense ? Math.round((item.value / stats.totalExpense) * 100) : 0;
          return (
            <div key={item.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-[18px]"
                    style={{ background: `${item.color}15`, color: item.color }}
                  >
                    {item.icon || <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[var(--color-text-primary)]">{item.name}</div>
                    <div className="text-[12px] font-medium text-[var(--color-text-muted)]">{percentage}%</div>
                  </div>
                </div>
                <div className="text-[15px] font-black">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.value)}
                </div>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className="h-full rounded-full"
                  style={{ background: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase text-blue-400">
            <Target size={12} /> AI Insight
          </div>
          <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-medium">
            {stats?.totalIncome > 0 ? (
              <>Dựa trên thu nhập, bạn nên dành ít nhất <strong>20%</strong> cho tiết kiệm và đầu tư. Hiện tại bạn đang tiết kiệm được <strong>{Math.max(0, Math.round(((stats.totalIncome - stats.totalExpense) / stats.totalIncome) * 100))}%</strong> thu nhập của mình.</>
            ) : (
              <>Hãy thêm các khoản thu nhập của bạn để AI có thể phân tích và đưa ra các lời khuyên về tỷ lệ tiết kiệm hợp lý.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
