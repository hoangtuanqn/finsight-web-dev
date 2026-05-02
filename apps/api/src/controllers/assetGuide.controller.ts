import { Request, Response } from 'express';
import { getBondsRatesData } from '../services/assetGuide/bonds.service';
import {
  BLACKLIST_IDS,
  buildCoinCard,
  getCryptoCache,
  getCryptoPricesData,
  scoreCoin,
  STABLECOIN_IDS,
} from '../services/assetGuide/crypto.service';
import { getGoldCache, getGoldPricesData } from '../services/assetGuide/gold.service';
import { getSavingsRatesData } from '../services/assetGuide/savings.service';
import {
  buildStockCard,
  getStockCacheForFallback,
  getStockPricesData,
  scoreStock,
  STOCK_UNIVERSE,
} from '../services/assetGuide/stocks.service';
import {
  buildUsStockCard,
  getStocksUsPricesData,
  getUsStockCacheForFallback,
  scoreUsStock,
  US_STOCK_UNIVERSE,
} from '../services/assetGuide/stocks_us.service';
import { error, success } from '../utils/apiResponse';

// ─── Bonds ───────────────────────────────────────────────────────

export async function getBondsRates(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const data = await getBondsRatesData(riskLevel);
    return success(res, data);
  } catch (err: any) {
    console.error('getBondsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu trái phiếu');
  }
}

// ─── Savings ─────────────────────────────────────────────────────

export async function getSavingsRates(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const data = getSavingsRatesData(riskLevel);
    return success(res, data);
  } catch (err: any) {
    console.error('getSavingsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu tiết kiệm');
  }
}

// ─── Gold ────────────────────────────────────────────────────────

export async function getGoldPrices(req: Request, res: Response) {
  try {
    const data = await getGoldPricesData();
    return success(res, data);
  } catch (err: any) {
    console.error('getGoldPrices error:', err.message);
    const cache = getGoldCache();
    if (cache.data) {
      return success(res, { ...cache.data, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá vàng lúc này');
  }
}

// ─── Stocks VN ───────────────────────────────────────────────────

export async function getStockPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const data = await getStockPricesData(riskLevel);
    return success(res, data);
  } catch (err: any) {
    console.error('getStockPrices error:', err.message);
    const cache = getStockCacheForFallback();
    if (cache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const scored = STOCK_UNIVERSE.filter((m) => cache.data![m.ticker])
        .map((m) => ({ meta: m, quote: cache.data![m.ticker], score: scoreStock(cache.data![m.ticker], m, rl) }))
        .sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));
      return success(res, { stocks: top5, intro: '', riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy dữ liệu chứng khoán lúc này');
  }
}

// ─── Stocks US ───────────────────────────────────────────────────

export async function getStocksUsPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const data = await getStocksUsPricesData(riskLevel);
    return success(res, data);
  } catch (err: any) {
    console.error('getStocksUsPrices error:', err.message);
    const cache = getUsStockCacheForFallback();
    if (cache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const scored = US_STOCK_UNIVERSE.filter((m) => cache.data![m.ticker])
        .map((m) => ({ meta: m, quote: cache.data![m.ticker], score: scoreUsStock(cache.data![m.ticker], m, rl) }))
        .sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5).map((s, i) => buildUsStockCard(s.quote, s.meta, i));
      return success(res, { stocks: top5, intro: '', riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy dữ liệu chứng khoán Mỹ lúc này');
  }
}

// ─── Crypto ──────────────────────────────────────────────────────

export async function getCryptoPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const data = await getCryptoPricesData(riskLevel);
    return success(res, data);
  } catch (err: any) {
    console.error('getCryptoPrices error:', err.message);
    const cache = getCryptoCache();
    if (cache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const filtered = cache.data.filter(
        (c: any) => !STABLECOIN_IDS.has(c.id) && !BLACKLIST_IDS.has(c.id) && !/usd|dollar/i.test(c.name),
      );
      const top5 = filtered
        .map((c: any) => ({ coin: c, score: scoreCoin(c, rl) }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5)
        .map((s: any, i: number) => buildCoinCard(s.coin, i));
      return success(res, { coins: top5, riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá crypto lúc này');
  }
}
