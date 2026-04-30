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

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('front', frontImage);
    formData.append('back', backImage);
    formData.append('video', videoFile);
    
    submitKyc.mutate(formData, {
      onSuccess: () => {
        onComplete();
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Images */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text-secondary)] mb-2">Mặt trước CCCD</h4>
            <div className="aspect-[1.586/1] rounded-xl border border-[var(--color-border)] overflow-hidden">
              <img src={frontUrl} alt="Front" className="w-full h-full object-cover" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text-secondary)] mb-2">Mặt sau CCCD</h4>
            <div className="aspect-[1.586/1] rounded-xl border border-[var(--color-border)] overflow-hidden">
              <img src={backUrl} alt="Back" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Video */}
        <div>
          <h4 className="text-sm font-bold text-[var(--color-text-secondary)] mb-2">Video xác thực</h4>
          <div className="aspect-[3/4] max-w-sm mx-auto rounded-[2rem] border-4 border-[var(--color-border)] overflow-hidden bg-black shadow-xl">
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
