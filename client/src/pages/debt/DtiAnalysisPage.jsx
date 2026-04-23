import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { formatVND, formatPercent } from '../../utils/calculations';
import { TrendingUp, Lightbulb, AlertTriangle, AlertOctagon, CheckCircle, Info } from 'lucide-react';

const ZONE_CONFIG = {
  SAFE:     { label: 'An toàn',     color: '#10b981', gradient: 'from-emerald-500 to-teal-400',    glow: 'rgba(16,185,129,0.15)',  Icon: CheckCircle  },
  CAUTION:  { label: 'Cẩn thận',   color: '#f59e0b', gradient: 'from-amber-500 to-orange-400',    glow: 'rgba(245,158,11,0.15)', Icon: Info          },
  WARNING:  { label: 'Nguy hiểm',  color: '#f97316', gradient: 'from-orange-500 to-red-400',      glow: 'rgba(249,115,22,0.15)', Icon: AlertTriangle },
  CRITICAL: { label: 'Khủng hoảng',color: '#ef4444', gradient: 'from-red-500 to-rose-400',        glow: 'rgba(239,68,68,0.15)',  Icon: AlertOctagon  },
};

const ZONE_MESSAGES = {
  SAFE:     'Chỉ số DTI đang ở mức an toàn. Tiếp tục duy trì thói quen tài chính tốt này!',
  CAUTION:  'DTI đã vượt 20% — nên theo dõi chặt chẽ hơn và hạn chế vay thêm.',
  WARNING:  'DTI vượt 35% — nợ chiếm tỉ trọng lớn trong thu nhập. Cần kế hoạch giảm nợ cụ thể.',
  CRITICAL: 'DTI vượt 50% — mức nguy hiểm! Nguy cơ mất khả năng thanh toán rất cao. Cần hành động ngay.',
};

const ZONES = [
  { label: 'An toàn',     from: 0,  to: 20,  color: '#10b981' },
  { label: 'Cẩn thận',   from: 20, to: 35,  color: '#f59e0b' },
  { label: 'Nguy hiểm',  from: 35, to: 50,  color: '#f97316' },
  { label: 'Khủng hoảng',from: 50, to: 100, color: '#ef4444' },
];

export default function DtiAnalysisPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    debtAPI.getDtiAnalysis()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  }, []);

  if (loading) return <PageSkeleton />;

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center">
        <TrendingUp size={28} className="text-slate-500" />
      </div>
      <p className="text-[var(--color-text-muted)] font-medium">Không có dữ liệu phân tích</p>
    </div>
  );

  const { summary, breakdown, whatIf } = data;
  const zone    = ZONE_CONFIG[summary.zone] || ZONE_CONFIG.SAFE;
  const ZoneIcon = zone.Icon;
  const markerPct = Math.min(summary.dtiRatio, 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      {/* ── Page Header ── */}
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <TrendingUp size={11} /> Phân tích tài chính
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Phân tích DTI</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Tỷ lệ nợ trên thu nhập — chỉ số sức khoẻ tài chính của bạn</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'DTI Hiện Tại',          value: formatPercent(summary.dtiRatio),         color: zone.color, gradient: zone.gradient,                 desc: zone.label },
          { label: 'Thu Nhập / Tháng',       value: formatVND(summary.monthlyIncome),         color: '#3b82f6',  gradient: 'from-blue-500 to-cyan-400',   desc: 'Theo hồ sơ của bạn' },
          { label: 'Dòng Tiền Còn Lại',      value: formatVND(summary.remainingCashflow),     color: summary.remainingCashflow >= 0 ? '#10b981' : '#ef4444', gradient: summary.remainingCashflow >= 0 ? 'from-emerald-500 to-teal-400' : 'from-red-500 to-rose-400', desc: 'Sau khi trả nợ tối thiểu' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative rounded-3xl p-6 border overflow-hidden cursor-default"
            style={{ background: 'var(--color-bg-card)', borderColor: `${item.color}20`, boxShadow: `0 4px 20px ${item.color}08` }}
          >
            <div className="absolute top-0 left-5 right-5 h-px" style={{ background: `linear-gradient(90deg,transparent,${item.color}60,transparent)` }} />
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-15" style={{ background: item.color }} />
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-3">{item.label}</p>
            <p className={`text-2xl font-black bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent mb-1`}>{item.value}</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* ── DTI Zone Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="relative rounded-3xl p-6 border overflow-hidden"
        style={{ background: 'var(--color-bg-card)', borderColor: `${zone.color}20` }}
      >
        <div className="absolute top-0 left-5 right-5 h-px" style={{ background: `linear-gradient(90deg,transparent,${zone.color}50,transparent)` }} />
        <p className="text-[13px] font-black text-[var(--color-text-primary)] mb-5">Thang đo DTI</p>

        {/* Segmented bar */}
        <div className="relative h-4 rounded-full overflow-hidden flex mb-2">
          {ZONES.map((z) => (
            <div key={z.label} style={{ width: `${z.to - z.from}%`, background: z.color, opacity: 0.75 }} />
          ))}
          <motion.div
            className="absolute top-0 h-full w-0.5 rounded-full bg-white shadow-[0_0_8px_white]"
            style={{ left: `calc(${markerPct}% - 1px)` }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-bold mb-2">
          {ZONES.map((z) => <span key={z.label} style={{ color: z.color }}>{z.label}</span>)}
        </div>
        <div className="flex justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>0%</span><span>20%</span><span>35%</span><span>50%</span><span>100%</span>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: zone.color, boxShadow: `0 0 6px ${zone.color}` }} />
          <p className="text-[13px] font-bold" style={{ color: zone.color }}>
            DTI hiện tại: {formatPercent(summary.dtiRatio)} — {zone.label}
          </p>
        </div>
      </motion.div>

      {/* ── Zone Alert ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="flex items-start gap-3 px-5 py-4 rounded-2xl border relative overflow-hidden"
        style={{ background: `${zone.color}08`, borderColor: `${zone.color}25` }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: zone.color }} />
        <ZoneIcon size={16} style={{ color: zone.color }} className="shrink-0 mt-0.5 ml-1" />
        <p className="text-[13px] font-bold leading-relaxed" style={{ color: zone.color }}>
          {ZONE_MESSAGES[summary.zone]}
        </p>
      </motion.div>

      {/* ── Per-Debt Breakdown ── */}
      {breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-[13px] font-black text-[var(--color-text-primary)] mb-5">Từng khoản nợ đóng góp vào DTI</p>
          <div className="space-y-4">
            {breakdown.map((debt, i) => (
              <motion.div key={debt.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.06 }}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Link to={`/debts/${debt.id}`} className="text-[13px] font-bold text-[var(--color-text-primary)] hover:text-blue-400 transition-colors cursor-pointer">
                      {debt.name}
                    </Link>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{debt.platform} • {formatVND(debt.minPayment)}/tháng</p>
                  </div>
                  <span className="text-[13px] font-black" style={{ color: zone.color }}>{debt.dtiContribution.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (debt.dtiContribution / Math.max(summary.dtiRatio, 1)) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.06 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${zone.color}80, ${zone.color})`, boxShadow: `0 0 6px ${zone.color}60` }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex justify-between text-[13px]">
            <span className="text-[var(--color-text-muted)] font-medium">Tổng DTI</span>
            <span className="font-black" style={{ color: zone.color }}>{formatPercent(summary.dtiRatio)}</span>
          </div>
        </motion.div>
      )}

      {/* ── What-If ── */}
      {summary.zone !== 'SAFE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}
        >
          <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
          <p className="text-[13px] font-black text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-400" /> Để đạt DTI an toàn (&lt; 20%)
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/6 border border-emerald-500/15">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-[11px] font-black text-emerald-400 shrink-0">①</div>
              <div>
                <p className="text-[13px] text-[var(--color-text-primary)]">
                  Tăng thu nhập lên <span className="font-black text-emerald-400">{formatVND(whatIf.incomeNeededForSafe)}/tháng</span>
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Tăng thêm {formatVND(Math.max(0, whatIf.incomeNeededForSafe - summary.monthlyIncome))}/tháng
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-blue-500/6 border border-blue-500/15">
              <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-[11px] font-black text-blue-400 shrink-0">②</div>
              <div>
                <p className="text-[13px] text-[var(--color-text-primary)]">
                  Giảm số tiền trả nợ xuống <span className="font-black text-blue-400">{formatVND(summary.monthlyIncome * 0.20)}</span>
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  Cần giảm {formatVND(whatIf.paymentReductionNeeded)}/tháng —{' '}
                  <Link to="/debts/repayment" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">xem kế hoạch trả nợ →</Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Safe Zone congrats ── */}
      {summary.zone === 'SAFE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-3xl p-8 border text-center relative overflow-hidden"
          style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(16,185,129,0.2)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 20px rgba(16,185,129,0.2)' }}>
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <p className="text-emerald-400 font-black text-lg mb-1">DTI đang ở vùng an toàn!</p>
          <p className="text-[var(--color-text-muted)] text-sm">Tiếp tục theo dõi để duy trì chỉ số này.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
