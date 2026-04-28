import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper: tạo ngày cách đây N tháng
function monthsAgo(n) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

// Helper: tạo ngày sau N tháng kể từ hôm nay
function monthsFromNow(n) {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d;
}

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean existing data ──────────────────────────────────
  await prisma.allocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.debtGoal.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.debtSnapshot.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.investorProfile.deleteMany();
  await prisma.user.deleteMany();

  // ── Demo User ────────────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: 'demo@finsight.vn',
      password: await bcrypt.hash('Demo@123', 12),
      fullName: 'Nguyễn Văn A',
      monthlyIncome: 15000000,   // 15 triệu / tháng
      extraBudget: 2000000,      // trả thêm 2 triệu / tháng
    },
  });
  console.log('✅ Demo user:', user.email);

  // ─────────────────────────────────────────────────────────
  // DEBTS
  //   Tổng originalAmount = 8M + 12M + 6M + 4M + 3M = 33M
  //   Đã PAID:  SPayLater (8M) + LazPayLater cũ (3M) = 11M trả hết
  //   Còn ACTIVE: balance 7.2M + 4.8M + 1.5M = 13.5M còn lại
  //   → Đã trả ≈ 33M - 13.5M = 19.5M → ~59%  (milestone 25% ✅ + 50% ✅, 75% gần đạt)
  // ─────────────────────────────────────────────────────────

  // 1. PAID — SPayLater điện thoại (đã trả hết 4 tháng trước)
  const debt1 = await prisma.debt.create({
    data: {
      userId: user.id,
      name: 'Mua điện thoại Samsung S23',
      platform: 'SPAYLATER',
      originalAmount: 8000000,
      balance: 0,
      apr: 18,
      rateType: 'FLAT',
      feeProcessing: 0,
      feeInsurance: 0,
      feeManagement: 0,
      feePenaltyPerDay: 0.05,
      minPayment: 666667,
      dueDay: 15,
      termMonths: 12,
      remainingTerms: 0,
      startDate: monthsAgo(12),
      status: 'PAID',
      notes: 'Đã trả xong, tuyệt vời!',
    },
  });

  // Lịch sử thanh toán cho debt1 (12 kỳ)
  await prisma.payment.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      debtId: debt1.id,
      amount: 666667,
      paidAt: monthsAgo(12 - i),
      notes: `Kỳ ${i + 1}/12`,
    })),
  });

  // 2. PAID — LazPayLater đồ gia dụng (đã trả hết 2 tháng trước)
  const debt2 = await prisma.debt.create({
    data: {
      userId: user.id,
      name: 'Mua máy lọc không khí Xiaomi',
      platform: 'LAZPAYLATER',
      originalAmount: 3000000,
      balance: 0,
      apr: 18,
      rateType: 'FLAT',
      feeProcessing: 0,
      feeInsurance: 0,
      feeManagement: 0,
      feePenaltyPerDay: 0.05,
      minPayment: 300000,
      dueDay: 10,
      termMonths: 10,
      remainingTerms: 0,
      startDate: monthsAgo(10),
      status: 'PAID',
    },
  });

  await prisma.payment.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      debtId: debt2.id,
      amount: 300000,
      paidAt: monthsAgo(10 - i),
      notes: `Kỳ ${i + 1}/10`,
    })),
  });

  // ─── 3 khoản ACTIVE được thiết kế để Avalanche ≠ Snowball ───
  //
  //  Khoản          | APR  | Balance | minPay | Avalanche ưu tiên? | Snowball ưu tiên?
  //  Thẻ tín dụng   | 36%  |  1.8M   | 300K   | Không (APR thấp)   | ✅ Có (balance nhỏ nhất)
  //  Home Credit    | 30%  |  7.2M   | 1M     | Không              | Không
  //  FE Credit      | 48%  |  8.5M   | 800K   | ✅ Có (APR cao nhất)| Không (balance lớn nhất)
  //
  //  → Avalanche: FE Credit trước (APR 48%, balance lớn → lãi tích lũy nhiều nhất)
  //  → Snowball:  Thẻ tín dụng trước (balance 1.8M → trả xong nhanh, tạo động lực)
  //  → Kết quả: Avalanche tiết kiệm lãi hơn, Snowball có "win" sớm hơn

  // 3. ACTIVE — Thẻ tín dụng Vietcombank (balance THẤP NHẤT → Snowball chọn trước)
  const debt3 = await prisma.debt.create({
    data: {
      userId: user.id,
      name: 'Thẻ tín dụng Vietcombank',
      platform: 'CREDIT_CARD',
      originalAmount: 4000000,
      balance: 1800000,   // nhỏ nhất → Snowball ưu tiên
      apr: 36,
      rateType: 'REDUCING',
      feeProcessing: 0,
      feeInsurance: 0,
      feeManagement: 0.5,
      feePenaltyPerDay: 0.07,
      minPayment: 300000,
      dueDay: 20,
      termMonths: 12,
      remainingTerms: 6,
      startDate: monthsAgo(6),
      status: 'ACTIVE',
    },
  });

  await prisma.payment.createMany({
    data: Array.from({ length: 6 }, (_, i) => ({
      debtId: debt3.id,
      amount: 300000,
      paidAt: monthsAgo(6 - i),
    })),
  });

  // 4. ACTIVE — Home Credit vay tiêu dùng (balance VỪA)
  const debt4 = await prisma.debt.create({
    data: {
      userId: user.id,
      name: 'Vay tiêu dùng Home Credit',
      platform: 'HOME_CREDIT',
      originalAmount: 12000000,
      balance: 7200000,
      apr: 30,
      rateType: 'FLAT',
      feeProcessing: 1,
      feeInsurance: 0.5,
      feeManagement: 0,
      feePenaltyPerDay: 0.1,
      minPayment: 1000000,
      dueDay: 5,
      termMonths: 18,
      remainingTerms: 8,
      startDate: monthsAgo(10),
      status: 'ACTIVE',
      notes: 'Vay mua laptop cho con học',
    },
  });

  await prisma.payment.createMany({
    data: Array.from({ length: 10 }, (_, i) => ({
      debtId: debt4.id,
      amount: 1000000,
      paidAt: monthsAgo(10 - i),
    })),
  });

  // 5. ACTIVE — FE Credit (APR CAO NHẤT 48% + balance LỚN NHẤT → Avalanche chọn trước)
  const debt5 = await prisma.debt.create({
    data: {
      userId: user.id,
      name: 'FE Credit mua nội thất',
      platform: 'FE_CREDIT',
      originalAmount: 12000000,
      balance: 8500000,   // lớn nhất, APR cao nhất → Avalanche ưu tiên
      apr: 48,
      rateType: 'FLAT',
      feeProcessing: 5,
      feeInsurance: 1,
      feeManagement: 0.5,
      feePenaltyPerDay: 0.15,
      minPayment: 800000,
      dueDay: 25,
      termMonths: 18,
      remainingTerms: 10,
      startDate: monthsAgo(8),
      status: 'ACTIVE',
      notes: 'Lãi cao — Avalanche ưu tiên trả khoản này để tiết kiệm tối đa!',
    },
  });

  await prisma.payment.createMany({
    data: Array.from({ length: 8 }, (_, i) => ({
      debtId: debt5.id,
      amount: 800000,
      paidAt: monthsAgo(8 - i),
    })),
  });

  //   Tổng originalAmount = 8M + 3M + 4M + 12M + 12M = 39M
  //   Còn ACTIVE: 1.8M + 7.2M + 8.5M = 17.5M
  //   Đã trả: 39M - 17.5M = 21.5M → ~55%
  console.log('✅ 5 debts created (2 PAID + 3 ACTIVE)');
  console.log('   📊 Tổng gốc: 39,000,000đ');
  console.log('   ✅ Đã trả:  ~21,500,000đ (~55%)');
  console.log('   💸 Còn lại: ~17,500,000đ');
  console.log('   🎯 Avalanche: FE Credit trước (APR 48%, 8.5M)');
  console.log('   🎯 Snowball : Thẻ tín dụng trước (1.8M nhỏ nhất)');
  console.log('   🏁 Milestone 25% ✅  |  50% ✅  |  75% gần đạt  |  100% chưa');

  // ── Debt Goal ────────────────────────────────────────────
  await prisma.debtGoal.create({
    data: {
      userId: user.id,
      targetDate: monthsFromNow(18),
      strategy: 'AVALANCHE',
    },
  });
  console.log('✅ Debt goal: trả hết trong 18 tháng, Avalanche');

  // ── Investor Profile ─────────────────────────────────────
  await prisma.investorProfile.create({
    data: {
      userId: user.id,
      capital: 20000000,
      monthlyAdd: 2000000,
      goal: 'FINANCIAL_FREEDOM',
      horizon: 'LONG',
      riskLevel: 'MEDIUM',
      riskScore: 55,
    },
  });
  console.log('✅ Investor profile: 20tr vốn, MEDIUM risk');

  // ── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'DEBT_DUE',
        title: 'Nợ sắp đến hạn',
        message: 'FE Credit 400,000đ đáo hạn ngày 25. Còn 2 ngày!',
        severity: 'WARNING',
      },
      {
        userId: user.id,
        type: 'MILESTONE',
        title: '🎉 Vượt mốc 50%!',
        message: 'Bạn đã trả được hơn 50% tổng nợ. Tuyệt vời, tiếp tục nhé!',
        severity: 'INFO',
      },
      {
        userId: user.id,
        type: 'DOMINO_RISK',
        title: 'Gợi ý: Trả dứt FE Credit trước',
        message: 'FE Credit có EAR cao nhất (>55%), trả sớm tiết kiệm được nhiều tiền lãi nhất.',
        severity: 'INFO',
      },
    ],
  });
  console.log('✅ Notifications created');

  // ── Debt Snapshots (lịch sử 6 tháng) ─────────────────────
  await prisma.debtSnapshot.createMany({
    data: [
      { userId: user.id, totalDebt: 34000000, totalEAR: 42.5, debtToIncome: 31.0, createdAt: monthsAgo(5) },
      { userId: user.id, totalDebt: 30500000, totalEAR: 40.2, debtToIncome: 27.5, createdAt: monthsAgo(4) },
      { userId: user.id, totalDebt: 27200000, totalEAR: 39.0, debtToIncome: 25.0, createdAt: monthsAgo(3) },
      { userId: user.id, totalDebt: 23800000, totalEAR: 37.8, debtToIncome: 22.3, createdAt: monthsAgo(2) },
      { userId: user.id, totalDebt: 20500000, totalEAR: 36.5, debtToIncome: 19.7, createdAt: monthsAgo(1) },
      { userId: user.id, totalDebt: 17500000, totalEAR: 35.0, debtToIncome: 14.0, createdAt: new Date() },
    ],
  });
  console.log('✅ Debt snapshots (6 tháng lịch sử)');

  console.log('\n🎉 Seed hoàn tất!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Email    : demo@finsight.vn');
  console.log('🔑 Mật khẩu: Demo@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💰 Thu nhập : 15,000,000đ/tháng');
  console.log('💳 Nợ còn lại: 17,500,000đ (3 khoản ACTIVE)');
  console.log('✅ Đã trả xong: 11,000,000đ (2 khoản PAID)');
  console.log('🎯 Mục tiêu: Trả hết trong 18 tháng (Avalanche)');
  console.log('🏁 Milestone: 25% ✅  50% ✅  75% 🔄  100% 🔒');
  console.log('');
  console.log('🔵 Avalanche ưu tiên: FE Credit (APR 48%, 8.5M)');
  console.log('🟢 Snowball  ưu tiên: Thẻ tín dụng (balance 1.8M nhỏ nhất)');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
