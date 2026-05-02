import { motion } from 'framer-motion';
import { Scale, ShieldCheck, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

export default function PortfolioHealthMetrics({ allocation, projection, profile }) {
  const capital = profile?.capital || 0;
  const inflationRate = profile?.inflationRate !== undefined ? profile.inflationRate / 100 : 0.035;

  // Diversification (HHI)
  const vals = Object.values(allocation);
  const hhi = vals.reduce((s, p) => s + (p / 100) ** 2, 0);
  const minHHI = 1 / vals.length;
  const diversificationScore = Math.round(Math.max(0, Math.min(100, ((1 - hhi) / (1 - minHHI)) * 100)));

  // Return score (CAGR 10y)
  const fv10 = projection?.['10y'] || capital;
  const cagr = capital > 0 ? Math.pow(fv10 / capital, 1 / 10) - 1 : 0;
  const returnScore = Math.min(100, Math.round((cagr / 0.15) * 100));

  // Risk alignment
  const aggressiveWeight = ((allocation.stocks || 0) + (allocation.crypto || 0)) / 100;
  const riskTarget = { LOW: 0.15, MEDIUM: 0.4, HIGH: 0.65 }[profile?.riskLevel] ?? 0.4;
  const riskAlignmentScore = Math.max(0, Math.round(100 - Math.abs(aggressiveWeight - riskTarget) * 200));

  const healthScore = Math.round(diversificationScore * 0.35 + returnScore * 0.4 + riskAlignmentScore * 0.25);
  const displayed = useCountUp(healthScore);

  const scoreColor =
    healthScore >= 80 ? '#10b981' : healthScore >= 65 ? '#3b82f6' : healthScore >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel =
    healthScore >= 80 ? 'Xuất sắc' : healthScore >= 65 ? 'Tốt' : healthScore >= 50 ? 'Trung bình' : 'Cần cải thiện';
  const scoreGlow =
    healthScore >= 80
      ? 'rgba(16, 185, 129, 0.2)'
      : healthScore >= 65
        ? 'rgba(59, 130, 246, 0.2)'
        : healthScore >= 50
          ? 'rgba(245, 158, 11, 0.2)'
          : 'rgba(239, 68, 68, 0.2)';

  const circumference = 2 * Math.PI * 40;

  const SubMetric = ({ icon: Icon, label, score, desc, color, glow }) => (
    <div
      className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl relative group hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between"
      style={{ hover: { boxShadow: `0 8px 32px ${glow}` } }}
    >
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="p-1.5 rounded-lg bg-white/5 group-hover:scale-110 transition-transform shrink-0">
            <Icon size={14} className="text-slate-400 group-hover:text-white transition-colors" />
          </div>
          <span className="text-xl font-bold text-white shrink-0">{score}</span>
        </div>
        <span className="text-xs font-semibold text-slate-300">{label}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.5, type: 'spring' }}
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        />
      </div>
      <p className="text-[11px] font-medium text-slate-500 leading-tight">{desc}</p>
    </div>
  );

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start">
        {/* Main Score Ring */}
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Ambient Glow behind ring */}
          <div
            className="absolute inset-0 rounded-full blur-3xl transition-colors duration-1000"
            style={{ background: scoreGlow }}
          />

          <svg className="w-48 h-48 -rotate-90 relative z-10" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Progress ring */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={scoreColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (healthScore / 100) * circumference }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 8px ${scoreColor})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
            <span className="text-5xl font-bold tracking-tight" style={{ color: scoreColor }}>
              {displayed}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Sức khỏe</span>
          </div>
        </div>

        {/* Info & Sub-metrics */}
        <div className="flex-1 w-full z-10">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  {scoreLabel}
                  {healthScore >= 80 && <ShieldCheck size={20} className="text-emerald-500" />}
                </h2>
                <p className="text-sm text-slate-400">Đánh giá danh mục đầu tư</p>
              </div>
            </div>

            <div className="flex items-center gap-8 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Kỳ vọng (CAGR 10 Năm)</p>
                <p className="text-xl font-bold text-white">{(cagr * 100).toFixed(1)}%</p>
              </div>
              <div className="w-[1px] h-10 bg-white/10" />
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">Thực tế (Sau lạm phát)</p>
                <p className="text-xl font-bold text-emerald-400">{((cagr - inflationRate) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SubMetric
              icon={Target}
              label="Đa dạng hóa"
              score={diversificationScore}
              color="#3b82f6"
              glow="rgba(59, 130, 246, 0.15)"
              desc={diversificationScore >= 70 ? 'Phân bổ tài sản tối ưu' : 'Cần đa dạng hóa thêm'}
            />
            <SubMetric
              icon={TrendingUp}
              label="Sinh lời"
              score={returnScore}
              color="#10b981"
              glow="rgba(16, 185, 129, 0.15)"
              desc={`Đạt ${returnScore.toFixed(0)}% mục tiêu lợi nhuận`}
            />
            <SubMetric
              icon={Scale}
              label="Rủi ro"
              score={riskAlignmentScore}
              color="#f59e0b"
              glow="rgba(245, 158, 11, 0.15)"
              desc={`Phù hợp với mức độ rủi ro ${profile?.riskLevel || 'Trung bình'}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
