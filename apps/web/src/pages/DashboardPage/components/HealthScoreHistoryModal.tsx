import { AnimatePresence, motion } from 'framer-motion';
import { TrendingDown, TrendingUp, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { userAPI } from '../../../api';

interface HealthScoreHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
}

export const HealthScoreHistoryModal: React.FC<HealthScoreHistoryModalProps> = ({ isOpen, onClose, currentScore }) => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await userAPI.getHealthScoreHistory();
      if (res.data?.success) {
        setHistory(res.data.data.history);
      }
    } catch (error) {
      console.error('Failed to fetch health score history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 740) return 'text-emerald-400';
    if (score >= 670) return 'text-blue-400';
    if (score >= 580) return 'text-yellow-400';
    return 'text-rose-400';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl z-[101] overflow-hidden flex flex-col max-h-[85vh]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Lịch sử điểm Sức khoẻ
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Điểm hiện tại: <strong className={getScoreColor(currentScore)}>{currentScore}</strong> / 850
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <TrendingUp size={32} />
                  </div>
                  <h3 className="text-slate-900 dark:text-white font-semibold text-lg mb-1">Chưa có biến động</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Điểm sức khoẻ của bạn đang duy trì ổn định.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${
                          item.changeAmount > 0
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {item.changeAmount > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-slate-900 dark:text-white font-semibold text-sm leading-tight">
                            {item.reason}
                          </h4>
                          <span
                            className={`font-bold whitespace-nowrap ml-3 text-base ${
                              item.changeAmount > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {item.changeAmount > 0 ? '+' : ''}
                            {item.changeAmount}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 font-medium">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
