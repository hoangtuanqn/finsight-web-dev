/**
 * Corporate Bond (Trái phiếu Doanh nghiệp - TPDN) Service
 *
 * Scrapes the official HNX Corporate Bond Information Portal:
 * https://cb.hnx.vn — where all TPDN issuers must legally publish info.
 *
 * Data: issuer name, coupon rate, maturity date, remaining term, collateral status.
 * Cache: 4h business hours, 12h off-hours (TPDN data changes less frequently than TPCP).
 *
 * Fallback: if scraping fails, returns a curated static list of well-known bonds.
 */

import https from 'node:https';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CB_HNX_BASE = 'https://cb.hnx.vn';
// Main TPDN list pages — try both EN and VI versions
const CB_HNX_LIST_URLS = [
  `${CB_HNX_BASE}/en-gb/tpdn/tpdn-list.html`,
  `${CB_HNX_BASE}/vi-vn/tpdn/tpdn-list.html`,
  `${CB_HNX_BASE}/en-gb/home.html`,
];

const FETCH_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CorpBondItem {
  id: string;
  issuer: string; // company name
  coupon: number; // annual coupon rate %
  couponLabel: string; // e.g. "8.50%/năm"
  maturityDate: string; // YYYY-MM-DD
  termYears: number; // original term in years
  remainYears: number | null; // remaining years to maturity
  collateral: boolean; // has collateral asset
  sector: string; // e.g. "Bất động sản", "Ngân hàng"
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  note: string;
  badge: string;
  badgeColor: string;
  source: 'live' | 'static';
}

interface CacheEntry {
  data: CorpBondItem[];
  fetchedAt: number;
}

// ---------------------------------------------------------------------------
// Static fallback data (manually curated, updated quarterly)
// Chosen based on: credit quality, coupon attractiveness, sector diversity
// ---------------------------------------------------------------------------

const STATIC_CORP_BONDS: CorpBondItem[] = [
  {
    id: 'vdb_2024',
    issuer: 'Ngân hàng Phát triển Việt Nam (VDB)',
    coupon: 7.0,
    couponLabel: '7.00%/năm',
    maturityDate: '2027-12-31',
    termYears: 3,
    remainYears: 2,
    collateral: true,
    sector: 'Ngân hàng Chính sách',
    risk: 'LOW',
    note: 'TPDN được Chính phủ bảo lãnh, rủi ro tương đương TPCP. Lãi suất cố định, có tài sản đảm bảo.',
    badge: 'An toàn cao',
    badgeColor: 'green',
    source: 'static',
  },
  {
    id: 'vcb_sub_2025',
    issuer: 'Vietcombank (VCB)',
    coupon: 7.5,
    couponLabel: '7.50%/năm',
    maturityDate: '2030-06-30',
    termYears: 5,
    remainYears: 4,
    collateral: false,
    sector: 'Ngân hàng',
    risk: 'LOW',
    note: 'Trái phiếu ngân hàng thương mại Nhà nước, xếp hạng tín nhiệm cao. Lãi suất thả nổi theo TPCP.',
    badge: 'Uy tín',
    badgeColor: 'blue',
    source: 'static',
  },
  {
    id: 'mbb_2024',
    issuer: 'MBBank (MBB)',
    coupon: 8.0,
    couponLabel: '8.00%/năm',
    maturityDate: '2028-09-30',
    termYears: 4,
    remainYears: 2,
    collateral: false,
    sector: 'Ngân hàng',
    risk: 'MEDIUM',
    note: 'Trái phiếu ngân hàng tư nhân hàng đầu, kiểm toán Big4. Phù hợp nhà đầu tư muốn lãi suất cao hơn TPCP.',
    badge: 'Phổ biến',
    badgeColor: 'amber',
    source: 'static',
  },
  {
    id: 'vin_2024',
    issuer: 'Vingroup (VIC)',
    coupon: 9.5,
    couponLabel: '9.50%/năm',
    maturityDate: '2027-03-31',
    termYears: 3,
    remainYears: 1,
    collateral: true,
    sector: 'Bất động sản',
    risk: 'HIGH',
    note: 'Tập đoàn BĐS lớn nhất VN, có tài sản đảm bảo. Rủi ro cao hơn ngân hàng nhưng lãi suất hấp dẫn. Không phù hợp nhà đầu tư thận trọng.',
    badge: 'Lãi cao',
    badgeColor: 'orange',
    source: 'static',
  },
  {
    id: 'vhm_2025',
    issuer: 'Vinhomes (VHM)',
    coupon: 10.0,
    couponLabel: '10.00%/năm',
    maturityDate: '2028-06-30',
    termYears: 3,
    remainYears: 2,
    collateral: true,
    sector: 'Bất động sản',
    risk: 'HIGH',
    note: 'TPDN BĐS, có tài sản đảm bảo bằng quyền sử dụng đất dự án. Lãi suất cao, chỉ phù hợp khẩu vị rủi ro cao.',
    badge: 'Rủi ro cao',
    badgeColor: 'red',
    source: 'static',
  },
];

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let cache: CacheEntry | null = null;

// ---------------------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------------------

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const req = https.get(
      url,
      {
        agent,
        timeout: FETCH_TIMEOUT_MS,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          Accept: 'text/html,*/*',
          'Accept-Language': 'vi-VN,vi;q=0.9',
        },
      },
      (res) => {
        if ((res.statusCode ?? 0) >= 300 && (res.statusCode ?? 0) < 400 && res.headers.location) {
          res.resume();
          const absoluteUrl = new URL(res.headers.location, url).toString();
          fetchHtml(absoluteUrl).then(resolve).catch(reject);
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
        res.on('error', reject);
      },
    );
    req.on('timeout', () => req.destroy(new Error('cb.hnx.vn timeout')));
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRate(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '.').replace('%', '').replace(/\s/g, '');
  const n = parseFloat(cleaned);
  return isFinite(n) && n > 0 && n < 30 ? n : null;
}

function parseDate(raw: string): string | null {
  // Accepts dd/mm/yyyy or yyyy-mm-dd
  const dmyMatch = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  const ymMatch = raw.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymMatch) return raw.slice(0, 10);
  return null;
}

function remainingYears(maturityDate: string): number {
  const ms = new Date(maturityDate).getTime() - Date.now();
  return Math.max(0, Math.round((ms / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10);
}

function inferRisk(coupon: number, sector: string): 'LOW' | 'MEDIUM' | 'HIGH' {
  const sectorLower = sector.toLowerCase();
  if (sectorLower.includes('ngân hàng') || sectorLower.includes('bank')) {
    return coupon <= 8 ? 'LOW' : 'MEDIUM';
  }
  if (sectorLower.includes('bất động sản') || sectorLower.includes('real estate')) {
    return 'HIGH';
  }
  return coupon <= 8 ? 'MEDIUM' : 'HIGH';
}

function parseCbHnxHtml(html: string): CorpBondItem[] {
  const items: CorpBondItem[] = [];

  // Look for <tr> rows in any table containing bond info
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let row: RegExpExecArray | null;
  let idx = 0;

  while ((row = rowRegex.exec(html)) !== null) {
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    const cells: string[] = [];
    let cell: RegExpExecArray | null;
    while ((cell = cellRegex.exec(row[1])) !== null) {
      cells.push(stripTags(cell[1]));
    }

    // We expect at least 5 cells: issuer, coupon, maturity, term, collateral
    if (cells.length < 4) continue;

    // Heuristic: second cell looks like a coupon rate (3-15%)
    const coupon = parseRate(cells[1]) ?? parseRate(cells[2]);
    if (!coupon || coupon < 3 || coupon > 20) continue;

    // Third or fourth cell should be a date
    let maturityDate: string | null = null;
    let maturityIdx = -1;
    for (let i = 2; i < Math.min(cells.length, 6); i++) {
      const d = parseDate(cells[i]);
      if (d) {
        maturityDate = d;
        maturityIdx = i;
        break;
      }
    }
    if (!maturityDate) continue;

    const issuer = cells[0] || 'Không rõ';
    const termCell = maturityIdx >= 0 && maturityIdx + 1 < cells.length ? cells[maturityIdx + 1] : '';
    const termYears = parseInt(termCell) || 3;
    const hasCollateral = cells.some((c) => /tài sản|đảm bảo|collateral|có/i.test(c));
    const sector =
      cells.find((c) => /ngân hàng|bất động sản|năng lượng|sản xuất|tiêu dùng|bank|real estate/i.test(c)) || 'Khác';
    const risk = inferRisk(coupon, sector);
    const rem = remainingYears(maturityDate);

    items.push({
      id: `cb_${idx++}`,
      issuer: issuer.slice(0, 80),
      coupon,
      couponLabel: `${coupon.toFixed(2)}%/năm`,
      maturityDate,
      termYears,
      remainYears: rem,
      collateral: hasCollateral,
      sector: sector.slice(0, 40),
      risk,
      note: `${hasCollateral ? 'Có tài sản đảm bảo · ' : ''}Còn ${rem.toFixed(1)} năm đến đáo hạn · Nguồn: cb.hnx.vn`,
      badge: risk === 'LOW' ? 'An toàn' : risk === 'MEDIUM' ? 'Trung bình' : 'Rủi ro cao',
      badgeColor: risk === 'LOW' ? 'green' : risk === 'MEDIUM' ? 'amber' : 'red',
      source: 'live',
    });

    if (items.length >= 20) break;
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a list of TPDN items filtered and sorted by risk level.
 *
 * Risk mapping:
 *   LOW    → show only LOW risk corp bonds (bank-guaranteed, VDB)
 *   MEDIUM → show LOW + MEDIUM (banks, diversified)
 *   HIGH   → show all including HIGH (BĐS, higher coupon)
 */
export async function getCorpBondsForRisk(riskLevel: string): Promise<CorpBondItem[]> {
  const allBonds = await fetchAllCorpBonds();

  const allowed: Record<string, string[]> = {
    LOW: ['LOW'],
    MEDIUM: ['LOW', 'MEDIUM'],
    HIGH: ['LOW', 'MEDIUM', 'HIGH'],
  };

  const risks = allowed[riskLevel] ?? allowed.MEDIUM;

  return allBonds
    .filter((b) => risks.includes(b.risk))
    .sort((a, b) => a.coupon - b.coupon) // ascending coupon within risk band
    .slice(0, 5);
}

async function fetchAllCorpBonds(): Promise<CorpBondItem[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  // Try scraping each URL until we get usable data
  for (const url of CB_HNX_LIST_URLS) {
    try {
      const html = await fetchHtml(url);
      const items = parseCbHnxHtml(html);
      if (items.length >= 3) {
        cache = { data: items, fetchedAt: now };
        console.info(`[corpBond] scraped ${items.length} TPDN from ${url}`);
        return items;
      }
    } catch (err: any) {
      console.warn(`[corpBond] scrape failed for ${url}: ${err.message}`);
    }
  }

  // Fallback: use static data
  console.warn('[corpBond] using static fallback data');
  const staticWithRemain = STATIC_CORP_BONDS.map((b) => ({
    ...b,
    remainYears: remainingYears(b.maturityDate),
  }));
  cache = { data: staticWithRemain, fetchedAt: now };
  return staticWithRemain;
}
