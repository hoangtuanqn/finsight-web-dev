import https from 'node:https';

const VBMA_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const VBMA_FETCH_TIMEOUT_MS = 1200;
const VBMA_FETCH_BUDGET_MS = 12000;
const VBMA_TARGET_TENORS = [5, 10, 15];
const VBMA_TARGET_TENOR_SET = new Set(VBMA_TARGET_TENORS);

let vbmaAuctionCache = { data: null, fetchedAt: 0, months: 0 };

function fetchVbmaHtml(url, redirectsLeft = 2) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      // VBMA currently serves a certificate chain Node does not verify reliably on Windows.
      rejectUnauthorized: false,
      timeout: VBMA_FETCH_TIMEOUT_MS,
      headers: {
        'User-Agent': 'Mozilla/5.0',
        Accept: 'text/html',
        'Accept-Encoding': 'identity',
      },
    }, (response) => {
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
    });

    request.on('timeout', () => {
      request.destroy(new Error('VBMA request timed out'));
    });
    request.on('error', reject);
  });
}

function toUtcDateOnly(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function subtractUtcMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - months, date.getUTCDate()));
}

function getWeeklyAuctionDates(months, now = new Date()) {
  const end = toUtcDateOnly(now);
  const start = subtractUtcMonths(end, months);
  const first = toUtcDateOnly(start);
  const daysUntilWednesday = (3 - first.getUTCDay() + 7) % 7;
  first.setUTCDate(first.getUTCDate() + daysUntilWednesday);

  const dates = [];
  for (const current = new Date(first); current <= end; current.setUTCDate(current.getUTCDate() + 7)) {
    dates.push(new Date(current));
  }
  return dates.reverse();
}

function buildDateSlugVariants(date) {
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');

  return [...new Set([
    `${day}-${month}-${year}`,
    `${dd}-${month}-${year}`,
    `${day}-${mm}-${year}`,
    `${dd}-${mm}-${year}`,
  ])];
}

function buildVbmaAuctionUrls(date) {
  const slugPrefix = 'ket-qua-dau-thau-trai-phieu-chinh-phu-ngay';
  return buildDateSlugVariants(date).flatMap((slug) => [
    `https://vbma.org.vn/en/activities/${slugPrefix}-${slug}`,
    `https://vbma.org.vn/vi/activities/${slugPrefix}-${slug}`,
  ]);
}

function parseAuctionNumber(value) {
  if (!value || value === '-') return null;
  const normalized = String(value)
    .replace(/\u00a0/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatSourceLabel(date) {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `VBMA ${day}/${month}/${year}`;
}

function parseVbmaAuctionPage(html, date, sourceUrl) {
  const text = stripHtml(html);
  const rowRegex = /\bTD\d+\s+(\d{1,2})\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)\s+([\d.,-]+)/g;
  const yields = {};
  let match;

  while ((match = rowRegex.exec(text)) !== null) {
    const tenor = Number.parseInt(match[1], 10);
    if (!VBMA_TARGET_TENOR_SET.has(tenor)) continue;

    const winningValue = parseAuctionNumber(match[4]);
    const winningYield = parseAuctionNumber(match[5]);
    if (!Number.isFinite(winningYield) || winningYield <= 0) continue;
    if (winningValue != null && winningValue <= 0) continue;

    yields[tenor] = {
      tenor,
      value: winningYield,
      sourceUrl,
      sourceLabel: formatSourceLabel(date),
      date: date.toISOString().slice(0, 10),
      month: date.toISOString().slice(0, 7),
    };
  }

  return Object.keys(yields).length > 0 ? yields : null;
}

async function fetchVbmaAuctionForDate(date, startedAt) {
  for (const url of buildVbmaAuctionUrls(date)) {
    if (Date.now() - startedAt > VBMA_FETCH_BUDGET_MS) return null;
    try {
      const response = await fetchVbmaHtml(url);
      if (response.status < 200 || response.status >= 300) continue;

      const parsed = parseVbmaAuctionPage(response.body, date, url);
      if (parsed) return parsed;
    } catch {
      // Try the next URL variant.
    }
  }
  return null;
}

async function mapLimit(items, limit, mapper) {
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

function aggregateMonthlyAuctions(auctionRows) {
  const byTenor = Object.fromEntries(VBMA_TARGET_TENORS.map((tenor) => [tenor, new Map()]));

  const sortedRows = auctionRows
    .filter(Boolean)
    .flatMap((yields) => Object.values(yields))
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const row of sortedRows) {
    byTenor[row.tenor].set(row.month, {
      month: row.month,
      value: row.value,
      sourceLabel: row.sourceLabel,
      sourceUrl: row.sourceUrl,
    });
  }

  return Object.fromEntries(
    VBMA_TARGET_TENORS.map((tenor) => [String(tenor), [...byTenor[tenor].values()]])
  );
}

export function getLatestVietnamGovBondYields(history) {
  const seriesByTenor = history?.seriesByTenor || {};
  return Object.fromEntries(
    VBMA_TARGET_TENORS.map((tenor) => {
      const series = seriesByTenor[String(tenor)] || [];
      const latest = series.at(-1);
      return [tenor, latest?.value ?? null];
    })
  );
}

export async function fetchVietnamGovBondAuctionHistory(months = 18) {
  const now = Date.now();
  if (
    vbmaAuctionCache.data
    && vbmaAuctionCache.months >= months
    && now - vbmaAuctionCache.fetchedAt < VBMA_CACHE_TTL_MS
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
    .map((point) => point.month)
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
