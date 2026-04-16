import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const getMarketSentimentTool = tool(
  async () => {
    // Giả lập API lấy Fear & Greed Index
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

export const getMarketPricesTool = tool(
  async () => {
    // Giả lập lấy giá thị trường
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
