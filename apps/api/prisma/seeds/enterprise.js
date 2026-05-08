import bcrypt from 'bcryptjs';

export async function seedEnterprise(prisma) {
  console.log('🌱 Seeding Enterprise Data (ALPHA MFG JSC)...');

  // Cleanup
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

  const dateOffset = (m, d = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + m);
    date.setDate(date.getDate() + d);
    return date;
  };

  const org = await prisma.organization.create({
    data: {
      taxCode: '0312345678',
      name: 'Công ty Cổ phần Sản xuất và Thương mại Alpha',
      shortName: 'Alpha Manufacturing JSC',
      businessType: 'Sản xuất linh kiện điện tử',
      headquartersAddress: 'TP. Thủ Đức, TP. Hồ Chí Minh',
      equity: 350000000000,
      annualRevenue: 1250000000000,
    },
  });

  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.enterpriseUser.create({
    data: {
      email: 'tin.tran@alphamfg.vn',
      passwordHash,
      fullName: 'Trần Văn Tín',
      roleTitle: 'Giám đốc Tài chính (CFO)',
      phoneNumber: '0901234567',
      organizationId: org.id,
    },
  });

  console.log('✅ Enterprise Data seeded');
}
