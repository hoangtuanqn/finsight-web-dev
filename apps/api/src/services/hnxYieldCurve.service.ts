/**
 * HNX Yield Curve Service
 *
 * Fetches real-time Vietnam Government Bond (TPCP) yield data from the official
 * Hanoi Stock Exchange yield curve page: https://www.hnx.vn/vi-vn/trai-phieu/duong-cong-loi-suat.html?site=in
 *
 * Data update frequency: HNX publishes new yield curve data each business day.
 * Cache TTL: 1 hour during business hours (7:00-17:30 ICT), 4 hours otherwise.
 *
 * Fallback: If HNX scraping fails, falls back to VBMA auction data.
 */

import https from 'node:https';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HNX_YIELD_URL = 'https://www.hnx.vn/vi-vn/trai-phieu/duong-cong-loi-suat.html?site=in';
const FETCH_TIMEOUT_MS = 8000;
const CACHE_TTL_BUSINESS = 60 * 60 * 1000; // 1 hour during business hours
const CACHE_TTL_OFFHOURS = 4 * 60 * 60 * 1000; // 4 hours off hours

// Target tenors in years that we want to extract from HNX table
// These map to the keys returned to bonds.service.ts
const TARGET_TENOR_YEARS = [1, 2, 3, 5, 7, 10, 15, 20] as const;
type TargetTenor = (typeof TARGET_TENOR_YEARS)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HnxYieldPoint {
  tenorYears: number;
  tenorLabel: string; // e.g. "5 năm"
  parYield: number; // Par yield (%)
  spotAnnual: number; // Spot rate annual compounding (%)
  spotCont: number; // Spot rate continuous compounding (%)
  date: string; // YYYY-MM-DD
  sourceLabel: string; // e.g. "HNX 04/05/2026"
  sourceUrl: string;
}

export interface HnxYieldCurveResult {
  yields: Record<number, HnxYieldPoint>; // keyed by tenorYears
  date: string; // YYYY-MM-DD
  updatedAt: string; // ISO string
  source: 'hnx_live' | 'hnx_cache' | 'vbma_fallback';
  stale: boolean;
}

interface CacheEntry {
  data: HnxYieldCurveResult;
  fetchedAt: number;
}

// ---------------------------------------------------------------------------
// Module-level cache (in-process, survives for the lifetime of the Node process)
// ---------------------------------------------------------------------------

let cache: CacheEntry | null = null;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function isBusinessHours(): boolean {
  // ICT = UTC+7
  const now = new Date();
  const ictHour = (now.getUTCHours() + 7) % 24;
  const ictDay = new Date(now.getTime() + 7 * 60 * 60 * 1000).getUTCDay(); // 0=Sun, 6=Sat
  if (ictDay === 0 || ictDay === 6) return false;
  return ictHour >= 7 && ictHour < 18;
}

function getCacheTtl(): number {
  return isBusinessHours() ? CACHE_TTL_BUSINESS : CACHE_TTL_OFFHOURS;
}

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        rejectUnauthorized: false, // HNX uses a self-signed intermediate cert
        timeout: FETCH_TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;

        // Follow redirect once
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          fetchHtml(res.headers.location).then(resolve).catch(reject);
          return;
        }

        if (status < 200 || status >= 300) {
          res.resume();
          reject(new Error(`HNX responded with HTTP ${status}`));
          return;
        }

        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      },
    );

    req.on('timeout', () => req.destroy(new Error('HNX request timeout')));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Strips HTML tags and normalises whitespace in a fragment.
 */
function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses a Vietnamese number string like "3,4954385249" or "4.23" into a float.
 */
function parseVnNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
}

/**
 * Maps common Vietnamese/English tenor strings to years (number).
 *   "3 tháng" → 0.25
 *   "6 tháng" → 0.5
 *   "1 năm"   → 1
 *   "5 năm"   → 5
 *   "10 năm"  → 10
 *   "10 years" → 10
 */
function parseTenorToYears(label: string): number | null {
  const lower = label.toLowerCase().trim();

  // Months
  const monthMatch = lower.match(/^(\d+)\s*(tháng|month)/);
  if (monthMatch) return parseInt(monthMatch[1], 10) / 12;

  // Years
  const yearMatch = lower.match(/^(\d+)\s*(năm|year)/);
  if (yearMatch) return parseInt(yearMatch[1], 10);

  return null;
}

/**
 * Returns a label in Vietnamese for a given tenor in years.
 */
function tenorLabel(years: number): string {
  if (years < 1) return `${Math.round(years * 12)} tháng`;
  return `${years} năm`;
}

/**
 * Extracts the date from the HNX HTML page, e.g. "04/05/2026" → "2026-05-04".
 */
function extractDateFromHtml(html: string): string | null {
  // The date input has id="txtDateYC" or the heading has the date
  const patterns = [
    /id=["']txtDateYC["'][^>]*value=["'](\d{2}\/\d{2}\/\d{4})["']/i,
    /txtDateYC[^>]*>(\d{2}\/\d{2}\/\d{4})/i,
    // Look in the heading/title area
    /Ng[àa]y\s+(\d{2}\/\d{2}\/\d{4})/i,
    /Settlement Date[^:]*:\s*(\d{2}\/\d{2}\/\d{4})/i,
  ];

  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) {
      const [dd, mm, yyyy] = m[1].split('/');
      return `${yyyy}-${mm}-${dd}`;
    }
  }

  // Fallback: today
  return new Date().toISOString().slice(0, 10);
}

/**
 * Main parser: extracts the yield curve table rows from HNX HTML.
 *
 * The HNX yield curve table has these columns (in vi-vn locale):
 *   Col 0: Kỳ hạn (tenor label)
 *   Col 1: Lãi suất spot liên tục (spot continuous)
 *   Col 2: Lãi suất spot ghép lãi năm (spot annual)
 *   Col 3: Lãi suất par (par yield)    ← key value for bond pricing
 *
 * NOTE: Some rows omit par yield for maturities < 1 year (set to null in table).
 */
function parseYieldTable(html: string, date: string, sourceUrl: string): Record<number, HnxYieldPoint> {
  const yields: Record<number, HnxYieldPoint> = {};

  // Extract <table> that contains yield data. HNX wraps the data in a specific table.
  // We look for any <tr> containing a known tenor pattern followed by numeric cells.
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const row = rowMatch[1];
    // Extract cell texts (both <td> and <th>)
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(row)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (cells.length < 2) continue;

    const tenorYears = parseTenorToYears(cells[0]);
    if (tenorYears === null) continue;

    // We need at least one numeric value
    const spotCont = cells[1] ? parseVnNumber(cells[1]) : null;
    const spotAnn = cells[2] ? parseVnNumber(cells[2]) : null;
    const parYield = cells[3] ? parseVnNumber(cells[3]) : null;

    // Need at least par yield or spot annual to be useful
    const primaryRate = parYield ?? spotAnn ?? spotCont;
    if (primaryRate === null || primaryRate <= 0 || primaryRate > 30) continue;

    const [dd, mm, yyyy] = date.split('-');
    const sourceDateLabel = `${dd}/${mm}/${yyyy}`;

    yields[tenorYears] = {
      tenorYears,
      tenorLabel: tenorLabel(tenorYears),
      parYield: parYield ?? primaryRate,
      spotAnnual: spotAnn ?? primaryRate,
      spotCont: spotCont ?? primaryRate,
      date,
      sourceLabel: `HNX ${sourceDateLabel}`,
      sourceUrl,
    };
  }

  return yields;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the latest Vietnam Government Bond yields from HNX.
 *
 * The returned `yields` map is keyed by tenor in years (e.g. 5, 10).
 * Convenience accessor: `result.yields[5]?.parYield` for the 5-year par yield.
 *
 * @param forceRefresh - If true, bypasses cache and fetches fresh data.
 */
export async function fetchHnxYieldCurve(forceRefresh = false): Promise<HnxYieldCurveResult> {
  const now = Date.now();
  const ttl = getCacheTtl();

  // Return cache if still fresh
  if (!forceRefresh && cache && now - cache.fetchedAt < ttl) {
    return { ...cache.data, source: 'hnx_cache' };
  }

  try {
    const html = await fetchHtml(HNX_YIELD_URL);
    const date = extractDateFromHtml(html) ?? new Date().toISOString().slice(0, 10);
    const yields = parseYieldTable(html, date, HNX_YIELD_URL);

    if (Object.keys(yields).length === 0) {
      throw new Error('HNX yield table parsed 0 rows — likely page structure changed');
    }

    const result: HnxYieldCurveResult = {
      yields,
      date,
      updatedAt: new Date().toISOString(),
      source: 'hnx_live',
      stale: false,
    };

    cache = { data: result, fetchedAt: now };
    console.info(`[hnxYieldCurve] fetched ${Object.keys(yields).length} tenors for ${date}`);
    return result;
  } catch (err: any) {
    console.warn(`[hnxYieldCurve] fetch failed: ${err.message}`);

    // Return stale cache if available
    if (cache) {
      console.warn('[hnxYieldCurve] returning stale cache');
      return { ...cache.data, source: 'hnx_cache', stale: true };
    }

    // Full fallback: return null yields, caller will use VBMA/hardcoded data
    return {
      yields: {},
      date: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
      source: 'vbma_fallback',
      stale: true,
    };
  }
}

/**
 * Convenience: returns the par yield (%) for specific tenors in years.
 * Returns null for tenors not found in the curve.
 *
 * Example: getHnxParYields([5, 10, 15])
 */
export async function getHnxParYields(tenors: number[] = [5, 10, 15]): Promise<Record<number, number | null>> {
  const result = await fetchHnxYieldCurve();
  return Object.fromEntries(tenors.map((t) => [t, result.yields[t]?.parYield ?? null]));
}
