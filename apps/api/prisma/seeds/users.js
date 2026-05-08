import bcrypt from 'bcryptjs';

const MASTER_USERS = [
  { email: 'phamhoangtuanqn@gmail.com', fullName: 'Phạm Hoàng Tuấn' },
  { email: 'ducphucdn2006@gmail.com', fullName: 'Trần Đức Phúc' },
  { email: 'nguyenvangiabinh22072006@gmail.com', fullName: 'Nguyễn Văn Gia Bình' },
  { email: 'lamhoangan612@gmail.com', fullName: 'Lâm Hoàng An' },
  { email: 'taikhoanstudycuabinh@gmail.com', fullName: 'Lê Gia Bảo' },
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
    minPayment: 1500000,
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
    balance: 22000000,
    apr: 45,
    rateType: 'FLAT',
    minPayment: 2500000,
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
    balance: 12000000,
    apr: 30,
    rateType: 'FLAT',
    minPayment: 2800000,
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
    balance: 28000000,
    apr: 32,
    rateType: 'REDUCING',
    minPayment: 1400000,
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
    balance: 75000000,
    apr: 18,
    rateType: 'REDUCING',
    minPayment: 3200000,
    dueDay: 10,
    termMonths: 36,
    remainingTerms: 24,
    startDate: monthsAgo(12),
    status: 'ACTIVE',
  },
  {
    name: 'Ví trả sau MoMo (TPBank)',
    platform: 'E_WALLET',
    originalAmount: 5000000,
    balance: 1200000,
    apr: 40,
    rateType: 'FLAT',
    minPayment: 500000,
    dueDay: 25,
    termMonths: 1,
    remainingTerms: 1,
    startDate: monthsAgo(1),
    status: 'ACTIVE',
  },
  {
    name: 'Vay mua xe Honda SH (Mcredit)',
    platform: 'MCREDIT',
    originalAmount: 85000000,
    balance: 45000000,
    apr: 24,
    rateType: 'FLAT',
    minPayment: 4200000,
    dueDay: 15,
    termMonths: 24,
    remainingTerms: 12,
    startDate: monthsAgo(12),
    status: 'ACTIVE',
  },
  {
    name: 'Thẻ tín dụng VIB Online Plus',
    platform: 'CREDIT_CARD',
    originalAmount: 30000000,
    balance: 8000000,
    apr: 36,
    rateType: 'REDUCING',
    minPayment: 800000,
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
    balance: 18000000,
    apr: 22,
    rateType: 'REDUCING',
    minPayment: 1000000,
    dueDay: 5,
    termMonths: 0,
    remainingTerms: 0,
    startDate: monthsAgo(3),
    status: 'ACTIVE',
  },
  {
    name: 'Nợ học phí (Mượn bạn)',
    platform: 'PERSONAL',
    originalAmount: 15000000,
    balance: 5000000,
    apr: 0,
    rateType: 'FLAT',
    minPayment: 2000000,
    dueDay: 30,
    termMonths: 8,
    remainingTerms: 3,
    startDate: monthsAgo(5),
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

    // Debts & Payments
    for (const debtTemplate of DEBTS_TEMPLATE) {
      const debt = await prisma.debt.create({
        data: { userId: user.id, ...debtTemplate },
      });

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

    // Debt Goal
    await prisma.debtGoal.create({
      data: { userId: user.id, targetDate: monthsAgo(-18), strategy: 'AVALANCHE' },
    });

    // Snapshots
    await prisma.debtSnapshot.createMany({
      data: Array.from({ length: 12 }, (_, i) => ({
        userId: user.id,
        totalDebt: 350000000 - i * 15000000,
        totalEAR: 28 - i * 0.4,
        debtToIncome: 40 - i * 1.5,
        createdAt: monthsAgo(12 - i),
      })),
    });

    console.log(`✅ Finished ${master.email}`);
  }
}
