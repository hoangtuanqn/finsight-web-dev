import { User, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function ProfileHeader({ user }: { user: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-4 pb-2"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-500 text-[11px] font-black uppercase tracking-widest">
          <User size={12} /> Hồ sơ cá nhân
        </div>
        {user?.isTwoFactorEnabled && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 text-[11px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> 2FA Secured
          </div>
        )}
      </div>
      
      <h1 className="text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
        {user?.fullName ? `Chào, ${user.fullName.split(' ').pop()} 👋` : 'Hồ sơ của bạn'}
      </h1>
      <p className="text-[var(--color-text-secondary)] text-[15px] font-medium mt-2">
        Hoàn thiện thông tin để AI đánh giá tài chính cá nhân một cách chính xác nhất
      </p>
    </motion.div>
  );
}
