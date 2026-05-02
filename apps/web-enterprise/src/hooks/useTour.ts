import { useCallback, useState } from 'react';

const TOUR_KEY = 'finsight_tour_completed';

/**
 * Hook quản lý trạng thái tour.
 * - hasSeenTour: true nếu user đã xem và đóng tour
 * - markTourDone: lưu vào localStorage, không hiện lại auto
 * - resetTour: xóa localStorage để hiện lại lần sau
 */
export function useTour() {
  const [hasSeenTour, setHasSeenTour] = useState(() => localStorage.getItem(TOUR_KEY) === 'true');

  const markTourDone = useCallback(() => {
    localStorage.setItem(TOUR_KEY, 'true');
    setHasSeenTour(true);
  }, []);

  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_KEY);
    setHasSeenTour(false);
  }, []);

  return { hasSeenTour, markTourDone, resetTour };
}
