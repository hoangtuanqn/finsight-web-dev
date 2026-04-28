import React from 'react';
import { ShieldAlert, TrendingDown, Info } from 'lucide-react';
import { formatVND } from '../../utils/calculations';

interface StressTestResult {
  scenarioId: string;
  scenarioName: string;
  description: string;
  portfolioLossPercent: number;
  portfolioLossAmount: number;
  remainingCapital: number;
}

interface Props {
  stressTests: StressTestResult[];
}

export default function StressTestSimulator({ stressTests }: Props) {
  if (!stressTests || stressTests.length === 0) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-red-500/20 rounded-3xl p-6 shadow-[0_4px_30px_rgba(239,68,68,0.08)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
          <ShieldAlert size={20} className="text-red-400" />
        </div>
        <div>
          <h3 className="font-black text-white text-lg tracking-tight">Stress Testing Danh Mục</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mô phỏng sức chịu đựng của danh mục khi đối mặt với các cuộc khủng hoảng lịch sử.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {stressTests.map((test) => (
          <div key={test.scenarioId} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group hover:bg-white/[0.04] transition-colors">
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-200 text-sm">{test.scenarioName}</span>
                <div className="group/tooltip relative">
                  <Info size={14} className="text-slate-500 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-slate-800 text-xs text-slate-300 rounded-lg opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all pointer-events-none z-10 border border-slate-700 shadow-xl">
                    {test.description}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{test.description}</p>
            </div>

            <div className="flex items-center gap-4 shrink-0 bg-slate-950/50 p-3 rounded-xl border border-white/5">
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 font-semibold">Sụt Giảm Tối Đa</div>
                <div className="flex items-center justify-end gap-1.5 text-red-400 font-black">
                  <TrendingDown size={14} />
                  {test.portfolioLossAmount > 0 ? '-' : '+'}{formatVND(Math.abs(test.portfolioLossAmount))}
                </div>
              </div>
              
              <div className="w-px h-8 bg-white/10 mx-1" />

              <div className="text-right w-24">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5 font-semibold">Mức Drawdown</div>
                <div className="text-xl font-black text-white">
                  {(test.portfolioLossPercent * 100).toFixed(1)}%
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      <div className="mt-5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-200 leading-relaxed">
          <span className="font-bold">Lưu ý:</span> Stress test dựa trên các sự kiện cực đoan trong quá khứ. 
          Các khoản lỗ này thường chỉ mang tính chất <i>tạm thời</i> (unrealized loss) nếu bạn không bán tháo và có thời gian đầu tư đủ dài để danh mục phục hồi.
        </p>
      </div>
    </div>
  );
}
