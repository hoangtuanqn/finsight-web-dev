const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Uploads an audio Blob to the backend STT endpoint.
 * Returns the transcribed text.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE}/api/agentic/voice`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
    signal: AbortSignal.timeout(30_000), // 30s timeout
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error((data as any)?.error || `STT request failed (${response.status})`);
  }

  const data = await response.json();
  return (data.data?.text as string) ?? '';
}
