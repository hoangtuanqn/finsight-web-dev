import { zodResolver } from '@hookform/resolvers/zod';
import { AuthLayout, StepIndicator } from '@repo/ui';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Briefcase,
  Building,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Lock,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ToggleMode } from '../components/layout/components/ToggleMode';
import { useDarkMode } from '../hooks/useDarkMode';

const step1Schema = z
  .object({
    email: z.string().min(1, 'Email không được để trống').email('Email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu không được để trống').min(8, 'Mật khẩu phải từ 8 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

const step2Schema = z.object({
  taxCode: z.string().regex(/^\d{10}(\d{3})?$/, 'Mã số doanh nghiệp phải là 10 hoặc 13 số'),
  name: z.string().min(1, 'Tên tổ chức không được để trống').min(2, 'Tên tổ chức quá ngắn'),
  shortName: z.string().optional(),
  businessType: z.string().min(1, 'Vui lòng chọn loại hình doanh nghiệp'),
  headquartersAddress: z.string().min(1, 'Địa chỉ không được để trống').min(5, 'Địa chỉ quá ngắn'),
});

const step3Schema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').min(2, 'Họ tên quá ngắn'),
  roleTitle: z.string().min(1, 'Chức vụ không được để trống').min(2, 'Chức vụ quá ngắn'),
  phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [dark, setDark] = useDarkMode() as [boolean, (val: boolean) => void];

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { taxCode: '', name: '', shortName: '', businessType: '', headquartersAddress: '' },
  });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { fullName: '', roleTitle: '', phoneNumber: '' },
  });

  const onStep1Submit = (data: Step1Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  };

  const onStep2Submit = (data: Step2Data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(3);
  };

  const onStep3Submit = async (data: Step3Data) => {
    const finalData = { ...formData, ...data };
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/v1/enterprise/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Đăng ký thất bại');
      }

      localStorage.setItem('finsight_token', result.data.token);
      setTimeout(() => navigate('/home'), 1000);
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  const promoContent = (
    <>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-xl relative"
      >
        <Building2 size={36} className="text-white" />
        <div className="absolute bottom-[-4px] right-[-4px] bg-emerald-500 rounded-full border-2 border-emerald-400 p-0.5">
          <CheckCircle2 size={16} className="text-white" />
        </div>
      </motion.div>

      <h3 className="text-3xl font-black text-white mb-4 drop-shadow-md">FinSight Enterprise</h3>
      <p className="text-emerald-50 text-[15px] mb-10 leading-relaxed px-4 font-medium opacity-90 drop-shadow-sm">
        Giải pháp quản lý tài chính
        <br />
        chuyên biệt cho doanh nghiệp
      </p>

      <Link
        to="/login"
        className="group px-10 py-3.5 rounded-2xl border border-white/40 bg-white/5 backdrop-blur-sm text-white font-bold hover:bg-white hover:text-emerald-600 transition-all flex items-center gap-3 shadow-lg hover:shadow-white/20 active:scale-95"
      >
        Đã có tài khoản? Đăng nhập
      </Link>
    </>
  );

  return (
    <AuthLayout promoContent={promoContent}>
      {/* Floating Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ToggleMode dark={dark} setDark={setDark} />
      </div>

      <div className="w-full flex flex-col items-center">
        {/* Brand Logo */}
        <Link to="/" className="mb-8 transition-transform hover:scale-105 active:scale-95">
          <img src="https://i.ibb.co/84xLmWTK/LOGO.png" alt="FinSight Logo" className="h-12 w-auto drop-shadow-sm" />
        </Link>

        <h2 className="text-[24px] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400 mb-2 text-center">
          Đăng Ký Doanh Nghiệp
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-[13px] mb-6 font-medium text-center">
          Khởi tạo không gian làm việc cho tổ chức
        </p>

        {error && (
          <div className="w-full mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/50 text-rose-500 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Stepper */}
        <StepIndicator currentStep={step} totalSteps={3} />

        <div className="w-full relative min-h-[340px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={form1.handleSubmit(onStep1Submit)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Email công ty *</label>
                  <div className="relative group/input">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form1.register('email')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form1.formState.errors.email ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="admin@company.com"
                    />
                  </div>
                  {form1.formState.errors.email && (
                    <p className="text-[10px] text-rose-500 font-bold">{form1.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Mật khẩu *</label>
                  <div className="relative group/input">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form1.register('password')}
                      type="password"
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form1.formState.errors.password ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="••••••••"
                    />
                  </div>
                  {form1.formState.errors.password && (
                    <p className="text-[10px] text-rose-500 font-bold">{form1.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    Xác nhận mật khẩu *
                  </label>
                  <div className="relative group/input">
                    <CheckCircle2
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form1.register('confirmPassword')}
                      type="password"
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form1.formState.errors.confirmPassword ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="••••••••"
                    />
                  </div>
                  {form1.formState.errors.confirmPassword && (
                    <p className="text-[10px] text-rose-500 font-bold">
                      {form1.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20 mt-4"
                >
                  Tiếp tục <ChevronRight size={18} />
                </motion.button>
              </motion.form>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={form2.handleSubmit(onStep2Submit)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    Mã số doanh nghiệp (MSDN) *
                  </label>
                  <div className="relative group/input">
                    <Hash
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form2.register('taxCode')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form2.formState.errors.taxCode ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="0123456789"
                    />
                  </div>
                  {form2.formState.errors.taxCode && (
                    <p className="text-[10px] text-rose-500 font-bold">{form2.formState.errors.taxCode.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Tên tổ chức *</label>
                  <div className="relative group/input">
                    <Building
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form2.register('name')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form2.formState.errors.name ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="Công ty Cổ phần FinSight"
                    />
                  </div>
                  {form2.formState.errors.name && (
                    <p className="text-[10px] text-rose-500 font-bold">{form2.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Loại hình *</label>
                    <select
                      {...form2.register('businessType')}
                      className="w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-emerald-500/50 rounded-xl px-3 py-3 text-[13px] font-medium outline-none transition-all dark:text-white"
                    >
                      <option value="">Chọn</option>
                      <option value="JSC">Cổ phần</option>
                      <option value="LLC">TNHH</option>
                      <option value="PRIVATE">Tư nhân</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Tên viết tắt</label>
                    <input
                      {...form2.register('shortName')}
                      className="w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-transparent focus:border-emerald-500/50 rounded-xl px-3 py-3 text-[13px] font-medium outline-none transition-all dark:text-white"
                      placeholder="FS Corp"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Địa chỉ trụ sở *</label>
                  <div className="relative group/input">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-3 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <textarea
                      {...form2.register('headquartersAddress')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form2.formState.errors.headquartersAddress ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white min-h-[80px] resize-none`}
                      placeholder="Số 1, Đường ABC, TP.HCM"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl py-3.5 font-bold transition-all flex items-center justify-center"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Tiếp tục <ChevronRight size={18} />
                  </motion.button>
                </div>
              </motion.form>
            )}

            {step === 3 && (
              <motion.form
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={form3.handleSubmit(onStep3Submit)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">
                    Họ tên người đại diện *
                  </label>
                  <div className="relative group/input">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form3.register('fullName')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form3.formState.errors.fullName ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="Nguyễn Văn A"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Chức vụ *</label>
                  <div className="relative group/input">
                    <Briefcase
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form3.register('roleTitle')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form3.formState.errors.roleTitle ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="Giám đốc"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-800 dark:text-slate-200">Số điện thoại *</label>
                  <div className="relative group/input">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors duration-300"
                    />
                    <input
                      {...form3.register('phoneNumber')}
                      className={`w-full bg-[#f8fafc] dark:bg-slate-800/80 border ${form3.formState.errors.phoneNumber ? 'border-rose-500' : 'border-transparent'} focus:border-emerald-500/50 rounded-xl pl-10 pr-3 py-3 text-[13px] font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all dark:text-white`}
                      placeholder="0901234567"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isSubmitting}
                    className="w-1/3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl py-3.5 font-bold transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={18} /> Tạo tài khoản <Sparkles size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-8 text-[13px] text-slate-500 font-medium lg:hidden text-center">
          Đã có tài khoản doanh nghiệp?{' '}
          <Link
            to="/login"
            className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
