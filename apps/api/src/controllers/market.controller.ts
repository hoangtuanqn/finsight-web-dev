import { Request, Response } from 'express';
import { fetchCryptoPrices, fetchFearGreedIndex, fetchGoldPrice, fetchNews } from '../services/market.service';
import { error, success } from '../utils/apiResponse';

export async function getSentiment(req: Request, res: Response) {
  try {
    const fearGreed = await fetchFearGreedIndex();
    return success(res, { fearGreed });
  } catch (err) {
    console.error('getSentiment error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getPrices(req: Request, res: Response) {
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

export async function getNews(req: Request, res: Response) {
  try {
    const result = await fetchNews(process.env.NEWS_API_KEY);
    return success(res, result);
  } catch (err) {
    console.error('getNews error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getCryptoPricesHandler(req: Request, res: Response) {
  try {
    const crypto = await fetchCryptoPrices();
    return success(res, { bitcoin: crypto.bitcoin, ethereum: crypto.ethereum });
  } catch (err) {
    console.error('getCryptoPrices error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getGoldPriceHandler(req: Request, res: Response) {
  try {
    const gold = await fetchGoldPrice();
    return success(res, { gold });
  } catch (err) {
    console.error('getGoldPrice error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getMarketSummary(req: Request, res: Response) {
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
      news: news.articles?.slice(0, 15) || [],
    });
  } catch (err) {
    console.error('getMarketSummary error:', err);
    return error(res, 'Internal server error');
  }
}
