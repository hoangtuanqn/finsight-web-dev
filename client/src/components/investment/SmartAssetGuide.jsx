import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BarChart2, Info, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react';
import { INVESTMENT_SUGGESTIONS } from './InvestmentConstants.js';
import {
  useCryptoPrices,
  useStockPrices,
  useGoldPrices,
  useSavingsRates,
  useBondsRates,
} from '../../hooks/useInvestmentQuery';

// Hook gộp — trả về {items, intro, updatedAt, loading, error} cho từng asset
// Mỗi hook cache 10 phút trong React Query: vào lại trong 10p → dùng cache, qua 10p → fetch lại
function useAssetData(asset, riskLevel) {
  const crypto  = useCryptoPrices(riskLevel);
  const stocks  = useStockPrices(riskLevel);
  const gold    = useGoldPrices();
  const savings = useSavingsRates(riskLevel);
  const bonds   = useBondsRates(riskLevel);

  const queryMap = { crypto, stocks, gold, savings, bonds };
  const q = queryMap[asset] ?? { data: null, isLoading: false, isError: false };

  const payload = q.data;
  return {
    items:     payload?.coins || payload?.stocks || payload?.goldItems || payload?.savingsItems || payload?.bondItems || [],
    intro:     payload?.intro || '',
    updatedAt: payload?.updatedAt || '',
    loading:   q.isLoading,
    error:     q.isError,
  };
}

export default function SmartAssetGuide({ allocation, riskLevel = 'MEDIUM' }) {
  const [openTab, setOpenTab] = useState(null);

  const activeAssets = Object.entries(allocation)
    .filter(([, pct]) => pct > 0)
    .sort(([, a], [, b]) => b - a);

  const active = openTab ?? activeAssets[0]?.[0] ?? null;

  // Dữ liệu active tab — React Query tự cache 10 phút, không fetch lại khi vào/ra trang
  const activeData = useAssetData(active, riskLevel);
  const suggestion = active ? INVESTMENT_SUGGESTIONS[active] : null;

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-5 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-4 mb-5 relative z-10 min-w-0">
        {/* Title */}
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sparkles size={14} className="text-amber-500" />
          </div>
          Hướng dẫn Đầu tư Thông minh
        </h3>

        {/* Asset tabs */}
        <div className="flex flex-nowrap gap-1 bg-white/[0.02] p-1 rounded-full border border-white/5 overflow-x-auto scrollbar-none min-w-0">
          {activeAssets.map(([asset, pct]) => {
            const sg = INVESTMENT_SUGGESTIONS[asset];
            const isActive = active === asset;
            return (
              <button
                key={asset}
                onClick={() => setOpenTab(asset)}
                className={`relative px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-300 whitespace-nowrap ${
                  isActive ? 'text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAssetTab"
                    className="absolute inset-0 rounded-full border border-white/10"
                    style={{ background: `${sg.color}20` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <sg.icon size={12} style={{ color: isActive ? sg.color : 'currentColor' }} />
                  {sg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            {/* Market Context Banner */}
            <div className="mb-8 p-6 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-all duration-500" style={{ background: suggestion.color, boxShadow: `0 0 15px ${suggestion.color}` }} />
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 size={16} style={{ color: suggestion.color }} />
                <span className="text-xs font-semibold text-slate-400">Phân tích bối cảnh thị trường</span>
              </div>
              <p className="text-sm font-medium text-slate-200 leading-relaxed">
                {activeData.intro || suggestion.intro}
              </p>
            </div>

            {/* Content Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {activeData.loading ? (
                <div className="col-span-2 py-16 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="w-16 h-1.5 rounded-full bg-white/5 relative overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: suggestion.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold animate-pulse">Đang đồng bộ dữ liệu...</span>
                </div>
              ) : (
                <>
                  {(activeData.items.length > 0 ? activeData.items : suggestion.items).map((item, i) => (
                    <AssetCard key={i} item={item} color={suggestion.color} type={active} />
                  ))}
                </>
              )}
            </div>

            {/* Pro Tips Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {suggestion.tips.map((tip, i) => (
                <div key={i} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex gap-4 group hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white group-hover:bg-blue-500/20 transition-all duration-300 shadow-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>

            {/* Disclaimer & Update Info */}
            <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/5">
                  <Clock size={12} />
                  <span className="text-xs font-semibold">
                    Cập nhật: {activeData.updatedAt || 'Real-time'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-amber-500/80 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                  <AlertTriangle size={12} />
                  <span className="text-xs font-semibold">Giao thức rủi ro cao</span>
                </div>
              </div>
              <p className="text-xs font-semibold text-slate-500">Phân tích độc quyền bởi FinSight</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssetCard({ item, color, type }) {
  const name = item.name;
  const tag = item.tag;
  const rate = item.rate || item.rateLabel || (item.price ? `${item.price.toLocaleString()}đ` : '');
  const note = item.note;
  const badge = item.badge;
  const badgeColor = item.badgeColor;

  return (
    <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl group hover:border-white/10 transition-all duration-300 hover:bg-white/[0.04] hover:-translate-y-1 hover:shadow-lg relative overflow-hidden">
      {/* Subtle hover glow */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl rounded-full" style={{ background: color, transform: 'translate(30%, -30%)' }} />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h4 className="text-base font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors">{name}</h4>
            {badge && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                badgeColor === 'emerald' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                badgeColor === 'amber' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                badgeColor === 'purple' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                'bg-blue-500/10 text-blue-400 border-blue-500/20'
              }`}>
                {badge}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500">{tag}</span>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-base font-bold tracking-tight" style={{ color }}>{rate}</span>
          <div className="p-1 rounded-full bg-white/5 mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
             <ArrowUpRight size={14} className="text-white" />
          </div>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-400 leading-relaxed relative z-10">{note}</p>
    </div>
  );
}
