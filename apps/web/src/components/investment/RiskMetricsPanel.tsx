import React from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  TrendingDown,
} from "lucide-react";
import { formatPercent, formatVND } from "../../utils/calculations";

const GRADE_STYLES = {
  A: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  B: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  C: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  D: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  F: "bg-red-500/10 text-red-400 border-red-500/20",
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function percent(value) {
  return formatPercent(safeNumber(value) * 100);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, safeNumber(value) * 100));
}

function MetricCard({ icon: Icon, label, value, subValue, tone = "blue" }) {
  const tones = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 min-w-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className={`p-1.5 rounded-lg border ${tones[tone] || tones.blue}`}>
          <Icon size={14} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">
          {label}
        </span>
      </div>
      <div className="text-xl font-black text-white truncate">{value}</div>
      {subValue && (
        <div className="text-[11px] font-semibold text-slate-500 mt-1 truncate">
          {subValue}
        </div>
      )}
    </div>
  );
}

function RiskBar({ label, value, colorClass }) {
  const width = clampPercent(value);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-slate-400">{label}</span>
        <span className="text-xs font-black text-white">{percent(value)}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function FallbackState({ loading, error }) {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5">
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl border ${
            error
              ? "bg-amber-500/10 border-amber-500/20"
              : "bg-white/5 border-white/10"
          }`}
        >
          {error ? (
            <AlertTriangle size={16} className="text-amber-400" />
          ) : (
            <Activity size={16} className="text-slate-400" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Chỉ số rủi ro</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading
              ? "Đang cập nhật phân tích nâng cao..."
              : "Đang dùng dữ liệu chiến lược cũ."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RiskMetricsPanel({
  riskMetrics,
  loading = false,
  error = null,
}) {
  if (!riskMetrics) return <FallbackState loading={loading} error={error} />;

  const grade = riskMetrics.riskGrade || "C";
  const gradeStyle = GRADE_STYLES[grade] || GRADE_STYLES.C;
  const sharpe = safeNumber(riskMetrics.sharpeRatio);
  const var95 = riskMetrics.var95_1y || {};
  const cvar95 = riskMetrics.cvar95_1y || {};
  const drawdown = riskMetrics.maxDrawdown || {};
  const probLoss = riskMetrics.probLoss || {};

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-56 h-56 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <ShieldCheck size={15} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Chỉ số rủi ro
            </h3>
            <p className="text-[11px] text-slate-500">
              Sharpe, VaR, CVaR và xác suất lỗ
            </p>
          </div>
        </div>
        <div
          className={`inline-flex items-center justify-center px-4 py-2 rounded-2xl border ${gradeStyle}`}
        >
          <span className="text-[10px] font-black uppercase tracking-widest mr-2 opacity-70">
            Grade
          </span>
          <span className="text-2xl font-black leading-none">{grade}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 relative z-10">
        <MetricCard
          icon={BarChart3}
          label="Sharpe"
          value={sharpe.toFixed(2)}
          subValue={riskMetrics.sharpeLabel || "-"}
          tone={sharpe > 1 ? "emerald" : sharpe > 0.3 ? "blue" : "amber"}
        />
        <MetricCard
          icon={TrendingDown}
          label="VaR 95%"
          value={formatVND(safeNumber(var95.amount))}
          subValue={percent(var95.percentage)}
          tone="amber"
        />
        <MetricCard
          icon={AlertTriangle}
          label="CVaR 95%"
          value={formatVND(safeNumber(cvar95.amount))}
          subValue={percent(cvar95.percentage)}
          tone="red"
        />
        <MetricCard
          icon={Activity}
          label="Prob Loss 10y"
          value={percent(probLoss["10y"])}
          subValue={`1y ${percent(probLoss["1y"])} · 5y ${percent(probLoss["5y"])}`}
          tone="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5 relative z-10">
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
          <RiskBar
            label="Max drawdown trung vị"
            value={drawdown.median}
            colorClass="bg-amber-500"
          />
          <RiskBar
            label="Max drawdown kịch bản xấu"
            value={drawdown.worst}
            colorClass="bg-red-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {["1y", "5y", "10y"].map((horizon) => (
            <div
              key={horizon}
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center"
            >
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                {horizon}
              </div>
              <div className="text-lg font-black text-white">
                {percent(probLoss[horizon])}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-1">
                xác suất lỗ
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
