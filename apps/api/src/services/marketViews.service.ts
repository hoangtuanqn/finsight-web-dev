import { fetchNews } from './market.service.js';

export interface MarketView {
  id: string;
  assets: string[];
  weights: number[];
  expectedReturn: number;
  confidence: number;
  description: string;
}

export async function generateMarketViews(sentimentValue: number, newsApiKey?: string): Promise<MarketView[]> {
  const views: MarketView[] = [];

  // 1. Sentiment-based Views
  if (sentimentValue >= 75) {
    views.push({
      id: 'sentiment_extreme_greed',
      assets: ['crypto', 'stocks_us'],
      weights: [1, 0], // Crypto absolute view (not relative)
      expectedReturn: 0.15, // Expect crypto to grow 15%
      confidence: 0.6,
      description: 'Thị trường hưng phấn tột độ, dòng tiền rủi ro cao đổ mạnh vào Crypto.',
    });
    views.push({
      id: 'sentiment_extreme_greed_stocks',
      assets: ['stocks', 'bonds'],
      weights: [1, -1], // Stocks outperform bonds
      expectedReturn: 0.05,
      confidence: 0.7,
      description: 'Khẩu vị rủi ro tăng cao, Cổ phiếu được kỳ vọng vượt trội hơn Trái phiếu.',
    });
  } else if (sentimentValue >= 60) {
    views.push({
      id: 'sentiment_greed_stocks',
      assets: ['stocks_us', 'gold'],
      weights: [1, -1],
      expectedReturn: 0.03,
      confidence: 0.65,
      description: 'Tâm lý thị trường lạc quan, Cổ phiếu Mỹ được đánh giá cao hơn Vàng.',
    });
  } else if (sentimentValue <= 20) {
    views.push({
      id: 'sentiment_extreme_fear',
      assets: ['gold', 'stocks'],
      weights: [1, -1],
      expectedReturn: 0.06,
      confidence: 0.8,
      description: 'Thị trường hoảng loạn, Vàng là hầm trú ẩn an toàn tuyệt đối so với Cổ phiếu.',
    });
    views.push({
      id: 'sentiment_extreme_fear_cash',
      assets: ['savings', 'crypto'],
      weights: [1, -1],
      expectedReturn: 0.1,
      confidence: 0.85,
      description: 'Tâm lý sợ hãi bao trùm, ưu tiên nắm giữ Tiền mặt/Tiết kiệm thay vì Crypto.',
    });
  } else if (sentimentValue <= 40) {
    views.push({
      id: 'sentiment_fear',
      assets: ['bonds', 'stocks'],
      weights: [1, -1],
      expectedReturn: 0.03,
      confidence: 0.7,
      description: 'Thị trường e ngại rủi ro, dòng tiền có xu hướng chuyển từ Cổ phiếu sang Trái phiếu.',
    });
  }

  // 2. Macro/News-based Views
  try {
    const newsData = await fetchNews(newsApiKey);
    if (newsData.articles && newsData.articles.length > 0) {
      let inflationCount = 0;
      let recessionCount = 0;

      for (const article of newsData.articles) {
        const text = (article.title + ' ' + article.description).toLowerCase();
        if (text.includes('lạm phát') || text.includes('inflation')) inflationCount++;
        if (text.includes('suy thoái') || text.includes('recession')) recessionCount++;
      }

      if (inflationCount >= 2) {
        views.push({
          id: 'macro_inflation',
          assets: ['gold', 'savings'],
          weights: [1, -1],
          expectedReturn: 0.04,
          confidence: 0.75,
          description: 'Rủi ro lạm phát gia tăng (dựa trên tin tức vĩ mô), Vàng sẽ bảo vệ sức mua tốt hơn Tiết kiệm.',
        });
      }

      if (recessionCount >= 2) {
        views.push({
          id: 'macro_recession',
          assets: ['bonds', 'stocks'],
          weights: [1, -1],
          expectedReturn: 0.05,
          confidence: 0.7,
          description: 'Lo ngại suy thoái kinh tế, Trái phiếu là lựa chọn phòng thủ tối ưu trước Cổ phiếu.',
        });
      }
    }
  } catch (error) {
    console.warn('[MarketViews] Failed to fetch or parse news for macro views', error);
  }

  return views;
}
