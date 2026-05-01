import { useState } from 'react';
import { Shield, Send } from 'lucide-react';
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
      }
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
          <p className="font-semibold mt-0.5">{(submitKyc.error as any)?.response?.data?.error || 'Có lỗi xảy ra khi xác minh'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Images */}
        <div className="space-y-4">
          <div id="kyc-front" className={`transition-all duration-300 ${errorField === 'front' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            <h4 className={`text-sm font-bold mb-2 ${errorField === 'front' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>Mặt trước CCCD</h4>
            <div className={`aspect-[1.586/1] rounded-xl border-2 overflow-hidden transition-all duration-300 ${
              errorField === 'front' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-[var(--color-border)]'
            }`}>
              <img src={frontUrl} alt="Front" className="w-full h-full object-cover" />
            </div>
          </div>
          <div id="kyc-back" className={`transition-all duration-300 ${errorField === 'back' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
            <h4 className={`text-sm font-bold mb-2 ${errorField === 'back' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>Mặt sau CCCD</h4>
            <div className={`aspect-[1.586/1] rounded-xl border-2 overflow-hidden transition-all duration-300 ${
              errorField === 'back' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-[var(--color-border)]'
            }`}>
              <img src={backUrl} alt="Back" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Video */}
        <div id="kyc-video" className={`transition-all duration-300 ${errorField === 'video' ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          <h4 className={`text-sm font-bold mb-2 ${errorField === 'video' ? 'text-red-500' : 'text-[var(--color-text-secondary)]'}`}>Video xác thực</h4>
          <div className={`aspect-[3/4] max-w-sm mx-auto rounded-[2rem] border-4 overflow-hidden bg-black transition-all duration-300 ${
            errorField === 'video' ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]' : 'border-[var(--color-border)] shadow-xl'
          }`}>
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full object-cover"
            />
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

    </div>
  );
}
