import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout, OTPInput, QRCodeLogin, SetSocialPasswordModal, SocialLoginButtons } from '@repo/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  QrCode,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { authAPI, qrAPI } from '../api';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../hooks/useDarkMode';

const loginSchema = z.object({
  email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
  password: z.string().min(1, 'Mật khẩu không được để trống'),
});

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [requirePasswordAuth, setRequirePasswordAuth] = useState(false);
  const [socialEmail, setSocialEmail] = useState('');
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const { login, setUser, verify2FALogin, googleClientId, facebookAppId, loginWithGoogle, loginWithFacebook } =
    useAuth()!;
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];
  const [loginMode, setLoginMode] = useState<'email' | 'qr'>('email');
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/home';
  const location = useLocation();
  const isFromAuth = location.state?.fromAuth;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
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

  const onAuthSuccess = (result: any) => {
    if (result && result.requirePassword) {
      setTempToken(result.tempToken);
      setSocialEmail(result.email);
      setRequirePasswordAuth(true);
    } else if (result && result.require2FA) {
      setIs2FARequired(true);
      setTempToken(result.tempToken);
    } else {
      navigate(redirect);
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

      <h3 className="text-3xl font-black text-white mb-4 drop-shadow-md">Chào mừng quay lại!</h3>
      <p className="text-emerald-50 text-[15px] mb-10 leading-relaxed px-4 font-medium opacity-90 drop-shadow-sm">
        Đăng nhập vào không gian làm việc
        <br />
        để quản lý doanh nghiệp của bạn
      </p>

      <Link
        to="/register"
        state={{ fromAuth: true }}
        className="group px-10 py-3.5 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-emerald-600 transition-all flex items-center gap-3 shadow-lg hover:shadow-white/20 active:scale-95"
      >
        <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Chưa có tài khoản?
      </Link>
    </>
  );

  return (
    <AuthLayout promoContent={promoContent} isFromAuth={isFromAuth}>
      {/* Floating Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ToggleMode dark={dark} setDark={setDark} />
      </div>

      {requirePasswordAuth && (
        <SetSocialPasswordModal
          tempToken={tempToken}
          email={socialEmail}
          themeColor="emerald"
          onComplete={(user) => {
            setUser(user);
            setRequirePasswordAuth(false);
            navigate(redirect);
          }}
          onCancel={() => setRequirePasswordAuth(false)}
          setSocialPasswordApi={authAPI.setSocialPassword}
        />
      )}

      {/* Brand Logo */}
      <Link to="/" className="mb-10 transition-transform hover:scale-105 active:scale-95">
        <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-14 w-auto drop-shadow-sm" />
      </Link>

      <h2 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 mb-2">
        Đăng nhập
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-8 font-medium">Cổng thông tin Doanh nghiệp</p>

      {serverError && (
        <div className="w-full bg-rose-50 dark:bg-rose-900/20 text-rose-500 text-xs font-bold p-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertTriangle size={16} /> {serverError}
        </div>
      )}

      <AnimatePresence mode="wait">
        {is2FARequired ? (
          <motion.div
            key="2fa"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <OTPInput onComplete={handle2FAVerify} themeColor="emerald" />
            <button
              type="button"
              onClick={() => setIs2FARequired(false)}
              className="mt-6 text-sm text-slate-500 hover:text-emerald-500 w-full text-center font-bold"
            >
              Quay lại
            </button>
          </motion.div>
        ) : loginMode === 'email' ? (
          <motion.form
            key="email"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleSubmit(onSubmit)}
            className="w-full space-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Username hoặc Email</label>
              <div className="relative group/input">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                />
                <input
                  {...register('email')}
                  className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.email ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                  placeholder="admin@company.com"
                />
              </div>
              {errors.email && <p className="text-[10px] text-rose-500 font-bold">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mật khẩu</label>
              <div className="relative group/input">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.password ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
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
              className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-[0_8px_20px_-6px_rgba(16,185,129,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(16,185,129,0.6)] mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} /> Đăng nhập hệ thống
                </>
              )}
            </motion.button>

            <div className="flex items-center gap-4 my-6 opacity-80">
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
          </motion.form>
        ) : loginMode === 'qr' ? (
          <motion.div
            key="qr"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center"
          >
            <div className="p-4 bg-[#f8fafc] dark:bg-slate-800 rounded-3xl mb-6">
              <QRCodeLogin onLoginSuccess={onAuthSuccess} qrApi={qrAPI} themeColor="emerald" />
            </div>
            <button
              onClick={() => setLoginMode('email')}
              className="text-[13px] font-bold text-slate-500 hover:text-emerald-500"
            >
              Quay lại đăng nhập bằng Email
            </button>
          </motion.div>
        ) : null}
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
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          state={{ fromAuth: true }}
          className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>

      {/* Mode Switcher */}
      {loginMode === 'email' && !is2FARequired && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => setLoginMode('qr')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-500 transition-colors"
          >
            <QrCode size={16} /> Đăng nhập bằng QR Code
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
