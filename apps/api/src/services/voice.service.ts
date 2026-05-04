import OpenAI, { toFile } from 'openai';

const OPENAI_API_KEY = process.env.API_KEY_OPENAI;

if (!OPENAI_API_KEY) {
  console.warn('[VoiceService] API_KEY_OPENAI is not set — voice transcription will fail.');
}

const whisperClient = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface TranscribeResult {
  text: string;
}

/**
 * Transcribe an audio buffer using OpenAI Whisper API.
 *
 * Flow: Audio Buffer → OpenAI Whisper → Transcript text
 *
 * Retries up to 3 times on transient server errors (502/503/504).
 */
export async function transcribeWithWhisper(
  buffer: Buffer,
  mimeType: string,
  originalname: string,
): Promise<TranscribeResult> {
  const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';

  console.log(`[VoiceService] Processing ${buffer.length} bytes (${mimeType}) via OpenAI Whisper...`);

  const audioFile = await toFile(buffer, `${originalname || 'recording'}.${ext}`, {
    type: mimeType,
  });

  let transcription: OpenAI.Audio.Transcription | undefined;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      transcription = await whisperClient.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'vi',
        response_format: 'json',
      });
      break;
    } catch (err: any) {
      attempts++;
      const status = err.status || err.response?.status;
      if (attempts >= maxAttempts || (status !== 502 && status !== 503 && status !== 504)) {
        throw err;
      }
      console.warn(`[VoiceService] Attempt ${attempts} failed (status ${status}), retrying in 1.5s...`);
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  if (!transcription) {
    throw new Error('Không nhận được kết quả từ dịch vụ STT');
  }

  const text = transcription.text?.trim() ?? '';

  if (text) {
    console.log(`[VoiceService] Success → "${text.substring(0, 60)}${text.length > 60 ? '...' : ''}"`);
  }

  return { text };
}
