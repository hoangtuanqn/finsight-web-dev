import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { PageSkeleton } from '../../components/common/LoadingSpinner';
import { formatVND, formatPercent } from '../../utils/calculations';
import { TrendingUp, Lightbulb, AlertTriangle, AlertOctagon, CheckCircle, Info } from 'lucide-react';

const ZONE_CONFIG = {
  SAFE:     { label: 'An toàn',    color: '#10b981', bg: 'bg-emerald-500/8',  border: 'border-emerald-500/20', Icon: CheckCircle },
  CAUTION:  { label: 'Cẩn thận',   color: '#f59e0b', bg: 'bg-amber-500/8',    border: 'border-amber-500/20',   Icon: Info },
  WARNING:  { label: 'Nguy hiểm',  color: '#f97316', bg: 'bg-orange-500/8',   border: 'border-orange-500/20',  Icon: AlertTriangle },
  CRITICAL: { label: 'Khủng hoảng', color: '#ef4444', bg: 'bg-red-500/8',    border: 'border-red-500/20',     Icon: AlertOctagon },
};

const ZONE_MESSAGES = {
  SAFE:     'Chỉ số DTI của bạn đang ở mức an toàn. Tiếp tục duy trì thói quen tài chính tốt này!',
  CAUTION:  'DTI đã vượt 20% — bạn nên theo dõi chặt chẽ hơn và hạn chế vay thêm.',
  WARNING:  'DTI vượt 35% — nợ đang chiếm tỉ trọng lớn trong thu nhập. Cần có kế hoạch giảm nợ cụ thể.',
  CRITICAL: 'DTI vượt 50% — mức nguy hiểm! Nguy cơ mất khả năng thanh toán rất cao. Cần hành động ngay.',
};

export default function DtiAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    debtAPI.getDtiAnalysis()
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  }, []);

  if (loading) return <PageSkeleton />;

  if (!data) return (
    <div className="text-center py-20">
      <TrendingUp size={40} className="mx-auto text-slate-500 mb-3" />
      <p className="text-slate-500">Không có dữ liệu phân tích</p>
    </div>
  );

  const { summary, breakdown, whatIf } = data;
  const zone = ZONE_CONFIG[summary.zone] || ZONE_CONFIG.SAFE;
  const ZoneIcon = zone.Icon;

  // Zone bar positions (%)
  const zones = [
    { label: 'An toàn', from: 0, to: 20,  color: '#10b981' },
    { label: 'Cẩn thận', from: 20, to: 35, color: '#f59e0b' },
    { label: 'Nguy hiểm', from: 35, to: 50, color: '#f97316' },
    { label: 'Khủng hoảng', from: 50, to: 100, color: '#ef4444' },
  ];

  // Marker position — capped at 100% visually
  const markerPct = Math.min(summary.dtiRatio, 100);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white flex items-center gap-2">
          <TrendingUp size={20} /> Phân tích DTI
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Tỷ lệ nợ trên thu nhập — chỉ số sức khoẻ tài chính của bạn
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {[
          {
            label: 'DTI Hiện Tại',
            value: formatPercent(summary.dtiRatio),
            color: zone.color,
            desc: zone.label,
          },
          {
            label: 'Thu Nhập / Tháng',
            value: formatVND(summary.monthlyIncome),
            color: '#3b82f6',
            desc: 'Theo hồ sơ của bạn',
          },
          {
            label: 'Dòng Tiền Còn Lại',
            value: formatVND(summary.remainingCashflow),
            color: summary.remainingCashflow >= 0 ? '#10b981' : '#ef4444',
            desc: 'Sau khi trả nợ tối thiểu',
          },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card text-center py-5"
          >
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">{item.label}</p>
            <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[11px] text-slate-600 mt-1">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Zone Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card mb-6"
      >
        <p className="text-[13px] font-semibold text-white mb-4">Thang đo DTI</p>

        {/* Bar */}
        <div className="relative h-5 rounded-full overflow-hidden flex mb-6">
          {zones.map((z) => (
            <div
              key={z.label}
              style={{
                width: `${z.to - z.from}%`,
                background: z.color,
                opacity: 0.75,
              }}
            />
          ))}
          {/* Marker */}
          <motion.div
            className="absolute top-0 h-full w-1 rounded-full bg-white shadow-lg"
            style={{ left: `calc(${markerPct}% - 2px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          />
        </div>

        {/* Zone Labels */}
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          {zones.map((z) => (
            <span key={z.label} style={{ color: z.color }}>{z.label}</span>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>0%</span>
          <span>20%</span>
          <span>35%</span>
          <span>50%</span>
          <span>100%</span>
        </div>

        {/* Current marker label */}
        <p className="text-center text-sm mt-4">
          DTI hiện tại:{' '}
          <span className="font-bold" style={{ color: zone.color }}>
            {formatPercent(summary.dtiRatio)} — {zone.label}
          </span>
        </p>
      </motion.div>

      {/* Zone Alert Box */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className={`px-4 py-3 rounded-xl border text-sm flex items-start gap-2 mb-6 ${zone.bg} ${zone.border}`}
      >
        <ZoneIcon size={15} className="shrink-0 mt-0.5" style={{ color: zone.color }} />
        <p style={{ color: zone.color }}>{ZONE_MESSAGES[summary.zone]}</p>
      </motion.div>

      {/* Per-Debt Breakdown */}
      {breakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card mb-6"
        >
          <p className="text-[13px] font-semibold text-white mb-4">
            Từng khoản nợ đóng góp vào DTI
          </p>

          <div className="space-y-4">
            {breakdown.map((debt, i) => (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.06 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <Link
                      to={`/debts/${debt.id}`}
                      className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                    >
                      {debt.name}
                    </Link>
                    <p className="text-[11px] text-slate-600">{debt.platform} • Trả/tháng: {formatVND(debt.minPayment)}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: zone.color }}>
                    {debt.dtiContribution.toFixed(1)}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (debt.dtiContribution / Math.max(summary.dtiRatio, 1)) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + i * 0.06 }}
                    className="h-full rounded-full"
                    style={{ background: zone.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-sm">
            <span className="text-slate-500">Tổng DTI</span>
            <span className="font-bold" style={{ color: zone.color }}>
              {formatPercent(summary.dtiRatio)}
            </span>
          </div>
        </motion.div>
      )}

      {/* What-If Calculator */}
      {summary.zone !== 'SAFE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="glass-card bg-gradient-to-r from-blue-500/5 to-emerald-500/5"
          style={{ borderColor: 'rgba(59, 130, 246, 0.15)' }}
        >
          <p className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-400" />
            Để đạt DTI an toàn (&lt; 20%)
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">①</span>
              <div>
                <p className="text-sm text-slate-300">
                  Tăng thu nhập lên{' '}
                  <span className="font-bold text-emerald-400">{formatVND(whatIf.incomeNeededForSafe)}/tháng</span>
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Tăng thêm {formatVND(Math.max(0, whatIf.incomeNeededForSafe - summary.monthlyIncome))}/tháng so với hiện tại
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 mt-0.5">②</span>
              <div>
                <p className="text-sm text-slate-300">
                  Giảm số tiền trả nợ hàng tháng xuống còn{' '}
                  <span className="font-bold text-blue-400">
                    {formatVND(summary.monthlyIncome * 0.20)}
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Cần giảm {formatVND(whatIf.paymentReductionNeeded)}/tháng — hãy xem{' '}
                  <Link to="/debts/repayment" className="text-blue-400 hover:underline">
                    kế hoạch trả nợ
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Safe zone — positive message */}
      {summary.zone === 'SAFE' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card text-center py-8 bg-emerald-500/5"
          style={{ borderColor: 'rgba(16, 185, 129, 0.15)' }}
        >
          <CheckCircle size={32} className="mx-auto text-emerald-400 mb-3" />
          <p className="text-emerald-400 font-semibold">DTI đang ở vùng an toàn 🎉</p>
          <p className="text-slate-500 text-sm mt-1">
            Bạn không cần thay đổi gì. Tiếp tục theo dõi để duy trì chỉ số này!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
