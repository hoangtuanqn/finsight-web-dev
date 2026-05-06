import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeAudio } from '../api/voice';

export type VoiceRecorderState = 'idle' | 'recording' | 'transcribing';

interface UseVoiceRecorderOptions {
  /** Called with the final transcribed text on success */
  onTranscribed: (text: string) => void;
  /** Max recording duration in seconds before auto-stop. Default: 60s */
  maxDurationSec?: number;
}

interface UseVoiceRecorderReturn {
  state: VoiceRecorderState;
  recordingError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
}

const MIME_TYPES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];

function getSupportedMimeType(): string {
  for (const type of MIME_TYPES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
  }
  return 'audio/webm';
}

export function useVoiceRecorder({
  onTranscribed,
  maxDurationSec = 60,
}: UseVoiceRecorderOptions): UseVoiceRecorderReturn {
  const [state, setState] = useState<VoiceRecorderState>('idle');
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);
  const isStartingRef = useRef(false);
  // Keep onTranscribed stable to avoid re-creating startRecording on every render
  const onTranscribedRef = useRef(onTranscribed);
  useEffect(() => {
    onTranscribedRef.current = onTranscribed;
  }, [onTranscribed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current ?? undefined);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (state !== 'idle' || isStartingRef.current) return;
    isStartingRef.current = true;

    // Check browser support
    if (typeof MediaRecorder === 'undefined') {
      setRecordingError('Trình duyệt không hỗ trợ ghi âm. Vui lòng dùng Chrome hoặc Firefox.');
      return;
    }

    setRecordingError(null);
    cancelledRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        releaseStream();
        if (cancelledRef.current) {
          setState('idle');
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 1000) {
          // Too short — likely silence
          setRecordingError('Giọng nói quá ngắn, vui lòng thử lại.');
          setState('idle');
          return;
        }

        setState('transcribing');
        try {
          const text = await transcribeAudio(blob);
          if (!text) {
            setRecordingError('Không nhận diện được giọng nói, vui lòng thử lại.');
          } else {
            setRecordingError(null);
            onTranscribedRef.current(text);
          }
        } catch (err: any) {
          setRecordingError(err?.message || 'Lỗi kết nối, vui lòng thử lại.');
        } finally {
          setState('idle');
        }
      };

      recorder.start(250); // Collect chunks every 250ms
      setState('recording');

      // Auto-stop after maxDurationSec
      timeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, maxDurationSec * 1000);
    } catch (err: any) {
      releaseStream();
      const isDenied = err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError';
      setRecordingError(
        isDenied ? 'Vui lòng cấp quyền microphone để sử dụng tính năng này.' : 'Không thể truy cập microphone.',
      );
      setState('idle');
    } finally {
      isStartingRef.current = false;
    }
  }, [state, maxDurationSec, releaseStream]);

  const stopRecording = useCallback(() => {
    clearTimeout(timeoutRef.current ?? undefined);
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      // state transitions to 'transcribing' inside onstop handler
    }
  }, []);

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true;
    clearTimeout(timeoutRef.current ?? undefined);
    releaseStream();
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setState('idle');
    setRecordingError(null);
  }, [releaseStream]);

  return { state, recordingError, startRecording, stopRecording, cancelRecording };
}
