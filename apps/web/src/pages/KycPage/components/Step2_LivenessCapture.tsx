import { AlertTriangle, Camera, CheckCircle2, Download, RotateCcw, Video } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useCameraPermission } from '../../../hooks/useCameraPermission';
import { useVoiceGuide } from '../../../hooks/useVoiceGuide';
import type { FaceChallenge } from './FaceGuide3D';

// FaceGuide3D removed as requested by user

// ─── Types ───────────────────────────────────────────────────────────────────
interface Step2Props {
  initialVideo?: File | null;
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
  { key: 'look_straight', label: 'Nhìn thẳng vào camera', icon: '👁️', timerMs: 4000 },
  { key: 'look_left', label: 'Quay đầu sang trái', icon: '←', timerMs: 1000 },
  { key: 'look_right', label: 'Quay đầu sang phải', icon: '→', timerMs: 1000 },
  { key: 'look_up', label: 'Ngước đầu lên', icon: '↑', timerMs: 1000 },
  { key: 'look_down', label: 'Cúi đầu xuống', icon: '↓', timerMs: 1000 },
  { key: 'open_mouth', label: 'Há miệng', icon: '😮', timerMs: 1000 },
];

// ~30fps assumption for camera
const TURN_THRESHOLD = 0.07; // nose deviation for left/right
const PITCH_THRESHOLD = 0.045; // nose deviation for up/down
const MOUTH_THRESHOLD = 0.025; // upper/lower lip distance
const STRAIGHT_THRESHOLD = 0.04;
const FACEMESH_TIMEOUT = 8000; // ms — give up CDN load after this

// ─── Gesture Detection ────────────────────────────────────────────────────────
function detectGesture(landmarks: any[]): FaceChallenge {
  if (!landmarks || landmarks.length < 468) return 'idle';
  const nose = landmarks[1];
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];
  const leftEye = landmarks[159];
  const rightEye = landmarks[386];
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];

  if (!nose || !leftEar || !rightEar || !leftEye || !rightEye || !upperLip || !lowerLip) return 'idle';

  // --- Mouth Open Detection ---
  // Normalize mouth distance relative to face height (eye to mouth) to be distance invariant
  const faceHeight = lowerLip.y - (leftEye.y + rightEye.y) / 2;
  const mouthOpenDist = lowerLip.y - upperLip.y;
  if (mouthOpenDist / faceHeight > 0.12) return 'open_mouth';

  // --- Pitch (Up/Down) Detection ---
  const eyeY = (leftEye.y + rightEye.y) / 2;
  const mouthY = upperLip.y;
  const noseY = nose.y;

  // Ratio of nose-to-eye vs mouth-to-eye. Normally ~0.5.
  // When looking UP, nose moves towards eyes (ratio decreases).
  // When looking DOWN, nose moves towards mouth (ratio increases).
  const pitchRatio = (noseY - eyeY) / (mouthY - eyeY);

  if (pitchRatio < 0.4) return 'look_up';
  if (pitchRatio > 0.65) return 'look_down';

  // --- Yaw (Left/Right) Detection ---
  const earMidX = (leftEar.x + rightEar.x) / 2;
  const faceWidth = rightEar.x - leftEar.x; // Unmirrored: rightEar > leftEar
  const yawRatio = (nose.x - earMidX) / faceWidth;

  if (yawRatio > 0.15) return 'look_left';
  if (yawRatio < -0.15) return 'look_right';

  return 'look_straight'; // If not turned enough and not pitched, it is straight
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
  challenges,
  currentIdx,
  completedCount,
}: {
  challenges: ChallengeConfig[];
  currentIdx: number;
  completedCount: number;
}) {
  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      {challenges.map((c, i) => {
        const isCompleted = i < completedCount;
        const isActive = i === currentIdx;
        return (
          <div key={c.key} className="flex items-center gap-1">
            <div
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500 scale-110 shadow-[0_0_8px_rgba(34,197,94,0.8)]'
                  : isActive
                    ? 'bg-blue-500 animate-pulse scale-125 shadow-[0_0_12px_rgba(59,130,246,0.9)]'
                    : 'bg-[var(--color-border)] opacity-50'
              }`}
            />
            {i < challenges.length - 1 && (
              <div
                className={`w-5 h-0.5 rounded-full transition-colors duration-500 ${
                  isCompleted
                    ? 'bg-emerald-500/80 shadow-[0_0_5px_rgba(34,197,94,0.5)]'
                    : 'bg-[var(--color-border)] opacity-30'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Step2_LivenessCapture({ initialVideo, onNext, onBack }: Step2Props) {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const holdFrames = useRef(0);
  const rafRef = useRef<number>(0);
  const faceMeshRef = useRef<any>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mutable refs to avoid stale closures in RAF/timer loops
  const isRecordingRef = useRef(false);
  const currentIdxRef = useRef(0);
  const allDoneRef = useRef(!!initialVideo);
  const useFallbackRef = useRef(false); // true = timer mode, no FaceMesh
  const wasCorrectRef = useRef(false); // tracks correct→incorrect transitions for voice

  const voice = useVoiceGuide();

  const [isRecording, setIsRecording] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedCount, setCompletedCount] = useState(() => (initialVideo ? CHALLENGES.length : 0));
  const [progress, setProgress] = useState(0);
  const [currentGesture, setCurrentGesture] = useState<FaceChallenge>('idle');
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(() =>
    initialVideo ? URL.createObjectURL(initialVideo) : null,
  );
  const [videoFile, setVideoFile] = useState<File | null>(() => initialVideo || null);
  const [allDone, setAllDone] = useState(() => !!initialVideo);

  // Use an effect to sync initialVideo if the component is kept mounted
  useEffect(() => {
    if (initialVideo && !videoFile) {
      setVideoFile(initialVideo);
      setRecordedVideoUrl(URL.createObjectURL(initialVideo));
      setAllDone(true);
      setCompletedCount(CHALLENGES.length);
      allDoneRef.current = true;
    }
  }, [initialVideo, videoFile]);

  // FaceMesh loading states
  const [faceReady, setFaceReady] = useState(false);
  const [meshLoading, setMeshLoading] = useState(false);
  const [useFallback, setUseFallback] = useState(false); // timer mode

  const { state: camState, errorMessage: camError, requestPermission, reset: resetCam } = useCameraPermission();

  // Keep refs in sync
  isRecordingRef.current = isRecording;
  currentIdxRef.current = currentIdx;
  allDoneRef.current = allDone;
  useFallbackRef.current = useFallback;

  // ── Finish recording ──────────────────────────────────────────────────────
  const finishRecording = useCallback(() => {
    if (allDoneRef.current) return;
    allDoneRef.current = true;
    setAllDone(true); // update state for UI

    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    isRecordingRef.current = false; // sync ref immediately
  }, []);

  // ── Advance to next challenge (shared by both modes) ─────────────────────
  const advanceChallenge = useCallback(() => {
    holdFrames.current = 0;
    wasCorrectRef.current = false;
    setProgress(0);
    const next = currentIdxRef.current + 1;
    setCompletedCount(next);
    if (next >= CHALLENGES.length) {
      voice.playDone(); // ← plays done.mp3 when all challenges complete
      finishRecording();
    } else {
      setCurrentIdx(next);
      voice.playChallenge(CHALLENGES[next].key);
    }
  }, [finishRecording, voice]);

  // ── TIMER FALLBACK: guiding only, no auto-advance for verification ──────────
  const runTimerChallenge = useCallback(
    (idx: number) => {
      if (allDoneRef.current || !isRecordingRef.current) return;
      const challenge = CHALLENGES[idx];
      if (!challenge) return;

      // Play direction cue for this challenge
      voice.playChallenge(challenge.key);

      let elapsed = 0;
      const step = 50;
      const total = challenge.timerMs;

      const tick = () => {
        if (allDoneRef.current || !isRecordingRef.current) return;

        elapsed += step;
        const pct = Math.min((elapsed / total) * 100, 100);
        setProgress(pct);

        if (elapsed >= total) {
          const next = idx + 1;
          if (next >= CHALLENGES.length) {
            voice.playDone(); // ← plays done.mp3
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
    },
    [finishRecording, voice],
  );

  // ── FACEMESH MODE: handle landmark result ──────────────────────────────────
  const handleFrameLandmarks = useCallback(
    (landmarks: any[]) => {
      if (allDoneRef.current || !isRecordingRef.current) return;

      const idx = currentIdxRef.current;
      const challenge = CHALLENGES[idx];
      const target = challenge?.key;
      if (!target) return;

      const holdRequired = Math.round((challenge.timerMs / 1000) * 30);

      const gesture = detectGesture(landmarks);
      const isNowRight = gesture === target;
      setCurrentGesture(gesture);

      // ── Voice logic ──────────────────────────────────────────────────────────
      if (isNowRight && !wasCorrectRef.current) {
        // Just entered correct pose — no sound
      } else if (!isNowRight && wasCorrectRef.current) {
        // Was correct, now broke pose → replay direction cue
        voice.playChallenge(target);
      }
      wasCorrectRef.current = isNowRight;
      // ────────────────────────────────────────────────────────────────────────

      if (!isNowRight) {
        holdFrames.current = Math.max(holdFrames.current - 2, 0);
        setProgress((holdFrames.current / holdRequired) * 100);
        return;
      }

      holdFrames.current++;
      setProgress((holdFrames.current / holdRequired) * 100);

      if (holdFrames.current >= holdRequired) {
        advanceChallenge();
      }
    },
    [advanceChallenge, voice],
  );

  // ── RAF detection loop (FaceMesh mode) ────────────────────────────────────
  const runDetectionLoop = useCallback(() => {
    const loop = async () => {
      if (!isRecordingRef.current) return; // stop if recording ended
      const video = webcamRef.current?.video;
      if (video && faceMeshRef.current && video.readyState >= 2) {
        try {
          await faceMeshRef.current.send({ image: video });
        } catch {}
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
      const mpFaceMesh = await import('@mediapipe/face_mesh');
      // Handle different export styles (ESM/CJS/UMD)
      const FaceMeshConstructor =
        (mpFaceMesh as any).FaceMesh ||
        (mpFaceMesh as any).default?.FaceMesh ||
        (mpFaceMesh as any).default ||
        (window as any).FaceMesh;

      if (typeof FaceMeshConstructor !== 'function') {
        throw new Error('Could not find FaceMesh constructor in module or window');
      }

      const fm = new FaceMeshConstructor({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4/${file}`,
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
      await new Promise((r) => setTimeout(r, 500));
      stream = webcamRef.current?.stream;
    }
    if (!stream) {
      console.error('[Step2] Webcam stream not available');
      return;
    }

    // Reset all state
    recordedChunks.current = [];
    holdFrames.current = 0;
    wasCorrectRef.current = false;
    allDoneRef.current = false;
    setCurrentIdx(0);
    setCompletedCount(0);
    setProgress(0);
    setAllDone(false);
    setCurrentGesture('idle');
    setRecordedVideoUrl(null);
    setVideoFile(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    voice.stop();

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    // High clarity bitrate
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 4000000,
    });
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
    isRecordingRef.current = true; // Sync ref IMMEDIATELY to avoid loop exit

    // Play first challenge cue
    voice.playChallenge(CHALLENGES[0].key);

    // Start the appropriate detection mode
    if (useFallbackRef.current || !faceMeshRef.current) {
      console.log('[Step2] Starting in TIMER mode');
      runTimerChallenge(0);
    } else {
      console.log('[Step2] Starting in AI mode');
      runDetectionLoop();
    }
  }, [runTimerChallenge, runDetectionLoop, voice]);

  // ── Retry / Reset ──────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    // Stop any running loops
    cancelAnimationFrame(rafRef.current);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    voice.stop();

    // Stop active MediaRecorder if somehow still running
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Reset ALL state + refs so webcam re-mounts clean
    holdFrames.current = 0;
    wasCorrectRef.current = false;
    allDoneRef.current = false;
    isRecordingRef.current = false; // ← KEY FIX: without this, webcam overlay may not restore

    setIsRecording(false);
    setRecordedVideoUrl(null);
    setVideoFile(null);
    setCurrentIdx(0);
    setCompletedCount(0);
    setProgress(0);
    setAllDone(false);
    setCurrentGesture('idle');
  }, [voice]);

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
  const currentChallenge = CHALLENGES[currentIdx];
  const isCorrectGesture = isRecording && !useFallback && currentGesture === currentChallenge?.key;
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
        {useFallback && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-xl border border-red-500/20">
            <AlertTriangle size={14} />
            <div className="flex-1">
              <p className="font-bold">Chế độ ghi hình thủ công</p>
              <p>
                AI nhận diện không khả dụng. Video của bạn sẽ được chuyển qua bộ phận kiểm duyệt thủ công (thời gian xử
                lý lâu hơn).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Camera permission error */}
      {(camState === 'denied' || camState === 'unavailable') && (
        <CameraErrorBanner
          message={camError}
          onRetry={() => {
            resetCam();
            requestPermission().then((ok) => {
              if (ok) loadFaceMesh();
            });
          }}
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
          <div className="relative w-full max-w-2xl mx-auto aspect-video bg-black rounded-[1.5rem] overflow-hidden shadow-2xl">
            {/* Webcam or recorded preview */}
            {recordedVideoUrl ? (
              <div className="relative w-full h-full">
                <video src={recordedVideoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                <a
                  href={recordedVideoUrl}
                  download="ekyc-liveness-test.webm"
                  className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-all flex items-center gap-2 text-xs font-bold border border-white/20 pointer-events-auto"
                  title="Tải video về máy để kiểm tra"
                >
                  <Download size={18} />
                  Download
                </a>
              </div>
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                mirrored={true}
                videoConstraints={{
                  facingMode: 'user',
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  aspectRatio: 1.777777778,
                }}
                className="w-full h-full object-cover"
              />
            )}

            {/* Overlay (hide when showing recorded preview) */}
            {!recordedVideoUrl && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                {/* Face oval + progress arc - Centered in 16:9 landscape frame */}
                <div className="relative w-[240px] h-[320px] flex items-center justify-center">
                  {/* Subtle scanning sweep effect when recording but not holding */}
                  {isRecording && !isCorrectGesture && (
                    <div className="absolute inset-0 rounded-[50%/47%] overflow-hidden opacity-30">
                      <div className="w-full h-[10px] bg-gradient-to-b from-transparent via-blue-400 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                    </div>
                  )}

                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 320">
                    <defs>
                      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Dashed base oval */}
                    <ellipse
                      cx="120"
                      cy="160"
                      rx="108"
                      ry="148"
                      fill="none"
                      stroke={!isRecording ? '#3b82f640' : isCorrectGesture ? '#22c55e50' : '#ef444440'}
                      strokeWidth="2"
                      strokeDasharray="8 5"
                      className="transition-colors duration-500"
                    />

                    {/* Live progress arc with Neon Glow */}
                    {isRecording && (
                      <ellipse
                        cx="120"
                        cy="160"
                        rx="108"
                        ry="148"
                        fill="none"
                        stroke={useFallback ? '#3b82f6' : isCorrectGesture ? '#22c55e' : '#ef4444'}
                        strokeWidth={isCorrectGesture ? '8' : '4'}
                        strokeLinecap="round"
                        strokeDasharray={`${(progress / 100) * 816} 816`}
                        filter="url(#neonGlow)"
                        style={{
                          transition: 'stroke-dasharray 0.1s linear, stroke 0.3s ease, stroke-width 0.3s ease',
                          transform: 'rotate(-90deg)',
                          transformOrigin: '120px 160px',
                        }}
                      />
                    )}
                  </svg>

                  {/* Tinted oval fill with pulsing aura on correct gesture */}
                  <div
                    className={`absolute inset-0 transition-all duration-700 ${isCorrectGesture ? 'scale-105' : 'scale-100'}`}
                    style={{
                      borderRadius: '50% / 47%',
                      background: !isRecording
                        ? 'rgba(59,130,246,0.05)'
                        : useFallback
                          ? 'rgba(59,130,246,0.05)'
                          : isCorrectGesture
                            ? 'rgba(34,197,94,0.15)'
                            : 'rgba(239,68,68,0.05)',
                      boxShadow: isCorrectGesture ? '0 0 30px rgba(34,197,94,0.4) inset' : 'none',
                    }}
                  />

                  {/* Big Animated Direction Indicator on Screen */}
                  {isRecording && !isCorrectGesture && !useFallback && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {currentChallenge?.key === 'look_left' && (
                        <div className="absolute left-[-20px] text-white/90 animate-slide-left scale-[2] drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                          <svg
                            width="80"
                            height="40"
                            viewBox="0 0 80 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M70 20 L20 20" strokeDasharray="8 6" />
                            <path d="M30 10 L16 20 L30 30" />
                          </svg>
                        </div>
                      )}
                      {currentChallenge?.key === 'look_right' && (
                        <div className="absolute right-[-20px] text-white/90 animate-slide-right scale-[2] drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                          <svg
                            width="80"
                            height="40"
                            viewBox="0 0 80 40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 20 L60 20" strokeDasharray="8 6" />
                            <path d="M50 10 L64 20 L50 30" />
                          </svg>
                        </div>
                      )}
                      {currentChallenge?.key === 'look_up' && (
                        <div className="absolute top-[10px] text-white/90 animate-slide-up scale-[2] drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                          <svg
                            width="40"
                            height="80"
                            viewBox="0 0 40 80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 70 L20 20" strokeDasharray="8 6" />
                            <path d="M10 30 L20 16 L30 30" />
                          </svg>
                        </div>
                      )}
                      {currentChallenge?.key === 'look_down' && (
                        <div className="absolute bottom-[20px] text-white/90 animate-slide-down scale-[2] drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                          <svg
                            width="40"
                            height="80"
                            viewBox="0 0 40 80"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 10 L20 60" strokeDasharray="8 6" />
                            <path d="M10 50 L20 64 L30 50" />
                          </svg>
                        </div>
                      )}
                      {currentChallenge?.key === 'open_mouth' && (
                        <div className="absolute top-[60%] text-white/90 animate-[pulse_1.5s_ease-in-out_infinite] scale-150 drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                          <div className="w-10 h-12 border-4 border-white rounded-full flex items-center justify-center">
                            <div className="w-4 h-6 bg-white rounded-full animate-[ping_1.5s_infinite]"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2 px-4 pointer-events-auto">
                  {isRecording ? (
                    <>
                      <div
                        className={`px-6 py-3 rounded-full font-bold text-sm text-center backdrop-blur-xl transition-all duration-500 transform ${
                          isCorrectGesture || useFallback
                            ? 'bg-emerald-500/90 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105'
                            : 'bg-black/80 text-white animate-pulse border border-white/10'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-lg">{currentChallenge?.icon}</span>
                          {currentChallenge?.label}
                        </span>
                      </div>
                      <div className="w-full flex flex-col items-center justify-center mt-2 gap-2">
                        <div className="h-4 flex items-center justify-center">
                          {!useFallback && isCorrectGesture && (
                            <span className="text-emerald-400 text-sm font-bold animate-pulse tracking-wider uppercase">
                              GIỮ NGUYÊN... {Math.round(progress)}%
                            </span>
                          )}
                          {!useFallback && !isCorrectGesture && currentGesture !== 'idle' && (
                            <span className="text-red-400 text-sm font-semibold uppercase tracking-wider">
                              CHƯA ĐÚNG TƯ THẾ
                            </span>
                          )}
                          {useFallback && (
                            <span className="text-blue-300 text-sm font-semibold uppercase tracking-wider">
                              ĐANG GHI HÌNH... {Math.round(progress)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={startRecording}
                      disabled={!canStart}
                      className="px-7 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {/* Show spinner only if FaceMesh is still loading AND we're not in fallback yet */}
                      {meshLoading && !useFallback ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Đang tải AI...
                        </>
                      ) : (
                        <>
                          <Video size={18} /> Bắt đầu quay
                        </>
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
          <ChallengeDots challenges={CHALLENGES} currentIdx={currentIdx} completedCount={completedCount} />

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
