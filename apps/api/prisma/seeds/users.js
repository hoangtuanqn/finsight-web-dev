import bcrypt from 'bcryptjs';

const MASTER_USERS = [
  { email: 'phamhoangtuanqn@gmail.com', fullName: 'Phạm Hoàng Tuấn' },
  { email: 'ducphucdn2006@gmail.com', fullName: 'Phạm Đức Phúc' },
  { email: 'nguyenvangiabinh22072006@gmail.com', fullName: 'Nguyễn Văn Gia Bình' },
  { email: 'lamhoangan612@gmail.com', fullName: 'Lâm Hoàng An' },
  { email: 'taikhoanstudycuabinh@gmail.com', fullName: 'Nguyễn Văn Gia Bình' },
  { email: 'chunhau.py@gmail.com', fullName: 'Mai Trung Hậu' },
];

function monthsAgo(n, day = null) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  if (day) d.setDate(day);
  return d;
}

const DEBTS_TEMPLATE = [
  {
    name: 'Thẻ tín dụng VCB Platinum',
    platform: 'CREDIT_CARD',
    originalAmount: 50000000,
    balance: 15000000,
    apr: 28,
    rateType: 'REDUCING',
    minPayment: 750000,
    dueDay: 20,
    termMonths: 0,
    remainingTerms: 0,
    startDate: monthsAgo(12),
    status: 'ACTIVE',
  },
  {
    name: 'Vay tiền mặt FE Credit',
    platform: 'FE_CREDIT',
    originalAmount: 30000000,
    balance: 22500000,
    apr: 45,
    rateType: 'FLAT',
    feeProcessing: 5, // Phí hồ sơ 5% trên gốc
    feeInsurance: 2, // Phí bảo hiểm 2%/năm
    minPayment: 2375000,
    dueDay: 25,
    termMonths: 24,
    remainingTerms: 18,
    startDate: monthsAgo(6),
    status: 'ACTIVE',
  },
  {
    name: 'Vay mua iPhone 15 Pro Max (Home Credit)',
    platform: 'HOME_CREDIT',
    originalAmount: 32000000,
    balance: 10667000,
    apr: 30,
    rateType: 'FLAT',
    feeProcessing: 1.5, // Phí hồ sơ 1.5% trên gốc
    feeInsurance: 1.5,
    minPayment: 3467000,
    dueDay: 5,
    termMonths: 12,
    remainingTerms: 4,
    startDate: monthsAgo(8),
    status: 'ACTIVE',
  },
  {
    name: 'Thẻ tín dụng HSBC Visa Cash Back',
    platform: 'CREDIT_CARD',
    originalAmount: 40000000,
    balance: 18700000,
    apr: 27,
    rateType: 'REDUCING',
    minPayment: 935000,
    dueDay: 15,
    termMonths: 0,
    remainingTerms: 0,
    startDate: monthsAgo(10),
    status: 'ACTIVE',
  },
  {
    name: 'Vay tiêu dùng Shinhan Bank',
    platform: 'BANK',
    originalAmount: 100000000,
    balance: 72400000,
    apr: 18,
    rateType: 'REDUCING',
    feeProcessing: 1, // Phí hồ sơ 1% trên gốc
    minPayment: 3615000,
    dueDay: 10,
    termMonths: 36,
    remainingTerms: 24,
    startDate: monthsAgo(12),
    status: 'ACTIVE',
  },
  {
    name: 'Shopee SPayLater',
    platform: 'SPAYLATER',
    originalAmount: 8000000,
    balance: 5334000,
    apr: 18,
    rateType: 'FLAT',
    minPayment: 2787000,
    dueDay: 1,
    termMonths: 3,
    remainingTerms: 2,
    startDate: monthsAgo(1),
    status: 'ACTIVE',
  },
  {
    name: 'Vay mua xe Honda Air Blade (Mcredit)',
    platform: 'MCREDIT',
    originalAmount: 60000000,
    balance: 30000000,
    apr: 24,
    rateType: 'FLAT',
    feeInsurance: 1.2,
    minPayment: 2867000,
    dueDay: 15,
    termMonths: 36,
    remainingTerms: 18,
    startDate: monthsAgo(18),
    status: 'ACTIVE',
  },
  {
    name: 'Thẻ tín dụng VIB Online Plus 2in1',
    platform: 'CREDIT_CARD',
    originalAmount: 25000000,
    balance: 11200000,
    apr: 36,
    rateType: 'REDUCING',
    minPayment: 560000,
    dueDay: 28,
    termMonths: 0,
    remainingTerms: 0,
    startDate: monthsAgo(15),
    status: 'ACTIVE',
  },
  {
    name: 'Vay thấu chi VietinBank',
    platform: 'BANK',
    originalAmount: 20000000,
    balance: 16500000,
    apr: 22,
    rateType: 'REDUCING',
    minPayment: 1128000,
    dueDay: 5,
    termMonths: 0,
    remainingTerms: 0,
    startDate: monthsAgo(3),
    status: 'ACTIVE',
  },
  {
    // 0% lãi, trả đều 6T: monthly = 15M/6 = 2,500,000
    // balance sau 4T: 15M - 4*2,500,000 = 5,000,000 ✓
    name: 'Nợ học phí (Mượn bạn)',
    platform: 'PERSONAL',
    originalAmount: 15000000,
    balance: 5000000,
    apr: 0,
    rateType: 'FLAT',
    minPayment: 2500000,
    dueDay: 30,
    termMonths: 6,
    remainingTerms: 2,
    startDate: monthsAgo(4),
    status: 'ACTIVE',
  },
];

export async function seedUsers(prisma) {
  console.log('🌱 Seeding Master Users with synchronized rich data...');

  const passwordHash = await bcrypt.hash('Master@123', 12);

  for (const master of MASTER_USERS) {
    console.log(`👤 Processing: ${master.email}`);

    // Cleanup
    const existing = await prisma.user.findUnique({ where: { email: master.email } });
    if (existing) {
      const uid = existing.id;
      await prisma.userPortfolio.deleteMany({ where: { userId: uid } });
      await prisma.aIStrategy.deleteMany({ where: { userId: uid } });
      await prisma.allocation.deleteMany({ where: { profile: { userId: uid } } });
      await prisma.payment.deleteMany({ where: { debt: { userId: uid } } });
      await prisma.debtGoal.deleteMany({ where: { userId: uid } });
      await prisma.notification.deleteMany({ where: { userId: uid } });
      await prisma.debtSnapshot.deleteMany({ where: { userId: uid } });
      await prisma.debt.deleteMany({ where: { userId: uid } });
      await prisma.wallet.deleteMany({ where: { userId: uid } });
      await prisma.investorProfile.deleteMany({ where: { userId: uid } });
      await prisma.user.delete({ where: { id: uid } });
    }

    const user = await prisma.user.create({
      data: {
        email: master.email,
        fullName: master.fullName,
        password: passwordHash,
        monthlyIncome: 35000000,
        extraBudget: 8000000,
        level: 'PROMAX',
        strategyQuota: 100,
      },
    });

    // Wallets
    await prisma.wallet.create({
      data: {
        userId: user.id,
        name: 'Ngân hàng cá nhân',
        type: 'BANK',
        bankName: 'TPBank',
        bankAccountNumber: '77884268888',
        sepayToken: 'ATBVZQ9PHXJV1UPOW05AIX7P56FNXLT1ASUFNPSBSCO0MLGOL9MQ2WI4RJKHRCQL',
        balance: 125000000,
        color: '#8b5cf6',
        isDefault: true,
        sepayLinkedAt: new Date(),
        icon: '🏦',
      },
    });

    // Investor Profile (Tổng vốn khả dụng)
    await prisma.investorProfile.create({
      data: {
        userId: user.id,
        capital: 50000000,
        monthlyAdd: 5000000,
        goal: 'GROWTH',
        horizon: 'MEDIUM',
        riskLevel: 'MEDIUM',
        riskScore: 50,
      },
    });

    // Debts & Payments
    let userTotalDebt = 0;
    for (const debtTemplate of DEBTS_TEMPLATE) {
      const debt = await prisma.debt.create({
        data: { userId: user.id, ...debtTemplate },
      });
      userTotalDebt += debtTemplate.balance;

      const start = new Date(debtTemplate.startDate);
      const now = new Date();
      const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      const pCount = Math.min(diffMonths, 12);

      if (pCount > 0) {
        await prisma.payment.createMany({
          data: Array.from({ length: pCount }, (_, i) => ({
            debtId: debt.id,
            amount: debtTemplate.minPayment,
            paidAt: monthsAgo(pCount - i, debtTemplate.dueDay),
            notes: `Thanh toán tự động kỳ ${i + 1}`,
          })),
        });
      }
    }

    // AI Strategy & Portfolio
    const strategy = await prisma.aIStrategy.create({
      data: {
        userId: user.id,
        sentimentValue: 65,
        sentimentLabel: 'Cẩn trọng - Lạc quan',
        riskLevel: 'MEDIUM',
        savings: 20000000,
        gold: 15000000,
        stocks: 10000000,
        bonds: 5000000,
        crypto: 0,
        recommendation:
          'Dựa trên dư nợ thẻ tín dụng hiện tại (15tr VCB, 18.7tr HSBC), bạn nên ưu tiên thanh toán dứt điểm thẻ VIB (lãi 36%) trước. Tăng tỷ trọng tích lũy vàng để dự phòng thanh khoản Q4.',
        marketViews: {
          vcb_lending_rate: 'Tăng 0.5%',
          inflation_forecast: 'Ổn định 3.8%',
          gold_trend: 'Tiếp tục tăng do địa chính trị',
        },
        assetSnapshot: {
          total_assets: 175000000,
          total_debt: userTotalDebt,
          dti_ratio: (userTotalDebt / 35000000) * 100,
        },
      },
    });

    await prisma.userPortfolio.create({
      data: {
        userId: user.id,
        sourceStrategyId: strategy.id,
        savings: 20000000,
        gold: 15000000,
        stocks: 10000000,
        bonds: 5000000,
        crypto: 0,
        notes: 'Danh mục phòng thủ theo tư vấn của FinSight AI.',
      },
    });

    // Debt Goal
    await prisma.debtGoal.create({
      data: { userId: user.id, targetDate: monthsAgo(-18), strategy: 'AVALANCHE' },
    });

    // Snapshots
    await prisma.debtSnapshot.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        userId: user.id,
        totalDebt: userTotalDebt + (11 - i) * 7000000,
        totalEAR: 32 - i * 0.4,
        debtToIncome: Math.min(80, (userTotalDebt / 35000000) * 100) - i * 2,
        createdAt: monthsAgo(12 - i),
      })),
    });

    console.log(`✅ Finished ${master.email}`);
  }
}
