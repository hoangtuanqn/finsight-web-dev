import https from 'node:https';

// Bond yields change slowly — TPCP auctions run once per week (Wednesdays on HNX).
// No need for sub-hour refresh cycles.
const VBMA_CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const VBMA_FETCH_TIMEOUT_MS = 8000;
const VBMA_FETCH_BUDGET_MS = 20000;
const VBMA_TARGET_TENORS = [2, 3, 5, 10, 15];
const VBMA_TARGET_TENOR_SET = new Set(VBMA_TARGET_TENORS);

interface CacheData {
  data: any;
  fetchedAt: number;
  months: number;
}

interface BondYieldRow {
  tenor: number;
  value: number;
  sourceUrl: string;
  sourceLabel: string;
  date: string;
  month: string;
}

let vbmaAuctionCache: CacheData = { data: null, fetchedAt: 0, months: 0 };

function fetchVbmaHtml(url: string, redirectsLeft: number = 2): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        rejectUnauthorized: false,
        timeout: VBMA_FETCH_TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'text/html',
          'Accept-Encoding': 'identity',
        },
      },
      (response) => {
        const status = response.statusCode || 0;
        const location = response.headers.location;

        if (status >= 300 && status < 400 && location && redirectsLeft > 0) {
          response.resume();
          const redirectedUrl = new URL(location, url).toString();
          resolve(fetchVbmaHtml(redirectedUrl, redirectsLeft - 1));
          return;
        }

        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          resolve({ status, body });
        });
      },
    );

    request.on('timeout', () => {
      request.destroy(new Error('VBMA request timed out'));
    });
    request.on('error', reject);
  });
}

function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function subtractUtcMonths(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, date.getUTCDate()));
}

function getWeeklyAuctionDates(months: number, now: Date = new Date()): Date[] {
  const end = toUtcDateOnly(now);
  const start = subtractUtcMonths(end, months);
  const first = toUtcDateOnly(start);
  const daysUntilWednesday = (3 - first.getUTCDay() + 7) % 7;
  first.setUTCDate(first.getUTCDate() + daysUntilWednesday);

  const dates: Date[] = [];
  for (const current = new Date(first); current <= end; current.setUTCDate(current.getUTCDate() + 7)) {
    dates.push(new Date(current));
  }
  return dates.reverse();
}

function buildDateSlugVariants(date: Date): string[] {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');

  return [
    ...new Set([`${day}-${month}-${year}`, `${dd}-${month}-${year}`, `${day}-${mm}-${year}`, `${dd}-${mm}-${year}`]),
  ];
}

function buildVbmaAuctionUrls(date: Date): string[] {
  const slugPrefix = 'ket-qua-dau-thau-trai-phieu-chinh-phu-ngay';
  return buildDateSlugVariants(date).flatMap((slug) => [
    `https://vbma.org.vn/en/activities/${slugPrefix}-${slug}`,
    `https://vbma.org.vn/vi/activities/${slugPrefix}-${slug}`,
  ]);
}

function parseAuctionNumber(value: any): number | null {
  if (!value || value === '-') return null;
  const normalized = String(value)
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatSourceLabel(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `VBMA ${day}/${month}/${year}`;
}

/**
 * Parses a VBMA auction result page.
 */
function parseVbmaAuctionPage(html: string, date: Date, sourceUrl: string): Record<number, any> | null {
  const text = stripHtml(html);
  const yields: Record<number, any> = {};

  // Pattern A: "TD{code} {tenor} ... {winVol} {winYield}"
  const patternA = /\bTD[A-Z0-9]+\s+(\d{1,2})\s+[\d.,-]+\s+[\d.,-]+\s+([\d.,-]+)\s+([\d.,-]+)/g;
  for (const m of text.matchAll(patternA)) {
    const tenor = Number.parseInt(m[1], 10);
    const winYield = parseAuctionNumber(m[3]);
    if (!VBMA_TARGET_TENOR_SET.has(tenor)) continue;
    if (winYield === null || winYield <= 0 || winYield > 20) continue;
    yields[tenor] = {
      tenor,
      value: winYield,
      sourceUrl,
      sourceLabel: formatSourceLabel(date),
      date: date.toISOString().slice(0, 10),
      month: date.toISOString().slice(0, 7),
    };
  }

  if (Object.keys(yields).length > 0) return yields;

  // Pattern B: lines containing "X năm" followed by yield numbers
  const patternB =
    /(\d{1,2})\s+n[aă]m[^\d]*(\d{1,3}[.,]?\d*)\s+(\d{1,3}[.,]?\d*)\s+(\d{1,3}[.,]?\d*)\s+(\d{1,2}[.,]\d+)/g;
  for (const m of text.matchAll(patternB)) {
    const tenor = Number.parseInt(m[1], 10);
    const winYield = parseAuctionNumber(m[5]);
    if (!VBMA_TARGET_TENOR_SET.has(tenor)) continue;
    if (winYield === null || winYield <= 0 || winYield > 20) continue;
    if (yields[tenor]) continue;
    yields[tenor] = {
      tenor,
      value: winYield,
      sourceUrl,
      sourceLabel: formatSourceLabel(date),
      date: date.toISOString().slice(0, 10),
      month: date.toISOString().slice(0, 7),
    };
  }

  return Object.keys(yields).length > 0 ? yields : null;
}

async function fetchVbmaAuctionForDate(date: Date, startedAt: number): Promise<Record<number, any> | null> {
  for (const url of buildVbmaAuctionUrls(date)) {
    if (Date.now() - startedAt > VBMA_FETCH_BUDGET_MS) return null;
    try {
      const response = await fetchVbmaHtml(url);
      if (response.status < 200 || response.status >= 300) continue;

      const parsed = parseVbmaAuctionPage(response.body, date, url);
      if (parsed) return parsed;
    } catch {
      // Try next
    }
  }
  return null;
}

async function mapLimit<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function aggregateMonthlyAuctions(auctionRows: any[]): Record<string, any[]> {
  const byTenor: Record<number, Map<string, any>> = Object.fromEntries(
    VBMA_TARGET_TENORS.map((tenor) => [tenor, new Map()]),
  );

  const sortedRows: BondYieldRow[] = (
    auctionRows.filter(Boolean).flatMap((yields) => Object.values(yields)) as BondYieldRow[]
  ).sort((a: any, b: any) => a.date.localeCompare(b.date));

  for (const row of sortedRows) {
    byTenor[row.tenor].set(row.month, {
      month: row.month,
      value: row.value,
      sourceLabel: row.sourceLabel,
      sourceUrl: row.sourceUrl,
    });
  }

  return Object.fromEntries(VBMA_TARGET_TENORS.map((tenor) => [String(tenor), [...byTenor[tenor].values()]]));
}

export function getLatestVietnamGovBondYields(history: any) {
  const seriesByTenor = history?.seriesByTenor || {};
  return Object.fromEntries(
    VBMA_TARGET_TENORS.map((tenor) => {
      const series = seriesByTenor[String(tenor)] || [];
      const latest = series.at(-1);
      return [tenor, latest?.value ?? null];
    }),
  );
}

export async function fetchVietnamGovBondAuctionHistory(months: number = 18) {
  const now = Date.now();
  if (
    vbmaAuctionCache.data &&
    vbmaAuctionCache.months >= months &&
    now - vbmaAuctionCache.fetchedAt < VBMA_CACHE_TTL_MS
  ) {
    return { ...vbmaAuctionCache.data, cached: true };
  }

  const startedAt = Date.now();
  const dates = getWeeklyAuctionDates(months);
  const auctionRows = await mapLimit(dates, 6, (date) => fetchVbmaAuctionForDate(date, startedAt));
  const seriesByTenor = aggregateMonthlyAuctions(auctionRows);
  const totalPoints = Object.values(seriesByTenor).reduce((sum, series) => sum + series.length, 0);

  if (totalPoints === 0) {
    if (vbmaAuctionCache.data) {
      return { ...vbmaAuctionCache.data, cached: true, stale: true };
    }
    return {
      seriesByTenor,
      updatedAt: null,
      dataSource: 'VBMA auction result pages',
      cached: false,
      stale: true,
    };
  }

  const latestMonth = Object.values(seriesByTenor)
    .flat()
    .map((point: any) => point.month)
    .sort()
    .at(-1);

  const data = {
    seriesByTenor,
    updatedAt: latestMonth,
    dataSource: 'VBMA auction result pages',
    cached: false,
    stale: false,
  };

  vbmaAuctionCache = { data, fetchedAt: now, months };
  return data;
}
