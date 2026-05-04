import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { ToggleMode } from '../../components/layout/components/ToggleMode';
import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useDarkMode } from '../../hooks/useDarkMode';
import { ActionItems } from './components/ActionItems';
import { AgingReport } from './components/AgingReport';
import { CashFlowChart } from './components/CashFlowChart';

export default function DashboardPage() {
  const { user } = useAuth() as any;
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];
  const { getSummary, getActionItems, getCashFlow, getAgingReport } = useAnalytics();

  const [summary, setSummary] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any[]>([]);
  const [agingData, setAgingData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sum, act, cf, ag] = await Promise.all([
          getSummary(),
          getActionItems(),
          getCashFlow(),
          getAgingReport('RECEIVABLE'),
        ]);
        setSummary(sum);
        setActions(act);
        setCashFlow(cf);
        setAgingData(ag);
      } catch (err) {
        console.error('Lỗi khi fetch dữ liệu dashboard:', err);
      }
    };
    fetchData();
  }, []);

  const fmt = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

  const health = summary?.health;
  const deRatio = health?.deRatio ?? 0;
  const maxDE = health?.maxDeRatio ?? 3;
  const dePercent = Math.min((deRatio / maxDE) * 100, 100);
  const isRisk = health?.isRisk;

  return (
    <div className="space-y-6 pb-20">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 pb-2">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
              <Sparkles size={11} /> Enterprise Dashboard
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
              Chào,{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                {user?.fullName || 'bạn'}
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
              Tư cách:{' '}
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                {user?.roleTitle || 'Người dùng doanh nghiệp'}
              </span>
            </p>
          </div>
          <ToggleMode dark={dark} setDark={setDark} />
        </div>
      </motion.div>

      {/* ── 4 KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Tổng Phải Thu"
          value={summary?.receivable?.total ?? 0}
          sub={`Quá hạn: ${fmt(summary?.receivable?.overdue ?? 0)}`}
          icon={<TrendingUp size={18} />}
          trend="up"
          color="emerald"
          delay={0.05}
        />
        <KPICard
          title="Tổng Phải Trả"
          value={summary?.payable?.total ?? 0}
          sub={`Áp lực 30 ngày: ${fmt(summary?.payable?.dueSoon ?? 0)}`}
          icon={<Wallet size={18} />}
          trend="down"
          color="blue"
          delay={0.1}
        />
        <KPICard
          title="Tổng Quá Hạn"
          value={(summary?.receivable?.overdue ?? 0) + (summary?.payable?.overdue ?? 0)}
          sub={`Phạt: ${fmt(summary?.payable?.dailyPenalty ?? 0)}/ngày`}
          icon={<AlertCircle size={18} />}
          trend="danger"
          color="rose"
          delay={0.15}
        />
        <KPICard
          title="Sắp Đến Hạn"
          value={(summary?.receivable?.dueSoon ?? 0) + (summary?.payable?.dueSoon ?? 0)}
          sub="Trong 7 ngày tới"
          icon={<Calendar size={18} />}
          trend="warn"
          color="amber"
          delay={0.2}
        />
      </div>

      {/* ── Financial Health ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`flex items-center gap-5 px-6 py-4 rounded-2xl border ${
          isRisk
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50'
            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl ${isRisk ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-500' : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500'}`}
        >
          <ShieldAlert size={20} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Chỉ số D/E (Debt-to-Equity)</span>
            <span className={`text-xs font-black ${isRisk ? 'text-rose-500' : 'text-emerald-500'}`}>
              {deRatio.toFixed(2)}x / {maxDE}x {isRisk ? '⚠ Vượt ngưỡng' : '✓ An toàn'}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${dePercent}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Chart + Action Items ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <CashFlowChart data={cashFlow} />
        </div>
        <div className="lg:col-span-1">
          <ActionItems items={actions} />
        </div>
      </div>

      {/* ── Aging Report ── */}
      <AgingReport data={agingData} type="RECEIVABLE" />
    </div>
  );
}

function KPICard({ title, value, sub, icon, color, trend, delay }: any) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };
  const trendIcon: Record<string, any> = {
    up: <ArrowUpRight size={14} className="text-emerald-500" />,
    down: <ArrowDownRight size={14} className="text-blue-500" />,
    danger: <ArrowUpRight size={14} className="text-rose-500" />,
    warn: <Calendar size={14} className="text-amber-500" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm group hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorMap[color]}`}>{icon}</div>
        {trendIcon[trend]}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)}
      </p>
      <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-2 font-medium">{sub}</p>
    </motion.div>
  );
}
