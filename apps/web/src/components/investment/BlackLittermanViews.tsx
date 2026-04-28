import React from 'react';
import { BrainCircuit, TrendingUp, AlertTriangle } from 'lucide-react';

interface MarketView {
  id: string;
  assets: string[];
  weights: number[];
  expectedReturn: number;
  confidence: number;
  description: string;
}

interface Props {
  views: MarketView[];
}

export default function BlackLittermanViews({ views }: Props) {
  if (!views || !Array.isArray(views) || views.length === 0) return null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-indigo-500/20 rounded-3xl p-6 shadow-[0_4px_30px_rgba(99,102,241,0.08)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <BrainCircuit size={20} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="font-black text-white text-lg tracking-tight">AI Market Views (Black-Litterman)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Các quan điểm vĩ mô và tâm lý thị trường đang được AI áp dụng để điều chỉnh danh mục.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {views.map((view) => (
          <div key={view.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white/5 shrink-0">
              {view.expectedReturn > 0 ? (
                <TrendingUp size={16} className="text-emerald-400" />
              ) : (
                <AlertTriangle size={16} className="text-amber-400" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {view.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Tài sản: {Array.isArray(view.assets) ? view.assets.join(' vs ') : 'N/A'}
                </span>
                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Mức tin cậy: {typeof view.confidence === 'number' ? (view.confidence * 100).toFixed(0) : '0'}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
