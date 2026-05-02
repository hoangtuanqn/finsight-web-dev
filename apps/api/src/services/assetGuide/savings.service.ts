/**
 * Savings (Tiền gửi Tiết kiệm) Service
 *
 * Fetches real-time bank interest rates from CafeF/Mediacdn.
 * Source: https://cafefnew.mediacdn.vn/Images/Uploaded/DuLieuDownload/Liveboard/all_banks_interest_rates.json
 *
 * Cache: 1h TTL (rates don't change hourly).
 */

import https from 'node:https';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SavingsItem {
  id: string;
  name: string;
  tag: string;
  rate: number;
  rateLabel: string;
  rateCounter: number;
  rateCounterLabel: string;
  note: string;
  badge: string;
  badgeColor: string;
  tier: 'big4' | 'mid' | 'small';
  allRates: Record<string, number>;
}

export interface SavingsServiceResult {
  savingsItems: SavingsItem[];
  intro: string;
  updatedAt: string;
  riskLevel: string;
}

interface RawRate {
  time: string; // "1T", "3T", etc.
  deposit: number; // month count
  value: number | null;
}

interface RawBank {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  interestRates: RawRate[];
}

interface CacheEntry {
  data: RawBank[];
  fetchedAt: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FETCH_URL = 'https://cafefnew.mediacdn.vn/Images/Uploaded/DuLieuDownload/Liveboard/all_banks_interest_rates.json';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1h
const FETCH_TIMEOUT_MS = 8000;

const TENOR_KEYS = ['t12', 't18', 't24'];
const TENOR_LABEL: Record<string, string> = {
  t12: '12 tháng',
  t18: '18 tháng',
  t24: '24 tháng',
};

const RISK_TENOR_PREF: Record<string, string[]> = {
  LOW: ['t24', 't18', 't12'],
  MEDIUM: ['t12', 't18', 't24'],
  HIGH: ['t12', 't18', 't24'],
};

const BIG4_SYMBOLS = new Set(['VCB', 'BID', 'AGB', 'VTB', 'CTG']);
const MID_SYMBOLS = new Set(['ACB', 'TCB', 'VPB', 'MBB', 'HDB', 'VIB', 'TPB', 'MSB', 'LPB', 'SHB', 'STB']);

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let cache: CacheEntry | null = null;

// ---------------------------------------------------------------------------
// Logic
// ---------------------------------------------------------------------------

async function fetchRawData(): Promise<RawBank[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  return new Promise((resolve, reject) => {
    https
      .get(FETCH_URL, { timeout: FETCH_TIMEOUT_MS }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8');
            const json = JSON.parse(body);
            const data = json.Data || [];
            cache = { data, fetchedAt: now };
            resolve(data);
          } catch (e) {
            reject(new Error('Failed to parse savings JSON'));
          }
        });
      })
      .on('error', (e) => {
        if (cache) {
          console.warn('[savings.service] fetch failed, using stale cache');
          resolve(cache.data);
        } else {
          reject(e);
        }
      })
      .on('timeout', () => {
        if (cache) {
          console.warn('[savings.service] timeout, using stale cache');
          resolve(cache.data);
        } else {
          reject(new Error('Savings fetch timeout'));
        }
      });
  });
}

function mapRawBankToRates(raw: RawBank): Record<string, number> {
  const rates: Record<string, number> = {};
  for (const r of raw.interestRates) {
    const key = `t${r.deposit}`;
    if (TENOR_KEYS.includes(key) && r.value) {
      rates[key] = r.value;
    }
  }
  return rates;
}

function getBankTier(symbol: string): 'big4' | 'mid' | 'small' {
  if (BIG4_SYMBOLS.has(symbol)) return 'big4';
  if (MID_SYMBOLS.has(symbol)) return 'mid';
  return 'small';
}

function getBankNote(name: string, tier: string): string {
  if (tier === 'big4') return `${name} là ngân hàng Nhà nước, an toàn tuyệt đối, phù hợp gửi số tiền lớn.`;
  if (tier === 'mid') return `${name} là ngân hàng thương mại uy tín, dịch vụ online tốt, lãi suất cân bằng.`;
  return `${name} thường có lãi suất cạnh tranh cao hơn mặt bằng chung, phù hợp tối ưu lợi nhuận.`;
}

export async function getSavingsRatesData(riskLevel: string): Promise<SavingsServiceResult> {
  const rawBanks = await fetchRawData();
  const preferTenors = RISK_TENOR_PREF[riskLevel] || RISK_TENOR_PREF.MEDIUM;
  const primaryTenor = preferTenors[0];

  const processed = rawBanks
    .map((rb) => {
      const rates = mapRawBankToRates(rb);
      const tier = getBankTier(rb.symbol);
      return {
        rb,
        rates,
        tier,
        primaryRate: rates[primaryTenor] || 0,
      };
    })
    .filter((p) => p.primaryRate > 0);

  // Sorting logic based on risk
  const sorted = [...processed].sort((a, b) => {
    if (riskLevel === 'LOW') {
      // For LOW risk, Big4 and Mid-tier are preferred even if rate is slightly lower
      const tierScore = (t: string) => (t === 'big4' ? 0.5 : t === 'mid' ? 0.2 : 0);
      return b.primaryRate + tierScore(b.tier) - (a.primaryRate + tierScore(a.tier));
    }
    // For MEDIUM/HIGH, prioritize absolute rate
    return b.primaryRate - a.primaryRate;
  });

  const items: SavingsItem[] = sorted.slice(0, 6).map((p, i) => {
    const otherRates = preferTenors
      .slice(1)
      .map((t) => (p.rates[t] ? `${TENOR_LABEL[t]}: ${p.rates[t].toFixed(1)}%` : null))
      .filter(Boolean)
      .join(' · ');

    const note = getBankNote(p.rb.name, p.tier) + (otherRates ? ` · ${otherRates}` : '');

    return {
      id: p.rb.symbol.toLowerCase(),
      name: p.rb.name,
      tag: `Online ${TENOR_LABEL[primaryTenor]}`,
      rate: p.primaryRate,
      rateLabel: `${p.primaryRate.toFixed(2)}%/năm`,
      rateCounter: p.primaryRate - 0.2, // Rough estimate as API usually shows online
      rateCounterLabel: `${(p.primaryRate - 0.2).toFixed(2)}%/năm (tại quầy)`,
      note,
      badge: i === 0 ? 'Tốt nhất' : p.tier === 'big4' ? 'Big4' : p.tier === 'mid' ? 'Uy tín' : 'Lãi cao',
      badgeColor: i === 0 ? 'amber' : p.tier === 'big4' ? 'purple' : p.tier === 'mid' ? 'blue' : 'emerald',
      tier: p.tier,
      allRates: p.rates,
    };
  });

  const maxRate = items.length > 0 ? items[0].rate : 0;
  const riskLabel = riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao';
  const tenorAdvice = riskLevel === 'LOW' ? '18–24 tháng' : riskLevel === 'MEDIUM' ? '6–12 tháng' : '1–3 tháng';

  const intro =
    `Lãi suất tiết kiệm online tốt nhất hiện tại lên tới **${maxRate.toFixed(2)}%/năm**. ` +
    `Bạn có thể chọn xem nhanh các kỳ hạn **12, 18 và 24 tháng** để tối ưu hóa lợi nhuận dài hạn.`;

  return {
    savingsItems: items,
    intro,
    updatedAt: new Date(cache?.fetchedAt || Date.now()).toISOString().slice(0, 10),
    riskLevel,
  };
}
