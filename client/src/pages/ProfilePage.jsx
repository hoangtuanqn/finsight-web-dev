import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/index.js';
import { formatVND } from '../utils/calculations';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    monthlyIncome: 0,
    extraBudget: 0,
    capital: 0,
    goal: 'GROWTH',
    riskLevel: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        monthlyIncome: user.monthlyIncome || 0,
        extraBudget: user.extraBudget || 0,
        capital: user.investorProfile?.capital || 0,
        goal: user.investorProfile?.goal || 'GROWTH',
        riskLevel: user.investorProfile?.riskLevel || 'MEDIUM'
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      const res = await userAPI.updateProfile(form);
      setUser(prev => ({ ...prev, ...res.data.data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl pb-10">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">👤 Hồ sơ cá nhân</h1>
        <p className="text-slate-500 text-sm mt-1">Cần hoàn thiện thông tin để hệ thống AI đánh giá tài chính chính xác nhất</p>
      </div>

      <div className="glass-card">
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2.5 mb-5 text-sm text-emerald-400"
          >
            ✅ Đã lưu thay đổi thành công!
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Thông tin cơ bản */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Họ và tên</label>
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input
                    className="input-field has-icon"
                    value={form.fullName}
                    onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Email nhận cảnh báo</label>
                <div className="input-group">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    className="input-field has-icon"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/[0.05]" />

          {/* Section 2: Tài chính cá nhân */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Tài chính & Thu nhập
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[12px]">Thu nhập hằng tháng</label>
                <div className="input-group">
                  <span className="input-icon">💰</span>
                  <input
                    type="number"
                    className="input-field has-icon"
                    value={form.monthlyIncome}
                    onChange={e => setForm(f => ({ ...f, monthlyIncome: +e.target.value }))}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{formatVND(form.monthlyIncome)}</p>
              </div>

              <div>
                <label className="input-label text-[12px]">Ngân sách trả nợ thêm/tháng</label>
                <div className="input-group">
                  <span className="input-icon">📉</span>
                  <input
                    type="number"
                    className="input-field has-icon"
                    value={form.extraBudget}
                    onChange={e => setForm(f => ({ ...f, extraBudget: +e.target.value }))}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{formatVND(form.extraBudget)}</p>
              </div>
            </div>

            <div>
              <label className="input-label text-[12px]">Số vốn đang có (Tổng tài sản)</label>
              <div className="input-group">
                <span className="input-icon">🏛️</span>
                <input
                  type="number"
                  className="input-field has-icon"
                  value={form.capital}
                  placeholder="Ví dụ: 100,000,000"
                  onChange={e => setForm(f => ({ ...f, capital: +e.target.value }))}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{formatVND(form.capital)}</p>
            </div>
          </div>

          <div className="h-px bg-white/[0.05]" />

          {/* Section 3: Mục tiêu đầu tư */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Chiến lược đầu tư
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label text-[12px]">Mục tiêu tài chính</label>
                <select
                  className="input-field"
                  value={form.goal}
                  onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}
                >
                  <option value="GROWTH">Tăng trưởng tài sản</option>
                  <option value="INCOME">Tạo dòng tiền thụ động</option>
                  <option value="STABILITY">Bảo toàn vốn</option>
                  <option value="SPECULATION">Đầu cơ mạo hiểm</option>
                </select>
              </div>
              <div>
                <label className="input-label text-[12px]">Khẩu vị rủi ro</label>
                <select
                  className="input-field"
                  value={form.riskLevel}
                  onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))}
                >
                  <option value="LOW">Thấp (An toàn)</option>
                  <option value="MEDIUM">Vừa phải (Cân bằng)</option>
                  <option value="HIGH">Cao (Mạo hiểm)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/[0.06]">
            <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto md:px-10">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </span>
              ) : '🚀 Lưu toàn bộ thông tin'}
            </button>
            <p className="text-[11px] text-slate-500 mt-4 text-center">
              ⚠️ Cần cập nhật tối thiểu các thông tin trên để mở khóa tính năng <strong>Tư vấn AI</strong>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
