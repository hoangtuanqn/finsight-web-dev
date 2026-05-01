import Tesseract from 'tesseract.js';

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.85;

/**
 * Resize image to fit within MAX_DIMENSION while preserving aspect ratio.
 * Pre-resizing is more efficient than letting Tesseract's internal scaler handle it,
 * and reduces WASM memory pressure during recognition.
 */
function resizeImage(base64DataUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));

      if (scale === 1) {
        resolve(base64DataUri);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error('Failed to load image for resize'));
    img.src = base64DataUri;
  });
}

let sharedWorker: any = null;

async function getWorker(onProgress?: (progress: number) => void) {
  if (sharedWorker) return sharedWorker;

  sharedWorker = await Tesseract.createWorker('vie+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  return sharedWorker;
}

/**
 * Run OCR directly in the browser via Web Workers
 * @param {string} base64Image - The image to process (Base64 data URI)
 * @param {Function} onProgress - Callback for OCR progress (0-100)
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
export async function runOCR(
  base64Image: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const worker = await getWorker(onProgress);
    const resizedImage = await resizeImage(
      base64Image.includes('base64,') ? base64Image : `data:image/jpeg;base64,${base64Image}`,
    );
    const result = await worker.recognize(resizedImage);
    const text = result.data.text?.trim() || '';

    if (!text || text.length < 5) {
      return { success: false, error: 'Không thể đọc chữ từ ảnh. Vui lòng chụp rõ hơn.' };
    }

    return { success: true, text };
  } catch (err) {
    console.error('[OCR Error]', err);
    return { success: false, error: 'Lỗi trong quá trình quét ảnh. Vui lòng thử lại.' };
  }
}
