// @ts-nocheck
import React from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Crosshair,
  Gauge,
  LineChart,
  Target,
} from 'lucide-react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { formatPercent } from "../../utils/calculations";

const TONE_BY_GRADE = {
  A: {
    text: "text-emerald-300",
    bg: "bg-emerald-400",
    halo: "bg-emerald-400/20",
    border: "border-emerald-400/40",
    fill: "#34d399",
  },
  B: {
    text: "text-blue-300",
    bg: "bg-blue-400",
    halo: "bg-blue-400/20",
    border: "border-blue-400/40",
    fill: "#60a5fa",
  },
  C: {
    text: "text-amber-300",
    bg: "bg-amber-400",
    halo: "bg-amber-400/20",
    border: "border-amber-400/40",
    fill: "#fbbf24",
  },
  D: {
    text: "text-orange-300",
    bg: "bg-orange-400",
    halo: "bg-orange-400/20",
    border: "border-orange-400/40",
    fill: "#fb923c",
  },
  F: {
    text: "text-red-300",
    bg: "bg-red-400",
    halo: "bg-red-400/20",
    border: "border-red-400/40",
    fill: "#f87171",
  },
};

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

function safeNumber(value: any) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatMetricPercent(value) {
  const number = safeNumber(value);
  return number === null ? "-" : formatPercent(number * 100);
}

function formatSharpe(value: any) {
  const number = safeNumber(value);
  return number === null ? "-" : number.toFixed(2);
}

function normalizePoint(point: any = {}, index: any = 0) {
  if (!point) return null;
  const risk = safeNumber(point.risk ?? point.portfolioRisk);
  const expectedReturn = safeNumber(point.return ?? point.expectedReturn);
  if (risk === null || expectedReturn === null) return null;

  return {
    id: point.id || `frontier-${index}`,
    risk,
    expectedReturn,
    sharpeRatio: safeNumber(point.sharpe ?? point.sharpeRatio),
  };
}

function FrontierTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload || {};
  return (
    <div
      className="rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl"
      style={{ maxWidth: "min(17rem, calc(100vw - 3rem))" }}
    >
      <div className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">
        Danh mục
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-500">Return</span>
          <span className="font-black text-white">
            {formatMetricPercent(point.expectedReturn)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-500">Risk</span>
          <span className="font-black text-white">
            {formatMetricPercent(point.risk)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-semibold text-slate-500">Sharpe</span>
          <span className="font-black text-white">
            {formatSharpe(point.sharpeRatio)}
          </span>
        </div>
      </div>
    </div>
  );
}

function UserDot({ cx, cy, fill }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill={fill} fillOpacity={0.24} />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={fill}
        stroke="#0f172a"
        strokeWidth={2}
      />
    </g>
  );
}

function MetricPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <Icon size={12} className="shrink-0 text-slate-400" />
        <span>{label}</span>
      </div>
      <div className="text-sm font-black text-white">{value}</div>
    </div>
  );
}

function FrontierScatter({ frontierData, userPoint, tone }) {
  return (
    <div className="h-[260px] min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, left: 4, bottom: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            type="number"
            dataKey="risk"
            name="Risk"
            domain={[0, (dataMax) => Math.max(0.2, dataMax * 1.15)]}
            tickFormatter={(value) => formatPercent(value * 100)}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="expectedReturn"
            name="Return"
            domain={[0, (dataMax) => Math.max(0.15, dataMax * 1.15)]}
            tickFormatter={(value) => formatPercent(value * 100)}
            tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <ZAxis range={[45, 45]} />
          <Tooltip
            content={<FrontierTooltip />}
            wrapperStyle={{ outline: "none" }}
          />
          <Scatter
            name="Frontier"
            data={frontierData}
            fill="#64748b"
            fillOpacity={0.42}
          />
          <Scatter
            name="Portfolio"
            data={[userPoint]}
            fill={tone.fill}
            shape={(props) => <UserDot {...props} fill={tone.fill} />}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function CurrentPortfolioCard({ userPoint, tone }) {
  const riskPercent = clamp((userPoint.risk / 0.35) * 100, 8, 92);
  const returnPercent = clamp((userPoint.expectedReturn / 0.2) * 100, 8, 92);

  return (
    <div className="relative min-h-[230px] rounded-2xl border border-white/5 bg-white/[0.02] p-4">
      <div className="absolute inset-4 rounded-xl border border-dashed border-white/10" />
      <div className="absolute bottom-4 left-4 right-4 h-px bg-white/10" />
      <div className="absolute bottom-4 left-4 top-4 w-px bg-white/10" />
      <span className="absolute bottom-1 right-4 text-[10px] font-black uppercase tracking-widest text-slate-600">
        Risk
      </span>
      <span className="absolute left-1 top-4 -rotate-90 text-[10px] font-black uppercase tracking-widest text-slate-600">
        Return
      </span>
      <div
        className="absolute -translate-x-1/2 translate-y-1/2"
        style={{ left: `${riskPercent}%`, bottom: `${returnPercent}%` }}
      >
        <div className={`h-12 w-12 rounded-full ${tone.halo} blur-xl`} />
        <div
          className={`absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border ${tone.border} bg-slate-950 shadow-xl`}
        >
          <Target size={15} className={tone.text} />
        </div>
      </div>
      <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
        Current only
      </div>
    </div>
  );
}

function getMethodLabel(value) {
  const method = String(value || "markowitz").toLowerCase();
  if (method.includes("black") || method.includes("litterman")) return "Black-Litterman";
  if (method.includes("markowitz")) return "Markowitz MVO";
  return value || "Markowitz MVO";
}

export default function EfficientFrontierPanel({
  allocationMetrics,
  frontierPoints,
  riskGrade,
  optimization,
  optimizationMethod,
}: any) {
  const userPoint = normalizePoint(allocationMetrics, 'portfolio');
  if (!userPoint) return null;

  const frontierData = Array.isArray(frontierPoints)
    ? frontierPoints.map(normalizePoint).filter(Boolean)
    : [];
  const hasFrontier = frontierData.length >= 2;
  const tone = TONE_BY_GRADE[riskGrade] || TONE_BY_GRADE.C;

  const qualityKey = String(optimization?.marketDataQuality || "fallback").toLowerCase();
  const quality = QUALITY_STYLES[qualityKey] || QUALITY_STYLES.fallback;
  const converged = optimization?.converged === true;
  const iterations = safeNumber(optimization?.iterations);
  const SolverIcon = converged ? CheckCircle2 : AlertCircle;
  const solverColor = converged ? "text-emerald-400" : "text-amber-400";
  const methodLabel = getMethodLabel(optimizationMethod || optimization?.optimizationMethod);

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/60 p-5 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      {/* Header — gộp từ OptimizationSummaryStrip */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2">
            <Crosshair size={16} className="text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">{methodLabel}</h3>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black ${quality.className}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${quality.dotClassName}`} />
                {quality.label}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <SolverIcon size={11} className={solverColor} />
              <span>
                {converged ? "Converged" : "Review"}
                {iterations !== null ? ` · ${iterations} vòng` : ""}
              </span>
              <span className="text-slate-600">·</span>
              <span>Risk-return hiện tại{hasFrontier ? " trên frontier" : ""}</span>
            </div>
          </div>
        </div>
        <div
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black ${tone.border} ${tone.text} bg-white/[0.02]`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${tone.bg}`} />
          Grade {riskGrade || "C"}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        {hasFrontier ? (
          <FrontierScatter
            frontierData={frontierData}
            userPoint={userPoint}
            tone={tone}
          />
        ) : (
          <CurrentPortfolioCard userPoint={userPoint} tone={tone} />
        )}

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:grid-cols-1">
          <MetricPill
            icon={LineChart}
            label="Return"
            value={formatMetricPercent(userPoint.expectedReturn)}
          />
          <MetricPill
            icon={Gauge}
            label="Risk"
            value={formatMetricPercent(userPoint.risk)}
          />
          <MetricPill
            icon={Activity}
            label="Sharpe"
            value={formatSharpe(userPoint.sharpeRatio)}
          />
        </div>
      </div>
    </div>
  );
}
