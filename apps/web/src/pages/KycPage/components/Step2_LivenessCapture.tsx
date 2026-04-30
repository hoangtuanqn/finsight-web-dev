import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { Camera, Check, RotateCcw, Video } from 'lucide-react';

interface Step2Props {
  onNext: (videoFile: File) => void;
  onBack: () => void;
}

const INSTRUCTIONS = [
  { text: 'Chuẩn bị...', duration: 3000 },
  { text: 'Nhìn thẳng vào camera', duration: 4000 },
  { text: 'Ngẩng đầu lên', duration: 2500 },
  { text: 'Cúi đầu xuống', duration: 2500 },
  { text: 'Quay đầu sang trái', duration: 2500 },
  { text: 'Quay đầu sang phải', duration: 2500 },
  { text: 'Hoàn thành!', duration: 1000 },
];

export default function Step2_LivenessCapture({ onNext, onBack }: Step2Props) {
  const webcamRef = useRef<Webcam>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [instructionIndex, setInstructionIndex] = useState(-1);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const startRecording = useCallback(() => {
    setRecordedChunks([]);
    setRecordedVideoUrl(null);
    setVideoFile(null);
    setIsRecording(true);
    setInstructionIndex(0);

    if (webcamRef.current && webcamRef.current.stream) {
      mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
        mimeType: 'video/webm'
      });
      mediaRecorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      mediaRecorderRef.current.start();
    }
  }, [webcamRef, setRecordedChunks]);

  const handleDataAvailable = useCallback(
    ({ data }: BlobEvent) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setInstructionIndex(-1);
  }, [mediaRecorderRef]);

  // Handle instructions sequence
  useEffect(() => {
    if (isRecording && instructionIndex < INSTRUCTIONS.length) {
      const timer = setTimeout(() => {
        if (instructionIndex === INSTRUCTIONS.length - 1) {
          stopRecording();
        } else {
          setInstructionIndex(prev => prev + 1);
        }
      }, INSTRUCTIONS[instructionIndex].duration);
      return () => clearTimeout(timer);
    }
  }, [isRecording, instructionIndex, stopRecording]);

  // Handle final video blob
  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const file = new File([blob], 'liveness.webm', { type: 'video/webm' });
      
      setRecordedVideoUrl(url);
      setVideoFile(file);
      setRecordedChunks([]);
    }
  }, [isRecording, recordedChunks]);

  const handleNext = () => {
    if (videoFile) {
      onNext(videoFile);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="bg-[var(--color-bg-secondary)]/50 p-6 rounded-2xl border border-[var(--color-border)] mb-6">
        <h3 className="font-bold text-[var(--color-text-primary)] flex items-center gap-2 mb-2">
          <Video size={18} className="text-blue-500" /> Hướng dẫn xác thực khuôn mặt
        </h3>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1 ml-6 list-disc">
          <li>Đảm bảo bạn đang ở nơi có đủ ánh sáng.</li>
          <li>Không đeo kính râm, khẩu trang hoặc mũ.</li>
          <li>Làm theo hướng dẫn trên màn hình khi bắt đầu quay.</li>
        </ul>
      </div>

      <div className="relative w-full max-w-lg mx-auto aspect-[3/4] bg-black rounded-[2rem] overflow-hidden shadow-2xl">
        
        {recordedVideoUrl ? (
          <video 
            src={recordedVideoUrl} 
            controls 
            className="w-full h-full object-cover transform scale-x-[-1]"
            autoPlay 
            loop 
          />
        ) : (
          <Webcam
            audio={false}
            ref={webcamRef}
            mirrored={true}
            videoConstraints={{ facingMode: "user" }}
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay Guide */}
        {!recordedVideoUrl && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center pb-12">
            
            <div className={`w-[260px] h-[360px] border-4 border-dashed rounded-full transition-colors duration-300 flex items-center justify-center
              ${isRecording ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-blue-500/60 bg-blue-500/10'}
            `}>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center">
              {isRecording ? (
                <div className="bg-black/70 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold text-lg animate-pulse text-center min-w-[200px]">
                  {INSTRUCTIONS[instructionIndex]?.text}
                </div>
              ) : (
                <button 
                  onClick={startRecording}
                  className="pointer-events-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Video size={20} /> Bắt đầu quay
                </button>
              )}
            </div>

          </div>
        )}

      </div>

      {recordedVideoUrl && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={() => setRecordedVideoUrl(null)}
            className="px-6 py-2.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold text-sm transition-all flex items-center gap-2"
          >
            <RotateCcw size={16} /> Quay lại video khác
          </button>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-[var(--color-border)] mt-8">
        <button
          onClick={onBack}
          className="px-8 py-3.5 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl font-bold transition-all"
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
