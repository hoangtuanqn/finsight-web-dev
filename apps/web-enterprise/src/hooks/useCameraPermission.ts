import { useCallback, useState } from 'react';

export type CameraPermissionState = 'idle' | 'checking' | 'granted' | 'denied' | 'unavailable';

export function useCameraPermission() {
  const [state, setState] = useState<CameraPermissionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setState('checking');
    setErrorMessage('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setState('unavailable');
      setErrorMessage('Thiết bị của bạn không có camera hoặc trình duyệt không hỗ trợ.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // Release stream immediately — just checking permission
      stream.getTracks().forEach((t) => t.stop());
      setState('granted');
      return true;
    } catch (err: any) {
      if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setState('unavailable');
        setErrorMessage('Không tìm thấy camera trên thiết bị này.');
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setState('denied');
        setErrorMessage('Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.');
      } else {
        setState('denied');
        setErrorMessage('Không thể truy cập camera: ' + (err?.message || 'Lỗi không xác định.'));
      }
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setErrorMessage('');
  }, []);

  return { state, errorMessage, requestPermission, reset };
}
