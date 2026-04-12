import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { debtAPI } from '../../api/index.js';
import { calcEAR, calcAPY, formatVND, formatPercent } from '../../utils/calculations';

const PLATFORM_PRESETS = {
  SPAYLATER: { name: 'SPayLater', apr: 18, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
  LAZPAYLATER: { name: 'LazPayLater', apr: 18, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
  CREDIT_CARD: { name: 'Thẻ tín dụng', apr: 36, rateType: 'REDUCING', feeProcessing: 0, feeInsurance: 0, feeManagement: 0.5 },
  HOME_CREDIT: { name: 'Home Credit', apr: 30, rateType: 'FLAT', feeProcessing: 1, feeInsurance: 0.5, feeManagement: 0 },
  FE_CREDIT: { name: 'FE Credit', apr: 48, rateType: 'FLAT', feeProcessing: 5, feeInsurance: 1, feeManagement: 0.5 },
  CUSTOM: { name: '', apr: 0, rateType: 'FLAT', feeProcessing: 0, feeInsurance: 0, feeManagement: 0 },
};

export default function AddDebtPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', platform: 'SPAYLATER', originalAmount: 0, balance: 0, apr: 18, rateType: 'FLAT',
    feeProcessing: 0, feeInsurance: 0, feeManagement: 0, feePenaltyPerDay: 0.05,
    minPayment: 0, dueDay: 15, termMonths: 12, remainingTerms: 12,
  });

  const applyPreset = (platform) => {
    const preset = PLATFORM_PRESETS[platform];
    setForm(f => ({ ...f, platform, ...preset }));
  };

  const ear = calcEAR(form.apr, form.feeProcessing, form.feeInsurance, form.feeManagement, form.termMonths);
  const apy = calcAPY(form.apr);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await debtAPI.create(form);
      navigate('/debts');
    } catch (err) {
      setError(err.response?.data?.error || 'Thêm nợ thất bại');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link to="/debts" className="text-slate-500 hover:text-slate-300 transition-colors">Quản lý nợ</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Thêm mới</span>
      </div>

      <h1 className="text-[22px] font-bold text-white mb-6">➕ Thêm khoản nợ mới</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="glass-card">
            {error && (
              <div className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-red-400">
                ⚠️ {error}
              </div>
            )}

            {/* Platform presets */}
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
                  <input className="input-field" value={form.name} onChange={e => update('name', e.target.value)} placeholder="VD: Mua điện thoại" required />
                </div>
                <div>
                  <label className="input-label">Số tiền gốc</label>
                  <input type="number" className="input-field" value={form.originalAmount} onChange={e => update('originalAmount', +e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Dư nợ hiện tại</label>
                  <input type="number" className="input-field" value={form.balance} onChange={e => update('balance', +e.target.value)} required />
                </div>
                <div>
                  <label className="input-label">Lãi suất APR (%/năm)</label>
                  <input type="number" step="0.1" className="input-field" value={form.apr} onChange={e => update('apr', +e.target.value)} required />
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
                  <input type="number" className="input-field" value={form.minPayment} onChange={e => update('minPayment', +e.target.value)} required />
                </div>
              </div>

              <div className="h-px bg-white/[0.06] my-2" />

              <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wide">Phí ẩn</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Phí xử lý (%)</label>
                  <input type="number" step="0.1" className="input-field" value={form.feeProcessing} onChange={e => update('feeProcessing', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Phí bảo hiểm (%/năm)</label>
                  <input type="number" step="0.1" className="input-field" value={form.feeInsurance} onChange={e => update('feeInsurance', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Phí quản lý (%/năm)</label>
                  <input type="number" step="0.1" className="input-field" value={form.feeManagement} onChange={e => update('feeManagement', +e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="input-label">Kỳ hạn (tháng)</label>
                  <input type="number" className="input-field" value={form.termMonths} onChange={e => update('termMonths', +e.target.value)} required />
                </div>
                <div>
                  <label className="input-label">Kỳ còn lại</label>
                  <input type="number" className="input-field" value={form.remainingTerms} onChange={e => update('remainingTerms', +e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Ngày đáo hạn</label>
                  <input type="number" min="1" max="31" className="input-field" value={form.dueDay} onChange={e => update('dueDay', +e.target.value)} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </span>
                  ) : 'Thêm khoản nợ'}
                </button>
                <button type="button" onClick={() => navigate('/debts')} className="btn-secondary">Hủy</button>
              </div>
            </form>
          </div>
        </div>

        {/* Live EAR Preview */}
        <div>
          <div className="glass-card sticky top-8">
            <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
              <span>📊</span> Xem trước chi phí
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">APR (quảng cáo)</span>
                <span className="font-semibold text-blue-400">{formatPercent(form.apr)}</span>
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
              {ear > form.apr && (
                <div className="bg-red-500/8 border border-red-500/15 rounded-xl px-3 py-2.5">
                  <p className="text-[12px] text-red-400">
                    ⚠️ Chi phí ẩn: <span className="font-semibold">+{formatPercent(ear - form.apr)}</span> so với quảng cáo
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
