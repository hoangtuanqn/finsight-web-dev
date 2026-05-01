import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import Webcam from 'react-webcam';
import { Video, RotateCcw, AlertTriangle, Camera, CheckCircle2 } from 'lucide-react';
import { useCameraPermission } from '../../../hooks/useCameraPermission';
import type { FaceChallenge } from './FaceGuide3D';

// Lazy load FaceGuide3D (Three.js is heavy)
const FaceGuide3D = lazy(() => import('./FaceGuide3D'));

// ─── Types ───────────────────────────────────────────────────────────────────
interface Step2Props {
  onNext: (videoFile: File) => void;
  onBack: () => void;
}

interface ChallengeConfig {
  key: FaceChallenge;
  label: string;
  icon: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CHALLENGES: ChallengeConfig[] = [
  { key: 'look_straight', label: 'Nhìn thẳng vào camera', icon: '👁️' },
  { key: 'look_left',     label: 'Quay đầu sang trái',    icon: '←' },
  { key: 'look_right',    label: 'Quay đầu sang phải',    icon: '→' },
];

// How many consecutive correct frames needed to pass a challenge
const HOLD_REQUIRED = 20;
// Nose deviation thresholds (normalized 0-1 coords)
const TURN_THRESHOLD   = 0.07; // horizontal deviation for left/right
const STRAIGHT_THRESHOLD = 0.04;

// ─── Gesture Detection ────────────────────────────────────────────────────────
function detectGesture(landmarks: any[]): FaceChallenge {
  if (!landmarks || landmarks.length < 468) return 'idle';

  // Key landmark indices (MediaPipe FaceMesh)
  const nose      = landmarks[1];   // nose tip
  const leftEar   = landmarks[234]; // left cheek/ear
  const rightEar  = landmarks[454]; // right cheek/ear

  if (!nose || !leftEar || !rightEar) return 'idle';

  const midX    = (leftEar.x + rightEar.x) / 2;
  const deviation = nose.x - midX;

  if (deviation > TURN_THRESHOLD) return 'look_right';
  if (deviation < -TURN_THRESHOLD) return 'look_left';
  if (Math.abs(deviation) < STRAIGHT_THRESHOLD) return 'look_straight';

  return 'idle';
}

// ─── Camera Permission Error UI ───────────────────────────────────────────────
function CameraErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
      <AlertTriangle className="text-red-400" size={40} />
      <div>
        <p className="font-bold text-[var(--color-text-primary)] mb-1">Không thể truy cập Camera</p>
        <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      </div>
      <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] px-4 py-3 rounded-xl">
        <p className="font-semibold mb-1">Cách cấp quyền:</p>
        <p>Chrome: Nhấn 🔒 trên thanh địa chỉ → Quyền → Camera → Cho phép</p>
      </div>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2"
      >
        <Camera size={16} /> Thử lại
      </button>
    </div>
  );
}

// ─── Progress Arc ─────────────────────────────────────────────────────────────
function ProgressArc({ progress, isCorrect }: { progress: number; isCorrect: boolean }) {
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const color = isCorrect ? '#22c55e' : '#ef4444';

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx="50%"
        cy="50%"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.1s ease, stroke 0.3s ease' }}
      />
    </svg>
  );
}

// ─── Challenge Dots ───────────────────────────────────────────────────────────
function ChallengeDots({
  challenges,
  currentIdx,
  completedCount,
}: {
  challenges: ChallengeConfig[];
  currentIdx: number;
  completedCount: number;
}) {
  return (
    <div className="flex items-center gap-2 justify-center mt-2">
      {challenges.map((c, i) => (
        <div key={c.key} className="flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < completedCount
                ? 'bg-emerald-500 scale-110'
                : i === currentIdx
                ? 'bg-blue-500 animate-pulse scale-125'
                : 'bg-[var(--color-border)]'
            }`}
          />
          {i < challenges.length - 1 && (
            <div className={`w-6 h-0.5 transition-colors duration-500 ${i < completedCount ? 'bg-emerald-500' : 'bg-[var(--color-border)]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Step2_LivenessCapture({ onNext, onBack }: Step2Props) {
  const webcamRef        = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks   = useRef<Blob[]>([]);
  const holdFrames       = useRef(0);
  const rafRef           = useRef<number>(0);
  const faceMeshRef      = useRef<any>(null);

  const [isRecording,      setIsRecording]      = useState(false);
  const [currentIdx,       setCurrentIdx]        = useState(0);
  const [completedCount,   setCompletedCount]    = useState(0);
  const [progress,         setProgress]          = useState(0);
  const [currentGesture,   setCurrentGesture]    = useState<FaceChallenge>('idle');
  const [recordedVideoUrl, setRecordedVideoUrl]  = useState<string | null>(null);
  const [videoFile,        setVideoFile]         = useState<File | null>(null);
  const [faceReady,        setFaceReady]         = useState(false);
  const [loadingFaceMesh,  setLoadingFaceMesh]   = useState(false);
  const [allDone,          setAllDone]           = useState(false);

  const { state: camState, errorMessage: camError, requestPermission, reset: resetCam } = useCameraPermission();

  // ── Load MediaPipe FaceMesh lazily ──
  const loadFaceMesh = useCallback(async () => {
    if (faceMeshRef.current) return;
    setLoadingFaceMesh(true);
    try {
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const fm = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      fm.onResults((results: any) => {
        const lms = results.multiFaceLandmarks?.[0];
        if (lms) {
          handleFrameLandmarks(lms);
        }
      });
      await fm.initialize();
      faceMeshRef.current = fm;
      setFaceReady(true);
    } catch (e) {
      console.error('[FaceMesh] Failed to load:', e);
    } finally {
      setLoadingFaceMesh(false);
    }
  }, []);

  // ── Refs for handleFrame (avoid stale closures) ──
  const currentIdxRef   = useRef(currentIdx);
  const allDoneRef      = useRef(allDone);
  currentIdxRef.current = currentIdx;
  allDoneRef.current    = allDone;

  const stopRecordingAndFinish = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    cancelAnimationFrame(rafRef.current);
    setIsRecording(false);
    setAllDone(true);
  }, []);

  const handleFrameLandmarks = useCallback(
    (landmarks: any[]) => {
      if (allDoneRef.current) return;

      const idx    = currentIdxRef.current;
      const target = CHALLENGES[idx]?.key;
      if (!target) return;

      const gesture = detectGesture(landmarks);
      setCurrentGesture(gesture);

      if (gesture !== target) {
        // Wrong gesture — decay progress
        holdFrames.current = Math.max(holdFrames.current - 2, 0);
        setProgress((holdFrames.current / HOLD_REQUIRED) * 100);
        return;
      }

      // Correct gesture — accumulate
      holdFrames.current++;
      setProgress((holdFrames.current / HOLD_REQUIRED) * 100);

      if (holdFrames.current >= HOLD_REQUIRED) {
        holdFrames.current = 0;
        setProgress(0);
        const nextIdx = idx + 1;
        setCompletedCount(nextIdx);

        if (nextIdx >= CHALLENGES.length) {
          stopRecordingAndFinish();
        } else {
          setCurrentIdx(nextIdx);
        }
      }
    },
    [stopRecordingAndFinish]
  );

  // ── rAF detection loop ──
  const runDetectionLoop = useCallback(() => {
    const loop = async () => {
      const video = webcamRef.current?.video;
      if (video && faceMeshRef.current && video.readyState === 4) {
        await faceMeshRef.current.send({ image: video });
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Start Recording ──
  const startRecording = useCallback(async () => {
    recordedChunks.current = [];
    setCurrentIdx(0);
    setCompletedCount(0);
    setProgress(0);
    holdFrames.current = 0;
    setAllDone(false);
    setRecordedVideoUrl(null);
    setVideoFile(null);

    const stream = webcamRef.current?.stream;
    if (!stream) return;

    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });
    mediaRecorderRef.current.ondataavailable = ({ data }: BlobEvent) => {
      if (data.size > 0) recordedChunks.current.push(data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url  = URL.createObjectURL(blob);
      const file = new File([blob], 'liveness.webm', { type: 'video/webm' });
      setRecordedVideoUrl(url);
      setVideoFile(file);
    };
    mediaRecorderRef.current.start();
    setIsRecording(true);
    runDetectionLoop();
  }, [runDetectionLoop]);

  // ── Stop rAF when done ──
  useEffect(() => {
    if (allDone && isRecording) {
      cancelAnimationFrame(rafRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  }, [allDone, isRecording]);

  // ── Request camera on mount ──
  useEffect(() => {
    requestPermission().then((ok) => {
      if (ok) loadFaceMesh();
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [requestPermission, loadFaceMesh]);

  const handleNext = () => {
    if (videoFile) onNext(videoFile);
  };

  const handleRetry = () => {
    setRecordedVideoUrl(null);
    setVideoFile(null);
    setCurrentIdx(0);
    setCompletedCount(0);
    setProgress(0);
    setAllDone(false);
    holdFrames.current = 0;
  };

  const currentChallenge = CHALLENGES[currentIdx];
  const isCorrectGesture  = isRecording && currentGesture === currentChallenge?.key;

  return (
    <div className="space-y-6">

      {/* Instructions box */}
      <div className="bg-[var(--color-bg-secondary)]/50 p-5 rounded-2xl border border-[var(--color-border)]">
        <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
          <Video size={18} className="text-blue-500" />
          Hướng dẫn xác thực khuôn mặt
        </h3>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 ml-6 list-disc">
          <li>Đảm bảo ánh sáng đủ, khuôn mặt rõ ràng.</li>
          <li>Không đeo kính râm, khẩu trang hoặc mũ.</li>
          <li>Làm theo đúng hướng dẫn — robot 3D sẽ minh hoạ cho bạn.</li>
        </ul>
      </div>

      {/* Camera permission error */}
      {(camState === 'denied' || camState === 'unavailable') && (
        <CameraErrorBanner
          message={camError}
          onRetry={() => {
            resetCam();
            requestPermission().then((ok) => { if (ok) loadFaceMesh(); });
          }}
        />
      )}

      {/* Webcam + Overlays */}
      {camState === 'granted' && (
        <>
          <div className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-black rounded-[2rem] overflow-hidden shadow-2xl">

            {/* Video / Preview */}
            {recordedVideoUrl ? (
              <video
                src={recordedVideoUrl}
                controls
                className="w-full h-full object-cover scale-x-[-1]"
                autoPlay
                loop
              />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                mirrored={true}
                videoConstraints={{ facingMode: 'user' }}
                className="w-full h-full object-cover"
              />
            )}

            {/* Progress arc + Face oval */}
            {!recordedVideoUrl && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">

                {/* Oval guide with progress arc */}
                <div className="relative w-[260px] h-[340px] flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 260 340">
                    {/* Base oval */}
                    <ellipse
                      cx="130" cy="170" rx="118" ry="158"
                      fill="none"
                      stroke={isRecording ? (isCorrectGesture ? '#22c55e40' : '#ef444440') : '#3b82f640'}
                      strokeWidth="2"
                      strokeDasharray="8 5"
                    />
                    {/* Progress arc */}
                    {isRecording && (
                      <ellipse
                        cx="130" cy="170" rx="118" ry="158"
                        fill="none"
                        stroke={isCorrectGesture ? '#22c55e' : '#ef4444'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 880} 880`}
                        style={{ transition: 'stroke-dasharray 0.1s ease, stroke 0.3s ease', transform: 'rotate(-90deg)', transformOrigin: '130px 170px' }}
                      />
                    )}
                  </svg>

                  {/* Fill tint */}
                  <div
                    className="absolute inset-0 rounded-full transition-colors duration-300"
                    style={{
                      borderRadius: '50% / 47%',
                      background: isRecording
                        ? isCorrectGesture ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)'
                        : 'rgba(59,130,246,0.08)',
                    }}
                  />
                </div>

                {/* 3D Head Guide — top right corner */}
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/10">
                  <Suspense fallback={<div className="w-[72px] h-[72px] rounded-full bg-white/10 animate-pulse" />}>
                    <FaceGuide3D
                      challenge={isRecording ? currentChallenge?.key ?? 'idle' : 'idle'}
                      size={72}
                    />
                  </Suspense>
                  <p className="text-[9px] text-white/60 text-center mt-1 font-medium">Làm theo robot</p>
                </div>

                {/* Instruction label */}
                <div className="absolute bottom-16 left-0 right-0 flex flex-col items-center gap-2 px-4">
                  {isRecording ? (
                    <>
                      <div className={`px-5 py-2.5 rounded-full font-bold text-sm text-center backdrop-blur-md transition-all duration-300 ${
                        isCorrectGesture
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-black/70 text-white animate-pulse'
                      }`}>
                        {currentChallenge?.icon} {currentChallenge?.label}
                      </div>
                      {isCorrectGesture && (
                        <span className="text-emerald-400 text-xs font-semibold animate-pulse">
                          Giữ nguyên... {Math.round(progress)}%
                        </span>
                      )}
                      {!isCorrectGesture && currentGesture !== 'idle' && (
                        <span className="text-red-400 text-xs font-semibold">
                          Chưa đúng — hãy thử lại
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={!faceReady || loadingFaceMesh}
                      className="pointer-events-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {loadingFaceMesh ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Đang tải...</>
                      ) : (
                        <><Video size={18} /> Bắt đầu quay</>
                      )}
                    </button>
                  )}
                </div>

              </div>
            )}

            {/* Success overlay */}
            {allDone && !recordedVideoUrl && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                <CheckCircle2 className="text-emerald-400" size={56} />
                <p className="text-white font-bold text-lg">Hoàn thành!</p>
                <p className="text-white/60 text-sm">Đang lưu video...</p>
              </div>
            )}
          </div>

          {/* Challenge progress dots */}
          <ChallengeDots
            challenges={CHALLENGES}
            currentIdx={currentIdx}
            completedCount={completedCount}
          />

          {/* Retry button */}
          {recordedVideoUrl && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleRetry}
                className="px-6 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold text-sm transition-all flex items-center gap-2"
              >
                <RotateCcw size={16} /> Quay lại video khác
              </button>
            </div>
          )}
        </>
      )}

      {/* Loading camera */}
      {camState === 'checking' && (
        <div className="flex flex-col items-center gap-3 py-12 text-[var(--color-text-secondary)]">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Đang kiểm tra quyền camera...</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-[var(--color-border)] mt-8">
        <button
          onClick={onBack}
          disabled={isRecording}
          className="px-8 py-3.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none"
        >
          Quay lại
        </button>
        <button
          onClick={handleNext}
          disabled={!videoFile || isRecording}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          Tiếp tục
        </button>
      </div>

    </div>
  );
}
