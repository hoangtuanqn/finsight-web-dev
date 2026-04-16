import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/index.js';
import { formatVND } from '../utils/calculations';
import { User, Mail, DollarSign, TrendingDown, CheckCircle, Rocket, AlertTriangle, Target, Shield, Flame, Clock, Calendar, TrendingUp, Wallet, BarChart2, CreditCard } from 'lucide-react';

const HORIZON_OPTIONS = [
  { value: 'SHORT',  label: 'Ngắn hạn — dưới 1 năm' },
  { value: 'MEDIUM', label: 'Trung hạn — 1 đến 3 năm' },
  { value: 'LONG',   label: 'Dài hạn — trên 3 năm' },
];

const HORIZON_LABEL = { SHORT: 'Ngắn hạn', MEDIUM: 'Trung hạn', LONG: 'Dài hạn' };
const GOAL_LABEL = { GROWTH: 'Tăng trưởng tài sản', INCOME: 'Dòng tiền thụ động', STABILITY: 'Bảo toàn vốn', SPECULATION: 'Đầu cơ mạo hiểm' };

const RISK_META = {
  LOW:    { label: 'Thấp — An toàn',       color: '#10b981', Icon: Shield },
  MEDIUM: { label: 'Vừa phải — Cân bằng', color: '#f59e0b', Icon: Target },
  HIGH:   { label: 'Cao — Mạo hiểm',       color: '#ef4444', Icon: Flame },
};

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    monthlyIncome: 0,
    extraBudget: 0,
    capital: 0,
    goal: 'GROWTH',
    horizon: 'MEDIUM',
    riskLevel: 'MEDIUM',
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName:      user.fullName || '',
        email:         user.email || '',
        monthlyIncome: user.monthlyIncome || 0,
        extraBudget:   user.extraBudget || 0,
        capital:       user.investorProfile?.capital || 0,
        goal:          user.investorProfile?.goal || 'GROWTH',
        horizon:       user.investorProfile?.horizon || 'MEDIUM',
        riskLevel:     user.investorProfile?.riskLevel || 'MEDIUM',
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

  const riskMeta    = RISK_META[user?.investorProfile?.riskLevel || 'MEDIUM'];
  const RiskIcon    = riskMeta.Icon;
  const riskScore   = user?.investorProfile?.riskScore;
  const lastUpdated = user?.investorProfile?.lastUpdated
    ? new Date(user.investorProfile.lastUpdated).toLocaleDateString('vi-VN')
    : null;
  const hasCompletedQuiz = riskScore !== undefined && riskScore !== null;

  // Avatar initials
  const initials = (user?.fullName || 'U')
    .split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-white flex items-center gap-2"><User size={20} /> Hồ sơ cá nhân</h1>
        <p className="text-slate-500 text-sm mt-1">Cần hoàn thiện thông tin để hệ thống AI đánh giá tài chính chính xác nhất</p>
      </div>

      {/* 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

        {/* ── LEFT: Form (2/3 width) ── */}
        <div className="xl:col-span-2 space-y-4">

          {/* Risk Assessment Banner */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card flex items-center justify-between gap-4 py-4 px-5 ${
              hasCompletedQuiz ? '' : 'bg-amber-500/5 border-amber-500/20'
            }`}
            style={hasCompletedQuiz ? { borderColor: `${riskMeta.color}25` } : {}}
          >
            <div className="flex items-center gap-3">
              <RiskIcon size={20} style={{ color: riskMeta.color }} />
              <div>
                <p className="text-sm font-semibold text-white">
                  Khẩu vị rủi ro: <span style={{ color: riskMeta.color }}>{riskMeta.label}</span>
                </p>
                {hasCompletedQuiz ? (
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Target size={10} /> Điểm quiz: <span className="font-semibold text-white">{riskScore}/100</span>
                    {lastUpdated && (<><span className="mx-1">·</span><Calendar size={10} /> Cập nhật: {lastUpdated}</>)}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-400 mt-0.5">Chưa làm đánh giá rủi ro — đang dùng giá trị mặc định</p>
                )}
              </div>
            </div>
            <Link to="/risk-assessment" className="btn-ghost text-[12px] flex items-center gap-1.5 shrink-0">
              <Target size={13} />
              {hasCompletedQuiz ? 'Làm lại quiz' : 'Làm quiz ngay'}
            </Link>
          </motion.div>

          {/* Main form card */}
          <div className="glass-card">
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-4 py-2.5 mb-5 text-sm text-emerald-400 flex items-center gap-2"
              >
                <CheckCircle size={16} /> Đã lưu thay đổi thành công!
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section 1: Thông tin cơ bản */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Họ và tên</label>
                    <div className="input-group">
                      <span className="input-icon"><User size={16} /></span>
                      <input className="input-field has-icon" value={form.fullName}
                        onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Email nhận cảnh báo</label>
                    <div className="input-group">
                      <span className="input-icon"><Mail size={16} /></span>
                      <input type="email" className="input-field has-icon" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Section 2: Tài chính */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Tài chính & Thu nhập
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label text-[12px]">Thu nhập hằng tháng</label>
                    <div className="input-group">
                      <span className="input-icon"><DollarSign size={16} /></span>
                      <input type="number" className="input-field has-icon" value={form.monthlyIncome}
                        onChange={e => setForm(f => ({ ...f, monthlyIncome: +e.target.value }))} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{formatVND(form.monthlyIncome)}</p>
                  </div>
                  <div>
                    <label className="input-label text-[12px]">Ngân sách trả nợ thêm/tháng</label>
                    <div className="input-group">
                      <span className="input-icon"><TrendingDown size={16} /></span>
                      <input type="number" className="input-field has-icon" value={form.extraBudget}
                        onChange={e => setForm(f => ({ ...f, extraBudget: +e.target.value }))} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{formatVND(form.extraBudget)}</p>
                  </div>
                </div>
                <div>
                  <label className="input-label text-[12px]">Số vốn đang có (Tổng tài sản)</label>
                  <div className="input-group">
                    <span className="input-icon"><DollarSign size={16} /></span>
                    <input type="number" className="input-field has-icon" value={form.capital}
                      placeholder="Ví dụ: 100,000,000"
                      onChange={e => setForm(f => ({ ...f, capital: +e.target.value }))} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{formatVND(form.capital)}</p>
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Section 3: Chiến lược đầu tư */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Chiến lược đầu tư
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="input-label text-[12px]">Mục tiêu tài chính</label>
                    <select className="input-field" value={form.goal}
                      onChange={e => setForm(f => ({ ...f, goal: e.target.value }))}>
                      <option value="GROWTH">Tăng trưởng tài sản</option>
                      <option value="INCOME">Tạo dòng tiền thụ động</option>
                      <option value="STABILITY">Bảo toàn vốn</option>
                      <option value="SPECULATION">Đầu cơ mạo hiểm</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label text-[12px] flex items-center gap-1">
                      <Clock size={11} /> Thời hạn đầu tư
                    </label>
                    <select className="input-field" value={form.horizon}
                      onChange={e => setForm(f => ({ ...f, horizon: e.target.value }))}>
                      {HORIZON_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label text-[12px] flex items-center gap-1.5">
                      <RiskIcon size={11} style={{ color: riskMeta.color }} />
                      Khẩu vị rủi ro
                      {hasCompletedQuiz && <span className="text-[9px] text-slate-600">(từ quiz)</span>}
                    </label>
                    <select className="input-field" value={form.riskLevel}
                      onChange={e => setForm(f => ({ ...f, riskLevel: e.target.value }))}>
                      <option value="LOW">Thấp — An toàn</option>
                      <option value="MEDIUM">Vừa phải — Cân bằng</option>
                      <option value="HIGH">Cao — Mạo hiểm</option>
                    </select>
                    {hasCompletedQuiz && (
                      <p className="text-[10px] text-slate-600 mt-1">
                        Quiz đề xuất: <span style={{ color: riskMeta.color }} className="font-medium">{riskMeta.label}</span>
                      </p>
                    )}
                  </div>
                </div>
                {!hasCompletedQuiz && (
                  <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl px-4 py-3 text-sm text-amber-400 flex items-center gap-2">
                    <AlertTriangle size={14} className="shrink-0" />
                    Bạn chưa hoàn thành bài đánh giá rủi ro. Khẩu vị rủi ro sẽ chính xác hơn nếu bạn{' '}
                    <Link to="/risk-assessment" className="underline font-semibold hover:text-amber-300 transition-colors">làm quiz 5 câu hỏi</Link>.
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/6">
                <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto md:px-10">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </span>
                  ) : <span className="flex items-center gap-2"><Rocket size={16} /> Lưu toàn bộ thông tin</span>}
                </button>
                <p className="text-[11px] text-slate-500 mt-4">
                  <AlertTriangle size={12} className="inline mr-1" />
                  Cần cập nhật tối thiểu các thông tin trên để mở khóa tính năng <strong>Tư vấn AI</strong>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT: Summary Panel (1/3 width) ── */}
        <div className="space-y-4">

          {/* Avatar + Name card */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card text-center py-6"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {initials}
            </div>
            <p className="font-semibold text-white text-[15px]">{user?.fullName || '—'}</p>
            <p className="text-[12px] text-slate-500 mt-0.5">{user?.email || '—'}</p>
            <div
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-medium"
              style={{ background: `${riskMeta.color}18`, color: riskMeta.color }}
            >
              <RiskIcon size={11} /> {riskMeta.label}
            </div>
          </motion.div>

          {/* Tóm tắt hồ sơ */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Tóm tắt hồ sơ</p>
            <div className="space-y-0 divide-y divide-white/5">
              {[
                { icon: <DollarSign size={13} />, label: 'Thu nhập / tháng', value: formatVND(user?.monthlyIncome || 0), color: '#10b981' },
                { icon: <TrendingDown size={13} />, label: 'Trả nợ thêm / tháng', value: formatVND(user?.extraBudget || 0), color: '#f59e0b' },
                { icon: <Wallet size={13} />, label: 'Tổng vốn', value: formatVND(user?.investorProfile?.capital || 0), color: '#3b82f6' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-slate-500 flex items-center gap-1.5">
                    <span style={{ color: row.color }}>{row.icon}</span>
                    {row.label}
                  </span>
                  <span className="text-[12px] font-semibold text-white">{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Chiến lược đầu tư summary */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Chiến lược đầu tư</p>
            <div className="space-y-0 divide-y divide-white/5">
              {[
                { icon: <Target size={13} />, label: 'Mục tiêu', value: GOAL_LABEL[user?.investorProfile?.goal || 'GROWTH'], color: '#8b5cf6' },
                { icon: <Clock size={13} />, label: 'Thời hạn', value: HORIZON_LABEL[user?.investorProfile?.horizon || 'MEDIUM'], color: '#06b6d4' },
                { icon: <RiskIcon size={13} />, label: 'Khẩu vị rủi ro', value: riskMeta.label, color: riskMeta.color },
                ...(hasCompletedQuiz ? [{ icon: <BarChart2 size={13} />, label: 'Điểm quiz', value: `${riskScore}/100`, color: riskMeta.color }] : []),
                ...(lastUpdated ? [{ icon: <Calendar size={13} />, label: 'Cập nhật', value: lastUpdated, color: '#64748b' }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-slate-500 flex items-center gap-1.5">
                    <span style={{ color: row.color }}>{row.icon}</span>
                    {row.label}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card"
          >
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Liên kết nhanh</p>
            <div className="space-y-1.5">
              {[
                { to: '/risk-assessment', icon: <Target size={13} />, label: hasCompletedQuiz ? 'Làm lại quiz rủi ro' : 'Đánh giá rủi ro ngay', color: '#8b5cf6' },
                { to: '/investment',      icon: <TrendingUp size={13} />, label: 'Phân bổ đầu tư AI',    color: '#3b82f6' },
                { to: '/debts',           icon: <CreditCard size={13} />, label: 'Quản lý khoản nợ',     color: '#ef4444' },
                { to: '/debts/dti',       icon: <BarChart2 size={13} />,  label: 'Phân tích DTI',        color: '#10b981' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                >
                  <span style={{ color: link.color }}>{link.icon}</span>
                  <span className="text-[12px] text-slate-400 group-hover:text-white transition-colors">{link.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

      </div>
    </motion.div>
  );
}

