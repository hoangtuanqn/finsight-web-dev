import { useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebt, useDebtMutations } from '../../hooks/useDebtQuery';
import { calcEAR, calcAPY, formatPercent } from '../../utils/calculations';
import { Pencil, AlertTriangle, BarChart2 } from 'lucide-react';
import FormattedInput from '../../components/common/FormattedInput';
import { formInputClass } from '../../components/common/formStyles';

const debtSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên khoản vay.'),
  platform: z.string().default('CUSTOM'),
  originalAmount: z.number().positive('Số tiền gốc phải lớn hơn 0.'),
  balance: z.number().min(0, 'Dư nợ không được âm'),
  apr: z.number().min(0).max(100, 'Lãi suất APR không hợp lệ.'),
  rateType: z.enum(['FLAT', 'REDUCING']).default('FLAT'),
  feeProcessing: z.number().min(0).default(0),
  feeInsurance: z.number().min(0).default(0),
  feeManagement: z.number().min(0).default(0),
  minPayment: z.number().positive('Số tiền trả tối thiểu phải lớn hơn 0.'),
  termMonths: z.number().int().positive('Kỳ hạn phải lớn hơn 0.'),
  remainingTerms: z.number().int().min(0),
  dueDay: z.number().int().min(1).max(31, 'Ngày đáo hạn từ 1 đến 31.'),
}).refine(data => data.balance <= data.originalAmount, {
  message: 'Dư nợ không được lớn hơn số tiền gốc.',
  path: ['balance']
}).refine(data => data.minPayment <= data.balance || data.balance === 0, {
  message: 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.',
  path: ['minPayment']
}).refine(data => data.remainingTerms <= data.termMonths, {
  message: 'Kỳ còn lại không được lớn hơn kỳ hạn.',
  path: ['remainingTerms']
});

const PLATFORM_PRESETS = {
  SPAYLATER: { name: 'SPayLater', apr: 18, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
  LAZPAYLATER: { name: 'LazPayLater', apr: 18, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
  CREDIT_CARD: { name: 'Thẻ tín dụng', apr: 36, rateType: 'REDUCING', feeProcessing: 0, feeInsurance: 0, feeManagement: 0.5 },
  HOME_CREDIT: { name: 'Home Credit', apr: 30, rateType: 'FLAT', feeProcessing: 1, feeInsurance: 0.5, feeManagement: 0 },
  FE_CREDIT: { name: 'FE Credit', apr: 48, rateType: 'FLAT', feeProcessing: 5, feeInsurance: 1,   feeManagement: 0.5 },
  CUSTOM: { name: '', apr: 0, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
};

export default function EditDebtPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading: fetching } = useDebt(id!) as { data: any, isLoading: boolean };
  const { updateDebt, isUpdating } = useDebtMutations() as any;

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(debtSchema),
  });

  const formValues = watch();
  const toNumberValue = (value: string | number) => (value === '' ? 0 : Number(value));

  useEffect(() => {
    if (data?.debt) {
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
  };

  const ear = calcEAR(formValues.apr || 0, formValues.feeProcessing || 0, formValues.feeInsurance || 0, formValues.feeManagement || 0, formValues.termMonths || 12);
  const apy = calcAPY(formValues.apr || 0);

  const onSubmit = async (data: any) => {
    try {
      await updateDebt({
        id: id!,
        data: {
          ...data,
          dueDay:         Math.round(data.dueDay),
          termMonths:     Math.round(data.termMonths),
          remainingTerms: Math.round(data.remainingTerms),
        }
      });
      navigate(`/debts/${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const inputCls = formInputClass;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/debts" className="text-slate-500 hover:text-slate-300 transition-colors">Quản lý nợ</Link>
        <span className="text-slate-700">/</span>
        <Link to={`/debts/${id}`} className="text-slate-500 hover:text-slate-300 transition-colors">Chi tiết</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Chỉnh sửa</span>
      </div>

      <h1 className="text-[22px] font-bold text-white mb-6 flex items-center gap-2"><Pencil size={20} /> Chỉnh sửa khoản nợ</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card">
            <div className="mb-6">
              <label className="input-label">Nền tảng</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_PRESETS).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                      formValues.platform === key
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-400'
                    }`}
                  >
                    {val.name || 'Tự nhập'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tên khoản vay</label>
                  <input {...register('name')} className={inputCls(errors.name)} placeholder="VD: Mua điện thoại" />
                  {errors.name && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.name.message}</p>}
                </div>
                <div>
                  <label className="input-label">Số tiền gốc</label>
                  <Controller
                    name="originalAmount"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="integer" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.originalAmount)} placeholder="0" suffix="đ" />
                    )}
                  />
                  {errors.originalAmount && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.originalAmount.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Dư nợ hiện tại</label>
                  <Controller
                    name="balance"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="integer" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.balance)} placeholder="0" suffix="đ" />
                    )}
                  />
                  {errors.balance && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.balance.message}</p>}
                </div>
                <div>
                  <label className="input-label">Lãi suất APR (%/năm)</label>
                  <Controller
                    name="apr"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.apr)} placeholder="0" suffix="%" />
                    )}
                  />
                  {errors.apr && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.apr.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Hình thức tính lãi</label>
                  <select {...register('rateType')} className="input-field">
                    <option value="FLAT">Flat (lãi trên gốc ban đầu)</option>
                    <option value="REDUCING">Reducing (dư nợ giảm dần)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">Trả tối thiểu/tháng</label>
                  <Controller
                    name="minPayment"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="integer" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.minPayment)} placeholder="0" suffix="đ" />
                    )}
                  />
                  {errors.minPayment && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.minPayment.message}</p>}
                </div>
              </div>

              <div className="h-px bg-white/[0.06] my-2" />
              <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wide">Phí ẩn</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Phí xử lý (%)</label>
                  <Controller
                    name="feeProcessing"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.feeProcessing)} placeholder="0" suffix="%" />
                    )}
                  />
                </div>
                <div>
                  <label className="input-label">Phí bảo hiểm (%/năm)</label>
                  <Controller
                    name="feeInsurance"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.feeInsurance)} placeholder="0" suffix="%" />
                    )}
                  />
                </div>
                <div>
                  <label className="input-label">Phí quản lý (%/năm)</label>
                  <Controller
                    name="feeManagement"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(value) => field.onChange(toNumberValue(value))} className={inputCls(errors.feeManagement)} placeholder="0" suffix="%" />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Kỳ hạn (tháng)</label>
                  <input type="number" {...register('termMonths', { valueAsNumber: true })} className={inputCls(errors.termMonths)} />
                  {errors.termMonths && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.termMonths.message}</p>}
                </div>
                <div>
                  <label className="input-label">Kỳ còn lại</label>
                  <input type="number" {...register('remainingTerms', { valueAsNumber: true })} className={inputCls(errors.remainingTerms)} />
                  {errors.remainingTerms && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.remainingTerms.message}</p>}
                </div>
                <div>
                  <label className="input-label">Ngày đáo hạn</label>
                  <input type="number" {...register('dueDay', { valueAsNumber: true })} className={inputCls(errors.dueDay)} />
                  {errors.dueDay && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11} /> {errors.dueDay.message}</p>}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isUpdating} className="btn-primary cursor-pointer">
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </span>
                  ) : 'Cập nhật khoản nợ'}
                </button>
                <button type="button" onClick={() => navigate(`/debts/${id}`)} className="btn-secondary cursor-pointer">Hủy</button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="glass-card sticky top-8">
            <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart2 size={16} /> Xem trước chi phí mới
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">APR (quảng cáo)</span>
                <span className="font-semibold text-blue-400">{formatPercent(formValues.apr || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">APY (lãi kép)</span>
                <span className="font-semibold text-purple-400">{formatPercent(apy)}</span>
              </div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400 font-semibold">EAR (thực tế)</span>
                <span className="text-xl font-bold text-red-400">{formatPercent(ear)}</span>
              </div>
              {ear > (formValues.apr || 0) && (
                <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="text-[12px] text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> Chi phí ẩn: <span className="font-semibold">+{formatPercent(ear - (formValues.apr || 0))}</span> so với quảng cáo
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
