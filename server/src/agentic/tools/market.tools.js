import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * CÔNG CỤ: Lấy Chỉ Số Tâm Lý Thị Trường (getMarketSentimentTool)
 * - Mục đích: Trả về chỉ số Fear & Greed (Sợ hãi và Tham lam) để giúp AI nhận định xu hướng thị trường.
 * - Khi nào dùng: Khi người dùng hỏi "Thị trường hiện tại thế nào?" hoặc "Có nên mua vào lúc này không?".
 */
export const getMarketSentimentTool = tool(
  async () => {
    // Giả lập API lấy Fear & Greed Index (Thực tế sẽ gọi từ crypto-data-api)
    const mockFearGreed = Math.floor(Math.random() * 100);
    let label = "NEUTRAL";
    if (mockFearGreed < 25) label = "EXTREME FEAR";
    else if (mockFearGreed < 45) label = "FEAR";
    else if (mockFearGreed > 75) label = "EXTREME GREED";
    else if (mockFearGreed > 55) label = "GREED";

    return JSON.stringify({ value: mockFearGreed, label });
  },
  {
    name: "get_market_sentiment",
    description: "Sử dụng khi cần kiểm tra tâm lý thị trường chung (Fear & Greed Index). Trả về con số 0-100 và nhãn trạng thái.",
    schema: z.object({}),
  }
);

/**
 * CÔNG CỤ: Lấy Giá Thị Trường (getMarketPricesTool)
 * - Mục đích: Cung cấp giá cập nhật cho các tài sản phổ biến như Vàng và Crypto.
 * - Khi nào dùng: Khi người dùng hỏi giá trực tiếp (VD: "Giá vàng hôm nay bao nhiêu?").
 */
export const getMarketPricesTool = tool(
  async () => {
    // Giả lập lấy giá thị trường (Thực tế sẽ gọi từ CoinGecko hoặc SJC API)
    return JSON.stringify({
      prices: {
        "BTC/USD": 65400,
        "ETH/USD": 3500,
        "Gold SJC": "85,000,000 VND/lượng",
      },
      timestamp: new Date().toISOString()
    });
  },
  {
    name: "get_market_prices",
    description: "Lấy giá cập nhật của Vàng SJC, Bitcoin và Ethereum hiện tại trên thị trường.",
    schema: z.object({}),
  }
);
