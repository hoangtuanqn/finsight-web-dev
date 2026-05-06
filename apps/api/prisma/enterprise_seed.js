import { PrismaClient } from '@prisma/enterprise';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enterprise database seed...');

  // 0. Clear existing data
  console.log('🧹 Clearing existing enterprise data...');
  await prisma.enterpriseRepaymentPlanItem.deleteMany({});
  await prisma.enterpriseRepaymentPlan.deleteMany({});
  await prisma.debtTransaction.deleteMany({});
  await prisma.debtSchedule.deleteMany({});
  await prisma.debtInterestRate.deleteMany({});
  await prisma.debtDocument.deleteMany({});
  await prisma.enterpriseNotification.deleteMany({});
  await prisma.debtRecord.deleteMany({});
  await prisma.enterpriseBankAccount.deleteMany({});
  await prisma.contact.deleteMany({});
  await prisma.party.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.jobLog.deleteMany({});
  await prisma.enterpriseUser.deleteMany({});
  await prisma.organization.deleteMany({});
  console.log('✨ Database cleared');

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      taxCode: '0123456789',
      name: 'Tập đoàn Công nghệ Đa quốc gia FinSight',
      shortName: 'FinSight Corp',
      businessType: 'Công nghệ & Đầu tư',
      headquartersAddress: 'Lô E2, Khu Công nghệ cao, Quận 9, TP. HCM',
      equity: 500000000000, // 500 tỷ
      annualRevenue: 1200000000000, // 1.200 tỷ (1.2 Trình)
      maxDebtToEquity: 3.0,
      minDSCR: 1.2,
    },
  });

  // 2. Create Admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.enterpriseUser.create({
    data: {
      email: 'admin@enterprise.vn',
      passwordHash,
      fullName: 'Giám đốc Tài chính',
      roleTitle: 'CFO',
      phoneNumber: '0987654321',
      organizationId: org.id,
    },
  });

  // 3. Create Parties
  const bank = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
      shortName: 'Vietcombank',
      internalCode: 'BNK-VCB',
      typeTags: ['BANK'],
      status: 'ACTIVE',
    },
  });

  const taxAuthority = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Tổng cục Thuế Việt Nam',
      shortName: 'VNTax',
      internalCode: 'TAX-AUTHORITY',
      typeTags: ['TAX_AUTHORITY'],
      status: 'ACTIVE',
    },
  });

  const supplier = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Amazon Web Services (AWS)',
      shortName: 'AWS',
      internalCode: 'SUP-AWS',
      typeTags: ['SUPPLIER'],
      status: 'ACTIVE',
    },
  });

  // 4. Create 10 Diverse Debts
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const debts = [
    {
      code: 'LN-BIDV-30B',
      principal: 30000000000,
      rate: 8.2,
      origin: 'FINANCIAL',
      notes: 'Vay đầu tư dây chuyền sản xuất',
    },
    {
      code: 'LN-VCB-10B',
      principal: 10000000000,
      rate: 7.5,
      origin: 'FINANCIAL',
      notes: 'Hạn mức thấu chi vốn lưu động',
    },
    {
      code: 'TX-VAT-5B',
      principal: 5000000000,
      rate: 11.0,
      origin: 'TAX',
      status: 'OVERDUE',
      overdueSince: lastMonth,
      notes: 'Thuế VAT quý 4/2023',
    },
    { code: 'AP-AWS-2B', principal: 2000000000, rate: 0, origin: 'TRADE', notes: 'Phí hạ tầng Cloud' },
    { code: 'LN-SHB-15B', principal: 15000000000, rate: 13.5, origin: 'FINANCIAL', notes: 'Vay tín chấp lãi suất cao' },
    {
      code: 'BD-INT-20B',
      principal: 20000000000,
      rate: 10.5,
      origin: 'FINANCIAL',
      notes: 'Trái phiếu doanh nghiệp đợt 1',
    },
    {
      code: 'LN-MIF-1B',
      principal: 1000000000,
      rate: 18.0,
      origin: 'FINANCIAL',
      notes: 'Vay nóng giải quyết thanh khoản',
    },
    {
      code: 'AP-MICS-3B',
      principal: 3000000000,
      rate: 0,
      origin: 'TRADE',
      status: 'OVERDUE',
      overdueSince: lastMonth,
      notes: 'Tiền bản quyền phần mềm',
    },
    { code: 'LN-OWN-5B', principal: 5000000000, rate: 4.5, origin: 'INTERNAL', notes: 'Vay mượn từ Hội đồng quản trị' },
    {
      code: 'PN-CONT-500M',
      principal: 500000000,
      rate: 15.0,
      origin: 'OTHER',
      status: 'OVERDUE',
      overdueSince: lastMonth,
      notes: 'Phạt vi phạm tiến độ dự án',
    },
  ];

  for (const d of debts) {
    await prisma.debtRecord.create({
      data: {
        organizationId: org.id,
        partyId: d.origin === 'TAX' ? taxAuthority.id : d.origin === 'TRADE' ? supplier.id : bank.id,
        type: 'PAYABLE',
        origin: d.origin,
        principal: d.principal,
        outstanding: d.principal,
        interestMethod: 'REDUCING_BALANCE',
        issueDate: lastMonth,
        dueDate: nextMonth,
        status: d.status || 'ACTIVE',
        internalCode: d.code,
        personInChargeId: admin.id,
        notes: d.notes,
        overdueSince: d.overdueSince,
        interestRates: {
          create: [{ rate: d.rate, effectiveDate: lastMonth, rateType: 'FIXED' }],
        },
        schedules: {
          create: [
            {
              period: 1,
              dueDate: nextMonth,
              principalAmount: d.principal,
              interestAmount: (d.principal * d.rate) / 100 / 12,
              totalAmount: d.principal + (d.principal * d.rate) / 100 / 12,
              remainingPrincipal: 0,
            },
          ],
        },
      },
    });
  }

  console.log('✅ 10 diverse debt records created.');
  console.log('🎉 Enterprise seed finished!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
