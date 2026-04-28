import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../api/index';
import FormattedInput from '../components/common/FormattedInput';
import { formatPercent, formatVND } from '../utils/calculations';
import {
  User, Mail, DollarSign, TrendingDown, CheckCircle, Rocket,
  AlertTriangle, Target, Shield, Flame, Clock, Calendar, TrendingUp,
  Wallet, BarChart2, CreditCard, ChevronRight,
} from 'lucide-react';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').max(50),
  monthlyIncome: z.number().min(0),
  extraBudget: z.number().min(0),
  capital: z.number().min(0).optional(),
  goal: z.enum(['GROWTH', 'INCOME', 'STABILITY', 'SPECULATION']).optional(),
  horizon: z.enum(['SHORT', 'MEDIUM', 'LONG']).optional(),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  savingsRate: z.number().min(0).max(100).optional(),
  inflationRate: z.number().min(0).max(100).optional()
});

const HORIZON_OPTIONS = [
  { value: 'SHORT',  label: 'Ngắn hạn — dưới 1 năm' },
  { value: 'MEDIUM', label: 'Trung hạn — 1 đến 3 năm' },
  { value: 'LONG',   label: 'Dài hạn — trên 3 năm' },
];
const HORIZON_LABEL = { SHORT: 'Ngắn hạn', MEDIUM: 'Trung hạn', LONG: 'Dài hạn' };
const GOAL_LABEL = { GROWTH: 'Tăng trưởng tài sản', INCOME: 'Dòng tiền thụ động', STABILITY: 'Bảo toàn vốn', SPECULATION: 'Đầu cơ mạo hiểm' };
const RISK_META = {
  LOW:    { label: 'Thấp — An toàn',       color: '#10b981', gradient: 'from-emerald-500 to-teal-400',  Icon: Shield },
  MEDIUM: { label: 'Vừa phải — Cân bằng', color: '#f59e0b', gradient: 'from-amber-500 to-orange-400',  Icon: Target },
  HIGH:   { label: 'Cao — Mạo hiểm',       color: '#ef4444', gradient: 'from-red-500 to-rose-400',      Icon: Flame  },
};

const INPUT = 'w-full px-4 py-2.5 rounded-xl border bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] text-sm outline-none focus:border-blue-500/60 transition-colors';
const SELECT = INPUT + ' cursor-pointer';
const LABEL = 'block text-[11px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1.5';

function SectionHeader({ dot, label }: { dot: string, label: string }) {
  return (
    <h3 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-4" style={{ color: dot }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
      {label}
    </h3>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth() as any;
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        fullName:      user.fullName || '',
        monthlyIncome: user.monthlyIncome || 0,
        extraBudget:   user.extraBudget || 0,
        capital:       user.investorProfile?.capital || 0,
        goal:          user.investorProfile?.goal || 'GROWTH',
        horizon:       user.investorProfile?.horizon || 'MEDIUM',
        riskLevel:     user.investorProfile?.riskLevel || 'MEDIUM',
        savingsRate:   user.investorProfile?.savingsRate ?? 6.0,
        inflationRate: user.investorProfile?.inflationRate ?? 3.5,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: any) => {
    setLoading(true); setSaved(false);
    try {
      const res = await userAPI.updateProfile(data);
      setUser((prev: any) => ({ ...prev, ...res.data.data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const riskMeta    = RISK_META[(user?.investorProfile?.riskLevel || 'MEDIUM') as keyof typeof RISK_META];
  const RiskIcon    = riskMeta.Icon;
  const riskScore   = user?.investorProfile?.riskScore;
  const lastUpdated = user?.investorProfile?.lastUpdated ? new Date(user.investorProfile.lastUpdated).toLocaleDateString('vi-VN') : null;
  const hasCompletedQuiz = riskScore !== undefined && riskScore !== null;
  const initials = (user?.fullName || 'U').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();

  const inputCls = (hasError: any) => `${INPUT} ${hasError ? 'border-red-500/60 focus:border-red-500' : ''}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10 space-y-6">
      <div className="pt-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
          <User size={11} /> Hồ sơ cá nhân
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">Hồ sơ của bạn</h1>
        <p className="text-[var(--color-text-secondary)] text-sm mt-1">Hoàn thiện thông tin để AI đánh giá tài chính chính xác nhất</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className="xl:col-span-2 space-y-4">
          <div
            className="flex items-center justify-between gap-4 px-5 py-4 rounded-2xl border relative overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: hasCompletedQuiz ? `${riskMeta.color}25` : 'rgba(245,158,11,0.25)' }}
          >
            <div className="absolute top-0 left-5 right-5 h-px" style={{ background: `linear-gradient(90deg,transparent,${riskMeta.color}50,transparent)` }} />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${riskMeta.color}15` }}>
                <RiskIcon size={18} style={{ color: riskMeta.color }} />
              </div>
              <div>
                <p className="text-[13px] font-bold text-[var(--color-text-primary)]">
                  Khẩu vị rủi ro: <span style={{ color: riskMeta.color }}>{riskMeta.label}</span>
                </p>
                {hasCompletedQuiz ? (
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-1">
                    <Target size={10} /> Điểm: <strong>{riskScore}/100</strong>
                    {lastUpdated && <><span className="mx-1">·</span><Calendar size={10} /> {lastUpdated}</>}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-400 mt-0.5">Chưa làm đánh giá — đang dùng giá trị mặc định</p>
                )}
              </div>
            </div>
            <Link
              to="/risk-assessment"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-black border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all shrink-0 cursor-pointer"
            >
              <Target size={13} /> {hasCompletedQuiz ? 'Làm lại quiz' : 'Làm quiz ngay'}
            </Link>
          </div>

          <div className="relative rounded-3xl border overflow-hidden" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-7">
              {saved && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 text-[13px] font-bold text-emerald-400">
                  <CheckCircle size={15} /> Đã lưu thay đổi thành công!
                </motion.div>
              )}

              <div className="space-y-4">
                <SectionHeader dot="#3b82f6" label="Thông tin cơ bản" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Họ và tên</label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                      <input {...register('fullName')} className={inputCls(errors.fullName) + ' pl-10'} placeholder="Nguyễn Văn A" />
                    </div>
                    {errors.fullName && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.fullName.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Email nhận cảnh báo</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                      <input type="email" value={user?.email || ''} className={INPUT + ' pl-10 opacity-60 cursor-not-allowed'} disabled />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px" style={{ background: 'var(--color-border)' }} />

              <div className="space-y-4">
                <SectionHeader dot="#10b981" label="Tài chính & Thu nhập" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Thu nhập hằng tháng</label>
                    <div className="relative">
                      <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                      <Controller
                        name="monthlyIncome"
                        control={control}
                        render={({ field }) => (
                          <FormattedInput kind="integer" value={field.value} onValueChange={v => field.onChange(v === '' ? 0 : Number(v))} className={inputCls(errors.monthlyIncome) + ' pl-10'} placeholder="0" suffix="đ" />
                        )}
                      />
                    </div>
                    {errors.monthlyIncome && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.monthlyIncome.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Trả nợ thêm mỗi tháng</label>
                    <div className="relative">
                      <TrendingDown size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                      <Controller
                        name="extraBudget"
                        control={control}
                        render={({ field }) => (
                          <FormattedInput kind="integer" value={field.value} onValueChange={v => field.onChange(v === '' ? 0 : Number(v))} className={inputCls(errors.extraBudget) + ' pl-10'} placeholder="0" suffix="đ" />
                        )}
                      />
                    </div>
                    {errors.extraBudget && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.extraBudget.message}</p>}
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Tổng vốn (Tổng tài sản)</label>
                  <div className="relative">
                    <Wallet size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                    <Controller
                      name="capital"
                      control={control}
                      render={({ field }) => (
                        <FormattedInput kind="integer" value={field.value} onValueChange={v => field.onChange(v === '' ? 0 : Number(v))} className={inputCls(errors.capital) + ' pl-10'} placeholder="100000000" suffix="đ" />
                      )}
                    />
                  </div>
                  {errors.capital && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.capital.message}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL}>Lãi suất ngân hàng (%)</label>
                    <div className="relative">
                      <Controller
                        name="savingsRate"
                        control={control}
                        render={({ field }) => (
                          <FormattedInput kind="decimal" value={field.value} onValueChange={v => field.onChange(v === '' ? 0 : Number(v))} className={inputCls(errors.savingsRate) + ' pl-10'} placeholder="6,0" suffix="%" />
                        )}
                      />
                    </div>
                    {errors.savingsRate && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.savingsRate.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Mức lạm phát (%)</label>
                    <div className="relative">
                      <Controller
                        name="inflationRate"
                        control={control}
                        render={({ field }) => (
                          <FormattedInput kind="decimal" value={field.value} onValueChange={v => field.onChange(v === '' ? 0 : Number(v))} className={inputCls(errors.inflationRate) + ' pl-10'} placeholder="3,5" suffix="%" />
                        )}
                      />
                    </div>
                    {errors.inflationRate && <p className="mt-1 text-[12px] text-red-400 flex items-center gap-1"><AlertTriangle size={11}/> {errors.inflationRate.message}</p>}
                  </div>
                </div>
              </div>

              <div className="h-px" style={{ background: 'var(--color-border)' }} />

              <div className="space-y-4">
                <SectionHeader dot="#f59e0b" label="Chiến lược đầu tư" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL}>Mục tiêu tài chính</label>
                    <select className={SELECT} {...register('goal')}>
                      <option value="GROWTH">Tăng trưởng tài sản</option>
                      <option value="INCOME">Tạo dòng tiền thụ động</option>
                      <option value="STABILITY">Bảo toàn vốn</option>
                      <option value="SPECULATION">Đầu cơ mạo hiểm</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Thời hạn đầu tư</label>
                    <select className={SELECT} {...register('horizon')}>
                      {HORIZON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>
                      Khẩu vị rủi ro {hasCompletedQuiz && <span className="normal-case font-normal text-[var(--color-text-muted)]">(từ quiz)</span>}
                    </label>
                    <select className={SELECT} {...register('riskLevel')}>
                      <option value="LOW">Thấp — An toàn</option>
                      <option value="MEDIUM">Vừa phải — Cân bằng</option>
                      <option value="HIGH">Cao — Mạo hiểm</option>
                    </select>
                    {hasCompletedQuiz && <p className="text-[10px] mt-1.5" style={{ color: riskMeta.color }}>Quiz đề xuất: {riskMeta.label}</p>}
                  </div>
                </div>
                {!hasCompletedQuiz && (
                  <div className="flex items-start gap-3 px-4 py-3 rounded-2xl border border-amber-500/20 bg-amber-500/6">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-amber-300">
                      Chưa hoàn thành đánh giá rủi ro.{' '}
                      <Link to="/risk-assessment" className="font-black underline hover:text-amber-200 transition-colors">Làm quiz ngay →</Link>
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-60">
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                    : <><Rocket size={15} /> Lưu toàn bộ thông tin</>}
                </button>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-3 flex items-center gap-1">
                  <AlertTriangle size={11} /> Cần cập nhật tối thiểu các thông tin để mở khóa tính năng <strong>Tư vấn AI</strong>
                </p>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="relative rounded-3xl border p-6 text-center overflow-hidden"
            style={{ background: 'var(--color-bg-card)', borderColor: 'rgba(59,130,246,0.15)' }}>
            <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black mx-auto mb-3 text-white"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', boxShadow: '0 0 24px rgba(59,130,246,0.4)' }}>
              {initials}
            </div>
            <p className="font-black text-[var(--color-text-primary)] text-[15px]">{user?.fullName || '—'}</p>
            <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{user?.email || '—'}</p>
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-[11px] font-black"
              style={{ background: `${riskMeta.color}18`, color: riskMeta.color }}>
              <RiskIcon size={11} /> {riskMeta.label}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="rounded-3xl border p-5" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Tóm tắt hồ sơ</p>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1, borderColor: 'var(--color-border)' }}>
              {[
                { icon: DollarSign, label: 'Thu nhập / tháng',    value: formatVND(user?.monthlyIncome || 0),              color: '#10b981' },
                { icon: TrendingDown, label: 'Trả nợ thêm / tháng', value: formatVND(user?.extraBudget || 0),             color: '#f59e0b' },
                { icon: Wallet, label: 'Tổng vốn',                value: formatVND(user?.investorProfile?.capital || 0),   color: '#3b82f6' },
                { icon: TrendingUp, label: 'Lãi gửi ngân hàng',  value: formatPercent(user?.investorProfile?.savingsRate ?? 6.0),   color: '#06b6d4' },
                { icon: TrendingDown, label: 'Mức lạm phát',      value: formatPercent(user?.investorProfile?.inflationRate ?? 3.5),color: '#ef4444' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <row.icon size={12} style={{ color: row.color }} /> {row.label}
                  </span>
                  <span className="text-[12px] font-bold text-[var(--color-text-primary)]">{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-3xl border p-5" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Chiến lược đầu tư</p>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {[
                { icon: Target, label: 'Mục tiêu',      value: GOAL_LABEL[user?.investorProfile?.goal || 'GROWTH'],         color: '#8b5cf6' },
                { icon: Clock,  label: 'Thời hạn',      value: HORIZON_LABEL[user?.investorProfile?.horizon || 'MEDIUM'],   color: '#06b6d4' },
                { icon: RiskIcon, label: 'Khẩu vị',     value: riskMeta.label,                                               color: riskMeta.color },
                ...(hasCompletedQuiz ? [{ icon: BarChart2, label: 'Điểm quiz', value: `${riskScore}/100`, color: riskMeta.color }] : []),
                ...(lastUpdated ? [{ icon: Calendar, label: 'Cập nhật', value: lastUpdated, color: '#64748b' }] : []),
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2.5">
                  <span className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <row.icon size={12} style={{ color: row.color }} /> {row.label}
                  </span>
                  <span className="text-[12px] font-bold" style={{ color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="rounded-3xl border p-5" style={{ background: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
            <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-3">Liên kết nhanh</p>
            <div className="space-y-1">
              {[
                { to: '/risk-assessment', icon: Target,    label: hasCompletedQuiz ? 'Làm lại quiz rủi ro' : 'Đánh giá rủi ro ngay', color: '#8b5cf6' },
                { to: '/investment',      icon: TrendingUp, label: 'Phân bổ đầu tư AI',    color: '#3b82f6' },
                { to: '/debts',           icon: CreditCard, label: 'Quản lý khoản nợ',     color: '#ef4444' },
                { to: '/debts/dti',       icon: BarChart2,  label: 'Phân tích DTI',        color: '#10b981' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[12px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all group cursor-pointer"
                >
                  <link.icon size={13} style={{ color: link.color }} />
                  <span className="flex-1">{link.label}</span>
                  <ChevronRight size={12} className="text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
