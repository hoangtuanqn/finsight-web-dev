import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout, OTPInput, QRCodeLogin, SetSocialPasswordModal, SocialLoginButtons } from '@repo/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  QrCode,
  ScanFace,
  ShieldCheck,
  User,
  UserPlus,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { authAPI, faceAPI, qrAPI } from '../api';
import { FaceCamera } from '../components/face/FaceCamera';
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
  const [loginMode, setLoginMode] = useState<'email' | 'qr' | 'face'>('email');

  // Face login state
  const [faceAccounts, setFaceAccounts] = useState<
    { userId: string; username: string; avatar: string | null; distance: string }[]
  >([]);
  const [faceDescriptor, setFaceDescriptor] = useState<number[]>([]);
  const [faceLoading, setFaceLoading] = useState(false);
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

  const handleFaceDescriptor = async (descriptor: number[]) => {
    setFaceDescriptor(descriptor);
    setFaceLoading(true);
    setServerError('');
    try {
      const res = await faceAPI.login(descriptor);
      const data = res.data.data;

      if (data.type === 'multiple') {
        setFaceAccounts(data.accounts);
      } else if (data.type === 'not_found') {
        setServerError('Không nhận diện được khuôn mặt. Hãy thử lại hoặc dùng email.');
      } else if (data.require2FA) {
        setIs2FARequired(true);
        setTempToken(data.tempToken);
      } else if (data.token && data.user) {
        localStorage.setItem('finsight_token', data.token);
        setUser(data.user);
        toast.success('Đăng nhập bằng khuôn mặt thành công!');
        navigate(redirect);
      } else {
        setServerError('Lỗi phản hồi từ server');
      }
    } catch (err: any) {
      setServerError(err.response?.data?.error || 'Đăng nhập bằng khuôn mặt thất bại.');
    } finally {
      setFaceLoading(false);
    }
  };

  const handleSelectAccount = async (userId: string) => {
    setFaceLoading(true);
    try {
      const res = await faceAPI.selectAccount(userId, faceDescriptor);
      const data = res.data.data;

      if (data.require2FA) {
        setIs2FARequired(true);
        setTempToken(data.tempToken);
      } else if (data.token && data.user) {
        localStorage.setItem('finsight_token', data.token);
        setUser(data.user);
        toast.success('Đăng nhập thành công!');
        navigate(redirect);
      } else {
        setServerError('Lỗi xác thực khuôn mặt');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Xác thực thất bại. Hãy thử lại.');
    } finally {
      setFaceLoading(false);
    }
  };

  const promoContent = (
    <>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl"
      >
        <Users size={36} className="text-white" />
      </motion.div>

      <h3 className="text-3xl font-black text-white mb-4 drop-shadow-md">Chào mừng quay lại!</h3>
      <p className="text-indigo-50 text-[15px] mb-10 leading-relaxed px-4 font-medium opacity-90 drop-shadow-sm">
        Đăng nhập để tiếp tục khám phá
        <br />
        các tính năng tài chính thông minh
      </p>

      <Link
        to="/register"
        state={{ fromAuth: true }}
        className="group px-10 py-3.5 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-[#7c5ff4] transition-all flex items-center gap-3 shadow-lg hover:shadow-white/20 active:scale-95"
      >
        <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> Đăng ký ngay
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

      <h2 className="text-[28px] font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 mb-2">
        Đăng nhập
      </h2>
      <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-8 font-medium">Chào mừng bạn quay trở lại!</p>

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
            <OTPInput onComplete={handle2FAVerify} themeColor="indigo" />
            <button
              type="button"
              onClick={() => setIs2FARequired(false)}
              className="mt-6 text-sm text-slate-500 hover:text-indigo-500 w-full text-center font-bold"
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
                />
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
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300"
                />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${errors.password ? 'border-rose-500' : 'border-transparent'} focus:border-indigo-500/50 rounded-xl pl-11 pr-12 py-3.5 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#f8fafc] dark:[&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_#1e293b] dark:[&:-webkit-autofill]:-webkit-text-fill-color-white`}
                  placeholder="Nhập mật khẩu"
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
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_25px_-6px_rgba(99,102,241,0.6)] mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} /> Đăng nhập
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
              <QRCodeLogin onLoginSuccess={onAuthSuccess} qrApi={qrAPI} themeColor="indigo" />
            </div>
            <button
              onClick={() => setLoginMode('email')}
              className="text-[13px] font-bold text-slate-500 hover:text-indigo-500"
            >
              Quay lại đăng nhập bằng Email
            </button>
          </motion.div>
        ) : (
          /* ── FACE LOGIN MODE ── */
          <motion.div
            key="face"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex flex-col items-center gap-4"
          >
            {faceAccounts.length > 0 ? (
              /* Account picker — multiple matches */
              <div className="w-full space-y-3">
                <p className="text-xs text-slate-400 font-medium text-center mb-4">
                  Tìm thấy <span className="text-white font-bold">{faceAccounts.length}</span> tài khoản phù hợp. Hãy
                  chọn tài khoản của bạn:
                </p>
                {faceAccounts.map((acc) => (
                  <motion.button
                    key={acc.userId}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectAccount(acc.userId)}
                    disabled={faceLoading}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all group"
                  >
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md">
                      {acc.avatar ? (
                        <img src={acc.avatar} alt={acc.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-black text-lg">{acc.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-slate-800 dark:text-white">{acc.username}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Độ khớp: {(1 - parseFloat(acc.distance)).toFixed(0)}%
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </motion.button>
                ))}
                <button
                  onClick={() => {
                    setFaceAccounts([]);
                    setFaceDescriptor([]);
                  }}
                  className="w-full mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  Thử lại nhận diện khuôn mặt
                </button>
              </div>
            ) : (
              <FaceCamera mode="login" onDescriptor={handleFaceDescriptor} onCancel={() => setLoginMode('email')} />
            )}

            {faceAccounts.length === 0 && (
              <button
                onClick={() => setLoginMode('email')}
                className="text-[13px] font-bold text-slate-500 hover:text-indigo-500 transition-colors"
              >
                Quay lại đăng nhập bằng Email
              </button>
            )}
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
        Chưa có tài khoản?{' '}
        <Link to="/register" state={{ fromAuth: true }} className="font-bold text-slate-700 dark:text-white">
          Đăng ký ngay
        </Link>
      </p>

      {/* Mode Switcher */}
      {loginMode === 'email' && !is2FARequired && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={() => setLoginMode('face')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <ScanFace size={16} /> Đăng nhập bằng khuôn mặt
          </button>
          <button
            onClick={() => setLoginMode('qr')}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <QrCode size={16} /> Đăng nhập bằng QR Code
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
