import { motion } from "framer-motion";
import { Lock, Info } from "lucide-react";

interface AssetConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
  alwaysLocked?: boolean;
  lockedReason?: string;
}

const ASSET_CONFIGS: AssetConfig[] = [
  {
    key: "savings",
    label: "Tiết kiệm",
    emoji: "🏦",
    color: "#10b981",
    borderColor: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    description: "Gửi tiết kiệm ngân hàng, lãi suất ổn định, rủi ro gần bằng 0.",
    alwaysLocked: true,
    lockedReason: "Tiết kiệm là tài sản nền tảng, không thể loại trừ.",
  },
  {
    key: "gold",
    label: "Vàng",
    emoji: "🥇",
    color: "#f59e0b",
    borderColor: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    description: "Vàng vật lý / ETF vàng, bảo vệ giá trị chống lạm phát.",
  },
  {
    key: "stocks",
    label: "Cổ phiếu VN",
    emoji: "📈",
    color: "#3b82f6",
    borderColor: "border-blue-500/40",
    bgColor: "bg-blue-500/10",
    description: "VN-Index / VN30 ETF, cổ phiếu niêm yết Việt Nam.",
  },
  {
    key: "stocks_us",
    label: "Cổ phiếu Mỹ",
    emoji: "🇺🇸",
    color: "#ef4444",
    borderColor: "border-red-500/40",
    bgColor: "bg-red-500/10",
    description: "S&P 500 / SPY ETF, thị trường chứng khoán Hoa Kỳ.",
  },
  {
    key: "bonds",
    label: "Trái phiếu",
    emoji: "📄",
    color: "#8b5cf6",
    borderColor: "border-violet-500/40",
    bgColor: "bg-violet-500/10",
    description: "Trái phiếu Chính phủ VN, lãi suất cố định, rủi ro thấp.",
  },
  {
    key: "crypto",
    label: "Crypto",
    emoji: "₿",
    color: "#f97316",
    borderColor: "border-orange-500/40",
    bgColor: "bg-orange-500/10",
    description: "Bitcoin / Crypto, rủi ro cao, tiềm năng sinh lời lớn.",
  },
];

interface AssetFilterPanelProps {
  excludedAssets: string[];
  onChange: (excluded: string[]) => void;
  riskLevel?: string;
  /**
   * Read-only mode: shows which assets are active in the CURRENT strategy.
   * No toggle interaction allowed. Used on the main investment page.
   */
  locked?: boolean;
}

export default function AssetFilterPanel({
  excludedAssets,
  onChange,
  riskLevel,
  locked = false,
}: AssetFilterPanelProps) {
  const selectedCount =
    ASSET_CONFIGS.length - excludedAssets.length - 1; // -1 for savings
  const canDeselect = selectedCount > 1;

  const toggle = (key: string) => {
    if (locked) return;
    const isExcluded = excludedAssets.includes(key);
    if (isExcluded) {
      onChange(excludedAssets.filter((a) => a !== key));
    } else {
      if (!canDeselect) return;
      onChange([...excludedAssets, key]);
    }
  };

  const isSelected = (key: string) => !excludedAssets.includes(key);

  return (
    <div className={[
      "rounded-2xl border p-4 transition-all duration-200",
      locked
        ? "border-white/5 bg-slate-900/30"
        : "border-white/8 bg-slate-900/50 backdrop-blur-sm",
    ].join(" ")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Tài sản đầu tư</span>
          {locked ? (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Lock size={10} />
              chiến lược hiện tại
            </span>
          ) : (
            <span className="text-xs text-slate-400">— chọn kênh bạn muốn tối ưu</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5">
          <div className={[
            "w-1.5 h-1.5 rounded-full",
            locked ? "bg-slate-500" : "bg-emerald-400 animate-pulse",
          ].join(" ")} />
          <span className="text-xs text-slate-400">
            {ASSET_CONFIGS.length - excludedAssets.length}/{ASSET_CONFIGS.length} tài sản
          </span>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ASSET_CONFIGS.map((asset) => {
          const selected = isSelected(asset.key);
          const isAlwaysLocked = asset.alwaysLocked;
          const atMin = !canDeselect && selected && !isAlwaysLocked && !locked;
          // In locked mode, everything is pointer-events-none
          const isInteractive = !locked && !isAlwaysLocked && !atMin;

          return (
            <motion.button
              key={asset.key}
              onClick={() => isInteractive && toggle(asset.key)}
              whileTap={isInteractive ? { scale: 0.94 } : {}}
              disabled={locked || isAlwaysLocked || atMin}
              title={
                locked
                  ? selected
                    ? `${asset.label} — đang được phân bổ trong chiến lược`
                    : `${asset.label} — không có trong chiến lược này`
                  : isAlwaysLocked
                  ? asset.lockedReason
                  : atMin
                  ? "Phải giữ ít nhất 1 tài sản khác ngoài Tiết kiệm"
                  : asset.description
              }
              className={[
                "relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all duration-200 text-center select-none",
                selected
                  ? `${asset.bgColor} ${asset.borderColor}`
                  : "bg-slate-800/60 border-white/5 opacity-35",
                locked
                  ? "cursor-default"
                  : isAlwaysLocked
                  ? "cursor-default"
                  : atMin
                  ? "cursor-not-allowed"
                  : "cursor-pointer hover:brightness-110",
              ].join(" ")}
            >
              {/* Indicators */}
              {locked && !selected && (
                <div className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-white/8 flex items-center justify-center">
                  <span className="text-[7px] text-slate-600">✕</span>
                </div>
              )}
              {!locked && isAlwaysLocked && (
                <Lock size={10} className="absolute top-1.5 right-1.5 text-slate-500" />
              )}
              {!locked && !selected && !isAlwaysLocked && (
                <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-[8px] text-slate-400">✕</span>
                </div>
              )}

              <span className="text-xl leading-none">{asset.emoji}</span>
              <span
                className="text-[10px] font-semibold leading-tight"
                style={{ color: selected ? asset.color : "#475569" }}
              >
                {asset.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Warning — only in edit mode */}
      {!locked && riskLevel === "LOW" && excludedAssets.includes("bonds") && (
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Info size={13} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-300">
            Với khẩu vị rủi ro thấp, Trái phiếu thường là kênh phòng thủ quan trọng. Bạn có chắc muốn loại trừ?
          </p>
        </div>
      )}

      {/* Min selection hint — only in edit mode */}
      {!locked && !canDeselect && (
        <p className="mt-2 text-center text-[10px] text-slate-500">
          Cần ít nhất 1 tài sản ngoài Tiết kiệm để tối ưu danh mục
        </p>
      )}
    </div>
  );
}
