import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, Zap, ChevronRight } from 'lucide-react';
import { GradientText, Spotlight } from './LandingPage/components/Shared';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useDarkMode } from '../hooks/useDarkMode';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-slate-900 dark:text-slate-50 overflow-hidden font-sans relative selection:bg-blue-500/30">
      {/* Dynamic Web3 Background (Direct from Landing Page) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 dark:bg-blue-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-400/10 dark:bg-cyan-500/20 blur-[150px] animate-pulse [animation-delay:2s]" />
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Hero-style Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-widest mb-8">
              <Sparkles size={14} className="animate-spin-slow" />
              Fintech Intelligence Protocol
            </div>
            
            <h1 className="text-6xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tighter">
              Chào mừng bạn đến với <br />
              <GradientText from="from-blue-600" to="to-cyan-500">FinSight Ecosystem</GradientText>
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 max-w-lg font-medium leading-relaxed">
              Giao thức quản lý tài chính thế hệ mới. Đăng nhập để tối ưu hóa nợ và gia tăng tài sản cùng trí tuệ nhân tạo.
            </p>

            <div className="flex flex-wrap gap-8">
              {[
                { icon: ShieldCheck, text: 'Mã hóa quân sự' },
                { icon: Zap, text: 'Xử lý Real-time' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <item.icon size={20} className="text-blue-500" />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Auth Card (Matches Landing Page Cards) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full max-w-md mx-auto relative group"
          >
            {/* Card Glow Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-30 transition duration-1000" />
            
            <div className="relative bg-white/70 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] border border-white dark:border-white/10 shadow-2xl p-10 lg:p-12">
              {/* Theme Toggle in Corner */}
              <div className="absolute top-8 right-8">
                <ToggleMode dark={dark} setDark={setDark} />
              </div>

              {/* Header */}
              <div className="mb-10">
                <div className="flex items-center gap-3 mb-6 lg:hidden">
                   <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">F</div>
                   <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">FinSight</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Đăng nhập</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Tiếp tục hành trình tài chính của bạn</p>
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

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Identity Email</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-4 text-slate-900 dark:text-white font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="name@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between px-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Access Key</label>
                    <Link to="/forgot" className="text-xs font-bold text-blue-500 hover:underline">Quên mật khẩu?</Link>
                  </div>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-4 text-slate-900 dark:text-white font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Vào Dashboard <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                </button>
              </form>

              <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-4">
                  Chưa kích hoạt tài khoản?
                </p>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 text-blue-500 font-black hover:gap-3 transition-all"
                >
                  Đăng ký tài khoản mới <ArrowRight size={18} />
                </Link>
              </div>

              {/* Demo Sandbox Alert */}
              <div className="mt-8 p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 dark:border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Demo Sandbox Access</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Email: <span className="text-slate-900 dark:text-white">demo@finsight.vn</span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Pass: <span className="text-slate-900 dark:text-white">Demo@123</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
