import bcrypt from 'bcryptjs';

export async function seedEnterprise(prisma) {
  console.log('🌱 Seeding High-Fidelity Enterprise Data (ALPHA MFG JSC)...');

  // 1. Cleanup existing enterprise data
  const tables = [
    'enterpriseRepaymentPlanItem',
    'enterpriseRepaymentPlan',
    'debtTransaction',
    'debtSchedule',
    'debtInterestRate',
    'debtDocument',
    'enterpriseNotification',
    'debtRecord',
    'enterpriseBankAccount',
    'contact',
    'party',
    'auditLog',
    'jobLog',
    'enterpriseUser',
    'organization',
  ];

  for (const table of tables) {
    await prisma[table].deleteMany({});
  }

  // Helper for dates
  const daysAgo = (d) => {
    const date = new Date();
    date.setDate(date.getDate() - d);
    return date;
  };

  const monthsFromNow = (m) => {
    const date = new Date();
    date.setMonth(date.getMonth() + m);
    return date;
  };

  // 2. Create Organization (ALPHA MFG JSC)
  // A mid-size electronics manufacturer in Vietnam
  const org = await prisma.organization.create({
    data: {
      taxCode: '0312345678',
      name: 'Công ty Cổ phần Sản xuất và Thương mại Alpha',
      shortName: 'Alpha Manufacturing JSC',
      businessType: 'Sản xuất & Lắp ráp linh kiện điện tử',
      headquartersAddress: 'Khu Công nghệ cao (SHTP), TP. Thủ Đức, TP. Hồ Chí Minh',
      equity: 450000000000, // 450B VND
      annualRevenue: 1850000000000, // 1.85T VND
      maxDebtToEquity: 2.5,
      minDSCR: 1.25,
    },
  });

  // 3. Create Enterprise Users
  const passwordHash = await bcrypt.hash('admin123', 10);

  const cfo = await prisma.enterpriseUser.create({
    data: {
      email: 'tin.tran@alphamfg.vn',
      passwordHash,
      fullName: 'Trần Văn Tín',
      roleTitle: 'Giám đốc Tài chính (CFO)',
      phoneNumber: '0901234567',
      organizationId: org.id,
    },
  });

  const accountant = await prisma.enterpriseUser.create({
    data: {
      email: 'ha.le@alphamfg.vn',
      passwordHash,
      fullName: 'Lê Thu Hà',
      roleTitle: 'Kế toán trưởng',
      phoneNumber: '0987654321',
      organizationId: org.id,
    },
  });

  // 4. Create Strategic Parties
  // Bank
  const vcb = await prisma.party.create({
    data: {
      name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
      shortName: 'VCB - Chi nhánh TP.HCM',
      internalCode: 'BANK-VCB-001',
      typeTags: ['BANK'],
      organizationId: org.id,
      personInChargeId: cfo.id,
    },
  });

  // Supplier
  const samsung = await prisma.party.create({
    data: {
      taxCode: '0303030303',
      name: 'Công ty TNHH Samsung Display Việt Nam',
      shortName: 'Samsung Display',
      internalCode: 'SUP-SAM-01',
      typeTags: ['SUPPLIER'],
      creditLimit: 50000000000, // 50B credit limit
      organizationId: org.id,
      personInChargeId: accountant.id,
    },
  });

  // Customer
  const mwg = await prisma.party.create({
    data: {
      taxCode: '0303217354',
      name: 'Công ty Cổ phần Đầu tư Thế Giới Di Động',
      shortName: 'MWG',
      internalCode: 'CUS-MWG-01',
      typeTags: ['CUSTOMER'],
      organizationId: org.id,
      personInChargeId: accountant.id,
    },
  });

  // 5. Debt Records
  // A. Long-term Loan from VCB (Payable)
  const vcbLoan = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: vcb.id,
      type: 'PAYABLE',
      origin: 'FINANCIAL',
      internalCode: 'CONTRACT-VCB-2024-08',
      principal: 80000000000, // 80B VND
      outstanding: 65000000000, // 65B remaining
      interestMethod: 'REDUCING_BALANCE',
      issueDate: daysAgo(180),
      dueDate: monthsFromNow(36),
      status: 'ACTIVE',
      personInChargeId: cfo.id,
      notes: 'Vay vốn lưu động mở rộng dây chuyền sản xuất SMT.',
      interestRates: {
        create: {
          rate: 9.5,
          rateType: 'FLOATING',
          referenceBase: 'VCB-Lending-Base',
          spread: 3.5,
          effectiveDate: daysAgo(180),
        },
      },
    },
  });

  // B. Trade Payable to Samsung Display
  const samsungDebt = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: samsung.id,
      type: 'PAYABLE',
      origin: 'TRADE',
      internalCode: 'PO-SAM-2024-1102',
      principal: 15400000000, // 15.4B VND
      outstanding: 15400000000,
      interestMethod: 'NONE',
      issueDate: daysAgo(20),
      dueDate: monthsFromNow(1),
      status: 'ACTIVE',
      personInChargeId: accountant.id,
      notes: 'Thanh toán lô hàng màn hình OLED nhập khẩu tháng 10.',
    },
  });

  // C. Trade Receivable from MWG (Customer)
  const mwgReceivable = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: mwg.id,
      type: 'RECEIVABLE',
      origin: 'TRADE',
      internalCode: 'INV-MWG-2024-Q4-001',
      principal: 28500000000, // 28.5B VND
      outstanding: 28500000000,
      interestMethod: 'NONE',
      issueDate: daysAgo(10),
      dueDate: monthsFromNow(2),
      status: 'ACTIVE',
      personInChargeId: accountant.id,
      notes: 'Đơn hàng 50,000 bảng mạch điều khiển máy lạnh.',
    },
  });

  // D. An OVERDUE Debt for Demo
  const overdueDebt = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: samsung.id,
      type: 'PAYABLE',
      origin: 'TRADE',
      internalCode: 'PO-SAM-2024-0801',
      principal: 2200000000, // 2.2B VND
      outstanding: 2200000000,
      interestMethod: 'NONE',
      issueDate: daysAgo(100),
      dueDate: daysAgo(10), // Overdue by 10 days
      status: 'OVERDUE',
      overdueSince: daysAgo(10),
      penaltyRate: 0.0005, // 0.05% per day
      gracePeriodDays: 3,
      personInChargeId: accountant.id,
      notes: 'Khoản nợ quá hạn do tranh chấp chất lượng lô hàng vỏ nhựa.',
    },
  });

  // 6. Generate Schedules for VCB Loan
  const vcbSchedules = [];
  for (let i = 1; i <= 12; i++) {
    const isPast = i <= 6;
    vcbSchedules.push({
      debtRecordId: vcbLoan.id,
      period: i,
      dueDate: daysAgo(180 - i * 30),
      principalAmount: 2000000000,
      interestAmount: 550000000,
      totalAmount: 2550000000,
      paidPrincipal: isPast ? 2000000000 : 0,
      paidInterest: isPast ? 550000000 : 0,
      remainingPrincipal: 80000000000 - i * 2000000000,
      status: isPast ? 'PAID' : 'PENDING',
    });
  }
  await prisma.debtSchedule.createMany({ data: vcbSchedules });

  // 7. Generate Transactions
  await prisma.debtTransaction.create({
    data: {
      debtRecordId: vcbLoan.id,
      type: 'PAYMENT',
      amount: 2550000000,
      principalPart: 2000000000,
      interestPart: 550000000,
      paidAt: daysAgo(30),
      paymentMethod: 'BANK_TRANSFER',
      reference: 'VCB-FT-9928374',
      notes: 'Thanh toán kỳ nợ tháng 3/2024.',
      balanceSnapshot: 65000000000,
    },
  });

  // 8. Repayment Plan (Budgeting)
  const plan = await prisma.enterpriseRepaymentPlan.create({
    data: {
      organizationId: org.id,
      userId: cfo.id,
      name: 'Kế hoạch thanh khoản Q4/2024',
      budget: 30000000000, // 30B monthly budget
      strategy: 'COVENANT_RISK',
      month: 11,
      year: 2024,
      status: 'COMMITTED',
      notes: 'Ưu tiên thanh toán khoản vay VCB để duy trì chỉ số DSCR > 1.25.',
      items: {
        create: [
          {
            debtRecordId: vcbLoan.id,
            priority: 1,
            plannedAmount: 2550000000,
            reason: 'Nghĩa vụ nợ ngân hàng định kỳ.',
          },
          {
            debtRecordId: overdueDebt.id,
            priority: 2,
            plannedAmount: 2200000000,
            reason: 'Tất toán nợ quá hạn để tránh phạt lãi.',
          },
        ],
      },
    },
  });

  // 9. Bank Accounts for ALPHA MFG
  await prisma.enterpriseBankAccount.create({
    data: {
      partyId: vcb.id,
      bankName: 'Vietcombank',
      accountNumber: '0011001234567',
      accountHolder: 'CONG TY CP SX VA TM ALPHA',
      branch: 'Sở giao dịch 1 - TP.HCM',
    },
  });

  // 10. Contacts for Parties
  await prisma.contact.createMany({
    data: [
      {
        partyId: vcb.id,
        name: 'Nguyễn Minh Anh',
        position: 'Giám đốc Quan hệ khách hàng DN',
        email: 'anhnm.vcb@vietcombank.com.vn',
        phone: '0912345678',
        isPrimary: true,
      },
      {
        partyId: samsung.id,
        name: 'Park Ji-hoon',
        position: 'Account Manager',
        email: 'jihoon.park@samsung.com',
        phone: '0908889999',
        isPrimary: true,
      },
      {
        partyId: mwg.id,
        name: 'Đặng Thanh Nam',
        position: 'Trưởng phòng Thu mua',
        email: 'nam.dang@thegioididong.com',
        phone: '0933445566',
        isPrimary: true,
      },
    ],
  });

  // 11. Debt Documents
  await prisma.debtDocument.createMany({
    data: [
      {
        debtRecordId: vcbLoan.id,
        name: 'Hợp đồng tín dụng số 123/2024/HĐTD-VCB',
        fileUrl: 'https://storage.finsight.io/docs/vcb-contract-123.pdf',
        fileType: 'application/pdf',
        fileSize: 2450000,
      },
      {
        debtRecordId: samsungDebt.id,
        name: 'Hóa đơn GTGT điện tử số 0009827',
        fileUrl: 'https://storage.finsight.io/docs/inv-sam-0009827.pdf',
        fileType: 'application/pdf',
        fileSize: 1250000,
      },
    ],
  });

  // 12. Milestone-based Debt (Project-based Receivable)
  const milestoneDebt = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: mwg.id,
      type: 'RECEIVABLE',
      origin: 'TRADE',
      internalCode: 'PROJ-MWG-ERP-001',
      principal: 5000000000, // 5B VND
      outstanding: 5000000000,
      interestMethod: 'NONE',
      issueDate: daysAgo(60),
      dueDate: monthsFromNow(6),
      status: 'ACTIVE',
      personInChargeId: accountant.id,
      notes: 'Dự án triển khai hệ thống quản lý kho thông minh.',
      schedules: {
        create: [
          {
            period: 1,
            dueDate: daysAgo(30),
            principalAmount: 1500000000,
            interestAmount: 0,
            totalAmount: 1500000000,
            remainingPrincipal: 3500000000,
            status: 'PAID',
            triggerType: 'MILESTONE',
            triggerCondition: 'Ký kết hợp đồng & Tạm ứng',
            isActivated: true,
            paidPrincipal: 1500000000,
          },
          {
            period: 2,
            dueDate: monthsFromNow(1),
            principalAmount: 2500000000,
            interestAmount: 0,
            totalAmount: 2500000000,
            remainingPrincipal: 1000000000,
            status: 'PENDING',
            triggerType: 'MILESTONE',
            triggerCondition: 'Nghiệm thu Giai đoạn 1 (UAT)',
            isActivated: false,
          },
          {
            period: 3,
            dueDate: monthsFromNow(6),
            principalAmount: 1000000000,
            interestAmount: 0,
            totalAmount: 1000000000,
            remainingPrincipal: 0,
            status: 'PENDING',
            triggerType: 'MILESTONE',
            triggerCondition: 'Bàn giao & Quyết toán (Go-live)',
            isActivated: false,
          },
        ],
      },
    },
  });

  // 13. Notifications
  await prisma.enterpriseNotification.createMany({
    data: [
      {
        organizationId: org.id,
        targetUserId: accountant.id,
        type: 'EVENT_BASED',
        category: 'OVERDUE',
        priority: 'URGENT',
        title: 'CẢNH BÁO: Khoản nợ Samsung Display đã quá hạn 10 ngày',
        content: 'Khoản nợ PO-SAM-2024-0801 (2.2 tỷ) đã quá hạn. Lãi phạt đang tích lũy 1.1 triệu/ngày.',
        debtRecordId: overdueDebt.id,
        data: { debtId: overdueDebt.id, amount: 2200000000 },
      },
      {
        organizationId: org.id,
        targetUserId: cfo.id,
        type: 'EVENT_BASED',
        category: 'LIMIT_BREACH',
        priority: 'IMPORTANT',
        title: 'CẢNH BÁO: Tỷ lệ nợ trên vốn chủ sở hữu (D/E) sắp chạm ngưỡng',
        content: 'Tỷ lệ D/E hiện tại là 2.42, tiệm cận ngưỡng Covenant 2.5 của ngân hàng.',
        data: { currentRatio: 2.42, limit: 2.5 },
      },
    ],
  });

  // 14. Job Logs
  await prisma.jobLog.createMany({
    data: [
      {
        organizationId: org.id,
        jobName: 'JOB_OVERDUE',
        status: 'SUCCESS',
        processedCount: 15,
        durationMs: 450,
        runAt: daysAgo(0),
      },
      {
        organizationId: org.id,
        jobName: 'JOB_PENALTY',
        status: 'SUCCESS',
        processedCount: 1,
        durationMs: 120,
        runAt: daysAgo(0),
      },
    ],
  });

  // 15. Audit Logs
  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: cfo.id,
      action: 'CREATE',
      entityType: 'DEBT_RECORD',
      entityId: vcbLoan.id,
      newValues: { principal: 80000000000, type: 'PAYABLE' },
      reason: 'Khởi tạo khoản vay trung hạn Vietcombank giải ngân dây chuyền SMT.',
    },
  });

  console.log('✅ High-Fidelity Enterprise Data seeded successfully.');
}
