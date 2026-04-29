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
  CheckCircle2, PartyPopper, Coins, Globe, Cpu
} from 'lucide-react';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
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

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
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
    <div className="min-h-screen bg-[#020617] text-slate-50 overflow-hidden font-sans relative selection:bg-indigo-500/30">
      
      {/* Immersive Moving Mesh Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-indigo-600/20 blur-[160px] animate-[pulse_10s_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] rounded-full bg-rose-600/10 blur-[160px] animate-[pulse_15s_infinite_2s]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-[pulse_12s_infinite_4s]" />
        
        {/* Animated Particles Grid */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* Floating Decorative Elements */}
      <div className="fixed inset-0 z-10 pointer-events-none">
         <motion.div animate={{ y: [0, -20, 0], x: [0, 10, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute top-20 left-[15%] opacity-20"><Globe size={120} /></motion.div>
         <motion.div animate={{ y: [0, 20, 0], x: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity }} className="absolute bottom-40 right-[10%] opacity-10"><Cpu size={160} /></motion.div>
      </div>

      <div className="relative z-20 min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
        
        {/* Navigation / Header */}
        <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center w-full max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all">
              <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="Logo" className="h-6 w-auto" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.4em] opacity-80">FinSight</span>
          </Link>
          <ToggleMode dark={dark} setDark={setDark} />
        </div>

        {/* Main Centered Content */}
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text: Floating Labels (Hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-4 flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.3 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" size={20} /> Bảo mật tối đa
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Giao thức mã hóa lượng tử bảo vệ tài sản và định danh số của bạn 24/7.</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.5 }}
              className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                <Zap className="text-rose-500" size={20} /> Phân tích Real-time
              </h3>
              <p className="text-sm text-slate-400 font-medium leading-relaxed">Mọi biến động nợ và tài sản được AI bóc tách trong mili giây.</p>
            </motion.div>
          </div>

          {/* Center Card: The Portal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 w-full max-w-md mx-auto relative group"
          >
            {/* Card Aura */}
            <div className="absolute -inset-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
            
            <div className="relative bg-slate-900/40 backdrop-blur-[40px] rounded-[3rem] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] p-8 md:p-12 overflow-hidden">
              
              {/* Subtle light reflection on top */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  <Sparkles size={12} /> Đăng ký thành viên
                </div>
                <h2 className="text-3xl font-black mb-2 tracking-tighter">Đăng ký tài khoản</h2>
                <p className="text-slate-400 text-sm font-medium">Bắt đầu quản lý tài chính thông minh</p>
              </div>

              {serverError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-xs text-rose-500 font-bold">
                  <AlertTriangle size={16} /> {serverError}
                </div>
              )}

              {/* Enhanced Referral Badge */}
              <AnimatePresence>
                {refCode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mb-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 relative overflow-hidden group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                      <Coins size={20} className="animate-bounce" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Phần thưởng giới thiệu</span>
                      <p className="text-sm font-black text-white">+5 lượt Strategy AI đã sẵn sàng</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <SocialLoginButtons setError={setServerError} />

              <div className="flex items-center gap-4 my-8 opacity-20">
                <div className="flex-1 border-t border-white"></div>
                <span className="text-[10px] font-black uppercase tracking-widest">Hoặc</span>
                <div className="flex-1 border-t border-white"></div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Họ và Tên</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      {...register('fullName')}
                      type="text"
                      className={`w-full bg-white/5 border rounded-2xl px-12 py-3.5 text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.fullName ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      {...register('email')}
                      type="email"
                      className={`w-full bg-white/5 border rounded-2xl px-12 py-3.5 text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.email ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`}
                      placeholder="you@domain.com"
                    />
                  </div>
                </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full bg-white/5 border rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.password ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`}
                        placeholder="••••"
                      />
                    </div>
                  </div>
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Xác nhận mật khẩu</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input
                       {...register('confirmPassword')}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full bg-white/5 border rounded-2xl pl-12 pr-4 py-3.5 text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.password ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`}
                        placeholder="••••"
                      />
                    </div>
                  </div>


                {Object.keys(errors).length > 0 && (
                  <p className="text-[10px] font-bold text-rose-500 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                    * Vui lòng kiểm tra lại thông tin nhập liệu
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-[0_20px_40px_-12px_rgba(79,70,229,0.4)] hover:shadow-[0_20px_60px_-12px_rgba(79,70,229,0.6)] transition-all active:scale-[0.98] disabled:opacity-70 mt-6 cursor-pointer overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-rose-600 opacity-100 group-hover:scale-110 transition-transform duration-500" />
                  {loading ? (
                    <div className="relative w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="relative flex items-center gap-2 uppercase tracking-widest text-[11px]">
                      Đăng ký ngay <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <Link to="/login" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors inline-flex items-center gap-2">
                  Quay lại đăng nhập <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right Text / Extra Info (Hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-12 justify-center gap-20 mt-8 opacity-40">
             <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black">2.4k+</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Người dùng</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black">99.9%</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Trạng thái</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black">256-bit</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Bảo mật</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
