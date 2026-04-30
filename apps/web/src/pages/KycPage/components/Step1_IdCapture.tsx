import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Image as ImageIcon, RotateCcw, Check, X, Upload } from 'lucide-react';

interface Step1Props {
  onNext: (frontImage: File, backImage: File) => void;
  initialFront?: File | null;
  initialBack?: File | null;
}

export default function Step1_IdCapture({ onNext, initialFront, initialBack }: Step1Props) {
  const [frontImage, setFrontImage] = useState<File | null>(initialFront || null);
  const [backImage, setBackImage] = useState<File | null>(initialBack || null);
  
  const [frontPreview, setFrontPreview] = useState<string | null>(initialFront ? URL.createObjectURL(initialFront) : null);
  const [backPreview, setBackPreview] = useState<string | null>(initialBack ? URL.createObjectURL(initialBack) : null);

  const [activeCamera, setActiveCamera] = useState<'front' | 'back' | null>(null);
  
  const webcamRef = useRef<Webcam>(null);

  const dataURLtoFile = (dataurl: string, filename: string) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1];
    let bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
  }

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc && activeCamera) {
      const file = dataURLtoFile(imageSrc, `cccd_${activeCamera}.jpg`);
      if (activeCamera === 'front') {
        setFrontImage(file);
        setFrontPreview(imageSrc);
      } else {
        setBackImage(file);
        setBackPreview(imageSrc);
      }
      setActiveCamera(null);
    }
  }, [webcamRef, activeCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      if (side === 'front') {
        setFrontImage(file);
        setFrontPreview(preview);
      } else {
        setBackImage(file);
        setBackPreview(preview);
      }
    }
  };

  const handleNext = () => {
    if (frontImage && backImage) {
      onNext(frontImage, backImage);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Active Camera Modal */}
      {activeCamera && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-[1.586/1] bg-black rounded-2xl overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment" }}
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500/50 m-6 rounded-xl flex items-center justify-center">
              <span className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur-md font-bold">
                Đặt {activeCamera === 'front' ? 'mặt trước' : 'mặt sau'} CCCD vào khung
              </span>
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-6">
            <button 
              onClick={() => setActiveCamera(null)}
              className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
            >
              <X size={24} />
            </button>
            <button 
              onClick={capture}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-blue-500/30"
            >
              <div className="w-16 h-16 rounded-full border-2 border-black" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Front */}
        <div className="space-y-3">
          <h3 className="font-bold text-[var(--color-text-primary)]">Mặt trước CCCD</h3>
          <div className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-[var(--color-border)] overflow-hidden relative group">
            {frontPreview ? (
              <>
                <img src={frontPreview} alt="Front" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => setActiveCamera('front')} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md">
                    <Camera size={20} />
                  </button>
                  <label className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md cursor-pointer">
                    <Upload size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                  </label>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg-secondary)]/50">
                <ImageIcon size={48} className="text-[var(--color-text-muted)] opacity-50" />
                <div className="flex gap-3">
                  <button onClick={() => setActiveCamera('front')} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600">
                    <Camera size={16} /> Mở Camera
                  </button>
                  <label className="px-4 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer hover:bg-[var(--color-bg-secondary)]">
                    <Upload size={16} /> Tải ảnh lên
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'front')} />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div className="space-y-3">
          <h3 className="font-bold text-[var(--color-text-primary)]">Mặt sau CCCD</h3>
          <div className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-[var(--color-border)] overflow-hidden relative group">
            {backPreview ? (
              <>
                <img src={backPreview} alt="Back" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button onClick={() => setActiveCamera('back')} className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md">
                    <Camera size={20} />
                  </button>
                  <label className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md cursor-pointer">
                    <Upload size={20} />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                  </label>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg-secondary)]/50">
                <ImageIcon size={48} className="text-[var(--color-text-muted)] opacity-50" />
                <div className="flex gap-3">
                  <button onClick={() => setActiveCamera('back')} className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-blue-600">
                    <Camera size={16} /> Mở Camera
                  </button>
                  <label className="px-4 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer hover:bg-[var(--color-bg-secondary)]">
                    <Upload size={16} /> Tải ảnh lên
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'back')} />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-end pt-6 border-t border-[var(--color-border)] mt-8">
        <button
          onClick={handleNext}
          disabled={!frontImage || !backImage}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          Tiếp tục
        </button>
      </div>

    </div>
  );
}
