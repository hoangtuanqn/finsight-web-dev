import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Info, ShieldAlert } from 'lucide-react';
import React from 'react';

interface ActionItem {
  type: 'DISPUTE' | 'PAYABLE_OVERDUE' | 'PAYABLE_DUE_SOON' | 'RECEIVABLE_OVERDUE' | 'RECEIVABLE_DUE_TODAY';
  priority: number;
  message: string;
  debtId: string;
  amount: number;
}

interface ActionItemsProps {
  items: ActionItem[];
}

export const ActionItems: React.FC<ActionItemsProps> = ({ items }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'PAYABLE_OVERDUE':
        return <ShieldAlert className="text-red-500" size={18} />;
      case 'PAYABLE_DUE_SOON':
        return <Clock className="text-orange-500" size={18} />;
      case 'RECEIVABLE_OVERDUE':
        return <AlertCircle className="text-rose-500" size={18} />;
      case 'RECEIVABLE_DUE_TODAY':
        return <Info className="text-blue-500" size={18} />;
      case 'DISPUTE':
        return <AlertCircle className="text-amber-500" size={18} />;
      default:
        return <CheckCircle2 size={18} />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg">Việc cần làm hôm nay</h3>
        <span className="bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
          Action Required
        </span>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] pr-1">
        {items.map((item, i) => (
          <motion.div
            key={item.debtId + i}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group flex items-center gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                {item.message}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                Giá trị: {item.amount.toLocaleString()}đ
              </p>
            </div>
            <ArrowRight
              size={14}
              className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
            />
          </motion.div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="text-emerald-500" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Tuyệt vời!</p>
            <p className="text-xs text-slate-500 mt-1">Không còn việc khẩn cấp nào trong hôm nay.</p>
          </div>
        )}
      </div>
    </div>
  );
};
