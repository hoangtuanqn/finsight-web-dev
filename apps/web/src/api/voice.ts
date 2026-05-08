const API_URL = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('finsight_token');
}

/**
 * Uploads an audio Blob to the backend STT endpoint.
 * Returns the transcribed text.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const response = await fetch(`${API_URL}/voice/transcribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
    signal: AbortSignal.timeout(30_000), // 30s timeout
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.error || `Lỗi STT (${response.status})`);
  }

  const data = await response.json();
  return (data.data?.text as string) ?? '';
}
