import { Calculator, Info } from 'lucide-react';
import React from 'react';

interface SchedulePreviewProps {
  schedule: any[];
  principal: number;
  formatCurrency: (amount: number) => string;
}

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({ schedule, principal, formatCurrency }) => {
  if (schedule.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center border border-dashed border-slate-800">
          <Calculator size={24} className="text-slate-700" />
        </div>
        <p className="text-slate-500 text-xs font-medium max-w-50">
          Nhập số tiền và thời hạn để xem lịch trình dự kiến.
        </p>
      </div>
    );
  }

  const totalRepayment = schedule.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalInterest = schedule.reduce((sum, p) => sum + p.interestAmount, 0);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Tổng phải trả</span>
          <span className="text-xl font-black text-emerald-500">{formatCurrency(totalRepayment)}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">Tiền gốc:</span>
          <span className="text-white font-mono">{formatCurrency(principal)}</span>
        </div>
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-slate-500">Tiền lãi:</span>
          <span className="text-white font-mono">{formatCurrency(totalInterest)}</span>
        </div>
      </div>

      <div className="max-h-100 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {schedule.map((p, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-slate-950/50 border border-slate-800/50 rounded-xl hover:border-emerald-500/30 transition-all group"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-slate-900 rounded-lg text-[10px] font-black text-slate-500 group-hover:text-emerald-500 transition-colors">
              {p.period}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                  {new Date(p.dueDate).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                </span>
                <span className="text-[11px] font-black text-emerald-400 font-mono">
                  {formatCurrency(p.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-slate-500 font-medium">Gốc: {formatCurrency(p.principalAmount)}</span>
                <span className="text-[9px] text-slate-500 font-medium">Lãi: {formatCurrency(p.interestAmount)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
          <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-500/80 leading-relaxed">
            Lịch trình này chỉ mang tính chất tham khảo. Số liệu thực tế có thể thay đổi tùy thuộc vào ngày giải ngân và
            các khoản thanh toán thực tế.
          </p>
        </div>
      </div>
    </div>
  );
};
