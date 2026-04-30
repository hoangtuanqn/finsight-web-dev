import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Controller } from "react-hook-form";
import {
  User,
  Mail,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Rocket,
  CheckCircle,
  Wallet,
  Shield,
  TrendingUp,
} from "lucide-react";
import FormattedInput from "../../../components/common/FormattedInput";
import {
  LABEL_CLASSES,
  INPUT_CLASSES,
  HORIZON_OPTIONS,
  SELECT_CLASSES,
  RISK_META,
} from "../constants";
import { formInputClass } from "../../../components/common/formStyles";

// Helper for Section Header
function SectionHeader({ dot, label }: { dot: string; label: string }) {
  return (
    <h3
      className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-4"
      style={{ color: dot }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: dot }}
      />
      {label}
    </h3>
  );
}

interface ProfileFormProps {
  register: any;
  handleSubmit: any;
  control: any;
  errors: any;
  onSubmit: (data: any) => void;
  loading: boolean;
  saved: boolean;
  user: any;
  hasCompletedQuiz: boolean;
}

export function ProfileForm({
  register,
  handleSubmit,
  control,
  errors,
  onSubmit,
  loading,
  saved,
  user,
  hasCompletedQuiz,
}: ProfileFormProps) {
  const riskLevel = user?.investorProfile?.riskLevel || "MEDIUM";
  const riskMeta = RISK_META[riskLevel as keyof typeof RISK_META];

  const inputCls = formInputClass;

  return (
    <div
      className="relative rounded-3xl border overflow-hidden shadow-xl shadow-blue-500/5"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
      <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-[14px] font-bold text-emerald-400 shadow-sm"
          >
            <CheckCircle size={18} className="shrink-0" />
            <div>
              <p>Cập nhật thành công!</p>
              <p className="text-[11px] font-medium opacity-80">
                Thông tin của bạn đã được AI ghi nhận.
              </p>
            </div>
          </motion.div>
        )}

        {/* Section 1: Basic Info */}
        <div className="space-y-5">
          <SectionHeader dot="#3b82f6" label="Thông tin cá nhân" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL_CLASSES}>Họ và tên</label>
              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-blue-500 transition-colors"
                />
                <input
                  {...register("fullName")}
                  className={inputCls(errors.fullName) + " pl-11"}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              {errors.fullName && (
                <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle size={12} /> {errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL_CLASSES}>Email định danh</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] opacity-50"
                />
                <input
                  type="email"
                  value={user?.email || ""}
                  className={
                    INPUT_CLASSES +
                    " pl-11 opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]/50"
                  }
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent opacity-50" />

        {/* Section 2: Finance */}
        <div className="space-y-5">
          <SectionHeader dot="#10b981" label="Tài chính & Thu nhập" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL_CLASSES}>Thu nhập hằng tháng</label>
                <Controller
                  name="monthlyIncome"
                  control={control}
                  render={({ field }) => (
                    <FormattedInput
                      icon={DollarSign}
                      kind="integer"
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v === "" ? 0 : Number(v))
                      }
                      className={inputCls(errors.monthlyIncome)}
                      placeholder="0"
                      suffix="đ"
                    />
                  )}
                />
              {errors.monthlyIncome && (
                <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle size={12} /> {errors.monthlyIncome.message}
                </p>
              )}
            </div>
            <div>
              <label className={LABEL_CLASSES}>Khả năng trả nợ thêm</label>
                <Controller
                  name="extraBudget"
                  control={control}
                  render={({ field }) => (
                    <FormattedInput
                      icon={TrendingDown}
                      kind="integer"
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v === "" ? 0 : Number(v))
                      }
                      className={inputCls(errors.extraBudget)}
                      placeholder="0"
                      suffix="đ"
                    />
                  )}
                />
              {errors.extraBudget && (
                <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5 font-medium">
                  <AlertTriangle size={12} /> {errors.extraBudget.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className={LABEL_CLASSES}>
              Tổng vốn khả dụng (Tiền mặt/Tiết kiệm)
            </label>
                <Controller
                  name="capital"
                  control={control}
                  render={({ field }) => (
                    <FormattedInput
                      icon={Wallet}
                      kind="integer"
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v === "" ? 0 : Number(v))
                      }
                      className={inputCls(errors.capital)}
                      placeholder="100.000.000"
                      suffix="đ"
                    />
                  )}
                />
            {errors.capital && (
              <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1.5 font-medium">
                <AlertTriangle size={12} /> {errors.capital.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={LABEL_CLASSES}>Lãi suất ngân hàng (%)</label>
              <div className="relative group">
                <Controller
                  name="savingsRate"
                  control={control}
                  render={({ field }) => (
                    <FormattedInput
                      icon={TrendingUp}
                      kind="decimal"
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v === "" ? 0 : Number(v))
                      }
                      className={inputCls(errors.savingsRate)}
                      placeholder="6,0"
                      suffix="%"
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Mức lạm phát kỳ vọng (%)</label>
              <div className="relative group">
                <Controller
                  name="inflationRate"
                  control={control}
                  render={({ field }) => (
                    <FormattedInput
                      icon={AlertTriangle}
                      kind="decimal"
                      value={field.value}
                      onValueChange={(v) =>
                        field.onChange(v === "" ? 0 : Number(v))
                      }
                      className={inputCls(errors.inflationRate)}
                      placeholder="3,5"
                      suffix="%"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent opacity-50" />

        {/* Section 3: Investment */}
        <div className="space-y-5">
          <SectionHeader dot="#f59e0b" label="Định hướng đầu tư" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className={LABEL_CLASSES}>Mục tiêu tài chính</label>
              <select className={SELECT_CLASSES} {...register("goal")}>
                <option value="GROWTH">Tăng trưởng tài sản</option>
                <option value="INCOME">Tạo dòng tiền thụ động</option>
                <option value="STABILITY">Bảo toàn vốn</option>
                <option value="SPECULATION">Đầu cơ mạo hiểm</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLASSES}>Thời hạn đầu tư</label>
              <select className={SELECT_CLASSES} {...register("horizon")}>
                {HORIZON_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL_CLASSES}>
                Khẩu vị rủi ro{" "}
                {hasCompletedQuiz && (
                  <span className="normal-case font-medium text-emerald-500 ml-1">
                    (Từ Quiz)
                  </span>
                )}
              </label>
              <select className={SELECT_CLASSES} {...register("riskLevel")}>
                <option value="LOW">Thấp - An toàn</option>
                <option value="MEDIUM">Vừa phải - Cân bằng</option>
                <option value="HIGH">Cao - Mạo hiểm</option>
              </select>
              {hasCompletedQuiz && (
                <p
                  className="text-[10px] mt-2 font-bold tracking-tight uppercase"
                  style={{ color: riskMeta.color }}
                >
                  AI gợi ý: {riskMeta.label}
                </p>
              )}
            </div>
          </div>
          {!hasCompletedQuiz && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-inner"
            >
              <AlertTriangle
                size={18}
                className="text-amber-400 shrink-0 mt-0.5"
              />
              <div className="space-y-1">
                <p className="text-[13px] text-amber-200 font-bold">
                  Chưa hoàn thành đánh giá rủi ro
                </p>
                <p className="text-[12px] text-amber-300/80 font-medium">
                  Hãy làm bài kiểm tra 10 câu hỏi để AI thấu hiểu phong cách đầu
                  tư của bạn hơn.{" "}
                  <Link
                    to="/risk-assessment"
                    className="font-black text-amber-400 underline decoration-2 underline-offset-4 hover:text-amber-200 transition-all"
                  >
                    Làm ngay →
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="pt-6 border-t border-[var(--color-border)]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-10 py-3.5 rounded-2xl bg-blue-600 text-white font-black text-[15px] hover:bg-blue-500 hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-blue-600/30 cursor-pointer disabled:opacity-60 disabled:scale-100 disabled:hover:bg-blue-600"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  <Rocket size={18} /> Cập nhật hồ sơ
                </>
              )}
            </button>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <Shield size={16} className="text-blue-400" />
              <p className="text-[11px] text-[var(--color-text-muted)] font-medium leading-relaxed max-w-[300px]">
                Dữ liệu tài chính của bạn được mã hoá và chỉ sử dụng cho mục
                đích <strong>tư vấn AI cá nhân hóa</strong>.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
