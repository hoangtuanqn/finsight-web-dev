import { CreditCard, History, Info } from 'lucide-react';
import React from 'react';

interface TransactionHistoryListProps {
  transactions: any[];
  formatCurrency: (amount: number) => string;
  onReverse: (id: string) => void;
  isReversing: string | null;
  canReverse: boolean;
}

export const TransactionHistoryList: React.FC<TransactionHistoryListProps> = ({
  transactions,
  formatCurrency,
  onReverse,
  isReversing,
  canReverse,
}) => {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
          <History size={20} />
        </div>
        <h2 className="text-lg font-bold text-white">Lịch sử giao dịch</h2>
      </div>
      <div className="space-y-4 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
        {transactions?.length > 0 ? (
          transactions.map((t: any) => (
            <div
              key={t.id}
              className={`p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl relative transition-all group ${
                t.type === 'REVERSAL' ? 'opacity-50 grayscale' : ''
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    t.type === 'PAYMENT'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : t.type === 'REVERSAL'
                        ? 'bg-red-500/10 text-red-500'
                        : t.type === 'PENALTY'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-blue-500/10 text-blue-500'
                  }`}
                >
                  {t.type === 'PENALTY' ? <Info size={14} /> : <CreditCard size={14} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{t.type}</p>
                    <span className="text-[10px] text-slate-500 font-medium font-mono">
                      {new Date(t.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p
                    className={`text-sm font-black font-mono ${
                      t.type === 'REVERSAL' ? 'text-red-400' : t.type === 'PENALTY' ? 'text-rose-400' : 'text-white'
                    }`}
                  >
                    {t.type === 'PENALTY' ? '+' : ''}
                    {formatCurrency(t.amount)}
                  </p>
                  <div className="mt-2 pt-2 border-t border-slate-800/50 flex items-center justify-between">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                      {t.type === 'PENALTY' ? 'Nợ gốc duy trì' : 'Dư nợ sau GD'}
                    </p>
                    <p className="text-[10px] text-emerald-500 font-mono font-bold">
                      {formatCurrency(t.balanceSnapshot)}
                    </p>
                  </div>
                  {t.notes && <p className="text-[10px] text-slate-500 mt-2 italic line-clamp-2">"{t.notes}"</p>}

                  {/* Action buttons on hover */}
                  {canReverse &&
                    t.type === 'PAYMENT' &&
                    !transactions.some((rt: any) => rt.reversesTransactionId === t.id) && (
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
                        <button
                          onClick={() => onReverse(t.id)}
                          disabled={isReversing === t.id}
                          className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10 transition-colors"
                        >
                          {isReversing === t.id ? 'Đang xử lý...' : 'Đảo bút toán'}
                        </button>
                      </div>
                    )}
                  {t.type === 'REVERSAL' && (
                    <div className="mt-2 text-[8px] text-red-500/70 font-black uppercase tracking-widest bg-red-500/5 inline-block px-2 py-0.5 rounded border border-red-500/10">
                      Đã hủy giao dịch gốc
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <Info size={24} className="mx-auto text-slate-800 mb-2" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Chưa có giao dịch</p>
          </div>
        )}
      </div>
    </div>
  );
};
