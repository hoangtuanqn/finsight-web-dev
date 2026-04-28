import React from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Database,
  Gauge,
  LineChart,
} from "lucide-react";
import { formatPercent } from "../../utils/calculations";

const QUALITY_STYLES = {
  full: {
    label: "Historical 5y",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    dotClassName: "bg-emerald-400",
  },
  partial: {
    label: "Partial fallback",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-300",
    dotClassName: "bg-amber-400",
  },
  fallback: {
    label: "Fallback",
    className: "border-red-500/20 bg-red-500/10 text-red-300",
    dotClassName: "bg-red-400",
  },
};

function safeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatMetricPercent(value) {
  const number = safeNumber(value);
  return number === null ? "-" : formatPercent(number * 100);
}

function formatSharpe(value) {
  const number = safeNumber(value);
  return number === null ? "-" : number.toFixed(2);
}

function getQuality(value) {
  return (
    QUALITY_STYLES[String(value || "").toLowerCase()] || QUALITY_STYLES.fallback
  );
}

function getMethodLabel(value) {
  const method = String(value || "markowitz").toLowerCase();
  if (method.includes("markowitz")) return "Markowitz MVO";
  return value || "Markowitz MVO";
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <Icon size={12} className="shrink-0 text-slate-400" />
        <span className="truncate">{label}</span>
      </div>
      <div className="truncate text-sm font-black text-white">{value}</div>
    </div>
  );
}

export default function OptimizationSummaryStrip({
  optimization,
  allocationMetrics,
  optimizationMethod,
}) {
  if (!optimization) return null;

  const quality = getQuality(optimization.marketDataQuality);
  const converged = optimization.converged === true;
  const iterations = safeNumber(optimization.iterations);
  const SolverIcon = converged ? CheckCircle2 : AlertCircle;
  const solverTone = converged
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-amber-500/20 bg-amber-500/10 text-amber-300";

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center xl:w-[22rem]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-2">
              <Activity size={16} className="text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-white">
                {getMethodLabel(
                  optimizationMethod || optimization.optimizationMethod,
                )}
              </p>
              <p className="text-[11px] font-semibold text-slate-500">
                Nguồn phân bổ danh mục
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${quality.className}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${quality.dotClassName}`}
            />
            {quality.label}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-2 lg:grid-cols-4">
          <div className={`rounded-2xl border px-3 py-2.5 ${solverTone}`}>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-75">
              <SolverIcon size={12} className="shrink-0" />
              <span className="truncate">Solver</span>
            </div>
            <div className="truncate text-sm font-black">
              {converged ? "Converged" : "Review"}
              {iterations !== null ? ` · ${iterations} vòng` : ""}
            </div>
          </div>

          <SummaryItem
            icon={LineChart}
            label="Return"
            value={formatMetricPercent(allocationMetrics?.expectedReturn)}
          />
          <SummaryItem
            icon={Gauge}
            label="Risk"
            value={formatMetricPercent(allocationMetrics?.portfolioRisk)}
          />
          <SummaryItem
            icon={Database}
            label="Sharpe"
            value={formatSharpe(allocationMetrics?.sharpeRatio)}
          />
        </div>
      </div>
    </div>
  );
}
