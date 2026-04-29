import React from 'react';
import { Bot, TrendingUp, AlertTriangle } from 'lucide-react';

interface MarketView {
  id: string;
  assets: string[];
  weights: number[];
  expectedReturn: number;
  confidence: number;
  description: string;
}

interface Props {
  recommendation: string;
  views: MarketView[];
}

export default function StrategyRecommendation({ recommendation, views }: Props) {
  if (!recommendation) return null;

  // Chỉ giữ view từ tin tức vĩ mô (macro_*) — view sentiment_* đã được tóm tắt trong câu khuyến nghị
  const macroViews = Array.isArray(views)
    ? views.filter(v => v?.description && String(v.id).startsWith('macro_'))
    : [];

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 rounded-2xl shadow-[0_0_30px_rgba(59,130,246,0.08)] overflow-hidden">
      {/* Câu khuyến nghị */}
      <div className="flex items-start gap-5 p-6">
        <div className="p-2.5 rounded-full bg-blue-500/20 shrink-0 shadow-inner">
          <Bot size={20} className="text-blue-400" />
        </div>
        <p className="text-base font-medium text-blue-100 leading-relaxed">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400 block mb-1">
            Khuyến nghị chiến lược:
          </span>
          "{recommendation}"
        </p>
      </div>

      {/* Tín hiệu vĩ mô từ tin tức — chỉ hiện khi có dữ liệu bổ sung */}
      {macroViews.length > 0 && (
        <div className="border-t border-blue-500/15 px-6 pb-6 pt-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/60 mb-4">
            Tín hiệu thị trường phát hiện
          </p>
          <div className="space-y-3">
            {macroViews.map((view) => {
              const isPositive = view.expectedReturn >= 0;
              return (
                <div key={view.id} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white/5 shrink-0">
                    {isPositive
                      ? <TrendingUp size={13} className="text-emerald-400" />
                      : <AlertTriangle size={13} className="text-amber-400" />
                    }
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {view.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
