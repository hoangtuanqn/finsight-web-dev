import { Request, Response } from 'express';
import { success, error } from '../utils/apiResponse';
import {
  fetchVietnamGovBondAuctionHistory,
  getLatestVietnamGovBondYields,
} from '../services/vietnamBondHistory.service';

// ─── Bonds ───────────────────────────────────────────────────────

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

const BONDS_DATA: { updatedAt: string; govBonds: BondData[]; bondFunds: BondFund[] } = {
  updatedAt: '2026-04-22',
  govBonds: [
    { term: '5 năm',  tenor: 5,  rate: 3.83, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Khuyên dùng', badgeColor: 'purple', source: 'vn_gov_5y'  },
    { term: '10 năm', tenor: 10, rate: 4.15, liquidity: 'Cao', risk: 'Thấp', badge: 'Ưu tiên', badgeColor: 'amber', source: 'vn_gov_10y' },
    { term: '15 năm', tenor: 15, rate: 4.23, liquidity: 'Trung bình', risk: 'Thấp', badge: 'Dài hạn', badgeColor: 'purple', source: 'vn_gov_15y' },
  ],
  bondFunds: [
    { id: 'vcbf_fif', name: 'Quỹ VCBF-FIF', manager: 'Vietcombank Fund Management', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Uy tín', badgeColor: 'blue', note: 'Quỹ thu nhập cố định, benchmark TPCP Việt Nam 10 năm', benchmarkSource: 'vn_gov_10y' },
    { id: 'ssibf', name: 'Quỹ SSIBF', manager: 'SSI AM', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Trái phiếu', badgeColor: 'amber', note: 'Quỹ trái phiếu SSI, dùng benchmark TPCP 10 năm khi chưa có NAV history ổn định', benchmarkSource: 'vn_gov_10y' },
    { id: 'mbbond', name: 'Quỹ MBBOND', manager: 'MB Capital', returnEst: '6.0-7.0', minInvest: '1 triệu', badge: 'Tiện lợi', badgeColor: 'blue', note: 'Mua qua app MBBank, phí thấp, cần collector NAV nếu muốn chart trực tiếp', benchmarkSource: 'vn_gov_10y' },
    { id: 'tcbf', name: 'Quỹ TCBF', manager: 'Techcom Capital', returnEst: '6.0-6.8', minInvest: '1 triệu', badge: '', badgeColor: '', note: 'Mua qua Techcombank, cần collector NAV nếu muốn chart trực tiếp', benchmarkSource: 'vn_gov_10y' },
  ],
};

export async function getBondsRates(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';

    let vnBondHistory: any = null;
    let latestVnYields: any = {};
    try {
      vnBondHistory = await fetchVietnamGovBondAuctionHistory(3);
      latestVnYields = getLatestVietnamGovBondYields(vnBondHistory);
      if (vnBondHistory?.stale) {
        console.warn('[InvestmentAdvisor] bonds:vbma-history-stale-or-empty');
      }
    } catch (err: any) {
      console.warn(`[InvestmentAdvisor] bonds:vbma-history-unavailable ${err.message}`);
    }

    const govBondData = BONDS_DATA.govBonds.map((bond) => ({
      ...bond,
      rate: latestVnYields[bond.tenor] || bond.rate,
    }));

    const preferTerms: Record<string, string[]> = {
      LOW:    ['10 năm', '15 năm', '5 năm'],
      MEDIUM: ['5 năm', '10 năm', '15 năm'],
      HIGH:   ['5 năm', '10 năm', '15 năm'],
    };

    const terms = preferTerms[riskLevel] || preferTerms.MEDIUM;

    const sortedGov = [...govBondData].sort((a, b) => {
      const ai = terms.indexOf(a.term);
      const bi = terms.indexOf(b.term);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const bondItems = [
      ...sortedGov.slice(0, 3).map((g, i) => ({
        id: `gov_${g.term}`,
        name: `Trái phiếu Chính phủ ${g.term}`,
        tag: `TPCP · ${g.liquidity} · Rủi ro ${g.risk}`,
        historySource: { asset: 'bonds', source: g.source, sourceType: 'officialAuction' },
        rate: g.rate,
        rateLabel: `${g.rate.toFixed(2)}%/năm`,
        change: null,
        note: `Yield trúng thầu VBMA/HNX mới nhất · thanh khoản ${g.liquidity.toLowerCase()} · mua qua TCBS, SSI, MBBank tối thiểu 100k`,
        badge: i === 0 ? 'Ưu tiên' : g.badge,
        badgeColor: i === 0 ? 'amber' : g.badgeColor,
      })),
      ...BONDS_DATA.bondFunds.slice(0, 2).map(f => ({
        id: f.id,
        name: f.name,
        tag: `Quỹ · ${f.manager}`,
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
      })),
    ];
    const termAdvice: Record<string, string> = {
      LOW:    'kỳ hạn dài 5–15 năm để chốt lãi',
      MEDIUM: 'kỳ hạn trung 3–5 năm cân bằng rủi ro',
      HIGH:   'kỳ hạn ngắn 2–3 năm giữ linh hoạt',
    };

    const currentFiveYearRate = govBondData.find(b => b.term === '5 năm')?.rate;
    const currentTenYearRate = govBondData.find(b => b.term === '10 năm')?.rate;
    const intro = `TPCP Việt Nam kỳ hạn 5 năm đang ở ${currentFiveYearRate?.toFixed(2)}%/năm, 10 năm ở ${currentTenYearRate?.toFixed(2)}%/năm. `
      + `Với khẩu vị ${riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao'}, `
      + `nên chọn ${termAdvice[riskLevel] || termAdvice.MEDIUM}.`;

    return success(res, {
      bondItems,
      intro,
      updatedAt: vnBondHistory?.updatedAt || BONDS_DATA.updatedAt,
      vnBondUpdatedAt: vnBondHistory?.updatedAt || BONDS_DATA.updatedAt,
      riskLevel,
    });
  } catch (err: any) {
    console.error('getBondsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu trái phiếu');
  }
}

// ─── Savings ─────────────────────────────────────────────────────

interface BankData {
  id: string;
  name: string;
  tier: 'big4' | 'mid' | 'small';
  online: Record<string, number>;
  counter: Record<string, number>;
  note: string;
}

const SAVINGS_DATA: { updatedAt: string; banks: BankData[] } = {
  updatedAt: '2026-04-23',
  banks: [
    {
      id: 'acb', name: 'ACB', tier: 'mid',
      online:  { t1: 3.1, t3: 3.5, t6: 4.6, t9: 4.7, t12: 5.5, t18: 5.5, t24: 5.5 },
      counter: { t1: 2.9, t3: 3.3, t6: 4.4, t9: 4.5, t12: 5.3, t18: 5.3, t24: 5.3 },
      note: 'Lãi suất ổn định, uy tín cao, hệ thống rộng khắp',
    },
    {
      id: 'tcb', name: 'Techcombank', tier: 'mid',
      online:  { t1: 3.0, t3: 3.4, t6: 4.5, t9: 4.6, t12: 5.2, t18: 5.2, t24: 5.2 },
      counter: { t1: 2.8, t3: 3.2, t6: 4.3, t9: 4.4, t12: 5.0, t18: 5.0, t24: 5.0 },
      note: 'Online banking tốt, gửi/rút linh hoạt qua app',
    },
    {
      id: 'vpb', name: 'VPBank', tier: 'mid',
      online:  { t1: 3.2, t3: 3.7, t6: 4.8, t9: 4.9, t12: 5.8, t18: 5.8, t24: 5.8 },
      counter: { t1: 3.0, t3: 3.5, t6: 4.6, t9: 4.7, t12: 5.6, t18: 5.6, t24: 5.6 },
      note: 'Lãi suất cạnh tranh top đầu, nhiều ưu đãi online',
    },
    {
      id: 'msb', name: 'MSB', tier: 'mid',
      online:  { t1: 3.3, t3: 3.8, t6: 4.9, t9: 5.0, t12: 6.0, t18: 6.0, t24: 6.1 },
      counter: { t1: 3.1, t3: 3.6, t6: 4.7, t9: 4.8, t12: 5.8, t18: 5.8, t24: 5.9 },
      note: 'Kỳ hạn 13/24 tháng hấp dẫn, app dễ dùng',
    },
    {
      id: 'hdb', name: 'HDBank', tier: 'mid',
      online:  { t1: 3.4, t3: 3.9, t6: 4.9, t9: 5.0, t12: 5.7, t18: 5.7, t24: 5.8 },
      counter: { t1: 3.2, t3: 3.7, t6: 4.7, t9: 4.8, t12: 5.5, t18: 5.5, t24: 5.6 },
      note: 'Gửi online cao hơn quầy, ưu đãi cho khách VIP',
    },
    {
      id: 'ocb', name: 'OCB', tier: 'small',
      online:  { t1: 3.5, t3: 4.0, t6: 5.0, t9: 5.1, t12: 6.0, t18: 6.1, t24: 6.2 },
      counter: { t1: 3.3, t3: 3.8, t6: 4.8, t9: 4.9, t12: 5.8, t18: 5.9, t24: 6.0 },
      note: 'Lãi suất cao hơn trung bình, cần cân nhắc quy mô',
    },
    {
      id: 'vcb', name: 'Vietcombank', tier: 'big4',
      online:  { t1: 2.0, t3: 2.5, t6: 3.0, t9: 3.4, t12: 4.7, t18: 4.7, t24: 4.7 },
      counter: { t1: 1.7, t3: 2.1, t6: 2.9, t9: 3.2, t12: 4.6, t18: 4.6, t24: 4.6 },
      note: 'Lãi thấp hơn nhưng uy tín Nhà nước, bảo hiểm tốt nhất',
    },
  ],
};

function buildSavingsItems(riskLevel: string) {
  const tenorMap: Record<string, string[]> = {
    LOW:    ['t24', 't18', 't12'],
    MEDIUM: ['t12', 't6',  't9'],
    HIGH:   ['t3',  't1',  't6'],
  };
  const preferTenors = tenorMap[riskLevel] || tenorMap.MEDIUM;
  const primaryTenor = preferTenors[0];

  const sorted = [...SAVINGS_DATA.banks].sort((a, b) => {
    const ra = a.online[primaryTenor] || 0;
    const rb = b.online[primaryTenor] || 0;
    if (riskLevel === 'LOW') {
      const tierScore = (t: string) => t === 'big4' ? 0.3 : t === 'mid' ? 0 : -0.2;
      return (rb + tierScore(b.tier)) - (ra + tierScore(a.tier));
    }
    return rb - ra;
  });

  const tenorLabel: Record<string, string> = { t1: '1 tháng', t3: '3 tháng', t6: '6 tháng', t9: '9 tháng', t12: '12 tháng', t18: '18 tháng', t24: '24 tháng' };
  const tierBadge: Record<string, { label: string; color: string }> = { big4: { label: 'Big4', color: 'purple' }, mid: { label: 'Uy tín', color: 'blue' }, small: { label: 'Lãi cao', color: 'emerald' } };

  return sorted.slice(0, 6).map((bank, i) => {
    const rate    = bank.online[primaryTenor];
    const rateCtr = bank.counter[primaryTenor];
    const tb      = tierBadge[bank.tier];

    const otherTenors = preferTenors.slice(1).map(t => `${tenorLabel[t]}: ${bank.online[t]}%`).join(' · ');
    const note = `${bank.note} · ${otherTenors}`;

    return {
      id:         bank.id,
      name:       bank.name,
      tag:        `Online ${tenorLabel[primaryTenor]}`,
      rate:       rate,
      rateLabel:  `${rate}%/năm`,
      rateCounter: rateCtr,
      rateCounterLabel: `${rateCtr}%/năm (quầy)`,
      note,
      badge:      i === 0 ? 'Tốt nhất' : tb.label,
      badgeColor: i === 0 ? 'amber' : tb.color,
      tier:       bank.tier,
      allRates:   bank.online,
    };
  });
}

export async function getSavingsRates(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const items = buildSavingsItems(riskLevel);

    const tenorAdvice: Record<string, string> = {
      LOW:    'kỳ hạn 18–24 tháng',
      MEDIUM: 'kỳ hạn 6–12 tháng',
      HIGH:   'kỳ hạn 1–3 tháng (giữ linh hoạt)',
    };

    const primaryTenorMap: Record<string, string> = { LOW: 't24', MEDIUM: 't12', HIGH: 't3' };
    const primaryTenor = primaryTenorMap[riskLevel] || 't12';
    const maxRate = Math.max(...SAVINGS_DATA.banks.map(b => b.online[primaryTenor] || 0));

    const intro = `Lãi suất tiết kiệm online tốt nhất hiện tại lên tới **${maxRate}%/năm**. `
      + `Với khẩu vị ${riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao'}, `
      + `nên chọn ${tenorAdvice[riskLevel] || tenorAdvice.MEDIUM} — `
      + (riskLevel === 'LOW' ? 'chốt lãi dài hạn khi lãi suất còn cao.'
        : riskLevel === 'MEDIUM' ? 'cân bằng thanh khoản và lãi suất.'
        : 'giữ tiền mặt linh hoạt để chớp cơ hội đầu tư.');

    return success(res, {
      savingsItems: items,
      intro,
      updatedAt: SAVINGS_DATA.updatedAt,
      riskLevel,
    });
  } catch (err: any) {
    console.error('getSavingsRates error:', err.message);
    return error(res, 'Không thể lấy dữ liệu tiết kiệm');
  }
}

// ─── Gold ────────────────────────────────────────────────────────

let goldCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const GOLD_CACHE_TTL = 10 * 60 * 1000;

async function fetchGoldData() {
  const worldRes = await fetch(
    'https://query2.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d',
    { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } }
  );
  const worldJson: any = await worldRes.json();
  const worldMeta = worldJson?.chart?.result?.[0]?.meta;
  const worldPrice   = worldMeta?.regularMarketPrice ?? 0;
  const worldPrevClose = worldMeta?.chartPreviousClose ?? worldPrice;
  const worldChange  = worldPrevClose > 0 ? (worldPrice - worldPrevClose) / worldPrevClose * 100 : 0;

  const btmcRes = await fetch(
    'https://btmc.vn/api/BTMCAPI/getpricebtmc?key=3kd8ub1llcg9t45hnoh8hmn7t5kc2v',
    { headers: { Accept: 'application/json' } }
  );
  const btmcJson: any = await btmcRes.json();
  const rows = btmcJson?.DataList?.Data ?? [];

  let sjc: any = null, nhan: any = null;
  for (const row of rows) {
    const idx = row['@row'];
    const name = (row[`@n_${idx}`] || '').toUpperCase();
    const buy  = parseInt(row[`@pb_${idx}`] || '0', 10);
    const sell = parseInt(row[`@ps_${idx}`] || '0', 10);
    if (!sjc  && name.includes('VÀNG MIẾNG SJC'))   sjc  = { buy, sell };
    if (!nhan && name.includes('NHẪN TRÒN TRƠN'))   nhan = { buy, sell };
    if (sjc && nhan) break;
  }

  return { worldPrice, worldChange, sjc, nhan };
}

export async function getGoldPrices(req: Request, res: Response) {
  try {
    const now = Date.now();
    let data;
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

    const sjcSpread = sjc ? Math.round((sjc.sell - sjc.buy) / sjc.sell * 100 * 10) / 10 : 0;

    const impliedNhan = sjc ? Math.round(worldPrice * 25500 / 8.29 / 100000) * 100000 : 0;
    const premiumSJC  = sjc && impliedNhan > 0
      ? Math.round((sjc.sell - impliedNhan) / impliedNhan * 100 * 10) / 10
      : 0;
    const sjcBenchmark = sjc || nhan;

    const goldItems = [
      {
        id: 'world',
        name: 'Vàng thế giới (GC=F)',
        tag: 'Futures · COMEX',
        historySource: { asset: 'gold', source: 'world', sourceType: 'direct' },
        price: worldPrice,
        priceLabel: fmtW(worldPrice),
        change24h: worldChange,
        note: `Giá spot quốc tế · ${worldChange >= 0 ? '📈 tăng' : '📉 giảm'} ${Math.abs(worldChange).toFixed(2)}% hôm nay`,
        badge: worldChange > 1 ? 'Đang tăng' : worldChange < -1 ? 'Giảm' : 'Ổn định',
        badgeColor: worldChange > 0 ? 'emerald' : 'amber',
        highlight: true,
      },
      sjc ? {
        id: 'sjc',
        name: 'Vàng miếng SJC',
        tag: 'Trong nước · 1 chỉ',
        historySource: { asset: 'gold', source: 'sjc', sourceType: 'direct', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
        price: sjc.sell,
        priceLabel: fmt(sjc.sell),
        buyPrice: sjc.buy,
        buyLabel: fmt(sjc.buy),
        change24h: worldChange,
        note: `Mua: ${fmt(sjc.buy)} · Bán: ${fmt(sjc.sell)} · Spread ${sjcSpread}%${premiumSJC > 0 ? ` · Premium so TG: +${premiumSJC}%` : ''}`,
        badge: 'Thanh khoản cao',
        badgeColor: 'amber',
      } : null,
      nhan ? {
        id: 'nhan',
        name: 'Nhẫn tròn trơn VRTL',
        tag: 'Trang sức · 1 chỉ',
        historySource: { asset: 'gold', source: 'ring', sourceType: 'direct', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
        price: nhan.sell,
        priceLabel: fmt(nhan.sell),
        buyPrice: nhan.buy,
        buyLabel: fmt(nhan.buy),
        change24h: worldChange,
        note: `Mua: ${fmt(nhan.buy)} · Bán: ${fmt(nhan.sell)} · Dễ mua bán nhỏ lẻ hơn SJC`,
        badge: 'Linh hoạt',
        badgeColor: 'blue',
      } : null,
      {
        id: 'etf_gold',
        name: 'Vàng thế giới quy đổi',
        tag: 'Proxy · XAU/USD',
        historySource: { asset: 'gold', source: 'world', sourceType: 'proxy', sourceLabel: 'Tham chiếu GC=F' },
        price: worldPrice,
        priceLabel: fmtW(worldPrice),
        change24h: worldChange,
        note: 'Dùng giá vàng thế giới GC=F làm tham chiếu vì chưa xác thực được ticker ETF vàng Việt Nam phù hợp',
        badge: 'Tham chiếu',
        badgeColor: 'blue',
      },
      {
        id: 'saving_gold',
        name: 'Tích lũy vàng DCA',
        tag: 'Chiến lược',
        historySource: { asset: 'gold', source: 'sjc', sourceType: 'proxy', sourceLabel: 'Proxy SJC 30 ngày', rangeType: 'days', defaultRange: 30, rangeOptions: [7, 14, 30] },
        price: sjcBenchmark?.sell ?? null,
        priceLabel: sjcBenchmark ? fmt(sjcBenchmark.sell) : 'Theo SJC/nhẫn',
        change24h: 0,
        note: sjcBenchmark
          ? `DCA theo giá bán ${sjc ? 'SJC' : 'nhẫn'} hiện tại ${fmt(sjcBenchmark.sell)}/chỉ · không phải sản phẩm có giá riêng`
          : 'Chiến lược DCA, chưa có sản phẩm có giá riêng để hiển thị',
        badge: 'Khuyên dùng',
        badgeColor: 'emerald',
      },
    ].filter(Boolean);

    const trend = worldChange > 1 ? 'đang tăng 📈' : worldChange > 0 ? 'tích cực nhẹ' : worldChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const intro = `Vàng thế giới ${trend} (${sign(worldChange)} hôm nay, $${worldPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}/oz). `
      + (sjc ? `Vàng SJC trong nước: ${fmt(sjc.sell)}/chỉ${premiumSJC > 5 ? ` — đang cao hơn TG ${premiumSJC}%, cân nhắc thời điểm mua.` : '.'}` : '');

    return success(res, { goldItems, intro, worldPrice, worldChange, cached: goldCache.fetchedAt !== now });
  } catch (err: any) {
    console.error('getGoldPrices error:', err.message);
    if (goldCache.data) {
      return success(res, { ...goldCache.data, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá vàng lúc này');
  }
}

// ─── Stocks ──────────────────────────────────────────────────────

let stockCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const STOCK_CACHE_TTL = 10 * 60 * 1000;

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

async function fetchStockQuote(ticker: string) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' },
  });
  if (!res.ok) return null;
  const json: any = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  return {
    price:      meta.regularMarketPrice,
    prevClose:  meta.chartPreviousClose,
    high52w:    meta.fiftyTwoWeekHigh,
    low52w:     meta.fiftyTwoWeekLow,
    volume:     meta.regularMarketVolume,
    dayHigh:    meta.regularMarketDayHigh,
    dayLow:     meta.regularMarketDayLow,
  };
}

function scoreStock(quote: any, meta: StockMeta, riskLevel: string) {
  if (!quote) return 0;
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const etfBonus = meta.sector === 'ETF' ? 20 : 0;

  const sectorMap: Record<string, Record<string, number>> = {
    LOW:    { 'Ngân hàng': 15, 'Tiêu dùng': 15, 'ETF': 20, 'Hạ tầng': 10 },
    MEDIUM: { 'Công nghệ': 15, 'Ngân hàng': 12, 'Bán lẻ': 10, 'ETF': 15, 'Tiêu dùng': 8 },
    HIGH:   { 'Công nghệ': 20, 'Hóa chất': 15, 'Thép': 12, 'Bán lẻ': 10 },
  };
  const sectorBonus = sectorMap[riskLevel]?.[meta.sector] || 0;

  const momentumScore = posIn52w * 30;

  const volScore = riskLevel === 'LOW'
    ? Math.max(0, 20 - Math.abs(change) * 4)
    : riskLevel === 'HIGH'
    ? Math.min(20, Math.abs(change) * 4)
    : Math.max(0, 20 - Math.max(0, Math.abs(change) - 2) * 5);

  return etfBonus + sectorBonus + momentumScore + volScore;
}

function buildStockCard(quote: any, meta: StockMeta, rank: number) {
  const change = quote.prevClose > 0
    ? ((quote.price - quote.prevClose) / quote.prevClose) * 100 : 0;
  const range52w = quote.high52w - quote.low52w;
  const posIn52w = range52w > 0 ? (quote.price - quote.low52w) / range52w : 0.5;

  const priceLabel = quote.price?.toLocaleString('vi-VN') + 'đ';
  const changeSign = change >= 0 ? '+' : '';
  const rate = `${priceLabel} (${changeSign}${change.toFixed(2)}%)`;

  const pos52wLabel = posIn52w > 0.8 ? 'gần đỉnh 52 tuần' : posIn52w < 0.2 ? 'gần đáy 52 tuần' : 'vùng giữa 52 tuần';
  const trendLabel = change > 2 ? '🚀 tăng mạnh' : change > 0.5 ? '📈 tăng' : change < -2 ? '📉 giảm mạnh' : change < -0.5 ? '📉 giảm' : '➡️ đi ngang';
  const note = `${meta.sector} · ${pos52wLabel} · ${trendLabel} hôm nay`;

  let badge = '', badgeColor = '';
  if (rank === 0)                  { badge = 'Tốt nhất';   badgeColor = 'amber';   }
  else if (meta.sector === 'ETF')  { badge = 'Passive';    badgeColor = 'blue';    }
  else if (change > 2)             { badge = 'Đang tăng';  badgeColor = 'emerald'; }
  else if (posIn52w < 0.25)        { badge = 'Vùng giá tốt'; badgeColor = 'blue'; }
  else if (posIn52w > 0.75)        { badge = 'Uptrend';    badgeColor = 'emerald'; }

  return {
    ticker:   meta.ticker.replace('.VN', ''),
    historyTicker: meta.ticker,
    name:     meta.name,
    sector:   meta.sector,
    tag:      meta.tag,
    price:    quote.price,
    change24h: change,
    high52w:  quote.high52w,
    low52w:   quote.low52w,
    posIn52w,
    note,
    badge,
    badgeColor,
    rate,
  };
}

export async function getStockPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const now = Date.now();

    let quotes: Record<string, any>;
    if (stockCache.data && now - stockCache.fetchedAt < STOCK_CACHE_TTL) {
      quotes = stockCache.data;
    } else {
      const results = await Promise.allSettled(
        STOCK_UNIVERSE.map(async (m) => {
          const q = await fetchStockQuote(m.ticker);
          return { ticker: m.ticker, quote: q };
        })
      );
      quotes = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value.quote) {
          quotes[r.value.ticker] = r.value.quote;
        }
      });
      stockCache = { data: quotes, fetchedAt: now };
    }

    const scored = STOCK_UNIVERSE
      .filter((m) => quotes[m.ticker])
      .map((m) => ({ meta: m, quote: quotes[m.ticker], score: scoreStock(quotes[m.ticker], m, riskLevel) }))
      .sort((a, b) => b.score - a.score);

    const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));

    const quoteList = Object.values(quotes);
    const avgChange = quoteList.length > 0 ? quoteList.reduce((sum, q) => {
      return sum + (q.prevClose > 0 ? (q.price - q.prevClose) / q.prevClose * 100 : 0);
    }, 0) / quoteList.length : 0;

    const marketMood = avgChange > 1 ? 'đang tăng 📈' : avgChange > 0 ? 'tích cực nhẹ' : avgChange > -1 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const introMap: Record<string, string> = {
      LOW:    `VN-Index ${marketMood}. Với khẩu vị thấp, ưu tiên ETF và bluechip ngân hàng/tiêu dùng có cổ tức ổn định. DCA hàng tháng, không cần theo dõi thường xuyên.`,
      MEDIUM: `VN-Index ${marketMood}. Cân bằng giữa cổ phiếu tăng trưởng (FPT, MWG) và phòng thủ (VNM, VCB). Nên giữ 5–7 mã, review mỗi quý.`,
      HIGH:   `VN-Index ${marketMood}. Tập trung vào cổ phiếu tăng trưởng cao (công nghệ, hóa chất, thép). Rủi ro cao — cần theo dõi sát, đặt stop-loss.`,
    };

    return success(res, {
      stocks: top5,
      intro: introMap[riskLevel] || introMap.MEDIUM,
      riskLevel,
      cached: stockCache.fetchedAt !== now,
    });
  } catch (err: any) {
    console.error('getStockPrices error:', err.message);
    if (stockCache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const scored = STOCK_UNIVERSE
        .filter((m) => stockCache.data[m.ticker])
        .map((m) => ({ meta: m, quote: stockCache.data[m.ticker], score: scoreStock(stockCache.data[m.ticker], m, rl) }))
        .sort((a, b) => b.score - a.score);
      const top5 = scored.slice(0, 5).map((s, i) => buildStockCard(s.quote, s.meta, i));
      return success(res, { stocks: top5, intro: '', riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy dữ liệu chứng khoán lúc này');
  }
}

// ─── Crypto ──────────────────────────────────────────────────────

let cryptoCache: { data: any; fetchedAt: number } = { data: null, fetchedAt: 0 };
const CRYPTO_CACHE_TTL_MS = 5 * 60 * 1000;

const STABLECOIN_IDS = new Set([
  'tether', 'usd-coin', 'binance-usd', 'dai', 'true-usd', 'usdd',
  'frax', 'liquity-usd', 'fei-usd', 'pax-dollar',
  'usd1', 'usd1-wlfi', 'ripple-usd', 'rlusd',
  'first-digital-usd', 'paypal-usd', 'mountain-protocol-usdm',
]);

const BLACKLIST_IDS = new Set([
  'wrapped-bitcoin', 'wrapped-ethereum', 'staked-ether', 'wrapped-steth',
  'rocket-pool-eth', 'coinbase-wrapped-staked-eth', 'mantle-staked-ether',
  'dogecoin', 'shiba-inu', 'pepe', 'floki', 'dogwifcoin', 'bonk',
  'official-trump', 'melania-meme', 'book-of-meme',
  'pudgy-penguins', 'axie-infinity', 'the-sandbox', 'decentraland',
  'xrp',
]);

function scoreCoin(coin: any, riskLevel: string = 'MEDIUM') {
  const mcap    = coin.market_cap || 0;
  const volume  = coin.total_volume || 0;
  const change  = Math.abs(coin.price_change_percentage_24h || 0);

  const mcapScore = Math.min(100, (Math.log10(Math.max(mcap, 1)) / Math.log10(3e12)) * 100);
  const mcapPenalty = mcap < 5e9 ? 30 : mcap < 20e9 ? 15 : 0;
  const mcapPenaltyApplied = mcapScore - mcapPenalty;

  const volRatio = mcap > 0 ? Math.min(volume / mcap, 0.15) : 0;
  const liqScore = Math.min(100, volRatio * 667);

  let volScore: number;
  if (riskLevel === 'LOW') {
    volScore = Math.max(0, 100 - change * 15);
  } else if (riskLevel === 'HIGH') {
    volScore = change >= 3 && change <= 20 ? 100 - Math.abs(change - 10) * 3 : Math.max(0, 60 - change);
  } else {
    volScore = Math.max(0, 100 - Math.max(0, change - 5) * 5);
  }

  return mcapPenaltyApplied * 0.5 + liqScore * 0.2 + volScore * 0.3;
}

function buildCoinCard(coin: any, rank: number) {
  const change   = coin.price_change_percentage_24h ?? 0;
  const mcap     = coin.market_cap ?? 0;
  const volRatio = mcap > 0 ? (coin.total_volume / mcap) : 0;

  let tag: string;
  if (coin.market_cap_rank <= 2)          tag = 'Top 2 — Blue-chip';
  else if (coin.market_cap_rank <= 10)    tag = `Top ${coin.market_cap_rank} — Large-cap`;
  else if (coin.market_cap_rank <= 50)    tag = `Top ${coin.market_cap_rank} — Mid-cap`;
  else                                    tag = 'Small-cap';

  const mcapLabel = mcap >= 1e12 ? `$${(mcap/1e12).toFixed(2)}T`
    : mcap >= 1e9 ? `$${(mcap/1e9).toFixed(0)}B`
    : `$${(mcap/1e6).toFixed(0)}M`;
  const liqLabel  = volRatio > 0.15 ? 'thanh khoản rất cao' : volRatio > 0.07 ? 'thanh khoản tốt' : 'thanh khoản trung bình';
  const trendLabel = change > 5 ? '🚀 đang tăng mạnh' : change > 1 ? '📈 xu hướng tăng' : change < -5 ? '📉 đang giảm mạnh' : change < -1 ? '📉 xu hướng giảm' : '➡️ đi ngang';
  const note = `MCap ${mcapLabel} · ${liqLabel} · ${trendLabel} 24h`;

  let badge = '', badgeColor = '';
  if (rank === 0)                          { badge = 'Tốt nhất';    badgeColor = 'amber';   }
  else if (coin.market_cap_rank <= 2)      { badge = 'Blue-chip';   badgeColor = 'amber';   }
  else if (change > 5)                     { badge = 'Đang tăng';   badgeColor = 'emerald'; }
  else if (volRatio > 0.15)                { badge = 'Thanh khoản'; badgeColor = 'blue';    }
  else if (coin.market_cap_rank <= 10)     { badge = 'Uy tín cao';  badgeColor = 'blue';    }

  const price = coin.current_price;
  const priceLabel = price >= 1
    ? `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
    : `$${price.toFixed(6)}`;
  const changeSign = change >= 0 ? '+' : '';
  const rate = `${priceLabel} (${changeSign}${change.toFixed(2)}% 24h)`;

  return {
    id:          coin.id,
    name:        coin.name,
    symbol:      coin.symbol.toUpperCase(),
    image:       coin.image,
    price:       coin.current_price,
    marketCap:   mcap,
    change24h:   change,
    volRatio,
    marketCapRank: coin.market_cap_rank,
    tag,
    note,
    badge,
    badgeColor,
    rate,
  };
}

export async function getCryptoPrices(req: Request, res: Response) {
  try {
    const riskLevel = (req.query.riskLevel as string) || 'MEDIUM';
    const now = Date.now();

    let rawCoins: any[];
    if (cryptoCache.data && now - cryptoCache.fetchedAt < CRYPTO_CACHE_TTL_MS) {
      rawCoins = cryptoCache.data;
    } else {
      const url = 'https://api.coingecko.com/api/v3/coins/markets'
        + '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1'
        + '&sparkline=false&price_change_percentage=24h';

      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
      rawCoins = await response.json();
      cryptoCache = { data: rawCoins, fetchedAt: now };
    }

    const filtered = rawCoins.filter(
      (c) => !STABLECOIN_IDS.has(c.id)
          && !BLACKLIST_IDS.has(c.id)
          && !/usd|dollar/i.test(c.symbol)
    );

    const scored = filtered
      .map((c) => ({ coin: c, score: scoreCoin(c, riskLevel) }))
      .sort((a, b) => b.score - a.score);

    const top5 = scored.slice(0, 5).map((s, i) => buildCoinCard(s.coin, i));

    const usdc = rawCoins.find((c) => c.id === 'usd-coin');
    if (usdc) {
      top5.push({
        id: 'usd-coin', name: 'USDC / USDT', symbol: 'USDC',
        image: usdc.image, price: 1, marketCap: usdc.market_cap,
        change24h: 0, volRatio: 0, marketCapRank: usdc.market_cap_rank,
        tag: 'Stablecoin', note: 'Gửi nhận lãi 5–8%/năm trên các nền tảng DeFi · không chịu biến động giá',
        badge: 'Ít rủi ro', badgeColor: 'emerald',
        rate: '$1.00 (Stablecoin)',
      });
    }

    const filteredSlice = filtered.slice(0, 20);
    const avgChange = filteredSlice.length > 0 ? filteredSlice.reduce((s, c) => s + (c.price_change_percentage_24h || 0), 0) / filteredSlice.length : 0;
    const marketMood = avgChange > 3 ? 'đang tăng mạnh 🚀' : avgChange > 0 ? 'tích cực nhẹ 📈' : avgChange > -3 ? 'đi ngang ➡️' : 'đang giảm 📉';
    const introMap: Record<string, string> = {
      LOW:    `Thị trường crypto ${marketMood}. Với khẩu vị rủi ro thấp, danh sách tập trung vào các coin có market cap lớn, biến động thấp — ưu tiên bảo toàn vốn. Chỉ đầu tư phần vốn chấp nhận rủi ro.`,
      MEDIUM: `Thị trường crypto ${marketMood}. Danh sách cân bằng giữa an toàn (mcap lớn) và tăng trưởng (thanh khoản tốt). Tập trung vào coin có nền tảng thực sự, tránh meme coin.`,
      HIGH:   `Thị trường crypto ${marketMood}. Với khẩu vị rủi ro cao, danh sách ưu tiên coin có tiềm năng tăng mạnh và thanh khoản tốt. Chỉ đầu tư vốn chấp nhận mất hoàn toàn, DCA hàng tháng.`,
    };

    return success(res, {
      coins: top5,
      intro: introMap[riskLevel] || introMap.MEDIUM,
      riskLevel,
      cached: cryptoCache.fetchedAt !== now,
    });
  } catch (err: any) {
    console.error('getCryptoPrices error:', err.message);
    if (cryptoCache.data) {
      const rl = (req.query.riskLevel as string) || 'MEDIUM';
      const filtered = cryptoCache.data.filter(
        (c: any) => !STABLECOIN_IDS.has(c.id) && !BLACKLIST_IDS.has(c.id)
      );
      const top5 = filtered
        .map((c: any) => ({ coin: c, score: scoreCoin(c, rl) }))
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, 5)
        .map((s: any, i: number) => buildCoinCard(s.coin, i));
      return success(res, { coins: top5, riskLevel: rl, cached: true, stale: true });
    }
    return error(res, 'Không thể lấy giá crypto lúc này');
  }
}
