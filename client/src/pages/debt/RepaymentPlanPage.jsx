import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { debtAPI, userAPI, debtGoalAPI } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { formatVND } from '../../utils/calculations';
import {
  ClipboardList, DollarSign, TrendingDown, Bot, Lightbulb, Target, Zap, TrendingUp,
  Save, Check, ChevronRight, Trophy, AlertTriangle, HelpCircle, X,
  CheckCircle2, XCircle, ArrowRight, Brain,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Strategy Explanation Modal
// ─────────────────────────────────────────────────────────────
const STRATEGY_CONTENT = {
  AVALANCHE: {
    name: 'Avalanche',
    tagline: 'Tiết kiệm lãi tối đa',
    color: 'blue',
    borderColor: 'rgba(59,130,246,0.25)',
    glowColor: 'via-blue-500/50',
    bgGlow: 'bg-blue-500',
    Icon: Zap,
    emoji: '⚡',
    description: 'Phương pháp Avalanche tập trung trả khoản nợ có lãi suất cao nhất trước, trong khi vẫn trả tối thiểu cho các khoản còn lại. Khi khoản lãi cao nhất được trả xong, chuyển toàn bộ ngân sách đó sang khoản có lãi suất cao thứ hai — như một trận tuyết lở tích lũy momentum.',
    howItWorks: [
      'Liệt kê tất cả các khoản nợ, sắp xếp theo lãi suất từ cao xuống thấp',
      'Trả đúng tối thiểu cho tất cả khoản nợ mỗi tháng',
      'Dùng toàn bộ tiền dư để trả thêm vào khoản lãi suất CAO NHẤT',
      'Khi khoản đó trả xong → chuyển toàn bộ sang khoản lãi suất cao tiếp theo',
      'Lặp lại cho đến khi sạch nợ',
    ],
    pros: [
      'Tiết kiệm nhiều tiền lãi nhất về tổng thể',
      'Trả hết nợ nhanh hơn (về mặt toán học)',
      'Phù hợp người có tư duy logic, thích tối ưu số liệu',
    ],
    cons: [
      'Có thể mất nhiều tháng trước khi trả xong khoản đầu tiên (nếu dư nợ lớn)',
      'Ít cảm giác "chiến thắng" trong ngắn hạn',
      'Đòi hỏi kỷ luật cao, dễ nản nếu nợ lớn',
    ],
    bestFor: 'Người muốn tối ưu tài chính, tiết kiệm tối đa tiền lãi và có đủ kỷ luật để kiên trì.',
    worstFor: 'Người cần động lực liên tục, dễ bỏ cuộc khi không thấy kết quả sớm.',
  },
  SNOWBALL: {
    name: 'Snowball',
    tagline: 'Động lực tâm lý bền vững',
    color: 'emerald',
    borderColor: 'rgba(16,185,129,0.25)',
    glowColor: 'via-emerald-500/50',
    bgGlow: 'bg-emerald-500',
    Icon: Target,
    emoji: '⛄',
    description: 'Phương pháp Snowball tập trung trả khoản nợ có dư nợ NHỎ NHẤT trước, bất kể lãi suất. Mỗi lần trả xong một khoản, bạn có cảm giác chiến thắng và tăng động lực. Như một quả cầu tuyết lăn xuống dốc — mỗi "win" nhỏ tạo đà cho chiến thắng lớn hơn.',
    howItWorks: [
      'Liệt kê tất cả khoản nợ, sắp xếp theo dư nợ từ nhỏ đến lớn',
      'Trả đúng tối thiểu cho tất cả khoản nợ mỗi tháng',
      'Dùng toàn bộ tiền dư để trả thêm vào khoản dư nợ NHỎ NHẤT',
      'Khi trả xong khoản nhỏ nhất → chuyển toàn bộ sang khoản nhỏ thứ hai',
      'Lặp lại — mỗi lần xóa được 1 khoản nợ là 1 chiến thắng!',
    ],
    pros: [
      'Tạo cảm giác chiến thắng sớm và thường xuyên',
      'Dễ duy trì động lực dài hạn',
      'Số lượng khoản nợ giảm nhanh → giảm áp lực tâm lý',
    ],
    cons: [
      'Tốn nhiều tiền lãi hơn Avalanche về tổng thể',
      'Thời gian trả hết nợ thường lâu hơn',
      'Không tối ưu về mặt tài chính thuần túy',
    ],
    bestFor: 'Người cần động lực thường xuyên, đã từng thất bại với kế hoạch trả nợ, hoặc đang có nhiều khoản nợ nhỏ cần dọn sạch.',
    worstFor: 'Người có 1-2 khoản nợ lớn với lãi suất rất cao — Avalanche sẽ tiết kiệm hơn đáng kể.',
  },
};

function StrategyModal({ type, onClose }) {
  const content = STRATEGY_CONTENT[type];
  if (!content) return null;
  const { name, tagline, color, borderColor, glowColor, bgGlow, Icon, emoji,
    description, howItWorks, pros, cons, bestFor, worstFor } = content;

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border"
        style={{ background: 'var(--color-bg-secondary)', borderColor }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${glowColor} to-transparent`} />
        <div className={`absolute -top-12 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 ${bgGlow}`} />

        {/* Mobile handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="p-6 pt-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-${color}-500/15 text-${color}-400`}>
                <Icon size={22} />
              </div>
              <div>
                <h2 className={`text-[20px] font-black text-${color}-400`}>{emoji} {name}</h2>
                <p className="text-[12px] text-[var(--color-text-muted)]">{tagline}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--color-text-muted)] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Description */}
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-5">
            {description}
          </p>

          {/* How it works */}
          <div className={`rounded-2xl p-4 mb-4 bg-${color}-500/6 border border-${color}-500/15`}>
            <h3 className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Brain size={11} /> Cách hoạt động
            </h3>
            <ol className="space-y-2">
              {howItWorks.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className={`shrink-0 w-5 h-5 rounded-full bg-${color}-500/20 text-${color}-400 text-[10px] font-black flex items-center justify-center mt-0.5`}>
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Pros / Cons */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl p-3.5 bg-emerald-500/6 border border-emerald-500/15">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <CheckCircle2 size={10} /> Ưu điểm
              </h3>
              <ul className="space-y-1.5">
                {pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowRight size={10} className="text-emerald-500 shrink-0 mt-1" />
                    <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-3.5 bg-red-500/6 border border-red-500/15">
              <h3 className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                <XCircle size={10} /> Nhược điểm
              </h3>
              <ul className="space-y-1.5">
                {cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <ArrowRight size={10} className="text-red-500 shrink-0 mt-1" />
                    <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Best for / Worst for */}
          <div className="space-y-2 mb-5">
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/6">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-wide">Phù hợp nhất: </span>
                <span className="text-[12px] text-[var(--color-text-secondary)]">{bestFor}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/6">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wide">Cân nhắc khi: </span>
                <span className="text-[12px] text-[var(--color-text-secondary)]">{worstFor}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-full py-3 rounded-2xl font-black text-[13px] transition-all cursor-pointer bg-${color}-500/15 border border-${color}-500/25 text-${color}-400 hover:bg-${color}-500/25`}
          >
            Đã hiểu, đóng lại
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


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
  const inputRef              = useRef(null);
  const displayBudgetInput    = (value) => value ? Number(value).toLocaleString('vi-VN') : '';
  const moveCaretToEnd        = () => {
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
  };
  const formatBudgetInput     = (value) => {
    if (!value) return '';
    return `${Number(value).toLocaleString('vi-VN')} đ`;
  };

  const [data,         setData]        = useState(null);
  const [debtSummary,  setDebtSummary] = useState(null);
  const [allDebts,     setAllDebts]    = useState([]);
  const [goalData,     setGoalData]    = useState(null);
  const [loading,      setLoading]     = useState(true);
  const [modal,        setModal]       = useState(null); // 'AVALANCHE' | 'SNOWBALL' | null
  const [extraBudget,  setExtraBudget] = useState(defaultBudget);
  const [inputRaw,     setInputRaw]    = useState(String(defaultBudget));
  const [saving,       setSaving]      = useState(false);
  const [saved,        setSaved]       = useState(false);
  const SLIDER_MAX = 100000000;

  const load = (budget) => {
    setLoading(true);
    Promise.all([debtAPI.getRepaymentPlan({ extraBudget: budget }), debtAPI.getAll(), debtGoalAPI.get()])
      .then(([planRes, allRes, goalRes]) => {
        setData(planRes.data.data);
        const allData = allRes.data.data;
        setDebtSummary(allData?.summary || null);
        setAllDebts(allData?.debts || []);
        setGoalData(goalRes.data.data || null);
      })
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  };

  useEffect(() => { load(extraBudget); }, []);

  const handleBudgetChange = (val) => { const n = Math.max(0, val); setExtraBudget(n); setInputRaw(String(n)); load(n); };
  const handleInputChange  = (e)   => { setInputRaw(e.target.value.replace(/\D/g, '')); moveCaretToEnd(); };
  const handleInputBlur    = ()    => { const n = Math.max(0, parseInt(inputRaw, 10) || 0); handleBudgetChange(n); };
  const handleInputFocus   = ()    => { moveCaretToEnd(); };
  const handleInputClick   = ()    => { moveCaretToEnd(); };
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

  // Goal banner helpers
  const goal      = goalData?.goal;
  const onTrack   = goalData?.onTrack;
  const progress  = goalData?.progress;
  const milestones = goalData?.milestones || [];
  const reachedCount = milestones.filter(m => m.reached).length;

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
    <>
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      {/* ── Header ── */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <ClipboardList size={11} /> Kế hoạch trả nợ
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Kế hoạch trả nợ</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">So sánh Avalanche vs Snowball để chọn chiến lược tối ưu</p>
      </div>

      {/* ── Goal Linkage Banner ── */}
      {goalData && (
        <Link to="/debts/goal">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl border cursor-pointer transition-all hover:border-violet-500/40 hover:bg-violet-500/8 relative overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(139,92,246,0.2)' }}
          >
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

            {/* Progress mini ring area */}
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0">
              {reachedCount === 4 ? <Trophy size={18} /> : <Target size={18} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-black text-[var(--color-text-primary)]">Mục tiêu trả nợ</span>
                {goal && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    onTrack?.status === 'BEHIND'
                      ? 'bg-red-500/15 text-red-300'
                      : onTrack?.status === 'AHEAD'
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-blue-500/15 text-blue-300'
                  }`}>
                    {onTrack?.status === 'BEHIND' ? 'Chậm tiến độ' : onTrack?.status === 'AHEAD' ? 'Vượt kế hoạch' : 'Đúng tiến độ'}
                  </span>
                )}
                {!goal && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-500/15 text-slate-400">Chưa đặt mục tiêu</span>
                )}
              </div>

              {/* Mini progress bar */}
              {progress && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, progress.percentPaid)}%`,
                        background: 'linear-gradient(90deg, #ef4444, #f97316, #22c55e)',
                      }}
                    />
                  </div>
                  <span className="text-[11px] font-black text-[var(--color-text-muted)] shrink-0">
                    {progress.percentPaid.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] shrink-0">
                    · {reachedCount}/4 milestone
                  </span>
                </div>
              )}

              {!goal && !progress && (
                <p className="text-[11px] text-[var(--color-text-muted)]">Đặt ngày mục tiêu để theo dõi tiến độ trả nợ</p>
              )}
            </div>

            <ChevronRight size={16} className="text-[var(--color-text-muted)] shrink-0" />
          </motion.div>
        </Link>
      )}

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
              ref={inputRef}
              value={displayBudgetInput(inputRaw)}
              onChange={handleInputChange} onBlur={handleInputBlur} onFocus={handleInputFocus} onClick={handleInputClick} onKeyDown={handleInputKeyDown}
              className="w-full px-4 pr-12 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-blue-400 font-black text-[14px] outline-none focus:border-blue-500/50 transition-colors"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 font-black text-[14px]">
              đ
            </span>
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
                <button
                  onClick={() => setModal('AVALANCHE')}
                  className="ml-auto w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 flex items-center justify-center text-blue-400/70 hover:text-blue-400 transition-all cursor-pointer border border-blue-500/15"
                  title="Tìm hiểu về Avalanche"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              <p className="text-[12px] text-[var(--color-text-muted)] mb-5">Ưu tiên trả nợ lãi suất CAO nhất trước</p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Thời gian</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)]">{avalanche.months} <span className="text-sm text-[var(--color-text-muted)] font-medium">tháng</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Tổng lãi</p>
                  <p className="text-xl font-black text-red-400">{formatVND(avalanche.totalInterest)}</p>
                </div>
              </div>
              {/* Divider + priority list */}
              {allDebts.filter(d => d.balance > 0).length > 0 && (
                <>
                  <div className="h-px bg-blue-500/10 mb-4" />
                  <p className="text-[10px] font-black text-blue-400/70 uppercase tracking-wider mb-3">
                    Thứ tự trả theo phương pháp này
                  </p>
                  <div className="space-y-2">
                    {[...allDebts.filter(d => d.balance > 0)]
                      .sort((a, b) => b.apr - a.apr)
                      .map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2.5">
                          <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                            i === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-[var(--color-text-muted)]'
                          }`}>{i + 1}</div>
                          <span className={`flex-1 text-[12px] font-bold truncate ${
                            i === 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                          }`}>{d.name}</span>
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${
                            i === 0 ? 'bg-blue-500/15 text-blue-300' : 'bg-white/5 text-[var(--color-text-muted)]'
                          }`}>{d.apr}% APR</span>
                          {i === 0 && <span className="shrink-0 text-[10px] font-black text-blue-400">← trước</span>}
                        </div>
                      ))}
                  </div>
                </>
              )}
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
                <button
                  onClick={() => setModal('SNOWBALL')}
                  className="ml-auto w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400/70 hover:text-emerald-400 transition-all cursor-pointer border border-emerald-500/15"
                  title="Tìm hiểu về Snowball"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
              <p className="text-[12px] text-[var(--color-text-muted)] mb-5">Ưu tiên trả nợ DƯ NỢ nhỏ nhất trước</p>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Thời gian</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)]">{snowball.months} <span className="text-sm text-[var(--color-text-muted)] font-medium">tháng</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Tổng lãi</p>
                  <p className="text-xl font-black text-red-400">{formatVND(snowball.totalInterest)}</p>
                </div>
              </div>
              {/* Divider + priority list */}
              {allDebts.filter(d => d.balance > 0).length > 0 && (
                <>
                  <div className="h-px bg-emerald-500/10 mb-4" />
                  <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-wider mb-3">
                    Thứ tự trả theo phương pháp này
                  </p>
                  <div className="space-y-2">
                    {[...allDebts.filter(d => d.balance > 0)]
                      .sort((a, b) => a.balance - b.balance)
                      .map((d, i) => (
                        <div key={d.id} className="flex items-center gap-2.5">
                          <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                            i === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-[var(--color-text-muted)]'
                          }`}>{i + 1}</div>
                          <span className={`flex-1 text-[12px] font-bold truncate ${
                            i === 0 ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'
                          }`}>{d.name}</span>
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${
                            i === 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-[var(--color-text-muted)]'
                          }`}>{formatVND(d.balance)}</span>
                          {i === 0 && <span className="shrink-0 text-[10px] font-black text-emerald-400">← trước</span>}
                        </div>
                      ))}
                  </div>
                </>
              )}
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

    {/* ── Strategy Modal ── */}
    <AnimatePresence>
      {modal && (
        <StrategyModal
          type={modal}
          onClose={() => setModal(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
