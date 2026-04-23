import { createContext, useContext, useRef, useCallback, useEffect } from 'react';
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import '../styles/tour.css';
import { useTour } from '../hooks/useTour';

// ─── Tour Steps ───────────────────────────────────────────────────────────────
const STEPS = [
  {
    element: '#tour-sidebar',
    popover: {
      title: '🗺️ Điều hướng chính',
      description:
        'Sidebar này chứa tất cả tính năng của FinSight. Bạn có thể thu gọn nó để có thêm không gian làm việc.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-dashboard',
    popover: {
      title: '📊 Dashboard tổng quan',
      description:
        'Tổng quan tài chính toàn diện: KPI nợ, DTI, cảnh báo rủi ro Domino và biểu đồ xu hướng nợ theo thời gian.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-debts',
    popover: {
      title: '💳 Quản lý khoản nợ',
      description:
        'Xem tất cả khoản nợ, thêm mới, chỉnh sửa và theo dõi tiến trình trả nợ từng khoản một. Nhấn "+ Thêm khoản nợ" để nhập thông tin khoản vay — hệ thống sẽ tự tính EAR (lãi suất thực tế bao gồm phí ẩn).',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-ear',
    popover: {
      title: '📐 Phân tích EAR',
      description:
        'EAR (Effective Annual Rate) là lãi suất THỰC TẾ bạn đang chịu, bao gồm tất cả phí ẩn. Thường cao hơn APR quảng cáo rất nhiều!',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-dti',
    popover: {
      title: '📉 Chỉ số DTI',
      description:
        'Debt-to-Income Ratio đo tỉ lệ thu nhập bị chiếm bởi nợ. DTI < 20% là an toàn, > 50% là nguy hiểm.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-repayment',
    popover: {
      title: '📋 Kế hoạch trả nợ',
      description:
        'So sánh 2 chiến lược: Avalanche (trả lãi cao trước, tiết kiệm tiền nhất) và Snowball (trả nợ nhỏ trước, tạo động lực tâm lý).',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-investment',
    popover: {
      title: '📈 Tư vấn đầu tư AI',
      description:
        'AI phân bổ tài sản dựa trên Fear & Greed Index thị trường và risk profile cá nhân của bạn. Cập nhật theo thời gian thực.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-risk',
    popover: {
      title: '🎯 Đánh giá rủi ro',
      description:
        '10 câu hỏi thông minh xác định khẩu vị rủi ro của bạn (Thấp/Vừa/Cao) để AI phân bổ tài sản chính xác hơn.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-profile',
    popover: {
      title: '👤 Hồ sơ cá nhân',
      description:
        'Cập nhật thu nhập, vốn đầu tư và các thông số tài chính để mở khóa đầy đủ tính năng tư vấn AI.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-upgrade',
    popover: {
      title: '💎 Nâng cấp tài khoản',
      description:
        'Khám phá sức mạnh của AI với các gói Pro và Pro Max. Mở khóa phân bổ đầu tư thông minh, Chatbot không giới hạn và OCR nhận diện hóa đơn.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#tour-header-notif',
    popover: {
      title: '🔔 Thông báo thông minh',
      description:
        'Hệ thống tự động cảnh báo khi DTI vượt ngưỡng an toàn, hoặc phát hiện "Hiệu ứng Domino" — khi một khoản nợ nguy cơ kéo theo các khoản khác.',
      side: 'bottom',
      align: 'end',
    },
  },
  {
    element: '#tour-replay-btn',
    popover: {
      title: '🔄 Xem lại hướng dẫn',
      description:
        'Bất cứ lúc nào muốn xem lại tour này, hãy nhấn vào biểu tượng dấu hỏi ở thanh tiêu đề (Header). Chúc bạn quản lý tài chính thành công! 🎉',
      side: 'bottom',
      align: 'end',
    },
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const TourContext = createContext(null);

export function TourProvider({ children }) {
  const { hasSeenTour, markTourDone } = useTour();
  const driverRef = useRef(null);

  const startTour = useCallback(() => {
    // Check if DOM is ready (at least the sidebar should exist)
    if (!document.querySelector('#tour-sidebar')) {
      console.warn('Tour target #tour-sidebar not found. Retrying...');
      return;
    }

    // Destroy existing instance if any
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driverObj = driver({
      showProgress:    true,
      animate:         true,
      overlayOpacity:  0.55,
      smoothScroll:    true,
      allowClose:      true,
      stagePadding:    10,
      stageRadius:     16,
      showButtons:     ['next', 'previous', 'close'],
      nextBtnText:     'Tiếp theo →',
      prevBtnText:     '← Quay lại',
      doneBtnText:     'Hoàn thành 🎉',
      progressText:    'Bước {{current}} / {{total}}',
      popoverClass:    'finsight-tour-popover',
      // Khi một phần tử được highlight
      onHighlightStarted: () => {
        document.body.classList.add('tour-active');
      },
      // Khi tour kết thúc hoặc bị đóng
      onDestroyed: () => {
        document.body.classList.remove('tour-active');
        markTourDone();
        driverRef.current = null;
      },
      steps: STEPS,
    });

    driverRef.current = driverObj;
    driverObj.drive();
  }, [markTourDone]);

  // Auto-start on first visit with retry logic
  useEffect(() => {
    if (hasSeenTour) return;

    let retryCount = 0;
    const maxRetries = 3;

    const tryStart = () => {
      if (document.querySelector('#tour-sidebar')) {
        startTour();
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryStart, 1000); // Thử lại sau 1s
      }
    };

    const timer = setTimeout(tryStart, 2000); // Lần đầu đợi 2s cho chắc chắn
    return () => clearTimeout(timer);
  }, [hasSeenTour, startTour]);

  return (
    <TourContext.Provider value={{ startTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  return useContext(TourContext);
}
