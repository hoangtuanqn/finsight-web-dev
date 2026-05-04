import { AlertTriangle, Camera, Image as ImageIcon, RotateCcw, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useCameraPermission } from '../../../hooks/useCameraPermission';

interface Step1Props {
  onNext: (frontImage: File, backImage: File) => void;
  initialFront?: File | null;
  initialBack?: File | null;
}

// ─── Camera Error Banner ──────────────────────────────────────────────────────
function CameraErrorModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--color-bg-card)] rounded-2xl p-6 space-y-4 border border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="text-red-400" size={20} />
          </div>
          <div>
            <p className="font-bold text-[var(--color-text-primary)] text-sm">Không thể mở Camera</p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{message}</p>
          </div>
        </div>
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-3 text-xs text-[var(--color-text-muted)]">
          <p className="font-semibold text-[var(--color-text-secondary)] mb-1">Cách cấp quyền:</p>
          <p>Chrome: Nhấn 🔒 trên thanh địa chỉ → Quyền → Camera → Cho phép → Tải lại trang</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold text-sm"
          >
            Đóng
          </button>
          <label className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all">
            <Upload size={14} /> Tải ảnh lên
            {/* Trigger upload from parent via callback if needed */}
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8 = new Uint8Array(n);
  while (n--) u8[n] = bstr.charCodeAt(n);
  return new File([u8], filename, { type: mime });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Step1_IdCapture({ onNext, initialFront, initialBack }: Step1Props) {
  const [frontImage, setFrontImage] = useState<File | null>(initialFront || null);
  const [backImage, setBackImage] = useState<File | null>(initialBack || null);
  const [frontPreview, setFrontPreview] = useState<string | null>(
    initialFront ? URL.createObjectURL(initialFront) : null,
  );
  const [backPreview, setBackPreview] = useState<string | null>(initialBack ? URL.createObjectURL(initialBack) : null);

  const [activeCamera, setActiveCamera] = useState<'front' | 'back' | null>(null);
  const [showCamError, setShowCamError] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const { errorMessage, requestPermission, reset: resetCam } = useCameraPermission();

  // ── Open camera with permission check ──
  const openCamera = useCallback(
    async (side: 'front' | 'back') => {
      const ok = await requestPermission();
      if (!ok) {
        setShowCamError(true);
        return;
      }
      setActiveCamera(side);
    },
    [requestPermission],
  );

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
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (side === 'front') {
      setFrontImage(file);
      setFrontPreview(preview);
    } else {
      setBackImage(file);
      setBackPreview(preview);
    }
  };

  const handleNext = () => {
    if (frontImage && backImage) onNext(frontImage, backImage);
  };

  return (
    <div className="space-y-6">
      {/* Camera error modal */}
      {showCamError && (
        <CameraErrorModal
          message={errorMessage || 'Không thể truy cập camera.'}
          onClose={() => {
            setShowCamError(false);
            resetCam();
          }}
        />
      )}

      {/* Active Camera Modal */}
      {activeCamera && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-lg aspect-[1.586/1] bg-black rounded-2xl overflow-hidden">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'environment' }}
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-blue-500/60 m-6 rounded-xl flex items-center justify-center">
              <span className="bg-black/60 text-white px-4 py-2 rounded-lg backdrop-blur-md font-bold text-sm">
                Đặt {activeCamera === 'front' ? 'mặt trước' : 'mặt sau'} CCCD vào khung
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-6">
            <button
              onClick={() => setActiveCamera(null)}
              className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700 transition-colors"
            >
              <X size={24} />
            </button>
            <button
              onClick={capture}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-blue-500/40 active:scale-95 transition-transform"
            >
              <div className="w-16 h-16 rounded-full border-2 border-black" />
            </button>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['front', 'back'] as const).map((side) => {
          const preview = side === 'front' ? frontPreview : backPreview;
          const label = side === 'front' ? 'Mặt trước CCCD' : 'Mặt sau CCCD';

          return (
            <div key={side} className="space-y-3">
              <h3 className="font-bold text-[var(--color-text-primary)]">{label}</h3>
              <div className="aspect-[1.586/1] rounded-2xl border-2 border-dashed border-[var(--color-border)] overflow-hidden relative group">
                {preview ? (
                  <>
                    <img src={preview} alt={label} className="w-full h-full object-cover" />
                    {/* Hover overlay with retake options */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        onClick={() => openCamera(side)}
                        className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md transition-colors"
                        title="Chụp lại"
                      >
                        <Camera size={20} />
                      </button>
                      <label
                        className="p-3 bg-white/10 text-white rounded-full hover:bg-white/20 backdrop-blur-md cursor-pointer transition-colors"
                        title="Tải ảnh khác"
                      >
                        <Upload size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, side)}
                        />
                      </label>
                      <button
                        onClick={() => {
                          if (side === 'front') {
                            setFrontImage(null);
                            setFrontPreview(null);
                          } else {
                            setBackImage(null);
                            setBackPreview(null);
                          }
                        }}
                        className="p-3 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/30 backdrop-blur-md transition-colors"
                        title="Xoá"
                      >
                        <RotateCcw size={20} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--color-bg-secondary)]/50">
                    <ImageIcon size={48} className="text-[var(--color-text-muted)] opacity-40" />
                    <div className="flex gap-3">
                      <button
                        onClick={() => openCamera(side)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                      >
                        <Camera size={16} /> Mở Camera
                      </button>
                      <label className="px-4 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer hover:bg-[var(--color-bg-secondary)] transition-colors">
                        <Upload size={16} /> Tải ảnh lên
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, side)}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
