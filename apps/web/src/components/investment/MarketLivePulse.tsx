import { BarChart2, TrendingDown, TrendingUp, Zap } from 'lucide-react';

export default function MarketLivePulse({ prices = {} }) {
  const items = [
    {
      label: 'Bitcoin',
      value: prices.bitcoin?.price ? `$${prices.bitcoin.price.toLocaleString()}` : '-',
      change: prices.bitcoin?.change24h,
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Ethereum',
      value: prices.ethereum?.price ? `$${prices.ethereum.price.toLocaleString()}` : '-',
      change: prices.ethereum?.change24h,
      icon: Zap,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Vàng SJC',
      value: prices.gold?.sell ? `${prices.gold.sell.toLocaleString('vi-VN')} đ` : '-',
      extra: prices.gold?.unit || '',
      icon: BarChart2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="relative bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] overflow-hidden group">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-emerald-500/20 transition-colors duration-700" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
            <Activity size={14} className="text-blue-400" />
          </div>
          Nhịp đập thị trường
        </h3>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {items.map((item, i) => (
          <div
            key={i}
            className="relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
          >
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon size={20} className={item.color} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-white tracking-tight">{item.value}</span>
                {item.extra && <span className="text-[10px] font-medium text-slate-500">{item.extra}</span>}
              </div>
              {item.change !== undefined && (
                <div
                  className={`flex items-center gap-1 mt-0.5 text-xs font-semibold ${item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                >
                  {item.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(item.change).toFixed(2)}%
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Activity({ size, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
