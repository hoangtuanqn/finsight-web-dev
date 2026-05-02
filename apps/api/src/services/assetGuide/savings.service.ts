interface BankData {
  id: string;
  name: string;
  tier: 'big4' | 'mid' | 'small';
  online: Record<string, number>;
  counter: Record<string, number>;
  note: string;
}

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
  tier: string;
  allRates: Record<string, number>;
}

export interface SavingsServiceResult {
  savingsItems: SavingsItem[];
  intro: string;
  updatedAt: string;
  riskLevel: string;
}

const SAVINGS_DATA: { updatedAt: string; banks: BankData[] } = {
  updatedAt: '2026-04-23',
  banks: [
    {
      id: 'acb',
      name: 'ACB',
      tier: 'mid',
      online: { t1: 3.1, t3: 3.5, t6: 4.6, t9: 4.7, t12: 5.5, t18: 5.5, t24: 5.5 },
      counter: { t1: 2.9, t3: 3.3, t6: 4.4, t9: 4.5, t12: 5.3, t18: 5.3, t24: 5.3 },
      note: 'Lãi suất ổn định, uy tín cao, hệ thống rộng khắp',
    },
    {
      id: 'tcb',
      name: 'Techcombank',
      tier: 'mid',
      online: { t1: 3.0, t3: 3.4, t6: 4.5, t9: 4.6, t12: 5.2, t18: 5.2, t24: 5.2 },
      counter: { t1: 2.8, t3: 3.2, t6: 4.3, t9: 4.4, t12: 5.0, t18: 5.0, t24: 5.0 },
      note: 'Online banking tốt, gửi/rút linh hoạt qua app',
    },
    {
      id: 'vpb',
      name: 'VPBank',
      tier: 'mid',
      online: { t1: 3.2, t3: 3.7, t6: 4.8, t9: 4.9, t12: 5.8, t18: 5.8, t24: 5.8 },
      counter: { t1: 3.0, t3: 3.5, t6: 4.6, t9: 4.7, t12: 5.6, t18: 5.6, t24: 5.6 },
      note: 'Lãi suất cạnh tranh top đầu, nhiều ưu đãi online',
    },
    {
      id: 'msb',
      name: 'MSB',
      tier: 'mid',
      online: { t1: 3.3, t3: 3.8, t6: 4.9, t9: 5.0, t12: 6.0, t18: 6.0, t24: 6.1 },
      counter: { t1: 3.1, t3: 3.6, t6: 4.7, t9: 4.8, t12: 5.8, t18: 5.8, t24: 5.9 },
      note: 'Kỳ hạn 13/24 tháng hấp dẫn, app dễ dùng',
    },
    {
      id: 'hdb',
      name: 'HDBank',
      tier: 'mid',
      online: { t1: 3.4, t3: 3.9, t6: 4.9, t9: 5.0, t12: 5.7, t18: 5.7, t24: 5.8 },
      counter: { t1: 3.2, t3: 3.7, t6: 4.7, t9: 4.8, t12: 5.5, t18: 5.5, t24: 5.6 },
      note: 'Gửi online cao hơn quầy, ưu đãi cho khách VIP',
    },
    {
      id: 'ocb',
      name: 'OCB',
      tier: 'small',
      online: { t1: 3.5, t3: 4.0, t6: 5.0, t9: 5.1, t12: 6.0, t18: 6.1, t24: 6.2 },
      counter: { t1: 3.3, t3: 3.8, t6: 4.8, t9: 4.9, t12: 5.8, t18: 5.9, t24: 6.0 },
      note: 'Lãi suất cao hơn trung bình, cần cân nhắc quy mô',
    },
    {
      id: 'vcb',
      name: 'Vietcombank',
      tier: 'big4',
      online: { t1: 2.0, t3: 2.5, t6: 3.0, t9: 3.4, t12: 4.7, t18: 4.7, t24: 4.7 },
      counter: { t1: 1.7, t3: 2.1, t6: 2.9, t9: 3.2, t12: 4.6, t18: 4.6, t24: 4.6 },
      note: 'Lãi thấp hơn nhưng uy tín Nhà nước, bảo hiểm tốt nhất',
    },
  ],
};

const TENOR_MAP: Record<string, string[]> = {
  LOW: ['t24', 't18', 't12'],
  MEDIUM: ['t12', 't6', 't9'],
  HIGH: ['t3', 't1', 't6'],
};

const TENOR_LABEL: Record<string, string> = {
  t1: '1 tháng',
  t3: '3 tháng',
  t6: '6 tháng',
  t9: '9 tháng',
  t12: '12 tháng',
  t18: '18 tháng',
  t24: '24 tháng',
};

const TIER_BADGE: Record<string, { label: string; color: string }> = {
  big4: { label: 'Big4', color: 'purple' },
  mid: { label: 'Uy tín', color: 'blue' },
  small: { label: 'Lãi cao', color: 'emerald' },
};

function buildSavingsItems(riskLevel: string): SavingsItem[] {
  const preferTenors = TENOR_MAP[riskLevel] || TENOR_MAP.MEDIUM;
  const primaryTenor = preferTenors[0];

  const sorted = [...SAVINGS_DATA.banks].sort((a, b) => {
    const ra = a.online[primaryTenor] || 0;
    const rb = b.online[primaryTenor] || 0;
    if (riskLevel === 'LOW') {
      const tierScore = (t: string) => (t === 'big4' ? 0.3 : t === 'mid' ? 0 : -0.2);
      return rb + tierScore(b.tier) - (ra + tierScore(a.tier));
    }
    return rb - ra;
  });

  return sorted.slice(0, 6).map((bank, i) => {
    const rate = bank.online[primaryTenor];
    const rateCtr = bank.counter[primaryTenor];
    const tb = TIER_BADGE[bank.tier];
    const otherTenors = preferTenors
      .slice(1)
      .map((t) => `${TENOR_LABEL[t]}: ${bank.online[t]}%`)
      .join(' · ');

    return {
      id: bank.id,
      name: bank.name,
      tag: `Online ${TENOR_LABEL[primaryTenor]}`,
      rate,
      rateLabel: `${rate}%/năm`,
      rateCounter: rateCtr,
      rateCounterLabel: `${rateCtr}%/năm (quầy)`,
      note: `${bank.note} · ${otherTenors}`,
      badge: i === 0 ? 'Tốt nhất' : tb.label,
      badgeColor: i === 0 ? 'amber' : tb.color,
      tier: bank.tier,
      allRates: bank.online,
    };
  });
}

export function getSavingsRatesData(riskLevel: string): SavingsServiceResult {
  const items = buildSavingsItems(riskLevel);

  const tenorAdvice: Record<string, string> = {
    LOW: 'kỳ hạn 18–24 tháng',
    MEDIUM: 'kỳ hạn 6–12 tháng',
    HIGH: 'kỳ hạn 1–3 tháng (giữ linh hoạt)',
  };

  const primaryTenorMap: Record<string, string> = { LOW: 't24', MEDIUM: 't12', HIGH: 't3' };
  const primaryTenor = primaryTenorMap[riskLevel] || 't12';
  const maxRate = Math.max(...SAVINGS_DATA.banks.map((b) => b.online[primaryTenor] || 0));
  const riskLabel = riskLevel === 'LOW' ? 'thấp' : riskLevel === 'MEDIUM' ? 'trung bình' : 'cao';

  const intro =
    `Lãi suất tiết kiệm online tốt nhất hiện tại lên tới **${maxRate}%/năm**. ` +
    `Với khẩu vị ${riskLabel}, ` +
    `nên chọn ${tenorAdvice[riskLevel] || tenorAdvice.MEDIUM} — ` +
    (riskLevel === 'LOW'
      ? 'chốt lãi dài hạn khi lãi suất còn cao.'
      : riskLevel === 'MEDIUM'
        ? 'cân bằng thanh khoản và lãi suất.'
        : 'giữ tiền mặt linh hoạt để chớp cơ hội đầu tư.');

  return {
    savingsItems: items,
    intro,
    updatedAt: SAVINGS_DATA.updatedAt,
    riskLevel,
  };
}
