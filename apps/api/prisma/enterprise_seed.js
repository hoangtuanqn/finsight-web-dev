import { PrismaClient } from '@prisma/enterprise';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting enterprise database seed...');

  // 0. Clear existing data
  console.log('🧹 Clearing existing enterprise data...');
  // Delete in reverse dependency order
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
      name: 'Công ty Cổ phần Techcom Enterprise',
      shortName: 'TechcomEnt',
      businessType: 'Công nghệ thông tin',
      headquartersAddress: 'Toà nhà Keangnam, Phạm Hùng, Hà Nội',
      equity: 50000000000, // 50 tỷ
      annualRevenue: 120000000000, // 120 tỷ
      maxDebtToEquity: 2.5,
      minDSCR: 1.5,
    },
  });
  console.log('✅ Organization created:', org.name);

  // 2. Create Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.enterpriseUser.create({
    data: {
      email: 'admin@enterprise.vn',
      passwordHash,
      fullName: 'Quản trị viên Hệ thống',
      roleTitle: 'Giám đốc Tài chính (CFO)',
      phoneNumber: '0987654321',
      organizationId: org.id,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // 3. Create Parties (Customers, Suppliers, Banks)
  // Party 1: Customer
  const customer = await prisma.party.create({
    data: {
      organizationId: org.id,
      taxCode: '0312345678',
      name: 'Công ty Cổ phần Bán lẻ Vina',
      shortName: 'VinaRetail',
      internalCode: 'KH-001',
      typeTags: ['CUSTOMER'],
      creditLimit: 5000000000, // 5 tỷ
      personInChargeId: admin.id,
      status: 'ACTIVE',
      isRelatedParty: false,
      contacts: {
        create: [
          {
            name: 'Nguyễn Văn Khách',
            position: 'Giám đốc Mua hàng',
            email: 'khachhang@vinaretail.com',
            phone: '0901234567',
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Party 2: Supplier
  const supplier = await prisma.party.create({
    data: {
      organizationId: org.id,
      taxCode: '0101234567',
      name: 'Công ty TNHH Cung ứng Toàn cầu',
      shortName: 'GlobalSupply',
      internalCode: 'NCC-001',
      typeTags: ['SUPPLIER'],
      creditLimit: 2000000000, // 2 tỷ
      personInChargeId: admin.id,
      status: 'ACTIVE',
      isRelatedParty: true, // Related party for testing
      contacts: {
        create: [
          {
            name: 'Trần Thị Cung',
            position: 'Trưởng phòng Kinh doanh',
            email: 'sales@globalsupply.com',
            phone: '0912345678',
            isPrimary: true,
          },
        ],
      },
      bankAccounts: {
        create: [
          {
            bankName: 'Vietcombank',
            accountNumber: '1012345678',
            accountHolder: 'CÔNG TY TNHH CUNG ỨNG TOÀN CẦU',
            branch: 'Chi nhánh Hà Nội',
          },
        ],
      },
    },
  });

  // Party 3: Bank
  const bank = await prisma.party.create({
    data: {
      organizationId: org.id,
      taxCode: '0100112437',
      name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
      shortName: 'Vietcombank',
      internalCode: 'NH-001',
      typeTags: ['BANK'],
      creditLimit: 10000000000, // 10 tỷ
      status: 'ACTIVE',
    },
  });
  console.log('✅ Parties created');

  // 4. Create Debt Records (Khoản phải thu & Khoản phải trả)

  // Khoản phải thu (Receivable from Customer)
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const receivable = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: customer.id,
      type: 'RECEIVABLE',
      origin: 'TRADE',
      principal: 1200000000, // 1.2 tỷ
      outstanding: 1200000000,
      interestMethod: 'NONE',
      issueDate: today,
      dueDate: nextMonth,
      status: 'ACTIVE',
      internalCode: 'AR-2023-001',
      personInChargeId: admin.id,
      notes: 'Hợp đồng cung cấp phần mềm ERP',
      penaltyRate: 0.0005, // 0.05% per day
      gracePeriodDays: 3,
      schedules: {
        create: [
          {
            period: 1,
            dueDate: nextMonth,
            principalAmount: 1200000000,
            interestAmount: 0,
            totalAmount: 1200000000,
            remainingPrincipal: 0,
          },
        ],
      },
    },
  });

  // Khoản phải trả (Payable to Supplier)
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const payable = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: supplier.id,
      type: 'PAYABLE',
      origin: 'TRADE',
      principal: 500000000, // 500 triệu
      outstanding: 500000000,
      interestMethod: 'NONE',
      issueDate: lastMonth,
      dueDate: today,
      status: 'ACTIVE',
      internalCode: 'AP-2023-001',
      personInChargeId: admin.id,
      notes: 'Nhập lô hàng server',
      penaltyRate: 0.001, // 0.1% per day
      gracePeriodDays: 0,
      schedules: {
        create: [
          {
            period: 1,
            dueDate: today,
            principalAmount: 500000000,
            interestAmount: 0,
            totalAmount: 500000000,
            remainingPrincipal: 0,
          },
        ],
      },
    },
  });

  // Khoản vay ngân hàng (Bank Loan - Payable)
  const nextYear = new Date(today);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const bankLoan = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: bank.id,
      type: 'PAYABLE',
      origin: 'FINANCIAL',
      principal: 5000000000, // 5 tỷ
      outstanding: 5000000000,
      interestMethod: 'REDUCING_BALANCE',
      issueDate: today,
      dueDate: nextYear,
      status: 'ACTIVE',
      internalCode: 'LN-VCB-001',
      personInChargeId: admin.id,
      notes: 'Vay vốn lưu động 12 tháng',
      penaltyRate: 0.0003,
      gracePeriodDays: 5,
      interestRates: {
        create: [
          {
            rate: 8.5,
            effectiveDate: today,
            rateType: 'FIXED',
          },
        ],
      },
      schedules: {
        create: Array.from({ length: 12 }).map((_, i) => {
          const date = new Date(today);
          date.setMonth(date.getMonth() + i + 1);
          // Simplified equal principal payment
          const principalAmount = 5000000000 / 12;
          const remainingPrincipal = 5000000000 - principalAmount * (i + 1);
          const interestAmount = (5000000000 - principalAmount * i) * (8.5 / 100 / 12);

          return {
            period: i + 1,
            dueDate: date,
            principalAmount,
            interestAmount,
            totalAmount: principalAmount + interestAmount,
            remainingPrincipal: Math.max(0, remainingPrincipal),
          };
        }),
      },
    },
  });

  // Floating Rate Loan
  const floatingLoan = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: bank.id,
      type: 'PAYABLE',
      origin: 'FINANCIAL',
      principal: 2000000000, // 2 tỷ
      outstanding: 2000000000,
      interestMethod: 'REDUCING_BALANCE',
      issueDate: lastMonth,
      dueDate: nextYear,
      status: 'ACTIVE',
      internalCode: 'LN-VCB-002',
      personInChargeId: admin.id,
      notes: 'Vay lãi suất tham chiếu SOFR',
      penaltyRate: 0.0003,
      gracePeriodDays: 5,
      interestRates: {
        create: [
          {
            rate: 7.2, // Base + Spread
            effectiveDate: lastMonth,
            rateType: 'REFERENCE',
            referenceBase: 'SOFR',
            spread: 2.5,
          },
        ],
      },
      schedules: {
        create: [
          {
            period: 1,
            dueDate: today,
            principalAmount: 0,
            interestAmount: 2000000000 * (7.2 / 100 / 12),
            totalAmount: 2000000000 * (7.2 / 100 / 12),
            remainingPrincipal: 2000000000,
          },
        ],
      },
    },
  });

  // Khoản phải thu quá hạn (Overdue Receivable)
  const overdueDate = new Date(today);
  overdueDate.setMonth(overdueDate.getMonth() - 2);
  const overdueDueDate = new Date(today);
  overdueDueDate.setMonth(overdueDueDate.getMonth() - 1);

  const overdueReceivable = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: customer.id,
      type: 'RECEIVABLE',
      origin: 'TRADE',
      principal: 800000000, // 800 triệu
      outstanding: 800000000,
      interestMethod: 'NONE',
      issueDate: overdueDate,
      dueDate: overdueDueDate,
      status: 'OVERDUE',
      internalCode: 'AR-2023-002',
      personInChargeId: admin.id,
      notes: 'Khoản thu quá hạn từ tháng trước',
      overdueSince: overdueDueDate,
      penaltyRate: 0.0005,
      gracePeriodDays: 2,
      schedules: {
        create: [
          {
            period: 1,
            dueDate: overdueDueDate,
            principalAmount: 800000000,
            interestAmount: 0,
            totalAmount: 800000000,
            remainingPrincipal: 0,
            status: 'OVERDUE',
            isOverdue: true,
            overdueSince: overdueDueDate,
          },
        ],
      },
    },
  });

  // Create a partial payment transaction for the Supplier payable
  await prisma.debtTransaction.create({
    data: {
      debtRecordId: payable.id,
      type: 'PAYMENT',
      amount: 100000000, // 100 triệu
      principalPart: 100000000,
      paymentMethod: 'BANK_TRANSFER',
      reference: 'CK123456',
      notes: 'Thanh toán đợt 1',
      balanceSnapshot: 400000000,
    },
  });

  // Update the payable outstanding and schedule
  await prisma.debtRecord.update({
    where: { id: payable.id },
    data: {
      outstanding: 400000000,
      status: 'PARTIAL',
    },
  });

  const payableSchedule = await prisma.debtSchedule.findFirst({
    where: { debtRecordId: payable.id },
  });

  if (payableSchedule) {
    await prisma.debtSchedule.update({
      where: { id: payableSchedule.id },
      data: {
        paidPrincipal: 100000000,
        status: 'PARTIAL',
        remainingPrincipal: 400000000,
      },
    });
  }

  console.log('✅ Debt Records and Transactions created');

  console.log('🎉 Enterprise seed data successfully created!');
  console.log('Login: admin@enterprise.vn / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
