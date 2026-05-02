import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import {
  AlertTriangle, Mail, Lock, Eye, EyeOff,
  ArrowRight, Sparkles, ShieldCheck, Zap,
  ChevronRight, QrCode, Monitor, Globe, Cpu,
  User,
  LogIn,
  UserPlus,
  Users
} from 'lucide-react';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useDarkMode } from '../hooks/useDarkMode';
import QRCodeLogin from '../components/auth/QRCodeLogin';
import OTPInput from '../components/auth/OTPInput';

const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống')
});

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const { login, setUser, verify2FALogin } = useAuth()!;
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];
  const [loginMode, setLoginMode] = useState<'email' | 'qr'>('email');
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/home';

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError('');
    setLoading(true);
    try {
      const result = await login(data.email, data.password);
      if (result && result.require2FA) {
        setIs2FARequired(true);
        setTempToken(result.tempToken);
        toast.info('Vui lòng nhập mã 2FA để tiếp tục');
      } else {
        navigate(redirect);
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (otpCode: string) => {
    setLoading(true);
    setServerError('');
    try {
      await verify2FALogin(tempToken, otpCode);
      toast.success('Xác thực 2FA thành công!');
      navigate(redirect);
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Mã 2FA không chính xác hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  const onQRSuccess = (data: any) => {
    localStorage.setItem('finsight_token', data.accessToken);
    setUser(data.user);
    toast.success('Đăng nhập thành công qua QR Code!');
    setTimeout(() => navigate(redirect), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0f172a] flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">

      {/* Decorative Outer Icon */}
      <div className="absolute bottom-16 left-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
         <Users size={120} className="text-slate-800 dark:text-slate-200" />
      </div>

      {/* Floating Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ToggleMode dark={dark} setDark={setDark} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[1000px] w-full flex bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative"
      >
        {/* LEFT COLUMN - AUTH FORM (Slides from Right) */}
        <motion.div 
          initial={{ x: 500, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex-1 p-8 sm:p-12 lg:p-14 relative z-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden"
        >
          
          {/* Aesthetic Soft Blobs */}
          <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-indigo-100/50 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-violet-100/50 dark:bg-violet-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-[340px] relative z-10 flex flex-col items-center">

            {/* Top Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mb-5 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)]">
              <User size={30} className="text-white" />
            </div>

            <h2 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mb-2">Đăng nhập</h2>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-8 font-medium">Chào mừng bạn quay trở lại!</p>

            {serverError && (
              <div className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-xs font-bold p-3 rounded-xl mb-6 flex items-center gap-2">
                <AlertTriangle size={16} /> {serverError}
              </div>
            )}

            <AnimatePresence mode="wait">
              {is2FARequired ? (
                <motion.div key="2fa" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full">
                  <OTPInput onComplete={handle2FAVerify} />
                  <button type="button" onClick={() => setIs2FARequired(false)} className="mt-6 text-sm text-slate-500 hover:text-indigo-500 w-full text-center font-bold">
                    Quay lại
                  </button>
                </motion.div>
              ) : loginMode === 'email' ? (
                <motion.form key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Username hoặc Email</label>
                    <div className="relative group/input">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300" />
                      <input
                        {...register('email')}
                        className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.email ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                        placeholder="Nhập tên tài khoản"
                      />
                    </div>
                    {errors.email && <p className="text-[10px] text-rose-500 font-bold">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mật khẩu</label>
                    <div className="relative group/input">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300" />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.password ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                        placeholder="Nhập mật khẩu"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-[10px] text-rose-500 font-bold">{errors.password.message}</p>}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(99,102,241,0.6)] mt-4"
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><LogIn size={18} /> Đăng nhập</>}
                  </motion.button>

                  <div className="flex items-center gap-4 my-6 opacity-80">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    <span className="text-[11px] font-medium text-slate-400">hoặc</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>

                  {/* Social Login Integrates implicitly, ensure its style roughly matches */}
                  <div className="[&>button]:w-full [&>button]:bg-white [&>button]:dark:bg-slate-800/80 [&>button]:border [&>button]:border-slate-200 [&>button]:dark:border-slate-700 [&>button]:rounded-xl [&>button]:py-3.5 [&>button]:shadow-sm [&>button:hover]:shadow-md [&>button]:transition-all">
                    <SocialLoginButtons
                      setError={setServerError}
                      onSuccess={(result) => {
                        if (result && result.require2FA) {
                          setIs2FARequired(true);
                          setTempToken(result.tempToken);
                        } else {
                          navigate(redirect);
                        }
                      }}
                    />
                  </div>

                </motion.form>
              ) : (
                <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full flex flex-col items-center">
                  <div className="p-4 bg-[#f8fafc] dark:bg-slate-800 rounded-3xl mb-6">
                    <QRCodeLogin onLoginSuccess={onQRSuccess} />
                  </div>
                  <button onClick={() => setLoginMode('email')} className="text-[13px] font-bold text-slate-500 hover:text-indigo-500">
                    Quay lại đăng nhập bằng Email
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
                <ShieldCheck size={14} /> SSL Secured
              </div>
              <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold">
                <Lock size={14} /> Encrypted
              </div>
            </div>

            {/* Mobile Register Link */}
            <p className="mt-8 text-[13px] text-slate-500 font-medium lg:hidden">
              Chưa có tài khoản? <Link to="/register" className="font-bold text-slate-700 dark:text-white">Đăng ký ngay</Link>
            </p>

            {/* Mode Switcher */}
            {loginMode === 'email' && !is2FARequired && (
              <button
                onClick={() => setLoginMode('qr')}
                className="mt-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
              >
                <QrCode size={16} /> Đăng nhập bằng QR Code
              </button>
            )}

          </div>
        </motion.div>

        {/* RIGHT COLUMN - PROMO (Slides from Left) */}
        <motion.div 
          initial={{ x: -500, zIndex: 30 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="hidden lg:flex w-[48%] bg-gradient-to-br from-[#6b4de0] to-[#7c5ff4] relative flex-col items-center justify-center p-14 text-center z-30"
        >

          {/* Subtle Plus Pattern Background */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 14V6h2v8h8v2h-8v8h-2v-8H6v-2h8z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px'
            }}
          />

          {/* S-Curve SVG Overlaying Left */}
          <svg
            className="absolute top-0 left-0 w-[60px] h-full text-white dark:text-slate-900 fill-current z-10 pointer-events-none drop-shadow-[-10px_0_15px_rgba(0,0,0,0.05)]"
            viewBox="0 0 60 1000"
            preserveAspectRatio="none"
          >
            {/* Gentle curve that bows inward at the middle and outward at the bottom */}
            <path d="M 0 0 C 0 300 80 700 0 1000 L -10 1000 L -10 0 Z" />
          </svg>

          <div className="relative z-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl">
              <UserPlus size={36} className="text-white" />
            </div>

            <h3 className="text-3xl font-black text-white mb-4">Chưa có tài khoản?</h3>
            <p className="text-indigo-50 text-[15px] mb-10 leading-relaxed px-4 font-medium opacity-90">
              Đăng ký ngay để trải nghiệm<br/>hệ thống quản lý chuyên nghiệp
            </p>

            <Link to="/register" className="group px-10 py-3.5 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-[#7c5ff4] transition-all flex items-center gap-2 shadow-lg">
              <UserPlus size={18} className="group-hover:scale-110 transition-transform" /> Đăng ký ngay
            </Link>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}

