import { User } from "lucide-react";

export function ProfileHeader() {
  return (
    <div className="pt-2">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/8 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
        <User size={11} /> Hồ sơ cá nhân
      </div>
      <h1 className="text-3xl font-black tracking-tighter text-[var(--color-text-primary)]">
        Hồ sơ của bạn
      </h1>
      <p className="text-[var(--color-text-secondary)] text-sm mt-1">
        Hoàn thiện thông tin để AI đánh giá tài chính chính xác nhất
      </p>
    </div>
  );
}
