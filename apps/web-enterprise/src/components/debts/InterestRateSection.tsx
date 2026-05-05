import { Input } from '@repo/ui';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

export type InterestRateType = 'FIXED' | 'FLOATING' | 'REFERENCE' | 'MIXED' | 'STEP';

export interface InterestRateBracket {
  rate: number;
  effectiveDate: string;
  rateType?: 'FIXED' | 'FLOATING' | 'REFERENCE';
  referenceBase?: string;
  spread?: number;
}

interface InterestRateSectionProps {
  interestRateType: InterestRateType;
  interestRates: InterestRateBracket[];
  errors?: Record<string, string>;
  onTypeChange: (type: InterestRateType) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, field: string, value: any) => void;
}

const RATE_TYPE_OPTIONS: { value: InterestRateType; label: string; desc: string }[] = [
  { value: 'FIXED', label: 'Cố định', desc: 'Một mức lãi duy nhất, không đổi suốt kỳ' },
  { value: 'FLOATING', label: 'Thả nổi', desc: 'Thay đổi theo từng giai đoạn, nhập thủ công' },
  { value: 'REFERENCE', label: 'Tham chiếu', desc: 'Gắn với lãi suất cơ sở + biên độ (VD: VCB + 2%)' },
  { value: 'MIXED', label: 'Hỗn hợp', desc: 'Cố định một thời gian, sau đó thả nổi' },
  { value: 'STEP', label: 'Bậc thang', desc: 'Tăng/giảm dần theo lịch định sẵn' },
];

export const InterestRateSection: React.FC<InterestRateSectionProps> = ({
  interestRateType,
  interestRates,
  errors = {},
  onTypeChange,
  onAdd,
  onRemove,
  onChange,
}) => {
  const canAddMore = interestRateType !== 'FIXED';

  const sectionLabel = {
    FIXED: 'Lãi suất cố định (%/năm)',
    FLOATING: 'Lãi suất thả nổi (%/năm)',
    REFERENCE: 'Lãi suất tham chiếu (%/năm)',
    MIXED: 'Lãi suất hỗn hợp (%/năm)',
    STEP: 'Lãi suất bậc thang (%/năm)',
  }[interestRateType];

  return (
    <div className="space-y-4 pt-4">
      {/* Type selector */}
      <div className="space-y-2">
        <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Loại lãi suất</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {RATE_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTypeChange(opt.value)}
              title={opt.desc}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center border ${
                interestRateType === opt.value
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 ml-1">
          {RATE_TYPE_OPTIONS.find((o) => o.value === interestRateType)?.desc}
        </p>
      </div>

      {/* Brackets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{sectionLabel}</label>
          {canAddMore && (
            <button
              type="button"
              onClick={onAdd}
              className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase hover:text-emerald-400 transition-colors"
            >
              <Plus size={12} /> Thêm bậc
            </button>
          )}
        </div>

        <div className="space-y-3">
          {interestRates.map((rate, index) => (
            <div key={index} className="flex items-center gap-3 animate-in slide-in-from-right-2 duration-300">
              <div
                className={`flex-1 p-4 bg-slate-950 border rounded-2xl transition-all ${
                  errors[`interestRate_${index}`] ? 'border-rose-500/50 ring-2 ring-rose-500/10' : 'border-slate-800'
                }`}
              >
                {/* FIXED */}
                {interestRateType === 'FIXED' && (
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
                )}

                {/* FLOATING or STEP */}
                {(interestRateType === 'FLOATING' || interestRateType === 'STEP') && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {interestRateType === 'STEP' ? `Bậc ${index + 1} — Lãi suất (%/năm)` : 'Lãi suất (%/năm)'}
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
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Ngày áp dụng
                      </span>
                      <input
                        type="date"
                        className="w-full bg-transparent border-none p-0 text-sm text-white h-auto outline-none"
                        value={rate.effectiveDate}
                        onChange={(e) => onChange(index, 'effectiveDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* REFERENCE */}
                {interestRateType === 'REFERENCE' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Lãi suất cơ sở (tên)
                      </span>
                      <input
                        type="text"
                        placeholder="VD: VCB, SOFR, Prime..."
                        className="w-full bg-transparent border-none p-0 text-sm text-white h-auto outline-none placeholder:text-slate-600"
                        value={rate.referenceBase || ''}
                        onChange={(e) => onChange(index, 'referenceBase', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Lãi suất cơ sở hiện tại (%/năm)
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-transparent border-none p-0 text-sm font-mono text-white h-auto focus:ring-0"
                        value={rate.rate - (rate.spread || 0)}
                        onChange={(e) => {
                          const base = Number(e.target.value);
                          onChange(index, 'rate', base + (rate.spread || 0));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Biên độ cộng thêm (%/năm)
                      </span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full bg-transparent border-none p-0 text-sm font-mono text-white h-auto focus:ring-0"
                        value={rate.spread || 0}
                        onChange={(e) => {
                          const spread = Number(e.target.value);
                          onChange(index, 'spread', spread);
                          const base = rate.rate - (rate.spread || 0);
                          onChange(index, 'rate', base + spread);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Ngày áp dụng
                      </span>
                      <input
                        type="date"
                        className="w-full bg-transparent border-none p-0 text-sm text-white h-auto outline-none"
                        value={rate.effectiveDate}
                        onChange={(e) => onChange(index, 'effectiveDate', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 pt-1 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Lãi suất tổng áp dụng:</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">{rate.rate.toFixed(2)}%/năm</span>
                    </div>
                  </div>
                )}

                {/* MIXED */}
                {interestRateType === 'MIXED' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex gap-2 pb-1">
                      <button
                        type="button"
                        onClick={() => onChange(index, 'rateType', 'FIXED')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          (rate.rateType || 'FIXED') === 'FIXED'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Cố định
                      </button>
                      <button
                        type="button"
                        onClick={() => onChange(index, 'rateType', 'FLOATING')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${
                          rate.rateType === 'FLOATING'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Thả nổi
                      </button>
                    </div>
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
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        Ngày áp dụng
                      </span>
                      <input
                        type="date"
                        className="w-full bg-transparent border-none p-0 text-sm text-white h-auto outline-none"
                        value={rate.effectiveDate}
                        onChange={(e) => onChange(index, 'effectiveDate', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {errors[`interestRate_${index}`] && (
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-rose-500">{errors[`interestRate_${index}`]}</p>
                  </div>
                )}
              </div>

              {interestRates.length > 1 && canAddMore && (
                <button
                  type="button"
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
    </div>
  );
};
