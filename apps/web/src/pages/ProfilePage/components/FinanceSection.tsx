import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { DollarSign, TrendingDown, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import FormattedInput from "../../../components/common/FormattedInput";
import { LABEL_CLASSES, INPUT_CLASSES } from "../constants";

interface FinanceSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function FinanceSection({ control, errors }: FinanceSectionProps) {
  const inputCls = (hasError: any) =>
    `${INPUT_CLASSES} ${hasError ? "border-red-500/60 focus:border-red-500 ring-2 ring-red-500/10" : "focus:ring-2 focus:ring-blue-500/10"}`;

  return (
    <div className="space-y-5">
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
                onValueChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
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
                onValueChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
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
        <label className={LABEL_CLASSES}>Tổng vốn khả dụng (Tiền mặt/Tiết kiệm)</label>
        <Controller
          name="capital"
          control={control}
          render={({ field }) => (
            <FormattedInput
              icon={Wallet}
              kind="integer"
              value={field.value}
              onValueChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
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
          <Controller
            name="savingsRate"
            control={control}
            render={({ field }) => (
              <FormattedInput
                icon={TrendingUp}
                kind="decimal"
                value={field.value}
                onValueChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                className={inputCls(errors.savingsRate)}
                placeholder="6,0"
                suffix="%"
              />
            )}
          />
        </div>
        <div>
          <label className={LABEL_CLASSES}>Mức lạm phát kỳ vọng (%)</label>
          <Controller
            name="inflationRate"
            control={control}
            render={({ field }) => (
              <FormattedInput
                icon={AlertTriangle}
                kind="decimal"
                value={field.value}
                onValueChange={(v) => field.onChange(v === "" ? 0 : Number(v))}
                className={inputCls(errors.inflationRate)}
                placeholder="3,5"
                suffix="%"
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
