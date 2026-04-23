import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { debtAPI, userAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { formatVND, formatPercent, calcDebtToIncomeRatio } from '../../utils/calculations';
import { ClipboardList, DollarSign, TrendingDown, Bot, Lightbulb, Target, Zap, TrendingUp, Save, Check } from 'lucide-react';

const TOOLTIP_STYLE = {
  background:   '#0f172a',
  border:       '1px solid rgba(255,255,255,0.08)',
  borderRadius: '12px',
  fontSize:     '12px',
  boxShadow:    '0 8px 32px rgba(0,0,0,0.5)',
  padding:      '10px 14px',
};

export default function RepaymentPlanPage() {
  const { user, setUser }     = useAuth();
  const defaultBudget         = user?.extraBudget || 0;

  const [data,         setData]        = useState(null);
  const [debtSummary,  setDebtSummary] = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [extraBudget,  setExtraBudget] = useState(defaultBudget);
  const [inputRaw,     setInputRaw]    = useState(String(defaultBudget));
  const [saving,       setSaving]      = useState(false);
  const [saved,        setSaved]       = useState(false);
  const SLIDER_MAX = 100000000;

  const load = (budget) => {
    setLoading(true);
    Promise.all([debtAPI.getRepaymentPlan({ extraBudget: budget }), debtAPI.getAll()])
      .then(([planRes, allRes]) => { setData(planRes.data.data); setDebtSummary(allRes.data.data?.summary || null); })
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  };

  useEffect(() => { load(extraBudget); }, []);

  const handleBudgetChange = (val) => { const n = Math.max(0, val); setExtraBudget(n); setInputRaw(String(n)); load(n); };
  const handleInputChange  = (e)   => { setInputRaw(e.target.value); };
  const handleInputBlur    = ()    => { const n = Math.max(0, parseInt(inputRaw.replace(/\D/g, ''), 10) || 0); handleBudgetChange(n); };
  const handleInputKeyDown = (e)   => { if (e.key === 'Enter') e.target.blur(); };

  const handleSaveBudget = async () => {
    setSaving(true);
    try { await userAPI.updateProfile({ extraBudget }); setSaved(true); setTimeout(() => setSaved(false), 2500); }
    catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading && !data) return <PageSkeleton />;

  const { avalanche, snowball, comparison, recommendation } = data || {};
  const monthlyIncome = debtSummary?.monthlyIncome ?? 0;

  const timelineData = [];
  if (avalanche?.schedule && snowball?.schedule) {
    const maxMonths = Math.max(avalanche.months, snowball.months, 1);
    for (let m = 0; m <= Math.min(maxMonths, 24); m++) {
      const av = avalanche.schedule[m], sn = snowball.schedule[m];
      const avBalance = av ? av.payments.reduce((s, p) => s + p.balance, 0) : 0;
      const snBalance = sn ? sn.payments.reduce((s, p) => s + p.balance, 0) : 0;
      const avTotalMin = av ? av.payments.reduce((s, p) => s + (p.minPayment ?? 0), 0) : 0;
      const snTotalMin = sn ? sn.payments.reduce((s, p) => s + (p.minPayment ?? 0), 0) : 0;
      const avDti = monthlyIncome > 0 ? parseFloat(((avTotalMin / monthlyIncome) * 100).toFixed(1)) : null;
      const snDti = monthlyIncome > 0 ? parseFloat(((snTotalMin / monthlyIncome) * 100).toFixed(1)) : null;
      timelineData.push({ month: `T${m + 1}`, avalanche: Math.round(avBalance), snowball: Math.round(snBalance), ...(avDti !== null && { avDti }), ...(snDti !== null && { snDti }) });
    }
  }

  const avSafeMonth = timelineData.findIndex(d => d.avDti !== undefined && d.avDti <= 20);
  const snSafeMonth = timelineData.findIndex(d => d.snDti !== undefined && d.snDti <= 20);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      {/* ── Header ── */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <ClipboardList size={11} /> Kế hoạch trả nợ
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Kế hoạch trả nợ</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">So sánh Avalanche vs Snowball để chọn chiến lược tối ưu</p>
      </div>

      {/* ── Budget Panel ── */}
      <div className="relative rounded-3xl p-6 border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}>
        <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 bg-blue-500" />
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
            <DollarSign size={16} />
          </div>
          <span className="text-[13px] font-black text-[var(--color-text-primary)]">Ngân sách trả thêm mỗi tháng</span>
        </div>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 relative">
            <input
              type="text" inputMode="numeric" placeholder="Nhập số tiền..."
              value={formatVND(inputRaw)}
              onChange={handleInputChange} onBlur={handleInputBlur} onKeyDown={handleInputKeyDown}
              className="w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-blue-400 font-black text-[14px] outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <button
            onClick={handleSaveBudget} disabled={saving}
            className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-black transition-all border cursor-pointer ${
              saved ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' : 'bg-blue-500/15 border-blue-500/30 text-blue-400 hover:bg-blue-500/25'
            }`}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            {saved ? 'Đã lưu' : 'Lưu'}
          </button>
        </div>

        <input
          type="range" min="0" max={SLIDER_MAX} step="500000"
          value={Math.min(extraBudget, SLIDER_MAX)}
          onChange={e => handleBudgetChange(+e.target.value)}
          className="w-full accent-blue-500"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] mt-1.5">
          <span>0đ</span><span>25tr</span><span>50tr</span><span>75tr</span><span>100tr</span>
        </div>
        {extraBudget > SLIDER_MAX && (
          <p className="text-[11px] text-amber-400 mt-2 font-medium">Giá trị vượt thanh kéo — tính toán vẫn dùng đúng số bạn nhập.</p>
        )}
      </div>

      {!data || !avalanche ? (
        <div className="rounded-3xl border border-[var(--color-border)] p-16 text-center" style={{ background: 'var(--color-bg-card)' }}>
          <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
            <ClipboardList size={28} className="text-slate-500" />
          </div>
          <p className="text-[var(--color-text-muted)] font-medium">Không có khoản nợ nào để tính</p>
        </div>
      ) : (
        <>
          {/* ── Strategy Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Avalanche */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl p-6 border overflow-hidden"
              style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.2)', boxShadow: '0 4px 20px rgba(59,130,246,0.06)' }}
            >
              <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                  <Zap size={18} />
                </div>
                <h3 className="font-black text-blue-400 text-[16px]">Avalanche</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-black">Tiết kiệm lãi</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-muted)] mb-5">Ưu tiên trả nợ lãi suất CAO nhất trước</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Thời gian</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)]">{avalanche.months} <span className="text-sm text-[var(--color-text-muted)] font-medium">tháng</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Tổng lãi</p>
                  <p className="text-xl font-black text-red-400">{formatVND(avalanche.totalInterest)}</p>
                </div>
              </div>
            </motion.div>

            {/* Snowball */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="relative rounded-3xl p-6 border overflow-hidden"
              style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(16,185,129,0.2)', boxShadow: '0 4px 20px rgba(16,185,129,0.06)' }}
            >
              <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <Target size={18} />
                </div>
                <h3 className="font-black text-emerald-400 text-[16px]">Snowball</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-black">Động lực tâm lý</span>
              </div>
              <p className="text-[12px] text-[var(--color-text-muted)] mb-5">Ưu tiên trả nợ DƯ NỢ nhỏ nhất trước</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Thời gian</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)]">{snowball.months} <span className="text-sm text-[var(--color-text-muted)] font-medium">tháng</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Tổng lãi</p>
                  <p className="text-xl font-black text-red-400">{formatVND(snowball.totalInterest)}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── Savings Banner ── */}
          {comparison?.savedInterest > 0 && (
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

          {/* ── AI Recommendation ── */}
          {recommendation && (
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-blue-500 to-cyan-400" />
              <Bot size={16} className="text-blue-400 shrink-0 mt-0.5 ml-1" />
              <p className="text-[13px] text-blue-300 leading-relaxed">
                <span className="font-black text-blue-200">AI khuyến nghị: </span>{recommendation}
              </p>
            </div>
          )}

          {/* ── Balance Timeline ── */}
          {timelineData.length > 0 && (
            <div className="relative rounded-3xl p-6 border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
                <TrendingDown size={16} className="text-blue-400" /> Tiến trình giảm dư nợ
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <defs>
                      <linearGradient id="avLine" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#3b82f6" /><stop offset="1" stopColor="#06b6d4" /></linearGradient>
                      <linearGradient id="snLine" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#10b981" /><stop offset="1" stopColor="#34d399" /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(0)}tr`} width={36} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatVND(v), '']} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} />
                    <Line type="monotone" dataKey="avalanche" name="Avalanche" stroke="url(#avLine)" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="snowball"  name="Snowball"  stroke="url(#snLine)" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── DTI Projection ── */}
          {timelineData.length > 0 && monthlyIncome > 0 && timelineData[0]?.avDti !== undefined && (
            <div className="relative rounded-3xl p-6 border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-1 flex items-center gap-2">
                <TrendingUp size={16} className="text-cyan-400" /> DTI sẽ giảm như thế nào?
              </h3>
              <p className="text-[12px] text-[var(--color-text-muted)] mb-5">Dự phóng tỉ lệ nợ/thu nhập theo từng tháng</p>

              {(avSafeMonth !== -1 || snSafeMonth !== -1) && (
                <div className="flex gap-3 mb-5">
                  {avSafeMonth !== -1 && (
                    <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-blue-500/15 bg-blue-500/6">
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-black mb-1">Avalanche</p>
                      <p className="text-[16px] font-black text-blue-400">Tháng {avSafeMonth + 1}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">DTI về &lt;20%</p>
                    </div>
                  )}
                  {snSafeMonth !== -1 && (
                    <div className="flex-1 rounded-2xl px-4 py-3 text-center border border-emerald-500/15 bg-emerald-500/6">
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-black mb-1">Snowball</p>
                      <p className="text-[16px] font-black text-emerald-400">Tháng {snSafeMonth + 1}</p>
                      <p className="text-[10px] text-[var(--color-text-muted)]">DTI về &lt;20%</p>
                    </div>
                  )}
                </div>
              )}

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 'auto']} width={36} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, name) => [`${v}%`, name === 'avDti' ? 'Avalanche DTI' : 'Snowball DTI']} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} formatter={(v) => v === 'avDti' ? 'Avalanche DTI' : 'Snowball DTI'} />
                    <Line type="monotone" dataKey={() => 20} name="safe-zone" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" dot={false} legendType="none" />
                    <Line type="monotone" dataKey="avDti" name="avDti" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="snDti" name="snDti" stroke="#10b981" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-2 text-center">Đường đứt nét xanh = ngưỡng an toàn 20%</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
