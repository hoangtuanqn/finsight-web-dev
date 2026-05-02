import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { fadeUp, staggerContainer } from './constants';
import { useDashboardData } from './hooks/useDashboardData';

import TwoFactorBanner from '../../components/auth/TwoFactorBanner';
import ExportReportModal from '../../components/debt/ExportReportModal';
import DominoAlerts from './components/DominoAlerts';
import DTIMetrics from './components/DTIMetrics';
import DueDebts from './components/DueDebts';
import EARChart from './components/EARChart';
import KPICards from './components/KPICards';
import PlatformPie from './components/PlatformPie';
import QuickActions from './components/QuickActions';
import TopDebts from './components/TopDebts';

// ─── Derived metric helpers ───────────────────────────────────────

function getHealthMetrics(dtiRatio: number) {
  const score = Math.round(Math.max(0, 100 - dtiRatio * 2));
  return {
    healthScore: score,
    healthColor: score > 70 ? '#10b981' : score > 40 ? '#f59e0b' : '#ef4444',
    healthLabel: score > 70 ? 'Tốt' : score > 40 ? 'Trung bình' : 'Cần cải thiện',
  };
}

function getSentimentColor(value: number = 50) {
  if (value <= 24) return '#ef4444';
  if (value <= 49) return '#f97316';
  if (value <= 74) return '#22c55e';
  return '#15803d';
}

function getDTIMetrics(ratio: number) {
  const dtiColor = ratio > 50 ? '#ef4444' : ratio > 35 ? '#f97316' : ratio > 20 ? '#f59e0b' : '#10b981';
  const dtiZoneLabel = ratio > 50 ? 'Khủng hoảng' : ratio > 35 ? 'Nguy hiểm' : ratio > 20 ? 'Cẩn thận' : 'An toàn';
  const dtiLabel =
    ratio > 50
      ? 'Mức khủng hoảng - hành động ngay!'
      : ratio > 35
        ? 'Rủi ro cao - cần giảm nợ'
        : ratio > 20
          ? 'Trung bình - cần chú ý'
          : 'Lành mạnh - tốt lắm!';
  return { dtiColor, dtiZoneLabel, dtiLabel };
}

function buildEARChartData(debts: any[]) {
  return debts.slice(0, 5).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    APR: d.apr,
    EAR: d.ear,
  }));
}

function buildPlatformPieData(debts: any[]) {
  const counts: Record<string, number> = {};
  debts.forEach((d) => {
    counts[d.platform] = (counts[d.platform] || 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
}

// ─── Section divider ─────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.25em]">{label}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth() as any;
  const { data, loading } = useDashboardData() as {
    data: any;
    loading: boolean;
  };
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (loading) return <PageSkeleton />;

  const debtSummary = data?.debts?.summary || {};
  const debts = data?.debts?.debts || [];
  const sentiment = data?.sentiment || {};
  const dtiRatio = debtSummary.debtToIncomeRatio || 0;

  const { healthScore, healthColor, healthLabel } = getHealthMetrics(dtiRatio);
  const sentimentColor = getSentimentColor(sentiment.value);
  const { dtiColor, dtiZoneLabel, dtiLabel } = getDTIMetrics(dtiRatio);
  const earChartData = buildEARChartData(debts);
  const platformPieData = buildPlatformPieData(debts);

  return (
    <motion.div initial="initial" animate="animate" variants={staggerContainer} className="relative pb-10 space-y-6">
      {/* ── Background ambient orbs (matches Landing Page) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] rounded-full bg-blue-600/8 dark:bg-blue-600/12 blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-600/8 dark:bg-purple-600/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[20%] h-[20%] rounded-full bg-emerald-600/6 dark:bg-emerald-600/8 blur-[80px]" />
      </div>

      {/* ── Page Header ── */}
      <motion.div variants={fadeUp} className="relative z-10 pt-4 pb-2">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-5">
          <Sparkles size={12} />
          Tổng quan tài chính
        </div>

        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-[var(--color-text-primary)] leading-[1.1]">
              {getGreeting()},{' '}
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {user?.fullName?.split(' ').pop() || 'bạn'}
              </span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-2 font-medium">
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10b981]" />
            <span className="text-[11px] font-bold text-emerald-400">Dữ liệu real-time</span>
          </div>
        </div>
      </motion.div>

      {/* ── Domino Alerts ── */}
      <motion.div variants={fadeUp} className="relative z-10">
        <TwoFactorBanner user={user} />
        <DominoAlerts alerts={debtSummary.dominoAlerts || []} />
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div variants={fadeUp} className="relative z-10">
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

      {/* ── Quick Actions ── */}
      <motion.div variants={fadeUp} className="relative z-10">
        <QuickActions onExportClick={() => setIsExportModalOpen(true)} />
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div variants={fadeUp} className="relative z-10">
        <SectionLabel label="Phân tích lãi suất & đáo hạn" />
        <div className="grid grid-cols-1 lg:grid-cols-11 gap-4">
          <div className="lg:col-span-6">
            <EARChart earChartData={earChartData} />
          </div>
          <div className="lg:col-span-5">
            <DueDebts dueThisWeek={debtSummary.dueThisWeek || []} />
          </div>
        </div>
      </motion.div>

      {/* ── Bottom Row ── */}
      <motion.div variants={fadeUp} className="relative z-10">
        <SectionLabel label="Danh mục & chỉ số" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <TopDebts debts={debts} />
          <PlatformPie platformPieData={platformPieData} />
          <div className="sm:col-span-2 xl:col-span-1">
            <DTIMetrics
              dtiRatio={dtiRatio}
              dtiColor={dtiColor}
              dtiZoneLabel={dtiZoneLabel}
              dtiLabel={dtiLabel}
              debtSummary={debtSummary}
              monthlyIncome={user?.monthlyIncome}
            />
          </div>
        </div>
      </motion.div>

      <ExportReportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} />
    </motion.div>
  );
}
