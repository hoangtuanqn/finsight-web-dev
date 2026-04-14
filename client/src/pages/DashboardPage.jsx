import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { PageSkeleton } from '../components/common/LoadingSpinner';
import { debtAPI, marketAPI } from '../api/index.js';
import { useAuth } from '../context/AuthContext';
import { formatVND, formatPercent } from '../utils/calculations';

const QUICK_ACTIONS = [
  { to: '/debts/add', icon: '➕', label: 'Thêm khoản nợ', desc: 'Nhập nợ mới', color: '#3b82f6' },
  { to: '/debts/repayment', icon: '📋', label: 'Kế hoạch trả nợ', desc: 'Avalanche vs Snowball', color: '#10b981' },
  { to: '/risk-assessment', icon: '🎯', label: 'Đánh giá rủi ro', desc: '5 câu hỏi nhanh', color: '#8b5cf6' },
  { to: '/investment', icon: '📈', label: 'Phân bổ đầu tư', desc: 'Tư vấn AI', color: '#06b6d4' },
  { to: '/debts/ear-analysis', icon: '🔍', label: 'Phân tích EAR', desc: 'Chi phí ẩn', color: '#f59e0b' },
  { to: '/profile', icon: '👤', label: 'Hồ sơ', desc: 'Cập nhật thu nhập', color: '#64748b' },
];

const PIE_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6'];

const tooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  fontSize: '12px',
  padding: '8px 12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
};

const fade = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32 } },
};
const stagger = {
  container: { animate: { transition: { staggerChildren: 0.055 } } },
};

/* ─── Reusable Card shell ─── */
const Card = ({ children, className = '', style = {} }) => (
  <div
    className={`rounded-2xl border ${className} transition-colors duration-300`}
    style={{
      background: 'var(--color-bg-card)',
      borderColor: 'var(--color-border)',
      boxShadow: 'var(--shadow-card)',
      ...style,
    }}
  >
    {children}
  </div>
);

const CardHeader = ({ icon, title, subtitle, action }) => (
  <div className="flex items-start justify-between mb-5">
    <div className="flex items-center gap-2.5">
      <span className="text-xl leading-none">{icon}</span>
      <div>
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)] leading-tight">{title}</h2>
        {subtitle && <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [debtsRes, sentimentRes] = await Promise.all([
          debtAPI.getAll().catch(() => ({ data: { data: { debts: [], summary: {} } } })),
          marketAPI.getSentiment().catch(() => ({
            data: { data: { fearGreed: { value: 50, labelVi: 'Trung lập' } } },
          })),
        ]);
        setData({
          debts: debtsRes.data.data,
          sentiment: sentimentRes.data.data.fearGreed,
        });
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setTimeout(() => setLoading(false), 600);
      }
    };
    load();
  }, []);

  if (loading) return <PageSkeleton />;

  const debtSummary = data?.debts?.summary || {};
  const debts = data?.debts?.debts || [];
  const sentiment = data?.sentiment || {};

  const dtiRatio = debtSummary.debtToIncomeRatio || 0;
  const dtiScore = Math.max(0, 100 - dtiRatio * 2);
  const healthScore = Math.round(dtiScore);

  const healthColor = healthScore > 70 ? '#10b981' : healthScore > 40 ? '#f59e0b' : '#ef4444';
  const healthLabel = healthScore > 70 ? 'Tốt' : healthScore > 40 ? 'Trung bình' : 'Cần cải thiện';

  const sentimentColor =
    (sentiment.value || 50) <= 24
      ? '#ef4444'
      : (sentiment.value || 50) <= 49
        ? '#f97316'
        : (sentiment.value || 50) <= 74
          ? '#22c55e'
          : '#15803d';

  const dtiColor = dtiRatio > 35 ? '#ef4444' : dtiRatio > 20 ? '#f59e0b' : '#10b981';
  const dtiLabel =
    dtiRatio > 35 ? 'Rủi ro cao — cần giảm nợ' : dtiRatio > 20 ? 'Trung bình — cần chú ý' : 'Lành mạnh — tốt lắm!';

  const earChartData = debts.slice(0, 5).map((d) => ({
    name: d.name.length > 12 ? d.name.slice(0, 12) + '…' : d.name,
    APR: d.apr,
    EAR: d.ear,
  }));

  const platformCounts = {};
  debts.forEach((d) => {
    platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
  });
  const platformPieData = Object.entries(platformCounts).map(([k, v]) => ({ name: k, value: v }));

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  /* Gauge circle helper */
  const circumference = 2 * Math.PI * 50;
  const dtiDash = Math.min(100, dtiRatio) / 100;

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="space-y-5! pb-8"
    >
      {/* ── PAGE HEADER ── */}
      <motion.div variants={fade} className="pt-4 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-[22px] font-bold text-[var(--color-text-primary)] tracking-tight leading-tight">
              {greeting},{' '}
              <span className="text-blue-400">{user?.fullName || 'bạn'}</span> 👋
            </h1>
            <p className="text-[var(--color-text-secondary)] text-[13px] mt-1">
              Tổng quan tài chính •{' '}
              {new Date().toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <Link
            to="/debts/add"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
          >
            <span>➕</span> Thêm khoản nợ
          </Link>
        </div>
      </motion.div>

      {/* ── DOMINO ALERTS ── */}
      {debtSummary.dominoAlerts?.length > 0 && (
        <motion.div variants={fade} className="space-y-2">
          {debtSummary.dominoAlerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium ${alert.severity === 'DANGER'
                ? 'bg-red-500/[0.07] border-red-500/25 text-red-400 pulse-danger'
                : 'bg-amber-500/[0.07] border-amber-500/25 text-amber-400'
                }`}
            >
              <span className="text-base shrink-0">{alert.severity === 'DANGER' ? '🚨' : '⚠️'}</span>
              {alert.message}
            </div>
          ))}
        </motion.div>
      )}

      {/* ══════════════════════════════════════════
          ROW 1 — KPI CARDS (4 equal columns)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Health Score */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full" style={{ borderColor: `${healthColor}20` }}>
            <div
              className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${healthColor}, transparent 70%)` }}
            />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${healthColor}18` }}
                >
                  🏥
                </div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">Sức khỏe</span>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-[32px] font-extrabold leading-none tracking-tight" style={{ color: healthColor }}>
                  {healthScore}
                </span>
                <span className="text-[var(--color-text-muted)] text-sm mb-0.5">/100</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mb-3">{healthLabel}</p>
              <div className="mt-auto h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${healthColor}aa, ${healthColor})` }}
                />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Total Debt */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full relative overflow-hidden" style={{ borderColor: 'rgba(239,68,68,0.15)' }}>
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, #ef4444, transparent 70%)' }} />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center text-base shrink-0">💳</div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">Tổng nợ</span>
              </div>
              <div className="text-[28px] font-extrabold text-red-500 leading-tight tracking-tight mb-1">
                {formatVND(debtSummary.totalBalance || 0)}
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-auto">
                {debts.length} khoản nợ
                <span className="mx-1.5 text-[var(--color-text-muted)]">·</span>
                Tối thiểu {formatVND(debtSummary.totalMinPayment || 0)}/tháng
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Average EAR */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full relative overflow-hidden" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top right, #8b5cf6, transparent 70%)' }} />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center text-base shrink-0">📊</div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">EAR trung bình</span>
              </div>
              <div className="text-[32px] font-extrabold text-purple-500 leading-none tracking-tight mb-1">
                {formatPercent(debtSummary.averageEAR || 0)}
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-auto">Chi phí thực tế mỗi năm</p>
            </div>
          </Card>
        </motion.div>

        {/* Market Sentiment */}
        <motion.div variants={fade}>
          <Card className="p-5! h-full relative overflow-hidden" style={{ borderColor: `${sentimentColor}20` }}>
            <div className="absolute inset-0 rounded-2xl opacity-[0.04] pointer-events-none"
              style={{ background: `radial-gradient(ellipse at top right, ${sentimentColor}, transparent 70%)` }} />
            <div className="relative flex flex-col h-full">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${sentimentColor}18` }}>🌡️</div>
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-widest">Tâm lý thị trường</span>
              </div>
              <div className="flex items-end gap-1.5 mb-1">
                <span className="text-[32px] font-extrabold leading-none tracking-tight" style={{ color: sentimentColor }}>
                  {sentiment.value || 50}
                </span>
                <span className="text-[var(--color-text-muted)] text-sm mb-0.5">/100</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-auto">{sentiment.labelVi || 'Trung lập'}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════
          ROW 2 — CHART (left 55%) + DUE (right 45%)
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-11 gap-4">
        {/* APR vs EAR Chart — 6 of 11 cols */}
        <motion.div variants={fade} className="lg:col-span-6">
          <Card className="p-5 h-full flex flex-col">
            <CardHeader
              icon="📊"
              title="APR vs EAR — Chi phí ẩn"
              subtitle="So sánh lãi suất quảng cáo (APR) và chi phí thực tế (EAR)"
            />
            <div className="flex-1 min-h-[200px]">
              {earChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earChartData} barGap={3} barCategoryGap="28%">
                    <XAxis
                      dataKey="name"
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                      axisLine={{ stroke: 'var(--color-border)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `${v}%`}
                      width={36}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v, name) => [`${v.toFixed(1)}%`, name]}
                      cursor={{ fill: 'rgba(255,255,255,0.025)' }}
                    />
                    <Bar dataKey="APR" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={18} name="APR (quảng cáo)" />
                    <Bar dataKey="EAR" fill="#ef4444" radius={[5, 5, 0, 0]} barSize={18} name="EAR (thực tế)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-3xl">📭</span>
                  <p className="text-sm text-slate-600">Chưa có dữ liệu nợ</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-5 pt-3 mt-1 border-t border-[var(--color-border)]">
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                <div className="w-3 h-3 rounded-sm bg-blue-500" />APR (quảng cáo)
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
                <div className="w-3 h-3 rounded-sm bg-red-500" />EAR (thực tế)
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Đáo hạn sắp tới — 5 of 11 cols */}
        <motion.div variants={fade} className="lg:col-span-5">
          <Card className="p-5 h-full flex flex-col">
            <CardHeader
              icon="📅"
              title="Đáo hạn sắp tới"
              action={
                <Link to="/debts" className="text-blue-400 text-[12px] hover:text-blue-300 transition-colors font-medium shrink-0">
                  Xem tất cả →
                </Link>
              }
            />
            <div className="flex-1 flex flex-col">
              {debtSummary.dueThisWeek?.length > 0 ? (
                <div className="space-y-1.5">
                  {debtSummary.dueThisWeek.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between py-3 px-3.5 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer"
                      style={{ background: 'var(--color-bg-secondary)' }}
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--color-text-primary)]">{d.name}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">Ngày {d.dueDay}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-red-500">{formatVND(d.minPayment)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <span className="text-5xl mb-3 block">🎉</span>
                  <p className="text-[13px] font-semibold text-slate-400">Không có nợ đáo hạn</p>
                  <p className="text-[11px] text-slate-600 mt-1">Tuyệt vời! Hãy giữ vững phong độ 💪</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════
          ROW 3 — TOP DEBTS | PIE CHART | DTI
      ══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Top Debts */}
        <motion.div variants={fade}>
          <Card className="p-5 h-full flex flex-col">
            <CardHeader icon="🔥" title="Top nợ lớn nhất" />
            {debts.length > 0 ? (
              <div className="space-y-1 flex-1">
                {debts
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 5)
                  .map((d, i) => (
                    <Link
                      key={d.id}
                      to={`/debts/${d.id}`}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors group hover:bg-[var(--color-bg-secondary)]"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]"
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--color-text-primary)] truncate group-hover:text-blue-500 transition-colors">
                          {d.name}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate">{d.platform}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-red-500">{formatVND(d.balance)}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">EAR {formatPercent(d.ear)}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-slate-600">Chưa có khoản nợ nào</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div variants={fade}>
          <Card className="p-5 h-full flex flex-col">
            <CardHeader icon="🧩" title="Phân bổ nền tảng" />
            {platformPieData.length > 0 ? (
              <div className="flex-1 flex flex-col">
                {/* Pie — fixed height so it doesn't overflow */}
                <div className="h-[160px] w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={4}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {platformPieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="space-y-2 mt-3">
                  {platformPieData.map((p, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-[12px] text-[var(--color-text-secondary)] truncate max-w-[120px]">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">{p.value} khoản</span>
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.round((p.value / platformPieData.reduce((s, x) => s + x.value, 0)) * 60)}px`,
                            background: PIE_COLORS[i % PIE_COLORS.length] + '60',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-[13px] text-slate-600">Chưa có dữ liệu</p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Financial Metrics — DTI */}
        <motion.div variants={fade} className="md:col-span-2 xl:col-span-1">
          <Card className="p-5 h-full flex flex-col">
            <CardHeader icon="📐" title="Chỉ số tài chính" />
            <div className="flex-1 flex flex-col gap-4">
              {/* DTI Donut */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke={dtiColor}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${dtiDash * circumference} ${circumference}`}
                      initial={{ strokeDasharray: `0 ${circumference}` }}
                      animate={{ strokeDasharray: `${dtiDash * circumference} ${circumference}` }}
                      transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[17px] font-bold leading-none" style={{ color: dtiColor }}>
                      {formatPercent(dtiRatio)}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[var(--color-text-secondary)]">Tỉ lệ Nợ / Thu nhập</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-1 leading-snug">{dtiLabel}</p>
                  <div
                    className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: `${dtiColor}18`, color: dtiColor }}
                  >
                    DTI Score
                  </div>
                </div>
              </div>

              <div className="h-px bg-[var(--color-border)] opacity-50" />

              {/* Cashflow breakdown */}
              <div className="space-y-2.5">
                {[
                  { label: 'Thu nhập / tháng', value: user?.monthlyIncome || 0, color: '#10b981' },
                  { label: 'Trả nợ / tháng', value: debtSummary.totalMinPayment || 0, color: '#ef4444' },
                  { label: 'Còn lại / tháng', value: (user?.monthlyIncome || 0) - (debtSummary.totalMinPayment || 0), color: '#3b82f6' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--color-text-secondary)]">{label}</span>
                    <span className="text-[13px] font-bold" style={{ color }}>
                      {formatVND(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}