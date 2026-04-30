export interface StockMeta {
  ticker: string;
  name: string;
  sector: string;
  tag: string;
}

export interface StockCard {
  ticker: string;
  historyTicker: string;
  name: string;
  sector: string;
  tag: string;
  price: number;
  change24h: number;
  high52w: number;
  low52w: number;
  posIn52w: number;
  note: string;
  badge: string;
  badgeColor: string;
  rate: string;
}

export interface StocksServiceResult {
  stocks: StockCard[];
  intro: string;
  riskLevel: string;
  cached: boolean;
}

export const STOCK_UNIVERSE: StockMeta[] = [
  { ticker: 'VCB.VN',       name: 'Vietcombank',          sector: 'Ngân hàng',    tag: 'VN30 · Bluechip'        },
  { ticker: 'BID.VN',       name: 'BIDV',                  sector: 'Ngân hàng',    tag: 'VN30 · Bluechip'        },
  { ticker: 'CTG.VN',       name: 'VietinBank',            sector: 'Ngân hàng',    tag: 'VN30 · Bluechip'        },
  { ticker: 'TCB.VN',       name: 'Techcombank',           sector: 'Ngân hàng',    tag: 'VN30 · Tăng trưởng'    },
  { ticker: 'MBB.VN',       name: 'MBBank',                sector: 'Ngân hàng',    tag: 'VN30 · Tăng trưởng'    },
  { ticker: 'FPT.VN',       name: 'FPT Corporation',       sector: 'Công nghệ',    tag: 'VN30 · Tech leader'     },
  { ticker: 'VNM.VN',       name: 'Vinamilk',              sector: 'Tiêu dùng',    tag: 'VN30 · Phòng thủ'      },
  { ticker: 'MSN.VN',       name: 'Masan Group',           sector: 'Tiêu dùng',    tag: 'VN30 · Đa ngành'       },
  { ticker: 'MWG.VN',       name: 'Mobile World (MWG)',    sector: 'Bán lẻ',       tag: 'VN30 · Bán lẻ'         },
  { ticker: 'HPG.VN',       name: 'Hòa Phát Group',        sector: 'Thép',         tag: 'VN30 · Chu kỳ'         },
  { ticker: 'VHM.VN',       name: 'Vinhomes',              sector: 'Bất động sản', tag: 'VN30 · BĐS lớn'        },
  { ticker: 'VIC.VN',       name: 'Vingroup',              sector: 'Đa ngành',     tag: 'VN30 · Tập đoàn'       },
  { ticker: 'E1VFVN30.VN',  name: 'ETF E1VFVN30',         sector: 'ETF',          tag: 'Passive · Theo VN30'    },
  { ticker: 'FUEVFVND.VN',  name: 'ETF DCVFMVN Diamond',  sector: 'ETF',          tag: 'Passive · Diamond'      },
  { ticker: 'ACB.VN',       name: 'ACB Bank',              sector: 'Ngân hàng',    tag: 'Mid-cap · Tăng trưởng' },
  { ticker: 'REE.VN',       name: 'REE Corporation',       sector: 'Hạ tầng',      tag: 'Mid-cap · Cổ tức tốt'  },
  { ticker: 'PNJ.VN',       name: 'PNJ',                   sector: 'Trang sức',    tag: 'Mid-cap · Bán lẻ'      },
  { ticker: 'DGC.VN',       name: 'Đức Giang Chemicals',   sector: 'Hóa chất',     tag: 'Mid-cap · Xuất khẩu'   },
];

let stockCache: { data: Record<string, any> | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

// TTL động: trong phiên HOSE (9:00–15:00, T2–T6, UTC+7) → 3 phút; ngoài phiên → đến 9:00 sáng tiếp theo
function getStockCacheTTL(): number {
  const now = new Date();
  const vn  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const day  = vn.getDay();
  const totalMinutes = vn.getHours() * 60 + vn.getMinutes();

  const isWeekday   = day >= 1 && day <= 5;
  const isInSession = totalMinutes >= 9 * 60 && totalMinutes < 15 * 60;

  if (isWeekday && isInSession) return 3 * 60 * 1000;

  const next = new Date(vn);
  next.setHours(9, 0, 0, 0);
  if (totalMinutes >= 15 * 60 || !isWeekday) next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return Math.max(60 * 1000, next.getTime() - vn.getTime());
}

async function fetchStockQuote(ticker: string) {
  const url  = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const res  = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
  if (!res.ok) return null;
  const json: any = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price:     meta.regularMarketPrice,
    prevClose: meta.chartPreviousClose,
    high52w:   meta.fiftyTwoWeekHigh,
    low52w:    meta.fiftyTwoWeekLow,
    volume:    meta.regularMarketVolume,
    dayHigh:   meta.regularMarketDayHigh,
    dayLow:    meta.regularMarketDayLow,
  };
}

// Chỉ số scoring riêng cho cổ phiếu VN:
// - ETF bonus: ưu tiên passive investing
// - Sector bonus: tùy riskLevel (ngân hàng/tiêu dùng cho LOW, công nghệ cho HIGH...)
// - Momentum (vị trí trong dải 52 tuần): phản ánh trend dài hạn
// - Volatility score: LOW thưởng coin ổn định, HIGH thưởng biến động
export function scoreStock(quote: any, meta: StockMeta, riskLevel: string): number {
  if (!quote) return 0;
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const etfBonus = meta.sector === 'ETF' ? 20 : 0;

  const sectorMap: Record<string, Record<string, number>> = {
    LOW:    { 'Ngân hàng': 15, 'Tiêu dùng': 15, 'ETF': 20, 'Hạ tầng': 10 },
    MEDIUM: { 'Công nghệ': 15, 'Ngân hàng': 12, 'Bán lẻ': 10, 'ETF': 15, 'Tiêu dùng': 8 },
    HIGH:   { 'Công nghệ': 20, 'Hóa chất': 15, 'Thép': 12, 'Bán lẻ': 10 },
  };
  const sectorBonus = sectorMap[riskLevel]?.[meta.sector] || 0;

  const momentumScore = posIn52w * 30;

  const volScore = riskLevel === 'LOW'
    ? Math.max(0, 20 - Math.abs(change) * 4)
    : riskLevel === 'HIGH'
    ? Math.min(20, Math.abs(change) * 4)
    : Math.max(0, 20 - Math.max(0, Math.abs(change) - 2) * 5);

  return etfBonus + sectorBonus + momentumScore + volScore;
}

export function buildStockCard(quote: any, meta: StockMeta, rank: number): StockCard {
  const change  = quote.prevClose > 0 ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const priceLabel  = quote.price?.toLocaleString('vi-VN') + 'đ';
  const changeSign  = change >= 0 ? '+' : '';
  const rate        = `${priceLabel} (${changeSign}${change.toFixed(2)}%)`;
  const pos52wLabel = posIn52w > 0.8 ? 'gần đỉnh 52 tuần' : posIn52w < 0.2 ? 'gần đáy 52 tuần' : 'vùng giữa 52 tuần';
  const trendLabel  = change > 2 ? '🚀 tăng mạnh' : change > 0.5 ? '📈 tăng' : change < -2 ? '📉 giảm mạnh' : change < -0.5 ? '📉 giảm' : '➡️ đi ngang';
  const note        = `${meta.sector} · ${pos52wLabel} · ${trendLabel} hôm nay`;

  let badge = '', badgeColor = '';
  if (rank === 0)               { badge = 'Tốt nhất';    badgeColor = 'amber';   }
  else if (meta.sector === 'ETF') { badge = 'Passive';   badgeColor = 'blue';    }
  else if (change > 2)          { badge = 'Đang tăng';   badgeColor = 'emerald'; }
  else if (posIn52w < 0.25)     { badge = 'Vùng giá tốt'; badgeColor = 'blue';  }
  else if (posIn52w > 0.75)     { badge = 'Uptrend';     badgeColor = 'emerald'; }

  return {
    ticker:        meta.ticker.replace('.VN', ''),
    historyTicker: meta.ticker,
    name:          meta.name,
    sector:        meta.sector,
    tag:           meta.tag,
    price:         quote.price,
    change24h:     change,
    high52w:       quote.high52w,
    low52w:        quote.low52w,
    posIn52w,
    note,
    badge,
    badgeColor,
    rate,
  };
}

export async function getStockPricesData(riskLevel: string): Promise<StocksServiceResult> {
  const now = Date.now();
  let quotes: Record<string, any>;

  if (stockCache.data && now - stockCache.fetchedAt < getStockCacheTTL()) {
    quotes = stockCache.data;
  } else {
    const results = await Promise.allSettled(
      STOCK_UNIVERSE.map(async (m) => {
        const q = await fetchStockQuote(m.ticker);
        return { ticker: m.ticker, quote: q };
      })
    );
    quotes = {};
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value.quote) {
        quotes[r.value.ticker] = r.value.quote;
      }
    });
    stockCache = { data: quotes, fetchedAt: now };
  }

  const scored = STOCK_UNIVERSE
    .filter((m) => quotes[m.ticker])
    .map((m) => ({ meta: m, quote: quotes[m.ticker], score: scoreStock(quotes[m.ticker], m, riskLevel) }))
    .sort((a, b) => b.score - a.score);

  const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));

  const quoteList = Object.values(quotes);
  const avgChange = quoteList.length > 0
    ? quoteList.reduce((sum, q) => sum + (q.prevClose > 0 ? (q.price - q.prevClose) / q.prevClose * 100 : 0), 0) / quoteList.length
    : 0;
  const marketMood = avgChange > 1 ? 'đang tăng 📈' : avgChange > 0 ? 'tích cực nhẹ' : avgChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';

  const introMap: Record<string, string> = {
    LOW:    `VN-Index ${marketMood}. Với khẩu vị thấp, ưu tiên ETF và bluechip ngân hàng/tiêu dùng có cổ tức ổn định. DCA hàng tháng, không cần theo dõi thường xuyên.`,
    MEDIUM: `VN-Index ${marketMood}. Cân bằng giữa cổ phiếu tăng trưởng (FPT, MWG) và phòng thủ (VNM, VCB). Nên giữ 5–7 mã, review mỗi quý.`,
    HIGH:   `VN-Index ${marketMood}. Tập trung vào cổ phiếu tăng trưởng cao (công nghệ, hóa chất, thép). Rủi ro cao — cần theo dõi sát, đặt stop-loss.`,
  };

  return {
    stocks: top5,
    intro:  introMap[riskLevel] || introMap.MEDIUM,
    riskLevel,
    cached: stockCache.fetchedAt !== now,
  };
}

export function getStockCacheForFallback() {
  return stockCache;
}
