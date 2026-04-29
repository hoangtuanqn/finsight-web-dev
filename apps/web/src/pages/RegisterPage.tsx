import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { 
  AlertTriangle, User, Mail, Lock, Eye, EyeOff, 
  ArrowRight, Sparkles, ShieldCheck, Zap, ChevronRight, 
  CheckCircle2, PartyPopper, Coins
} from 'lucide-react';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { GradientText, Spotlight } from './LandingPage/components/Shared';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useDarkMode } from '../hooks/useDarkMode';
import { referralAPI } from '../api/index';

const registerSchema = z.object({
  fullName: z.string()
    .min(1, 'Họ tên không được để trống')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ tên không được vượt quá 50 ký tự'),
  email: z.string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ'),
  password: z.string()
    .min(1, 'Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string()
    .min(1, 'Xác nhận mật khẩu là bắt buộc'),
  referralCode: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword']
});

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register: registerAuth } = useAuth() as any;
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const hasTracked = useRef(false);

  useEffect(() => {
    if (refCode && !hasTracked.current) {
      hasTracked.current = true;
      referralAPI.trackClick(refCode).catch(err => {
        console.error('[Referral] Failed to track click:', err);
      });
    }
  }, [refCode]);

  const { register, handleSubmit, formState: { errors, watch } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', referralCode: refCode }
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: any) => {
    setServerError('');
    setLoading(true);
    try {
      await registerAuth(data.email, data.password, data.fullName, data.referralCode);
      navigate('/home');
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-slate-900 dark:text-slate-50 overflow-hidden font-sans relative selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-400/10 dark:bg-rose-500/20 blur-[180px] animate-pulse [animation-delay:3s]" />
        <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Side: Content & Social Proof */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block space-y-12"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-300 text-[10px] font-black uppercase tracking-[0.25em]">
                <Sparkles size={14} className="animate-pulse" />
                Next-Gen Finance Protocol
              </div>
              <h1 className="text-7xl font-black text-slate-900 dark:text-white leading-[1.05] tracking-tighter">
                Nâng tầm <br />
                <GradientText from="from-indigo-600 via-purple-600" to="to-rose-500">Tư duy tài chính</GradientText>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-lg font-medium leading-relaxed">
                Tạo định danh để truy cập vào hệ thống phân tích nợ tự động và chiến lược tích lũy tài sản thông minh.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                { icon: ShieldCheck, title: 'Bảo mật', text: 'Mã hóa E2EE', color: 'indigo' },
                { icon: Zap, title: 'Tốc độ', text: 'Real-time Sync', color: 'rose' }
              ].map((item, i) => (
                <div key={i} className="group relative p-6 rounded-[2.5rem] bg-white/40 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl transition-all hover:scale-105">
                  <div className={`w-14 h-14 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center mb-4 shadow-inner`}>
                    <item.icon size={28} className={`text-${item.color}-500`} />
                  </div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px] mb-1">{item.title}</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4 p-4 rounded-3xl bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 w-fit">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800" />
                ))}
              </div>
              <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                +2,400 người đã tham gia tuần này
              </p>
            </div>
          </motion.div>

          {/* Right Side: Enhanced Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg mx-auto relative"
          >
            {/* Multi-layered Card Background */}
            <div className="absolute -inset-2 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-rose-500/30 rounded-[3rem] blur-2xl opacity-40 animate-pulse" />
            
            <div className="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[3rem] border border-white dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-8 md:p-12">
              
              <div className="absolute top-10 right-10">
                <ToggleMode dark={dark} setDark={setDark} />
              </div>

              {/* Header with improved hierarchy */}
              <div className="mb-10 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-10 w-auto" />
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">FinSight</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Bắt đầu ngay</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Khởi tạo tương lai tài chính của bạn</p>
              </div>

              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-sm text-rose-500 font-bold shadow-lg shadow-rose-500/5"
                >
                  <AlertTriangle size={18} />
                  <span>{serverError}</span>
                </motion.div>
              )}

              {/* Referral Success Badge */}
              <AnimatePresence>
                {refCode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 relative overflow-hidden group shadow-lg shadow-emerald-500/5"
                  >
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
                      <PartyPopper size={48} className="text-emerald-500" />
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
                      <Coins size={24} className="animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Bonus Unlocked</span>
                        <CheckCircle2 size={12} className="text-emerald-500" />
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">Nhận ngay +5 lượt Strategy AI</p>
                      <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-bold uppercase tracking-wider">Mã: {refCode}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <SocialLoginButtons setError={setServerError} />

              <div className="flex items-center gap-4 my-8 opacity-40">
                <div className="flex-1 border-t border-slate-300 dark:border-slate-700"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Email Registration</span>
                <div className="flex-1 border-t border-slate-300 dark:border-slate-700"></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Họ và Tên</label>
                    <div className="relative group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors"><User size={18} /></div>
                      <input
                        {...register('fullName')}
                        type="text"
                        className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-[1.25rem] px-14 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.fullName ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'}`}
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Email Address</label>
                    <div className="relative group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors"><Mail size={18} /></div>
                      <input
                        {...register('email')}
                        type="email"
                        className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-[1.25rem] px-14 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.email ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'}`}
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Password</label>
                    <div className="relative group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors"><Lock size={18} /></div>
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-[1.25rem] px-14 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.password ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'}`}
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] ml-1">Confirm</label>
                    <div className="relative group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors"><Lock size={18} /></div>
                      <input
                        {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-[1.25rem] px-14 py-4 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.confirmPassword ? 'border-rose-500' : 'border-slate-200 dark:border-white/10 focus:border-indigo-500'}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                </div>

                {/* Password strength or validation hints can go here */}
                {Object.keys(errors).length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                    {Object.values(errors).map((error: any, i) => (
                      <p key={i} className="text-[11px] font-bold text-rose-500 mb-0.5 last:mb-0 flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-rose-500" /> {error.message}
                      </p>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-3 px-8 py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-[0_20px_40px_-12px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_50px_-12px_rgba(79,70,229,0.6)] transition-all active:scale-[0.98] disabled:opacity-70 mt-6 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-100 group-hover:scale-110 transition-transform duration-500" />
                  {loading ? (
                    <div className="relative w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="relative flex items-center gap-2 uppercase tracking-widest text-xs">
                      Tạo tài khoản <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-10 pt-10 border-t border-slate-100 dark:border-white/5 text-center">
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-4 text-sm">
                  Đã có định danh tài chính?
                </p>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 text-indigo-500 font-black uppercase tracking-widest text-[11px] hover:text-indigo-400 transition-all"
                >
                  Quay lại đăng nhập 
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
