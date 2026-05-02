import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebt, useDebtMutations } from '../../hooks/useDebtQuery';
import { calcEAR, calcAPY, formatPercent } from '../../utils/calculations';
import { Pencil, AlertTriangle, BarChart2, CreditCard, Calendar, Info } from 'lucide-react';
import FormattedInput from '../../components/common/FormattedInput';

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
  minPayment: z.number().min(0, 'Số tiền trả tối thiểu không được âm.'),
  termMonths: z.number().int().min(0, 'Kỳ hạn không được âm.'),
  remainingTerms: z.number().int().min(0),
  dueDay: z.number().int().min(1).max(31, 'Ngày đáo hạn từ 1 đến 31.'),
  startDate: z.string().optional(),
}).refine(data => data.minPayment <= data.balance || data.balance === 0, {
  message: 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.',
  path: ['minPayment']
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
  const [debtType, setDebtType] = useState<'INSTALLMENT' | 'CREDIT_CARD'>('INSTALLMENT');

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(debtSchema),
  });

  const formValues = watch();
  const toNumberValue = (value: string | number) => (value === '' ? 0 : Number(value));

  useEffect(() => {
    if (data?.debt) {
      const type = (data.debt.platform === 'CREDIT_CARD' || data.debt.termMonths === 0) ? 'CREDIT_CARD' : 'INSTALLMENT';
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
    
    if (platform === 'CREDIT_CARD') {
      setDebtType('CREDIT_CARD');
      setValue('termMonths', 0);
      setValue('remainingTerms', 0);
    } else if (platform !== 'CUSTOM') {
      setDebtType('INSTALLMENT');
      if (formValues.termMonths === 0) setValue('termMonths', 12);
    }
  };

  const ear = calcEAR(
    formValues.apr || 0, 
    formValues.feeProcessing || 0, 
    formValues.feeInsurance || 0, 
    formValues.feeManagement || 0, 
    debtType === 'INSTALLMENT' ? (formValues.termMonths || 12) : 12
  );
  const apy = calcAPY(formValues.apr || 0);

  const onSubmit = async (formData: any) => {
    try {
      const payload = {
        ...formData,
        dueDay: Math.round(formData.dueDay),
        termMonths: debtType === 'CREDIT_CARD' ? 0 : Math.round(formData.termMonths),
        remainingTerms: debtType === 'CREDIT_CARD' ? 0 : Math.round(formData.remainingTerms),
        rateType: debtType === 'CREDIT_CARD' ? 'REDUCING' : formData.rateType,
      };

      await updateDebt({
        id: id!,
        data: payload
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

  const inputCls = (hasError: any) => `input-field ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/debts" className="text-slate-500 hover:text-slate-300 transition-colors">Quản lý nợ</Link>
        <span className="text-slate-700">/</span>
        <Link to={`/debts/${id}`} className="text-slate-500 hover:text-slate-300 transition-colors">Chi tiết</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Chỉnh sửa</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-bold text-white flex items-center gap-2">
            <Pencil className="text-blue-400" size={24} /> Chỉnh sửa khoản nợ
          </h1>
          <p className="text-slate-500 text-sm mt-1">Cập nhật thông tin chi tiết về khoản nợ của bạn</p>
        </div>
        
        <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setDebtType('INSTALLMENT');
              if (formValues.termMonths === 0) setValue('termMonths', 12);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              debtType === 'INSTALLMENT' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar size={16} /> Vay Trả Góp
          </button>
          <button
            type="button"
            onClick={() => {
              setDebtType('CREDIT_CARD');
              setValue('termMonths', 0);
              setValue('remainingTerms', 0);
              setValue('rateType', 'REDUCING');
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              debtType === 'CREDIT_CARD' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard size={16} /> Thẻ Tín Dụng
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="glass-card p-6 md:p-8">
            <div className="mb-8">
              <label className="input-label mb-3 block">Chọn nhanh mẫu nền tảng</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORM_PRESETS).map(([key, val]) => (
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
                  <label className="input-label">Tên khoản vay</label>
                  <input {...register('name')} className={inputCls(errors.name)} placeholder="VD: Vay mua xe, Thẻ VPBank..." />
                  {errors.name && <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {errors.name.message}</p>}
                </div>
                <div>
                  <label className="input-label">{debtType === 'CREDIT_CARD' ? 'Hạn mức thẻ' : 'Số tiền vay gốc'}</label>
                  <Controller
                    name="originalAmount"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="integer" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className={inputCls(errors.originalAmount)} placeholder="0" suffix="đ" />
                    )}
                  />
                  {errors.originalAmount && <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {errors.originalAmount.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="input-label">Dư nợ hiện tại</label>
                  <Controller
                    name="balance"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="integer" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className={inputCls(errors.balance)} placeholder="0" suffix="đ" />
                    )}
                  />
                  {errors.balance && <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {errors.balance.message}</p>}
                </div>
                <div>
                  <label className="input-label">Lãi suất APR (%/năm)</label>
                  <Controller
                    name="apr"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className={inputCls(errors.apr)} placeholder="0" suffix="%" />
                    )}
                  />
                  {errors.apr && <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {errors.apr.message}</p>}
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
                  {debtType === 'CREDIT_CARD' && <p className="mt-1 text-[11px] text-slate-500 italic">* Thẻ tín dụng mặc định tính trên dư nợ giảm dần</p>}
                </div>
                <div>
                  <label className="input-label">Số tiền trả tối thiểu</label>
                  <Controller
                    name="minPayment"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="integer" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className={inputCls(errors.minPayment)} placeholder="0" suffix="đ" />
                    )}
                  />
                  {errors.minPayment && <p className="mt-1.5 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {errors.minPayment.message}</p>}
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
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className="input-field" placeholder="0" suffix="%" />
                    )}
                  />
                </div>
                <div>
                  <label className="input-label">Phí bảo hiểm (%/năm)</label>
                  <Controller
                    name="feeInsurance"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className="input-field" placeholder="0" suffix="%" />
                    )}
                  />
                </div>
                <div>
                  <label className="input-label">Phí quản lý (%/năm)</label>
                  <Controller
                    name="feeManagement"
                    control={control}
                    render={({ field }) => (
                      <FormattedInput kind="decimal" value={field.value} onValueChange={(v) => field.onChange(toNumberValue(v))} className="input-field" placeholder="0" suffix="%" />
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {debtType === 'INSTALLMENT' ? (
                  <>
                    <div>
                      <label className="input-label">Tổng kỳ hạn (tháng)</label>
                      <input type="number" {...register('termMonths', { valueAsNumber: true })} className={inputCls(errors.termMonths)} />
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
                <div>
                  <label className="input-label">{debtType === 'CREDIT_CARD' ? 'Ngày chốt sao kê' : 'Ngày thanh toán hàng tháng'}</label>
                  <input type="number" {...register('dueDay', { valueAsNumber: true })} className={inputCls(errors.dueDay)} placeholder="VD: 15" />
                  {errors.dueDay && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={12} /> {errors.dueDay.message}</p>}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" disabled={isUpdating} className="btn-primary flex-1 py-4 text-base shadow-lg shadow-blue-500/10">
                  {isUpdating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang cập nhật...
                    </span>
                  ) : 'Lưu thay đổi'}
                </button>
                <button type="button" onClick={() => navigate(`/debts/${id}`)} className="btn-secondary px-8 py-4">Hủy</button>
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
                <span className="text-xs text-slate-400 font-bold uppercase tracking-widest block mb-1">Lãi suất thực tế (EAR)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{formatPercent(ear)}</span>
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
                        Các loại phí đi kèm khiến lãi suất thực tế cao hơn <span className="font-bold">+{formatPercent(ear - (formValues.apr || 0))}</span> so với lãi suất quảng cáo.
                      </p>
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
