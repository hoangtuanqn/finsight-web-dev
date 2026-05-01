import { extractOcr } from '../api/agentic';

/**
 * Run OCR using the backend agentic service
 * @param {string} base64Image - The image to process (Base64 data URI or raw base64 string)
 * @param {Function} onProgress - Callback for OCR progress (0-100)
 * @returns {Promise<{success: boolean, text?: string, error?: string}>}
 */
export async function runOCR(
  base64Image: string,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    // Fake progress to inform user that processing has started
    if (onProgress) {
      onProgress(20);
    }

    // Extract base64 part if it contains data URI scheme (e.g. data:image/jpeg;base64,...)
    // The backend expects the raw base64 string
    const base64Data = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;

    const result = await extractOcr(base64Data);

    if (onProgress && result.success) {
      onProgress(100);
    }

    if (!result.success || !result.text || result.text.length < 5) {
      return { success: false, error: result.error || 'Không thể đọc chữ từ ảnh. Vui lòng chụp rõ hơn.' };
    }

    return { success: true, text: result.text };
  } catch (err) {
    console.error('[OCR Error]', err);
    return { success: false, error: 'Lỗi trong quá trình phân tích ảnh. Vui lòng thử lại.' };
  }
}
