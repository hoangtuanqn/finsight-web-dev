import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  console.log('🔍 Verifying master account data...');
  
  const user = await prisma.user.findUnique({
    where: { email: 'phamhoangtuanqn@gmail.com' },
    include: {
      debts: { include: { payments: true } },
      investorProfile: true,
      aiStrategies: true,
      userPortfolio: true,
      debtGoal: true,
    }
  });

  if (!user) {
    console.error('❌ User master@finsight.vn not found!');
    return;
  }

  console.log(`✅ User: ${user.fullName} (${user.email})`);
  console.log(`✅ Level: ${user.level}, Quota: ${user.strategyQuota}`);
  console.log(`✅ Debts count: ${user.debts.length}`);
  
  const activeDebts = user.debts.filter(d => d.status === 'ACTIVE');
  const paidDebts = user.debts.filter(d => d.status === 'PAID');
  const closedDebts = user.debts.filter(d => d.status === 'CLOSED');
  
  console.log(`   - ACTIVE: ${activeDebts.length}`);
  console.log(`   - PAID: ${paidDebts.length}`);
  console.log(`   - CLOSED/TRASH: ${closedDebts.length}`);

  const totalPayments = user.debts.reduce((sum, d) => sum + d.payments.length, 0);
  console.log(`✅ Total payments: ${totalPayments}`);

  if (user.debts.length > 0 && user.debts[0].payments.length > 0) {
    const p = user.debts[0].payments;
    const dates = p.map(x => new Date(x.paidAt)).sort((a,b) => a-b);
    console.log(`📊 Sample Debt [${user.debts[0].name}] Payment Range:`);
    console.log(`   - Start: ${dates[0].toLocaleDateString('vi-VN')}`);
    console.log(`   - End  : ${dates[dates.length-1].toLocaleDateString('vi-VN')}`);
    console.log(`   - Month count: ${new Set(dates.map(d => d.getMonth())).size}`);
  }

  console.log(`✅ Investor Profile: ${user.investorProfile ? 'Exists' : 'Missing'}`);
  console.log(`✅ AI Strategies: ${user.aiStrategies.length}`);
  console.log(`✅ User Portfolio: ${user.userPortfolio ? 'Exists' : 'Missing'}`);
  console.log(`✅ Debt Goal: ${user.debtGoal ? 'Exists' : 'Missing'}`);

  const articlesCount = await prisma.article.count();
  console.log(`✅ Articles in DB: ${articlesCount}`);

  await prisma.$disconnect();
}

verify();
