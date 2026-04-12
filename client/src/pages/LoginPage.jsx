import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import heroImg from '../assets/finance-illustration.png';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

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
            className="w-80 h-80 mx-auto object-contain mb-8 drop-shadow-2xl"
          />
          <h2 className="text-2xl font-bold text-white mb-3">
            Quản lý tài chính thông minh
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Theo dõi nợ, phân tích lãi suất thực, và nhận tư vấn đầu tư
            dựa trên AI với tâm lý thị trường real-time.
          </p>
        </motion.div>

        {/* Decorative dots */}
        <div className="absolute top-8 left-8 w-2 h-2 rounded-full bg-blue-500/30" />
        <div className="absolute top-24 right-16 w-3 h-3 rounded-full bg-cyan-500/20" />
        <div className="absolute bottom-32 left-20 w-2 h-2 rounded-full bg-blue-400/20" />
        <div className="absolute bottom-16 right-12 w-4 h-4 rounded-full bg-cyan-500/10" />
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
            <h1 className="text-2xl font-bold text-white mb-1">Chào mừng trở lại!</h1>
            <p className="text-slate-500 text-sm">Đăng nhập để tiếp tục quản lý tài chính</p>
          </div>

          {/* Error */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Email</label>
              <div className="input-group">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field has-icon"
                  placeholder="email@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Mật khẩu</label>
              <div className="input-group">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field has-icon"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
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
                'Đăng nhập'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-slate-600">Chưa có tài khoản?</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Register Link */}
          <Link
            to="/register"
            className="btn-secondary w-full py-3 text-center text-[15px] block"
          >
            Đăng ký tài khoản mới
          </Link>

          {/* Demo credentials */}
          <div className="mt-6 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
            <p className="text-xs text-blue-400/80 text-center">
              🎮 Demo: <code className="font-mono">demo@finsight.vn</code> / <code className="font-mono">Demo@123</code>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
