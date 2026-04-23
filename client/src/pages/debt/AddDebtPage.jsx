import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useDebtMutations } from '../../hooks/useDebtQuery';
import FormattedInput from '../../components/common/FormattedInput';
import { calcEAR, calcAPY, formatPercent } from '../../utils/calculations';
import { Plus, AlertTriangle, BarChart2 } from 'lucide-react';

const PLATFORM_PRESETS = {
  SPAYLATER:   { name: 'SPayLater',     apr: 18, rateType: 'FLAT',     feeProcessing: 0, feeInsurance: 0,   feeManagement: 0   },
  LAZPAYLATER: { name: 'LazPayLater',   apr: 18, rateType: 'FLAT',     feeProcessing: 0, feeInsurance: 0,   feeManagement: 0   },
  CREDIT_CARD: { name: 'Thẻ tín dụng', apr: 36, rateType: 'REDUCING', feeProcessing: 0, feeInsurance: 0,   feeManagement: 0.5 },
  HOME_CREDIT: { name: 'Home Credit',  apr: 30, rateType: 'FLAT',     feeProcessing: 1, feeInsurance: 0.5, feeManagement: 0   },
  FE_CREDIT:   { name: 'FE Credit',    apr: 48, rateType: 'FLAT',     feeProcessing: 5, feeInsurance: 1,   feeManagement: 0.5 },
  CUSTOM:      { name: '',             apr: 0,  rateType: 'FLAT',     feeProcessing: 0, feeInsurance: 0,   feeManagement: 0   },
};

const INITIAL_FORM = {
  name: '', platform: 'SPAYLATER', originalAmount: '', balance: '', apr: 18, rateType: 'FLAT',
  feeProcessing: '', feeInsurance: '', feeManagement: '', feePenaltyPerDay: 0.05,
  minPayment: '', dueDay: 15, termMonths: 12, startDate: '',
};

function calcRemainingTerms(startDate, termMonths) {
  if (!startDate || !termMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, termMonths - monthsPassed);
}

function validateForm(form) {
  const errors = {};

  if (!form.name.trim()) errors.name = 'Vui lòng nhập tên khoản vay.';
  if (!form.originalAmount || +form.originalAmount <= 0) errors.originalAmount = 'Số tiền gốc phải lớn hơn 0.';
  if (form.balance === '' || +form.balance <= 0) {
    errors.balance = 'Dư nợ hiện tại phải lớn hơn 0.';
  } else if (+form.balance > +form.originalAmount) {
    errors.balance = 'Dư nợ không được lớn hơn số tiền gốc.';
  }
  if (form.minPayment === '' || +form.minPayment <= 0) {
    errors.minPayment = 'Số tiền trả tối thiểu/tháng phải lớn hơn 0.';
  } else if (form.balance !== '' && +form.minPayment > +form.balance) {
    errors.minPayment = 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.';
  }
  if (+form.apr < 0 || +form.apr > 100) errors.apr = 'Lãi suất APR không hợp lệ.';
  if (!form.startDate) {
    errors.startDate = 'Vui lòng chọn ngày vay.';
  } else if (new Date(form.startDate) > new Date()) {
    errors.startDate = 'Ngày vay không được ở tương lai.';
  }
  if (form.termMonths <= 0) errors.termMonths = 'Kỳ hạn phải lớn hơn 0.';
  if (form.dueDay < 1 || form.dueDay > 31) errors.dueDay = 'Ngày đáo hạn phải từ 1 đến 31.';

  return errors;
}

function buildPayload(form) {
  const remainingTerms = calcRemainingTerms(form.startDate, +form.termMonths);
  return {
    ...form,
    originalAmount: +form.originalAmount || 0,
    balance:        +form.balance        || 0,
    apr:            +form.apr            || 0,
    feeProcessing:  +form.feeProcessing  || 0,
    feeInsurance:   +form.feeInsurance   || 0,
    feeManagement:  +form.feeManagement  || 0,
    minPayment:     +form.minPayment     || 0,
    remainingTerms: remainingTerms ?? +form.termMonths,
  };
}

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
      <AlertTriangle size={11} className="shrink-0" />
      {message}
    </p>
  );
}

function inputCls(hasError) {
  return `input-field ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;
}

function PlatformPresets({ activePlatform, onSelect }) {
  return (
    <div className="mb-6">
      <label className="block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-2">Nền tảng</label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PLATFORM_PRESETS).map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border cursor-pointer"
            style={activePlatform === key
              ? { background: 'rgba(59,130,246,0.12)', color: '#60a5fa', borderColor: 'rgba(59,130,246,0.35)', boxShadow: '0 0 10px rgba(59,130,246,0.15)' }
              : { background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}
          >
            {val.name || 'Tự nhập'}
          </button>
        ))}
      </div>
    </div>
  );
}

function BasicInfoSection({ form, errors, update }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Tên khoản vay</label>
          <input
            className={inputCls(errors.name)}
            value={form.name}
            onChange={e => update('name', e.target.value)}
            placeholder="VD: Mua điện thoại"
          />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label className="input-label">Số tiền gốc</label>
          <FormattedInput kind="integer" value={form.originalAmount} onValueChange={(value) => update('originalAmount', value)} className={inputCls(errors.originalAmount)} placeholder="0" suffix="đ" />
          <FieldError message={errors.originalAmount} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Dư nợ hiện tại</label>
          <FormattedInput kind="integer" value={form.balance} onValueChange={(value) => update('balance', value)} className={inputCls(errors.balance)} placeholder="0" suffix="đ" />
          <FieldError message={errors.balance} />
        </div>
        <div>
          <label className="input-label">Lãi suất APR (%/năm)</label>
          <FormattedInput kind="decimal" value={form.apr} onValueChange={(value) => update('apr', value)} className={inputCls(errors.apr)} placeholder="0" suffix="%" />
          <FieldError message={errors.apr} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Hình thức tính lãi</label>
          <select className="input-field" value={form.rateType} onChange={e => update('rateType', e.target.value)}>
            <option value="FLAT">Flat (lãi trên gốc ban đầu)</option>
            <option value="REDUCING">Reducing (dư nợ giảm dần)</option>
          </select>
        </div>
        <div>
          <label className="input-label">Trả tối thiểu/tháng</label>
          <FormattedInput kind="integer" value={form.minPayment} onValueChange={(value) => update('minPayment', value)} className={inputCls(errors.minPayment)} placeholder="0" suffix="đ" />
          <FieldError message={errors.minPayment} />
        </div>
      </div>
    </>
  );
}

function HiddenFeesSection({ form, errors, update }) {
  return (
    <>
      <div className="h-px bg-white/[0.06] my-2" />
      <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wide">Phí ẩn</p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="input-label">Phí xử lý (%)</label>
          <FormattedInput kind="decimal" value={form.feeProcessing} onValueChange={(value) => update('feeProcessing', value)} className={inputCls(errors.feeProcessing)} placeholder="0" suffix="%" />
          <FieldError message={errors.feeProcessing} />
        </div>
        <div>
          <label className="input-label">Phí bảo hiểm (%/năm)</label>
          <FormattedInput kind="decimal" value={form.feeInsurance} onValueChange={(value) => update('feeInsurance', value)} className={inputCls(errors.feeInsurance)} placeholder="0" suffix="%" />
          <FieldError message={errors.feeInsurance} />
        </div>
        <div>
          <label className="input-label">Phí quản lý (%/năm)</label>
          <FormattedInput kind="decimal" value={form.feeManagement} onValueChange={(value) => update('feeManagement', value)} className={inputCls(errors.feeManagement)} placeholder="0" suffix="%" />
          <FieldError message={errors.feeManagement} />
        </div>
      </div>
    </>
  );
}

function TermSection({ form, errors, update, actions }) {
  const remaining = calcRemainingTerms(form.startDate, +form.termMonths);

  return (
    <div className="grid grid-cols-3 gap-4">
      <div>
        <label className="input-label">Ngày vay</label>
        <input
          type="date"
          className={inputCls(errors.startDate)}
          value={form.startDate}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => update('startDate', e.target.value)}
        />
        <FieldError message={errors.startDate} />
      </div>
      <div>
        <label className="input-label">Kỳ hạn (tháng)</label>
        <input
          type="number"
          className={inputCls(errors.termMonths)}
          value={form.termMonths}
          onChange={e => update('termMonths', +e.target.value)}
        />
        <FieldError message={errors.termMonths} />
      </div>
      <div>
        <label className="input-label">Ngày đáo hạn hàng tháng</label>
        <input
          type="number"
          min="1"
          max="31"
          className={inputCls(errors.dueDay)}
          value={form.dueDay}
          onChange={e => update('dueDay', +e.target.value)}
        />
        <FieldError message={errors.dueDay} />
      </div>
      <div>
        <label className="input-label">Kỳ còn lại</label>
        <div className={`input-field bg-white/[0.02] text-slate-400 cursor-not-allowed ${remaining === 0 ? 'text-red-400' : ''}`}>
          {form.startDate && form.termMonths
            ? remaining === 0
              ? 'Đã hết hạn'
              : `${remaining} tháng`
            : '—'}
        </div>
      </div>
      <div className="col-span-2 flex items-end gap-3 pb-px">
        {actions}
      </div>
    </div>
  );
}

function CostPreviewCard({ apr, apy, ear }) {
  return (
    <div className="relative rounded-3xl border p-5 sticky top-24 overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(239,68,68,0.18)', boxShadow: '0 4px 20px rgba(239,68,68,0.06)' }}>
      <div className="absolute top-0 left-5 right-5 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-15 bg-red-500" />
      <h3 className="text-[14px] font-black text-[var(--color-text-primary)] mb-5 flex items-center gap-2">
        <BarChart2 size={15} className="text-red-400" /> Xem trước chi phí
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-[var(--color-text-muted)]">APR (quảng cáo)</span>
          <span className="text-[13px] font-black text-blue-400">{formatPercent(apr)}</span>
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
        {ear > apr && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-2xl border border-red-500/20 bg-red-500/6">
            <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-[12px] text-red-400 font-medium">
              Chi phí ẩn: <span className="font-black">+{formatPercent(ear - apr)}</span> so với quảng cáo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AddDebtPage() {
  const navigate = useNavigate();
  const { createDebt, isCreating } = useDebtMutations();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const applyPreset = (platform) => {
    setForm(f => ({ ...f, platform, ...PLATFORM_PRESETS[platform] }));
  };

  const ear = calcEAR(+form.apr || 0, +form.feeProcessing || 0, +form.feeInsurance || 0, +form.feeManagement || 0, +form.termMonths || 12);
  const apy = calcAPY(+form.apr || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fieldErrors = validateForm(form);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      toast.error('Vui lòng kiểm tra lại thông tin.');
      return;
    }
    try {
      await createDebt(buildPayload(form));
      navigate('/debts');
    } catch (err) {
      console.error(err);
    }
  };

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
            <PlatformPresets activePlatform={form.platform} onSelect={applyPreset} />

            <form onSubmit={handleSubmit} className="space-y-5">
              <BasicInfoSection form={form} errors={errors} update={update} />
              <HiddenFeesSection form={form} errors={errors} update={update} />
              <TermSection
                form={form}
                errors={errors}
                update={update}
                actions={
                  <>
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
                  </>
                }
              />
            </form>
            </div>
          </div>
        </div>

        <div>
          <CostPreviewCard apr={+form.apr || 0} apy={apy} ear={ear} />
        </div>
      </div>
    </motion.div>
  );
}
