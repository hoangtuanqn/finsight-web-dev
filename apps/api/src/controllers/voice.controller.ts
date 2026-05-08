import { Response } from 'express';
import { transcribeWithWhisper } from '../services/voice.service';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

/** POST /api/voice/transcribe — Transcribe audio file via OpenAI Whisper */
export async function transcribeVoice(req: AuthenticatedRequest, res: Response) {
  if (!req.file) {
    return error(res, 'Không tìm thấy file audio', 400);
  }

  const { buffer, originalname } = req.file;

  if (buffer.length === 0) {
    return error(res, 'File audio rỗng', 400);
  }

  try {
    const mimeType = req.file.mimetype || 'audio/mp4';
    const result = await transcribeWithWhisper(buffer, mimeType, originalname);

    if (!result.text) {
      return error(res, 'Không nhận diện được giọng nói, vui lòng thử lại.', 422);
    }

    return success(res, { text: result.text });
  } catch (err: any) {
    const errorMessage = err.message || 'Unknown error';
    const errorStatus = err?.status ?? err?.response?.status ?? 500;
    const errorBody = err?.response?.data ?? err?.error ?? err?.body ?? null;

    console.error(`[Voice STT Error] status=${errorStatus} message=${errorMessage}`);
    if (errorBody) console.error('[Voice STT Error Body]:', JSON.stringify(errorBody, null, 2));

    return error(res, `Lỗi chuyển đổi giọng nói (Mã lỗi: ${errorStatus}). Vui lòng thử lại sau.`);
  }
}
