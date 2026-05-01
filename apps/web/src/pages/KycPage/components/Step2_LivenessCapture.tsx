import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import Webcam from 'react-webcam';
import { Video, RotateCcw, AlertTriangle, Camera, CheckCircle2, Wifi } from 'lucide-react';
import { useCameraPermission } from '../../../hooks/useCameraPermission';
import type { FaceChallenge } from './FaceGuide3D';

// Three.js is ~500KB — lazy load only when needed
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
  timerMs: number; // fallback timer if FaceMesh unavailable
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CHALLENGES: ChallengeConfig[] = [
  { key: 'look_straight', label: 'Nhìn thẳng vào camera', icon: '👁️', timerMs: 3000 },
  { key: 'look_left',     label: 'Quay đầu sang trái',    icon: '←',   timerMs: 2500 },
  { key: 'look_right',    label: 'Quay đầu sang phải',    icon: '→',   timerMs: 2500 },
];

const HOLD_REQUIRED      = 20;   // frames for gesture enforcement
const TURN_THRESHOLD     = 0.07; // nose deviation for left/right
const STRAIGHT_THRESHOLD = 0.04;
const FACEMESH_TIMEOUT   = 8000; // ms — give up CDN load after this

// ─── Gesture Detection ────────────────────────────────────────────────────────
function detectGesture(landmarks: any[]): FaceChallenge {
  if (!landmarks || landmarks.length < 468) return 'idle';
  const nose     = landmarks[1];
  const leftEar  = landmarks[234];
  const rightEar = landmarks[454];
  if (!nose || !leftEar || !rightEar) return 'idle';

  const midX      = (leftEar.x + rightEar.x) / 2;
  const deviation = nose.x - midX;

  if (deviation > TURN_THRESHOLD)     return 'look_right';
  if (deviation < -TURN_THRESHOLD)    return 'look_left';
  if (Math.abs(deviation) < STRAIGHT_THRESHOLD) return 'look_straight';
  return 'idle';
}

// ─── Sub-components ───────────────────────────────────────────────────────────
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

function ChallengeDots({
  challenges, currentIdx, completedCount,
}: {
  challenges: ChallengeConfig[];
  currentIdx: number;
  completedCount: number;
}) {
  return (
    <div className="flex items-center gap-2 justify-center mt-3">
      {challenges.map((c, i) => (
        <div key={c.key} className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            i < completedCount  ? 'bg-emerald-500 scale-110'  :
            i === currentIdx    ? 'bg-blue-500 animate-pulse scale-125' :
                                  'bg-[var(--color-border)]'
          }`} />
          {i < challenges.length - 1 && (
            <div className={`w-6 h-0.5 transition-colors duration-500 ${
              i < completedCount ? 'bg-emerald-500' : 'bg-[var(--color-border)]'
            }`} />
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
  const timerRef         = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mutable refs to avoid stale closures in RAF/timer loops
  const isRecordingRef   = useRef(false);
  const currentIdxRef    = useRef(0);
  const allDoneRef       = useRef(false);
  const useFallbackRef   = useRef(false); // true = timer mode, no FaceMesh

  const [isRecording,      setIsRecording]     = useState(false);
  const [currentIdx,       setCurrentIdx]      = useState(0);
  const [completedCount,   setCompletedCount]  = useState(0);
  const [progress,         setProgress]        = useState(0);
  const [currentGesture,   setCurrentGesture]  = useState<FaceChallenge>('idle');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoFile,        setVideoFile]        = useState<File | null>(null);
  const [allDone,          setAllDone]          = useState(false);

  // FaceMesh loading states
  const [faceReady,       setFaceReady]       = useState(false);
  const [meshLoading,     setMeshLoading]     = useState(false);
  const [useFallback,     setUseFallback]     = useState(false); // timer mode

  const { state: camState, errorMessage: camError, requestPermission, reset: resetCam } = useCameraPermission();

  // Keep refs in sync
  isRecordingRef.current = isRecording;
  currentIdxRef.current  = currentIdx;
  allDoneRef.current     = allDone;
  useFallbackRef.current = useFallback;

  // ── Finish recording ──────────────────────────────────────────────────────
  const finishRecording = useCallback(() => {
    if (allDoneRef.current) return;
    allDoneRef.current = true;
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setAllDone(true);
  }, []);

  // ── Advance to next challenge (shared by both modes) ─────────────────────
  const advanceChallenge = useCallback(() => {
    holdFrames.current = 0;
    setProgress(0);
    const next = currentIdxRef.current + 1;
    setCompletedCount(next);
    if (next >= CHALLENGES.length) {
      finishRecording();
    } else {
      setCurrentIdx(next);
    }
  }, [finishRecording]);

  // ── TIMER FALLBACK: runs a countdown per challenge ─────────────────────────
  const runTimerChallenge = useCallback((idx: number) => {
    if (allDoneRef.current || !isRecordingRef.current) return;
    const challenge = CHALLENGES[idx];
    if (!challenge) return;

    let elapsed = 0;
    const step  = 50; // ms per tick
    const total = challenge.timerMs;

    const tick = () => {
      if (allDoneRef.current || !isRecordingRef.current) return;
      elapsed += step;
      setProgress(Math.min((elapsed / total) * 100, 100));
      if (elapsed >= total) {
        const next = idx + 1;
        setCompletedCount(next);
        if (next >= CHALLENGES.length) {
          finishRecording();
        } else {
          setCurrentIdx(next);
          runTimerChallenge(next);
        }
      } else {
        timerRef.current = setTimeout(tick, step);
      }
    };
    timerRef.current = setTimeout(tick, step);
  }, [finishRecording]);

  // ── FACEMESH MODE: handle landmark result ──────────────────────────────────
  const handleFrameLandmarks = useCallback((landmarks: any[]) => {
    if (allDoneRef.current || !isRecordingRef.current) return;

    const idx    = currentIdxRef.current;
    const target = CHALLENGES[idx]?.key;
    if (!target) return;

    const gesture = detectGesture(landmarks);
    setCurrentGesture(gesture);

    if (gesture !== target) {
      holdFrames.current = Math.max(holdFrames.current - 2, 0);
      setProgress((holdFrames.current / HOLD_REQUIRED) * 100);
      return;
    }

    holdFrames.current++;
    setProgress((holdFrames.current / HOLD_REQUIRED) * 100);

    if (holdFrames.current >= HOLD_REQUIRED) {
      advanceChallenge();
    }
  }, [advanceChallenge]);

  // ── RAF detection loop (FaceMesh mode) ────────────────────────────────────
  const runDetectionLoop = useCallback(() => {
    const loop = async () => {
      if (!isRecordingRef.current) return; // stop if recording ended
      const video = webcamRef.current?.video;
      if (video && faceMeshRef.current && video.readyState >= 2) {
        try { await faceMeshRef.current.send({ image: video }); } catch {}
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Load MediaPipe FaceMesh with timeout ──────────────────────────────────
  const loadFaceMesh = useCallback(async () => {
    if (faceMeshRef.current || meshLoading) return;
    setMeshLoading(true);

    const timeoutId = setTimeout(() => {
      console.warn('[FaceMesh] CDN timeout — switching to timer fallback');
      setMeshLoading(false);
      setUseFallback(true);
    }, FACEMESH_TIMEOUT);

    try {
      const { FaceMesh } = await import('@mediapipe/face_mesh');
      const fm = new FaceMesh({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.5,
      });
      // Attach result handler — use ref wrapper to avoid stale closure
      fm.onResults((results: any) => {
        const lms = results.multiFaceLandmarks?.[0];
        if (lms) handleFrameLandmarks(lms);
      });
      await fm.initialize();
      clearTimeout(timeoutId);
      faceMeshRef.current = fm;
      setFaceReady(true);
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn('[FaceMesh] Load failed — switching to timer fallback:', e);
      setUseFallback(true);
    } finally {
      setMeshLoading(false);
    }
  }, [meshLoading, handleFrameLandmarks]);

  // ── Start Recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    // Wait for webcam stream (may need a tick after mount)
    let stream = webcamRef.current?.stream;
    if (!stream) {
      // Retry once after a short delay
      await new Promise(r => setTimeout(r, 500));
      stream = webcamRef.current?.stream;
    }
    if (!stream) {
      console.error('[Step2] Webcam stream not available');
      return;
    }

    // Reset all state
    recordedChunks.current = [];
    holdFrames.current     = 0;
    allDoneRef.current     = false;
    setCurrentIdx(0);
    setCompletedCount(0);
    setProgress(0);
    setAllDone(false);
    setCurrentGesture('idle');
    setRecordedVideoUrl(null);
    setVideoFile(null);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }

    // Setup MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : 'video/webm';
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current.ondataavailable = ({ data }: BlobEvent) => {
      if (data.size > 0) recordedChunks.current.push(data);
    };
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      setRecordedVideoUrl(URL.createObjectURL(blob));
      setVideoFile(new File([blob], 'liveness.webm', { type: 'video/webm' }));
    };
    mediaRecorderRef.current.start(100); // collect chunks every 100ms
    setIsRecording(true);

    // Start the appropriate detection mode
    if (useFallbackRef.current || !faceMeshRef.current) {
      runTimerChallenge(0);
    } else {
      runDetectionLoop();
    }
  }, [runTimerChallenge, runDetectionLoop]);

  // ── Retry / Reset ──────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setRecordedVideoUrl(null);
    setVideoFile(null);
    setCurrentIdx(0);
    setCompletedCount(0);
    setProgress(0);
    setAllDone(false);
    setCurrentGesture('idle');
    holdFrames.current  = 0;
    allDoneRef.current  = false;
  }, []);

  // ── On mount: check camera → load FaceMesh in background ──────────────────
  useEffect(() => {
    let cancelled = false;
    requestPermission().then((ok) => {
      if (ok && !cancelled) loadFaceMesh();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  const currentChallenge  = CHALLENGES[currentIdx];
  const isCorrectGesture  = isRecording && !useFallback && currentGesture === currentChallenge?.key;
  // Button: always enabled once cam granted; no FaceMesh gate
  const canStart = camState === 'granted' && !isRecording && !recordedVideoUrl;

  return (
    <div className="space-y-6">

      {/* Instructions */}
      <div className="bg-[var(--color-bg-secondary)]/50 p-5 rounded-2xl border border-[var(--color-border)]">
        <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
          <Video size={18} className="text-blue-500" />
          Hướng dẫn xác thực khuôn mặt
        </h3>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 ml-6 list-disc">
          <li>Đảm bảo ánh sáng đủ, khuôn mặt rõ ràng trong khung hình.</li>
          <li>Không đeo kính râm, khẩu trang hoặc mũ.</li>
          <li>Làm theo đúng hướng dẫn — robot 3D sẽ minh hoạ cho bạn.</li>
        </ul>
        {/* Fallback mode notice */}
        {useFallback && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-3 py-2 rounded-xl">
            <Wifi size={14} />
            Chế độ hướng dẫn cơ bản (AI nhận diện không khả dụng — hãy làm theo hướng dẫn thật chính xác).
          </div>
        )}
      </div>

      {/* Camera permission error */}
      {(camState === 'denied' || camState === 'unavailable') && (
        <CameraErrorBanner
          message={camError}
          onRetry={() => { resetCam(); requestPermission().then(ok => { if (ok) loadFaceMesh(); }); }}
        />
      )}

      {/* Loading state */}
      {camState === 'checking' && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--color-text-secondary)]">Đang kiểm tra quyền camera...</p>
        </div>
      )}

      {/* Camera view */}
      {camState === 'granted' && (
        <>
          <div className="relative w-full max-w-sm mx-auto aspect-[3/4] bg-black rounded-[2rem] overflow-hidden shadow-2xl">

            {/* Webcam or recorded preview */}
            {recordedVideoUrl ? (
              <video src={recordedVideoUrl} controls autoPlay loop
                className="w-full h-full object-cover scale-x-[-1]" />
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                mirrored={true}
                videoConstraints={{ facingMode: 'user', width: 640, height: 480 }}
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay (hide when showing recorded preview) */}
            {!recordedVideoUrl && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">

                {/* Face oval + progress arc */}
                <div className="relative w-[240px] h-[320px] flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 320">
                    {/* Dashed base oval */}
                    <ellipse cx="120" cy="160" rx="108" ry="148"
                      fill="none"
                      stroke={
                        !isRecording      ? '#3b82f640' :
                        isCorrectGesture  ? '#22c55e50' : '#ef444440'
                      }
                      strokeWidth="2" strokeDasharray="8 5"
                    />
                    {/* Live progress arc */}
                    {isRecording && (
                      <ellipse cx="120" cy="160" rx="108" ry="148"
                        fill="none"
                        stroke={useFallback ? '#3b82f6' : isCorrectGesture ? '#22c55e' : '#ef4444'}
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 816} 816`}
                        style={{
                          transition: 'stroke-dasharray 0.1s ease, stroke 0.3s ease',
                          transform: 'rotate(-90deg)',
                          transformOrigin: '120px 160px',
                        }}
                      />
                    )}
                  </svg>
                  {/* Tinted oval fill */}
                  <div className="absolute inset-0 transition-colors duration-300" style={{
                    borderRadius: '50% / 47%',
                    background:
                      !isRecording      ? 'rgba(59,130,246,0.07)'  :
                      useFallback       ? 'rgba(59,130,246,0.07)'  :
                      isCorrectGesture  ? 'rgba(34,197,94,0.08)'   : 'rgba(239,68,68,0.06)',
                  }} />
                </div>

                {/* 3D Head Guide — top-right corner */}
                <div className="absolute top-3 right-3 bg-black/55 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 pointer-events-none">
                  <Suspense fallback={<div className="w-[68px] h-[68px] rounded-full bg-white/10 animate-pulse" />}>
                    <FaceGuide3D
                      challenge={isRecording ? (currentChallenge?.key ?? 'idle') : 'idle'}
                      size={68}
                    />
                  </Suspense>
                  <p className="text-[9px] text-white/60 text-center mt-0.5 font-medium">Làm theo robot</p>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 px-4 pointer-events-auto">
                  {isRecording ? (
                    <>
                      <div className={`px-5 py-2.5 rounded-full font-bold text-sm text-center backdrop-blur-md transition-all duration-300 ${
                        isCorrectGesture || useFallback
                          ? 'bg-emerald-500/80 text-white'
                          : 'bg-black/70 text-white animate-pulse'
                      }`}>
                        {currentChallenge?.icon} {currentChallenge?.label}
                      </div>
                      {!useFallback && isCorrectGesture && (
                        <span className="text-emerald-400 text-xs font-semibold animate-pulse">
                          Giữ nguyên... {Math.round(progress)}%
                        </span>
                      )}
                      {!useFallback && !isCorrectGesture && currentGesture !== 'idle' && (
                        <span className="text-red-400 text-xs font-semibold">
                          Chưa đúng — hãy thử lại
                        </span>
                      )}
                      {useFallback && (
                        <span className="text-blue-300 text-xs font-semibold">
                          {Math.round(progress)}%
                        </span>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={!canStart}
                      className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {/* Show spinner only if FaceMesh is still loading AND we're not in fallback yet */}
                      {meshLoading && !useFallback ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Đang tải AI...</>
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
              <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
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

          {/* Retry */}
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
          onClick={() => videoFile && onNext(videoFile)}
          disabled={!videoFile || isRecording}
          className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
