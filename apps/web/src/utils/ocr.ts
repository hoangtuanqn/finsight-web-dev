import Tesseract from 'tesseract.js';

let sharedWorker: any = null;

async function getWorker(onProgress?: (progress: number) => void) {
  if (sharedWorker) return sharedWorker;
  
  sharedWorker = await Tesseract.createWorker('vie+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    }
  });

  return sharedWorker;
}

/**
 * Run OCR directly in the browser via Web Workers
 * @param {string} base64Image - The image to process (Base64 data URI)
 * @param {Function} onProgress - Callback for OCR progress (0-100)
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
export async function runOCR(base64Image: string, onProgress?: (progress: number) => void): Promise<{success: boolean, text?: string, error?: string}> {
  try {
    const worker = await getWorker(onProgress);
    const result = await worker.recognize(base64Image);
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
