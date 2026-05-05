import { Calendar } from 'lucide-react';
import React from 'react';

interface RepaymentScheduleTableProps {
  schedules: any[];
  formatCurrency: (amount: number) => string;
}

export const RepaymentScheduleTable: React.FC<RepaymentScheduleTableProps> = ({ schedules, formatCurrency }) => {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'PARTIAL':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-800 text-slate-500 border-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Đã xong';
      case 'PARTIAL':
        return 'Dở dang';
      case 'OVERDUE':
        return 'Quá hạn';
      default:
        return 'Chờ thu';
    }
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
            <Calendar size={20} />
          </div>
          <h2 className="text-lg font-bold text-white">Lịch trình thanh toán</h2>
        </div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
          {schedules?.length} kỳ hạn
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-950/30 text-[9px] font-black text-slate-500 uppercase tracking-widest">
              <th className="px-8 py-4 text-left">Kỳ</th>
              <th className="px-8 py-4 text-left">Ngày đến hạn</th>
              <th className="px-8 py-4 text-left">Gốc</th>
              <th className="px-8 py-4 text-left">Lãi</th>
              <th className="px-8 py-4 text-left">Tổng</th>
              <th className="px-8 py-4 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {schedules?.map((s: any) => (
              <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                <td className="px-8 py-4 text-xs font-bold text-slate-500">{s.period}</td>
                <td className="px-8 py-4 text-xs font-medium text-slate-300">
                  {new Date(s.dueDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-8 py-4 text-xs font-mono text-slate-300">{formatCurrency(s.principalAmount)}</td>
                <td className="px-8 py-4 text-xs font-mono text-slate-300">{formatCurrency(s.interestAmount)}</td>
                <td className="px-8 py-4 text-xs font-black text-white">{formatCurrency(s.totalAmount)}</td>
                <td className="px-8 py-4 text-right">
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[8px] font-black border uppercase tracking-widest ${getStatusStyle(s.status)}`}
                    >
                      {getStatusLabel(s.status)}
                    </span>
                    {s.status !== 'PAID' && (
                      <p className="text-[9px] font-bold text-slate-500 whitespace-nowrap">
                        Còn thiếu:{' '}
                        <span className="text-amber-500">
                          {formatCurrency(
                            s.principalAmount -
                              (s.paidPrincipal || 0) +
                              ((s.interestAmount || 0) - (s.paidInterest || 0)),
                          )}
                        </span>
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
