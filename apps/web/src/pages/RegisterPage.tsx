import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, User, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { referralAPI } from '../api/index';
import SocialLoginButtons from '../components/auth/SocialLoginButtons';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Họ tên không được để trống')
      .min(2, 'Họ tên phải có ít nhất 2 ký tự')
      .max(50, 'Họ tên không được vượt quá 50 ký tự'),
    email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống').min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
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
  const location = useLocation();
  const isFromAuth = location.state?.fromAuth;
  const hasTracked = useRef(false);

  useEffect(() => {
    if (refCode && !hasTracked.current) {
      hasTracked.current = true;
      referralAPI.trackClick(refCode).catch((err: any) => {
        console.error('[Referral] Failed to track click:', err);
      });
    }
  }, [refCode]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', referralCode: refCode },
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
    <div className="min-h-screen bg-slate-100 dark:bg-[#0f172a] flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      {/* Decorative Outer Icon */}
      <div className="absolute top-16 left-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <UserPlus size={120} className="text-slate-800 dark:text-slate-200" />
      </div>

      {/* Floating Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ToggleMode dark={dark} setDark={setDark} />
      </div>

      <div className="max-w-[1000px] w-full flex bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative">
        {/* LEFT COLUMN - PROMO (Slides from Right only if from Auth) */}
        <motion.div
          initial={isFromAuth ? { x: 500, zIndex: 30 } : { zIndex: 30 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex w-[48%] bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 relative flex-col items-center justify-center p-14 text-center z-30 overflow-hidden"
        >
          {/* Animated Floating Blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [0, -40, 0],
                y: [0, 60, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"
            />
            <motion.div
              animate={{
                x: [0, 30, 0],
                y: [0, -50, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-[100px]"
            />
          </div>

          {/* Subtle Plus Pattern Background */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M14 14V6h2v8h8v2h-8v8h-2v-8H6v-2h8z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: '40px 40px',
            }}
          />

          {/* Animated Waves at the bottom */}
          <div className="absolute bottom-0 left-0 w-full leading-[0] z-10 pointer-events-none opacity-30">
            <svg className="relative block w-[200%] h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <motion.path
                animate={{ x: [-600, 0, -600] }}
                transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V0C49.1,1.5,95.74,14.27,141.45,28.33,186.27,42.11,232.14,55.6,280.57,58.55,294.09,59.36,307.73,58.6,321.39,56.44Z"
                fill="#FFFFFF"
              />
            </svg>
          </div>

          {/* S-Curve SVG Overlaying Right Form Panel */}
          <svg
            className="absolute top-0 -right-[59px] w-[60px] h-full text-white dark:text-slate-900 fill-current z-10 pointer-events-none drop-shadow-[10px_0_15px_rgba(0,0,0,0.05)] hidden lg:block"
            viewBox="0 0 60 1000"
            preserveAspectRatio="none"
          >
            {/* Mirror of Login S-Curve with subtle morphing animation */}
            <motion.path
              animate={{
                d: [
                  'M 60 0 C 60 300 -20 700 60 1000 L 70 1000 L 70 0 Z',
                  'M 60 0 C 60 400 10 600 60 1000 L 70 1000 L 70 0 Z',
                  'M 60 0 C 60 300 -20 700 60 1000 L 70 1000 L 70 0 Z',
                ],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>

          <div className="relative z-20 flex flex-col items-center">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl relative"
            >
              <User size={36} className="text-white" />
              <div className="absolute bottom-[-4px] right-[-4px] bg-emerald-500 rounded-full border-2 border-emerald-400 p-0.5">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            </motion.div>

            <h3 className="text-3xl font-black text-white mb-4 drop-shadow-md">Đã có tài khoản?</h3>
            <p className="text-emerald-50 text-[15px] mb-10 leading-relaxed px-4 font-medium opacity-90 drop-shadow-sm">
              Đăng nhập để tiếp tục sử dụng
              <br />
              hệ thống quản lý chuyên nghiệp
            </p>

            <Link
              to="/login"
              state={{ fromAuth: true }}
              className="group px-10 py-3.5 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-emerald-600 transition-all flex items-center gap-3 shadow-lg hover:shadow-white/20 active:scale-95"
            >
              <LogIn size={18} className="group-hover:-translate-x-1 transition-transform" /> Đăng nhập
            </Link>
          </div>
        </motion.div>

        {/* RIGHT COLUMN - AUTH FORM (Slides from Left only if from Auth) */}
        <motion.div
          initial={isFromAuth ? { x: -500, opacity: 0 } : { opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex-1 p-8 sm:p-12 lg:p-14 relative z-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 overflow-hidden"
        >
          {/* Aesthetic Soft Blobs */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-teal-100/50 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />

          <div className="w-full max-w-[360px] relative z-10 flex flex-col items-center">
            {/* Brand Logo */}
            <Link to="/" className="mb-10 transition-transform hover:scale-105 active:scale-95">
              <img
                src="https://i.ibb.co/84xLmWTK/LOGO.png"
                alt="FinSight Logo"
                className="h-14 w-auto drop-shadow-sm"
              />
            </Link>

            {/* Top Icon */}
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)]">
              <UserPlus size={30} className="text-white" />
            </div>

            <h2 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 mb-2">
              Tạo tài khoản
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-8 font-medium">
              Đăng ký để bắt đầu sử dụng
            </p>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-500 text-xs font-bold p-3 rounded-xl mb-6 flex items-center gap-2"
              >
                <AlertTriangle size={16} /> {serverError}
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Username</label>
                <div className="relative group/input">
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                  />
                  <input
                    {...register('fullName')}
                    className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.fullName ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-[10px] text-rose-500 font-bold">{errors.fullName.message as string}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Email</label>
                <div className="relative group/input">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                  />
                  <input
                    {...register('email')}
                    className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.email ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                    placeholder="email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-rose-500 font-bold">{errors.email.message as string}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mật khẩu</label>
                  <div className="relative group/input">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.password ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-8 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </div>
                  {errors.password && (
                    <p className="text-[10px] text-rose-500 font-bold">{errors.password.message as string}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Xác nhận</label>
                  <div className="relative group/input">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...register('confirmPassword')}
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.confirmPassword ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-8 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                      placeholder="Nhập lại"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[10px] text-rose-500 font-bold">{errors.confirmPassword.message as string}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                  Mã giới thiệu (Tùy chọn)
                </label>
                <div className="relative group/input">
                  <Sparkles
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                  />
                  <input
                    {...register('referralCode')}
                    className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                    placeholder="Nhập mã (nếu có)"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="tos"
                  className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  required
                />
                <label htmlFor="tos" className="text-[11px] text-slate-500 cursor-pointer">
                  Tôi đồng ý với{' '}
                  <Link to="#" className="text-emerald-500 hover:underline font-bold">
                    Điều khoản & Chính sách
                  </Link>
                </label>
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(16,185,129,0.6)] mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} /> Đăng ký tài khoản
                  </>
                )}
              </motion.button>
            </form>

            <div className="flex items-center gap-4 my-6 opacity-80 w-full">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-400">hoặc</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="w-full [&>button]:w-full [&>button]:bg-white [&>button]:dark:bg-slate-800/80 [&>button]:border [&>button]:border-slate-200 [&>button]:dark:border-slate-700 [&>button]:rounded-xl [&>button]:py-3.5 [&>button]:shadow-sm [&>button:hover]:shadow-md [&>button]:transition-all">
              <SocialLoginButtons
                setError={setServerError}
                onSuccess={() => {
                  navigate('/home');
                }}
              />
            </div>

            <p className="mt-8 text-[13px] text-slate-500 font-medium lg:hidden">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                state={{ fromAuth: true }}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
