export interface CoinCard {
  id: string;
  name: string;
  symbol: string;
  image: string;
  price: number;
  marketCap: number;
  change24h: number;
  volRatio: number;
  marketCapRank: number;
  tag: string;
  note: string;
  reason: string[];
  badge: string;
  badgeColor: string;
  rate: string;
}

export interface CryptoServiceResult {
  coins: CoinCard[];
  intro: string;
  disclaimer: string;
  riskLevel: string;
  cached: boolean;
}

// Stablecoin bị loại khỏi gợi ý đầu tư (chỉ USDC được append riêng cuối list)
const STABLECOIN_IDS = new Set([
  'tether',
  'usd-coin',
  'binance-usd',
  'dai',
  'true-usd',
  'usdd',
  'frax',
  'liquity-usd',
  'fei-usd',
  'pax-dollar',
  'usd1',
  'usd1-wlfi',
  'ripple-usd',
  'rlusd',
  'first-digital-usd',
  'paypal-usd',
  'mountain-protocol-usdm',
]);

// Các coin bị loại: wrapped token, LST, meme coin, chính trị
const BLACKLIST_IDS = new Set([
  'wrapped-bitcoin',
  'wrapped-ethereum',
  'staked-ether',
  'wrapped-steth',
  'rocket-pool-eth',
  'coinbase-wrapped-staked-eth',
  'mantle-staked-ether',
  'dogecoin',
  'shiba-inu',
  'pepe',
  'floki',
  'dogwifcoin',
  'bonk',
  'official-trump',
  'melania-meme',
  'book-of-meme',
  'pudgy-penguins',
  'axie-infinity',
  'the-sandbox',
  'decentraland',
  'xrp',
]);

let cryptoCache: { data: any[] | null; fetchedAt: number } = { data: null, fetchedAt: 0 };
const CRYPTO_CACHE_TTL_MS = 5 * 60 * 1000;

// Scoring riêng cho crypto — 3 chiều:
// 1. Market cap (50%): càng lớn càng an toàn, penalty coin nhỏ
// 2. Liquidity — volume/mcap ratio (20%): thanh khoản cao dễ thoát lệnh
// 3. Volatility (30%): khác nhau theo riskLevel
//    - LOW: thưởng coin ổn định (biến động gần 0)
//    - HIGH: thưởng coin đang có momentum (3-20% daily)
//    - MEDIUM: trung hòa, phạt nhẹ nếu biến động > 5%
function scoreCoin(coin: any, riskLevel: string = 'MEDIUM'): number {
  const mcap = coin.market_cap || 0;
  const volume = coin.total_volume || 0;
  const change = Math.abs(coin.price_change_percentage_24h || 0);
  const fdv    = coin.fully_diluted_valuation || 0;

  // MCap: dùng để lọc an toàn tối thiểu, không để xếp hạng
  // Cap tại 70 để coin rank 5-30 có thể cạnh tranh với BTC/ETH
  const mcapRaw   = Math.min(100, (Math.log10(Math.max(mcap, 1)) / Math.log10(3e12)) * 100);
  const mcapScore = Math.min(70, mcapRaw) - (mcap < 5e9 ? 30 : mcap < 20e9 ? 10 : 0);
  const mcapScore = Math.min(100, (Math.log10(Math.max(mcap, 1)) / Math.log10(3e12)) * 100);
  const mcapPenalty = mcap < 5e9 ? 30 : mcap < 20e9 ? 15 : 0;
  const mcapPenaltyApplied = mcapScore - mcapPenalty;
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85

  // Liquidity: volume/mcap ratio — coin đang được giao dịch tích cực
  const volRatio = mcap > 0 ? volume / mcap : 0;
  const liqScore = Math.min(100, volRatio * 500); // 20% vol/mcap = 100 điểm

  // MC/FDV: ít token chưa unlock = ít áp lực xả
  const mcFdvRatio = fdv > 0 ? Math.min(mcap / fdv, 1) : 1;
  const fdvScore   = (mcFdvRatio * 100) - (mcFdvRatio < 0.2 ? 25 : mcFdvRatio < 0.5 ? 10 : 0);

  // Momentum/Volatility: thay đổi theo khẩu vị rủi ro
  let momentumScore: number;
  if (riskLevel === 'LOW') {
    // Thưởng coin ổn định, phạt biến động cao
    momentumScore = Math.max(0, 100 - change * 12);
  } else if (riskLevel === 'HIGH') {
    // Thưởng coin đang tăng mạnh (3–15%), không thích coin đang giảm
    const raw24h = coin.price_change_percentage_24h || 0;
    momentumScore = raw24h >= 3 && raw24h <= 15
      ? 100 - Math.abs(raw24h - 9) * 4
      : raw24h > 0 ? 50 : Math.max(0, 40 + raw24h * 3);
  } else {
    // MEDIUM: thưởng tăng nhẹ, phạt giảm, phạt biến động quá lớn
    const raw24h = coin.price_change_percentage_24h || 0;
    momentumScore = raw24h >= 0
      ? Math.max(0, 100 - Math.max(0, raw24h - 8) * 6)
      : Math.max(0, 80 + raw24h * 5);
  }

  // Trọng số: mcap 25% (lọc an toàn), liq 30% (đang sôi động), momentum 30%, fdv 15%
  return (mcapScore * 0.25) + (liqScore * 0.30) + (momentumScore * 0.30) + (fdvScore * 0.15);
}

function buildCoinCard(coin: any, rank: number): CoinCard {
  const change = coin.price_change_percentage_24h ?? 0;
  const mcap = coin.market_cap ?? 0;
  const volRatio = mcap > 0 ? coin.total_volume / mcap : 0;

  let tag: string;
  if (coin.market_cap_rank <= 2) tag = 'Top 2 — Blue-chip';
  else if (coin.market_cap_rank <= 10) tag = `Top ${coin.market_cap_rank} — Large-cap`;
  else if (coin.market_cap_rank <= 50) tag = `Top ${coin.market_cap_rank} — Mid-cap`;
  else tag = 'Small-cap';

  const mcapLabel =
    mcap >= 1e12
      ? `$${(mcap / 1e12).toFixed(2)}T`
      : mcap >= 1e9
        ? `$${(mcap / 1e9).toFixed(0)}B`
        : `$${(mcap / 1e6).toFixed(0)}M`;

  const fdv         = coin.fully_diluted_valuation || 0;
  const mcFdvRatio  = fdv > 0 ? mcap / fdv : 1;
  const fdvLabel    = mcFdvRatio >= 0.9 ? 'lưu hành gần max' : mcFdvRatio >= 0.5 ? `MC/FDV ${(mcFdvRatio * 100).toFixed(0)}%` : `MC/FDV ${(mcFdvRatio * 100).toFixed(0)}% ⚠️`;
  const liqLabel    = volRatio > 0.15 ? 'thanh khoản rất cao' : volRatio > 0.07 ? 'thanh khoản tốt' : 'thanh khoản trung bình';
  const trendLabel  = change > 5 ? '🚀 đang tăng mạnh' : change > 1 ? '📈 xu hướng tăng' : change < -5 ? '📉 đang giảm mạnh' : change < -1 ? '📉 xu hướng giảm' : '➡️ đi ngang';
  const note        = `MCap ${mcapLabel} · ${fdvLabel} · ${liqLabel} · ${trendLabel} 24h`;

  const reason: string[] = [];
  if (coin.market_cap_rank <= 2)   reason.push(`Top ${coin.market_cap_rank} thị trường — vốn hóa lớn nhất, ít rủi ro mất thanh khoản`);
  else if (mcap >= 20e9)           reason.push(`Vốn hóa ${mcapLabel} — đủ lớn để ổn định, khó bị thao túng giá`);
  else                             reason.push(`Vốn hóa ${mcapLabel} — mid-cap có tiềm năng tăng trưởng cao hơn blue-chip`);

  if (volRatio > 0.15)             reason.push(`Thanh khoản rất cao (vol/mcap ${(volRatio * 100).toFixed(0)}%) — dễ mua/bán bất kỳ lúc nào`);
  else if (volRatio > 0.07)        reason.push(`Thanh khoản tốt — giao dịch sôi động, ít bị trượt giá`);

  if (change > 5)                  reason.push(`Tăng ${change.toFixed(1)}% trong 24h — đang có momentum mạnh`);
  else if (change > 1)             reason.push(`Tăng nhẹ ${change.toFixed(1)}% trong 24h — xu hướng tích cực`);
  else if (change >= -1)           reason.push(`Biến động thấp (${change.toFixed(1)}% 24h) — phù hợp giữ vốn ổn định`);

  if (mcFdvRatio >= 0.9)           reason.push(`Hầu hết token đã lưu hành — ít rủi ro bị xả từ token mở khóa`);
  else if (mcFdvRatio < 0.5)       reason.push(`Còn ${((1 - mcFdvRatio) * 100).toFixed(0)}% token chưa unlock — cần theo dõi lịch mở khóa`);
  const liqLabel =
    volRatio > 0.15 ? 'thanh khoản rất cao' : volRatio > 0.07 ? 'thanh khoản tốt' : 'thanh khoản trung bình';
  const trendLabel =
    change > 5
      ? '🚀 đang tăng mạnh'
      : change > 1
        ? '📈 xu hướng tăng'
        : change < -5
          ? '📉 đang giảm mạnh'
          : change < -1
            ? '📉 xu hướng giảm'
            : '➡️ đi ngang';
  const note = `MCap ${mcapLabel} · ${liqLabel} · ${trendLabel} 24h`;
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85

  let badge = '',
    badgeColor = '';
  if (rank === 0) {
    badge = 'Tốt nhất';
    badgeColor = 'amber';
  } else if (coin.market_cap_rank <= 2) {
    badge = 'Blue-chip';
    badgeColor = 'amber';
  } else if (change > 5) {
    badge = 'Đang tăng';
    badgeColor = 'emerald';
  } else if (volRatio > 0.15) {
    badge = 'Thanh khoản';
    badgeColor = 'blue';
  } else if (coin.market_cap_rank <= 10) {
    badge = 'Uy tín cao';
    badgeColor = 'blue';
  }

  const price = coin.current_price;
  const priceLabel =
    price >= 1 ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `$${price.toFixed(6)}`;
  const changeSign = change >= 0 ? '+' : '';
  const rate = `${priceLabel} (${changeSign}${change.toFixed(2)}% 24h)`;

  return {
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toUpperCase(),
    image: coin.image,
    price: coin.current_price,
    marketCap: mcap,
    change24h: change,
    volRatio,
    marketCapRank: coin.market_cap_rank,
    tag,
    note,
    reason,
    badge,
    badgeColor,
    rate,
  };
}

export async function getCryptoPricesData(riskLevel: string): Promise<CryptoServiceResult> {
  const now = Date.now();
  let rawCoins: any[];

  if (cryptoCache.data && now - cryptoCache.fetchedAt < CRYPTO_CACHE_TTL_MS) {
    rawCoins = cryptoCache.data;
  } else {
    const url = 'https://api.coingecko.com/api/v3/coins/markets'
      + '?vs_currency=usd&order=market_cap_desc&per_page=30&page=1'
      + '&sparkline=false&price_change_percentage=24h'
      + '&include_fully_diluted_valuation=true';
    const url =
      'https://api.coingecko.com/api/v3/coins/markets' +
      '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1' +
      '&sparkline=false&price_change_percentage=24h';
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
    rawCoins = await response.json();
    cryptoCache = { data: rawCoins, fetchedAt: now };
  }

  const filtered = rawCoins.filter(
    (c) => !STABLECOIN_IDS.has(c.id) && !BLACKLIST_IDS.has(c.id) && !/usd|dollar/i.test(c.name),
  );

  const scored = filtered.map((c) => ({ coin: c, score: scoreCoin(c, riskLevel) })).sort((a, b) => b.score - a.score);

  const top5 = scored.slice(0, 8).map((s, i) => buildCoinCard(s.coin, i));
  const top5 = scored.slice(0, 5).map((s, i) => buildCoinCard(s.coin, i));

  // Stablecoin luôn có trong list (ngoại trừ HIGH risk không cần)
  if (riskLevel !== 'HIGH') {
    const usdc = rawCoins.find((c) => c.id === 'usd-coin');
    if (usdc) {
      top5.push({
        id: 'usd-coin',
        name: 'USDC / USDT',
        symbol: 'USDC',
        image: usdc.image,
        price: 1,
        marketCap: usdc.market_cap,
        change24h: 0,
        volRatio: 0,
        marketCapRank: usdc.market_cap_rank,
        tag: 'Stablecoin',
        note: 'Gửi nhận lãi 5–8%/năm trên các nền tảng DeFi · không chịu biến động giá',
        badge: 'Ít rủi ro',
        badgeColor: 'emerald',
        rate: '$1.00 (Stablecoin)',
      });
    }
  }
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85

  const filteredSlice = filtered.slice(0, 20);
  const avgChange =
    filteredSlice.length > 0
      ? filteredSlice.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / filteredSlice.length
      : 0;
  const marketMood =
    avgChange > 3
      ? 'đang tăng mạnh 🚀'
      : avgChange > 0
        ? 'tích cực nhẹ 📈'
        : avgChange > -3
          ? 'đi ngang ➡️'
          : 'đang giảm 📉';

  const introMap: Record<string, string> = {
    LOW: `Thị trường crypto ${marketMood}. Với khẩu vị rủi ro thấp, danh sách tập trung vào các coin có market cap lớn, biến động thấp — ưu tiên bảo toàn vốn. Chỉ đầu tư phần vốn chấp nhận rủi ro.`,
    MEDIUM: `Thị trường crypto ${marketMood}. Danh sách cân bằng giữa an toàn (mcap lớn) và tăng trưởng (thanh khoản tốt). Tập trung vào coin có nền tảng thực sự, tránh meme coin.`,
    HIGH: `Thị trường crypto ${marketMood}. Với khẩu vị rủi ro cao, danh sách ưu tiên coin có tiềm năng tăng mạnh và thanh khoản tốt. Chỉ đầu tư vốn chấp nhận mất hoàn toàn, DCA hàng tháng.`,
  };

  return {
    coins:      top5,
    intro:      introMap[riskLevel] || introMap.MEDIUM,
    disclaimer: `Xếp hạng dựa trên dữ liệu thị trường (MCap, thanh khoản, MC/FDV). Chưa tính đến team, use case hay tokenomics chi tiết — cần DYOR trước khi đầu tư.`,
    riskLevel,
    cached:     cryptoCache.fetchedAt !== now,
    coins: top5,
    intro: introMap[riskLevel] || introMap.MEDIUM,
    riskLevel,
    cached: cryptoCache.fetchedAt !== now,
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
  };
}

export function getCryptoCache() {
  return cryptoCache;
}

export { BLACKLIST_IDS, STABLECOIN_IDS, buildCoinCard, scoreCoin };
