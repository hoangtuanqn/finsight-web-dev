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
  ChevronRight, QrCode, Monitor, Globe, Cpu 
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
              <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-white">
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
              <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-white">
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
                  <Sparkles size={12} /> Authentication Gateway
                </div>
                <h2 className="text-3xl font-black mb-2 tracking-tighter text-white">Đăng nhập</h2>
                <p className="text-slate-400 text-sm font-medium">Tiếp tục hành trình tài chính của bạn</p>
              </div>

              {serverError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 mb-8 flex items-center gap-3 text-xs text-rose-500 font-bold">
                  <AlertTriangle size={16} /> {serverError}
                </div>
              )}

              {!is2FARequired && <>
              <SocialLoginButtons 
                setError={setServerError} 
                onSuccess={(result) => {
                  if (result && result.require2FA) {
                    setIs2FARequired(true);
                    setTempToken(result.tempToken);
                    toast.info('Vui lòng nhập mã 2FA để tiếp tục');
                  } else {
                    navigate(redirect);
                  }
                }}
                />
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 border-t border-white opacity-20"></div>
                <button 
                  onClick={() => setLoginMode(loginMode === 'email' ? 'qr' : 'email')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all cursor-pointer pointer-events-auto shadow-lg"
                >
                  {loginMode === 'email' ? <><QrCode size={14} /> Mã QR</> : <><Monitor size={14} /> Email</>}
                </button>
                <div className="flex-1 border-t border-white opacity-20"></div>
              </div></>
              }

              <AnimatePresence mode="wait">
                {is2FARequired ? (
                  <motion.div
                    key="2fa"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-4">
                      <p className="text-xs text-slate-400 font-medium">Chúng tôi đã phát hiện tài khoản của bạn được bảo mật bằng 2FA.</p>
                    </div>

                    <OTPInput 
                      onComplete={handle2FAVerify} 
          
                    />

                    <button
                      type="button"
                      onClick={() => setIs2FARequired(false)}
                      className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                      Quay lại đăng nhập
                    </button>
                  </motion.div>
                ) : loginMode === 'email' ? (
                  <motion.form 
                    key="email"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleSubmit(onSubmit)} 
                    className="space-y-4"
                  >
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                      <div className="relative group/input">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                        <input
                          {...register('email')}
                          type="email"
                          className={`w-full bg-white/5 border rounded-2xl px-12 py-3.5 text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.email ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`}
                          placeholder="Email của bạn"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mật khẩu</label>
                        <Link to="/forgot" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-widest">Quên mật khẩu?</Link>
                      </div>
                      <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors" size={18} />
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className={`w-full bg-white/5 border rounded-2xl pl-12 pr-12 py-3.5 text-white font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm ${errors.password ? 'border-rose-500' : 'border-white/10 focus:border-indigo-500'}`}
                          placeholder="••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

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
                          Xác nhận đăng nhập <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="qr"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="py-4 flex justify-center"
                  >
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md">
                      <QRCodeLogin onLoginSuccess={onQRSuccess} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {!is2FARequired && <>
              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">
                  Chưa có định danh tài chính?
                </p>
                <Link to="/register" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors inline-flex items-center gap-2 group">
                  Đăng ký tài khoản mới <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Demo Sandbox Alert - Re-styled */}
              <div className="mt-8 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Demo Sandbox Access</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Email:</span>
                    <span className="text-white">demo@finsight.vn</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                    <span>Mật khẩu:</span>
                    <span className="text-white tracking-widest">Demo@123</span>
                  </div>
                </div>
              </div> 
              </>}
             
            </div>
          </motion.div>

          {/* Right Text / Extra Info (Hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-12 justify-center gap-20 mt-8 opacity-40">
             <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black text-white">2.4k+</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Người dùng</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black text-white">99.9%</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Trạng thái</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="text-2xl font-black text-white">256-bit</span>
                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Bảo mật</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
