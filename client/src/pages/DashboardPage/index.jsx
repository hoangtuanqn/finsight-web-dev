import { motion } from 'framer-motion';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useDashboardData } from './hooks/useDashboardData';
import { staggerContainer, fadeUp } from './constants';

// Components
import DominoAlerts from './components/DominoAlerts';
import KPICards     from './components/KPICards';
import QuickActions from './components/QuickActions';
import EARChart     from './components/EARChart';
import DueDebts     from './components/DueDebts';
import TopDebts     from './components/TopDebts';
import PlatformPie  from './components/PlatformPie';
import DTIMetrics   from './components/DTIMetrics';

// ─── Derived metrics helpers ──────────────────────────────────────

function getHealthMetrics(dtiRatio) {
  const score = Math.round(Math.max(0, 100 - dtiRatio * 2));
  return {
    healthScore: score,
    healthColor: score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444',
    healthLabel: score > 70 ? 'Tốt'     : score > 40 ? 'Trung bình' : 'Cần cải thiện',
  };
}

function getSentimentColor(value = 50) {
  if (value <= 24) return '#ef4444';
  if (value <= 49) return '#f97316';
  if (value <= 74) return '#22c55e';
  return '#15803d';
}

function getDTIMetrics(dtiRatio) {
  const color     = dtiRatio > 50 ? '#ef4444' : dtiRatio > 35 ? '#f97316' : dtiRatio > 20 ? '#f59e0b' : '#10b981';
  const zoneLabel = dtiRatio > 50 ? 'Khủng hoảng' : dtiRatio > 35 ? 'Nguy hiểm' : dtiRatio > 20 ? 'Cẩn thận' : 'An toàn';
  const label     = dtiRatio > 50 ? 'Mức khủng hoảng — hành động ngay!' : dtiRatio > 35 ? 'Rủi ro cao — cần giảm nợ' : dtiRatio > 20 ? 'Trung bình — cần chú ý' : 'Lành mạnh — tốt lắm!';
  return { dtiColor: color, dtiZoneLabel: zoneLabel, dtiLabel: label };
}

function buildEARChartData(debts) {
  return debts.slice(0, 5).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    APR: d.apr,
    EAR: d.ear,
  }));
}

function buildPlatformPieData(debts) {
  const counts = {};
  debts.forEach((d) => { counts[d.platform] = (counts[d.platform] || 0) + 1; });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}

// ─── Main page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const { user }      = useAuth();
  const { data, loading } = useDashboardData();

  if (loading) return <PageSkeleton />;

  // Destructure raw data
  const debtSummary   = data?.debts?.summary || {};
  const debts         = data?.debts?.debts   || [];
  const sentiment     = data?.sentiment      || {};

  // Derived values
  const dtiRatio      = debtSummary.debtToIncomeRatio || 0;
  const { healthScore, healthColor, healthLabel } = getHealthMetrics(dtiRatio);
  const sentimentColor  = getSentimentColor(sentiment.value);
  const { dtiColor, dtiZoneLabel, dtiLabel }     = getDTIMetrics(dtiRatio);
  const earChartData    = buildEARChartData(debts);
  const platformPieData = buildPlatformPieData(debts);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-5 pb-8"
    >
      {/* Page Header */}
      <motion.div variants={fadeUp} className="pt-4 pb-2">
        <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
          {getGreeting()},{' '}
          <span className="text-blue-400">{user?.fullName || 'bạn'}</span> 👋
        </h1>
        <p className="text-[var(--color-text-secondary)] text-[13px] mt-1">
          Tổng quan tài chính •{' '}
          {new Date().toLocaleDateString('vi-VN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
          })}
        </p>
      </motion.div>

      {/* Domino Alerts */}
      <motion.div variants={fadeUp}>
        <DominoAlerts alerts={debtSummary.dominoAlerts || []} />
      </motion.div>

      {/* Row 1: KPI Cards */}
      <motion.div variants={fadeUp}>
        <KPICards
          debtSummary={debtSummary}
          debts={debts}
          sentiment={sentiment}
          healthScore={healthScore}
          healthColor={healthColor}
          healthLabel={healthLabel}
          sentimentColor={sentimentColor}
        />
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp}>
        <QuickActions />
      </motion.div>

      {/* Row 2: EAR Chart + Due Debts */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-3 sm:gap-4">
        <motion.div variants={fadeUp} className="lg:col-span-6">
          <EARChart earChartData={earChartData} />
        </motion.div>
        <motion.div variants={fadeUp} className="lg:col-span-5">
          <DueDebts dueThisWeek={debtSummary.dueThisWeek || []} />
        </motion.div>
      </div>

      {/* Row 3: Top Debts + Platform Pie + DTI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <motion.div variants={fadeUp}>
          <TopDebts debts={debts} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <PlatformPie platformPieData={platformPieData} />
        </motion.div>
        <motion.div variants={fadeUp} className="sm:col-span-2 xl:col-span-1">
          <DTIMetrics
            dtiRatio={dtiRatio}
            dtiColor={dtiColor}
            dtiZoneLabel={dtiZoneLabel}
            dtiLabel={dtiLabel}
            debtSummary={debtSummary}
            monthlyIncome={user?.monthlyIncome}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
