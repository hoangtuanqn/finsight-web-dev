import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart2, Info, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import FormattedInput from '../../components/common/FormattedInput';
import { useDebtMutations } from '../../hooks/useDebtQuery';
import { calcAPY, calcEAR, formatPercent } from '../../utils/calculations';

const preprocessNumber = (schema: z.ZodTypeAny) =>
  z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    schema,
  ) as unknown as z.ZodNumber;

const debtSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên khoản vay.'),
    platform: z.string().default('SPAYLATER'),
    originalAmount: preprocessNumber(
      z.number({ message: 'Vui lòng nhập số tiền gốc.' }).min(0, 'Số tiền gốc không được âm.'),
    ),
    balance: preprocessNumber(z.number({ message: 'Vui lòng nhập dư nợ hiện tại.' }).min(0, 'Dư nợ không được âm')),
    apr: preprocessNumber(
      z.number({ message: 'Vui lòng nhập lãi suất.' }).min(0).max(100, 'Lãi suất APR không hợp lệ.'),
    ),
    rateType: z.enum(['FLAT', 'REDUCING']).default('FLAT'),
    feeProcessing: preprocessNumber(
      z.number({ message: 'Vui lòng nhập phí xử lý.' }).min(0).max(20, 'Phí xử lý không nên vượt quá 20%').default(0),
    ),
    feeInsurance: preprocessNumber(
      z
        .number({ message: 'Vui lòng nhập phí bảo hiểm.' })
        .min(0)
        .max(10, 'Phí bảo hiểm không nên vượt quá 10%')
        .default(0),
    ),
    feeManagement: preprocessNumber(
      z.number({ message: 'Vui lòng nhập phí quản lý.' }).min(0).max(5, 'Phí quản lý không nên vượt quá 5%').default(0),
    ),
    feePenaltyPerDay: preprocessNumber(z.number({ message: 'Vui lòng nhập phí phạt.' }).min(0).default(0.05)),
    minPayment: preprocessNumber(
      z.number({ message: 'Vui lòng nhập khoản trả tối thiểu.' }).min(0, 'Số tiền trả tối thiểu không được âm.'),
    ),
    dueDay: preprocessNumber(
      z
        .number({ message: 'Vui lòng nhập ngày (1-31).' })
        .int()
        .min(1, 'Ngày từ 1 đến 31.')
        .max(31, 'Ngày từ 1 đến 31.'),
    ),
    termMonths: preprocessNumber(
      z
        .number({ message: 'Vui lòng nhập kỳ hạn.' })
        .int()
        .min(0, 'Kỳ hạn không được âm.')
        .max(360, 'Kỳ hạn tối đa là 360 tháng (30 năm)'),
    ),
    startDate: z.string().min(1, 'Vui lòng chọn ngày vay.'),
  })
  .refine((data) => data.minPayment <= data.balance || data.balance === 0, {
    message: 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.',
    path: ['minPayment'],
  })
  .refine((data) => data.balance <= data.originalAmount || data.originalAmount === 0, {
    message: 'Dư nợ hiện tại không được lớn hơn số tiền gốc/hạn mức ban đầu.',
    path: ['balance'],
  })
  .refine((data) => data.balance === 0 || data.minPayment > 0, {
    message: 'Khoản trả tối thiểu phải lớn hơn 0 khi có dư nợ.',
    path: ['minPayment'],
  });

const PLATFORM_PRESETS = {
  // Installment Platforms
  SPAYLATER: {
    name: 'SPayLater',
    type: 'INSTALLMENT',
    apr: 18,
    rateType: 'FLAT',
    feeProcessing: 0,
    feeInsurance: 0,
    feeManagement: 0,
  },
  LAZPAYLATER: {
    name: 'LazPayLater',
    type: 'INSTALLMENT',
    apr: 18,
    rateType: 'FLAT',
    feeProcessing: 0,
    feeInsurance: 0,
    feeManagement: 0,
  },
  HOME_CREDIT: {
    name: 'Home Credit',
    type: 'INSTALLMENT',
    apr: 30,
    rateType: 'FLAT',
    feeProcessing: 1,
    feeInsurance: 0.5,
    feeManagement: 0,
  },
  FE_CREDIT: {
    name: 'FE Credit',
    type: 'INSTALLMENT',
    apr: 48,
    rateType: 'FLAT',
    feeProcessing: 5,
    feeInsurance: 1,
    feeManagement: 0.5,
  },
  CUSTOM: {
    name: 'Tự nhập',
    type: 'INSTALLMENT',
    apr: 0,
    rateType: 'FLAT',
    feeProcessing: 0,
    feeInsurance: 0,
    feeManagement: 0,
  },
  // Credit Card Platforms
  CREDIT_CARD: {
    name: 'Thẻ tín dụng',
    type: 'CREDIT_CARD',
    apr: 36,
    rateType: 'REDUCING',
    feeProcessing: 0,
    feeInsurance: 0,
    feeManagement: 0.5,
  },
  CUSTOM_CARD: {
    name: 'Tự nhập thẻ',
    type: 'CREDIT_CARD',
    apr: 0,
    rateType: 'REDUCING',
    feeProcessing: 0,
    feeInsurance: 0,
    feeManagement: 0,
  },
} as const;

function calcRemainingTerms(startDate: string, termMonths: number) {
  if (!startDate || !termMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, termMonths - monthsPassed);
}

export default function AddDebtPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const debtType = (searchParams.get('type') || 'INSTALLMENT') as 'INSTALLMENT' | 'CREDIT_CARD';
  const { createDebt, isCreating } = useDebtMutations();

  // Filter presets based on type
  const availablePresets = Object.entries(PLATFORM_PRESETS).filter(([, val]) => val.type === debtType);

  const defaultPlatform = debtType === 'INSTALLMENT' ? 'SPAYLATER' : 'CREDIT_CARD';
  const defaultPreset = PLATFORM_PRESETS[defaultPlatform as keyof typeof PLATFORM_PRESETS];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: '',
      platform: defaultPlatform,
      originalAmount: 0,
      balance: 0,
      apr: defaultPreset.apr,
      rateType: defaultPreset.rateType as 'FLAT' | 'REDUCING',
      feeProcessing: defaultPreset.feeProcessing,
      feeInsurance: defaultPreset.feeInsurance,
      feeManagement: defaultPreset.feeManagement,
      feePenaltyPerDay: 0.05,
      minPayment: 0,
      dueDay: 15,
      termMonths: debtType === 'INSTALLMENT' ? 12 : 0,
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const formValues = watch();
  const [isAutoCalcBalance, setIsAutoCalcBalance] = useState(true);

  const toNumberValue = (value: string | number) => (value === '' ? 0 : Number(value));

  const applyPreset = (key: string) => {
    const preset = PLATFORM_PRESETS[key as keyof typeof PLATFORM_PRESETS];
    setValue('platform', key);
    setValue('apr', preset.apr);
    setValue('rateType', preset.rateType as any);
    setValue('feeProcessing', preset.feeProcessing);
    setValue('feeInsurance', preset.feeInsurance);
    setValue('feeManagement', preset.feeManagement);
    if (debtType === 'CREDIT_CARD') {
      setValue('rateType', 'REDUCING');
    }
  };

  // Auto-calculate initial balance for Installment based on original amount + hidden fees
  useEffect(() => {
    if (debtType === 'INSTALLMENT' && isAutoCalcBalance && formValues.originalAmount > 0) {
      // Logic: Dư nợ ban đầu = Số tiền gốc + (Số tiền gốc * Phí xử lý) + (Số tiền gốc * Phí bảo hiểm)
      // Chú ý: Phí quản lý thường thu hàng tháng nên không cộng gộp vào gốc ban đầu.
      const fees = (formValues.feeProcessing + formValues.feeInsurance) / 100;
      const calculatedBalance = Math.round(formValues.originalAmount * (1 + fees));

      if (calculatedBalance !== formValues.balance) {
        setValue('balance', calculatedBalance, { shouldValidate: true });
      }
    }
  }, [
    formValues.originalAmount,
    formValues.feeProcessing,
    formValues.feeInsurance,
    debtType,
    isAutoCalcBalance,
    setValue,
  ]);

  const ear = calcEAR(
    formValues.apr,
    formValues.feeProcessing,
    formValues.feeInsurance,
    formValues.feeManagement,
    debtType === 'INSTALLMENT' ? formValues.termMonths : 12, // Default to 12 for credit card EAR calc
  );
  const apy = calcAPY(formValues.apr);
  const remaining = calcRemainingTerms(formValues.startDate, formValues.termMonths);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        debtType,
        remainingTerms: debtType === 'INSTALLMENT' ? (remaining ?? data.termMonths) : 0,
      };
      await createDebt(payload);
      navigate('/debts');
    } catch (err) {
      console.error(err);
    }
  };

  const getEarColorClass = (earValue: number) => {
    if (earValue <= 20) return 'text-emerald-400';
    if (earValue <= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const inputCls = (hasError: any) => `input-field ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      <div className="flex items-center gap-1.5 text-[12px] font-medium pt-2">
        <Link
          to="/debts"
          className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
        >
          Quản lý nợ
        </Link>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-[var(--color-text-primary)] font-bold">Thêm mới</span>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Thêm khoản nợ mới</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest">
            <Plus size={11} /> Khoản nợ mới ({debtType === 'INSTALLMENT' ? 'Vay trả góp' : 'Thẻ tín dụng'})
          </div>
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Nhập đầy đủ thông tin để tính toán EAR chính xác
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div
            className="relative rounded-3xl border overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}
          >
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="p-6">
              {/* Nền tảng */}
              <div className="mb-6">
                <label className="block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">
                  Nền tảng
                </label>
                <div className="flex flex-wrap gap-2">
                  {availablePresets.map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border cursor-pointer"
                      style={
                        formValues.platform === key
                          ? {
                              background: 'rgba(59,130,246,0.12)',
                              color: '#60a5fa',
                              borderColor: 'rgba(59,130,246,0.35)',
                              boxShadow: '0 0 10px rgba(59,130,246,0.15)',
                            }
                          : {
                              background: 'var(--color-bg-secondary)',
                              color: 'var(--color-text-muted)',
                              borderColor: 'var(--color-border)',
                            }
                      }
                    >
                      {val.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Thông tin cơ bản */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Tên khoản {debtType === 'INSTALLMENT' ? 'vay' : 'nợ'}</label>
                    <input
                      {...register('name')}
                      className={inputCls(errors.name)}
                      placeholder={debtType === 'INSTALLMENT' ? 'VD: Mua điện thoại' : 'VD: Thẻ Visa VIB'}
                    />
                    {errors.name && (
                      <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> {errors.name.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="input-label">
                      {debtType === 'INSTALLMENT' ? 'Số tiền gốc ban đầu' : 'Hạn mức thẻ'}
                    </label>
                    <Controller
                      name="originalAmount"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          kind="integer"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={inputCls(errors.originalAmount)}
                          placeholder="0"
                          suffix="đ"
                        />
                      )}
                    />
                    {errors.originalAmount && (
                      <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> {errors.originalAmount.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dư nợ và Lãi suất */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">
                      Dư nợ hiện tại
                      <span className="text-[10px] text-blue-400 font-normal ml-2 tracking-normal lowercase">
                        (Số tiền đang nợ)
                      </span>
                    </label>
                    <Controller
                      name="balance"
                      control={control}
                      render={({ field }) => (
                        <div className="relative">
                          <FormattedInput
                            kind="integer"
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(toNumberValue(value));
                              setIsAutoCalcBalance(false);
                            }}
                            className={inputCls(errors.balance)}
                            placeholder="0"
                            suffix="đ"
                          />
                          {debtType === 'INSTALLMENT' &&
                            !isAutoCalcBalance &&
                            formValues.originalAmount > 0 &&
                            formValues.balance < formValues.originalAmount && (
                              <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
                                <Info size={10} /> Dư nợ thấp hơn gốc? Bạn đã trả một phần rồi?
                              </p>
                            )}
                          {debtType === 'CREDIT_CARD' &&
                            formValues.originalAmount > 0 &&
                            (() => {
                              const usage = (formValues.balance / formValues.originalAmount) * 100;
                              if (usage > 85)
                                return (
                                  <p className="mt-1 text-[10px] text-rose-400 flex items-center gap-1 font-bold">
                                    <AlertTriangle size={10} /> Báo động: Bạn đã dùng {usage.toFixed(0)}% hạn mức. Cần
                                    kiểm soát chi tiêu!
                                  </p>
                                );
                              if (usage > 70)
                                return (
                                  <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                                    <Info size={10} /> Bạn đã dùng {usage.toFixed(0)}% hạn mức. Tỷ lệ cao có thể ảnh
                                    hưởng điểm tín dụng.
                                  </p>
                                );
                              return null;
                            })()}
                        </div>
                      )}
                    />
                    {errors.balance && (
                      <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> {errors.balance.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="input-label">Lãi suất APR (%/năm)</label>
                    <Controller
                      name="apr"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          kind="decimal"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={inputCls(errors.apr)}
                          placeholder="0"
                          suffix="%"
                        />
                      )}
                    />
                    {errors.apr && (
                      <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> {errors.apr.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trả tối thiểu và Hình thức lãi */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Khoản trả tối thiểu/tháng</label>
                    <Controller
                      name="minPayment"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          kind="integer"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={inputCls(errors.minPayment)}
                          placeholder="0"
                          suffix="đ"
                        />
                      )}
                    />
                    {errors.minPayment && (
                      <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> {errors.minPayment.message as string}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="input-label">Hình thức tính lãi</label>
                    {debtType === 'CREDIT_CARD' ? (
                      <div className="px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-white/[0.02] text-sm text-[var(--color-text-secondary)]">
                        Reducing (Dư nợ giảm dần)
                      </div>
                    ) : (
                      <select {...register('rateType')} className={inputCls(errors.rateType)}>
                        <option value="FLAT">Flat (Lãi trên gốc ban đầu)</option>
                        <option value="REDUCING">Reducing (Dư nợ giảm dần)</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Phí ẩn */}
                <div className="h-px bg-white/[0.06] my-2" />
                <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wide">Phí ẩn & Phí phạt</p>
                <div className="grid grid-cols-3 gap-4">
                  {debtType === 'INSTALLMENT' && (
                    <div>
                      <label className="input-label">Phí xử lý hồ sơ (%)</label>
                      <Controller
                        name="feeProcessing"
                        control={control}
                        render={({ field }) => (
                          <FormattedInput
                            kind="decimal"
                            value={field.value}
                            onValueChange={(value) => field.onChange(toNumberValue(value))}
                            className={inputCls(errors.feeProcessing)}
                            placeholder="0"
                            suffix="%"
                          />
                        )}
                      />
                    </div>
                  )}

                  <div>
                    <label className="input-label">Phí bảo hiểm (%/năm)</label>
                    <Controller
                      name="feeInsurance"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          kind="decimal"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={inputCls(errors.feeInsurance)}
                          placeholder="0"
                          suffix="%"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="input-label">Phí quản lý (%/năm)</label>
                    <Controller
                      name="feeManagement"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          kind="decimal"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={inputCls(errors.feeManagement)}
                          placeholder="0"
                          suffix="%"
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Ngày tháng */}
                <div className="grid grid-cols-3 gap-4">
                  {debtType === 'INSTALLMENT' && (
                    <>
                      <div>
                        <label className="input-label">Ngày vay</label>
                        <input
                          type="date"
                          {...register('startDate')}
                          className={inputCls(errors.startDate)}
                          max={new Date().toISOString().split('T')[0]}
                        />
                        {errors.startDate && (
                          <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                            <AlertTriangle size={11} /> {errors.startDate.message as string}
                          </p>
                        )}
                        {formValues.startDate &&
                          new Date(formValues.startDate) <
                            new Date(new Date().setFullYear(new Date().getFullYear() - 1)) && (
                            <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
                              <Info size={10} /> Ngày vay cách đây hơn 1 năm? Hãy kiểm tra lại.
                            </p>
                          )}
                      </div>
                      <div>
                        <label className="input-label">Kỳ hạn (tháng)</label>
                        <input
                          type="number"
                          {...register('termMonths', { valueAsNumber: true })}
                          className={inputCls(errors.termMonths)}
                        />
                        {errors.termMonths && (
                          <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                            <AlertTriangle size={11} /> {errors.termMonths.message as string}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="input-label">Ngày thanh toán hàng tháng</label>
                    <input
                      type="number"
                      {...register('dueDay', { valueAsNumber: true })}
                      className={inputCls(errors.dueDay)}
                      placeholder="VD: 15"
                    />
                    {errors.dueDay && (
                      <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> {errors.dueDay.message as string}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-4">
                  {debtType === 'INSTALLMENT' && (
                    <div>
                      <label className="input-label">Kỳ còn lại</label>
                      <div
                        className={`input-field bg-white/[0.02] text-slate-400 cursor-not-allowed ${remaining === 0 ? 'text-red-400' : ''}`}
                      >
                        {formValues.startDate && formValues.termMonths
                          ? remaining === 0
                            ? 'Đã hết hạn'
                            : `${remaining} tháng`
                          : '-'}
                      </div>
                    </div>
                  )}
                  <div
                    className={`${debtType === 'INSTALLMENT' ? 'col-span-2' : 'col-span-3'} flex items-end gap-3 pb-px mt-4`}
                  >
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-60"
                    >
                      {isCreating ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Lưu khoản nợ
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/debts')}
                      className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Cột Xem trước chi phí */}
        <div>
          <div
            className="relative rounded-3xl border p-5 sticky top-24 overflow-hidden"
            style={{
              background: 'var(--color-bg-card)',
              borderColor: 'rgba(239,68,68,0.18)',
              boxShadow: '0 4px 20px rgba(239,68,68,0.06)',
            }}
          >
            <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 bg-red-500" />
            <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
              <BarChart2 size={15} className="text-red-400" /> Xem trước chi phí
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--color-text-muted)]">APR (quảng cáo)</span>
                <span className="text-[13px] font-black text-blue-400">{formatPercent(formValues.apr)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-[var(--color-text-muted)]">APY (lãi kép)</span>
                <span className="text-[13px] font-black text-purple-400">{formatPercent(apy)}</span>
              </div>
              <div className="h-px" style={{ background: 'var(--color-border)' }} />
              <div className="flex justify-between items-center">
                <span className="text-[13px] font-black text-[var(--color-text-primary)]">EAR (thực tế)</span>
                <span className={`text-xl font-black ${getEarColorClass(ear)}`}>{formatPercent(ear)}</span>
              </div>
              {ear > formValues.apr && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/6 mt-4">
                  <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-400 font-medium">
                    Chi phí ẩn: <span className="font-black">+{formatPercent(ear - formValues.apr)}</span> so với quảng
                    cáo
                  </p>
                </div>
              )}

              <div className="h-px bg-white/[0.06] my-4" />
              <div className="space-y-2">
                <span className="text-[12px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider block mb-2">
                  Ước tính trả nợ
                </span>
                {debtType === 'INSTALLMENT' ? (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <p className="text-[11px] text-blue-300/80 mb-1">Tổng chi phí dự kiến (Gốc + Lãi + Phí)</p>
                    <p className="text-[14px] font-black text-blue-400">
                      {formValues.minPayment && formValues.termMonths
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                            formValues.minPayment * formValues.termMonths,
                          )
                        : 'Chưa đủ dữ liệu'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <p className="text-[11px] text-yellow-300/80 mb-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> Thẻ tín dụng
                    </p>
                    <p className="text-[12px] font-medium text-yellow-400">
                      Lãi suất kép được tính dựa trên dư nợ hiện tại. Chỉ trả mức tối thiểu sẽ kéo dài thời gian trả nợ
                      rất lâu.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
