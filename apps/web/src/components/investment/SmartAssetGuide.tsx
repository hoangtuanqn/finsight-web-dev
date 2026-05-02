import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, BarChart2, ChevronDown, Clock, Loader2, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { queryKeys } from '../../api/queryKeys';
import {
  useAssetMonthlyHistory,
  useBondsRates,
  useCryptoPrices,
  useGoldPrices,
  useSavingsRates,
  useStockPrices,
} from '../../hooks/useInvestmentQuery';
import { INVESTMENT_SUGGESTIONS } from './InvestmentConstants';

const MONTH_HISTORY_RANGE_OPTIONS = [6, 12, 18];
const DAY_HISTORY_RANGE_OPTIONS = [7, 14, 30];
const STOCK_SYMBOLS = [
  'E1VFVN30',
  'FUEVFVND',
  'VCB',
  'BID',
  'CTG',
  'TCB',
  'MBB',
  'FPT',
  'VNM',
  'MSN',
  'MWG',
  'HPG',
  'VHM',
  'VIC',
  'ACB',
  'REE',
  'PNJ',
  'DGC',
];

// Hook gộp: trả về { items, intro, updatedAt, loading, error } cho từng asset.
function useAssetData(asset, riskLevel) {
  const crypto = useCryptoPrices(riskLevel);
  const stocks = useStockPrices(riskLevel);
  const gold = useGoldPrices();
  const savings = useSavingsRates(riskLevel);
  const bonds = useBondsRates(riskLevel);

  const queryMap = { crypto, stocks, gold, savings, bonds };
  const q = queryMap[asset] ?? { data: null, isLoading: false, isError: false };

  const payload = q.data;
  return {
    items:      payload?.coins || payload?.stocks || payload?.goldItems || payload?.savingsItems || payload?.bondItems || [],
    intro:      payload?.intro || '',
    disclaimer: payload?.disclaimer || '',
    updatedAt:  payload?.updatedAt || '',
    metrics:    payload?.metrics ?? null,
    worldPrice: payload?.worldPrice ?? null,
    loading:    q.isLoading,
    error:      q.isError,
    items: payload?.coins || payload?.stocks || payload?.goldItems || payload?.savingsItems || payload?.bondItems || [],
    intro: payload?.intro || '',
    updatedAt: payload?.updatedAt || '',
    metrics: payload?.metrics ?? null,
    worldPrice: payload?.worldPrice ?? null,
    loading: q.isLoading,
    error: q.isError,
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
  };
}

function getStockHistoryTicker(item) {
  if (item.historyTicker) return item.historyTicker;
  if (item.ticker) return item.ticker;
  if (item.symbol) return item.symbol;

  const text = `${item.name || ''} ${item.tag || ''}`.toUpperCase();
  return STOCK_SYMBOLS.find((symbol) => text.includes(symbol)) || null;
}

function getHistoryRequest(item, type) {
  if (item.historySource?.asset && item.historySource?.source) {
    return item.historySource;
  }

  if (type === 'gold' && item.id === 'world') return { asset: 'gold', source: 'world', sourceType: 'direct' };
  if (type === 'stocks') {
    const ticker = getStockHistoryTicker(item);
    return ticker ? { asset: 'stocks', ticker, sourceType: 'direct' } : null;
  }

  return null;
}

function getHistoryRangeConfig(request) {
  const isDays = request?.rangeType === 'days';
  const options = request?.rangeOptions || (isDays ? DAY_HISTORY_RANGE_OPTIONS : MONTH_HISTORY_RANGE_OPTIONS);

  return {
    paramName: isDays ? 'days' : 'months',
    defaultValue: request?.defaultRange || (isDays ? 30 : 12),
    options,
    unitLabel: isDays ? 'ngày' : 'tháng',
    title: isDays ? 'Lịch sử theo ngày' : 'Lịch sử theo tháng',
  };
}

function getAssetCardKey(item, type, index) {
  const historyRequest = getHistoryRequest(item, type);
  const sourceKey = historyRequest?.ticker || historyRequest?.source || historyRequest?.bankId;
  return `${type}-${item.id || item.name || index}-${sourceKey || 'no-history'}`;
}

function formatVND(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  return `${Math.round(numericValue).toLocaleString('vi-VN')}đ`;
}

function formatCardMetric(item) {
  if (item.rateLabel) return item.rateLabel;
  if (item.priceLabel) return item.priceLabel;
  if (typeof item.rate === 'string') return item.rate;
  if (item.rate != null) return `${Number(item.rate).toLocaleString('vi-VN', { maximumFractionDigits: 2 })}%/năm`;
  if (item.price != null) return Number(item.price).toLocaleString('vi-VN', { maximumFractionDigits: 2 });
  return '';
}

function formatCompactVND(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';
  if (Math.abs(numericValue) >= 1_000_000) {
    return `${(numericValue / 1_000_000).toFixed(1)}tr`;
  }
  if (Math.abs(numericValue) >= 1_000) {
    return `${(numericValue / 1_000).toFixed(0)}k`;
  }
  return `${Math.round(numericValue)}`;
}

function formatMetricValue(value, metric = {}) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';

  if (String(metric.unit || '').startsWith('VND')) return `${Math.round(numericValue).toLocaleString('vi-VN')}đ`;
  if (metric.unit === 'USD/oz') return `$${numericValue.toLocaleString('en-US', { maximumFractionDigits: 1 })}/oz`;
  if (metric.unit === '%') return `${numericValue.toFixed(2)}%`;

  return numericValue.toLocaleString('vi-VN', { maximumFractionDigits: metric.decimals ?? 2 });
}

function formatCompactMetric(value, metric = {}) {
  if (String(metric.unit || '').startsWith('VND')) return formatCompactVND(value);
  if (metric.unit === 'USD/oz') return `$${Number(value).toFixed(0)}`;
  if (metric.unit === '%') return `${Number(value).toFixed(1)}%`;
  return Number(value).toLocaleString('vi-VN', { maximumFractionDigits: 1 });
}

function formatMetricChange(change, metric = {}) {
  const numericChange = Number(change || 0);
  const sign = numericChange >= 0 ? '+' : '';

  if (metric.changeUnit === 'percentagePoint') {
    return `${sign}${numericChange.toFixed(2)} điểm % so với kỳ trước`;
  }

  return `${sign}${numericChange.toFixed(2)}% so với kỳ trước`;
}

function getHistorySubtitle(historyData, request) {
  const prefix =
    historyData?.sourceType === 'proxy' || request?.sourceType === 'proxy'
      ? 'Tham chiếu'
      : historyData?.sourceType === 'officialAuction'
        ? 'Đấu thầu TPCP'
        : null;
  const sourcePrefix = prefix ? `${prefix}: ` : '';

  if (historyData?.rangeType === 'days' || request?.rangeType === 'days') {
    return `${sourcePrefix}${historyData?.name || request?.sourceLabel || 'Tài sản'} · giá bán cuối ngày`;
  }
  if (historyData?.metric?.key === 'yield') {
    return `${sourcePrefix}${historyData.name} · lợi suất cuối tháng`;
  }
  if (historyData?.metric?.unit === 'USD/oz') {
    return `${sourcePrefix}${historyData.name} · giá đóng cửa cuối tháng`;
  }
  if (historyData?.ticker) {
    return `${sourcePrefix}${historyData.ticker} · giá đóng cửa cuối tháng`;
  }
  if (request?.asset === 'gold') return 'Vàng thế giới · giá đóng cửa cuối tháng';
  if (request?.asset === 'bonds') return 'TPCP Việt Nam · lợi suất cuối tháng';
  return 'Dữ liệu lịch sử theo tháng';
}

function getSourceTypeLabel(sourceType) {
  if (sourceType === 'proxy') return 'Tham chiếu';
  if (sourceType === 'officialAuction') return 'Đấu thầu';
  if (sourceType === 'officialCurve') return 'Đường cong';
  if (sourceType === 'direct') return 'Trực tiếp';
  return 'Nguồn';
}

function HistoryRangeToggle({ value, onChange, color, options, unitLabel }) {
  return (
    <div className="grid grid-cols-3 gap-1 bg-white/[0.02] p-1 rounded-full border border-white/5 w-full sm:w-[260px]">
      {options.map((range) => {
        const isActive = value === range;
        return (
          <button
            key={range}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange(range);
            }}
            aria-pressed={isActive}
            className={`relative h-8 rounded-full text-[11px] font-bold transition-all ${
              isActive ? 'text-white' : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="assetHistoryRange"
                className="absolute inset-0 rounded-full border border-white/10"
                style={{ background: `${color}24` }}
              />
            )}
            <span className="relative z-10">
              {range} {unitLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MonthlyHistoryTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  const change = Number(point.change ?? point.changePct ?? 0);
  const isPositive = change >= 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-xl px-3 py-2 shadow-2xl">
      <p className="text-[11px] font-bold text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-black text-white">{formatMetricValue(point.value ?? point.close, metric)}</p>
      <p className={`text-[11px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {formatMetricChange(change, metric)}
      </p>
    </div>
  );
}

function MonthlyHistoryChart({ data, color, metric }) {
  if (!data?.length) {
    return (
      <div className="h-48 rounded-2xl bg-white/[0.015] border border-white/5 flex items-center justify-center text-xs font-semibold text-slate-500">
        Chưa có đủ dữ liệu lịch sử.
      </div>
    );
  }

  const chartData = data.map((point) => ({ ...point, value: point.value ?? point.close }));
  const values = chartData.map((point) => Number(point.value)).filter(Number.isFinite);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = Math.max((maxValue - minValue) * 0.2, maxValue * 0.04);

  const n = chartData.length;
  // show ~6 labels max — compute skip interval
  const xInterval = n <= 7 ? 0 : n <= 14 ? 1 : Math.ceil(n / 6) - 1;
  // for dense daily data, only show the day part (DD) to save space
  const isDense = n > 14;
  const tickFormatter = isDense ? (label: string) => label.split('/')[0] : (label: string) => label;
  const barSize = n > 20 ? 10 : n > 14 ? 13 : 18;

  return (
    <div className="h-56 rounded-2xl bg-slate-950/25 border border-white/5 px-2 py-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            interval={xInterval}
            tickFormatter={tickFormatter}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
            width={46}
            domain={[Math.max(0, minValue - padding), maxValue + padding]}
            tickFormatter={(value) => formatCompactMetric(value, metric)}
          />
          <Tooltip
            content={<MonthlyHistoryTooltip metric={metric} />}
            cursor={{ fill: 'rgba(255,255,255,0.035)', radius: 8 }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={barSize}>
            {chartData.map((entry) => (
              <Cell
                key={`${entry.month}-${entry.value ?? entry.close}`}
                fill={(entry.change ?? entry.changePct) >= 0 ? color : '#ef4444'}
                fillOpacity={(entry.change ?? entry.changePct) >= 0 ? 0.9 : 0.78}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SmartAssetGuide({ allocation, riskLevel = 'MEDIUM' }) {
  const [openTab, setOpenTab] = useState(null);
  const [modalItem, setModalItem] = useState(null);
  const queryClient = useQueryClient();
  const goldQuery = useGoldPrices();

  // Invalidate cache cũ nếu gold data trống (do filter bug cũ)
  useEffect(() => {
    const data = goldQuery.data as any;
    if (data && !goldQuery.isLoading && (data.goldItems ?? []).length === 0) {
      queryClient.invalidateQueries({ queryKey: queryKeys.INVESTMENT.GOLD_PRICES() });
    }
  }, [goldQuery.data, goldQuery.isLoading, queryClient]);

  const activeAssets = Object.entries(allocation)
    .filter(([, pct]) => pct > 0)
    .sort(([, a], [, b]) => b - a);

  const active = openTab ?? activeAssets[0]?.[0] ?? null;
  const activeData = useAssetData(active, riskLevel);
  const suggestion = active ? INVESTMENT_SUGGESTIONS[active] : null;

  const handleSelectTab = (asset) => {
    setOpenTab(asset);
    setModalItem(null);
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-5 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="flex flex-row items-center justify-between gap-4 mb-5 relative z-10 min-w-0">
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sparkles size={14} className="text-amber-500" />
          </div>
          Gợi ý Đầu tư Thông minh
        </h3>

        <div className="flex flex-nowrap gap-1 bg-white/[0.02] p-1 rounded-full border border-white/5 overflow-x-auto scrollbar-none min-w-0">
          {activeAssets.map(([asset]) => {
            const sg = INVESTMENT_SUGGESTIONS[asset];
            const isActive = active === asset;
            return (
              <button
                key={asset}
                type="button"
                onClick={() => handleSelectTab(asset)}
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
        {active && suggestion && (
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="relative z-10"
          >
            <div className="mb-8 p-5 rounded-2xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                style={{ background: suggestion.color, boxShadow: `0 0 15px ${suggestion.color}` }}
              />
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={14} style={{ color: suggestion.color }} />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Tổng quan thị trường</span>
              </div>

              {/* Gold: structured layout */}
              {active === 'gold' && activeData.metrics ? (
                (() => {
                  const m = activeData.metrics;
                  const best = activeData.items[0];
                  return (
                    <div className="space-y-4">
                      {/* Best pick highlight */}
                      {best && (
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                            1
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white">{best.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Spread{' '}
                              <span className="text-slate-200 font-semibold">{best.costAnalysis?.spreadPct}%</span>
                              {' · '}Chi phí vào lệnh{' '}
                              <span
                                className={`font-semibold ${best.costAnalysis?.totalEntryCostPct > 10 ? 'text-amber-400' : 'text-slate-200'}`}
                              >
                                {best.costAnalysis?.totalEntryCostPct}%
                              </span>
                              {best.costAnalysis?.premiumPct > 0 && (
                                <>
                                  {' '}
                                  · Premium vs TG{' '}
                                  <span
                                    className={
                                      best.costAnalysis.premiumPct > 10
                                        ? 'text-amber-400 font-semibold'
                                        : 'text-slate-200 font-semibold'
                                    }
                                  >
                                    +{best.costAnalysis.premiumPct}%
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <span className="ml-auto text-sm font-bold shrink-0" style={{ color: suggestion.color }}>
                            {best.priceLabel}
                          </span>
                        </div>
                      )}

                      {/* Reference stats */}
                      {(() => {
                        const items = activeData.items;
                        const withCost = items.filter((it: any) => it.costAnalysis);
                        const lowestSpread = withCost.length
                          ? Math.min(...withCost.map((it: any) => it.costAnalysis.spreadPct))
                          : null;
                        const lowestPremium = withCost.length
                          ? Math.min(...withCost.map((it: any) => it.costAnalysis.premiumPct))
                          : null;
                        const lowestCost = withCost.length
                          ? Math.min(...withCost.map((it: any) => it.costAnalysis.totalEntryCostPct))
                          : null;
                        const chips = [
                          m.impliedPerChi > 0 && {
                            label: 'Giá TG quy đổi',
                            value: `${m.impliedPerChi.toLocaleString('vi-VN')}đ/chỉ`,
                            color: 'text-slate-200',
                          },
                          activeData.worldPrice > 0 && {
                            label: 'Vàng thế giới',
                            value: `$${activeData.worldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz`,
                            color: 'text-slate-200',
                          },
                          m.usdVnd > 0 && {
                            label: 'Tỷ giá USD/VND',
                            value: m.usdVnd.toLocaleString('vi-VN'),
                            color: 'text-slate-200',
                          },
                          lowestSpread !== null && {
                            label: 'Spread thấp nhất',
                            value: `${lowestSpread}%`,
                            color: 'text-emerald-400',
                          },
                          lowestPremium !== null && {
                            label: 'Premium thấp nhất',
                            value: `+${lowestPremium}%`,
                            color: lowestPremium > 10 ? 'text-amber-400' : 'text-emerald-400',
                          },
                          lowestCost !== null && {
                            label: 'Chi phí thấp nhất',
                            value: `${lowestCost}%`,
                            color: lowestCost > 10 ? 'text-amber-400' : 'text-emerald-400',
                          },
                          false, // removed: Thương hiệu theo dõi
                        ].filter(Boolean) as { label: string; value: string; color: string }[];
                        return (
                          <div className="flex flex-wrap gap-2">
                            {chips.map(({ label, value, color }) => (
                              <div
                                key={label}
                                className="flex flex-col px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5"
                              >
                                <span className="text-[10px] font-semibold text-slate-500 mb-0.5">{label}</span>
                                <span className={`text-xs font-bold ${color}`}>{value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Scoring formula */}
                      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                          <Sparkles size={11} className="text-amber-400 shrink-0" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Cách FinSight xếp hạng vàng
                          </span>
                        </div>
                        <div className="px-4 py-3 flex gap-6">
                          <div className="flex items-start gap-2 flex-1">
                            <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20 mt-0.5">
                              60%
                            </span>
                            <div>
                              <p className="text-[11px] font-bold text-slate-200">Chi phí vào lệnh</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                Spread + Premium so với giá thế giới. Thấp = dễ hoà vốn, xếp hạng cao hơn.
                              </p>
                            </div>
                          </div>
                          <div className="w-px bg-white/5 shrink-0" />
                          <div className="flex items-start gap-2 flex-1">
                            <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/20 mt-0.5">
                              40%
                            </span>
                            <div>
                              <p className="text-[11px] font-bold text-slate-200">RSI 14 ngày</p>
                              <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                RSI ≤30 = vùng đáy, cơ hội tích lũy. RSI ≥70 = quá nóng, cẩn thận vào mới.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-200 leading-relaxed">
                    {activeData.intro || suggestion.intro}
                  </p>
                </div>
                  );
                })()
              ) : (
                <p className="text-sm font-medium text-slate-200 leading-relaxed">
                  {activeData.intro || suggestion.intro}
                </p>
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {activeData.loading ? (
                <div className="col-span-2 py-16 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <div className="w-16 h-1.5 rounded-full bg-white/5 relative overflow-hidden">
                    <motion.div
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full"
                      style={{ background: suggestion.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold animate-pulse">Đang đồng bộ dữ liệu...</span>
                </div>
              ) : (
                <>
                  {(activeData.items.length > 0 ? activeData.items : suggestion.items).map((item, i) => {
                    const cardKey = getAssetCardKey(item, active, i);
                    return (
                      <AssetCard
                        key={cardKey}
                        item={item}
                        color={suggestion.color}
                        type={active}
                        rank={i + 1}
                        onOpenModal={setModalItem}
                      />
                    );
                  })}
                </>
              )}
            </div>

            {suggestion.tips.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {suggestion.tips.map((tip: string, i: number) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex gap-4 group hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white group-hover:bg-blue-500/20 transition-all duration-300 shadow-sm">
                      {i + 1}
                    </div>
                    <p className="text-sm font-medium text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
                      {tip}
                    </p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {suggestion.tips.map((tip, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex gap-4 group hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300"
                >
                  <div className="shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white group-hover:bg-blue-500/20 transition-all duration-300 shadow-sm">
                    {i + 1}
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-white/5">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500 bg-white/[0.02] px-3 py-1.5 rounded-full border border-white/5">
                  <Clock size={12} />
                  <span className="text-xs font-semibold">Cập nhật: {activeData.updatedAt || 'Real-time'}</span>
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

      {modalItem && suggestion && (
        <AssetDetailModal item={modalItem} color={suggestion.color} type={active} onClose={() => setModalItem(null)} />
      )}
    </div>
  );
}

function AssetDetailModal({ item, color, type, onClose }) {
  const historyRequest = getHistoryRequest(item, type);
  const canShowHistory = Boolean(historyRequest);
  const rangeConfig = getHistoryRangeConfig(historyRequest);
  const [rangeValue, setRangeValue] = useState(rangeConfig.defaultValue);
  const historyQuery = useAssetMonthlyHistory({
    ...historyRequest,
    [rangeConfig.paramName]: rangeValue,
    enabled: canShowHistory,
  });
  const historyRows = historyQuery.data?.history || [];
  const historyMetric = historyQuery.data?.metric || historyRequest?.metric || {};
  const sourceType = historyQuery.data?.sourceType || historyRequest?.sourceType;
  const sourceText = historyRequest?.sourceLabel || historyQuery.data?.dataSource;
  const rate = formatCardMetric(item);
  const badge = item.badge;
  const badgeColor = item.badgeColor;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Color accent bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-3xl" style={{ background: color }} />

          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <h3 className="text-base font-bold text-white">{item.name}</h3>
                {badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                      badgeColor === 'emerald'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : badgeColor === 'amber'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : badgeColor === 'purple'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{item.tag}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 pl-3">
              <span className="text-lg font-bold" style={{ color }}>
                {rate}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Key metrics chips — 1 row, equal width */}
          <div className="px-5 pb-4 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
            {[
              { label: 'Mua vào', value: item.buyPrice ? formatVND(item.buyPrice) : null, valueColor: 'text-white' },
              {
                label: 'Bán ra',
                value: item.price ? formatVND(item.price) : null,
                valueColor: '',
                valueStyle: { color },
              },
              {
                label: 'Spread',
                value: item.costAnalysis?.spreadPct != null ? `${item.costAnalysis.spreadPct}%` : null,
                valueColor: 'text-white',
              },
              {
                label: 'Chi phí lệnh',
                value: item.costAnalysis?.totalEntryCostPct != null ? `${item.costAnalysis.totalEntryCostPct}%` : null,
                valueColor: item.costAnalysis?.totalEntryCostPct > 10 ? 'text-amber-400' : 'text-white',
              },
              {
                label: 'Premium TG',
                value: item.costAnalysis?.premiumPct > 0 ? `+${item.costAnalysis.premiumPct}%` : null,
                valueColor: item.costAnalysis?.premiumPct > 10 ? 'text-amber-400' : 'text-slate-300',
              },
            ].map(
              ({ label, value, valueColor, valueStyle }) =>
                value && (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center px-1.5 py-2 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <span className="text-[9px] font-semibold text-slate-500 mb-1 leading-tight">{label}</span>
                    <span className={`text-[11px] font-bold leading-tight ${valueColor}`} style={valueStyle}>
                      {value}
                    </span>
                  </div>
                ),
            )}
          </div>

          {/* Divider */}
          <div className="mx-5 border-t border-white/5" />

          {/* Chart section */}
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">{rangeConfig.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {canShowHistory ? getHistorySubtitle(historyQuery.data, historyRequest) : 'Chưa có nguồn lịch sử.'}
                </p>
                {canShowHistory && (sourceText || sourceType) && (
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {sourceType && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10 bg-white/[0.03] text-slate-300">
                        {getSourceTypeLabel(sourceType)}
                      </span>
                    )}
                    {sourceText && <span className="text-[10px] text-slate-500">{sourceText}</span>}
                  </div>
                )}
              </div>
              {canShowHistory && (
                <HistoryRangeToggle
                  value={rangeValue}
                  onChange={setRangeValue}
                  color={color}
                  options={rangeConfig.options}
                  unitLabel={rangeConfig.unitLabel}
                />
              )}
            </div>

            {!canShowHistory ? (
              <div className="h-36 rounded-2xl bg-white/[0.015] border border-white/5 flex items-center justify-center text-xs text-slate-500">
                Chưa có nguồn lịch sử phù hợp.
              </div>
            ) : historyQuery.isLoading ? (
              <div className="h-44 rounded-2xl bg-white/[0.015] border border-white/5 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 size={18} className="animate-spin" style={{ color }} />
                <span className="text-xs font-semibold">Đang tải dữ liệu lịch sử...</span>
              </div>
            ) : historyQuery.isError ? (
              <div className="h-36 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-center justify-center text-xs text-rose-300 px-4 text-center">
                Không thể tải dữ liệu lịch sử cho mã này.
              </div>
            ) : (
              <MonthlyHistoryChart data={historyRows} color={color} metric={historyMetric} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function AssetCard({ item, color, type, rank, onOpenModal }) {
  const name = item.name;
  const tag = item.tag;
  const rate = formatCardMetric(item);
  const badge = item.badge;
  const badgeColor = item.badgeColor;
  const historyRequest = getHistoryRequest(item, type);
  const canShowHistory = Boolean(historyRequest);
  const cost = item.costAnalysis;

  return (
    <motion.div
      layout
      role="button"
      tabIndex={0}
      aria-disabled={!canShowHistory}
      onClick={() => {
        if (canShowHistory) onOpenModal(item);
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && canShowHistory) {
          e.preventDefault();
          onOpenModal(item);
        }
      }}
      className={`bg-white/[0.02] border border-white/5 p-5 rounded-2xl group hover:border-white/10 transition-all duration-300 hover:bg-white/[0.04] hover:shadow-lg relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-white/15 hover:-translate-y-1 ${
        canShowHistory ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl rounded-full"
        style={{ background: color, transform: 'translate(30%, -30%)' }}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black border ${
                rank === 1
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : rank === 2
                    ? 'bg-slate-400/10 border-slate-400/20 text-slate-300'
                    : rank === 3
                      ? 'bg-orange-700/20 border-orange-700/30 text-orange-500'
                      : 'bg-white/[0.04] border-white/5 text-slate-500'
              }`}
            >
              {rank}
            </span>
            <h4 className="text-base font-bold text-white tracking-tight group-hover:text-blue-300 transition-colors break-words">
              {name}
            </h4>
            {badge && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                  badgeColor === 'emerald'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : badgeColor === 'amber'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : badgeColor === 'purple'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-500">{tag}</span>
        </div>
        <div className="text-right flex flex-col items-end shrink-0 pl-3">
          <span className="text-base font-bold tracking-tight" style={{ color }}>
            {rate}
          </span>
          {canShowHistory && (
            <div className="p-1 rounded-full bg-white/5 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ChevronDown size={14} className="text-white -rotate-90" />
            </div>
          )}
        </div>
      </div>
      {/* Compact chips */}
      <div className="flex flex-wrap gap-1.5 relative z-10">
        {cost && item.buyPrice != null && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-slate-400">
            Mua {formatVND(item.buyPrice)}
          </span>
        )}
        {cost && item.price != null && (
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5"
            style={{ color }}
          >
            Bán {formatVND(item.price)}
          </span>
        )}
        {cost?.spreadPct != null && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-slate-400">
            Spread {cost.spreadPct}%
          </span>
        )}
        {cost?.totalEntryCostPct != null && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
              cost.totalEntryCostPct > 10
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-white/[0.04] border-white/5 text-slate-400'
            }`}
          >
            Chi phí {cost.totalEntryCostPct}%
          </span>
        )}
        {cost?.premiumPct != null && cost.premiumPct > 0 && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
              cost.premiumPct > 10
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-white/[0.04] border-white/5 text-slate-400'
            }`}
          >
            Premium +{cost.premiumPct}%
          </span>
        )}
        {!cost && item.note && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-slate-400">
            {item.note}
          </span>
        )}
      </div>
      {!cost && item.reason?.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-white/5 pt-3">
          {item.reason.map((r: string, i: number) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-relaxed">
              <span className="shrink-0 mt-0.5 text-emerald-400">✓</span>
              {r}
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
