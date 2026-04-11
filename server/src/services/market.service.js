import axios from 'axios';
import redis from '../lib/redis.js';
import { getSentimentLabel, getSentimentVietnamese } from '../utils/calculations.js';

export async function fetchFearGreedIndex() {
  if (redis) {
    const cached = await redis.get('market:fear_greed').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  try {
    const response = await axios.get('https://api.alternative.me/fng/?limit=2', { timeout: 5000 });
    const data = response.data;
    const current = data.data[0];
    const previous = data.data[1];
    const trend = parseInt(current.value) > parseInt(previous.value) ? 'UP' : 'DOWN';

    const result = {
      value: parseInt(current.value),
      label: current.value_classification,
      labelVi: getSentimentVietnamese(getSentimentLabel(parseInt(current.value))),
      previousValue: parseInt(previous.value),
      trend,
      updatedAt: new Date().toISOString(),
    };

    if (redis) await redis.setex('market:fear_greed', 1800, JSON.stringify(result));
    return result;
  } catch {
    return { value: 50, label: 'Neutral', labelVi: 'Trung lập', previousValue: 50, trend: 'STABLE', updatedAt: new Date().toISOString(), error: 'API unavailable' };
  }
}

export async function fetchCryptoPrices() {
  if (redis) {
    const cached = await redis.get('market:prices:crypto').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true',
      { timeout: 5000 }
    );
    const data = response.data;

    const result = {
      bitcoin: { price: data.bitcoin.usd, change24h: data.bitcoin.usd_24h_change },
      ethereum: { price: data.ethereum.usd, change24h: data.ethereum.usd_24h_change },
    };

    if (redis) await redis.setex('market:prices:crypto', 600, JSON.stringify(result));
    return result;
  } catch {
    return {
      bitcoin: { price: 0, change24h: 0, error: 'API unavailable' },
      ethereum: { price: 0, change24h: 0, error: 'API unavailable' },
    };
  }
}

export async function fetchNews(apiKey) {
  if (redis) {
    const cached = await redis.get('market:news').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  if (!apiKey || apiKey === 'your_key_here') {
    return { articles: [
      { title: 'Tin tức tài chính sẽ hiển thị khi bạn cấu hình NEWS_API_KEY', description: 'Vui lòng đăng ký tại newsapi.org', url: 'https://newsapi.org', publishedAt: new Date().toISOString(), source: 'System' },
    ]};
  }

  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=kinh+tế+tài+chính&language=vi&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}`,
      { timeout: 5000 }
    );

    const articles = response.data.articles.map(a => ({
      title: a.title,
      description: a.description,
      url: a.url,
      publishedAt: a.publishedAt,
      source: a.source?.name || 'Unknown',
    }));

    const result = { articles };
    if (redis) await redis.setex('market:news', 1800, JSON.stringify(result));
    return result;
  } catch {
    return { articles: [] };
  }
}

export async function fetchGoldPrice() {
  if (redis) {
    const cached = await redis.get('market:gold').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  try {
    const response = await axios.get('https://sjc.com.vn/xml/tygiavang.xml', { timeout: 5000, responseType: 'text' });
    const xml = response.data;
    // Simple XML parse for SJC gold price
    const buyMatch = xml.match(/<buy>([^<]+)<\/buy>/);
    const sellMatch = xml.match(/<sell>([^<]+)<\/sell>/);

    const result = {
      buy: buyMatch ? parseFloat(buyMatch[1].replace(/,/g, '')) : 0,
      sell: sellMatch ? parseFloat(sellMatch[1].replace(/,/g, '')) : 0,
      unit: 'VND/chỉ',
      source: 'SJC',
      updatedAt: new Date().toISOString(),
    };

    if (redis) await redis.setex('market:gold', 3600, JSON.stringify(result));
    return result;
  } catch {
    return { buy: 0, sell: 0, unit: 'VND/chỉ', source: 'SJC', updatedAt: new Date().toISOString(), error: 'Scrape unavailable' };
  }
}
