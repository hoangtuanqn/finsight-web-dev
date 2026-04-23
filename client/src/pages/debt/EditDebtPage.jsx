import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useDebt, useDebtMutations } from '../../hooks/useDebtQuery';
import { calcEAR, calcAPY, formatPercent } from '../../utils/calculations';
import { Pencil, AlertTriangle, BarChart2 } from 'lucide-react';

const PLATFORM_PRESETS = {
  SPAYLATER: { name: 'SPayLater', apr: 18, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
  LAZPAYLATER: { name: 'LazPayLater', apr: 18, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
  CREDIT_CARD: { name: 'Thẻ tín dụng', apr: 36, rateType: 'REDUCING', feeProcessing: 0, feeInsurance: 0, feeManagement: 0.5 },
  HOME_CREDIT: { name: 'Home Credit', apr: 30, rateType: 'FLAT', feeProcessing: 1, feeInsurance: 0.5, feeManagement: 0 },
  FE_CREDIT: { name: 'FE Credit', apr: 48, rateType: 'FLAT', feeProcessing: 5, feeInsurance: 1, feeManagement: 0.5 },
  CUSTOM: { name: '', apr: 0, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
};

function validateForm(form) {
  const errors = {};

  if (!form.name || !String(form.name).trim()) errors.name = 'Vui lòng nhập tên khoản vay.';
  if (!form.originalAmount || +form.originalAmount <= 0) errors.originalAmount = 'Số tiền gốc phải lớn hơn 0.';
  if (form.balance === '' || form.balance === null || +form.balance < 0) {
    errors.balance = 'Dư nợ hiện tại không được âm.';
  } else if (+form.balance > +form.originalAmount) {
    errors.balance = 'Dư nợ không được lớn hơn số tiền gốc.';
  }
  if (!form.minPayment || +form.minPayment <= 0) {
    errors.minPayment = 'Số tiền trả tối thiểu/tháng phải lớn hơn 0.';
  } else if (+form.balance > 0 && +form.minPayment > +form.balance) {
    errors.minPayment = 'Số tiền trả tối thiểu không được lớn hơn dư nợ hiện tại.';
  }
  if (+form.apr < 0 || +form.apr > 100) errors.apr = 'Lãi suất APR không hợp lệ.';
  if (!form.termMonths || +form.termMonths <= 0) errors.termMonths = 'Kỳ hạn phải lớn hơn 0.';
  if (+form.remainingTerms < 0 || +form.remainingTerms > +form.termMonths) errors.remainingTerms = 'Kỳ còn lại không hợp lệ.';
  if (+form.dueDay < 1 || +form.dueDay > 31) errors.dueDay = 'Ngày đáo hạn phải từ 1 đến 31.';

  return errors;
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

export default function EditDebtPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { data, isLoading: fetching } = useDebt(id);
  const { updateDebt, isUpdating } = useDebtMutations();

  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: '', platform: 'CUSTOM', originalAmount: 0, balance: 0, apr: 18, rateType: 'FLAT',
    feeProcessing: 0, feeInsurance: 0, feeManagement: 0, feePenaltyPerDay: 0.05,
    minPayment: 0, dueDay: 15, termMonths: 12, remainingTerms: 12,
  });

  useEffect(() => {
    if (data?.debt) {
      const { debt } = data;
      setForm({
        name: debt.name,
        platform: debt.platform,
        originalAmount: debt.originalAmount,
        balance: debt.balance,
        apr: debt.apr,
        rateType: debt.rateType,
        feeProcessing: debt.feeProcessing,
        feeInsurance: debt.feeInsurance,
        feeManagement: debt.feeManagement,
        feePenaltyPerDay: debt.feePenaltyPerDay,
        minPayment: debt.minPayment,
        dueDay: debt.dueDay,
        termMonths: debt.termMonths,
        remainingTerms: debt.remainingTerms,
      });
    }
  }, [data]);

  const update = (field, val) => {
    setForm(f => ({ ...f, [field]: val }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: undefined }));
  };

  const applyPreset = (platform) => {
    const preset = PLATFORM_PRESETS[platform];
    setForm(f => ({ ...f, platform, ...preset }));
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
      await updateDebt({
        id,
        data: {
          ...form,
          originalAmount: +form.originalAmount,
          balance:        +form.balance,
          apr:            +form.apr,
          feeProcessing:  +form.feeProcessing  || 0,
          feeInsurance:   +form.feeInsurance   || 0,
          feeManagement:  +form.feeManagement  || 0,
          minPayment:     +form.minPayment,
          dueDay:         Math.round(+form.dueDay),
          termMonths:     Math.round(+form.termMonths),
          remainingTerms: Math.round(+form.remainingTerms),
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
                      form.platform === key
                        ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                        : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:bg-white/[0.06] hover:text-slate-400'
                    }`}
                  >
                    {val.name || 'Tự nhập'}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Tên khoản vay</label>
                  <input className={inputCls(errors.name)} value={form.name} onChange={e => update('name', e.target.value)} placeholder="VD: Mua điện thoại" />
                  <FieldError message={errors.name} />
                </div>
                <div>
                  <label className="input-label">Số tiền gốc</label>
                  <input type="number" className={inputCls(errors.originalAmount)} value={form.originalAmount} onChange={e => update('originalAmount', e.target.value)} />
                  <FieldError message={errors.originalAmount} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Dư nợ hiện tại</label>
                  <input type="number" className={inputCls(errors.balance)} value={form.balance} onChange={e => update('balance', e.target.value)} />
                  <FieldError message={errors.balance} />
                </div>
                <div>
                  <label className="input-label">Lãi suất APR (%/năm)</label>
                  <input type="number" step="0.1" className={inputCls(errors.apr)} value={form.apr} onChange={e => update('apr', e.target.value)} />
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
                  <input type="number" className={inputCls(errors.minPayment)} value={form.minPayment} onChange={e => update('minPayment', e.target.value)} />
                  <FieldError message={errors.minPayment} />
                </div>
              </div>

              <div className="h-px bg-white/[0.06] my-2" />
              <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wide">Phí ẩn</p>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Phí xử lý (%)</label>
                  <input type="number" step="0.1" className={inputCls(errors.feeProcessing)} value={form.feeProcessing} onChange={e => update('feeProcessing', e.target.value)} />
                  <FieldError message={errors.feeProcessing} />
                </div>
                <div>
                  <label className="input-label">Phí bảo hiểm (%/năm)</label>
                  <input type="number" step="0.1" className={inputCls(errors.feeInsurance)} value={form.feeInsurance} onChange={e => update('feeInsurance', e.target.value)} />
                  <FieldError message={errors.feeInsurance} />
                </div>
                <div>
                  <label className="input-label">Phí quản lý (%/năm)</label>
                  <input type="number" step="0.1" className={inputCls(errors.feeManagement)} value={form.feeManagement} onChange={e => update('feeManagement', e.target.value)} />
                  <FieldError message={errors.feeManagement} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Kỳ hạn (tháng)</label>
                  <input type="number" className={inputCls(errors.termMonths)} value={form.termMonths} onChange={e => update('termMonths', e.target.value)} />
                  <FieldError message={errors.termMonths} />
                </div>
                <div>
                  <label className="input-label">Kỳ còn lại</label>
                  <input type="number" className={inputCls(errors.remainingTerms)} value={form.remainingTerms} onChange={e => update('remainingTerms', e.target.value)} />
                  <FieldError message={errors.remainingTerms} />
                </div>
                <div>
                  <label className="input-label">Ngày đáo hạn</label>
                  <input type="number" min="1" max="31" className={inputCls(errors.dueDay)} value={form.dueDay} onChange={e => update('dueDay', e.target.value)} />
                  <FieldError message={errors.dueDay} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isUpdating} className="btn-primary">
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </span>
                  ) : 'Cập nhật khoản nợ'}
                </button>
                <button type="button" onClick={() => navigate(`/debts/${id}`)} className="btn-secondary">Hủy</button>
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
                <span className="font-semibold text-blue-400">{formatPercent(+form.apr || 0)}</span>
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
              {ear > (+form.apr || 0) && (
                <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="text-[12px] text-red-400 flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" /> Chi phí ẩn: <span className="font-semibold">+{formatPercent(ear - (+form.apr || 0))}</span> so với quảng cáo
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
