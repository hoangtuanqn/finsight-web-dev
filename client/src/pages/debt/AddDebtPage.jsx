import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { debtAPI } from '../../api/index.js';
import { calcEAR, calcAPY, formatPercent } from '../../utils/calculations';
import { Plus, AlertTriangle, BarChart2 } from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Tính số kỳ còn lại dựa vào ngày vay và kỳ hạn
function calcRemainingTerms(startDate, termMonths) {
  if (!startDate || !termMonths) return null;
  const start = new Date(startDate);
  const now = new Date();
  const monthsPassed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(0, termMonths - monthsPassed);
}

// ─── Validation ───────────────────────────────────────────────────────────────

// Trả về object { field: 'message' } cho từng lỗi
function validateForm(form) {
  const errors = {};

  if (!form.name.trim())
    errors.name = 'Vui lòng nhập tên khoản vay.';

  if (!form.originalAmount || +form.originalAmount <= 0)
    errors.originalAmount = 'Số tiền gốc phải lớn hơn 0.';

  if (form.balance === '' || +form.balance <= 0)
    errors.balance = 'Dư nợ hiện tại phải lớn hơn 0.';
  else if (+form.balance > +form.originalAmount)
    errors.balance = 'Dư nợ không được lớn hơn số tiền gốc.';

  if (form.minPayment === '' || +form.minPayment <= 0)
    errors.minPayment = 'Số tiền trả tối thiểu/tháng phải lớn hơn 0.';
  else if (form.balance !== '' && +form.minPayment > +form.balance)
    errors.minPayment = 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.';

  if (+form.apr < 0)
    errors.apr = 'Lãi suất APR không được âm.';
  else if (+form.apr > 100)
    errors.apr = 'Lãi suất APR không được vượt quá 100%.';

  if (+form.feeProcessing < 0)
    errors.feeProcessing = 'Phí xử lý không được âm.';
  else if (+form.feeProcessing > 100)
    errors.feeProcessing = 'Phí xử lý không được vượt quá 100%.';

  if (+form.feeInsurance < 0)
    errors.feeInsurance = 'Phí bảo hiểm không được âm.';
  else if (+form.feeInsurance > 100)
    errors.feeInsurance = 'Phí bảo hiểm không được vượt quá 100%.';

  if (+form.feeManagement < 0)
    errors.feeManagement = 'Phí quản lý không được âm.';
  else if (+form.feeManagement > 100)
    errors.feeManagement = 'Phí quản lý không được vượt quá 100%.';

  if (!form.startDate)
    errors.startDate = 'Vui lòng chọn ngày vay.';
  else if (new Date(form.startDate) > new Date())
    errors.startDate = 'Ngày vay không được ở tương lai.';

  if (form.termMonths <= 0)
    errors.termMonths = 'Kỳ hạn phải lớn hơn 0.';

  if (form.dueDay < 1 || form.dueDay > 31)
    errors.dueDay = 'Ngày đáo hạn phải từ 1 đến 31.';

  return errors;
}

// ─── Payload builder ──────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Text lỗi hiển thị dưới ô input
function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1">
      <AlertTriangle size={11} className="shrink-0" />
      {message}
    </p>
  );
}

// Thêm class border đỏ khi có lỗi
function inputCls(hasError) {
  return `input-field ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlatformPresets({ activePlatform, onSelect }) {
  return (
    <div className="mb-6">
      <label className="input-label">Nền tảng</label>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PLATFORM_PRESETS).map(([key, val]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
              activePlatform === key
                ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-400'
            }`}
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
          <input
            type="number"
            className={inputCls(errors.originalAmount)}
            value={form.originalAmount}
            onChange={e => update('originalAmount', e.target.value)}
            placeholder="0"
          />
          <FieldError message={errors.originalAmount} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="input-label">Dư nợ hiện tại</label>
          <input
            type="number"
            className={inputCls(errors.balance)}
            value={form.balance}
            onChange={e => update('balance', e.target.value)}
            placeholder="0"
          />
          <FieldError message={errors.balance} />
        </div>
        <div>
          <label className="input-label">Lãi suất APR (%/năm)</label>
          <input
            type="number"
            step="0.1"
            className={inputCls(errors.apr)}
            value={form.apr}
            onChange={e => update('apr', e.target.value)}
            placeholder="0"
          />
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
          <input
            type="number"
            className={inputCls(errors.minPayment)}
            value={form.minPayment}
            onChange={e => update('minPayment', e.target.value)}
            placeholder="0"
          />
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
          <input type="number" step="0.1" className={inputCls(errors.feeProcessing)} value={form.feeProcessing} onChange={e => update('feeProcessing', e.target.value)} placeholder="0" />
          <FieldError message={errors.feeProcessing} />
        </div>
        <div>
          <label className="input-label">Phí bảo hiểm (%/năm)</label>
          <input type="number" step="0.1" className={inputCls(errors.feeInsurance)} value={form.feeInsurance} onChange={e => update('feeInsurance', e.target.value)} placeholder="0" />
          <FieldError message={errors.feeInsurance} />
        </div>
        <div>
          <label className="input-label">Phí quản lý (%/năm)</label>
          <input type="number" step="0.1" className={inputCls(errors.feeManagement)} value={form.feeManagement} onChange={e => update('feeManagement', e.target.value)} placeholder="0" />
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
    <div className="glass-card sticky top-8">
      <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart2 size={16} /> Xem trước chi phí
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">APR (quảng cáo)</span>
          <span className="font-semibold text-blue-400">{formatPercent(apr)}</span>
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
        {ear > apr && (
          <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
            <p className="text-[12px] text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} className="shrink-0" />
              Chi phí ẩn: <span className="font-semibold">+{formatPercent(ear - apr)}</span> so với quảng cáo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddDebtPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    // Xóa lỗi của field ngay khi user bắt đầu sửa
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
    setErrors({});
    setLoading(true);
    try {
      await debtAPI.create(buildPayload(form));
      toast.success('Thêm khoản nợ thành công!');
      navigate('/debts');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Thêm nợ thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/debts" className="text-slate-500 hover:text-slate-300 transition-colors">Quản lý nợ</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Thêm mới</span>
      </div>

      <h1 className="text-[22px] font-bold text-white mb-6 flex items-center gap-2">
        <Plus size={20} /> Thêm khoản nợ mới
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="glass-card">
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
                    <button type="submit" disabled={loading} className="btn-primary">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang lưu...
                        </span>
                      ) : 'Thêm khoản nợ'}
                    </button>
                    <button type="button" onClick={() => navigate('/debts')} className="btn-secondary">Hủy</button>
                  </>
                }
              />
            </form>
          </div>
        </div>

        {/* Live cost preview */}
        <div>
          <CostPreviewCard apr={+form.apr || 0} apy={apy} ear={ear} />
        </div>
      </div>
    </motion.div>
  );
}
