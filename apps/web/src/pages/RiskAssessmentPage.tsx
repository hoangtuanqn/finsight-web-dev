import { AnimatePresence, motion } from 'framer-motion';
import { Flame, RefreshCw, Shield, Target, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { investmentAPI, userAPI } from '../api/index';
import { useAuth } from '../context/AuthContext';
import { drawSessionQuestions, type RiskQuestion } from '../data/riskQuestions.data';

const RISK_META = {
  LOW: {
    color: '#10b981',
    gradient: 'from-emerald-500 to-teal-400',
    icon: Shield,
    label: 'Thận trọng',
  },
  MEDIUM: {
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-400',
    icon: Target,
    label: 'Cân bằng',
  },
  HIGH: {
    color: '#ef4444',
    gradient: 'from-red-500 to-rose-400',
    icon: Flame,
    label: 'Mạo hiểm',
  },
};

export default function RiskAssessmentPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth() as any;

  // Draw 7 questions once per session (re-memoized only on remount)
  const questions = useMemo<RiskQuestion[]>(() => drawSessionQuestions(), []);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async (option: { text: string; score: number }) => {
    const q = questions[current];
    const newAnswers = [
      ...answers,
      {
        id: q.id,
        categoryKey: q.categoryKey,
        weight: q.weight,
        score: option.score,
      },
    ];
    setAnswers(newAnswers);

    if (current < questions.length - 1) {
      setCurrent(current + 1);
    } else {
      setLoading(true);
      try {
        const res = await investmentAPI.submitRiskAssessment({ answers: newAnswers });
        setResult(res.data.data);
        const profileRes = await userAPI.getProfile();
        setUser((prev: any) => ({ ...prev, ...profileRes.data.data.user }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleReset = () => {
    setCurrent(0);
    setAnswers([]);
    setResult(null);
  };

  // ── Result Screen ──
  if (result) {
    const meta = RISK_META[result.riskLevel as keyof typeof RISK_META] || RISK_META.MEDIUM;
    const RiskIcon = meta.icon;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto py-12"
      >
        <div
          className="relative rounded-3xl p-8 border overflow-hidden text-center"
          style={{
            background: 'var(--color-bg-card)',
            borderColor: `${meta.color}25`,
            boxShadow: `0 4px 40px ${meta.color}10`,
          }}
        >
          <div
            className="absolute top-0 left-8 right-8 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${meta.color}60,transparent)` }}
          />
          <div
            className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: `${meta.color}15`, boxShadow: `0 0 30px ${meta.color}30` }}
          >
            <RiskIcon size={40} style={{ color: meta.color }} />
          </div>
          <h2 className="text-xl font-black text-[var(--color-text-primary)] mb-1">Kết quả đánh giá</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-6">Dựa trên {questions.length} câu trả lời của bạn</p>

          <div
            className="p-5 rounded-2xl mb-6"
            style={{ background: `${meta.color}08`, border: `1px solid ${meta.color}20` }}
          >
            <p className={`text-4xl font-black bg-gradient-to-r ${meta.gradient} bg-clip-text text-transparent mb-2`}>
              {meta.label}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Điểm rủi ro: <span className="font-black text-[var(--color-text-primary)]">{result.riskScore}/100</span>
            </p>
          </div>

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">{result.riskDescription}</p>

          {result.consistencyWarning && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs leading-relaxed">
              ⚠️ {result.consistencyWarning}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/investment')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              <TrendingUp size={15} /> Xem phân bổ đầu tư
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-black text-sm hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all cursor-pointer"
            >
              <RefreshCw size={15} /> Làm lại
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const q = questions[current];
  const progress = (current / questions.length) * 100;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto py-4 pb-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/8 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <Target size={11} /> Đánh giá rủi ro
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
          Đánh giá mức độ rủi ro
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Trả lời {questions.length} câu hỏi để xác định profile đầu tư phù hợp
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-[12px] font-bold mb-2">
          <span className="text-[var(--color-text-muted)]">
            Câu {current + 1}/{questions.length}
          </span>
          <span className="text-blue-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -32 }}
          transition={{ duration: 0.22 }}
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}
        >
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

          {q.category && (
            <span className="inline-block mb-4 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-[10px] font-black text-blue-400 uppercase tracking-widest">
              {q.category}
            </span>
          )}
          <h2 className="text-[16px] font-black text-[var(--color-text-primary)] mb-6 leading-relaxed">{q.question}</h2>

          <div className="space-y-2.5">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(opt)}
                disabled={loading}
                className="w-full text-left p-4 rounded-2xl border transition-all cursor-pointer hover:-translate-y-0.5"
                style={{ background: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
                  e.currentTarget.style.background = 'rgba(59,130,246,0.06)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                  e.currentTarget.style.background = 'var(--color-bg-secondary)';
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center text-[12px] font-black text-[var(--color-text-muted)] shrink-0">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-[13px] text-[var(--color-text-secondary)] font-medium">{opt.text}</span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
