import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.allocation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.debtSnapshot.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.investorProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: 'demo@finsight.vn',
      password: await bcrypt.hash('Demo@123', 12),
      fullName: 'Nguyễn Văn A',
      monthlyIncome: 12000000,
      extraBudget: 1500000,
    },
  });
  console.log('✅ Demo user created:', user.email);

  // Create 3 demo debts
  const debts = await Promise.all([
    prisma.debt.create({
      data: {
        userId: user.id,
        name: 'Mua điện thoại Samsung',
        platform: 'SPAYLATER',
        originalAmount: 8000000,
        balance: 5200000,
        apr: 18,
        rateType: 'FLAT',
        feeProcessing: 0,
        feeInsurance: 0,
        feeManagement: 0,
        feePenaltyPerDay: 0.05,
        minPayment: 666666,
        dueDay: 15,
        termMonths: 12,
        remainingTerms: 8,
      },
    }),
    prisma.debt.create({
      data: {
        userId: user.id,
        name: 'Thẻ tín dụng Vietcombank',
        platform: 'CREDIT_CARD',
        originalAmount: 5000000,
        balance: 4800000,
        apr: 36,
        rateType: 'REDUCING',
        feeProcessing: 0,
        feeInsurance: 0,
        feeManagement: 0.5,
        feePenaltyPerDay: 0.07,
        minPayment: 500000,
        dueDay: 20,
        termMonths: 12,
        remainingTerms: 11,
      },
    }),
    prisma.debt.create({
      data: {
        userId: user.id,
        name: 'Mua đồ gia dụng',
        platform: 'LAZPAYLATER',
        originalAmount: 3000000,
        balance: 1800000,
        apr: 18,
        rateType: 'FLAT',
        feeProcessing: 0,
        feeInsurance: 0,
        feeManagement: 0,
        feePenaltyPerDay: 0.05,
        minPayment: 300000,
        dueDay: 10,
        termMonths: 10,
        remainingTerms: 6,
      },
    }),
  ]);
  console.log(`✅ ${debts.length} debts created (SPayLater 5.2tr, Credit Card 4.8tr, LazPayLater 1.8tr)`);

  // Create investor profile
  const profile = await prisma.investorProfile.create({
    data: {
      userId: user.id,
      capital: 15000000,
      monthlyAdd: 2000000,
      goal: 'FINANCIAL_FREEDOM',
      horizon: 'LONG',
      riskLevel: 'MEDIUM',
      riskScore: 55,
    },
  });
  console.log('✅ Investor profile created: 15tr capital, MEDIUM risk, score 55');

  // Create some notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: 'DEBT_DUE',
        title: 'Nợ sắp đến hạn',
        message: 'Khoản LazPayLater dự kiến 300,000đ đáo hạn ngày 10. Hãy chuẩn bị!',
        severity: 'WARNING',
      },
      {
        userId: user.id,
        type: 'DOMINO_RISK',
        title: 'Cảnh báo hiệu ứng Domino',
        message: 'Tổng nợ hàng tháng chiếm hơn 12% thu nhập. Cần theo dõi cẩn thận.',
        severity: 'INFO',
      },
    ],
  });
  console.log('✅ Sample notifications created');

  console.log('\n🎉 Seed completed!');
  console.log('📧 Login: demo@finsight.vn / Demo@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
