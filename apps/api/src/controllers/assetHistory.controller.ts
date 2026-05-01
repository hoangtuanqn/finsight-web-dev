import { Response } from 'express';
import { success, error } from '../utils/apiResponse';
import { fetchAssetHistory } from '../services/historicalData.service';
import {
  fetchVietnamGovBondAuctionHistory,
} from '../services/vietnamBondHistory.service';
import { AuthenticatedRequest } from '../types';

function shortUserId(userId: string | undefined): string {
  return String(userId || 'unknown').slice(0, 8);
}

// ─── Asset history source registry ───────────────────────────

const ASSET_HISTORY_MONTH_OPTIONS = new Set([6, 12, 18]);
const ASSET_HISTORY_DAY_OPTIONS = new Set([7, 14, 30]);

function makeGiavangTvSource(slug: string, name: string) {
  return {
    asset: 'gold',
    source: slug,
    sourceType: 'direct',
    provider: 'giavangTv',
    rangeType: 'days',
    rangeOptions: [7, 14, 30],
    defaultRange: 30,
    chartSlug: slug,
    name,
    metric: { key: 'price', unit: 'VND/chỉ', changeUnit: 'percent', decimals: 0 },
    dataSource: 'giavang.tv daily sell price',
  };
}

const ASSET_HISTORY_SOURCES: Record<string, any> = {
  gold: {
    world: {
      asset: 'gold',
      source: 'world',
      sourceType: 'direct',
      provider: 'yahoo',
      rangeType: 'months',
      ticker: 'GC=F',
      name: 'Vàng thế giới (GC=F)',
      metric: { key: 'price', unit: 'USD/oz', changeUnit: 'percent', decimals: 1 },
      dataSource: 'Yahoo Finance monthly close',
    },
    sjc:          makeGiavangTvSource('sjc',           'Vàng SJC'),
    sjc_bar:      makeGiavangTvSource('sjc',           'Vàng miếng SJC'),
    sjc_ring:     makeGiavangTvSource('sjc',           'Nhẫn SJC 999.9'),
    doji:         makeGiavangTvSource('doji',          'Vàng DOJI'),
    doji_bar:     makeGiavangTvSource('doji',          'Vàng miếng DOJI'),
    doji_ring:    makeGiavangTvSource('doji',          'Nhẫn DOJI 999.9'),
    pnj:          makeGiavangTvSource('pnj',           'Vàng PNJ'),
    pnj_bar:      makeGiavangTvSource('pnj',           'Vàng miếng PNJ'),
    pnj_ring:     makeGiavangTvSource('pnj',           'Nhẫn PNJ 999.9'),
    btmc:         makeGiavangTvSource('baotinminhchau','Vàng Bảo Tín Minh Châu'),
    btmc_bar:     makeGiavangTvSource('baotinminhchau','Vàng miếng Bảo Tín Minh Châu'),
    btmc_ring:    makeGiavangTvSource('baotinminhchau','Nhẫn Bảo Tín Minh Châu 999.9'),
    phuquy:       makeGiavangTvSource('phuquy',        'Vàng Phú Quý'),
    phuquy_bar:   makeGiavangTvSource('phuquy',        'Vàng miếng Phú Quý'),
    phuquy_ring:  makeGiavangTvSource('phuquy',        'Nhẫn Phú Quý 999.9'),
    ngoctham:     makeGiavangTvSource('ngoctham',      'Vàng Ngọc Thẩm'),
    ngoctham_bar: makeGiavangTvSource('ngoctham',      'Vàng miếng Ngọc Thẩm'),
    ngoctham_ring:makeGiavangTvSource('ngoctham',      'Nhẫn Ngọc Thẩm 999.9'),
    kimnganphuc:      makeGiavangTvSource('kimnganphuc','Vàng Kim Ngân Phúc'),
    kimnganphuc_ring: makeGiavangTvSource('kimnganphuc','Nhẫn Kim Ngân Phúc 999.9'),
    ring: {
      asset: 'gold',
      source: 'ring',
      sourceType: 'direct',
      provider: 'vangToday',
      rangeType: 'days',
      rangeOptions: [7, 14, 30],
      defaultRange: 30,
      goldType: 'BT9999NTT',
      name: 'Nhẫn tròn trơn 9999',
      metric: { key: 'price', unit: 'VND/chỉ', changeUnit: 'percent', decimals: 0 },
      dataSource: 'vang.today daily sell price',
    },
  },
  bonds: {
    vn_gov_5y: {
      asset: 'bonds',
      source: 'vn_gov_5y',
      sourceType: 'officialAuction',
      provider: 'vbmaAuction',
      rangeType: 'months',
      tenor: 5,
      name: 'TPCP Việt Nam 5 năm',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'VBMA auction result pages',
    },
    vn_gov_10y: {
      asset: 'bonds',
      source: 'vn_gov_10y',
      sourceType: 'officialAuction',
      provider: 'vbmaAuction',
      rangeType: 'months',
      tenor: 10,
      name: 'TPCP Việt Nam 10 năm',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'VBMA auction result pages',
    },
    vn_gov_15y: {
      asset: 'bonds',
      source: 'vn_gov_15y',
      sourceType: 'officialAuction',
      provider: 'vbmaAuction',
      rangeType: 'months',
      tenor: 15,
      name: 'TPCP Việt Nam 15 năm',
      metric: { key: 'yield', unit: '%', changeUnit: 'percentagePoint', decimals: 2 },
      dataSource: 'VBMA auction result pages',
    },
  },
};

interface StockMeta {
  ticker: string;
  name: string;
  sector: string;
  tag: string;
}

const STOCK_UNIVERSE: StockMeta[] = [
  { ticker: 'VCB.VN',  name: 'Vietcombank',       sector: 'Ngân hàng',    tag: 'VN30 · Bluechip' },
  { ticker: 'BID.VN',  name: 'BIDV',               sector: 'Ngân hàng',    tag: 'VN30 · Bluechip' },
  { ticker: 'CTG.VN',  name: 'VietinBank',         sector: 'Ngân hàng',    tag: 'VN30 · Bluechip' },
  { ticker: 'TCB.VN',  name: 'Techcombank',        sector: 'Ngân hàng',    tag: 'VN30 · Tăng trưởng' },
  { ticker: 'MBB.VN',  name: 'MBBank',             sector: 'Ngân hàng',    tag: 'VN30 · Tăng trưởng' },
  { ticker: 'FPT.VN',  name: 'FPT Corporation',    sector: 'Công nghệ',    tag: 'VN30 · Tech leader' },
  { ticker: 'VNM.VN',  name: 'Vinamilk',           sector: 'Tiêu dùng',    tag: 'VN30 · Phòng thủ' },
  { ticker: 'MSN.VN',  name: 'Masan Group',        sector: 'Tiêu dùng',    tag: 'VN30 · Đa ngành' },
  { ticker: 'MWG.VN',  name: 'Mobile World (MWG)', sector: 'Bán lẻ',       tag: 'VN30 · Bán lẻ' },
  { ticker: 'HPG.VN',  name: 'Hòa Phát Group',     sector: 'Thép',         tag: 'VN30 · Chu kỳ' },
  { ticker: 'VHM.VN',  name: 'Vinhomes',           sector: 'Bất động sản', tag: 'VN30 · BĐS lớn' },
  { ticker: 'VIC.VN',  name: 'Vingroup',            sector: 'Đa ngành',    tag: 'VN30 · Tập đoàn' },
  { ticker: 'E1VFVN30.VN', name: 'ETF E1VFVN30',  sector: 'ETF',          tag: 'Passive · Theo VN30' },
  { ticker: 'FUEVFVND.VN', name: 'ETF DCVFMVN Diamond', sector: 'ETF',    tag: 'Passive · Diamond' },
  { ticker: 'ACB.VN',  name: 'ACB Bank',           sector: 'Ngân hàng',    tag: 'Mid-cap · Tăng trưởng' },
  { ticker: 'REE.VN',  name: 'REE Corporation',    sector: 'Hạ tầng',      tag: 'Mid-cap · Cổ tức tốt' },
  { ticker: 'PNJ.VN',  name: 'PNJ',                sector: 'Trang sức',    tag: 'Mid-cap · Bán lẻ' },
  { ticker: 'DGC.VN',  name: 'Đức Giang Chemicals',sector: 'Hóa chất',     tag: 'Mid-cap · Xuất khẩu' },
];

// ─── Helpers ────────────────────────────────────────────────────

function normalizeHistoryMonths(value: any): number {
  const months = Number.parseInt(value as string, 10);
  return ASSET_HISTORY_MONTH_OPTIONS.has(months) ? months : 12;
}

function normalizeHistoryDays(value: any): number {
  const days = Number.parseInt(value as string, 10);
  return ASSET_HISTORY_DAY_OPTIONS.has(days) ? days : 30;
}

function normalizeHistorySourceType(value: any, fallback: string): string {
  const normalized = String(value || '').trim();
  return ['direct', 'officialCurve', 'officialAuction', 'proxy'].includes(normalized)
    ? normalized
    : fallback;
}

function resolveStockMeta(rawTicker: any) {
  const raw = String(rawTicker || '').trim().toUpperCase();
  if (!raw) return null;

  const withSuffix = raw.endsWith('.VN') ? raw : `${raw}.VN`;
  return STOCK_UNIVERSE.find((meta) => {
    const ticker = meta.ticker.toUpperCase();
    const symbol = ticker.replace('.VN', '');
    return ticker === withSuffix || symbol === raw;
  });
}

function resolveAssetHistorySource(asset: string, query: any) {
  if (asset === 'stocks') {
    const meta = resolveStockMeta(query.ticker || query.symbol);
    if (!meta) return null;

    return {
      asset,
      source: 'ticker',
      ticker: meta.ticker,
      symbol: meta.ticker.replace('.VN', ''),
      name: meta.name,
      sector: meta.sector,
      metric: { key: 'price', unit: 'VND', changeUnit: 'percent', decimals: 0 },
      dataSource: 'Yahoo Finance monthly close',
      sourceType: 'direct',
      rangeType: 'months',
    };
  }

  const src = String(query.source || '').trim().toLowerCase();
  const sourceConfig = ASSET_HISTORY_SOURCES[asset]?.[src];
  if (!sourceConfig) return null;

  return {
    ...sourceConfig,
    sourceType: normalizeHistorySourceType(query.sourceType, sourceConfig.sourceType),
    sourceLabel: query.sourceLabel || sourceConfig.sourceLabel,
  };
}

function roundHistoryValue(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function buildMonthlyHistoryRows(rawHistory: any, months: number, metric: any) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;
  const rows = rawHistory.timestamps.map((timestamp: number, index: number) => {
    const value = roundHistoryValue(rawHistory.closes[index], decimals);
    const previousClose = index > 0 ? rawHistory.closes[index - 1] : null;
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const monthNumber = date.getUTCMonth() + 1;
    const month = `${year}-${String(monthNumber).padStart(2, '0')}`;
    const label = `${String(monthNumber).padStart(2, '0')}/${String(year).slice(-2)}`;
    const change = previousClose
      ? metric?.changeUnit === 'percentagePoint'
        ? value - previousClose
        : ((value - previousClose) / previousClose) * 100
      : 0;
    const roundedChange = Number(change.toFixed(2));

    return { month, label, value, close: value, change: roundedChange, changePct: roundedChange };
  });

  return rows.slice(-months);
}

function buildDailyHistoryRows(rawHistory: any, days: number, metric: any) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;

  // giavang.tv timestamps are midnight Vietnam time (UTC+7).
  // Reading with getUTC* would shift the date back by 7h → wrong day label.
  // Add 7h offset so the local date matches Vietnam date before extracting parts.
  const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

  const rows = rawHistory.timestamps.map((timestamp: number, index: number) => {
    const value = roundHistoryValue(rawHistory.closes[index], decimals);
    const previousClose = index > 0 ? rawHistory.closes[index - 1] : null;
    const date = new Date(timestamp * 1000 + VN_OFFSET_MS);
    const year = date.getUTCFullYear();
    const monthNumber = date.getUTCMonth() + 1;
    const dayNumber = date.getUTCDate();
    const month = `${year}-${String(monthNumber).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const label = `${String(dayNumber).padStart(2, '0')}/${String(monthNumber).padStart(2, '0')}`;
    const change = previousClose
      ? metric?.changeUnit === 'percentagePoint'
        ? value - previousClose
        : ((value - previousClose) / previousClose) * 100
      : 0;
    const roundedChange = Number(change.toFixed(2));

    return { month, label, value, close: value, change: roundedChange, changePct: roundedChange };
  });

  return rows.slice(-days);
}

function buildMonthlyPointRows(series: any[], months: number, metric: any) {
  const decimals = Number.isInteger(metric?.decimals) ? metric.decimals : 2;
  const rows = series.map((point, index) => {
    const value = roundHistoryValue(point.value, decimals);
    const previousClose = index > 0 ? series[index - 1].value : null;
    const parts = point.month.split('-');
    const year = parts[0];
    const monthNumber = parts[1];
    const change = previousClose
      ? metric?.changeUnit === 'percentagePoint'
        ? value - previousClose
        : ((value - previousClose) / previousClose) * 100
      : 0;
    const roundedChange = Number(change.toFixed(2));

    return {
      month: point.month,
      label: `${monthNumber}/${String(year).slice(-2)}`,
      value,
      close: value,
      change: roundedChange,
      changePct: roundedChange,
      sourceLabel: point.sourceLabel,
      sourceUrl: point.sourceUrl,
    };
  });

  return rows.slice(-months);
}

function parseMarketNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return Number.NaN;

  const hasThousandSuffix = /k/i.test(value);
  const cleaned = value
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(/,(?=\d{3}(\D|$))/g, '')
    .replace(',', '.');

  const parsed = Number.parseFloat(cleaned);
  return hasThousandSuffix ? parsed * 1000 : parsed;
}

function normalizeMarketTimestamp(value: any): number | null {
  if (typeof value === 'number') return value > 1_000_000_000_000 ? Math.floor(value / 1000) : value;
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeMarketTimestamp(numeric);

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  }
  return null;
}

async function fetchGiavangTvHistory(source: any, days: number) {
  try {
    const res = await fetch(`https://giavang.tv/api/chart/${encodeURIComponent(source.chartSlug)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(8000) : undefined,
    });
    if (!res.ok) return null;
    const json: any = await res.json();
    const sellData: [number, number][] = json?.sell ?? [];
    if (sellData.length < 2) return null;

    // DEBUG: log first 3 raw entries to inspect timestamp format
    console.log('[giavangTv] raw sell sample:', sellData.slice(0, 3));

    // sort theo timestamp tăng dần, lấy `days` ngày gần nhất
    // giavang.tv trả timestamp dạng milliseconds (13 chữ số) → chuẩn hoá về seconds
    const sorted = [...sellData].sort((a, b) => a[0] - b[0]).slice(-days);
    const normalized = sorted.map(([ts, v]) => {
      const tsSeconds = ts > 1_000_000_000_000 ? Math.floor(ts / 1000) : ts;
      console.log('[giavangTv] ts:', ts, '→ sec:', tsSeconds, '→ date:', new Date(tsSeconds * 1000).toISOString());
      return [tsSeconds, v] as [number, number];
    });
    return {
      timestamps: normalized.map(([ts]) => ts),
      closes:     normalized.map(([, v]) => Math.round(v * 100000)),
    };
  } catch { return null; }
}

async function fetchVangTodayHistory(source: any, days: number) {
  const url = `https://www.vang.today/api/prices?type=${encodeURIComponent(source.goldType)}&days=${days}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
    signal: (AbortSignal as any).timeout ? (AbortSignal as any).timeout(10000) : undefined,
  });

  if (!response.ok) {
    console.warn(`[InvestmentAdvisor] vang.today ${source.goldType}: HTTP ${response.status}`);
    return null;
  }

  const json: any = await response.json();
  const candidates = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.history)
    ? json.history
    : Array.isArray(json?.prices)
    ? json.prices
    : [];

  const byDay = new Map<string, any>();
  for (const row of candidates) {
    const nestedPrice = row.prices?.[source.goldType] || row.price?.[source.goldType] || row[source.goldType] || row;
    const timestamp = normalizeMarketTimestamp(
      row.update_time
      ?? nestedPrice.update_time
      ?? row.timestamp
      ?? row.time
      ?? row.date
    );
    const rawSell = nestedPrice.sell ?? nestedPrice.close ?? nestedPrice.price ?? nestedPrice.value ?? nestedPrice.buy;
    const sell = parseMarketNumber(rawSell);
    if (!timestamp || !Number.isFinite(sell) || sell <= 0) continue;

    const dateKey = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const previous = byDay.get(dateKey);
    if (!previous || timestamp >= previous.timestamp) {
      byDay.set(dateKey, { timestamp, close: sell / 10 });
    }
  }

  const rows = [...byDay.values()].sort((a, b) => a.timestamp - b.timestamp);
  if (rows.length < 2) {
    console.warn(`[InvestmentAdvisor] vang.today ${source.goldType}: insufficient history (${rows.length} points)`);
    return null;
  }

  return {
    timestamps: rows.map((row) => row.timestamp),
    closes: rows.map((row) => row.close),
  };
}

// ─── Controller ─────────────────────────────────────────────────

export async function getAssetHistory(req: AuthenticatedRequest, res: Response) {
  const startedAt = Date.now();
  try {
    const asset = String(req.query.asset || 'stocks').toLowerCase();
    const source = resolveAssetHistorySource(asset, req.query);

    if (!source) {
      if (asset === 'savings') {
        return error(res, 'Tiết kiệm chưa có dữ liệu lịch sử theo tháng đã kiểm chứng', 400);
      }
      return error(res, 'Nguồn lịch sử tài sản không được hỗ trợ', 400);
    }

    const rangeType = source.rangeType === 'days' ? 'days' : 'months';
    const rangeValue = rangeType === 'days'
      ? normalizeHistoryDays(req.query.days)
      : normalizeHistoryMonths(req.query.months);

    console.info(
      `[InvestmentAdvisor] asset-history:start user=${shortUserId(req.userId)} asset=${source.asset} source=${source.source} provider=${source.provider || 'unknown'} metric=${source.metric.key} ${rangeType}=${rangeValue}`
    );

    let history: any[] = [];
    let dynamicUpdatedAt: string | null = null;
    let dynamicDataSource = source.dataSource;
    if (source.provider === 'vbmaAuction') {
      const vnBondHistory = await fetchVietnamGovBondAuctionHistory(18);
      const series = vnBondHistory.seriesByTenor?.[String(source.tenor)] || [];
      if (vnBondHistory?.stale || series.length === 0) {
        console.warn(`[InvestmentAdvisor] asset-history:vbma-source-unavailable source=${source.source} tenor=${source.tenor}`);
      }
      history = buildMonthlyPointRows(series, rangeValue, source.metric);
      dynamicUpdatedAt = vnBondHistory.updatedAt;
      dynamicDataSource = vnBondHistory.dataSource || source.dataSource;
    } else {
      const rawHistory: any = source.provider === 'giavangTv'
        ? await fetchGiavangTvHistory(source, rangeValue)
        : source.provider === 'vangToday'
        ? await fetchVangTodayHistory(source, rangeValue)
        : await fetchAssetHistory(source.ticker);

      if (!rawHistory) {
        console.warn(`[InvestmentAdvisor] asset-history:no-data asset=${source.asset} source=${source.source} provider=${source.provider || 'yahoo'}`);
        return error(res, 'Không có dữ liệu lịch sử cho nguồn này', 502);
      }

      history = rangeType === 'days'
        ? buildDailyHistoryRows(rawHistory, rangeValue, source.metric)
        : buildMonthlyHistoryRows(rawHistory, rangeValue, source.metric);
    }

    if (history.length === 0) {
      return error(res, 'Không đủ dữ liệu lịch sử để hiển thị biểu đồ', 404);
    }

    console.info(
      `[InvestmentAdvisor] asset-history:complete user=${shortUserId(req.userId)} asset=${source.asset} source=${source.source} metric=${source.metric.key} points=${history.length} durationMs=${Date.now() - startedAt}`
    );

    return success(res, {
      asset: source.asset,
      source: source.source,
      sourceType: source.sourceType,
      sourceLabel: source.sourceLabel,
      ticker: source.ticker,
      symbol: source.symbol,
      name: source.name,
      sector: source.sector,
      metric: source.metric,
      rangeType,
      [rangeType]: rangeValue,
      history,
      updatedAt: dynamicUpdatedAt || new Date().toISOString(),
      dataSource: dynamicDataSource,
    });
  } catch (err: any) {
    console.error('getAssetHistory error:', err.message);
    return error(res, 'Không thể lấy dữ liệu lịch sử tài sản');
  }
}
