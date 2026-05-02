import { AlertCircle, CheckCircle2, Cpu, Lock, Send, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useKycSubmit } from '../../../hooks/useKycQuery';

interface Step3Props {
  frontImage: File;
  backImage: File;
  videoFile: File;
  onBack: () => void;
  onComplete: () => void;
}

export default function Step3_Review({ frontImage, backImage, videoFile, onBack, onComplete }: Step3Props) {
  const submitKyc = useKycSubmit();
  const [errorField, setErrorField] = useState<string | null>(null);
  const [verifyingStep, setVerifyingStep] = useState(0);

  const verifyingSteps = [
    { label: 'Đang mã hóa dữ liệu bảo mật...', icon: <Lock size={18} /> },
    { label: 'Đang phân tích hình ảnh CCCD...', icon: <Cpu size={18} /> },
    { label: 'Đang xác thực video Liveness...', icon: <Shield size={18} /> },
    { label: 'Đang so khớp khuôn mặt AI...', icon: <CheckCircle2 size={18} /> },
  ];

  useEffect(() => {
    let interval: any;
    if (submitKyc.isPending) {
      setVerifyingStep(0);
      interval = setInterval(() => {
        setVerifyingStep((prev) => (prev + 1) % verifyingSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [submitKyc.isPending]);

  const handleSubmit = () => {
    setErrorField(null);
    const formData = new FormData();
    formData.append('front', frontImage);
    formData.append('back', backImage);
    formData.append('video', videoFile);

    submitKyc.mutate(formData, {
      onSuccess: () => {
        onComplete();
      },
      onError: (error: any) => {
        const field = error?.response?.data?.field;
        if (field) {
          setErrorField(field);
          // Scroll to the element with a slight delay to allow React to render the error state
          setTimeout(() => {
            const el = document.getElementById(`kyc-${field}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }
      },
    });
  };

  const frontUrl = URL.createObjectURL(frontImage);
  const backUrl = URL.createObjectURL(backImage);
  const videoUrl = URL.createObjectURL(videoFile);

  return (
    <div className="space-y-6">
      <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/20 mb-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
          <Shield size={20} />
        </div>
        <div>
          <h3 className="font-bold text-emerald-600 mb-1">Kiểm tra thông tin</h3>
          <p className="text-sm text-emerald-600/80">
            Vui lòng xem lại các tài liệu trước khi gửi xác minh. Đảm bảo ảnh rõ nét, không bị mờ nhòe hay mất góc.
          </p>
        </div>
      </div>

      {submitKyc.isError && (
        <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/30 text-red-500 text-sm animate-fade-in flex items-start gap-3">
          <Shield className="shrink-0 mt-0.5" size={18} />
          <p className="font-semibold mt-0.5">
            {(submitKyc.error as any)?.response?.data?.error || 'Có lỗi xảy ra khi xác minh'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-4">
          <div
            id="kyc-front"
            className={`transition-all duration-300 ${errorField === 'front' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          >
            <h4
              className={`text-sm font-bold mb-2 ${errorField === 'front' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}
            >
              Mặt trước CCCD
            </h4>
            <div
              className={`aspect-[1.586/1] rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                errorField === 'front'
                  ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <img src={frontUrl} alt="Front" className="w-full h-full object-cover" />
            </div>
          </div>
          <div
            id="kyc-back"
            className={`transition-all duration-300 ${errorField === 'back' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          >
            <h4
              className={`text-sm font-bold mb-2 ${errorField === 'back' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}
            >
              Mặt sau CCCD
            </h4>
            <div
              className={`aspect-[1.586/1] rounded-xl border-2 overflow-hidden transition-all duration-300 ${
                errorField === 'back'
                  ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <img src={backUrl} alt="Back" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Video */}
        <div
          id="kyc-video"
          className={`transition-all duration-300 ${errorField === 'video' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
        >
          <h4
            className={`text-sm font-bold mb-2 ${errorField === 'video' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}
          >
            Video xác thực
          </h4>
          <div
            className={`aspect-[3/4] max-w-sm mx-auto rounded-[2rem] border-4 overflow-hidden bg-black transition-all duration-300 ${
              errorField === 'video'
                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                : 'border-[var(--color-border)] shadow-xl'
            }`}
          >
            <video src={videoUrl} controls className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6 border-t border-[var(--color-border)] mt-8">
        <button
          onClick={onBack}
          disabled={submitKyc.isPending}
          className="px-8 py-3.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold transition-all disabled:opacity-50"
        >
          Quay lại chỉnh sửa
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitKyc.isPending}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-70 flex items-center gap-2"
        >
          {submitKyc.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              Gửi xác minh <Send size={18} />
            </>
          )}
        </button>
      </div>

      {/* Verification Loading Overlay */}
      {submitKyc.isPending && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-2xl animate-fade-in" />

          {/* Neon Glow background elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] animate-pulse delay-700" />

          {/* Content Card */}
          <div className="relative w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
            {/* Animated Scanner Circle */}
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-blue-400 animate-pulse">
                <Shield size={40} />
              </div>
            </div>

            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Đang xác thực danh tính</h2>

            <div className="h-8 mb-8 overflow-hidden relative">
              <div
                className="transition-all duration-700 ease-in-out transform flex flex-col items-center"
                style={{ transform: `translateY(-${verifyingStep * 32}px)` }}
              >
                {verifyingSteps.map((step, i) => (
                  <div key={i} className="h-8 flex items-center gap-2 text-blue-400 font-semibold justify-center">
                    {step.icon}
                    <span>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-sm">
                <AlertCircle size={16} />
                LƯU Ý QUAN TRỌNG
              </div>
              <p className="text-xs text-amber-500/80 leading-relaxed">
                Hệ thống AI đang thực hiện kiểm tra an ninh cao cấp.
                <br />
                <span className="font-bold text-amber-500 uppercase">Vui lòng không đóng trình duyệt</span> hoặc thoát
                trang trong lúc này để tránh lỗi giao dịch.
              </p>
            </div>

            {/* Bottom Security Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-white/40 text-xs">
              <Lock size={12} />
              <span>Bảo mật bởi Finsight Secure AI Engine</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
