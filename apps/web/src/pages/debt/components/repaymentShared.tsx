import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Target,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { formatVND } from "../../../utils/calculations";

export const TOOLTIP_STYLE = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
  padding: "10px 14px",
};

const strategyTone = {
  blue: {
    iconBox: "bg-blue-500/15 text-blue-400",
    title: "text-blue-400",
    mutedTitle: "text-blue-300",
    softBox: "bg-blue-500/6 border-blue-500/15",
    chip: "bg-blue-500/15 border-blue-500/25 text-blue-400 hover:bg-blue-500/25",
    number: "bg-blue-500/20 text-blue-400",
    arrow: "text-blue-500",
    glow: "via-blue-500/50",
    orb: "bg-blue-500",
  },
  emerald: {
    iconBox: "bg-emerald-500/15 text-emerald-400",
    title: "text-emerald-400",
    mutedTitle: "text-emerald-300",
    softBox: "bg-emerald-500/6 border-emerald-500/15",
    chip: "bg-emerald-500/15 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25",
    number: "bg-emerald-500/20 text-emerald-400",
    arrow: "text-emerald-500",
    glow: "via-emerald-500/50",
    orb: "bg-emerald-500",
  },
  red: {
    title: "text-red-400",
    softBox: "bg-red-500/6 border-red-500/15",
    arrow: "text-red-500",
  },
  amber: {
    title: "text-amber-400",
  },
} as const;

const methodTone = {
  AVALANCHE: {
    name: "Avalanche",
    badge: "Tiết kiệm lãi",
    subtitle: "Ưu tiên trả nợ lãi suất CAO nhất trước",
    text: "text-blue-400",
    textSoft: "text-blue-300",
    hover: "hover:text-blue-300",
    border: "rgba(59,130,246,0.25)",
    shadow: "rgba(59,130,246,0.06)",
    iconBox: "bg-blue-500/15 text-blue-400",
    iconButton: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/70 hover:text-blue-300",
    separator: "bg-blue-500/10",
    glow: "via-blue-500/50",
    icon: <Zap size={18} />,
  },
  SNOWBALL: {
    name: "Snowball",
    badge: "Động lực tâm lý",
    subtitle: "Ưu tiên trả nợ DƯ NỢ nhỏ nhất trước",
    text: "text-emerald-400",
    textSoft: "text-emerald-300",
    hover: "hover:text-emerald-300",
    border: "rgba(16,185,129,0.25)",
    shadow: "rgba(16,185,129,0.06)",
    iconBox: "bg-emerald-500/15 text-emerald-400",
    iconButton: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/70 hover:text-emerald-300",
    separator: "bg-emerald-500/10",
    glow: "via-emerald-500/50",
    icon: <Sparkles size={18} />,
  },
} as const;

export function breachDot(simulation: any, color: string) {
  return (props: any) => {
    const breachMonth = simulation?.termBreach?.month;
    if (!breachMonth || props?.payload?.month !== `T${breachMonth}`) return null;

    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={5}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  };
}

export function TermBreachCard({ method, breach }: { method: string; breach: any }) {
  if (!breach) return null;

  return (
    <div className="rounded-2xl border border-red-400/25 bg-red-500/8 p-4 text-[13px] text-red-100/90 leading-relaxed">
      <div className="flex items-start gap-2.5">
        <AlertTriangle size={16} className="text-red-300 shrink-0 mt-0.5" />
        <p>
          Khoản nợ{" "}
          <span className="font-black text-red-100">{breach.name}</span>{" "}
          bị quá hạn vào tháng thứ {breach.month} khi trả nợ theo phương pháp{" "}
          {method}. Còn {formatVND(breach.remainingBalance)} sau kỳ hạn{" "}
          {breach.deadlineMonth} tháng. Hãy tăng ngân sách trả thêm mỗi tháng.
        </p>
      </div>
    </div>
  );
}

export const STRATEGY_CONTENT = {
  AVALANCHE: {
    name: "Avalanche",
    tagline: "Tiết kiệm lãi tối đa",
    color: "blue",
    borderColor: "rgba(59,130,246,0.25)",
    Icon: Zap,
    emoji: "⚡",
    description:
      "Phương pháp Avalanche tập trung trả khoản nợ có lãi suất cao nhất trước, trong khi vẫn trả tối thiểu cho các khoản còn lại. Khi khoản lãi cao nhất được trả xong, chuyển toàn bộ ngân sách đó sang khoản có lãi suất cao thứ hai.",
    howItWorks: [
      "Liệt kê tất cả các khoản nợ, sắp xếp theo lãi suất từ cao xuống thấp",
      "Trả đúng tối thiểu cho tất cả khoản nợ mỗi tháng",
      "Dùng toàn bộ tiền dư để trả thêm vào khoản lãi suất cao nhất",
      "Khi khoản đó trả xong, chuyển toàn bộ sang khoản lãi suất cao tiếp theo",
      "Lặp lại cho đến khi sạch nợ",
    ],
    pros: [
      "Tiết kiệm nhiều tiền lãi nhất về tổng thể",
      "Trả hết nợ nhanh hơn về mặt toán học",
      "Phù hợp người có tư duy logic và thích tối ưu số liệu",
    ],
    cons: [
      "Có thể mất nhiều tháng trước khi trả xong khoản đầu tiên nếu dư nợ lớn",
      "Ít cảm giác chiến thắng trong ngắn hạn",
      "Đòi hỏi kỷ luật cao",
    ],
    bestFor:
      "Người muốn tối ưu tài chính, tiết kiệm tối đa tiền lãi và có đủ kỷ luật để kiên trì.",
    worstFor:
      "Người cần động lực liên tục hoặc dễ bỏ cuộc khi chưa thấy kết quả sớm.",
  },
  SNOWBALL: {
    name: "Snowball",
    tagline: "Động lực tâm lý bền vững",
    color: "emerald",
    borderColor: "rgba(16,185,129,0.25)",
    Icon: Target,
    emoji: "⛄",
    description:
      "Phương pháp Snowball tập trung trả khoản nợ có dư nợ nhỏ nhất trước, bất kể lãi suất. Mỗi lần trả xong một khoản, bạn có cảm giác chiến thắng và tăng động lực để tiếp tục.",
    howItWorks: [
      "Liệt kê tất cả khoản nợ, sắp xếp theo dư nợ từ nhỏ đến lớn",
      "Trả đúng tối thiểu cho tất cả khoản nợ mỗi tháng",
      "Dùng toàn bộ tiền dư để trả thêm vào khoản dư nợ nhỏ nhất",
      "Khi trả xong khoản nhỏ nhất, chuyển toàn bộ sang khoản nhỏ tiếp theo",
      "Lặp lại cho đến khi sạch nợ",
    ],
    pros: [
      "Tạo cảm giác chiến thắng sớm và thường xuyên",
      "Dễ duy trì động lực dài hạn",
      "Số lượng khoản nợ giảm nhanh, giúp giảm áp lực tâm lý",
    ],
    cons: [
      "Tốn nhiều tiền lãi hơn Avalanche về tổng thể",
      "Thời gian trả hết nợ thường lâu hơn",
      "Không tối ưu về mặt tài chính thuần túy",
    ],
    bestFor:
      "Người cần động lực thường xuyên hoặc đang có nhiều khoản nợ nhỏ cần dọn sạch.",
    worstFor:
      "Người có khoản nợ lớn với lãi suất rất cao, vì Avalanche có thể tiết kiệm hơn đáng kể.",
  },
};

export type StrategyType = keyof typeof STRATEGY_CONTENT;

export function StrategyModal({
  type,
  onClose,
}: {
  type: StrategyType;
  onClose: () => void;
}) {
  const content = STRATEGY_CONTENT[type];
  const tone = strategyTone[content.color];
  const Icon = content.Icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 60 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        className="relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border"
        style={{ background: "var(--color-bg-secondary)", borderColor: content.borderColor }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${tone.glow} to-transparent`} />
        <div className={`absolute -top-12 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 ${tone.orb}`} />
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="p-6 pt-4">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tone.iconBox}`}>
                <Icon size={22} />
              </div>
              <div>
                <h2 className={`text-[20px] font-black ${tone.title}`}>
                  {content.emoji} {content.name}
                </h2>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  {content.tagline}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--color-text-muted)] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-5">
            {content.description}
          </p>

          <div className={`rounded-2xl p-4 mb-4 border ${tone.softBox}`}>
            <h3 className="text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Brain size={11} /> Cách hoạt động
            </h3>
            <ol className="space-y-2">
              {content.howItWorks.map((step, i) => (
                <li key={step} className="flex items-start gap-2.5">
                  <span className={`shrink-0 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center mt-0.5 ${tone.number}`}>
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <StrategyList title="Ưu điểm" items={content.pros} icon={<CheckCircle2 size={10} />} tone="emerald" />
            <StrategyList title="Nhược điểm" items={content.cons} icon={<XCircle size={10} />} tone="red" />
          </div>

          <div className="space-y-2 mb-5">
            <StrategyFit icon={<CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />} label="Phù hợp nhất:" text={content.bestFor} tone="emerald" />
            <StrategyFit icon={<AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />} label="Cân nhắc khi:" text={content.worstFor} tone="amber" />
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-full py-3 rounded-2xl font-black text-[13px] transition-all cursor-pointer border ${tone.chip}`}
          >
            Đã hiểu, đóng lại
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StrategyList({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: ReactNode;
  tone: "emerald" | "red";
}) {
  const classes = strategyTone[tone];

  return (
    <div className={`rounded-2xl p-3.5 border ${classes.softBox}`}>
      <h3 className={`text-[10px] font-black uppercase tracking-wider mb-2.5 flex items-center gap-1 ${classes.title}`}>
        {icon} {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-1.5">
            <ArrowRight size={10} className={`${classes.arrow} shrink-0 mt-1`} />
            <span className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StrategyFit({
  icon,
  label,
  text,
  tone,
}: {
  icon: ReactNode;
  label: string;
  text: string;
  tone: "emerald" | "amber";
}) {
  return (
    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-white/4 border border-white/6">
      {icon}
      <div>
        <span className={`text-[10px] font-black uppercase tracking-wide ${strategyTone[tone].title}`}>
          {label}{" "}
        </span>
        <span className="text-[12px] text-[var(--color-text-secondary)]">
          {text}
        </span>
      </div>
    </div>
  );
}

export function MethodPlanCard({
  type,
  debts,
  simulation,
  termBreach,
  onInfo,
}: {
  type: "AVALANCHE" | "SNOWBALL";
  debts: any[];
  simulation: any;
  termBreach?: any;
  onInfo?: () => void;
}) {
  if (!simulation) return null;

  const isAvalanche = type === "AVALANCHE";
  const tone = methodTone[type];
  const orderedDebts = [...debts].sort((a, b) =>
    isAvalanche ? b.apr - a.apr : a.balance - b.balance,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={isAvalanche ? undefined : { delay: 0.1 }}
      className="relative rounded-3xl p-6 border overflow-hidden"
      style={{
        background: "var(--color-bg-card)",
        borderColor: tone.border,
        boxShadow: `0 4px 20px ${tone.shadow}`,
      }}
    >
      <div className={`absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent ${tone.glow} to-transparent`} />
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone.iconBox}`}>
          {tone.icon}
        </div>
        <h3 className={`font-black text-[16px] ${tone.text}`}>{tone.name}</h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${tone.iconBox}`}>
          {tone.badge}
        </span>
        {onInfo && (
          <button
            type="button"
            onClick={onInfo}
            className={`ml-auto w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer border border-white/10 ${tone.iconButton}`}
            title={`Tìm hiểu về ${tone.name}`}
          >
            <HelpCircle size={14} />
          </button>
        )}
      </div>
      <p className="text-[12px] text-[var(--color-text-muted)] mb-5">
        {tone.subtitle}
      </p>

      {termBreach ? (
        <TermBreachCard method={tone.name} breach={termBreach} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">
                Thời gian
              </p>
              <p className="text-2xl font-black text-[var(--color-text-primary)]">
                {simulation.months}{" "}
                <span className="text-sm text-[var(--color-text-muted)] font-medium">
                  tháng
                </span>
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">
                Tổng lãi
              </p>
              <p className="text-xl font-black text-red-400">
                {formatVND(simulation.totalInterest)}
              </p>
            </div>
          </div>

          {orderedDebts.length > 0 && (
            <>
              <div className={`h-px ${tone.separator} mb-4`} />
              <p className={`text-[10px] font-black uppercase tracking-wider mb-3 ${tone.text}`}>
                Thứ tự trả theo phương pháp này
              </p>
              <div className="space-y-2">
                {orderedDebts.map((debt, index) => (
                  <div key={debt.id} className="flex items-center gap-2.5">
                    <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${index === 0 ? tone.iconBox : "bg-white/5 text-[var(--color-text-muted)]"}`}>
                      {index + 1}
                    </div>
                    <Link
                      to={`/debts/${debt.id}`}
                      className={`flex-1 text-[12px] font-bold truncate ${index === 0 ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"} ${tone.hover} transition-colors`}
                    >
                      {debt.name}
                    </Link>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${index === 0 ? `${tone.iconBox} ${tone.textSoft}` : "bg-white/5 text-[var(--color-text-muted)]"}`}>
                      {isAvalanche ? `${debt.apr}% APR` : formatVND(debt.balance)}
                    </span>
                    {index === 0 && (
                      <span className={`shrink-0 text-[10px] font-black ${tone.text}`}>
                        ← trước
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}
