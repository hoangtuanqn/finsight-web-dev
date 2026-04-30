import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatVND } from "../../utils/calculations";
import { toast } from "sonner";
import { useDebtGoal, useDebtGoalMutations } from "../../hooks/useDebtQuery";
import {
  Target,
  Trophy,
  Flag,
  CheckCircle2,
  Lock,
  Calendar,
  Zap,
  TrendingDown,
  AlertTriangle,
  Edit3,
  Trash2,
  Plus,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMonthYear(iso: string | null | undefined) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
}

const STATUS_META = {
  AHEAD: { label: "Vượt kế hoạch", color: "emerald", icon: TrendingDown },
  ON_TRACK: { label: "Đúng tiến độ", color: "blue", icon: Target },
  BEHIND: { label: "Chậm tiến độ", color: "red", icon: AlertTriangle },
} as const;

const MILESTONE_META = [
  { percent: 25, icon: Flag, label: "1/4 chặng đường" },
  { percent: 50, icon: TrendingDown, label: "Nửa đường rồi!" },
  { percent: 75, icon: Trophy, label: "Sắp về đích!" },
  { percent: 100, icon: Trophy, label: "Trả hết nợ! 🎉" },
];

function SkeletonBlock({
  h = "h-24",
  className = "",
}: {
  h?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl animate-pulse bg-white/5 ${h} ${className}`} />
  );
}

function GoalForm({
  existing,
  onSaved,
  onCancel,
}: {
  existing: any;
  onSaved: () => void;
  onCancel: (() => void) | null;
}) {
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const [targetDate, setTargetDate] = useState(
    existing?.targetDate ? existing.targetDate.split("T")[0] : "",
  );
  const [strategy, setStrategy] = useState(existing?.strategy || "AVALANCHE");

  const { upsertGoal, isUpserting: saving } = useDebtGoalMutations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) {
      toast.error("Vui lòng chọn ngày mục tiêu.");
      return;
    }

    upsertGoal(
      { targetDate, strategy },
      {
        onSuccess: () => {
          toast.success(
            existing ? "Đã cập nhật mục tiêu!" : "Đã đặt mục tiêu trả nợ!",
          );
          onSaved();
        },
      },
    );
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="relative rounded-3xl p-6 border overflow-hidden space-y-5"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "rgba(139,92,246,0.2)",
      }}
    >
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 bg-violet-500" />

      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
          <Target size={18} />
        </div>
        <h2 className="font-black text-[var(--color-text-primary)] text-[15px]">
          {existing ? "Chỉnh sửa mục tiêu" : "Đặt mục tiêu trả nợ"}
        </h2>
      </div>

      <div>
        <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-black mb-1.5">
          Mục tiêu trả hết nợ vào ngày
        </label>
        <input
          type="date"
          min={minDateStr}
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] font-bold text-[14px] outline-none focus:border-violet-500/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-black mb-2">
          Chiến lược trả nợ
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              value: "AVALANCHE",
              label: "Avalanche",
              desc: "Ưu tiên lãi suất cao - tiết kiệm nhất",
              color: "blue",
              Icon: Zap,
            },
            {
              value: "SNOWBALL",
              label: "Snowball",
              desc: "Ưu tiên dư nợ nhỏ - tạo động lực",
              color: "emerald",
              Icon: Target,
            },
          ].map(({ value, label, desc, color, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStrategy(value)}
              className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer ${strategy === value
                  ? `border-${color}-500/40 bg-${color}-500/10`
                  : "border-[var(--color-border)] hover:border-[var(--color-border-hover)] bg-transparent"
                }`}
            >
              <div
                className={`w-7 h-7 rounded-lg mb-2 flex items-center justify-center ${strategy === value
                    ? `bg-${color}-500/20 text-${color}-400`
                    : "bg-white/5 text-[var(--color-text-muted)]"
                  }`}
              >
                <Icon size={14} />
              </div>
              <p
                className={`text-[13px] font-black ${strategy === value ? `text-${color}-400` : "text-[var(--color-text-primary)]"}`}
              >
                {label}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                {desc}
              </p>
              {strategy === value && (
                <div
                  className={`absolute top-3 right-3 w-4 h-4 rounded-full bg-${color}-500/20 flex items-center justify-center`}
                >
                  <CheckCircle2 size={12} className={`text-${color}-400`} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 font-black text-[13px] hover:bg-violet-500/25 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : existing ? "Lưu thay đổi" : "Đặt mục tiêu"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-muted)] font-black text-[13px] hover:border-[var(--color-border-hover)] transition-all cursor-pointer"
          >
            Hủy
          </button>
        )}
      </div>
    </motion.form>
  );
}

function MilestoneCard({
  meta,
  data,
  delay,
}: {
  meta: any;
  data: any;
  delay: number;
}) {
  const { percent, icon: Icon, label } = meta;
  const { targetAmount, reached } = data;
  const isLast = percent === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative rounded-2xl p-4 border overflow-hidden transition-all ${reached
          ? isLast
            ? "border-amber-500/40 bg-amber-500/8"
            : "border-emerald-500/30 bg-emerald-500/8"
          : "border-[var(--color-border)] bg-[var(--color-bg-card)] opacity-60"
        }`}
    >
      {reached && (
        <div
          className={`absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent ${isLast ? "via-amber-500/60" : "via-emerald-500/60"} to-transparent`}
        />
      )}

      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${reached
              ? isLast
                ? "bg-amber-500/20 text-amber-400"
                : "bg-emerald-500/20 text-emerald-400"
              : "bg-white/5 text-[var(--color-text-muted)]"
            }`}
        >
          {reached ? <Icon size={18} /> : <Lock size={16} />}
        </div>
        <span
          className={`text-[22px] font-black ${reached
              ? isLast
                ? "text-amber-400"
                : "text-emerald-400"
              : "text-[var(--color-text-muted)]"
            }`}
        >
          {percent}%
        </span>
      </div>

      <p
        className={`text-[11px] font-bold mb-1 ${reached ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}
      >
        {label}
      </p>
      <p className="text-[12px] font-black text-[var(--color-text-muted)]">
        {formatVND(targetAmount)} đã trả
      </p>

      {reached && (
        <div
          className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${isLast
              ? "bg-amber-500/15 text-amber-300"
              : "bg-emerald-500/15 text-emerald-300"
            }`}
        >
          <CheckCircle2 size={10} /> Đã đạt!
        </div>
      )}
    </motion.div>
  );
}

export default function DebtGoalPage() {
  const [editing, setEditing] = useState(false);
  const { data, isLoading: loading } = useDebtGoal() as {
    data: any;
    isLoading: boolean;
  };
  const { deleteGoal, isDeleting: deleting } = useDebtGoalMutations() as any;

  const handleDelete = async () => {
    if (
      !window.confirm("Xóa mục tiêu trả nợ? Bạn có thể đặt lại bất cứ lúc nào.")
    )
      return;
    deleteGoal(null, {
      onSuccess: () => toast.success("Đã xóa mục tiêu."),
    });
  };

  if (loading) {
    return (
      <div className="pb-8 space-y-6">
        <div className="pt-2">
          <SkeletonBlock h="h-12" className="w-48 mb-3" />
          <SkeletonBlock h="h-6" className="w-72" />
        </div>
        <SkeletonBlock h="h-48" />
        <SkeletonBlock h="h-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} h="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const { goal, progress, milestones, onTrack } = data || {};
  const showForm = !goal || editing;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-8 space-y-6"
    >
      <div className="pt-2">
        <div className="mb-4">
          <Link
            to="/debts/repayment"
            className="inline-flex items-center gap-2 text-[12px] font-bold text-[var(--color-text-muted)] hover:text-cyan-300 transition-colors"
          >
            <ArrowLeft size={14} /> Kế hoạch trả nợ
          </Link>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/8 text-violet-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <Target size={11} /> Mục tiêu trả nợ
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
          Mục tiêu & Milestone
        </h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Đặt mục tiêu trả hết nợ và theo dõi tiến độ qua các cột mốc quan trọng
        </p>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <GoalForm
            key="form"
            existing={editing ? goal : null}
            onSaved={() => setEditing(false)}
            onCancel={editing ? () => setEditing(false) : null}
          />
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl p-6 border overflow-hidden"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "rgba(139,92,246,0.2)",
            }}
          >
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-10 bg-violet-500" />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-black">
                    Mục tiêu trả hết nợ
                  </p>
                  <p className="text-[18px] font-black text-[var(--color-text-primary)]">
                    {formatDate(goal?.targetDate)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-[11px] font-black transition-all cursor-pointer"
                >
                  <Edit3 size={12} /> Sửa
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-[11px] font-black transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 size={12} /> Xóa
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] text-[var(--color-text-muted)] font-bold">
                Chiến lược:
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${goal?.strategy === "AVALANCHE"
                    ? "bg-blue-500/15 text-blue-300"
                    : "bg-emerald-500/15 text-emerald-300"
                  }`}
              >
                {goal?.strategy === "AVALANCHE" ? "Avalanche" : "Snowball"}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {progress && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-black text-[var(--color-text-primary)]">
              Tổng tiến độ trả nợ
            </h3>
            <span className="text-[24px] font-black text-[var(--color-text-primary)]">
              {progress.percentPaid.toFixed(1)}%
            </span>
          </div>

          <div className="relative h-4 rounded-full bg-white/5 overflow-hidden mb-5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress.percentPaid)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #ef4444, #f97316, #22c55e)",
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: "Tổng nợ gốc",
                value: formatVND(progress.totalOriginal),
                color: "text-[var(--color-text-primary)]",
              },
              {
                label: "Đã trả được",
                value: formatVND(progress.totalPaid),
                color: "text-emerald-400",
              },
              {
                label: "Còn phải trả",
                value: formatVND(progress.totalCurrent),
                color: "text-red-400",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--color-border)] p-3 text-center"
              >
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-black mb-1">
                  {label}
                </p>
                <p className={`text-[13px] font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {milestones && (
        <div>
          <h3 className="text-[13px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
            <Flag size={13} /> Cột mốc
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {milestones.map((m, i) => (
              <MilestoneCard
                key={m.percent}
                meta={MILESTONE_META[i]}
                data={m}
                delay={0.05 * i}
              />
            ))}
          </div>
        </div>
      )}

      {goal && onTrack && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-3xl p-6 border overflow-hidden"
          style={{
            background: "var(--color-bg-card)",
            borderColor:
              onTrack.status === "BEHIND"
                ? "rgba(239,68,68,0.25)"
                : onTrack.status === "AHEAD"
                  ? "rgba(16,185,129,0.25)"
                  : "rgba(59,130,246,0.25)",
          }}
        >
          {(() => {
            const meta = STATUS_META[onTrack.status] || STATUS_META.ON_TRACK;
            const colorMap = {
              emerald: {
                glow: "via-emerald-500/50",
                bg: "bg-emerald-500",
                badge: "bg-emerald-500/15 text-emerald-300",
                icon: meta.icon,
              },
              blue: {
                glow: "via-blue-500/50",
                bg: "bg-blue-500",
                badge: "bg-blue-500/15 text-blue-300",
                icon: meta.icon,
              },
              red: {
                glow: "via-red-500/50",
                bg: "bg-red-500",
                badge: "bg-red-500/15 text-red-300",
                icon: meta.icon,
              },
            };
            const cm = colorMap[meta.color];
            const StatusIcon = cm.icon;
            return (
              <>
                <div
                  className={`absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent ${cm.glow} to-transparent`}
                />
                <div
                  className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-3xl opacity-10 ${cm.bg}`}
                />

                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <StatusIcon size={18} className={cm.badge.split(" ")[1]} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)] uppercase tracking-wider font-black">
                      Trạng thái
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-black ${cm.badge}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[var(--color-border)] p-4">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-black mb-1">
                      Dự kiến trả hết
                    </p>
                    <p className="text-[16px] font-black text-[var(--color-text-primary)]">
                      {formatMonthYear(onTrack.projectedPayoffDate)}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      ~{onTrack.projectedMonths} tháng nữa
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] p-4">
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-black mb-1">
                      Mục tiêu của bạn
                    </p>
                    <p className="text-[16px] font-black text-[var(--color-text-primary)]">
                      {formatDate(goal?.targetDate)}
                    </p>
                  </div>
                </div>

                {onTrack.status === "BEHIND" &&
                  onTrack.requiredExtraBudget != null && (
                    <div className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-red-500/15 bg-red-500/6">
                      <AlertTriangle
                        size={15}
                        className="text-red-400 shrink-0 mt-0.5"
                      />
                      <p className="text-[13px] text-red-300 leading-relaxed">
                        Để đạt mục tiêu, bạn cần trả thêm{" "}
                        <span className="font-black text-red-200">
                          {formatVND(onTrack.requiredExtraBudget)}/tháng
                        </span>
                        . Hãy điều chỉnh ngân sách ở trang{" "}
                        <Link
                          to="/debts/repayment"
                          className="underline hover:text-red-100 transition-colors"
                        >
                          Kế hoạch trả nợ
                        </Link>
                        .
                      </p>
                    </div>
                  )}

                {onTrack.status === "AHEAD" && (
                  <div className="mt-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl border border-emerald-500/15 bg-emerald-500/6">
                    <CheckCircle2
                      size={15}
                      className="text-emerald-400 shrink-0 mt-0.5"
                    />
                    <p className="text-[13px] text-emerald-300 leading-relaxed">
                      Tuyệt vời! Bạn đang vượt tiến độ. Tiếp tục duy trì đà này
                      nhé! 🚀
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </motion.div>
      )}

      {progress && progress.totalOriginal === 0 && (
        <div
          className="rounded-3xl border border-[var(--color-border)] p-16 text-center"
          style={{ background: "var(--color-bg-card)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-4">
            <Target size={28} className="text-slate-500" />
          </div>
          <p className="text-[var(--color-text-muted)] font-medium mb-2">
            Chưa có khoản nợ nào
          </p>
          <Link
            to="/debts/add"
            className="inline-flex items-center gap-1.5 text-[12px] font-black text-violet-400 hover:text-violet-300 transition-colors"
          >
            <Plus size={13} /> Thêm khoản nợ đầu tiên <ChevronRight size={13} />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
