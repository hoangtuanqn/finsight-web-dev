import { Calendar, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RISK_META } from '../constants';

interface RiskBannerProps {
  user: any;
}

export function RiskBanner({ user }: RiskBannerProps) {
  const riskLevel = user?.investorProfile?.riskLevel || 'MEDIUM';
  const riskMeta = RISK_META[riskLevel as keyof typeof RISK_META];
  const RiskIcon = riskMeta.Icon;
  const riskScore = user?.investorProfile?.riskScore;
  const lastUpdated = user?.investorProfile?.lastUpdated
    ? new Date(user.investorProfile.lastUpdated).toLocaleDateString('vi-VN')
    : null;
  const hasCompletedQuiz = riskScore !== undefined && riskScore !== null;

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl border relative overflow-hidden group transition-all hover:shadow-lg hover:shadow-blue-500/5"
      style={{
        background: 'var(--color-bg-card)',
        borderColor: hasCompletedQuiz ? `${riskMeta.color}25` : 'rgba(245,158,11,0.25)',
      }}
    >
      <div
        className="absolute top-0 left-5 right-5 h-px opacity-50 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg,transparent,${riskMeta.color}80,transparent)`,
        }}
      />
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
          style={{ background: `${riskMeta.color}15` }}
        >
          <RiskIcon size={22} style={{ color: riskMeta.color }} />
        </div>
        <div>
          <p className="text-[14px] font-black text-[var(--color-text-primary)] tracking-tight">
            Khẩu vị rủi ro: <span style={{ color: riskMeta.color }}>{riskMeta.label}</span>
          </p>
          {hasCompletedQuiz ? (
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1.5 font-medium">
              <Target size={11} className="text-blue-500" /> Điểm: <strong>{riskScore}/100</strong>
              {lastUpdated && (
                <>
                  <span className="opacity-30">|</span>
                  <Calendar size={11} className="text-emerald-500" /> {lastUpdated}
                </>
              )}
            </p>
          ) : (
            <p className="text-[12px] text-amber-400 mt-0.5 font-medium">
              Chưa làm đánh giá - đang dùng giá trị mặc định
            </p>
          )}
        </div>
      </div>
      <Link
        to="/risk-assessment"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95"
      >
        <Target size={14} /> {hasCompletedQuiz ? 'Làm lại quiz' : 'Làm quiz ngay'}
      </Link>
    </div>
  );
}
