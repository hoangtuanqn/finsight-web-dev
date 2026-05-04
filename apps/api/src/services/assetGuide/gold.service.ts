export interface GoldCostAnalysis {
  spreadPct: number;
  premiumPct: number;
  totalEntryCostPct: number;
  impliedPriceVnd: number;
  profitIfWorldUp3Pct: number;
  profitIfWorldUp10Pct: number;
  breakEvenPct: number;
}

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
  score: number;
  costAnalysis: GoldCostAnalysis | null;
}

export interface GoldMetrics {
  usdVnd: number;
  usdVndSource: string;
  impliedPerChi: number;
  bestBuyId: string | null;
  bestBuyPremiumPct: number | null;
  bestBuySpreadPct: number | null;
}

export interface GoldServiceResult {
  goldItems: GoldItem[];
  intro: string;
  worldPrice: number;
  worldChange: number;
  metrics: GoldMetrics;
  cached: boolean;
}

// ─── Constants ───────────────────────────────────────────────────

const OZ_PER_CHI = 8.2944;
const FALLBACK_USD_VND = 25500;

// Brands phổ biến lưu thông tại VN — chỉ bar + ring 999/9999
// brand_slug khớp với giavang.tv/api/chart/:slug
// priority: thứ tự ưu tiên hiển thị nếu score bằng nhau (thương hiệu lớn lên trước)
const BRAND_CONFIG: Record<
  string,
  {
    label: string;
    priority: number;
    chartSlug: string;
    // gold_type patterns để lọc record phù hợp nhất từ /api/prices
    barPattern?: RegExp;
    ringPattern?: RegExp;
  }
> = {
  sjc: {
    label: 'SJC',
    priority: 1,
    chartSlug: 'sjc',
    barPattern: /1L.*10L|1 ch[ỉi].*2 ch[ỉi]/i,
    ringPattern: /1 ch[ỉi].*2 ch[ỉi].*5 ch[ỉi]/i,
  },
  doji: { label: 'DOJI', priority: 2, chartSlug: 'doji', barPattern: /SJC/i, ringPattern: /Nhẫn.*9999|9999.*Nhẫn/i },
  pnj: { label: 'PNJ', priority: 3, chartSlug: 'pnj', barPattern: /Kim Bảo|SJC.*999/i, ringPattern: /Nhẫn.*999/i },
  btmc: {
    label: 'Bảo Tín Minh Châu',
    priority: 4,
    chartSlug: 'baotinminhchau',
    barPattern: /SJC|VRTL/i,
    ringPattern: /Nhẫn.*999/i,
  },
  phuquy: { label: 'Phú Quý', priority: 5, chartSlug: 'phuquy', barPattern: /999\.9/i, ringPattern: /Nhẫn.*999/i },
  ngoctham: {
    label: 'Ngọc Thẩm',
    priority: 6,
    chartSlug: 'ngoctham',
    barPattern: /999\.9|Ta.*999/i,
    ringPattern: /Nhẫn.*999/i,
  },
  kimnganphuc: {
    label: 'Kim Ngân Phúc',
    priority: 7,
    chartSlug: 'kimnganphuc',
    barPattern: undefined,
    ringPattern: /Nhẫn.*9999|9999/i,
  },
};

// ─── Cache ───────────────────────────────────────────────────────

let goldCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const GOLD_CACHE_TTL = 10 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────

function calcRsi14(closes: number[]): number | null {
  if (closes.length < 15) return null;
  const last15 = closes.slice(-15);
  let gains = 0,
    losses = 0;
  for (let i = 1; i < last15.length; i++) {
    const diff = last15[i] - last15[i - 1];
    if (diff > 0) gains += diff;
    else losses += -diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  if (avgLoss === 0) return 100;
  return Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 10) / 10;
}

function buildCostAnalysis(buyPrice: number, sellPrice: number, impliedPriceVnd: number): GoldCostAnalysis {
  const spreadPct = sellPrice > 0 ? Math.round(((sellPrice - buyPrice) / sellPrice) * 10000) / 100 : 0;
  const premiumPct =
    impliedPriceVnd > 0 ? Math.round(((sellPrice - impliedPriceVnd) / impliedPriceVnd) * 10000) / 100 : 0;
  const totalEntryCostPct = Math.round((spreadPct + Math.max(premiumPct, 0)) * 100) / 100;
  const breakEvenPct = totalEntryCostPct;
  const profitIfWorldUp3Pct =
    impliedPriceVnd > 0
      ? Math.round(impliedPriceVnd * 1.03 - sellPrice - (impliedPriceVnd * 1.03 * spreadPct) / 100)
      : 0;
  const profitIfWorldUp10Pct =
    impliedPriceVnd > 0 ? Math.round(impliedPriceVnd * 1.1 - sellPrice - (impliedPriceVnd * 1.1 * spreadPct) / 100) : 0;
  return {
    spreadPct,
    premiumPct,
    totalEntryCostPct,
    impliedPriceVnd,
    profitIfWorldUp3Pct,
    profitIfWorldUp10Pct,
    breakEvenPct,
  };
}

// Scoring 0–100: cao = điều kiện mua tốt hơn
// costScore 60% · rsiScore 40%
// posScore và momentumScore bị loại:
//   - posScore trùng lặp thông tin với RSI (double-counting)
//   - momentumScore dùng worldChange làm proxy, không phản ánh đúng từng thương hiệu
function scoreGold(cost: GoldCostAnalysis, rsi14: number | null): number {
  // costScore: chi phí thực tế người mua phải chịu khi vào lệnh
  // totalEntryCostPct càng thấp → điểm càng cao
  // hệ số ×5 để 20% chi phí → 0 điểm (ngưỡng quá đắt không nên mua)
  const costScore = Math.max(0, 100 - cost.totalEntryCostPct * 5);

  // rsiScore: trạng thái quá mua / quá bán của thương hiệu trong 14 ngày gần nhất
  // mặc định 50 nếu thiếu dữ liệu lịch sử (< 15 điểm)
  let rsiScore = 50;
  if (rsi14 !== null) {
    if (rsi14 <= 30) rsiScore = 90;
    else if (rsi14 <= 45) rsiScore = 75;
    else if (rsi14 <= 55) rsiScore = 60;
    else if (rsi14 <= 70) rsiScore = 35;
    else rsiScore = 10;
  }

  return Math.round(costScore * 0.6 + rsiScore * 0.4);
}

// ─── Fetchers ────────────────────────────────────────────────────

async function fetchUsdVndRate(): Promise<{ rate: number; source: string }> {
  const isValid = (r: number) => r > 20000 && r < 35000;

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(5000),
    });
    if (res.ok) {
      const json: any = await res.json();
      const rate = json?.rates?.VND;
      if (rate && isValid(rate)) return { rate: Math.round(rate), source: 'open.er-api.com' };
    }
  } catch {
    /* fallthrough */
  }

  try {
    const res = await fetch('https://api.exchangerate.host/latest?base=USD&symbols=VND', {
      headers: { Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(5000),
    });
    if (res.ok) {
      const json: any = await res.json();
      const rate = json?.rates?.VND;
      if (rate && isValid(rate)) return { rate: Math.round(rate), source: 'exchangerate.host' };
    }
  } catch {
    /* fallthrough */
  }

  try {
    const res = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/USDVND%3DX?interval=1d&range=1d', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(5000),
    });
    if (res.ok) {
      const json: any = await res.json();
      const rate = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
      if (rate && isValid(rate)) return { rate: Math.round(rate), source: 'yahoo-usdvnd' };
    }
  } catch {
    /* fallthrough */
  }

  console.warn(`[gold.service] all usd/vnd sources failed — using fallback ${FALLBACK_USD_VND}`);
  return { rate: FALLBACK_USD_VND, source: 'fallback' };
}

// Lấy giá vàng thế giới hiện tại (spot) — chỉ cần meta, không cần 1 năm lịch sử
async function fetchWorldGoldSpot(): Promise<{ price: number; change: number } | null> {
  try {
    const res = await fetch('https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=5d', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(6000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    const prev = meta.chartPreviousClose ?? meta.previousClose ?? 0;
    // guard: nếu change > 5% thì nghi ngờ data lỗi, trả về 0
    const rawChange = prev > 0 ? ((price - prev) / prev) * 100 : 0;
    const change = Math.abs(rawChange) > 5 ? 0 : rawChange;
    return { price, change };
  } catch {
    return null;
  }
}

// Lấy tất cả giá hiện tại từ giavang.tv — 1 request, lọc bar+ring, bỏ bạc/trang sức
async function fetchGiavangTvPrices(): Promise<any[] | null> {
  try {
    const res = await fetch('https://giavang.tv/api/prices', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(8000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    if (!Array.isArray(json)) return null;

    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h ago
    return json.filter((d: any) => {
      if (d.category !== 'bar' && d.category !== 'ring') return false;
      if (!d.sell_price || d.sell_price <= 0) return false;
      if (d.gold_type?.toLowerCase().includes('bạc')) return false;
      if (d.gold_type?.toLowerCase().includes('silver')) return false;
      // accept if updated within 24h OR if updated_at is missing (some brands update infrequently)
      if (d.updated_at) {
        const updatedMs = new Date(d.updated_at.replace(' ', 'T') + '+07:00').getTime();
        if (!isNaN(updatedMs) && updatedMs < cutoff) return false;
      }
      return true;
    });
  } catch {
    return null;
  }
}

// Lấy lịch sử giá (30 ngày) từ giavang.tv/api/chart/:slug
// Trả về mảng sell prices theo chỉ (×10 vì API trả theo lượng)
async function fetchBrandHistory(chartSlug: string): Promise<number[] | null> {
  try {
    const res = await fetch(`https://giavang.tv/api/chart/${chartSlug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(6000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const sellData: [number, number][] = json?.sell ?? [];
    if (sellData.length === 0) return null;
    // sort theo timestamp, nhân ×10 để ra VND/chỉ (API trả VND/chỉ × 10⁶ → /10 = VND/chỉ × 10⁵?)
    // thực tế: sell[i][1] = 166.03 nghĩa là 166.03 × 10⁶ VND/lượng / 10 = 16.603.000 VND/chỉ
    const sorted = [...sellData].sort((a, b) => a[0] - b[0]);
    return sorted.map(([, v]) => Math.round(v * 100000)); // ×100000 → VND/chỉ
  } catch {
    return null;
  }
}

// Fallback: vang.today nếu giavang.tv fail
async function fetchVangTodayFallback(): Promise<any[] | null> {
  try {
    const res = await fetch('https://www.vang.today/api/prices?days=1', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: (AbortSignal as any).timeout(8000),
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const history: any[] = json?.history ?? [];
    if (history.length === 0) return null;
    const latest = [...history].sort((a, b) => b.date.localeCompare(a.date))[0];
    return Object.entries(latest.prices ?? {})
      .filter(([k]) => k !== 'XAUUSD')
      .map(([k, v]: [string, any]) => ({
        brand_slug: k.toLowerCase(),
        gold_type: v.name,
        category: 'bar',
        buy_price: v.buy,
        sell_price: v.sell,
        updated_at: latest.date,
        _source: 'vang.today',
      }))
      .filter((d: any) => d.sell_price > 0);
  } catch {
    return null;
  }
}

async function fetchGoldData() {
  // Tất cả fetch song song — bỏ world history 1 năm, chỉ lấy spot + tỷ giá + giá VN
  const [worldSpotResult, usdVndResult, tvPricesResult, ...histResults] = await Promise.allSettled([
    fetchWorldGoldSpot(),
    fetchUsdVndRate(),
    fetchGiavangTvPrices(),
    ...Object.entries(BRAND_CONFIG).map(([, cfg]) => fetchBrandHistory(cfg.chartSlug)),
  ]);

  // ── Vàng thế giới (spot) ──
  const worldSpot = worldSpotResult.status === 'fulfilled' ? worldSpotResult.value : null;
  const worldPrice = worldSpot?.price ?? 0;
  const worldChange = worldSpot?.change ?? 0;

  // ── Tỷ giá ──
  const { rate: usdVnd, source: usdVndSource } =
    usdVndResult.status === 'fulfilled' ? usdVndResult.value : { rate: FALLBACK_USD_VND, source: 'fallback' };

  // ── Giá thị trường VN ──
  let tvPrices: any[] | null = tvPricesResult.status === 'fulfilled' ? tvPricesResult.value : null;
  if (!tvPrices || tvPrices.length === 0) {
    tvPrices = await fetchVangTodayFallback();
  }

  // ── Lịch sử brands (cho RSI) ──
  const brandSlugs = Object.keys(BRAND_CONFIG);
  const brandHistories: Record<string, number[]> = {};
  brandSlugs.forEach((slug, i) => {
    const r = histResults[i];
    if (r?.status === 'fulfilled' && r.value && r.value.length >= 15) {
      brandHistories[slug] = r.value;
    }
  });

  const impliedPerChi = worldPrice > 0 && usdVnd > 0 ? Math.round((worldPrice * usdVnd) / OZ_PER_CHI / 1000) * 1000 : 0;

  return { worldPrice, worldChange, usdVnd, usdVndSource, impliedPerChi, tvPrices: tvPrices ?? [], brandHistories };
}

// ─── Main export ─────────────────────────────────────────────────

export async function getGoldPricesData(): Promise<GoldServiceResult> {
  const now = Date.now();
  let data: Awaited<ReturnType<typeof fetchGoldData>>;

  if (goldCache.data && now - goldCache.fetchedAt < GOLD_CACHE_TTL) {
    data = goldCache.data;
  } else {
    data = await fetchGoldData();
    goldCache = { data, fetchedAt: now };
  }

  const { worldPrice, worldChange, usdVnd, usdVndSource, impliedPerChi, tvPrices, brandHistories } = data;

  const fmt = (n: number) => n?.toLocaleString('vi-VN') + 'đ';

  function rsiLabel(rsi: number | null): string {
    if (rsi === null) return '';
    if (rsi >= 70) return `RSI ${rsi} 🔴 Quá mua`;
    if (rsi >= 55) return `RSI ${rsi} 📈 Tích cực`;
    if (rsi <= 30) return `RSI ${rsi} 🟢 Quá bán`;
    if (rsi <= 45) return `RSI ${rsi} 📉 Yếu`;
    return `RSI ${rsi} ➡️ Trung lập`;
  }

  // ── Build item cho từng brand × từng loại (bar / ring) ──
  const brandItems: GoldItem[] = [];

  for (const [slug, cfg] of Object.entries(BRAND_CONFIG)) {
    const records = tvPrices.filter((d: any) => d.brand_slug === slug);
    if (records.length === 0) continue;

    const history = brandHistories[slug] ?? [];
    const rsi14 = calcRsi14(history);
    const high30d = history.length > 0 ? Math.max(...history) : 0;
    const low30d = history.length > 0 ? Math.min(...history) : 0;

    // Dedup: ưu tiên HCM, sau đó record đầu tiên
    const dedup = (arr: any[]) => {
      const seen = new Set<string>();
      const out: any[] = [];
      // HCM first, then null/other regions
      const sorted = [...arr].sort((a, b) => {
        const aHcm = a.region?.includes('Hồ Chí Minh') ? 0 : 1;
        const bHcm = b.region?.includes('Hồ Chí Minh') ? 0 : 1;
        return aHcm - bHcm;
      });
      for (const r of sorted) {
        const key = r.gold_type;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(r);
        }
      }
      return out;
    };

    // Lấy 1 record bar và 1 record ring phù hợp nhất theo pattern
    const barRecords = dedup(records.filter((d: any) => d.category === 'bar'));
    const ringRecords = dedup(records.filter((d: any) => d.category === 'ring'));

    const barRecord = cfg.barPattern
      ? (barRecords.find((d: any) => cfg.barPattern!.test(d.gold_type)) ?? barRecords[0])
      : barRecords[0];
    const ringRecord = cfg.ringPattern
      ? (ringRecords.find((d: any) => cfg.ringPattern!.test(d.gold_type)) ?? ringRecords[0])
      : ringRecords[0];

    for (const record of [barRecord, ringRecord].filter(Boolean)) {
      if (!record || record.sell_price <= 0) continue;

      const buyPerChi = record.buy_price / 10;
      const sellPerChi = record.sell_price / 10;
      const isRing = record.category === 'ring';

      const posIn30dPct =
        high30d > low30d && sellPerChi > 0
          ? Math.round(((sellPerChi - low30d) / (high30d - low30d)) * 1000) / 10
          : null;
      const changePct = worldChange;

      const cost = buildCostAnalysis(buyPerChi, sellPerChi, impliedPerChi);
      const score = scoreGold(cost, rsi14);

      const id = `${slug}_${isRing ? 'ring' : 'bar'}`;
      const name = isRing ? `Nhẫn ${cfg.label} 999.9` : `Vàng miếng ${cfg.label}`;
      const tag = isRing ? `Nhẫn tròn trơn · ${cfg.label}` : `Vàng miếng · ${cfg.label}`;

      brandItems.push({
        id,
        name,
        tag,
        historySource: {
          asset: 'gold',
          source: slug,
          sourceType: 'direct',
          rangeType: 'days',
          defaultRange: 30,
          rangeOptions: [7, 14, 30],
        },
        price: sellPerChi,
        priceLabel: fmt(sellPerChi),
        buyPrice: buyPerChi,
        buyLabel: fmt(buyPerChi),
        change24h: changePct,
        note: [
          `Mua: ${fmt(buyPerChi)} · Bán: ${fmt(sellPerChi)}`,
          `Spread ${cost.spreadPct}% · Chi phí vào lệnh ${cost.totalEntryCostPct}%`,
          cost.premiumPct > 0 ? `Premium vs TG: +${cost.premiumPct}%${cost.premiumPct > 10 ? ' ⚠️' : ''}` : null,
          `Hoà vốn khi TG tăng ${cost.breakEvenPct}% · Nếu TG +3%: ${cost.profitIfWorldUp3Pct > 0 ? '+' : ''}${fmt(cost.profitIfWorldUp3Pct)}/chỉ`,
          rsi14 !== null ? rsiLabel(rsi14) : null,
          posIn30dPct !== null ? `${posIn30dPct}% dải 30 ngày` : null,
        ]
          .filter(Boolean)
          .join(' · '),
        badge: cost.premiumPct > 10 ? 'Premium cao' : isRing ? 'Linh hoạt' : 'Thanh khoản cao',
        badgeColor: cost.premiumPct > 10 ? 'amber' : isRing ? 'blue' : 'amber',
        score,
        costAnalysis: cost,
      });
    }
  }

  // ── Sort theo score, badge "Tốt nhất" cho rank 0 ──
  brandItems.sort(
    (a, b) =>
      b.score - a.score ||
      (BRAND_CONFIG[a.id.split('_')[0]]?.priority ?? 99) - (BRAND_CONFIG[b.id.split('_')[0]]?.priority ?? 99),
  );
  if (brandItems.length > 0) {
    brandItems[0].badge = 'Tốt nhất';
    brandItems[0].badgeColor = 'amber';
  }

  const bestBrand = brandItems[0] ?? null;
  const goldItems: GoldItem[] = brandItems.slice(0, 8);

  // ── Metrics ──
  const metrics: GoldMetrics = {
    usdVnd,
    usdVndSource,
    impliedPerChi,
    bestBuyId: bestBrand?.id ?? null,
    bestBuyPremiumPct: bestBrand?.costAnalysis?.premiumPct ?? null,
    bestBuySpreadPct: bestBrand?.costAnalysis?.spreadPct ?? null,
  };

  // ── Intro — tập trung vào thị trường VN ──
  const bestRsi = bestBrand ? calcRsi14(brandHistories[bestBrand.id.split('_')[0]] ?? []) : null;
  const rsiCtx =
    bestRsi !== null
      ? bestRsi <= 30
        ? ' Đang ở vùng quá bán — cơ hội tích lũy.'
        : bestRsi >= 70
          ? ' Đang ở vùng quá mua — cẩn thận vào mới.'
          : ''
      : '';
  const worldCtx =
    worldPrice > 0
      ? ` Giá TG tham chiếu: $${worldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz (tỷ giá ${usdVnd.toLocaleString('vi-VN')} VND/USD).`
      : '';
  const bestCtx = bestBrand
    ? `Lựa chọn tốt nhất hiện tại: ${bestBrand.name} — giá bán ${fmt(bestBrand.price!)}, spread ${bestBrand.costAnalysis?.spreadPct}%, chi phí vào lệnh ${bestBrand.costAnalysis?.totalEntryCostPct}%.${rsiCtx}`
    : 'Chưa có đủ dữ liệu giá thị trường.';

  const intro = `${bestCtx}${worldCtx} Giá quy đổi lý thuyết từ TG: ${fmt(impliedPerChi)}/chỉ.`;

  return { goldItems, intro, worldPrice, worldChange, metrics, cached: goldCache.fetchedAt !== now };
}

export function getGoldCache() {
  return goldCache;
}
