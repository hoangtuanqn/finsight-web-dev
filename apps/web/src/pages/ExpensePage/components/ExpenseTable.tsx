import { motion } from 'framer-motion';
import { Calendar, Edit2, Tag, Trash2 } from 'lucide-react';
import { useExpenseMutations } from '../../../hooks/useExpenseQuery';

interface ExpenseTableProps {
  expenses: any[];
  loading: boolean;
  onEdit: (expense: any) => void;
}

export function ExpenseTable({ expenses, loading, onEdit }: ExpenseTableProps) {
  const { deleteExpense } = useExpenseMutations();

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-bg-secondary)]/50 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
          <Calendar size={24} className="text-blue-500/50" />
        </div>
        <div>
          <p className="font-bold text-[var(--color-text-primary)]">Chưa có giao dịch nào</p>
          <p className="text-[13px] text-[var(--color-text-muted)]">Hãy thêm giao dịch đầu tiên để bắt đầu theo dõi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
            <th className="px-6 py-4">Ngày</th>
            <th className="px-6 py-4">Nội dung / Danh mục</th>
            <th className="px-6 py-4 text-right">Số tiền</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {expenses.map((item, idx) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group hover:bg-blue-500/3 transition-colors"
            >
              <td className="px-6 py-5">
                <div className="text-[13px] font-bold text-[var(--color-text-primary)]">{formatDate(item.date)}</div>
                <div className="text-[11px] text-[var(--color-text-muted)] font-medium">
                  {new Date(item.date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[22px] shadow-sm shrink-0"
                    style={{ background: `${item.category.color}15`, color: item.category.color }}
                  >
                    {item.category.icon || <Tag size={16} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-bold text-[var(--color-text-primary)] group-hover:text-blue-400 transition-colors">
                        {item.description || 'Không có mô tả'}
                      </div>
                      {item.type === 'INCOME' && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-wider">
                          Thu
                        </span>
                      )}
                      {item.type === 'EXPENSE' && (
                        <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-wider">
                          Chi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[11px] font-bold tracking-wider" style={{ color: item.category.color }}>
                        {item.category.name}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <div
                  className={`text-[15px] font-black ${item.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'}`}
                >
                  {item.type === 'INCOME' ? '+' : '-'}
                  {formatCurrency(item.amount)}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-2 rounded-lg hover:bg-blue-500/10 text-[var(--color-text-muted)] hover:text-blue-500 transition-all"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Bạn có chắc muốn xoá giao dịch này?')) {
                        deleteExpense.mutate(item.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-500 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
