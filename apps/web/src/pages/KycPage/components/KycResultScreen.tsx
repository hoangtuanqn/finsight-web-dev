import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResultProps {
  kycName?: string;
  kycIdNumber?: string;
}

export default function KycResultScreen({ kycName, kycIdNumber }: ResultProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 rounded-full" />
        <div className="w-24 h-24 bg-gradient-to-tr from-emerald-500 to-emerald-400 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 relative z-10 border-4 border-white">
          <ShieldCheck size={48} />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Xác minh thành công</h2>
      <p className="text-[var(--color-text-secondary)] mb-8 max-w-md">
        Tuyệt vời! Danh tính của bạn đã được xác minh. Tài khoản của bạn hiện đã được bảo vệ tối đa và có thể sử dụng
        tất cả tính năng trên hệ thống.
      </p>

      <div className="w-full max-w-md bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border)] text-left mb-8">
        <h3 className="font-bold text-[var(--color-text-primary)] mb-4 text-sm uppercase tracking-wider text-[var(--color-text-muted)]">
          Thông tin định danh
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border)]">
            <span className="text-[var(--color-text-secondary)]">Họ và tên</span>
            <span className="font-bold text-[var(--color-text-primary)]">{kycName}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="text-[var(--color-text-secondary)]">Số CCCD</span>
            <span className="font-bold text-[var(--color-text-primary)]">{kycIdNumber}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/profile')}
        className="px-8 py-3.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold transition-all flex items-center gap-2"
      >
        <ArrowLeft size={18} /> Quay lại trang cá nhân
      </button>
    </div>
  );
}
