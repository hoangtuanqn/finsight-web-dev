/**
 * Bonds Asset Guide Service
 */

import { fetchVietnamGovBondAuctionHistory, getLatestVietnamGovBondYields } from '../vietnamBondHistory.service.js';
import { getCorpBondsForRisk, type CorpBondItem } from './corpBond.service.js';

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface GovBondDef {
  term: string;
  tenor: number;
  rate: number; // fallback rate if live data unavailable
  liquidity: string;
  risk: string;
  badge: string;
  badgeColor: string;
  source: string;
}

interface BondFundDef {
  id: string;
  name: string;
  manager: string;
  returnEst: string;
  minInvest: string;
  badge: string;
  badgeColor: string;
  note: string;
  benchmarkSource: string;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BondItem {
  id: string;
  name: string;
  tag: string;
  type: 'gov' | 'corp' | 'fund';
  historySource: Record<string, any>;
  rate: number | null;
  rateLabel: string;
  change: null;
  note: string;
  badge: string;
  badgeColor: string;
}

export interface BondsServiceResult {
  bondItems: BondItem[];
  intro: string;
  updatedAt: string;
  vnBondUpdatedAt: string;
  riskLevel: string;
  corpBondCount: number;
}

// ---------------------------------------------------------------------------
// Static definitions
// ---------------------------------------------------------------------------

const GOV_BONDS: GovBondDef[] = [
  {
    term: '2 năm',
    tenor: 2,
    rate: 3.2,
    liquidity: 'Cao',
    risk: 'Thấp',
    badge: 'Linh hoạt',
    badgeColor: 'green',
    source: 'vn_gov_2y',
  },
  {
    term: '3 năm',
    tenor: 3,
    rate: 3.55,
    liquidity: 'Cao',
    risk: 'Thấp',
    badge: 'Cân bằng',
    badgeColor: 'green',
    source: 'vn_gov_3y',
  },
  {
    term: '5 năm',
    tenor: 5,
    rate: 3.83,
    liquidity: 'Trung bình',
    risk: 'Thấp',
    badge: 'Khuyên dùng',
    badgeColor: 'purple',
    source: 'vn_gov_5y',
  },
  {
    term: '10 năm',
    tenor: 10,
    rate: 4.15,
    liquidity: 'Cao',
    risk: 'Thấp',
    badge: 'Ưu tiên',
    badgeColor: 'amber',
    source: 'vn_gov_10y',
  },
  {
    term: '15 năm',
    tenor: 15,
    rate: 4.23,
    liquidity: 'Trung bình',
    risk: 'Thấp',
    badge: 'Dài hạn',
    badgeColor: 'purple',
    source: 'vn_gov_15y',
  },
];

const BOND_FUNDS: BondFundDef[] = [
  {
    id: 'vcbf_fif',
    name: 'Quỹ VCBF-FIF',
    manager: 'Vietcombank Fund Mgmt',
    returnEst: '6.0-7.0',
    minInvest: '1 triệu',
    badge: 'Uy tín',
    badgeColor: 'blue',
    note: 'Quỹ thu nhập cố định, benchmark TPCP 10 năm',
    benchmarkSource: 'vn_gov_10y',
  },
  {
    id: 'ssibf',
    name: 'Quỹ SSIBF',
    manager: 'SSI AM',
    returnEst: '6.0-7.0',
    minInvest: '1 triệu',
    badge: 'Trái phiếu',
    badgeColor: 'amber',
    note: 'Quỹ trái phiếu SSI, benchmark TPCP 10Y',
    benchmarkSource: 'vn_gov_10y',
  },
  {
    id: 'mbbond',
    name: 'Quỹ MBBOND',
    manager: 'MB Capital',
    returnEst: '6.0-7.0',
    minInvest: '1 triệu',
    badge: 'Tiện lợi',
    badgeColor: 'blue',
    note: 'Mua qua app MBBank, phí thấp',
    benchmarkSource: 'vn_gov_10y',
  },
  {
    id: 'tcbf',
    name: 'Quỹ TCBF',
    manager: 'Techcom Capital',
    returnEst: '6.0-6.8',
    minInvest: '1 triệu',
    badge: '',
    badgeColor: '',
    note: 'Mua qua Techcombank',
    benchmarkSource: 'vn_gov_10y',
  },
];

const PREFER_TERMS: Record<string, string[]> = {
  LOW: ['10 năm', '15 năm', '5 năm', '3 năm', '2 năm'],
  MEDIUM: ['5 năm', '3 năm', '10 năm', '2 năm', '15 năm'],
  HIGH: ['2 năm', '3 năm', '5 năm', '10 năm', '15 năm'],
};

const TERM_ADVICE: Record<string, string> = {
  LOW: 'kỳ hạn dài 5–15 năm để chốt lãi suất cao',
  MEDIUM: 'kỳ hạn trung 3–5 năm để cân bằng rủi ro và lợi suất',
  HIGH: 'kỳ hạn ngắn 2–3 năm để giữ tính thanh khoản',
};

const CORP_BOND_QUOTA: Record<string, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

export async function getBondsRatesData(riskLevel: string): Promise<BondsServiceResult> {
  let vnBondHistory: any = null;
  let latestVnYields: Record<number, number> = {};

  try {
    vnBondHistory = await fetchVietnamGovBondAuctionHistory(3);
    latestVnYields = getLatestVietnamGovBondYields(vnBondHistory);
    if (vnBondHistory?.stale) {
      console.warn('[bonds.service] vbma-history-stale-or-empty');
    }
  } catch (err: any) {
    console.warn(`[bonds.service] vbma-history-unavailable: ${err.message}`);
  }

  const govBondData = GOV_BONDS.map((bond) => ({
    ...bond,
    rate: latestVnYields[bond.tenor] ?? bond.rate,
  }));

  const terms = PREFER_TERMS[riskLevel] ?? PREFER_TERMS.MEDIUM;
  const sortedGov = [...govBondData].sort((a, b) => {
    const ai = terms.indexOf(a.term);
    const bi = terms.indexOf(b.term);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const govItems: BondItem[] = sortedGov.slice(0, 3).map((g, i) => ({
    id: `gov_${g.source}`,
    name: `Trái phiếu Chính phủ ${g.term}`,
    tag: `TPCP · ${g.liquidity} · Rủi ro ${g.risk}`,
    type: 'gov' as const,
    historySource: { asset: 'bonds', source: g.source, sourceType: 'officialAuction' },
    rate: g.rate,
    rateLabel: `${g.rate.toFixed(2)}%/năm`,
    change: null,
    note: `Yield đấu thầu VBMA/HNX · Thanh khoản ${g.liquidity.toLowerCase()} · Mua qua TCBS, SSI, MBBank tối thiểu 100k`,
    badge: i === 0 ? 'Ưu tiên' : g.badge,
    badgeColor: i === 0 ? 'amber' : g.badgeColor,
  }));

  let corpItems: BondItem[] = [];
  const corpQuota = CORP_BOND_QUOTA[riskLevel] ?? 0;

  if (corpQuota > 0) {
    try {
      const corpBonds = await getCorpBondsForRisk(riskLevel);
      corpItems = corpBonds.slice(0, corpQuota).map((cb: CorpBondItem) => ({
        id: `corp_${cb.id}`,
        name: cb.issuer,
        tag: `TPDN · ${cb.sector} · Đáo hạn ${cb.maturityDate.slice(0, 7)}`,
        type: 'corp' as const,
        historySource: { asset: 'bonds', source: 'cb_hnx', sourceType: 'corpBond' },
        rate: cb.coupon,
        rateLabel: cb.couponLabel,
        change: null,
        note: cb.note,
        badge: cb.badge,
        badgeColor: cb.badgeColor,
      }));
    } catch (err: any) {
      console.warn(`[bonds.service] corp-bond-unavailable: ${err.message}`);
    }
  }

  const fundItems: BondItem[] = BOND_FUNDS.slice(0, 2).map((f) => ({
    id: f.id,
    name: f.name,
    tag: `Quỹ · ${f.manager}`,
    type: 'fund' as const,
    historySource: {
      asset: 'bonds',
      source: f.benchmarkSource,
      sourceType: 'proxy',
      sourceLabel: 'Benchmark TPCP 10Y',
    },
    rate: null,
    rateLabel: `~${f.returnEst}%/năm`,
    change: null,
    note: `${f.note} · Đầu tư từ ${f.minInvest}`,
    badge: f.badge,
    badgeColor: f.badgeColor,
  }));

  const bondItems: BondItem[] = [...govItems, ...corpItems, ...fundItems];

  const fiveYearRate = govBondData.find((b) => b.term === '5 năm')?.rate;
  const tenYearRate = govBondData.find((b) => b.term === '10 năm')?.rate;
  const riskLabel = riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao';

  let intro =
    `TPCP Việt Nam kỳ hạn 5 năm đang ở ${fiveYearRate?.toFixed(2) ?? '--'}%/năm, 10 năm ở ${tenYearRate?.toFixed(2) ?? '--'}%/năm. ` +
    `Với khẩu vị ${riskLabel}, nên chọn ${TERM_ADVICE[riskLevel] ?? TERM_ADVICE.MEDIUM}.`;

  if (corpQuota > 0 && corpItems.length > 0) {
    intro += ` Ngoài ra, ${corpItems.length} trái phiếu doanh nghiệp được chọn lọc với lãi suất ${corpItems[0].rateLabel} phù hợp bổ sung danh mục.`;
  }

  const updatedAt = vnBondHistory?.updatedAt ?? new Date().toISOString().slice(0, 10);

  return {
    bondItems,
    intro,
    updatedAt,
    vnBondUpdatedAt: updatedAt,
    riskLevel,
    corpBondCount: corpItems.length,
  };
}
