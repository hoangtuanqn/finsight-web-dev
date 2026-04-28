import { success, error } from '../utils/apiResponse.js';
import { fetchFearGreedIndex, fetchCryptoPrices, fetchNews, fetchGoldPrice } from '../services/market.service.js';

export async function getSentiment(req, res) {
  try {
    const fearGreed = await fetchFearGreedIndex();
    return success(res, { fearGreed });
  } catch (err) {
    console.error('getSentiment error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getPrices(req, res) {
  try {
    const crypto = await fetchCryptoPrices();
    const gold = await fetchGoldPrice();
    return success(res, {
      bitcoin: crypto.bitcoin,
      ethereum: crypto.ethereum,
      gold,
    });
  } catch (err) {
    console.error('getPrices error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getNews(req, res) {
  try {
    const result = await fetchNews(process.env.NEWS_API_KEY);
    return success(res, result);
  } catch (err) {
    console.error('getNews error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getMarketSummary(req, res) {
  try {
    const [fearGreed, crypto, gold, news] = await Promise.all([
      fetchFearGreedIndex(),
      fetchCryptoPrices(),
      fetchGoldPrice(),
      fetchNews(process.env.NEWS_API_KEY),
    ]);

    return success(res, {
      sentiment: fearGreed,
      prices: { bitcoin: crypto.bitcoin, ethereum: crypto.ethereum, gold },
      news: news.articles?.slice(0, 6) || [],
    });
  } catch (err) {
    console.error('getMarketSummary error:', err);
    return error(res, 'Internal server error');
  }
}
