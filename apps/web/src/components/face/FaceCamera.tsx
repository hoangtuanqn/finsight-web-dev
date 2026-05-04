import * as faceapi from 'face-api.js';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, CheckCircle2, Loader2, ScanFace, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { loadFaceModels } from '../../lib/loadFaceModels';

type FaceCameraStatus = 'loading' | 'ready' | 'captured' | 'error';

interface FaceCameraProps {
  onDescriptor: (descriptor: number[]) => void;
  mode?: 'register' | 'login';
  onCancel?: () => void;
}

// Throttle: detect every N ms to avoid GPU overload
const DETECT_INTERVAL_MS = 250;

export function FaceCamera({ onDescriptor, mode = 'login', onCancel }: FaceCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const detectingRef = useRef(false); // guard against concurrent detections

  const [status, setStatus] = useState<FaceCameraStatus>('loading');
  const [faceDetected, setFaceDetected] = useState(false);
  const [isLive, setIsLive] = useState(false); // Liveness state
  const earHistory = useRef<number[]>([]); // Track Eye Aspect Ratio
  const [capturing, setCapturing] = useState(false);
  const [hint, setHint] = useState('Đang khởi tạo mô hình AI...');
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Boot: load models + camera
  useEffect(() => {
    let active = true;

    async function init() {
      try {
        // Fake progress bar for better UX during model load
        const progressTimer = setInterval(() => {
          setLoadingProgress((p) => (p < 85 ? p + 12 : p));
        }, 400);

        await loadFaceModels();
        clearInterval(progressTimer);
        setLoadingProgress(100);

        if (!active) return;

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 480 }, height: { ideal: 360 }, facingMode: 'user' },
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('ready');
        setHint('Nhìn thẳng vào camera — phát hiện khuôn mặt tự động');
      } catch (err: any) {
        console.error('FaceCamera init error:', err);
        if (!active) return;
        setStatus('error');
        setHint(
          err?.name === 'NotAllowedError'
            ? 'Cần quyền truy cập camera. Hãy cho phép trong trình duyệt.'
            : 'Không thể truy cập camera. Hãy kiểm tra thiết bị và thử lại.',
        );
      }
    }

    init();

    return () => {
      active = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Throttled detection loop (setInterval is much lighter than RAF + async)
  useEffect(() => {
    if (status !== 'ready') return;

    const tinyOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 160, // smaller = faster detection, still accurate enough
      scoreThreshold: 0.45,
    });

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2 || detectingRef.current) return;

      detectingRef.current = true;
      try {
        const result = await faceapi.detectSingleFace(video, tinyOptions).withFaceLandmarks();
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (result) {
          setFaceDetected(true);

          // --- Liveness Detection (Blink detection via EAR) ---
          const leftEye = result.landmarks.getLeftEye();
          const rightEye = result.landmarks.getRightEye();

          const getEAR = (eye: faceapi.Point[]) => {
            // eye[0]: outer, eye[3]: inner
            const p1_p5 = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y);
            const p2_p4 = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y);
            const p0_p3 = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y);
            return (p1_p5 + p2_p4) / (2.0 * p0_p3);
          };

          const avgEAR = (getEAR(leftEye) + getEAR(rightEye)) / 2;
          earHistory.current.push(avgEAR);
          if (earHistory.current.length > 15) {
            earHistory.current.shift();
          }

          // A blink causes a significant drop in EAR, then a rise.
          // Photo/screenshot will have static EAR (variance ~ 0)
          if (!isLive && earHistory.current.length >= 5) {
            const minEAR = Math.min(...earHistory.current);
            const maxEAR = Math.max(...earHistory.current);
            if (maxEAR - minEAR > 0.06 && minEAR < 0.25) {
              setIsLive(true);
              setHint('Hoàn tất xác thực. Đang xử lý...');
            } else {
              setHint('Đang quét độ chân thực (hãy chớp mắt)...');
            }
          } else if (isLive) {
            setHint('Đã xác thực thực thể. Sẵn sàng quét.');
          }

          // Scale box from video natural size to canvas display size
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;
          const { x, y, width, height } = result.detection.box;
          const bx = x * scaleX;
          const by = y * scaleY;
          const bw = width * scaleX;
          const bh = height * scaleY;

          // Corner-bracket bounding box (GPU-friendly: no shadowBlur)
          const corner = Math.min(bw, bh) * 0.18;
          ctx.strokeStyle = isLive ? '#10b981' : '#f59e0b'; // Green if live, Orange if waiting for blink
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          // Top-left
          ctx.moveTo(bx + corner, by);
          ctx.lineTo(bx, by);
          ctx.lineTo(bx, by + corner);
          // Top-right
          ctx.moveTo(bx + bw - corner, by);
          ctx.lineTo(bx + bw, by);
          ctx.lineTo(bx + bw, by + corner);
          // Bottom-left
          ctx.moveTo(bx, by + bh - corner);
          ctx.lineTo(bx, by + bh);
          ctx.lineTo(bx + corner, by + bh);
          // Bottom-right
          ctx.moveTo(bx + bw - corner, by + bh);
          ctx.lineTo(bx + bw, by + bh);
          ctx.lineTo(bx + bw, by + bh - corner);
          ctx.stroke();
        } else {
          setFaceDetected(false);
          setIsLive(false);
          earHistory.current = [];
          setHint('Nhìn thẳng vào camera');
        }
      } finally {
        detectingRef.current = false;
      }
    }, DETECT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, isLive]);

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || capturing || !faceDetected || !isLive) return;

    // Stop detection loop during capture
    if (intervalRef.current) clearInterval(intervalRef.current);

    setCapturing(true);
    setHint('Đang trích xuất dữ liệu sinh trắc...');

    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setHint('Lỗi khi quét, vui lòng nhìn thẳng và thử lại.');
        setCapturing(false);
        // Restart detection loop
        setStatus('loading');
        setTimeout(() => setStatus('ready'), 50);
        return;
      }

      setStatus('captured');
      setHint(mode === 'register' ? 'Đăng ký khuôn mặt thành công!' : 'Nhận diện thành công!');
      onDescriptor(Array.from(detection.descriptor));
    } catch (err) {
      console.error('Capture error:', err);
      setHint('Lỗi nhận diện. Hãy thử lại.');
      setCapturing(false);
    }
  };

  // Auto-capture when liveness is verified (in login mode) for a seamless FaceID-like experience
  useEffect(() => {
    if (isLive && mode === 'login' && status === 'ready' && !capturing) {
      const timer = setTimeout(() => {
        handleCapture();
      }, 600); // Short delay to show the green success UI before freezing
      return () => clearTimeout(timer);
    }
  }, [isLive, mode, status, capturing]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Camera viewport */}
      <div
        className="relative overflow-hidden bg-slate-950 shadow-2xl"
        style={{
          width: 320,
          height: 240,
          borderRadius: '1.25rem',
          border: `1.5px solid ${faceDetected && isLive && status === 'ready' ? 'rgba(16,185,129,0.4)' : faceDetected && !isLive ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
          transition: 'border-color 0.4s ease',
          boxShadow:
            faceDetected && isLive && status === 'ready'
              ? '0 0 24px 0 rgba(16,185,129,0.18)'
              : faceDetected && !isLive && status === 'ready'
                ? '0 0 24px 0 rgba(245,158,11,0.18)'
                : '0 8px 32px 0 rgba(0,0,0,0.5)',
        }}
      >
        {/* Mirror video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* Canvas overlay (mirrored to match video) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
          width={320}
          height={240}
        />

        {/* Premium Scanning Radar Animation */}
        <AnimatePresence>
          {status === 'ready' && faceDetected && !isLive && (
            <motion.div
              key="radar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 h-2 bg-gradient-to-b from-amber-400/0 via-amber-400/50 to-amber-400/0 shadow-[0_0_12px_rgba(245,158,11,0.6)] pointer-events-none"
              style={{ top: '10%' }}
              animate={{ top: ['10%', '90%', '10%'] }}
              transition={{ duration: 2.5, ease: 'linear', repeat: Infinity }}
            />
          )}

          {/* Liveness Confirmed Flash */}
          {status === 'ready' && faceDetected && isLive && (
            <motion.div
              key="flash"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute inset-0 bg-emerald-500/30 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Overlays */}
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 gap-4 px-6"
            >
              {/* Progress bar */}
              <div className="w-full max-w-[180px] space-y-3 text-center">
                <Loader2 className="text-emerald-400 animate-spin mx-auto" size={28} />
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-emerald-400 rounded-full"
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Tải mô hình AI…</p>
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 gap-3 p-6 text-center"
            >
              <Camera className="text-rose-400" size={32} />
              <p className="text-[11px] text-rose-300 font-medium leading-relaxed">{hint}</p>
            </motion.div>
          )}

          {status === 'captured' && (
            <motion.div
              key="captured"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 260, damping: 20 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ background: 'rgba(6,78,59,0.92)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 18 }}
              >
                <CheckCircle2 className="text-emerald-400" size={44} />
              </motion.div>
              <p className="text-[12px] text-emerald-300 font-bold">{hint}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Face status dot */}
        <AnimatePresence>
          {status === 'ready' && (
            <motion.div
              key="dot"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute top-3 right-3 flex items-center gap-1.5"
            >
              <div className="relative w-2 h-2">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${faceDetected ? (isLive ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-600'}`}
                />
                {faceDetected && (
                  <div
                    className={`absolute inset-0 w-2 h-2 rounded-full animate-ping ${isLive ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Corner decorative frame */}
        {status === 'ready' && (
          <div className="absolute inset-3 pointer-events-none">
            {[
              'top-0 left-0 border-t-2 border-l-2 rounded-tl-sm',
              'top-0 right-0 border-t-2 border-r-2 rounded-tr-sm',
              'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-sm',
              'bottom-0 right-0 border-b-2 border-r-2 rounded-br-sm',
            ].map((cls, i) => (
              <div
                key={i}
                className={`absolute w-4 h-4 transition-colors duration-300 ${cls} ${
                  faceDetected ? (isLive ? 'border-emerald-500/70' : 'border-amber-500/70') : 'border-white/20'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      <motion.p
        key={hint}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="text-[11px] text-slate-400 font-medium text-center max-w-[280px] leading-relaxed"
      >
        {hint}
      </motion.p>

      {/* Buttons */}
      <AnimatePresence>
        {status === 'ready' && (
          <motion.div
            key="btns"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="flex gap-2.5 w-full max-w-[320px]"
          >
            {onCancel && (
              <button
                onClick={onCancel}
                className="flex-none flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-[11px] font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                <XCircle size={15} /> Hủy
              </button>
            )}
            <motion.button
              whileHover={faceDetected && isLive ? { scale: 1.02 } : {}}
              whileTap={faceDetected && isLive ? { scale: 0.97 } : {}}
              onClick={handleCapture}
              disabled={capturing || !faceDetected || !isLive}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-[12px] font-black uppercase tracking-wider transition-all duration-200 ${
                faceDetected && isLive
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-700/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {capturing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Đang xử lý…
                </>
              ) : (
                <>
                  <ScanFace size={15} />
                  {faceDetected
                    ? isLive
                      ? mode === 'login'
                        ? 'Đang xử lý tự động...'
                        : 'Hoàn tất đăng ký'
                      : 'Đang quét liveness…'
                    : 'Chờ nhận diện…'}
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
