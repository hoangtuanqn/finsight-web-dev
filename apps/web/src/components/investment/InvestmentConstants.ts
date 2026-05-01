import {
  Building2,
  TrendingUp,
  FileText,
  Zap,
  Trophy,
} from 'lucide-react';

export const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#f97316'];

export const ASSET_LABELS = {
  savings: 'Tiết kiệm',
  gold: 'Vàng',
  stocks: 'Cổ phiếu VN',
  bonds: 'Trái phiếu',
  crypto: 'Crypto'
};

export const ASSET_ICONS = {
  savings: Building2,
  gold: Trophy,
  stocks: TrendingUp,
  bonds: FileText,
  crypto: Zap
};

export const ASSET_NATURE = {
  savings: 'phòng thủ',
  gold: 'phòng thủ',
  stocks: 'tăng trưởng',
  bonds: 'thu nhập',
  crypto: 'đầu cơ'
};

export const TOOLTIP_STYLE = {
  background: "#0F172A",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "4px",
  fontSize: "12px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export const INVESTMENT_SUGGESTIONS = {
  savings: {
    label: "Tiết kiệm",
    icon: Building2,
    color: "#3b82f6",
    intro:
      "Chọn ngân hàng có lãi suất kỳ hạn cao nhất phù hợp với kỳ hạn đầu tư của bạn.",
    items: [
      {
        name: "ACB",
        tag: "12 tháng",
        rate: "5.5%/năm",
        note: "Lãi suất ổn định, uy tín cao",
        badge: "Phổ biến",
        badgeColor: "blue",
      },
      {
        name: "Techcombank",
        tag: "6 tháng",
        rate: "5.2%/năm",
        note: "Online banking tiện lợi, rút linh hoạt",
        badge: "",
        badgeColor: "",
      },
      {
        name: "VPBank",
        tag: "12 tháng",
        rate: "5.8%/năm",
        note: "Lãi suất cạnh tranh, nhiều ưu đãi",
        badge: "Lãi cao",
        badgeColor: "emerald",
      },
      {
        name: "MSB",
        tag: "13 tháng",
        rate: "6.0%/năm",
        note: "Kỳ hạn linh hoạt, lãi suất hấp dẫn",
        badge: "Lãi cao",
        badgeColor: "emerald",
      },
      {
        name: "HDBank",
        tag: "12 tháng",
        rate: "5.7%/năm",
        note: "Tốt cho gửi trực tuyến, phí thấp",
        badge: "",
        badgeColor: "",
      },
    ],
    tips: [
      "Gửi online thường có lãi suất cao hơn quầy 0.1-0.3%",
      "Kỳ hạn 12-13 tháng thường cho lãi tốt nhất",
      "Chia nhỏ nhiều kỳ để có thanh khoản tốt hơn",
    ],
  },
  gold: {
    label: "Vàng",
    icon: Trophy,
    color: "#f59e0b",
    intro:
      "Vàng là tài sản phòng thủ tốt trong biến động. Ưu tiên vàng miếng SJC hoặc vàng nhẫn 24K.",
    items: [
      {
        name: "Vàng miếng SJC",
        tag: "Thanh khoản cao",
        rate: "~95-98 tr/lượng",
        note: "Chuẩn quốc gia, thanh khoản cao nhất, dễ mua bán",
        badge: "Khuyên dùng",
        badgeColor: "amber",
      },
      {
        name: "Vàng nhẫn 24K PNJ",
        tag: "Nhỏ lẻ",
        rate: "~88-92 tr/lượng",
        note: "Dễ mua nhỏ lẻ, phí thấp, phù hợp tích lũy dần",
        badge: "Linh hoạt",
        badgeColor: "blue",
      },
      {
        name: "Vàng nhẫn DOJI",
        tag: "Phổ biến",
        rate: "~88-92 tr/lượng",
        note: "Hệ thống rộng, kiểm định rõ ràng",
        badge: "",
        badgeColor: "",
      },
      {
        name: "Chứng chỉ vàng BIDV",
        tag: "Không giữ vật lý",
        rate: "Theo giá SJC",
        note: "Mua bán qua app, không cần cất giữ vật lý",
        badge: "Tiện lợi",
        badgeColor: "purple",
      },
    ],
    tips: [
      "Mua tại đại lý ủy quyền của SJC để tránh hàng giả",
      "Chênh lệch mua/bán SJC thường 1-2 triệu/lượng - cần giữ dài hạn",
      "Vàng nhẫn phù hợp tích lũy nhỏ, vàng miếng cho vốn lớn",
    ],
  },
  stocks: {
    label: "Chứng khoán",
    icon: TrendingUp,
    color: "#10b981",
    intro:
      "Đầu tư cổ phiếu VN-Index - ưu tiên cổ phiếu bluechip và ETF để giảm rủi ro cá biệt.",
    items: [
      {
        name: "VNM (Vinamilk)",
        tag: "Tiêu dùng",
        rate: "Cổ tức ~5%/năm",
        note: "Cổ phiếu phòng thủ, cổ tức đều, ít biến động",
        badge: "An toàn",
        badgeColor: "blue",
      },
      {
        name: "FPT Corporation",
        tag: "Công nghệ",
        rate: "Tăng trưởng 20%+",
        note: "Dẫn đầu công nghệ VN, mảng offshore tăng mạnh",
        badge: "Tăng trưởng",
        badgeColor: "emerald",
      },
      {
        name: "VCB (Vietcombank)",
        tag: "Ngân hàng",
        rate: "ROE ~20%",
        note: "Ngân hàng lớn nhất, tỷ lệ nợ xấu thấp, ổn định",
        badge: "Bluechip",
        badgeColor: "amber",
      },
      {
        name: "E1VFVN30 (ETF)",
        tag: "ETF",
        rate: "Theo VN30",
        note: "Đầu tư thụ động, phân tán rủi ro tự động, phí thấp",
        badge: "Khuyên dùng",
        badgeColor: "amber",
      },
      {
        name: "HPG (Hòa Phát)",
        tag: "Thép/BĐS",
        rate: "P/E thấp ~8x",
        note: "Doanh nghiệp lớn nhất ngành thép, biên lợi nhuận tốt",
        badge: "",
        badgeColor: "",
      },
    ],
    tips: [
      "Không bỏ hết vào 1 mã - đa dạng ít nhất 5-7 cổ phiếu",
      "ETF là lựa chọn tốt nhất cho người mới bắt đầu",
      "DCA (mua đều hàng tháng) giúp giảm rủi ro giá bình quân",
    ],
  },
  bonds: {
    label: "Trái phiếu",
    icon: FileText,
    color: "#8b5cf6",
    intro:
      "Trái phiếu cho thu nhập cố định ổn định. Ưu tiên trái phiếu chính phủ hoặc ngân hàng lớn.",
    items: [
      {
        name: "Trái phiếu Chính phủ",
        tag: "An toàn nhất",
        rate: "3.8-4.2%/năm",
        note: "Yield đấu thầu VBMA/HNX 2025. Rủi ro gần bằng 0, lãi suất cố định, kỳ hạn 5-15 năm",
        badge: "Khuyên dùng",
        badgeColor: "purple",
      },
      {
        name: "TP Ngân hàng thương mại",
        tag: "Ngân hàng lớn",
        rate: "4.5-5.5%/năm",
        note: "An toàn cao, thanh khoản tốt, phát hành định kỳ tại VCB, BIDV, Techcombank",
        badge: "Ổn định",
        badgeColor: "blue",
      },
      {
        name: "Quỹ trái phiếu (VCBF-FIF, SSIBF)",
        tag: "Quỹ mở",
        rate: "~5-6%/năm",
        note: "Quản lý chuyên nghiệp, đa dạng nhiều loại TP, đầu tư từ 1 triệu qua app",
        badge: "Tiện lợi",
        badgeColor: "blue",
      },
    ],
    tips: [
      "TPCP VN 10Y yield hiện tại ~4.2%/năm — thấp hơn lãi suất tiết kiệm ngân hàng tư nhân",
      "Tránh trái phiếu doanh nghiệp BĐS lãi suất bất thường cao (>9%/năm)",
      "Kỳ hạn 5-10 năm phù hợp danh mục dài hạn — mua qua TCBS, SSI, MBBank tối thiểu 100k",
    ],
  },
  crypto: {
    label: "Crypto",
    icon: Zap,
    color: "#f97316",
    intro:
      "Crypto có biến động cao - chỉ đầu tư phần vốn chấp nhận mất hoàn toàn. Tập trung vào coin lớn.",
    items: [
      {
        name: "Bitcoin (BTC)",
        tag: "Store of Value",
        rate: "Cap ~$1.3T",
        note: "Coin lớn nhất, ít rủi ro nhất trong crypto, lưu trữ giá trị dài hạn",
        badge: "Khuyên dùng",
        badgeColor: "amber",
      },
      {
        name: "Ethereum (ETH)",
        tag: "Smart Contract",
        rate: "Cap ~$400B",
        note: "Nền tảng DeFi/NFT lớn nhất, nhiều use case thực tế",
        badge: "Tiềm năng",
        badgeColor: "blue",
      },
      {
        name: "BNB",
        tag: "Exchange Token",
        rate: "Cap ~$90B",
        note: "Token Binance, phí giao dịch thấp, ecosystem lớn",
        badge: "",
        badgeColor: "",
      },
      {
        name: "USDC / USDT",
        tag: "Stablecoin",
        rate: "Yield ~5-8%",
        note: "Gửi stablecoin để hưởng lãi, tránh biến động giá",
        badge: "Ít rủi ro",
        badgeColor: "emerald",
      },
    ],
    tips: [],
  },
};
