import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardList,
  DollarSign,
  Lightbulb,
  Plus,
  Save,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import FormattedInput from '../../components/common/FormattedInput';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useUpdateProfile } from '../../hooks/useAuthQuery';
import {
  useDebtGoal,
  useDebts,
  useRepaymentPlan,
  useRepaymentPlanMutations,
  useRepaymentPlans,
} from '../../hooks/useDebtQuery';
import { formatVND } from '../../utils/calculations';
import type { StrategyType } from './components/repaymentShared';
import { breachDot, MethodPlanCard, StrategyModal, TOOLTIP_STYLE } from './components/repaymentShared';

export default function RepaymentPlanPage() {
  const navigate = useNavigate();
  const { user } = useAuth() as any;
  const defaultBudget = user?.extraBudget || 0;

  const [extraBudget, setExtraBudget] = useState(defaultBudget);
  const [budgetInput, setBudgetInput] = useState(String(defaultBudget));
  const [debouncedBudget, setDebouncedBudget] = useState(defaultBudget);
  const [modal, setModal] = useState<StrategyType | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBudget(extraBudget), 300);
    return () => clearTimeout(timer);
  }, [extraBudget]);

  const { data: planData, isLoading: planLoading } = useRepaymentPlan(debouncedBudget) as {
    data: any;
    isLoading: boolean;
  };
  const { data: debtsData, isLoading: debtsLoading } = useDebts() as {
    data: any;
    isLoading: boolean;
  };
  const { data: goalData, isLoading: goalLoading } = useDebtGoal() as {
    data: any;
    isLoading: boolean;
  };
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateProfile();
  const { data: plansData } = useRepaymentPlans() as { data: any };
  const { deletePlan, isDeletingPlan } = useRepaymentPlanMutations();
  const customPlans = plansData?.plans || [];

  const loading = planLoading || debtsLoading || goalLoading;

  useEffect(() => {
    setBudgetInput(String(defaultBudget));
    setExtraBudget(defaultBudget);
    setDebouncedBudget(defaultBudget);
  }, [defaultBudget]);

  const commitBudgetValue = (rawValue: string | number) => {
    const numericValue = Math.min(
      100000000000,
      Math.max(0, parseInt(String(rawValue || '').replace(/\D/g, ''), 10) || 0),
    );
    setBudgetInput(String(numericValue));
    setExtraBudget(numericValue);
  };

  const handleSliderChange = (value: number) => {
    const numericValue = Math.max(0, value);
    setBudgetInput(String(numericValue));
    setExtraBudget(numericValue);
  };

  const handleSaveBudget = async () => {
    try {
      await updateProfile({
        extraBudget,
        fullName: user?.fullName || '',
        monthlyIncome: user?.monthlyIncome || 0,
      });
      setSaved(true);
      toast.success('Đã lưu ngân sách trả thêm');
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.error || 'Có lỗi xảy ra khi lưu ngân sách');
    }
  };

  if (loading && !planData) return <PageSkeleton />;

  const { avalanche, snowball, comparison } = planData || {};
  const debtSummary = debtsData?.summary;
  const allDebts = debtsData?.debts || [];
  const monthlyIncome = planData?.monthlyIncome ?? debtSummary?.monthlyIncome ?? user?.monthlyIncome ?? 0;
  const minimumBudget = planData?.minimumBudget ?? avalanche?.minimumBudget ?? debtSummary?.totalMinPayment ?? 0;
  const totalMonthlyBudget =
    planData?.totalMonthlyBudget ?? avalanche?.totalMonthlyBudget ?? minimumBudget + extraBudget;

  const progress = goalData?.progress;
  const reachedCount = goalData?.milestones?.filter((m) => m.reached).length || 0;

  const timelineData = [];
  if (avalanche?.schedule && snowball?.schedule) {
    const maxMonths = Math.max(avalanche.schedule.length, snowball.schedule.length);
    const getTotalBalance = (entry: any) => {
      if (!entry) return null;
      if (Number.isFinite(entry.totalBalance)) return entry.totalBalance;
      if (Array.isArray(entry.payments)) {
        return entry.payments.reduce((s, p) => s + p.balance, 0);
      }
      return null;
    };

    for (let m = 0; m < maxMonths; m++) {
      const av = avalanche.schedule[m],
        sn = snowball.schedule[m];
      const monthNumber = av?.month ?? sn?.month ?? m;
      const avBalance = getTotalBalance(av);
      const snBalance = getTotalBalance(sn);
      const avDti = Number.isFinite(av?.dti) ? av.dti : null;
      const snDti = Number.isFinite(sn?.dti) ? sn.dti : null;
      timelineData.push({
        month: monthNumber === 0 ? 'Hiện tại' : `T${monthNumber}`,
        ...(avBalance !== null && { avalanche: Math.round(avBalance) }),
        ...(snBalance !== null && { snowball: Math.round(snBalance) }),
        ...(avDti !== null && { avDti }),
        ...(snDti !== null && { snDti }),
      });
    }
  }

  const avSafeMonth = timelineData.findIndex((d) => d.avDti !== undefined && d.avDti <= 20);
  const snSafeMonth = timelineData.findIndex((d) => d.snDti !== undefined && d.snDti <= 20);
  const safeMonthLabel = (index: number) => timelineData[index]?.month ?? `T${index + 1}`;
  const repaymentWarnings = Array.from(
    new Map(
      [
        ...(avalanche?.warnings || []).filter((warning: any) => warning.type !== 'TERM_BREACH'),
        ...(snowball?.warnings || []).filter((warning: any) => warning.type !== 'TERM_BREACH'),
        ...(avalanche?.isScheduleTruncated || snowball?.isScheduleTruncated
          ? [
              {
                type: 'SCHEDULE_TRUNCATED',
                severity: 'WARNING',
                message: 'Biểu đồ chỉ hiển thị tối đa 360 tháng đầu sau mốc hiện tại.',
              },
            ]
          : []),
      ].map((warning: any) => [warning.type, warning]),
    ).values(),
  );
  const termBreachAlerts = [
    avalanche?.termBreach && { method: 'Avalanche', ...avalanche.termBreach },
    snowball?.termBreach && { method: 'Snowball', ...snowball.termBreach },
  ].filter(Boolean);
  const hasTermBreach = termBreachAlerts.length > 0;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ClipboardList size={11} /> Kế hoạch trả nợ
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Kế hoạch trả nợ</h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            So sánh Avalanche vs Snowball để chọn chiến lược tối ưu
          </p>
        </div>

        {goalData && (
          <Link to="/debts/goal" className="block">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 rounded-2xl border cursor-pointer transition-all hover:border-violet-500/40 hover:bg-violet-500/8 relative overflow-hidden"
              style={{
                background: 'var(--color-bg-card)',
                borderColor: 'rgba(139,92,246,0.2)',
              }}
            >
              <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
                {reachedCount === 4 ? <Trophy size={18} /> : <Target size={18} />}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[12px] font-black text-[var(--color-text-primary)]">Mục tiêu trả nợ</span>
                  {goalData.goal && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        goalData.onTrack?.status === 'BEHIND'
                          ? 'bg-red-500/15 text-red-300'
                          : goalData.onTrack?.status === 'AHEAD'
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-blue-500/15 text-blue-300'
                      }`}
                    >
                      {goalData.onTrack?.status === 'BEHIND'
                        ? 'Chậm tiến độ'
                        : goalData.onTrack?.status === 'AHEAD'
                          ? 'Vượt kế hoạch'
                          : 'Đúng tiến độ'}
                    </span>
                  )}
                  {!goalData.goal && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/15 text-slate-400">
                      Chưa đặt mục tiêu
                    </span>
                  )}
                </div>

                {progress && (
                  <div className="min-w-0">
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden min-w-0">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, progress.percentPaid)}%`,
                          background: 'linear-gradient(90deg, #ef4444, #f97316, #22c55e)',
                        }}
                      />
                    </div>
                  </div>
                )}

                {!goalData.goal && !progress && (
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Đặt ngày mục tiêu để theo dõi tiến độ trả nợ
                  </p>
                )}
              </div>

              {progress && (
                <div className="hidden md:flex min-w-[104px] flex-col items-end gap-0.5 border-l border-white/8 pl-4 text-right">
                  <p className="text-[11px] font-black text-[var(--color-text-muted)] whitespace-nowrap">
                    {progress.percentPaid.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
                    {reachedCount}/4 milestone
                  </p>
                </div>
              )}
              <ChevronRight size={16} className="hidden md:block text-[var(--color-text-muted)] shrink-0" />
            </motion.div>
          </Link>
        )}

        <div
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{
            background: 'var(--color-bg-card)',
            borderColor: 'rgba(59,130,246,0.15)',
          }}
        >
          <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 bg-blue-500" />
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
              <DollarSign size={16} />
            </div>
            <span className="text-[13px] font-black text-[var(--color-text-primary)]">
              Ngân sách trả thêm mỗi tháng
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
            <div className="flex-1 relative">
              <FormattedInput
                kind="integer"
                value={budgetInput}
                onValueChange={setBudgetInput}
                onCommitValue={commitBudgetValue}
                maxValue={100000000000}
                placeholder="Nhập số tiền..."
                suffix="đ"
                className="w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-blue-400 font-black text-[14px] outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>
            <button
              onClick={handleSaveBudget}
              disabled={saving}
              className={`shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-black transition-all border cursor-pointer md:min-w-[96px] ${
                saved
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25'
              }`}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Đã lưu' : 'Lưu'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
            {[
              { label: 'Tối thiểu', value: minimumBudget },
              { label: 'Trả thêm', value: extraBudget },
              { label: 'Tổng/tháng', value: totalMonthlyBudget },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/6 bg-white/4 px-3 py-2.5">
                <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-[13px] text-[var(--color-text-primary)] font-black mt-1">{formatVND(item.value)}</p>
              </div>
            ))}
          </div>

          <input
            type="range"
            min="0"
            max="100000000"
            step="500000"
            value={Math.min(extraBudget, 100000000)}
            onChange={(e) => handleSliderChange(+e.target.value)}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5">
            <span>0đ</span>
            <span>25tr</span>
            <span>50tr</span>
            <span>75tr</span>
            <span>100tr</span>
          </div>
          {extraBudget > 100000000 && (
            <p className="text-[11px] text-amber-400 mt-2 font-medium">
              Giá trị vượt thanh kéo - tính toán vẫn dùng đúng số bạn nhập.
            </p>
          )}
        </div>

        {!planData || !avalanche ? (
          <div
            className="rounded-3xl border border-[var(--color-border)] p-16 text-center"
            style={{ background: 'var(--color-bg-card)' }}
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={28} className="text-slate-500" />
            </div>
            <p className="text-[var(--color-text-muted)] font-medium">Không có khoản nợ nào để tính</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4 mt-8">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                <Target size={16} />
              </div>
              <h2 className="text-xl font-black text-[var(--color-text-primary)]">Chiến lược trả nợ</h2>
            </div>
            {repaymentWarnings.length > 0 && (
              <div className="mb-4 flex items-start gap-3 px-5 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-amber-500 to-orange-400" />
                <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5 ml-1" />
                <div className="space-y-1">
                  <p className="text-[13px] text-amber-200 font-black">Cảnh báo mô phỏng</p>
                  {repaymentWarnings.map((warning: any) => (
                    <p key={warning.type} className="text-[12px] text-amber-100/80 leading-relaxed">
                      {warning.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <MethodPlanCard
                type="AVALANCHE"
                debts={allDebts.filter((d) => d.balance > 0)}
                simulation={avalanche}
                termBreach={avalanche.termBreach}
                onInfo={() => setModal('AVALANCHE')}
              />
              <MethodPlanCard
                type="SNOWBALL"
                debts={allDebts.filter((d) => d.balance > 0)}
                simulation={snowball}
                termBreach={snowball.termBreach}
                onInfo={() => setModal('SNOWBALL')}
              />
            </div>
            {comparison?.savedInterest > 0 && !hasTermBreach && (
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/6 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-emerald-500 to-teal-400" />
                <Lightbulb size={16} className="text-emerald-400 shrink-0 ml-1" />
                <p className="text-[13px] text-emerald-300 font-medium">
                  Avalanche giúp tiết kiệm{' '}
                  <span className="font-black text-emerald-200">{formatVND(comparison.savedInterest)}</span> tiền lãi
                  {comparison.savedMonths > 0 && ` và trả xong sớm hơn ${comparison.savedMonths} tháng`}
                </p>
              </div>
            )}

            {timelineData.length > 0 && (
              <div
                className="relative rounded-3xl p-6 border overflow-hidden"
                style={{
                  background: 'var(--color-bg-card)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                  <TrendingDown size={16} className="text-blue-400" /> Tiến trình giảm dư nợ
                </h3>
                <div className="h-[360px] md:h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelineData}>
                      <defs>
                        <linearGradient id="avLine" x1="0" y1="0" x2="1" y2="0">
                          <stop stopColor="#3b82f6" />
                          <stop offset="1" stopColor="#06b6d4" />
                        </linearGradient>
                        <linearGradient id="snLine" x1="0" y1="0" x2="1" y2="0">
                          <stop stopColor="#10b981" />
                          <stop offset="1" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000000).toFixed(0)}tr`}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(v, name) => [formatVND(Number(v)), name === 'Avalanche' ? 'Avalanche' : 'Snowball']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                      <Line
                        type="monotone"
                        dataKey="avalanche"
                        name="Avalanche"
                        stroke="url(#avLine)"
                        strokeWidth={2.5}
                        dot={breachDot(avalanche, '#3b82f6')}
                      />
                      <Line
                        type="monotone"
                        dataKey="snowball"
                        name="Snowball"
                        stroke="url(#snLine)"
                        strokeWidth={2.5}
                        dot={breachDot(snowball, '#10b981')}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {timelineData.length > 0 &&
              monthlyIncome > 0 &&
              timelineData.some((d) => d.avDti !== undefined || d.snDti !== undefined) && (
                <div
                  className="relative rounded-3xl p-6 border overflow-hidden"
                  style={{
                    background: 'var(--color-bg-card)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-400" /> DTI sẽ giảm như thế nào?
                  </h3>
                  <p className="text-[12px] text-[var(--color-text-muted)] mb-5">
                    Dự phóng tỉ lệ nợ/thu nhập theo từng tháng
                  </p>

                  {(avSafeMonth !== -1 || snSafeMonth !== -1) && (
                    <div className="flex gap-3 mb-5">
                      {avSafeMonth !== -1 && (
                        <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-blue-500/15 bg-blue-500/6">
                          <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-black mb-1">
                            Avalanche
                          </p>
                          <p className="text-[16px] font-black text-blue-400">{safeMonthLabel(avSafeMonth)}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">DTI về &lt;20%</p>
                        </div>
                      )}
                      {snSafeMonth !== -1 && (
                        <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-emerald-500/15 bg-emerald-500/6">
                          <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-black mb-1">
                            Snowball
                          </p>
                          <p className="text-[16px] font-black text-emerald-400">{safeMonthLabel(snSafeMonth)}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)]">DTI về &lt;20%</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis
                          dataKey="month"
                          tick={{
                            fill: 'var(--color-text-muted)',
                            fontSize: 11,
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fill: 'var(--color-text-muted)',
                            fontSize: 11,
                          }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                          domain={[0, 'auto']}
                          width={36}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          content={({ payload, label }) => {
                            const filtered = (payload || []).filter(
                              (p) => p.dataKey !== 'safe-zone' && p.name !== 'safe-zone',
                            );
                            if (!filtered.length) return null;
                            return (
                              <div style={{ ...TOOLTIP_STYLE, padding: '8px 12px' }}>
                                <p style={{ margin: 0, fontWeight: 900, fontSize: 12 }}>{label}</p>
                                {filtered.map((p) => (
                                  <p key={p.dataKey} style={{ margin: '4px 0 0', fontSize: 12, color: p.color }}>
                                    {p.dataKey === 'avDti' ? 'Avalanche DTI' : 'Snowball DTI'} : {p.value}%
                                  </p>
                                ))}
                              </div>
                            );
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: '12px',
                            paddingTop: '12px',
                          }}
                          formatter={(v) => (v === 'avDti' ? 'Avalanche DTI' : 'Snowball DTI')}
                        />
                        <Line
                          type="monotone"
                          dataKey={() => 20}
                          name="safe-zone"
                          stroke="#10b981"
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          dot={false}
                          legendType="none"
                        />
                        <Line
                          type="monotone"
                          dataKey="avDti"
                          name="avDti"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="snDti"
                          name="snDti"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-2 text-center">
                    Đường đứt nét xanh = ngưỡng an toàn 20%
                  </p>
                </div>
              )}
          </>
        )}

        {/* Plan List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                <ClipboardList size={16} />
              </div>
              <h2 className="text-[15px] font-black text-[var(--color-text-primary)]">Bản kế hoạch tùy chỉnh</h2>
            </div>
            <button
              onClick={() => navigate('/debts/plan/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 text-sm font-black hover:bg-cyan-500/16 transition-colors cursor-pointer"
            >
              <Plus size={16} /> Tạo kế hoạch
            </button>
          </div>

          {customPlans.length === 0 ? (
            <div
              className="rounded-3xl border p-8 text-center"
              style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/12 text-cyan-300 flex items-center justify-center mb-4">
                <ClipboardList size={22} />
              </div>
              <h3 className="text-lg font-black text-[var(--color-text-primary)]">Chưa có bản kế hoạch nào</h3>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Bắt đầu bằng cách tạo một kế hoạch trả nợ riêng.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {customPlans.map((plan: any) => {
                const summary = plan.summary || {};
                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ y: -2 }}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/debts/plan/${plan.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/debts/plan/${plan.id}`);
                      }
                    }}
                    className="group relative rounded-3xl border p-5 md:p-6 overflow-hidden cursor-pointer transition-colors hover:border-cyan-500/35"
                    style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
                  >
                    <ChevronRight
                      size={18}
                      className="absolute top-6 right-6 text-[var(--color-text-muted)] group-hover:text-cyan-300 transition-colors"
                    />
                    <div className="flex items-start gap-4 mb-5 pr-8">
                      <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 text-cyan-300 flex items-center justify-center shrink-0">
                        <Zap size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-[var(--color-text-primary)] truncate">{plan.name}</h3>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                        <p className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                          Khoản nợ
                        </p>
                        <p className="text-lg font-black text-[var(--color-text-primary)] mt-1">
                          {summary.debtCount || 0}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-white/4 p-4">
                        <p className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text-muted)]">
                          Tổng dư nợ
                        </p>
                        <p className="text-lg font-black text-[var(--color-text-primary)] mt-1">
                          {formatVND(summary.totalBalance || 0)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePlan(plan.id);
                        }}
                        disabled={isDeletingPlan}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-black hover:bg-red-500/16 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>{modal && <StrategyModal type={modal} onClose={() => setModal(null)} />}</AnimatePresence>
    </>
  );
}
