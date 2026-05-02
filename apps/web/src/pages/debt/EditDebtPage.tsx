import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, BarChart2, Calendar, CreditCard, Edit3, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import FormattedInput from '../../components/common/FormattedInput';
import { useDebt, useDebtMutations } from '../../hooks/useDebtQuery';
import { calcAPY, calcEAR, formatPercent } from '../../utils/calculations';

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

export default function EditDebtPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading: fetching } = useDebt(id!) as { data: any; isLoading: boolean };
  const { updateDebt, isUpdating } = useDebtMutations() as any;
  const [debtType, setDebtType] = useState<'INSTALLMENT' | 'CREDIT_CARD'>('INSTALLMENT');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/8 text-amber-400 text-[10px] font-black uppercase tracking-widest">
            <Edit3 size={11} /> {debtType === 'INSTALLMENT' ? 'Vay trả góp' : 'Thẻ tín dụng'}
          </div>
        </div>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">
          Cập nhật thông tin chi tiết cho khoản nợ của bạn
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col">
          <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06] relative">
            <div
              className="absolute h-[calc(100%-12px)] top-1.5 transition-all duration-300 rounded-xl bg-blue-500 shadow-lg"
              style={{
                width: 'calc(50% - 9px)',
                left: debtType === 'INSTALLMENT' ? '6px' : 'calc(50% + 3px)',
              }}
            />
            <button
              type="button"
              className={`flex-1 px-4 py-2 rounded-xl text-[13px] font-black transition-all flex items-center justify-center gap-2 z-10 ${
                debtType === 'INSTALLMENT' ? 'text-white' : 'text-slate-500 opacity-50 cursor-not-allowed'
              }`}
              title="Không thể đổi loại nợ sau khi đã tạo"
            >
              <Calendar size={15} /> Vay Trả Góp
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-2 rounded-xl text-[13px] font-black transition-all flex items-center justify-center gap-2 z-10 ${
                debtType === 'CREDIT_CARD' ? 'text-white' : 'text-slate-500 opacity-50 cursor-not-allowed'
              }`}
              title="Không thể đổi loại nợ sau khi đã tạo"
            >
              <CreditCard size={15} /> Thẻ Tín Dụng
            </button>
          </div>
          <p className="text-[10px] text-amber-400/70 font-medium flex items-center gap-1 mt-2 ml-1">
            <Info size={10} /> Loại nợ đã được cố định sau khi tạo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 md:p-8">
            <div className="mb-8">
              <label className="input-label mb-3 block">Chọn nhanh mẫu nền tảng</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_PRESETS)
                  .filter(([, val]) => val.type === debtType)
                  .map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key as any)}
                      className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all border ${
                        formValues.platform === key
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                          : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/[0.08] hover:text-slate-300'
                      }`}
                    >
                      {val.name || 'Tự nhập'}
                    </button>
                  ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Tên khoản nợ</label>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Dư nợ hiện tại</label>
                  <Controller
                    name="balance"
                    control={control}
                    render={({ field }) => (
                      <div className="relative">
                        <FormattedInput
                          kind="integer"
                          value={field.value}
                          onValueChange={(v) => field.onChange(toNumberValue(v))}
                          className={inputCls(errors.balance)}
                          placeholder="0"
                          suffix="đ"
                        />
                        {debtType === 'INSTALLMENT' &&
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
                  <label className="input-label">Số tiền trả tối thiểu</label>
                  <Controller
                    name="minPayment"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput
                        kind="integer"
                        value={field.value}
                        onValueChange={(v) => field.onChange(toNumberValue(v))}
                        className={inputCls(errors.minPayment)}
                        placeholder="0"
                        suffix="đ"
                      />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {debtType === 'INSTALLMENT' ? (
                  <>
                    <div>
                      <label className="input-label">Tổng kỳ hạn (tháng)</label>
                      <input
                        type="number"
                        {...register('termMonths', { valueAsNumber: true })}
                        className={inputCls(errors.termMonths)}
                      />
                    </div>
                    <div>
                      <label className="input-label">Số kỳ đã trả</label>
                      <input
                        type="number"
                        value={(formValues.termMonths || 0) - (formValues.remainingTerms || 0)}
                        onChange={(e) => {
                          const paid = Number(e.target.value);
                          setValue('remainingTerms', Math.max(0, (formValues.termMonths || 0) - paid));
                        }}
                        className="input-field"
                      />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 flex items-center px-4 py-3 bg-white/[0.02] border border-white/[0.06] rounded-xl text-slate-500 text-sm italic">
                    <Info size={16} className="mr-2 text-slate-600" /> Thẻ tín dụng không có kỳ hạn cố định.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {formValues.startDate &&
                    new Date(formValues.startDate) < new Date(new Date().setFullYear(new Date().getFullYear() - 1)) && (
                      <p className="mt-1 text-[10px] text-amber-400 flex items-center gap-1">
                        <Info size={10} /> Ngày vay cách đây hơn 1 năm? Hãy kiểm tra lại.
                      </p>
                    )}
                </div>
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
                    <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {errors.dueDay.message}
                    </p>
                  )}
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

            <div className="space-y-5">
              <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-500">Lãi suất niêm yết</span>
                  <span className="font-bold text-blue-400 text-lg">{formatPercent(formValues.apr || 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Lãi suất kép (APY)</span>
                  <span className="font-semibold text-purple-400">{formatPercent(apy)}</span>
                </div>
              </div>

              <div className="p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl border border-blue-500/20">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">
                  Lãi suất thực tế (EAR)
                </span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${getEarColorClass(ear)}`}>{formatPercent(ear)}</span>
                  <span className="text-xs text-slate-500 font-medium italic">/năm</span>
                </div>
              </div>

              {ear > (formValues.apr || 0) && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-red-200 font-bold mb-1">Cảnh báo chi phí ẩn</p>
                      <p className="text-xs text-red-400/80 leading-relaxed">
                        Các loại phí đi kèm khiến lãi suất thực tế cao hơn{' '}
                        <span className="font-bold">+{formatPercent(ear - (formValues.apr || 0))}</span> so với lãi suất
                        quảng cáo.
                      </p>
                    </div>
                  </div>
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
