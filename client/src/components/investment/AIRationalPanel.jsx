import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronDown, ChevronRight, Activity, Landmark, Clock, Target as TargetIcon } from 'lucide-react';
import { ASSET_LABELS, ASSET_ICONS } from './InvestmentConstants.js';
import { explainAsset } from './InvestmentUtils.jsx';
import { formatVND } from '../../utils/calculations';

const ICON_MAP = {
  Activity: Activity,
  Landmark: Landmark,
  Clock: Clock,
  Target: TargetIcon
};

export default function AIRationalPanel({ allocation, profile, sentimentValue, portfolioBreakdown }) {
  const [openAsset, setOpenAsset] = useState(null);
  
  const riskLabel = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }[profile?.riskLevel] || '—';
  const horizonLabel = { SHORT: 'Ngắn hạn', MEDIUM: 'Trung hạn', LONG: 'Dài hạn' }[profile?.horizon] || '—';
  const goalLabel = { STABILITY: 'Ổn định', SPECULATION: 'Tăng trưởng', GROWTH: 'Tăng trưởng', INCOME: 'Thu nhập' }[profile?.goal] || '—';

  const sorted = Object.entries(allocation).sort(([, a], [, b]) => b - a);

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <Lightbulb size={24} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">Ma trận Quyết định AI</h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">Phân tích logic mạng nơ-ron</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge label="Rủi ro" value={riskLabel} color="amber" />
          <Badge label="Kỳ hạn" value={horizonLabel} color="blue" />
          <Badge label="Mục tiêu" value={goalLabel} color="purple" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {sorted.map(([asset, pct]) => {
          const Icon = ASSET_ICONS[asset];
          const reasons = explainAsset(asset, pct, profile, sentimentValue);
          const isOpen = openAsset === asset;
          const breakdown = portfolioBreakdown.find(p => p.asset === ASSET_LABELS[asset]);

          return (
            <div key={asset} className={`border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 rounded-2xl overflow-hidden ${isOpen ? 'ring-1 ring-blue-500/30 shadow-lg' : ''}`}>
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left group"
                onClick={() => setOpenAsset(isOpen ? null : asset)}
              >
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-300 shadow-sm">
                  <Icon size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-semibold text-slate-400 block mb-1 group-hover:text-slate-300 transition-colors">
                    {ASSET_LABELS[asset]}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-white tracking-tight">{pct}%</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        className="h-full bg-blue-500/80 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(59,130,246,0.5)' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.02] flex items-center justify-center group-hover:bg-white/[0.05] transition-colors">
                   {isOpen ? <ChevronDown size={18} className="text-slate-300" /> : <ChevronRight size={18} className="text-slate-500" />}
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-white/[0.01] border-t border-white/5"
                  >
                    <div className="px-5 pb-5 pt-4 space-y-6">
                      <div className="relative">
                        <div className="absolute left-3.5 top-2 bottom-2 w-0.5 rounded-full bg-white/5" />
                        <div className="space-y-6">
                          {reasons.map((r, i) => {
                            const StepIcon = ICON_MAP[r.icon] || Activity;
                            return (
                              <div key={i} className="relative pl-10">
                                <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center z-10 shadow-sm">
                                  <StepIcon size={12} className="text-blue-400" />
                                </div>
                                <p className="text-[10px] font-bold text-blue-400/80 uppercase tracking-wide mb-1">
                                  Lớp {i + 1}: {r.layer}
                                </p>
                                <p className="text-sm font-medium text-slate-300 leading-relaxed">
                                  {r.text}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Breakdown result */}
                      <div className="pt-5 border-t border-white/5 flex items-center justify-between bg-blue-500/5 -mx-5 -mb-5 px-5 pb-5 rounded-b-2xl">
                        <div>
                          <p className="text-xs font-semibold text-emerald-400 mb-1">
                            Lượng vốn phân bổ
                          </p>
                          <p className="text-lg font-bold text-white">
                            {breakdown ? formatVND(breakdown.amount) : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-slate-400 mb-1">Tỷ trọng</p>
                          <p className="text-xl font-bold text-blue-400 tracking-tight">{pct}%</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ label, value, color }) {
  const colors = {
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  return (
    <div className={`px-3 py-1.5 border rounded-full flex items-center gap-2 ${colors[color] || colors.blue}`}>
      <span className="text-[10px] font-medium opacity-70">{label}:</span>
      <span className="text-[11px] font-bold">{value}</span>
    </div>
  );
}
