import { ShieldCheck, ShieldAlert, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKycStatus } from '../../../hooks/useKycQuery';

export default function KycStatusCard() {
  const navigate = useNavigate();
  const { data: kyc, isLoading } = useKycStatus();

  if (isLoading) {
    return (
      <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-center animate-pulse min-h-[120px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const status = kyc?.kycStatus || 'NONE';

  return (
    <div className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        
        {/* State: NONE */}
        {status === 'NONE' && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">Chưa xác minh danh tính</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Xác minh eKYC để bảo vệ tài khoản và mở khóa tính năng rút tiền.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/kyc')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2"
            >
              Xác minh ngay <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* State: PENDING */}
        {status === 'PENDING' && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">Đang chờ xử lý</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Yêu cầu xác minh của bạn đang được hệ thống xử lý.
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-amber-500/10 text-amber-500 font-bold text-sm rounded-xl border border-amber-500/20">
              Đang chờ duyệt
            </div>
          </>
        )}

        {/* State: VERIFIED */}
        {status === 'VERIFIED' && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-[var(--color-text-primary)]">Đã xác minh danh tính</h4>
                <div className="text-sm text-[var(--color-text-secondary)] mt-1 space-y-1">
                  <p>Họ tên: <strong className="text-[var(--color-text-primary)]">{kyc?.kycName}</strong></p>
                  <p>Số CCCD: <strong className="text-[var(--color-text-primary)]">{kyc?.kycIdNumber}</strong></p>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 font-bold text-sm rounded-xl border border-emerald-500/20 flex items-center gap-2">
              <ShieldCheck size={16} /> Đã bảo vệ
            </div>
          </>
        )}

        {/* State: REJECTED */}
        {status === 'REJECTED' && (
          <>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-rose-500">Xác minh thất bại</h4>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1 max-w-md">
                  Lý do: <strong className="text-[var(--color-text-primary)]">{kyc?.kycRecord?.rejectReason || 'Thông tin không hợp lệ'}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/kyc')}
              className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold text-sm transition-all whitespace-nowrap"
            >
              Thử lại
            </button>
          </>
        )}

      </div>
    </div>
  );
}
