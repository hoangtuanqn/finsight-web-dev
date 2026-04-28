import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDebtMutations } from '../../hooks/useDebtQuery';
import FormattedInput from '../../components/common/FormattedInput';
import { calcEAR, calcAPY, formatPercent } from '../../utils/calculations';
import { Plus, AlertTriangle, BarChart2 } from 'lucide-react';

const debtSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên khoản vay.'),
  platform: z.string().default('SPAYLATER'),
  originalAmount: z.number().positive('Số tiền gốc phải lớn hơn 0.'),
  balance: z.number().min(0, 'Dư nợ không được âm'),
  apr: z.number().min(0).max(100, 'Lãi suất APR không hợp lệ.'),
  rateType: z.enum(['FLAT', 'REDUCING']).default('FLAT'),
  feeProcessing: z.number().min(0).default(0),
  feeInsurance: z.number().min(0).default(0),
  feeManagement: z.number().min(0).default(0),
  feePenaltyPerDay: z.number().min(0).default(0.05),
  minPayment: z.number().positive('Số tiền trả tối thiểu phải lớn hơn 0.'),
  dueDay: z.number().int().min(1).max(31, 'Ngày đáo hạn từ 1 đến 31.'),
  termMonths: z.number().int().positive('Kỳ hạn phải lớn hơn 0.'),
  startDate: z.string().min(1, 'Vui lòng chọn ngày vay.'),
}).refine(data => data.balance <= data.originalAmount, {
  message: 'Dư nợ không được lớn hơn số tiền gốc.',
  path: ['balance']
}).refine(data => data.minPayment <= data.balance, {
  message: 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.',
  path: ['minPayment']
});

const PLATFORM_PRESETS = {
  SPAYLATER:   { name: 'SPayLater',     apr: 18, rateType: 'FLAT',     feeProcessing: 0, feeInsurance: 0,   feeManagement: 0   },
  LAZPAYLATER: { name: 'LazPayLater',   apr: 18, rateType: 'FLAT',     feeProcessing: 0, feeInsurance: 0,   feeManagement: 0   },
  CREDIT_CARD: { name: 'Thẻ tín dụng', apr: 36, rateType: 'REDUCING', feeProcessing: 0, feeInsurance: 0,   feeManagement: 0.5 },
  HOME_CREDIT: { name: 'Home Credit',  apr: 30, rateType: 'FLAT',     feeProcessing: 1, feeInsurance: 0.5, feeManagement: 0   },
  FE_CREDIT:   { name: 'FE Credit',    apr: 48, rateType: 'FLAT',     feeProcessing: 5, feeInsurance: 1,   feeManagement: 0.5 },
  CUSTOM:      { name: '',             apr: 0,  rateType: 'FLAT',     feeProcessing: 0, feeInsurance: 0,   feeManagement: 0   },
};

const INITIAL_VALUES = {
  name: '', platform: 'SPAYLATER', originalAmount: 0, balance: 0, apr: 18, rateType: 'FLAT',
  feeProcessing: 0, feeInsurance: 0, feeManagement: 0, feePenaltyPerDay: 0.05,
  minPayment: 0, dueDay: 15, termMonths: 12, startDate: new Date().toISOString().split('T')[0],
};

function calcRemainingTerms(startDate: string, termMonths: number) {
  if (!startDate || !termMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, termMonths - monthsPassed);
}

export default function AddDebtPage() {
  const navigate = useNavigate();
  const { createDebt, isCreating } = useDebtMutations() as any;

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(debtSchema),
    defaultValues: INITIAL_VALUES
  });

  const formValues = watch();
  const toNumberValue = (value: string | number) => (value === '' ? 0 : Number(value));

  const applyPreset = (platform: keyof typeof PLATFORM_PRESETS) => {
    const preset = PLATFORM_PRESETS[platform];
    setValue('platform', platform);
    setValue('apr', preset.apr);
    setValue('rateType', preset.rateType as any);
    setValue('feeProcessing', preset.feeProcessing);
    setValue('feeInsurance', preset.feeInsurance);
    setValue('feeManagement', preset.feeManagement);
  };

  const ear = calcEAR(formValues.apr, formValues.feeProcessing, formValues.feeInsurance, formValues.feeManagement, formValues.termMonths);
  const apy = calcAPY(formValues.apr);
  const remaining = calcRemainingTerms(formValues.startDate, formValues.termMonths);

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        remainingTerms: remaining ?? data.termMonths
      };
      await createDebt(payload);
      navigate('/debts');
    } catch (err) {
      console.error(err);
    }
  };

  const inputCls = (hasError: any) => `input-field ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-8 space-y-6">
      <div className="flex items-center gap-1.5 text-[12px] font-medium pt-2">
        <Link to="/debts" className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer">Quản lý nợ</Link>
        <span className="text-[var(--color-border)]">/</span>
        <span className="text-[var(--color-text-primary)] font-bold">Thêm mới</span>
      </div>

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <Plus size={11} /> Khoản nợ mới
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Thêm khoản nợ mới</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Nhập đầy đủ thông tin để tính toán EAR chính xác</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="relative rounded-3xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}>
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Nền tảng</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(PLATFORM_PRESETS).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border cursor-pointer"
                      style={formValues.platform === key
                        ? { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.35)', boxShadow: '0 0 10px rgba(59,130,246,0.15)' }
                        : { background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
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
                    <input
                      {...register('name')}
                      className={inputCls(errors.name)}
                      placeholder="VD: Mua điện thoại"
                    />
                    {errors.name && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="input-label">Số tiền gốc</label>
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
                    {errors.originalAmount && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.originalAmount.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Dư nợ hiện tại</label>
                    <Controller
                      name="balance"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput
                          kind="integer"
                          value={field.value}
                          onValueChange={(value) => field.onChange(toNumberValue(value))}
                          className={inputCls(errors.balance)}
                          placeholder="0"
                          suffix="đ"
                        />
                      )}
                    />
                    {errors.balance && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.balance.message}</p>}
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
                    {errors.apr && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.apr.message}</p>}
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
                    {errors.minPayment && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.minPayment.message}</p>}
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
                    <label className="input-label">Ngày vay</label>
                    <input
                      type="date"
                      {...register('startDate')}
                      className={inputCls(errors.startDate)}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.startDate && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.startDate.message}</p>}
                  </div>
                  <div>
                    <label className="input-label">Kỳ hạn (tháng)</label>
                    <input
                      type="number"
                      {...register('termMonths', { valueAsNumber: true })}
                      className={inputCls(errors.termMonths)}
                    />
                    {errors.termMonths && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.termMonths.message}</p>}
                  </div>
                  <div>
                    <label className="input-label">Ngày đáo hạn hàng tháng</label>
                    <input
                      type="number"
                      {...register('dueDay', { valueAsNumber: true })}
                      className={inputCls(errors.dueDay)}
                    />
                    {errors.dueDay && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.dueDay.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="input-label">Kỳ còn lại</label>
                    <div className={`input-field bg-white/[0.02] text-slate-400 cursor-not-allowed ${remaining === 0 ? 'text-red-400' : ''}`}>
                      {formValues.startDate && formValues.termMonths
                        ? remaining === 0 ? 'Đã hết hạn' : `${remaining} tháng`
                        : '—'}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-end gap-3 pb-px">
                    <button type="submit" disabled={isCreating}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-60">
                      {isCreating
                        ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                        : <><Plus size={14} /> Thêm khoản nợ</> }
                    </button>
                    <button type="button" onClick={() => navigate('/debts')}
                      className="px-6 py-2.5 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all cursor-pointer">
                      Hủy
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div>
          <div className="relative rounded-3xl border p-5 sticky top-24 overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(239,68,68,0.18)', boxShadow: '0 4px 20px rgba(239,68,68,0.06)' }}>
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
                <span className="text-xl font-black text-red-400">{formatPercent(ear)}</span>
              </div>
              {ear > formValues.apr && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/6">
                  <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[12px] text-red-400 font-medium">
                    Chi phí ẩn: <span className="font-black">+{formatPercent(ear - formValues.apr)}</span> so với quảng cáo
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
