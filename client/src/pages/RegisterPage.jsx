import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, Zap, ChevronRight } from 'lucide-react';
import { GradientText, Spotlight } from './LandingPage/components/Shared';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useDarkMode } from '../hooks/useDarkMode';

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();

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
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-slate-900 dark:text-slate-50 overflow-hidden font-sans relative selection:bg-blue-500/30">
      {/* Dynamic Web3 Background (Direct from Landing Page) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-500/20 blur-[150px] animate-pulse [animation-delay:2s]" />
        <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Side (Content) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles size={14} className="animate-spin-slow" />
              Intelligence ERA Protocol
            </div>

            <h1 className="text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tighter">
              Bắt đầu hành trình <br />
              <GradientText from="from-purple-600" to="to-pink-500">Tài chính mới</GradientText>
            </h1>

            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-lg font-medium leading-relaxed">
              Tạo định danh tài chính để truy cập vào hệ thống bóc tách nợ và phân bổ tài sản tự động. Bảo mật và an toàn tuyệt đối.
            </p>

            <div className="flex flex-wrap gap-6">
              {[
                { icon: ShieldCheck, text: 'Mã hóa quân sự', color: 'text-blue-500' },
                { icon: Zap, text: 'Xử lý Real-time', color: 'text-amber-500' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-[2rem] bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-md">
                    <item.icon size={24} className={item.color} />
                  </div>
                  <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{item.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side (Auth Card) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-md mx-auto relative group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000" />

            <div className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/10 shadow-2xl p-10 lg:p-12">
              <div className="absolute top-8 right-8">
                <ToggleMode dark={dark} setDark={setDark} />
              </div>

              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6 lg:hidden">
                   <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg">F</div>
                   <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">FinSight</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Đăng ký</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Khởi tạo Node tài chính của bạn</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-8 text-sm text-red-500 dark:text-red-400 flex items-start gap-3"
                >
                  <AlertTriangle size={18} className="shrink-0" />
                  <span className="font-bold">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><User size={18} /></div>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={e => update('fullName', e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><Mail size={18} /></div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="Email của bạn"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><Lock size={18} /></div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => update('password', e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><Lock size={18} /></div>
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={e => update('confirmPassword', e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:border-blue-500 outline-none transition-all text-sm"
                      placeholder="Xác nhận mật khẩu"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all disabled:opacity-70 mt-4"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Đăng ký ngay <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
                <Link to="/login" className="text-xs font-black text-blue-500 uppercase tracking-widest hover:underline">
                  Đã có tài khoản? Quay lại Đăng nhập
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
