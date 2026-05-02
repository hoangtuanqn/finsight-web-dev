import { useCallback, useEffect, useRef } from 'react';
import type { FaceChallenge } from '../pages/KycPage/components/FaceGuide3D';

// ─── Audio file mapping ───────────────────────────────────────────────────────
// Files live in apps/web/public/voices/
const CHALLENGE_SOUNDS: Partial<Record<FaceChallenge, string>> = {
  look_up: '/voices/on.mp3',
  look_down: '/voices/below.mp3',
  look_left: '/voices/left.mp3',
  look_right: '/voices/right.mp3',
  look_straight: '/voices/straight.mp3', // ← new
  open_mouth: '/voices/open-mouth.mp3', // ← new
};

const SOUND_HOLD = '/voices/keep-the-same.mp3';
const SOUND_DONE = '/voices/done.mp3'; // ← new: plays when all challenges complete

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceGuide() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playingRef = useRef<string | null>(null); // currently playing src

  /** Stop whatever is currently playing */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    playingRef.current = null;
  }, []);

  /** Play a sound by src path. Stops previous sound first. */
  const play = useCallback(
    (src: string) => {
      // Avoid restarting the same sound if it's already playing
      if (playingRef.current === src && audioRef.current && !audioRef.current.paused) return;

      stop();

      const audio = new Audio(src);
      audio.volume = 1;
      audio.onended = () => {
        if (playingRef.current === src) {
          playingRef.current = null;
          audioRef.current = null;
        }
      };
      audioRef.current = audio;
      playingRef.current = src;

      // Browsers may block autoplay — catch silently
      audio.play().catch(() => {
        console.warn('[VoiceGuide] Autoplay blocked for:', src);
      });
    },
    [stop],
  );

  /** Play the directional cue for a given challenge */
  const playChallenge = useCallback(
    (challenge: FaceChallenge) => {
      const src = CHALLENGE_SOUNDS[challenge];
      if (src) play(src);
    },
    [play],
  );

  /** Play the "hold still" confirmation sound */
  const playHold = useCallback(() => {
    play(SOUND_HOLD);
  }, [play]);

  /** Play the completion sound when all challenges are done */
  const playDone = useCallback(() => {
    play(SOUND_DONE);
  }, [play]);

  // Cleanup on unmount
  useEffect(() => () => stop(), [stop]);

  return { play, stop, playChallenge, playHold, playDone };
}
