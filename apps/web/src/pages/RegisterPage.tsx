import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, User, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, Zap, ChevronRight } from 'lucide-react';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { GradientText, Spotlight } from './LandingPage/components/Shared';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useDarkMode } from '../hooks/useDarkMode';

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
    .min(1, 'Xác nhận mật khẩu là bắt buộc')
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

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', referralCode: refCode }
  });

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
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDAsMCwwLDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDAuNWg0ME0wLjUgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')]" />
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-500/20 blur-[150px] animate-pulse [animation-delay:2s]" />
        <Spotlight className="-top-40 right-0 md:right-60 md:-top-20" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-16 items-center">
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
                   <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-8 w-auto object-contain" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tighter">Đăng ký</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Khởi tạo Node tài chính của bạn</p>
              </div>

              {serverError && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 mb-8 text-sm text-red-500 dark:text-red-400 flex items-start gap-3"
                >
                  <AlertTriangle size={18} className="shrink-0" />
                  <span className="font-bold">{serverError}</span>
                </motion.div>
              )}

              <SocialLoginButtons setError={setServerError} />

              <div className="flex items-center gap-4 mb-6 opacity-60">
                 <div className="flex-1 border-t border-slate-300 dark:border-slate-700"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hoặc bằng Email</span>
                 <div className="flex-1 border-t border-slate-300 dark:border-slate-700"></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><User size={18} /></div>
                    <input
                      {...register('fullName')}
                      type="text"
                      className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm ${errors.fullName ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'}`}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                  {errors.fullName && <p className="text-[11px] font-bold text-red-500 ml-1">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Email</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><Mail size={18} /></div>
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'}`}
                      placeholder="Email của bạn"
                    />
                  </div>
                  {errors.email && <p className="text-[11px] font-bold text-red-500 ml-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><Lock size={18} /></div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm ${errors.password ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'}`}
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-[11px] font-bold text-red-500 ml-1">{errors.password.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-500 transition-colors"><Lock size={18} /></div>
                    <input
                      {...register('confirmPassword')}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full bg-slate-100/50 dark:bg-white/5 border rounded-2xl px-12 py-3.5 text-slate-900 dark:text-white font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-blue-500'}`}
                      placeholder="Xác nhận mật khẩu"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-[11px] font-bold text-red-500 ml-1">{errors.confirmPassword.message}</p>}
                </div>

                {refCode && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-[0.2em] ml-1">Mã giới thiệu (Đã áp dụng)</label>
                    <div className="relative group/input">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400"><ShieldCheck size={18} /></div>
                      <input
                        {...register('referralCode')}
                        type="text"
                        disabled
                        className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-12 py-3.5 text-emerald-600 dark:text-emerald-400 font-bold outline-none cursor-not-allowed text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] transition-all disabled:opacity-70 mt-4 cursor-pointer"
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
