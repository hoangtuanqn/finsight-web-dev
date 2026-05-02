import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart2, Calendar, Clock, CreditCard, Info, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import FormattedInput from '../../components/common/FormattedInput';
import { useDebt, useDebtMutations } from '../../hooks/useDebtQuery';
import { calcAPY, calcEAR, calculateMonthlyPayment, formatPercent } from '../../utils/calculations';

const preprocessNumber = (schema: z.ZodTypeAny) =>
  z.preprocess(
    (v) => (v === '' || v === null || (typeof v === 'number' && isNaN(v)) ? undefined : v),
    schema,
  ) as unknown as z.ZodNumber;

const debtSchema = z
  .object({
    name: z.string().min(1, 'Vui lòng nhập tên khoản vay.'),
    platform: z.string().default('CUSTOM'),
    originalAmount: preprocessNumber(
      z.number({ message: 'Vui lòng nhập số tiền gốc/hạn mức.' }).min(0, 'Số tiền gốc không được âm.'),
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
    minPayment: preprocessNumber(
      z.number({ message: 'Vui lòng nhập khoản trả tối thiểu.' }).min(0, 'Số tiền trả tối thiểu không được âm.'),
    ),
    termMonths: preprocessNumber(
      z
        .number({ message: 'Vui lòng nhập kỳ hạn.' })
        .int()
        .min(0, 'Kỳ hạn không được âm.')
        .max(360, 'Kỳ hạn tối đa là 360 tháng (30 năm)'),
    ),
    remainingTerms: preprocessNumber(z.number({ message: 'Vui lòng nhập số kỳ còn lại.' }).int().min(0)),
    dueDay: preprocessNumber(
      z
        .number({ message: 'Vui lòng nhập ngày (1-31).' })
        .int()
        .min(1, 'Ngày từ 1 đến 31.')
        .max(31, 'Ngày từ 1 đến 31.'),
    ),
    startDate: z.string().optional(),
  })
  .refine((data) => data.minPayment <= data.balance || data.balance === 0, {
    message: 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.',
    path: ['minPayment'],
  })
  .refine(
    (data) => {
      // For Credit Card, balance must not exceed limit
      // For Installment, balance can be originalAmount + setup fees
      const setupFees = (data.feeProcessing || 0) + (data.feeInsurance || 0);
      const maxAllowed = data.originalAmount === 0 ? 0 : Math.round(data.originalAmount * (1 + setupFees / 100));

      return data.balance <= maxAllowed || data.originalAmount === 0;
    },
    {
      message: 'Dư nợ hiện tại không được lớn hơn tổng tiền gốc kèm phí ban đầu.',
      path: ['balance'],
    },
  )
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

export default function EditDebtPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading: fetching } = useDebt(id!) as { data: any; isLoading: boolean };
  const { updateDebt, isUpdating } = useDebtMutations() as any;
  const [debtType, setDebtType] = useState<'INSTALLMENT' | 'CREDIT_CARD'>('INSTALLMENT');
  const [loanStatus, setLoanStatus] = useState<'NEW' | 'EXISTING'>('EXISTING');
  const [isAutoCalcBalance, setIsAutoCalcBalance] = useState(true);

  const {
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    register,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(debtSchema),
  });

  const formValues = watch();
  const toNumberValue = (value: string | number) => (value === '' ? 0 : Number(value));

  useEffect(() => {
    if (data?.debt) {
      const type =
        data.debt.debtType ||
        (data.debt.platform === 'CREDIT_CARD' || data.debt.termMonths === 0 ? 'CREDIT_CARD' : 'INSTALLMENT');
      setDebtType(type);

      // Infer loanStatus: if no payments made yet (remainingTerms === termMonths) → NEW
      if (type === 'INSTALLMENT') {
        const isNew =
          data.debt.remainingTerms != null &&
          data.debt.termMonths != null &&
          data.debt.remainingTerms === data.debt.termMonths;
        setLoanStatus(isNew ? 'NEW' : 'EXISTING');
        setIsAutoCalcBalance(isNew);
      }

      reset({
        name: data.debt.name,
        platform: data.debt.platform,
        originalAmount: data.debt.originalAmount,
        balance: data.debt.balance,
        apr: data.debt.apr,
        rateType: data.debt.rateType,
        feeProcessing: data.debt.feeProcessing,
        feeInsurance: data.debt.feeInsurance,
        feeManagement: data.debt.feeManagement,
        minPayment: data.debt.minPayment,
        dueDay: data.debt.dueDay,
        termMonths: data.debt.termMonths,
        remainingTerms: data.debt.remainingTerms,
        startDate: data.debt.startDate ? new Date(data.debt.startDate).toISOString().split('T')[0] : '',
      });
    }
  }, [data, reset]);

  const applyPreset = (platform: keyof typeof PLATFORM_PRESETS) => {
    const preset = PLATFORM_PRESETS[platform];
    setValue('platform', platform);
    setValue('apr', preset.apr);
    setValue('rateType', preset.rateType as any);
    setValue('feeProcessing', preset.feeProcessing);
    setValue('feeInsurance', preset.feeInsurance);
    setValue('feeManagement', preset.feeManagement);

    if (preset.type === 'CREDIT_CARD') {
      setDebtType('CREDIT_CARD');
      setValue('termMonths', 0);
      setValue('remainingTerms', 0);
    } else {
      setDebtType('INSTALLMENT');
      if (formValues.termMonths === 0) setValue('termMonths', 12);
    }
  };

  const suggestedMinPayment = calculateMonthlyPayment({
    principal: formValues.originalAmount || 0,
    apr: formValues.apr || 0,
    termMonths: formValues.termMonths || 1,
    rateType: formValues.rateType as 'FLAT' | 'REDUCING',
    feeManagement: formValues.feeManagement || 0,
  });

  // Sync minPayment with suggested value for Installment
  useEffect(() => {
    if (debtType === 'INSTALLMENT' && suggestedMinPayment > 0) {
      if (formValues.minPayment !== suggestedMinPayment) {
        setValue('minPayment', suggestedMinPayment, { shouldValidate: true });
      }
    }
  }, [debtType, suggestedMinPayment, formValues.minPayment, setValue]);

  // Auto-calculate initial balance for Installment based on original amount + hidden fees
  useEffect(() => {
    if (debtType === 'INSTALLMENT' && isAutoCalcBalance && formValues.originalAmount > 0) {
      if (loanStatus === 'NEW') {
        const fees = (formValues.feeProcessing + formValues.feeInsurance) / 100;
        const calculatedBalance = Math.round(formValues.originalAmount * (1 + fees));

        if (calculatedBalance !== formValues.balance) {
          setValue('balance', calculatedBalance, { shouldValidate: true });
        }
      }
    }
  }, [
    formValues.originalAmount,
    formValues.feeProcessing,
    formValues.feeInsurance,
    formValues.balance,
    isAutoCalcBalance,
    loanStatus,
    debtType,
    setValue,
  ]);

  // Auto-suggest paid terms based on startDate
  const suggestedPaidTerms = useMemo(() => {
    if (!formValues.startDate || debtType !== 'INSTALLMENT') return 0;
    const start = new Date(formValues.startDate);
    const now = new Date();
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return Math.min(Math.max(0, months), formValues.termMonths || 0);
  }, [formValues.startDate, formValues.termMonths, debtType]);

  const ear = calcEAR(
    formValues.apr || 0,
    formValues.feeProcessing || 0,
    formValues.feeInsurance || 0,
    formValues.feeManagement || 0,
    debtType === 'INSTALLMENT' ? formValues.termMonths || 12 : 12,
  );
  const apy = calcAPY(formValues.apr || 0);

  const onSubmit = async (formData: any) => {
    try {
      const payload = {
        ...formData,
        debtType,
        dueDay: Math.round(formData.dueDay),
        termMonths: debtType === 'CREDIT_CARD' ? 0 : Math.round(formData.termMonths),
        remainingTerms: debtType === 'CREDIT_CARD' ? 0 : Math.round(formData.remainingTerms),
        rateType: debtType === 'CREDIT_CARD' ? 'REDUCING' : formData.rateType,
      };

      await updateDebt({
        id: id!,
        data: payload,
      });
      toast.success('Cập nhật khoản nợ thành công');
      navigate(`/debts/${id}`);
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi cập nhật');
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getEarColorClass = (earValue: number) => {
    if (earValue <= 20) return 'text-emerald-400';
    if (earValue <= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const inputCls = (hasError: any) => `input-field ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/debts" className="text-slate-500 hover:text-slate-300 transition-colors">
          Quản lý nợ
        </Link>
        <span className="text-slate-700">/</span>
        <Link to={`/debts/${id}`} className="text-slate-500 hover:text-slate-300 transition-colors">
          Chi tiết
        </Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Chỉnh sửa</span>
      </div>
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Chỉnh sửa khoản nợ</h1>
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1 mb-6">
          Cập nhật thông tin chi tiết cho khoản nợ của bạn
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 p-4 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
        {/* Debt Type Badge */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Loại nợ:</span>
          {debtType === 'INSTALLMENT' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Calendar size={12} />
              <span className="text-[11px] font-black uppercase">Vay Trả Góp</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <CreditCard size={12} />
              <span className="text-[11px] font-black uppercase">Thẻ Tín Dụng</span>
            </div>
          )}
        </div>

        {/* Loan Status Badge */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Trạng thái:</span>
          {loanStatus === 'NEW' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Plus size={12} className="animate-pulse" />
              <span className="text-[11px] font-black uppercase">Vừa bắt đầu</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clock size={12} />
              <span className="text-[11px] font-black uppercase">Đang trả dở</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 md:p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
                <Info size={18} className="text-blue-400" /> Thông tin cơ bản
              </h2>
              <p className="text-slate-400 text-xs">Cập nhật các thông số gốc của khoản nợ</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Tên khoản {debtType === 'INSTALLMENT' ? 'vay' : 'nợ'}</label>
                  <input
                    {...register('name')}
                    className={inputCls(errors.name)}
                    placeholder="VD: Vay mua xe, Thẻ VPBank..."
                  />
                  {errors.name && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="input-label">
                    {debtType === 'CREDIT_CARD' ? 'Hạn mức thẻ' : 'Số tiền vay gốc'}
                  </label>
                  <Controller
                    name="originalAmount"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput
                        kind="integer"
                        value={field.value}
                        onValueChange={(v) => field.onChange(toNumberValue(v))}
                        className={inputCls(errors.originalAmount)}
                        placeholder="0"
                        suffix="đ"
                      />
                    )}
                  />
                  {errors.originalAmount && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.originalAmount.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Kỳ hạn và Ngày tháng */}
              <div
                className={`grid grid-cols-1 md:${debtType === 'INSTALLMENT' ? 'grid-cols-3' : 'grid-cols-2'} gap-6`}
              >
                <div>
                  <label className="input-label">Ngày vay</label>
                  <input
                    type="date"
                    {...register('startDate')}
                    className={inputCls(errors.startDate)}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.startDate && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.startDate.message}
                    </p>
                  )}
                </div>

                {debtType === 'INSTALLMENT' && (
                  <div>
                    <label className="input-label">Kỳ hạn (tháng)</label>
                    <input
                      type="number"
                      {...register('termMonths', { valueAsNumber: true })}
                      className={inputCls(errors.termMonths)}
                      placeholder="12"
                    />
                    {errors.termMonths && (
                      <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                        <AlertTriangle size={12} /> {errors.termMonths.message}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="input-label">
                    {debtType === 'CREDIT_CARD' ? 'Ngày chốt sao kê' : 'Ngày thanh toán hàng tháng'}
                  </label>
                  <input
                    type="number"
                    {...register('dueDay', { valueAsNumber: true })}
                    className={inputCls(errors.dueDay)}
                    placeholder="VD: 15"
                  />
                  {errors.dueDay && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.dueDay.message}
                    </p>
                  )}
                </div>
              </div>

              {debtType === 'INSTALLMENT' && (
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-3">
                  {/* Label row: title + startDate hint + suggestion button */}
                  <div className="flex items-center gap-2">
                    <label className="input-label mb-0 shrink-0">Số kỳ đã trả</label>
                    {formValues.startDate && (
                      <span className="text-[10px] text-slate-500 italic flex items-center gap-1">
                        <Info size={9} />
                        từ {new Date(formValues.startDate).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                    <div className="ml-auto">
                      {suggestedPaidTerms > 0 &&
                        suggestedPaidTerms !== (formValues.termMonths || 0) - (formValues.remainingTerms || 0) && (
                          <button
                            type="button"
                            onClick={() =>
                              setValue('remainingTerms', Math.max(0, (formValues.termMonths || 0) - suggestedPaidTerms))
                            }
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 px-2 py-0.5 rounded-full transition-all bg-blue-500/5 hover:bg-blue-500/10"
                          >
                            Gợi ý: {suggestedPaidTerms} kỳ — Áp dụng?
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Input */}
                  <input
                    type="number"
                    value={(formValues.termMonths || 0) - (formValues.remainingTerms || 0)}
                    onChange={(e) => {
                      const paid = Number(e.target.value);
                      setValue('remainingTerms', Math.max(0, (formValues.termMonths || 0) - paid));
                    }}
                    className="input-field"
                    min={0}
                    max={formValues.termMonths || 0}
                  />

                  {/* Progress row */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base font-black text-white">
                        {(formValues.termMonths || 0) - (formValues.remainingTerms || 0)}
                      </span>
                      <span className="text-slate-500 text-sm">/ {formValues.termMonths || 0} kỳ</span>
                      <span className="ml-auto text-[11px] font-bold text-amber-400">
                        Còn {formValues.remainingTerms || 0} kỳ
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            formValues.termMonths
                              ? (
                                  ((formValues.termMonths - (formValues.remainingTerms || 0)) / formValues.termMonths) *
                                  100
                                ).toFixed(1)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Auto-update notice */}
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <Info size={11} className="text-blue-400/70 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-blue-300/60 leading-relaxed">
                      Số kỳ đã trả sẽ <span className="font-bold text-blue-300/80">tự động cập nhật</span> khi bạn ghi
                      nhận thanh toán đủ một kỳ (≥ khoản trả tối thiểu). Bạn cũng có thể điều chỉnh thủ công ở đây.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Dư nợ hiện tại</label>
                  <Controller
                    name="balance"
                    control={control}
                    render={({ field }) => (
                      <div className="relative group">
                        <FormattedInput
                          kind="integer"
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(toNumberValue(v));
                            setIsAutoCalcBalance(false);
                          }}
                          className={`${inputCls(errors.balance)} ${
                            loanStatus === 'NEW'
                              ? 'bg-blue-500/5 border-blue-500/20 text-blue-200 cursor-not-allowed'
                              : ''
                          }`}
                          placeholder="0"
                          suffix="đ"
                          readOnly={loanStatus === 'NEW'}
                        />
                        {loanStatus === 'NEW' && (
                          <p className="mt-1.5 text-[10px] text-blue-400/70 flex items-center gap-1 italic">
                            <Info size={10} /> Tự tính: Gốc + các loại phí thiết lập
                          </p>
                        )}
                        {loanStatus === 'EXISTING' &&
                          debtType === 'INSTALLMENT' &&
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
                                  <Info size={10} /> Bạn đã dùng {usage.toFixed(0)}% hạn mức. Tỷ lệ cao có thể ảnh hưởng
                                  điểm tín dụng.
                                </p>
                              );
                            return null;
                          })()}
                      </div>
                    )}
                  />
                  {errors.balance && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.balance.message}
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
                        onValueChange={(v) => field.onChange(toNumberValue(v))}
                        className={inputCls(errors.apr)}
                        placeholder="0"
                        suffix="%"
                      />
                    )}
                  />
                  {errors.apr && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.apr.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Hình thức tính lãi</label>
                  <select
                    {...register('rateType')}
                    className="input-field appearance-none"
                    disabled={debtType === 'CREDIT_CARD'}
                    value={debtType === 'CREDIT_CARD' ? 'REDUCING' : formValues.rateType}
                  >
                    <option value="FLAT">Flat (Lãi trên gốc ban đầu)</option>
                    <option value="REDUCING">Reducing (Dư nợ giảm dần)</option>
                  </select>
                  {debtType === 'CREDIT_CARD' && (
                    <p className="mt-1 text-[11px] text-slate-500 italic">
                      * Thẻ tín dụng mặc định tính trên dư nợ giảm dần
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="input-label mb-0">Khoản trả hàng tháng</label>
                    {debtType === 'INSTALLMENT' && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                          Hệ thống tự tính
                        </span>
                      </div>
                    )}
                  </div>
                  <Controller
                    name="minPayment"
                    control={control}
                    render={({ field }) => (
                      <div className="relative group">
                        <FormattedInput
                          kind="integer"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={`${inputCls(errors.minPayment)} ${
                            debtType === 'INSTALLMENT'
                              ? 'bg-blue-500/5 border-blue-500/20 text-blue-200 cursor-not-allowed'
                              : ''
                          }`}
                          placeholder="0"
                          suffix="đ"
                          readOnly={debtType === 'INSTALLMENT'}
                        />
                        <p className="mt-1.5 text-[10px] text-gray-500 flex items-center gap-1 italic">
                          <Info size={10} />{' '}
                          {debtType === 'INSTALLMENT'
                            ? 'Khoản trả cố định hàng tháng (gốc + lãi + phí).'
                            : 'Số tiền bạn dự định trả cho thẻ mỗi tháng.'}
                        </p>
                      </div>
                    )}
                  />
                  {errors.minPayment && (
                    <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.minPayment.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/[0.06] my-4" />

              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <Info size={14} className="text-blue-400" /> Cấu hình nâng cao & Phí ẩn
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="input-label">Phí xử lý hồ sơ (%)</label>
                  <Controller
                    name="feeProcessing"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput
                        kind="decimal"
                        value={field.value}
                        onValueChange={(v) => field.onChange(toNumberValue(v))}
                        className="input-field"
                        placeholder="0"
                        suffix="%"
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="input-label">Phí bảo hiểm (%/năm)</label>
                  <Controller
                    name="feeInsurance"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput
                        kind="decimal"
                        value={field.value}
                        onValueChange={(v) => field.onChange(toNumberValue(v))}
                        className="input-field"
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
                        onValueChange={(v) => field.onChange(toNumberValue(v))}
                        className="input-field"
                        placeholder="0"
                        suffix="%"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary flex-1 py-4 text-base shadow-lg shadow-blue-500/10"
                >
                  {isUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang cập nhật...
                    </span>
                  ) : (
                    'Lưu thay đổi'
                  )}
                </button>
                <button type="button" onClick={() => navigate(`/debts/${id}`)} className="btn-secondary px-8 py-4">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 sticky top-8 border-blue-500/10">
            <h3 className="text-[17px] font-bold text-white mb-6 flex items-center gap-2">
              <BarChart2 className="text-blue-400" size={18} /> Phân tích chi phí mới
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Lãi suất thực tế (EAR)
                </p>
                <p className={`text-2xl font-black ${getEarColorClass(ear)}`}>{formatPercent(ear)}%</p>
                <p className="text-[10px] text-slate-500 mt-1 italic"> Bao gồm lãi suất + các loại phí</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lãi suất năm (APY)</p>
                <p className="text-xl font-bold text-white">{formatPercent(apy)}%</p>
              </div>

              {debtType === 'INSTALLMENT' && (
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                    Dự kiến thanh toán
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Tổng tiền trả:</span>
                      <span className="text-white font-bold">
                        {(formValues.minPayment * formValues.termMonths).toLocaleString()}đ
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Tổng lãi & phí:</span>
                      <span className="text-rose-400 font-bold">
                        {(formValues.minPayment * formValues.termMonths - formValues.originalAmount).toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
