import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout, SetSocialPasswordModal, SocialLoginButtons } from '@repo/ui';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, User, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { authAPI, referralAPI } from '../api/index';
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
    password: z.string().min(1, 'Mật khẩu không được để trống').min(6, 'Mật khẩu phải có nhất 6 ký tự'),
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
  const [requirePasswordAuth, setRequirePasswordAuth] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [socialEmail, setSocialEmail] = useState('');
  const {
    setUser,
    register: registerAuth,
    googleClientId,
    facebookAppId,
    loginWithGoogle,
    loginWithFacebook,
  } = useAuth() as any;
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

  const onAuthSuccess = (result: any) => {
    if (result && result.requirePassword) {
      setTempToken(result.tempToken);
      setSocialEmail(result.email);
      setRequirePasswordAuth(true);
    } else if (result && result.require2FA) {
      navigate('/login', { state: { fromAuth: true } });
    } else {
      navigate('/home');
    }
  };

  const promoContent = (
    <>
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
      <p className="text-indigo-50 text-[15px] mb-10 leading-relaxed px-4 font-medium opacity-90 drop-shadow-sm">
        Đăng nhập để tiếp tục sử dụng
        <br />
        hệ thống quản lý chuyên nghiệp
      </p>

      <Link
        to="/login"
        state={{ fromAuth: true }}
        className="group px-10 py-3.5 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-3 shadow-lg hover:shadow-white/20 active:scale-95"
      >
        <LogIn size={18} className="group-hover:-translate-x-1 transition-transform" /> Đăng nhập
      </Link>
    </>
  );

  return (
    <AuthLayout promoContent={promoContent} isFromAuth={isFromAuth}>
      {/* Decorative Outer Icon */}
      <div className="absolute top-16 left-16 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <UserPlus size={120} className="text-slate-800 dark:text-slate-200" />
      </div>

      {requirePasswordAuth && (
        <SetSocialPasswordModal
          tempToken={tempToken}
          email={socialEmail}
          themeColor="indigo"
          onComplete={(user) => {
            setUser(user);
            setRequirePasswordAuth(false);
            navigate('/home');
          }}
          onCancel={() => setRequirePasswordAuth(false)}
          setSocialPasswordApi={authAPI.setSocialPassword}
        />
      )}

      {/* Floating Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ToggleMode dark={dark} setDark={setDark} />
      </div>

      {/* Brand Logo */}
      <Link to="/" className="mb-10 transition-transform hover:scale-105 active:scale-95">
        <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-14 w-auto drop-shadow-sm" />
      </Link>

      <h2 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400 mb-2">
        Tạo tài khoản
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-8 font-medium">Đăng ký để bắt đầu sử dụng</p>

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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
            />
            <input
              {...register('fullName')}
              className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.fullName ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
            />
            <input
              {...register('email')}
              className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.email ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
              placeholder="email@example.com"
            />
          </div>
          {errors.email && <p className="text-[10px] text-rose-500 font-bold">{errors.email.message as string}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mật khẩu</label>
            <div className="relative group/input">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
              />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.password ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-10 pr-8 py-3 text-[13px] font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
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
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
              />
              <input
                {...register('confirmPassword')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.confirmPassword ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-10 pr-8 py-3 text-[13px] font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
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
          <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mã giới thiệu (Tùy chọn)</label>
          <div className="relative group/input">
            <Sparkles
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
            />
            <input
              {...register('referralCode')}
              className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-indigo-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
              placeholder="Nhập mã (nếu có)"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="tos"
            className={`w-3.5 h-3.5 rounded border-slate-300 text-indigo-500 focus:ring-indigo-500`}
            required
          />
          <label htmlFor="tos" className="text-[11px] text-slate-500 cursor-pointer">
            Tôi đồng ý với{' '}
            <Link to="#" className="text-indigo-500 hover:underline font-bold">
              Điều khoản & Chính sách
            </Link>
          </label>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(99,102,241,0.6)] mt-2"
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

      <SocialLoginButtons
        setError={setServerError}
        onSuccess={onAuthSuccess}
        googleClientId={googleClientId}
        facebookAppId={facebookAppId}
        loginWithGoogle={loginWithGoogle}
        loginWithFacebook={loginWithFacebook}
        dark={dark}
      />

      <p className="mt-8 text-[13px] text-slate-500 font-medium lg:hidden">
        Đã có tài khoản?{' '}
        <Link
          to="/login"
          state={{ fromAuth: true }}
          className="font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
