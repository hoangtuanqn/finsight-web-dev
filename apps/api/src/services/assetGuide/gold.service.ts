export interface GoldItem {
  id: string;
  name: string;
  tag: string;
  historySource: Record<string, any>;
  price: number | null;
  priceLabel: string;
  buyPrice?: number;
  buyLabel?: string;
  change24h: number;
  note: string;
  badge: string;
  badgeColor: string;
  highlight?: boolean;
}

export interface GoldServiceResult {
  goldItems: GoldItem[];
  intro: string;
  worldPrice: number;
  worldChange: number;
  cached: boolean;
}

let goldCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const GOLD_CACHE_TTL = 10 * 60 * 1000;

async function fetchGoldData() {
  const worldRes = await fetch(
    'https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d',
    { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
  );
  const worldJson: any = await worldRes.json();
  const worldMeta = worldJson?.chart?.result?.[0]?.meta;
  const worldPrice     = worldMeta?.regularMarketPrice ?? 0;
  const worldPrevClose = worldMeta?.chartPreviousClose ?? worldPrice;
  const worldChange    = worldPrevClose > 0 ? (worldPrice - worldPrevClose) / worldPrevClose * 100 : 0;

  const btmcRes = await fetch(
    'https://btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v',
    { headers: { Accept: 'application/json' } }
  );
  const btmcJson: any = await btmcRes.json();
  const rows = btmcJson?.DataList?.Data ?? [];

  let sjc: any = null, nhan: any = null;
  for (const row of rows) {
    const idx  = row['@row'];
    const name = (row[`@n_${idx}`] || '').toUpperCase();
    const buy  = parseInt(row[`@pb_${idx}`] || '0', 10);
    const sell = parseInt(row[`@ps_${idx}`] || '0', 10);
    if (!sjc  && name.includes('VÀNG MIẾNG SJC'))  sjc  = { buy, sell };
    if (!nhan && name.includes('NHẪN TRÒN TRƠN'))  nhan = { buy, sell };
    if (sjc && nhan) break;
  }

  return { worldPrice, worldChange, sjc, nhan };
}

export async function getGoldPricesData(): Promise<GoldServiceResult> {
  const now = Date.now();
  let data: { worldPrice: number; worldChange: number; sjc: any; nhan: any };

  if (goldCache.data && now - goldCache.fetchedAt < GOLD_CACHE_TTL) {
    data = goldCache.data;
  } else {
    data = await fetchGoldData();
    goldCache = { data, fetchedAt: now };
  }

  const { worldPrice, worldChange, sjc, nhan } = data;

  const fmt  = (n: number) => n?.toLocaleString('vi-VN') + 'đ';
  const fmtW = (n: number) => `$${n?.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz`;
  const sign = (n: number) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

  const sjcSpread    = sjc ? Math.round((sjc.sell - sjc.buy) / sjc.sell * 100 * 10) / 10 : 0;
  const impliedNhan  = sjc ? Math.round(worldPrice * 25500 / 8.29 / 100000) * 100000 : 0;
  const premiumSJC   = sjc && impliedNhan > 0
    ? Math.round((sjc.sell - impliedNhan) / impliedNhan * 100 * 10) / 10
    : 0;
  const sjcBenchmark = sjc || nhan;

  const goldItems: GoldItem[] = [
    {
      id:       'world',
      name:     'Vàng thế giới (GC=F)',
      tag:      'Futures · COMEX',
      historySource: { asset: 'gold', source: 'world', sourceType: 'direct' },
      price:      worldPrice,
      priceLabel: fmtW(worldPrice),
      change24h:  worldChange,
      note:    `Giá spot quốc tế · ${worldChange >= 0 ? '📈 tăng' : '📉 giảm'} ${Math.abs(worldChange).toFixed(2)}% hôm nay`,
      badge:      worldChange > 1 ? 'Đang tăng' : worldChange < -1 ? 'Giảm' : 'Ổn định',
      badgeColor: worldChange > 0 ? 'emerald' : 'amber',
      highlight:  true,
    },
    ...(sjc ? [{
      id:       'sjc',
      name:     'Vàng miếng SJC',
      tag:      'Trong nước · 1 chỉ',
      historySource: { asset: 'gold', source: 'sjc', sourceType: 'direct', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
      price:      sjc.sell,
      priceLabel: fmt(sjc.sell),
      buyPrice:   sjc.buy,
      buyLabel:   fmt(sjc.buy),
      change24h:  worldChange,
      note:    `Mua: ${fmt(sjc.buy)} · Bán: ${fmt(sjc.sell)} · Spread ${sjcSpread}%${premiumSJC > 0 ? ` · Premium so TG: +${premiumSJC}%` : ''}`,
      badge:      'Thanh khoản cao',
      badgeColor: 'amber',
    }] : []),
    ...(nhan ? [{
      id:       'nhan',
      name:     'Nhẫn tròn trơn VRTL',
      tag:      'Trang sức · 1 chỉ',
      historySource: { asset: 'gold', source: 'ring', sourceType: 'direct', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
      price:      nhan.sell,
      priceLabel: fmt(nhan.sell),
      buyPrice:   nhan.buy,
      buyLabel:   fmt(nhan.buy),
      change24h:  worldChange,
      note:    `Mua: ${fmt(nhan.buy)} · Bán: ${fmt(nhan.sell)} · Dễ mua bán nhỏ lẻ hơn SJC`,
      badge:      'Linh hoạt',
      badgeColor: 'blue',
    }] : []),
    {
      id:       'etf_gold',
      name:     'Vàng thế giới quy đổi',
      tag:      'Proxy · XAU/USD',
      historySource: { asset: 'gold', source: 'world', sourceType: 'proxy', sourceLabel: 'Tham chiếu GC=F' },
      price:      worldPrice,
      priceLabel: fmtW(worldPrice),
      change24h:  worldChange,
      note:    'Dùng giá vàng thế giới GC=F làm tham chiếu vì chưa xác thực được ticker ETF vàng Việt Nam phù hợp',
      badge:      'Tham chiếu',
      badgeColor: 'blue',
    },
    {
      id:       'saving_gold',
      name:     'Tích lũy vàng DCA',
      tag:      'Chiến lược',
      historySource: { asset: 'gold', source: 'sjc', sourceType: 'proxy', sourceLabel: 'Proxy SJC 30 ngày', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
      price:      sjcBenchmark?.sell ?? null,
      priceLabel: sjcBenchmark ? fmt(sjcBenchmark.sell) : 'Theo SJC/nhẫn',
      change24h:  0,
      note:    sjcBenchmark
        ? `DCA theo giá bán ${sjc ? 'SJC' : 'nhẫn'} hiện tại ${fmt(sjcBenchmark.sell)}/chỉ · không phải sản phẩm có giá riêng`
        : 'Chiến lược DCA, chưa có sản phẩm có giá riêng để hiển thị',
      badge:      'Khuyên dùng',
      badgeColor: 'emerald',
    },
  ];

  const trend = worldChange > 1 ? 'đang tăng 📈' : worldChange > 0 ? 'tích cực nhẹ' : worldChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
  const intro = `Vàng thế giới ${trend} (${sign(worldChange)} hôm nay, $${worldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz). `
    + (sjc ? `Vàng SJC trong nước: ${fmt(sjc.sell)}/chỉ${premiumSJC > 5 ? ` — đang cao hơn TG ${premiumSJC}%, cân nhắc thời điểm mua.` : '.'}` : '');

  return {
    goldItems,
    intro,
    worldPrice,
    worldChange,
    cached: goldCache.fetchedAt !== now,
  };
}

export function getGoldCache() {
  return goldCache;
}
