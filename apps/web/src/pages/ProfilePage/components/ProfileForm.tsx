import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, CheckCircle, Shield, User, Wallet, TrendingUp, Lock } from "lucide-react";
import type { Control, UseFormRegister, FieldErrors } from "react-hook-form";

import SecuritySection from "./SecuritySection";
import BasicInfoSection from "./BasicInfoSection";
import FinanceSection from "./FinanceSection";
import InvestmentSection from "./InvestmentSection";

// Helper for Section Header (Clean & Minimalist)
function SectionHeader({ icon: Icon, color, label }: { icon: any; color: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border)] pb-4">
      <div 
        className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm"
        style={{ backgroundColor: `${color}15`, color: color }}
      >
        <Icon size={16} />
      </div>
      <h3 className="text-lg font-bold text-[var(--color-text-primary)] tracking-tight">{label}</h3>
    </div>
  );
}

interface ProfileFormProps {
  register: UseFormRegister<any>;
  handleSubmit: any;
  control: Control<any>;
  errors: FieldErrors<any>;
  onSubmit: (data: any) => void;
  onUpdate: () => void;
  loading: boolean;
  saved: boolean;
  user: any;
  hasCompletedQuiz: boolean;
}

export function ProfileForm({
  register,
  handleSubmit,
  control,
  errors,
  onSubmit,
  onUpdate,
  loading,
  saved,
  user,
  hasCompletedQuiz,
}: ProfileFormProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  return (
    <div className="space-y-6">
      {/* Sleek Underlined Tab Switcher */}
      <div className="flex gap-8 border-b border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`relative pb-4 flex items-center gap-2 text-[15px] font-bold transition-all ${
            activeTab === 'profile' 
              ? 'text-blue-500' 
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <User size={18} />
          Hồ sơ định danh
          {activeTab === 'profile' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-blue-500 rounded-t-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`relative pb-4 flex items-center gap-2 text-[15px] font-bold transition-all ${
            activeTab === 'security' 
              ? 'text-rose-500' 
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Lock size={18} />
          Bảo mật tài khoản
          {activeTab === 'security' && (
            <motion.div
              layoutId="tab-underline"
              className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-rose-500 rounded-t-full"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      </div>

      <div
        className="relative rounded-[2rem] border overflow-hidden shadow-sm transition-all duration-300 min-h-[400px]"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <AnimatePresence mode="wait">
          {activeTab === 'profile' ? (
            <motion.form 
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit(onSubmit)} 
              className="p-6 sm:p-10 space-y-12"
            >
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 shadow-sm"
                >
                  <div className="p-1.5 rounded-full bg-emerald-500 text-white">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold">Cập nhật thành công</p>
                    <p className="text-[12px] font-medium opacity-80">
                      Dữ liệu đã được lưu trữ an toàn trên hệ thống.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Section 1: Basic Info */}
              <div>
                <SectionHeader icon={User} color="#3b82f6" label="Thông tin cá nhân" />
                <BasicInfoSection register={register} errors={errors} user={user} />
              </div>

              {/* Section 2: Finance */}
              <div>
                <SectionHeader icon={Wallet} color="#10b981" label="Tài chính & Thu nhập" />
                <FinanceSection control={control} errors={errors} />
              </div>

              {/* Section 3: Investment */}
              <div>
                <SectionHeader icon={TrendingUp} color="#f59e0b" label="Định hướng đầu tư" />
                <InvestmentSection register={register} user={user} hasCompletedQuiz={hasCompletedQuiz} />
              </div>

              <div className="pt-8 border-t border-[var(--color-border)]">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-slate-500">
                      <Shield size={16} />
                    </div>
                    <p className="text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[320px]">
                      Dữ liệu của bạn được mã hoá theo chuẩn bảo mật cấp cao nhất và chỉ sử dụng cho <strong>tư vấn AI cá nhân hóa</strong>.
                    </p>
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3.5 rounded-xl bg-blue-600 text-white font-bold text-[14px] hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Rocket size={18} /> Cập nhật hồ sơ
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="security"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 sm:p-10"
            >
              <div>
                <SectionHeader icon={Lock} color="#ef4444" label="Quản lý bảo mật" />
                <SecuritySection user={user} onUpdate={onUpdate} />
                
                <div className="mt-8 p-6 rounded-2xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-start gap-4">
                   <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                      <Lock size={18} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Xác thực đa lớp 2FA</h4>
                      <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
                         Để đảm bảo an toàn tuyệt đối cho tài sản và dữ liệu, FinSight khuyến nghị bạn luôn bật tính năng Xác thực đa lớp. Mọi thao tác rút tiền và thay đổi thông tin quan trọng đều sẽ yêu cầu mã OTP từ ứng dụng.
                      </p>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
