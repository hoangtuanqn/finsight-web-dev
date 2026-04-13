import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/index.js';
import { formatVND } from '../utils/calculations';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ fullName: '', monthlyIncome: 0, extraBudget: 0 });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName, monthlyIncome: user.monthlyIncome || 0, extraBudget: user.extraBudget || 0 });
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white">👤 Hồ sơ cá nhân</h1>
        <p className="text-slate-500 text-sm mt-1">Quản lý thông tin tài khoản và cài đặt tài chính</p>
      </div>

      <div className="glass-card">
        {/* Avatar section */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="text-[16px] font-semibold text-white">{user?.fullName}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2.5 mb-5 text-sm text-emerald-400"
          >
            ✅ Đã lưu thay đổi thành công!
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Họ và tên</label>
            <div className="input-group">
              <span className="input-icon">👤</span>
              <input
                className="input-field has-icon"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Thu nhập hàng tháng</label>
            <div className="input-group">
              <span className="input-icon">💰</span>
              <input
                type="number"
                className="input-field has-icon"
                value={form.monthlyIncome}
                onChange={e => setForm(f => ({ ...f, monthlyIncome: +e.target.value }))}
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 ml-1">Hiện tại: {formatVND(form.monthlyIncome)}</p>
          </div>

          <div>
            <label className="input-label">Ngân sách trả nợ thêm/tháng</label>
            <div className="input-group">
              <span className="input-icon">📊</span>
              <input
                type="number"
                className="input-field has-icon"
                value={form.extraBudget}
                onChange={e => setForm(f => ({ ...f, extraBudget: +e.target.value }))}
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 ml-1">
              Ngoài tổng trả tối thiểu, bạn có thêm bao nhiêu để trả nợ nhanh hơn?
            </p>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </span>
              ) : 'Cập nhật hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
