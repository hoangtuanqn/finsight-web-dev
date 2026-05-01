import {
  fetchVietnamGovBondAuctionHistory,
  getLatestVietnamGovBondYields,
} from '../vietnamBondHistory.service';

interface BondData {
  term: string;
  tenor: number;
  rate: number;
  liquidity: string;
  risk: string;
  badge: string;
  badgeColor: string;
  source: string;
}

interface BondFund {
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

export interface BondItem {
  id: string;
  name: string;
  tag: string;
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
}

const BONDS_DATA: { updatedAt: string; govBonds: BondData[]; bondFunds: BondFund[] } = {
  updatedAt: '2026-04-22',
  govBonds: [
    { term: '5 năm',  tenor: 5,  rate: 3.83, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Khuyên dùng', badgeColor: 'purple', source: 'vn_gov_5y'  },
    { term: '10 năm', tenor: 10, rate: 4.15, liquidity: 'Cao',         risk: 'Thấp', badge: 'Ưu tiên',    badgeColor: 'amber',  source: 'vn_gov_10y' },
    { term: '15 năm', tenor: 15, rate: 4.23, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Dài hạn',    badgeColor: 'purple', source: 'vn_gov_15y' },
  ],
  bondFunds: [
    { id: 'vcbf_fif', name: 'Quỹ VCBF-FIF', manager: 'Vietcombank Fund Management', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Uy tín',    badgeColor: 'blue',  note: 'Quỹ thu nhập cố định, benchmark TPCP Việt Nam 10 năm', benchmarkSource: 'vn_gov_10y' },
    { id: 'ssibf',    name: 'Quỹ SSIBF',    manager: 'SSI AM',                       returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Trái phiếu', badgeColor: 'amber', note: 'Quỹ trái phiếu SSI, dùng benchmark TPCP 10 năm khi chưa có NAV history ổn định', benchmarkSource: 'vn_gov_10y' },
    { id: 'mbbond',   name: 'Quỹ MBBOND',   manager: 'MB Capital',                   returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Tiện lợi',   badgeColor: 'blue',  note: 'Mua qua app MBBank, phí thấp, cần collector NAV nếu muốn chart trực tiếp', benchmarkSource: 'vn_gov_10y' },
    { id: 'tcbf',     name: 'Quỹ TCBF',     manager: 'Techcom Capital',              returnEst: '6.0-6.8', minInvest: '1 triệu', badge: '',            badgeColor: '',      note: 'Mua qua Techcombank, cần collector NAV nếu muốn chart trực tiếp', benchmarkSource: 'vn_gov_10y' },
  ],
};

const PREFER_TERMS: Record<string, string[]> = {
  LOW:    ['10 năm', '15 năm', '5 năm'],
  MEDIUM: ['5 năm', '10 năm', '15 năm'],
  HIGH:   ['5 năm', '10 năm', '15 năm'],
};

const TERM_ADVICE: Record<string, string> = {
  LOW:    'kỳ hạn dài 5–15 năm để chốt lãi',
  MEDIUM: 'kỳ hạn trung 3–5 năm cân bằng rủi ro',
  HIGH:   'kỳ hạn ngắn 2–3 năm giữ linh hoạt',
};

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
    console.warn(`[bonds.service] vbma-history-unavailable ${err.message}`);
  }

  const govBondData = BONDS_DATA.govBonds.map((bond) => ({
    ...bond,
    rate: latestVnYields[bond.tenor] || bond.rate,
  }));

  const terms = PREFER_TERMS[riskLevel] || PREFER_TERMS.MEDIUM;
  const sortedGov = [...govBondData].sort((a, b) => {
    const ai = terms.indexOf(a.term);
    const bi = terms.indexOf(b.term);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const bondItems: BondItem[] = [
    ...sortedGov.slice(0, 3).map((g, i) => ({
      id:   `gov_${g.term}`,
      name: `Trái phiếu Chính phủ ${g.term}`,
      tag:  `TPCP · ${g.liquidity} · Rủi ro ${g.risk}`,
      historySource: { asset: 'bonds', source: g.source, sourceType: 'officialAuction' },
      rate:      g.rate,
      rateLabel: `${g.rate.toFixed(2)}%/năm`,
      change:    null,
      note:  `Yield trúng thầu VBMA/HNX mới nhất · thanh khoản ${g.liquidity.toLowerCase()} · mua qua TCBS, SSI, MBBank tối thiểu 100k`,
      badge:      i === 0 ? 'Ưu tiên' : g.badge,
      badgeColor: i === 0 ? 'amber'   : g.badgeColor,
    })),
    ...BONDS_DATA.bondFunds.slice(0, 2).map((f) => ({
      id:   f.id,
      name: f.name,
      tag:  `Quỹ · ${f.manager}`,
      historySource: {
        asset:       'bonds',
        source:      f.benchmarkSource,
        sourceType:  'proxy',
        sourceLabel: 'Benchmark TPCP 10Y',
      },
      rate:      null,
      rateLabel: `~${f.returnEst}%/năm`,
      change:    null,
      note:      `${f.note} · Đầu tư từ ${f.minInvest}`,
      badge:      f.badge,
      badgeColor: f.badgeColor,
    })),
  ];

  const currentFiveYearRate  = govBondData.find(b => b.term === '5 năm')?.rate;
  const currentTenYearRate   = govBondData.find(b => b.term === '10 năm')?.rate;
  const riskLabel = riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao';

  const intro = `TPCP Việt Nam kỳ hạn 5 năm đang ở ${currentFiveYearRate?.toFixed(2)}%/năm, 10 năm ở ${currentTenYearRate?.toFixed(2)}%/năm. `
    + `Với khẩu vị ${riskLabel}, `
    + `nên chọn ${TERM_ADVICE[riskLevel] || TERM_ADVICE.MEDIUM}.`;

  const updatedAt = vnBondHistory?.updatedAt || BONDS_DATA.updatedAt;

  return {
    bondItems,
    intro,
    updatedAt,
    vnBondUpdatedAt: updatedAt,
    riskLevel,
  };
}
