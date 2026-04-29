import axios from 'axios';
import redis from '../lib/redis';
import { getSentimentLabel, getSentimentVietnamese } from '../utils/calculations';

export interface FearGreedData {
  value: number;
  label: string;
  labelVi: string;
  previousValue: number;
  trend: string;
  updatedAt: string;
  error?: string;
}

export async function fetchFearGreedIndex(): Promise<FearGreedData> {
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

    const result: FearGreedData = {
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

export interface CryptoPrices {
  bitcoin: { price: number; change24h: number; error?: string };
  ethereum: { price: number; change24h: number; error?: string };
}

export async function fetchCryptoPrices(): Promise<CryptoPrices> {
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

    const result: CryptoPrices = {
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

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}

const RSS_FEEDS = [
  { url: 'https://vnexpress.net/rss/kinh-doanh.rss', source: 'VnExpress' },
  { url: 'https://cafef.vn/rss/home.rss', source: 'CafeF' },
  { url: 'https://vneconomy.vn/rss/tai-chinh.rss', source: 'VnEconomy' },
];

function parseRssXml(xml: string, source: string): NewsArticle[] {
  const items: NewsArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };
    const title = get('title');
    const url = get('link') || get('guid');
    const publishedAt = get('pubDate');
    const description = get('description');
    if (title && url) {
      items.push({ title, description, url, publishedAt: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(), source });
    }
  }
  return items;
}

export async function fetchNews(_apiKey?: string): Promise<{ articles: NewsArticle[] }> {
  if (redis) {
    const cached = await redis.get('market:news').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  try {
    const results = await Promise.allSettled(
      RSS_FEEDS.map(feed =>
        axios.get(feed.url, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } })
          .then(res => parseRssXml(res.data, feed.source))
      )
    );

    const articles: NewsArticle[] = results
      .flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    if (articles.length === 0) return { articles: [] };

    const result = { articles };
    if (redis) await redis.setex('market:news', 1800, JSON.stringify(result));
    return result;
  } catch {
    return { articles: [] };
  }
}

export interface GoldPrice {
  buy: number;
  sell: number;
  unit: string;
  source: string;
  updatedAt: string;
  error?: string;
}

export async function fetchGoldPrice(): Promise<GoldPrice> {
  if (redis) {
    const cached = await redis.get('market:gold').catch(() => null);
    if (cached) return JSON.parse(cached);
  }

  try {
    const response = await axios.get(
      'https://btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v',
      { timeout: 5000 }
    );
    const rows = response.data?.DataList?.Data || [];

    let sjcRow: { buy: string; sell: string } | null = null;
    for (let i = 0; i < rows.length; i++) {
      const idx = i + 1;
      const name = rows[i][`@n_${idx}`] || '';
      if (name.includes('VÀNG MIẾNG SJC') || name.includes('SJC')) {
        sjcRow = { buy: rows[i][`@pb_${idx}`], sell: rows[i][`@ps_${idx}`] };
        break;
      }
    }

    const result: GoldPrice = {
      buy: sjcRow?.buy ? parseInt(sjcRow.buy, 10) : 0,
      sell: sjcRow?.sell ? parseInt(sjcRow.sell, 10) : 0,
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
