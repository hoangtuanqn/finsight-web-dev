import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: tạo ngày cách đây N tháng
function monthsAgo(n, day = null) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  if (day) d.setDate(day);
  return d;
}

// Helper: tạo ngày sau N tháng kể từ hôm nay
function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

async function main() {
  console.log('🌱 Seeding master database...');

  // ── Clean existing data ──────────────────────────────────
  await prisma.userPortfolio.deleteMany();
  await prisma.aIStrategy.deleteMany();
  await prisma.article.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.debtGoal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.debtSnapshot.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.investorProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Master User ──────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: 'phamhoangtuanqn@gmail.com',
      password: await bcrypt.hash('Master@123', 12),
      fullName: 'Hoàng Minh Tuấn',
      monthlyIncome: 25000000,   // 25 triệu / tháng
      extraBudget: 5000000,      // trả thêm 5 triệu / tháng
      level: 'PROMAX',
      strategyQuota: 50,
    },
  });
  console.log('✅ Master user:', user.email);

  // ── Articles ──────────────────────────────────────────────
  await prisma.article.createMany({
    data: [
      {
        title: '7 Bước Thoát Khỏi Nợ Nần Năm 2026',
        author: 'FinSight Team',
        date: '2026-04-20',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
        excerpt: 'Hướng dẫn chi tiết cách quản lý dòng tiền và ưu tiên trả nợ thông minh.',
        content: 'Nội dung chi tiết về các bước thoát nợ...',
        category: 'GUIDE',
      },
      {
        title: 'Câu Chuyện Thành Công: Từ Nợ 500 Triệu Đến Tự Do Tài Chính',
        author: 'Nguyễn Văn B',
        date: '2026-04-15',
        imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
        excerpt: 'Hành trình 3 năm kiên trì áp dụng phương pháp Snowball.',
        content: 'Nội dung câu chuyện truyền cảm hứng...',
        category: 'STORY',
      },
      {
        title: 'Lãi Suất Ngân Hàng Tháng 4/2026: Biến Động Nhẹ',
        author: 'Phân Tích Viên',
        date: '2026-04-22',
        imageUrl: 'https://images.unsplash.com/photo-1611974717484-7bc7497bc391?w=800',
        excerpt: 'Cập nhật tình hình lãi suất huy động và lãi suất cho vay mới nhất.',
        content: 'Phân tích thị trường tài chính tháng 4...',
        category: 'NEWS',
      },
    ],
  });
  console.log('✅ Articles created');

  // ── 15 DEBTS ─────────────────────────────────────────────
  const debtsData = [
    // 1. PAID
    {
      name: 'Samsung S23 Ultra (SPayLater)',
      platform: 'SPAYLATER',
      originalAmount: 12000000,
      balance: 0,
      apr: 18,
      rateType: 'FLAT',
      minPayment: 1000000,
      dueDay: 15,
      termMonths: 12,
      remainingTerms: 0,
      startDate: monthsAgo(13),
      status: 'PAID',
    },
    // 2. PAID
    {
      name: 'Máy giặt LG (LazPayLater)',
      platform: 'LAZPAYLATER',
      originalAmount: 6000000,
      balance: 0,
      apr: 24,
      rateType: 'FLAT',
      minPayment: 500000,
      dueDay: 10,
      termMonths: 12,
      remainingTerms: 0,
      startDate: monthsAgo(14),
      status: 'PAID',
    },
    // 3. ACTIVE - VCB Credit Card (High Balance)
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
    // 4. ACTIVE - Home Credit (Mid Balance)
    {
      name: 'Vay trả góp Laptop Dell',
      platform: 'HOME_CREDIT',
      originalAmount: 20000000,
      balance: 8000000,
      apr: 32,
      rateType: 'FLAT',
      minPayment: 1800000,
      dueDay: 5,
      termMonths: 12,
      remainingTerms: 5,
      startDate: monthsAgo(7),
      status: 'ACTIVE',
    },
    // 5. ACTIVE - FE Credit (Avalanche Target)
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
    // 6. ACTIVE - MB Bank (Snowball Target)
    {
      name: 'Thẻ tín dụng MB Modern Youth',
      platform: 'CREDIT_CARD',
      originalAmount: 5000000,
      balance: 1200000,
      apr: 30,
      rateType: 'REDUCING',
      minPayment: 200000,
      dueDay: 15,
      termMonths: 0,
      remainingTerms: 0,
      startDate: monthsAgo(3),
      status: 'ACTIVE',
    },
    // 7. ACTIVE - VIB
    {
      name: 'Thẻ VIB Cash Back',
      platform: 'CREDIT_CARD',
      originalAmount: 30000000,
      balance: 12000000,
      apr: 36,
      rateType: 'REDUCING',
      minPayment: 1000000,
      dueDay: 28,
      termMonths: 0,
      remainingTerms: 0,
      startDate: monthsAgo(10),
      status: 'ACTIVE',
    },
    // 8. ACTIVE - HDBank
    {
      name: 'Vay sửa nhà HDBank',
      platform: 'BANK',
      originalAmount: 100000000,
      balance: 85000000,
      apr: 12,
      rateType: 'REDUCING',
      minPayment: 3500000,
      dueDay: 1,
      termMonths: 48,
      remainingTerms: 36,
      startDate: monthsAgo(12),
      status: 'ACTIVE',
    },
    // 9. ACTIVE - Personal Loan
    {
      name: 'Mượn anh Hai',
      platform: 'PERSONAL',
      originalAmount: 10000000,
      balance: 5000000,
      apr: 0,
      rateType: 'FLAT',
      minPayment: 1000000,
      dueDay: 30,
      termMonths: 10,
      remainingTerms: 5,
      startDate: monthsAgo(5),
      status: 'ACTIVE',
    },
    // 10. ACTIVE - Tima
    {
      name: 'Vay nhanh Tima',
      platform: 'TIMA',
      originalAmount: 5000000,
      balance: 2000000,
      apr: 60,
      rateType: 'FLAT',
      minPayment: 800000,
      dueDay: 18,
      termMonths: 6,
      remainingTerms: 2,
      startDate: monthsAgo(4),
      status: 'ACTIVE',
    },
    // 11. PAID
    {
      name: 'Vay mua Honda Vision (Mcredit)',
      platform: 'MCREDIT',
      originalAmount: 25000000,
      balance: 0,
      apr: 28,
      rateType: 'FLAT',
      minPayment: 1500000,
      dueDay: 8,
      termMonths: 24,
      remainingTerms: 0,
      startDate: monthsAgo(26),
      status: 'PAID',
    },
    // 12. PAID
    {
      name: 'Tủ lạnh Samsung (HD SAISON)',
      platform: 'HDSAISON',
      originalAmount: 8000000,
      balance: 0,
      apr: 30,
      rateType: 'FLAT',
      minPayment: 800000,
      dueDay: 12,
      termMonths: 12,
      remainingTerms: 0,
      startDate: monthsAgo(15),
      status: 'PAID',
    },
    // 13. DELETED (Trash Bin)
    {
      name: 'Thẻ TPBank Evo (Hủy)',
      platform: 'CREDIT_CARD',
      originalAmount: 10000000,
      balance: 2000000,
      apr: 32,
      rateType: 'REDUCING',
      minPayment: 500000,
      dueDay: 22,
      termMonths: 0,
      remainingTerms: 0,
      startDate: monthsAgo(8),
      status: 'CLOSED',
      deletedAt: new Date(),
    },
    // 14. ACTIVE - Mirae Asset
    {
      name: 'Vay Mirae Asset',
      platform: 'MIRAE_ASSET',
      originalAmount: 15000000,
      balance: 9000000,
      apr: 38,
      rateType: 'FLAT',
      minPayment: 1200000,
      dueDay: 14,
      termMonths: 18,
      remainingTerms: 10,
      startDate: monthsAgo(8),
      status: 'ACTIVE',
    },
    // 15. ACTIVE - Shinhan Bank
    {
      name: 'Thẻ tín dụng Shinhan Hi-Point',
      platform: 'CREDIT_CARD',
      originalAmount: 40000000,
      balance: 28000000,
      apr: 26,
      rateType: 'REDUCING',
      minPayment: 2000000,
      dueDay: 10,
      termMonths: 0,
      remainingTerms: 0,
      startDate: monthsAgo(11),
      status: 'ACTIVE',
    },
  ];

  for (const debtInfo of debtsData) {
    const debt = await prisma.debt.create({
      data: {
        userId: user.id,
        ...debtInfo,
      },
    });

    // Tạo lịch sử thanh toán giả lập
    // Tính toán số tháng từ startDate đến nay
    const start = new Date(debtInfo.startDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

    // Nếu là PAID thì có thể đã trả xong từ lâu, nếu ACTIVE thì trả đến tháng hiện tại
    const paymentsToCreate = debtInfo.status === 'PAID'
      ? (debtInfo.termMonths || 12)
      : Math.min(diffMonths, 12); // Tối đa 12 tháng lịch sử cho ACTIVE

    if (paymentsToCreate > 0) {
      const payments = [];
      for (let i = 0; i < paymentsToCreate; i++) {
        const monthOffset = paymentsToCreate - i;
        const payDate = monthsAgo(monthOffset, debtInfo.dueDay - Math.floor(Math.random() * 3)); // Trả trước hạn 0-2 ngày

        // Random số tiền một chút để biểu đồ dao động (minPayment +/- 10%)
        const variance = (Math.random() * 0.2 - 0.1) * debtInfo.minPayment;
        const amount = Math.round(debtInfo.minPayment + variance);

        payments.push({
          debtId: debt.id,
          amount: amount > 0 ? amount : debtInfo.minPayment,
          paidAt: payDate,
          notes: `Thanh toán kỳ ${i + 1}`,
        });
      }

      await prisma.payment.createMany({ data: payments });
    }
  }
  console.log('✅ 15 debts and payments created');

  // ── Debt Goal ────────────────────────────────────────────
  await prisma.debtGoal.create({
    data: {
      userId: user.id,
      targetDate: monthsFromNow(24),
      strategy: 'AVALANCHE',
    },
  });
  console.log('✅ Debt goal created');

  // ── Investor Profile ─────────────────────────────────────
  await prisma.investorProfile.create({
    data: {
      userId: user.id,
      capital: 150000000,
      monthlyAdd: 5000000,
      goal: 'RETIRE_EARLY',
      horizon: 'LONG',
      riskLevel: 'HIGH',
      riskScore: 78,
    },
  });
  console.log('✅ Investor profile created');

  // ── AI Strategy ──────────────────────────────────────────
  const strategy = await prisma.aIStrategy.create({
    data: {
      userId: user.id,
      sentimentValue: 65,
      sentimentLabel: 'Greed',
      riskLevel: 'HIGH',
      savings: 10,
      gold: 15,
      stocks: 50,
      bonds: 15,
      crypto: 10,
      recommendation: 'Thị trường đang có xu hướng tích cực, hãy tập trung vào cổ phiếu tăng trưởng.',
    },
  });
  console.log('✅ AI Strategy created');

  // ── User Portfolio ───────────────────────────────────────
  await prisma.userPortfolio.create({
    data: {
      userId: user.id,
      sourceStrategyId: strategy.id,
      savings: 10,
      gold: 15,
      stocks: 50,
      bonds: 15,
      crypto: 10,
      notes: 'Danh mục thực tế đang bám sát chiến lược AI.',
    },
  });
  console.log('✅ User Portfolio created');

  // ── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'DEBT_DUE',
        title: 'Khoản nợ FE Credit sắp đến hạn',
        message: 'Bạn cần thanh toán 2,500,000đ trước ngày 25/04.',
        severity: 'WARNING',
      },
      {
        userId: user.id,
        type: 'MILESTONE',
        title: 'Thành tích mới!',
        message: 'Bạn đã hoàn tất trả nợ cho SPayLater. Giảm gánh nặng lãi suất 18%/năm.',
        severity: 'SUCCESS',
      },
    ],
  });

  // ── Debt Snapshots (12 tháng lịch sử) ─────────────────────
  await prisma.debtSnapshot.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      userId: user.id,
      totalDebt: 250000000 - (i * 10000000),
      totalEAR: 35 - (i * 0.5),
      debtToIncome: 45 - (i * 2),
      createdAt: monthsAgo(12 - i),
    })),
  });
  console.log('✅ Debt snapshots created');

  console.log('\n🚀 Master Seed hoàn tất!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email    : phamhoangtuanqn@gmail.com');
  console.log('🔑 Mật khẩu: Master@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
