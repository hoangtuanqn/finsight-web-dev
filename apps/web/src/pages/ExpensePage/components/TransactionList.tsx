import { motion } from 'framer-motion';
import { Calendar, Tag, ChevronRight } from 'lucide-react';

interface TransactionListProps {
  expenses: any[];
  loading: boolean;
  onEdit: (expense: any) => void;
}

export function TransactionList({ expenses, loading, onEdit }: TransactionListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-[var(--color-bg-secondary)]/50 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-16 text-center space-y-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl shadow-sm">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <Calendar size={24} className="text-blue-500/50" />
        </div>
        <div>
          <p className="font-bold text-[var(--color-text-primary)]">Chưa có giao dịch nào</p>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">Ghi chép chi tiêu để quản lý tài chính tốt hơn.</p>
        </div>
      </div>
    );
  }

  // Group by date
  const grouped = expenses.reduce((acc: any, exp: any) => {
    const date = new Date(exp.date);
    // Use local date string as key to group correctly in user's timezone
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        dayOfWeek: date.toLocaleDateString('vi-VN', { weekday: 'long' }),
        day: date.getDate(),
        monthYear: `Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`,
        items: [],
        totalIncome: 0,
        totalExpense: 0
      };
    }
    acc[dateStr].items.push(exp);
    if (exp.type === 'INCOME') acc[dateStr].totalIncome += exp.amount;
    if (exp.type === 'EXPENSE') acc[dateStr].totalExpense += exp.amount;
    return acc;
  }, {});

  const sortedGroups = Object.values(grouped).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6">
      {sortedGroups.map((group: any, gIdx: number) => (
        <motion.div 
          key={group.date}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: gIdx * 0.05 }}
          className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-3xl overflow-hidden shadow-sm"
        >
          {/* Day Header */}
          <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black">{String(group.day).padStart(2, '0')}</span>
              <div className="flex flex-col">
                <span className="text-[12px] font-bold capitalize">{group.dayOfWeek}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-muted)]">{group.monthYear}</span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              {group.totalIncome > 0 && (
                <span className="text-[12px] font-bold text-emerald-500">+{formatCurrency(group.totalIncome)}</span>
              )}
              {group.totalExpense > 0 && (
                <span className="text-[12px] font-bold text-red-500">-{formatCurrency(group.totalExpense)}</span>
              )}
            </div>
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-[var(--color-border)]">
            {group.items.map((item: any) => (
              <button
                key={item.id}
                onClick={() => onEdit(item)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-[var(--color-bg-secondary)]/50 transition-colors group text-left"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-[24px] shadow-sm shrink-0"
                    style={{ background: `${item.category.color}15`, color: item.category.color }}
                  >
                    {item.category.icon || <Tag size={18} />}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[var(--color-text-primary)] group-hover:text-blue-500 transition-colors line-clamp-1">
                      {item.description || item.category.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
                        {item.category.name}
                      </span>
                      <span className="text-[var(--color-text-muted)] opacity-50">•</span>
                      <span className="text-[11px] font-bold text-[var(--color-text-muted)]">
                        {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[15px] font-black ${item.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(item.amount)}
                  </span>
                  <ChevronRight size={16} className="text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity -mr-2" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
