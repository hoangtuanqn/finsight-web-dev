import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/finance-illustration.png';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (form.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="auth-layout">
      {/* Left — Illustration */}
      <div className="auth-illustration">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 text-center max-w-md"
        >
          <img
            src={heroImg}
            alt="Finance Illustration"
            className="w-72 h-72 mx-auto object-contain mb-8 drop-shadow-2xl"
          />
          <h2 className="text-2xl font-bold text-white mb-3">
            Bắt đầu hành trình tài chính
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Tạo tài khoản miễn phí để theo dõi nợ, tối ưu chi phí lãi suất,
            và nhận tư vấn phân bổ đầu tư thông minh.
          </p>
        </motion.div>
      </div>

      {/* Right — Form */}
      <div className="auth-form-side">
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">F</span>
              </div>
              <span className="text-xl font-bold text-gradient">FinSight</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Tạo tài khoản</h1>
            <p className="text-slate-500 text-sm">Đăng ký để bắt đầu quản lý tài chính ngay hôm nay</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/8 border border-red-500/20 rounded-xl px-4 py-3 mb-5 text-sm text-red-400 flex items-start gap-2"
            >
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label">Họ và tên *</label>
              <div className="input-group">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => update('fullName', e.target.value)}
                  className="input-field has-icon"
                  placeholder="Nguyễn Văn A"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email *</label>
              <div className="input-group">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  className="input-field has-icon"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Mật khẩu *</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  className="input-field has-icon"
                  placeholder="Ít nhất 6 ký tự"
                  required
                  minLength={6}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Xác nhận mật khẩu *</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                  className="input-field has-icon"
                  placeholder="Nhập lại mật khẩu"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-[15px]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang xử lý...
                </span>
              ) : (
                'Đăng ký'
              )}
            </button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-600">Đã có tài khoản?</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <Link
            to="/login"
            className="btn-secondary w-full py-3 text-center text-[15px] block"
          >
            Đăng nhập
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
