import { Input } from '@repo/ui';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

interface InterestRateSectionProps {
  interestRates: any[];
  errors?: Record<string, string>;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: string, value: any) => void;
}

export const InterestRateSection: React.FC<InterestRateSectionProps> = ({
  interestRates,
  errors = {},
  onAdd,
  onRemove,
  onChange,
}) => {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">
          Lãi suất thả nổi (%/năm)
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase hover:text-emerald-400 transition-colors"
        >
          <Plus size={12} /> Thêm bậc lãi suất
        </button>
      </div>

      <div className="space-y-3">
        {interestRates.map((rate: any, index: number) => (
          <div key={index} className="flex items-center gap-3 animate-in slide-in-from-right-2 duration-300">
            <div
              className={`flex-1 grid grid-cols-2 gap-3 p-4 bg-slate-950 border rounded-2xl transition-all ${
                errors[`interestRate_${index}`] ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
              }`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                  Lãi suất (%/năm)
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full bg-transparent border-none p-0 text-sm font-mono text-white h-auto focus:ring-0"
                  value={rate.rate}
                  onChange={(e) => onChange(index, 'rate', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Ngày áp dụng</span>
                <input
                  type="date"
                  className="w-full bg-transparent border-none p-0 text-sm text-white h-auto outline-none"
                  value={rate.effectiveDate}
                  onChange={(e) => onChange(index, 'effectiveDate', e.target.value)}
                />
              </div>
              {errors[`interestRate_${index}`] && (
                <div className="col-span-2 pt-1">
                  <p className="text-[10px] font-bold text-rose-500">{errors[`interestRate_${index}`]}</p>
                </div>
              )}
            </div>
            {interestRates.length > 1 && (
              <button
                onClick={() => onRemove(index)}
                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
