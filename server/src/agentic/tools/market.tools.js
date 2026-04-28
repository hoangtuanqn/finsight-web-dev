import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { fetchFearGreedIndex, fetchCryptoPrices, fetchGoldPrice } from "../../services/market.service.js";

/**
 * CÔNG CỤ: Lấy Chỉ Số Tâm Lý Thị Trường (getMarketSentimentTool)
 * - Mục đích: Trả về chỉ số Fear & Greed (Sợ hãi và Tham lam) thực tế từ Alternative.me API.
 * - Tận dụng Redis cache (TTL 30 phút) sẵn có trong market.service.js.
 * - Khi nào dùng: Khi người dùng hỏi "Thị trường hiện tại thế nào?" hoặc "Có nên mua vào lúc này không?".
 */
export const getMarketSentimentTool = tool(
  async () => {
    try {
      const data = await fetchFearGreedIndex();
      return JSON.stringify({
        value: data.value,
        label: data.label,
        labelVi: data.labelVi || null,
        previousValue: data.previousValue || null,
        trend: data.trend || null,
      });
    } catch (error) {
      console.error("getMarketSentimentTool error:", error.message);
      return JSON.stringify({
        value: 50,
        label: "Neutral",
        error: "Không thể lấy dữ liệu tâm lý thị trường lúc này. Vui lòng thử lại sau.",
      });
    }
  },
  {
    name: "get_market_sentiment",
    description: "Sử dụng khi cần kiểm tra tâm lý thị trường chung (Fear & Greed Index). Trả về con số 0-100 và nhãn trạng thái.",
    schema: z.object({}),
  }
);

/**
 * CÔNG CỤ: Lấy Giá Thị Trường (getMarketPricesTool)
 * - Mục đích: Cung cấp giá cập nhật thực tế cho Vàng SJC và Crypto (BTC, ETH).
 * - Tận dụng Redis cache sẵn có: crypto TTL 10 phút, gold TTL 60 phút.
 * - Khi nào dùng: Khi người dùng hỏi giá trực tiếp (VD: "Giá vàng hôm nay bao nhiêu?").
 */
export const getMarketPricesTool = tool(
  async () => {
    try {
      // Gọi song song cả 2 API để giảm thời gian chờ
      const [crypto, gold] = await Promise.all([
        fetchCryptoPrices(),
        fetchGoldPrice(),
      ]);

      return JSON.stringify({
        prices: {
          "BTC/USD": crypto.bitcoin?.price
            ? `$${crypto.bitcoin.price.toLocaleString('en-US')}`
            : "N/A",
          "BTC 24h change": crypto.bitcoin?.change24h
            ? `${crypto.bitcoin.change24h.toFixed(2)}%`
            : "N/A",
          "ETH/USD": crypto.ethereum?.price
            ? `$${crypto.ethereum.price.toLocaleString('en-US')}`
            : "N/A",
          "ETH 24h change": crypto.ethereum?.change24h
            ? `${crypto.ethereum.change24h.toFixed(2)}%`
            : "N/A",
          "Gold SJC (mua)": gold.buy
            ? `${gold.buy.toLocaleString('vi-VN')} ${gold.unit}`
            : "N/A",
          "Gold SJC (bán)": gold.sell
            ? `${gold.sell.toLocaleString('vi-VN')} ${gold.unit}`
            : "N/A",
        },
        source: "CoinGecko, SJC/BTMC",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("getMarketPricesTool error:", error.message);
      return JSON.stringify({
        error: "Không thể lấy giá thị trường lúc này. Vui lòng thử lại sau.",
      });
    }
  },
  {
    name: "get_market_prices",
    description: "Lấy giá cập nhật thực tế của Vàng SJC, Bitcoin và Ethereum hiện tại trên thị trường.",
    schema: z.object({}),
  }
);
