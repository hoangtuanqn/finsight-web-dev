export interface UsStockMeta {
  ticker: string;
  name: string;
  sector: string;
  tag: string;
  isEtf: boolean;
}

export interface UsStockCard {
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
  historySource: Record<string, any>;
}

export interface StocksUsServiceResult {
  stocks: UsStockCard[];
  intro: string;
  riskLevel: string;
  cached: boolean;
}

// Vũ trụ cổ phiếu Mỹ — ETF broad market ưu tiên cho người VN đầu tư Mỹ
// Nguồn: Yahoo Finance (ticker dạng chuẩn US, không cần suffix)
export const US_STOCK_UNIVERSE: UsStockMeta[] = [
  // Broad market ETF — phù hợp nhất với investor VN (passive, đa dạng hóa ngay)
  { ticker: 'SPY',   name: 'SPDR S&P 500 ETF',        sector: 'ETF Broad',   tag: 'S&P 500 · 500 công ty lớn nhất Mỹ',    isEtf: true  },
  { ticker: 'QQQ',   name: 'Invesco Nasdaq 100 ETF',   sector: 'ETF Tech',    tag: 'Nasdaq 100 · Tập trung Big Tech',       isEtf: true  },
  { ticker: 'VTI',   name: 'Vanguard Total Market ETF', sector: 'ETF Broad',  tag: 'Total Market · Phí thấp nhất',         isEtf: true  },
  { ticker: 'IWM',   name: 'iShares Russell 2000 ETF', sector: 'ETF SmallCap', tag: 'Russell 2000 · Small-cap Mỹ',         isEtf: true  },
  // Big Tech — vốn hóa lớn nhất, ổn định nhất trong nhóm cổ phiếu
  { ticker: 'AAPL',  name: 'Apple Inc.',                sector: 'Công nghệ',  tag: 'Big Tech · Vốn hóa #1 thế giới',       isEtf: false },
  { ticker: 'MSFT',  name: 'Microsoft Corporation',    sector: 'Công nghệ',  tag: 'Big Tech · Cloud + AI leader',          isEtf: false },
  { ticker: 'NVDA',  name: 'NVIDIA Corporation',        sector: 'Bán dẫn',    tag: 'AI chips · Tăng trưởng cao',            isEtf: false },
  { ticker: 'GOOGL', name: 'Alphabet (Google)',         sector: 'Công nghệ',  tag: 'Big Tech · Search + Cloud',             isEtf: false },
  { ticker: 'AMZN',  name: 'Amazon.com',               sector: 'Thương mại', tag: 'E-commerce + AWS · Đa ngành',           isEtf: false },
  { ticker: 'META',  name: 'Meta Platforms',           sector: 'Mạng xã hội', tag: 'Social Media · AI đầu tư mạnh',        isEtf: false },
  // Bluechip phòng thủ — ổn định, cổ tức tốt
  { ticker: 'BRK-B', name: 'Berkshire Hathaway B',     sector: 'Tài chính',  tag: 'Buffett · Đa dạng, phòng thủ',          isEtf: false },
  { ticker: 'JPM',   name: 'JPMorgan Chase',           sector: 'Ngân hàng',  tag: 'Bank · Cổ tức + tăng trưởng',           isEtf: false },
];

let usStockCache: { data: Record<string, any> | null; fetchedAt: number } = { data: null, fetchedAt: 0 };

// TTL động theo phiên NYSE (UTC-5, 9:30–16:00, T2–T6)
function getUsStockCacheTTL(): number {
  const now = new Date();
  const ny  = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day  = ny.getDay();
  const totalMinutes = ny.getHours() * 60 + ny.getMinutes();

  const isWeekday   = day >= 1 && day <= 5;
  const isInSession = totalMinutes >= 9 * 60 + 30 && totalMinutes < 16 * 60;

  if (isWeekday && isInSession) return 3 * 60 * 1000;

  const next = new Date(ny);
  next.setHours(9, 30, 0, 0);
  if (totalMinutes >= 16 * 60 || !isWeekday) next.setDate(next.getDate() + 1);
  while (next.getDay() === 0 || next.getDay() === 6) next.setDate(next.getDate() + 1);
  return Math.max(60 * 1000, next.getTime() - ny.getTime());
}

async function fetchUsStockQuote(ticker: string) {
  const url  = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
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
  };
}

// Scoring riêng cho US stocks — khác VN ở chỗ:
// - ETF Broad market được ưu tiên cao nhất (passive phù hợp investor VN)
// - Sector bonus tập trung vào Tech/AI/Cloud (growth engine của S&P 500)
// - Bluechip phòng thủ (BRK-B, JPM) được ưu tiên với LOW risk
// - Không có sector VN-specific
export function scoreUsStock(quote: any, meta: UsStockMeta, riskLevel: string): number {
  if (!quote) return 0;
  const change  = quote.prevClose > 0 ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  // ETF được ưu tiên cao nhất — phù hợp nhất với user VN đầu tư Mỹ lần đầu
  const etfBonus = meta.isEtf ? (meta.sector === 'ETF Broad' ? 25 : 18) : 0;

  const sectorMap: Record<string, Record<string, number>> = {
    LOW:    { 'Tài chính': 15, 'Ngân hàng': 12, 'ETF Broad': 25, 'ETF Tech': 10, 'Công nghệ': 8 },
    MEDIUM: { 'Công nghệ': 18, 'Bán dẫn': 15, 'ETF Broad': 20, 'ETF Tech': 18, 'Thương mại': 10 },
    HIGH:   { 'Bán dẫn': 22, 'Công nghệ': 18, 'ETF Tech': 20, 'Mạng xã hội': 15, 'Thương mại': 12 },
  };
  const sectorBonus = meta.isEtf ? 0 : (sectorMap[riskLevel]?.[meta.sector] || 0);

  const momentumScore = posIn52w * 25;

  const volScore = riskLevel === 'LOW'
    ? Math.max(0, 20 - Math.abs(change) * 5)
    : riskLevel === 'HIGH'
    ? Math.min(20, Math.abs(change) * 5)
    : Math.max(0, 20 - Math.max(0, Math.abs(change) - 1.5) * 6);

  return etfBonus + sectorBonus + momentumScore + volScore;
}

export function buildUsStockCard(quote: any, meta: UsStockMeta, rank: number): UsStockCard {
  const change   = quote.prevClose > 0 ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const priceLabel  = `$${quote.price?.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const changeSign  = change >= 0 ? '+' : '';
  const rate        = `${priceLabel} (${changeSign}${change.toFixed(2)}%)`;
  const pos52wLabel = posIn52w > 0.8 ? 'gần đỉnh 52 tuần' : posIn52w < 0.2 ? 'gần đáy 52 tuần' : 'vùng giữa 52 tuần';
  const trendLabel  = change > 2 ? '🚀 tăng mạnh' : change > 0.5 ? '📈 tăng' : change < -2 ? '📉 giảm mạnh' : change < -0.5 ? '📉 giảm' : '➡️ đi ngang';
  const typeLabel   = meta.isEtf ? 'ETF' : meta.sector;
  const note        = `${typeLabel} · ${pos52wLabel} · ${trendLabel} hôm nay · USD`;

  let badge = '', badgeColor = '';
  if (rank === 0)                        { badge = 'Tốt nhất';    badgeColor = 'amber';   }
  else if (meta.sector === 'ETF Broad')  { badge = 'Passive';     badgeColor = 'blue';    }
  else if (meta.sector === 'ETF Tech')   { badge = 'Tech ETF';    badgeColor = 'purple';  }
  else if (change > 2)                   { badge = 'Đang tăng';   badgeColor = 'emerald'; }
  else if (posIn52w < 0.25)             { badge = 'Vùng giá tốt'; badgeColor = 'blue';   }
  else if (posIn52w > 0.75)             { badge = 'Uptrend';      badgeColor = 'emerald'; }

  return {
    ticker:        meta.ticker,
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
    historySource: {
      asset:      'stocks_us',
      ticker:     meta.ticker,
      sourceType: 'direct',
      dataSource: 'Yahoo Finance monthly close',
    },
  };
}

export async function getStocksUsPricesData(riskLevel: string): Promise<StocksUsServiceResult> {
  const now = Date.now();
  let quotes: Record<string, any>;

  if (usStockCache.data && now - usStockCache.fetchedAt < getUsStockCacheTTL()) {
    quotes = usStockCache.data;
  } else {
    const results = await Promise.allSettled(
      US_STOCK_UNIVERSE.map(async (m) => {
        const q = await fetchUsStockQuote(m.ticker);
        return { ticker: m.ticker, quote: q };
      })
    );
    quotes = {};
    results.forEach((r) => {
      if (r.status === 'fulfilled' && r.value.quote) {
        quotes[r.value.ticker] = r.value.quote;
      }
    });
    usStockCache = { data: quotes, fetchedAt: now };
  }

  const scored = US_STOCK_UNIVERSE
    .filter((m) => quotes[m.ticker])
    .map((m) => ({ meta: m, quote: quotes[m.ticker], score: scoreUsStock(quotes[m.ticker], m, riskLevel) }))
    .sort((a, b) => b.score - a.score);

  const top5 = scored.slice(0, 5).map((s, i) => buildUsStockCard(s.quote, s.meta, i));

  const quoteList = Object.values(quotes);
  const avgChange = quoteList.length > 0
    ? quoteList.reduce((sum, q) => sum + (q.prevClose > 0 ? (q.price - q.prevClose) / q.prevClose * 100 : 0), 0) / quoteList.length
    : 0;
  const marketMood = avgChange > 1 ? 'đang tăng 📈' : avgChange > 0 ? 'tích cực nhẹ' : avgChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';

  const introMap: Record<string, string> = {
    LOW:    `S&P 500 ${marketMood}. Với khẩu vị thấp, ưu tiên ETF broad market (SPY, VTI) — đa dạng hóa ngay, phí thấp. Nên đầu tư dài hạn trên 3 năm để ổn định tỷ giá USD/VND.`,
    MEDIUM: `S&P 500 ${marketMood}. Kết hợp ETF (SPY/QQQ) và cổ phiếu Big Tech. Tỷ lệ gợi ý: 60% ETF + 40% cổ phiếu riêng lẻ. Đánh giá lại mỗi 6 tháng.`,
    HIGH:   `S&P 500 ${marketMood}. Tập trung vào cổ phiếu tăng trưởng cao (NVDA, Meta, Amazon) và ETF Tech (QQQ). Rủi ro biến động tỷ giá — chỉ đầu tư vốn dài hạn.`,
  };

  return {
    stocks:    top5,
    intro:     introMap[riskLevel] || introMap.MEDIUM,
    riskLevel,
    cached:    usStockCache.fetchedAt !== now,
  };
}

export function getUsStockCacheForFallback() {
  return usStockCache;
}
