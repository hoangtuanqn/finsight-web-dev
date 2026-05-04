import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@finsight.vn';
  const rawPassword = 'demo_password_123';
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  // Clean up existing demo user
  await prisma.user.deleteMany({ where: { email } });

  console.log('Creating demo user...');
  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'Nguyễn Minh Khải',
      monthlyIncome: 22000000,
      extraBudget: 3000000,
      password: hashedPassword,
      level: 'PROMAX',
      healthScore: 635,
      kycStatus: 'APPROVED',
    },
  });

  const userId = user.id;

  // --- 1. Wallets ---
  console.log('Creating Wallets...');
  const cashWallet = await prisma.wallet.create({
    data: { userId, name: 'Tiền mặt', type: 'CASH', balance: 1200000, isDefault: true, color: '#10b981' },
  });
  const vcbWallet = await prisma.wallet.create({
    data: { userId, name: 'Vietcombank', type: 'BANK', balance: 8500000, isDefault: false, color: '#3b82f6' },
  });
  const tcbWallet = await prisma.wallet.create({
    data: { userId, name: 'Techcombank', type: 'BANK', balance: 3200000, isDefault: false, color: '#ef4444' },
  });
  const momoWallet = await prisma.wallet.create({
    data: { userId, name: 'MoMo', type: 'E_WALLET', balance: 450000, isDefault: false, color: '#d946ef' },
  });

  // --- 2. Debts ---
  console.log('Creating Debts...');
  const today = new Date();

  // ACTIVE Debts
  const debt1 = await prisma.debt.create({
    data: {
      userId,
      name: 'Vay mua xe máy Honda Air Blade',
      platform: 'MCredit',
      debtType: 'INSTALLMENT',
      originalAmount: 30000000,
      balance: 18500000,
      apr: 28,
      rateType: 'FLAT',
      minPayment: 1800000,
      dueDay: 5,
      termMonths: 36,
      remainingTerms: 18,
      status: 'ACTIVE',
    },
  });
  const debt2 = await prisma.debt.create({
    data: {
      userId,
      name: 'Thẻ TD Vietcombank Platinum',
      platform: 'CREDIT_CARD',
      debtType: 'CREDIT_CARD',
      originalAmount: 50000000,
      balance: 23800000,
      apr: 29.8,
      rateType: 'REDUCING',
      minPayment: 1190000,
      dueDay: 20,
      termMonths: 0,
      remainingTerms: 0,
      status: 'ACTIVE',
    },
  });
  const debt3 = await prisma.debt.create({
    data: {
      userId,
      name: 'Vay mua Laptop Asus',
      platform: 'Home Credit',
      debtType: 'INSTALLMENT',
      originalAmount: 22000000,
      balance: 7300000,
      apr: 36,
      rateType: 'FLAT',
      minPayment: 1830000,
      dueDay: 10,
      termMonths: 18,
      remainingTerms: 4,
      status: 'ACTIVE',
    },
  });
  const debt4 = await prisma.debt.create({
    data: {
      userId,
      name: 'Vay tiền mặt FE Credit',
      platform: 'FE Credit',
      debtType: 'INSTALLMENT',
      originalAmount: 35000000,
      balance: 27600000,
      apr: 45,
      rateType: 'FLAT',
      minPayment: 2770000,
      dueDay: 25,
      termMonths: 24,
      remainingTerms: 19,
      status: 'ACTIVE',
    },
  });
  const debt5 = await prisma.debt.create({
    data: {
      userId,
      name: 'Thẻ TD MB Bank Smart',
      platform: 'CREDIT_CARD',
      debtType: 'CREDIT_CARD',
      originalAmount: 15000000,
      balance: 4200000,
      apr: 30,
      rateType: 'REDUCING',
      minPayment: 210000,
      dueDay: 15,
      termMonths: 0,
      remainingTerms: 0,
      status: 'ACTIVE',
    },
  });
  const debt6 = await prisma.debt.create({
    data: {
      userId,
      name: 'Vay sửa nhà HDBank',
      platform: 'HDBank',
      debtType: 'INSTALLMENT',
      originalAmount: 80000000,
      balance: 72000000,
      apr: 12,
      rateType: 'REDUCING',
      minPayment: 2130000,
      dueDay: 1,
      termMonths: 60,
      remainingTerms: 54,
      status: 'ACTIVE',
    },
  });
  const debt7 = await prisma.debt.create({
    data: {
      userId,
      name: 'Mượn bạn thân',
      platform: 'Personal',
      debtType: 'INSTALLMENT',
      originalAmount: 5000000,
      balance: 2000000,
      apr: 0,
      rateType: 'FLAT',
      minPayment: 500000,
      dueDay: 30,
      termMonths: 10,
      remainingTerms: 4,
      status: 'ACTIVE',
    },
  });

  // PAID Debts
  await prisma.debt.create({
    data: {
      userId,
      name: 'Samsung Galaxy S23',
      platform: 'SPayLater',
      debtType: 'INSTALLMENT',
      originalAmount: 12000000,
      balance: 0,
      apr: 18,
      rateType: 'FLAT',
      minPayment: 1650000,
      dueDay: 15,
      termMonths: 8,
      remainingTerms: 0,
      status: 'PAID',
    },
  });
  await prisma.debt.create({
    data: {
      userId,
      name: 'Tủ lạnh Sharp',
      platform: 'HD Saison',
      debtType: 'INSTALLMENT',
      originalAmount: 7500000,
      balance: 0,
      apr: 30,
      rateType: 'FLAT',
      minPayment: 812000,
      dueDay: 10,
      termMonths: 12,
      remainingTerms: 0,
      status: 'PAID',
    },
  });
  await prisma.debt.create({
    data: {
      userId,
      name: 'Vay mua Honda Vision',
      platform: 'MCredit',
      debtType: 'INSTALLMENT',
      originalAmount: 20000000,
      balance: 0,
      apr: 28,
      rateType: 'FLAT',
      minPayment: 2130000,
      dueDay: 20,
      termMonths: 12,
      remainingTerms: 0,
      status: 'PAID',
    },
  });
  await prisma.debt.create({
    data: {
      userId,
      name: 'Máy giặt Electrolux',
      platform: 'LazPayLater',
      debtType: 'INSTALLMENT',
      originalAmount: 8000000,
      balance: 0,
      apr: 24,
      rateType: 'FLAT',
      minPayment: 1490000,
      dueDay: 5,
      termMonths: 6,
      remainingTerms: 0,
      status: 'PAID',
    },
  });

  // TRASH Debts
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  await prisma.debt.create({
    data: {
      userId,
      name: 'Thẻ TPBank Evo',
      platform: 'CREDIT_CARD',
      debtType: 'CREDIT_CARD',
      originalAmount: 10000000,
      balance: 3200000,
      apr: 32,
      rateType: 'REDUCING',
      minPayment: 500000,
      dueDay: 25,
      termMonths: 0,
      remainingTerms: 0,
      status: 'ACTIVE',
      deletedAt: today,
      scheduledPurgeAt: thirtyDaysFromNow,
      deleteReason: 'Đóng thẻ do không còn sử dụng',
      deleteCommitment: true,
    },
  });
  await prisma.debt.create({
    data: {
      userId,
      name: 'Vay tiêu dùng Tima',
      platform: 'Tima',
      debtType: 'INSTALLMENT',
      originalAmount: 15000000,
      balance: 0,
      apr: 60,
      rateType: 'FLAT',
      minPayment: 1500000,
      dueDay: 15,
      termMonths: 12,
      remainingTerms: 0,
      status: 'PAID',
      deletedAt: today,
      scheduledPurgeAt: thirtyDaysFromNow,
      deleteReason: 'Dọn dẹp khoản nợ đã tất toán',
      deleteCommitment: false,
    },
  });

  // --- 3. Payments ---
  console.log('Creating Payments...');
  const createPayments = async (debtId, count, minPay, extraPayMonth = -1) => {
    for (let i = count; i >= 1; i--) {
      const payDate = new Date();
      payDate.setMonth(payDate.getMonth() - i);
      let amount = minPay;
      if (i === extraPayMonth) amount = minPay * 2;

      await prisma.payment.create({
        data: {
          debtId,
          amount,
          paidAt: payDate,
          notes: i === extraPayMonth ? 'Trả thêm' : 'Thanh toán định kỳ',
        },
      });
    }
  };

  await createPayments(debt1.id, 18, 1800000);
  await createPayments(debt2.id, 12, 1190000, 3);
  await createPayments(debt3.id, 14, 1830000);
  await createPayments(debt4.id, 5, 2770000);
  await createPayments(debt5.id, 3, 210000);
  await createPayments(debt6.id, 6, 2130000);
  await createPayments(debt7.id, 6, 500000);

  // Add a late payment note for FE Credit
  const lateDate = new Date();
  lateDate.setMonth(lateDate.getMonth() - 2);
  await prisma.payment.create({
    data: {
      debtId: debt4.id,
      amount: 2770000,
      paidAt: lateDate,
      notes: 'Quên đóng, trễ 2 ngày',
    },
  });

  // --- 4. Expense Categories ---
  console.log('Creating Expense Categories...');
  // Parent categories
  const catFood = await prisma.expenseCategory.create({
    data: { userId, name: 'Ăn uống', icon: '🍜', color: '#f59e0b', type: 'EXPENSE' },
  });
  const catFoodCoffee = await prisma.expenseCategory.create({
    data: { userId, name: 'Cà phê', icon: '☕', color: '#fcd34d', type: 'EXPENSE', parentId: catFood.id },
  });
  const catFoodLunch = await prisma.expenseCategory.create({
    data: { userId, name: 'Cơm tháng', icon: '🍱', color: '#fbbf24', type: 'EXPENSE', parentId: catFood.id },
  });
  const catFoodRestaurant = await prisma.expenseCategory.create({
    data: { userId, name: 'Nhà hàng', icon: '🍽️', color: '#f97316', type: 'EXPENSE', parentId: catFood.id },
  });

  const catHousing = await prisma.expenseCategory.create({
    data: { userId, name: 'Nhà ở', icon: '🏠', color: '#3b82f6', type: 'EXPENSE' },
  });
  const catHousingRent = await prisma.expenseCategory.create({
    data: { userId, name: 'Tiền thuê', icon: '🚪', color: '#93c5fd', type: 'EXPENSE', parentId: catHousing.id },
  });
  const catHousingBills = await prisma.expenseCategory.create({
    data: { userId, name: 'Điện nước', icon: '💡', color: '#60a5fa', type: 'EXPENSE', parentId: catHousing.id },
  });
  const catHousingInternet = await prisma.expenseCategory.create({
    data: { userId, name: 'Internet', icon: '📶', color: '#38bdf8', type: 'EXPENSE', parentId: catHousing.id },
  });

  const catTransport = await prisma.expenseCategory.create({
    data: { userId, name: 'Di chuyển', icon: '🚗', color: '#10b981', type: 'EXPENSE' },
  });
  const catTransportGas = await prisma.expenseCategory.create({
    data: { userId, name: 'Xăng xe', icon: '⛽', color: '#6ee7b7', type: 'EXPENSE', parentId: catTransport.id },
  });
  const catTransportGrab = await prisma.expenseCategory.create({
    data: { userId, name: 'Grab', icon: '🚕', color: '#34d399', type: 'EXPENSE', parentId: catTransport.id },
  });
  const catTransportParking = await prisma.expenseCategory.create({
    data: { userId, name: 'Gửi xe', icon: '🅿️', color: '#4ade80', type: 'EXPENSE', parentId: catTransport.id },
  });

  const catShopping = await prisma.expenseCategory.create({
    data: { userId, name: 'Mua sắm', icon: '🛒', color: '#8b5cf6', type: 'EXPENSE' },
  });
  const catShoppingClothes = await prisma.expenseCategory.create({
    data: { userId, name: 'Quần áo', icon: '👕', color: '#a78bfa', type: 'EXPENSE', parentId: catShopping.id },
  });
  const catShoppingHome = await prisma.expenseCategory.create({
    data: { userId, name: 'Đồ gia dụng', icon: '🛋️', color: '#c4b5fd', type: 'EXPENSE', parentId: catShopping.id },
  });

  const catEntertain = await prisma.expenseCategory.create({
    data: { userId, name: 'Giải trí', icon: '🎮', color: '#ec4899', type: 'EXPENSE' },
  });
  const catEntertainGame = await prisma.expenseCategory.create({
    data: { userId, name: 'Game & App', icon: '🎯', color: '#f472b6', type: 'EXPENSE', parentId: catEntertain.id },
  });
  const catEntertainMovie = await prisma.expenseCategory.create({
    data: { userId, name: 'Phim & Sự kiện', icon: '🎬', color: '#fb7185', type: 'EXPENSE', parentId: catEntertain.id },
  });

  const catHealth = await prisma.expenseCategory.create({
    data: { userId, name: 'Sức khỏe', icon: '💊', color: '#06b6d4', type: 'EXPENSE' },
  });
  const catHealthClinic = await prisma.expenseCategory.create({
    data: { userId, name: 'Khám bệnh', icon: '🏥', color: '#67e8f9', type: 'EXPENSE', parentId: catHealth.id },
  });
  const catHealthGym = await prisma.expenseCategory.create({
    data: { userId, name: 'Gym & Thể thao', icon: '💪', color: '#22d3ee', type: 'EXPENSE', parentId: catHealth.id },
  });

  const catEducation = await prisma.expenseCategory.create({
    data: { userId, name: 'Học tập', icon: '📚', color: '#f59e0b', type: 'EXPENSE' },
  });
  const catEducationOnline = await prisma.expenseCategory.create({
    data: { userId, name: 'Khóa học online', icon: '💻', color: '#fbbf24', type: 'EXPENSE', parentId: catEducation.id },
  });
  const catEducationBooks = await prisma.expenseCategory.create({
    data: { userId, name: 'Sách', icon: '📖', color: '#fcd34d', type: 'EXPENSE', parentId: catEducation.id },
  });

  const catDebt = await prisma.expenseCategory.create({
    data: { userId, name: 'Trả nợ', icon: '💳', color: '#ef4444', type: 'EXPENSE' },
  });
  const catDebtCC = await prisma.expenseCategory.create({
    data: { userId, name: 'Thanh toán thẻ', icon: '💳', color: '#fca5a5', type: 'EXPENSE', parentId: catDebt.id },
  });
  const catDebtInst = await prisma.expenseCategory.create({
    data: { userId, name: 'Trả góp', icon: '📅', color: '#f87171', type: 'EXPENSE', parentId: catDebt.id },
  });

  // --- 5. Expenses (~90 transactions over 3 months) ---
  console.log('Creating Expenses...');
  const createExpense = async (amount, date, description, categoryId, walletId) => {
    await prisma.expense.create({
      data: { userId, amount, date, description, categoryId, walletId, type: 'EXPENSE' },
    });
  };

  // Month offsets: 0=this month, 1=last month, 2=two months ago
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    const year = d.getFullYear();
    const month = d.getMonth();

    // ── Housing (every month) ──
    await createExpense(4500000, new Date(year, month, 5), 'Tiền thuê nhà tháng', catHousingRent.id, vcbWallet.id);
    await createExpense(850000, new Date(year, month, 7), 'Tiền điện nước', catHousingBills.id, vcbWallet.id);
    await createExpense(250000, new Date(year, month, 7), 'Internet FPT', catHousingInternet.id, vcbWallet.id);

    // ── Food (every month) ──
    await createExpense(1200000, new Date(year, month, 1), 'Cơm văn phòng tháng', catFoodLunch.id, vcbWallet.id);
    await createExpense(75000, new Date(year, month, 2), 'Highlands Coffee', catFoodCoffee.id, cashWallet.id);
    await createExpense(55000, new Date(year, month, 6), 'Phúc Long trà sữa', catFoodCoffee.id, cashWallet.id);
    await createExpense(65000, new Date(year, month, 11), 'Cà phê The Coffee House', catFoodCoffee.id, momoWallet.id);
    await createExpense(65000, new Date(year, month, 16), 'Cà phê sáng', catFoodCoffee.id, cashWallet.id);
    await createExpense(65000, new Date(year, month, 21), 'Cà phê chiều', catFoodCoffee.id, cashWallet.id);
    await createExpense(350000, new Date(year, month, 14), 'Ăn tối cùng bạn bè', catFoodRestaurant.id, vcbWallet.id);
    await createExpense(280000, new Date(year, month, 22), 'Ăn ngoài cuối tuần', catFoodRestaurant.id, cashWallet.id);

    // ── Transport (every month) ──
    await createExpense(150000, new Date(year, month, 3), 'Đổ xăng lần 1', catTransportGas.id, cashWallet.id);
    await createExpense(150000, new Date(year, month, 15), 'Đổ xăng lần 2', catTransportGas.id, cashWallet.id);
    await createExpense(150000, new Date(year, month, 28), 'Đổ xăng lần 3', catTransportGas.id, cashWallet.id);
    await createExpense(85000, new Date(year, month, 10), 'Grab đi làm mưa', catTransportGrab.id, momoWallet.id);
    await createExpense(65000, new Date(year, month, 18), 'Grab về muộn', catTransportGrab.id, momoWallet.id);
    await createExpense(40000, new Date(year, month, 8), 'Gửi xe tháng', catTransportParking.id, cashWallet.id);

    // ── Debt repayments (every month) ──
    await createExpense(1800000, new Date(year, month, 5), 'Trả góp xe máy Honda', catDebtInst.id, vcbWallet.id);
    await createExpense(1190000, new Date(year, month, 20), 'Thanh toán thẻ VCB', catDebtCC.id, vcbWallet.id);
    await createExpense(2770000, new Date(year, month, 25), 'Trả FE Credit', catDebtInst.id, tcbWallet.id);
    await createExpense(1830000, new Date(year, month, 10), 'Trả góp Laptop Asus', catDebtInst.id, vcbWallet.id);
    await createExpense(210000, new Date(year, month, 15), 'Thanh toán tối thiểu thẻ MB', catDebtCC.id, vcbWallet.id);

    // ── Health (monthly) ──
    await createExpense(300000, new Date(year, month, 1), 'Gym tháng', catHealthGym.id, momoWallet.id);

    // ── Month-specific variations ──
    if (monthOffset === 0) {
      // This month: normal spending
      await createExpense(150000, new Date(year, month, 9), 'Mua sách lập trình', catEducationBooks.id, cashWallet.id);
      await createExpense(90000, new Date(year, month, 12), 'Mua vé xem phim CGV', catEntertainMovie.id, momoWallet.id);
    }

    if (monthOffset === 1) {
      // Last month: some education + health checkup
      await createExpense(
        499000,
        new Date(year, month, 3),
        'Udemy — React Advanced',
        catEducationOnline.id,
        vcbWallet.id,
      );
      await createExpense(250000, new Date(year, month, 18), 'Khám sức khỏe định kỳ', catHealthClinic.id, vcbWallet.id);
      await createExpense(120000, new Date(year, month, 20), 'Mua thuốc cảm', catHealthClinic.id, cashWallet.id);
      await createExpense(
        180000,
        new Date(year, month, 25),
        'Mua sách "Tư duy triệu phú"',
        catEducationBooks.id,
        cashWallet.id,
      );
    }

    if (monthOffset === 2) {
      // Two months ago (tháng 3): shopping spike — 13% of income as per plan
      await createExpense(
        850000,
        new Date(year, month, 8),
        'Uniqlo — áo sơ mi 2 cái',
        catShoppingClothes.id,
        vcbWallet.id,
      );
      await createExpense(
        1200000,
        new Date(year, month, 10),
        'Sale Shopee — quần áo',
        catShoppingClothes.id,
        momoWallet.id,
      );
      await createExpense(
        650000,
        new Date(year, month, 12),
        'Chảo chống dính cao cấp',
        catShoppingHome.id,
        vcbWallet.id,
      );
      await createExpense(350000, new Date(year, month, 14), 'Phụ kiện điện thoại', catShoppingHome.id, momoWallet.id);
      await createExpense(
        220000,
        new Date(year, month, 16),
        'Game Steam — sale mùa xuân',
        catEntertainGame.id,
        momoWallet.id,
      );
      await createExpense(90000, new Date(year, month, 20), 'Netflix tháng', catEntertainGame.id, momoWallet.id);
      await createExpense(180000, new Date(year, month, 22), 'Mua vé xem concert', catEntertainMovie.id, momoWallet.id);
    }
  }

  // --- 6. Investor Profile, AI Strategy, Portfolio ---
  console.log('Creating Investment Data...');
  await prisma.investorProfile.create({
    data: {
      userId,
      capital: 50000000,
      monthlyAdd: 3000000,
      goal: 'RETIRE_EARLY',
      horizon: 'LONG',
      riskLevel: 'MEDIUM',
      riskScore: 58,
      savingsRate: 6.2,
      inflationRate: 3.8,
    },
  });

  const strategy = await prisma.aIStrategy.create({
    data: {
      userId,
      sentimentValue: 55,
      sentimentLabel: 'Neutral',
      riskLevel: 'MEDIUM',
      savings: 25,
      gold: 20,
      stocks: 35,
      bonds: 15,
      crypto: 5,
      recommendation:
        'Với tình hình nợ hiện tại, nên ưu tiên thanh khoản. Phân bổ 25% tiết kiệm, tập trung vào cổ phiếu ổn định và giảm dư nợ FE Credit.',
    },
  });

  await prisma.userPortfolio.create({
    data: {
      userId,
      sourceStrategyId: strategy.id,
      savings: 25,
      gold: 20,
      stocks: 35,
      bonds: 15,
      crypto: 5,
      notes: 'Đang áp dụng từ 01/04/2026, điều chỉnh lại sau khi trả xong FE Credit',
    },
  });

  // --- 7. Repayment Plan ---
  console.log('Creating Repayment Plan...');
  const plan = await prisma.repaymentPlan.create({
    data: {
      userId,
      name: 'Kế hoạch Q2/2026 — Thoát nợ lãi cao',
      strategy: 'CUSTOM',
      extraBudget: 3000000,
      isActive: true,
    },
  });

  // Avalanche order: FE Credit (45%) -> Laptop (36%) -> MB Bank (30%) -> VCB (29.8%) -> Xe máy (28%) -> HDBank (12%)
  const planDebtIds = [debt4.id, debt3.id, debt5.id, debt2.id, debt1.id, debt6.id];
  for (let i = 0; i < planDebtIds.length; i++) {
    await prisma.repaymentPlanItem.create({
      data: { planId: plan.id, debtId: planDebtIds[i], sortOrder: i },
    });
  }

  // --- 8. Notifications ---
  console.log('Creating Notifications...');
  await prisma.notification.create({
    data: {
      userId,
      type: 'DEBT_DUE',
      title: 'FE Credit đến hạn thanh toán ngày 25/05',
      message:
        'Khoản vay FE Credit của bạn sẽ đến hạn thanh toán vào ngày 25/05. Vui lòng chuẩn bị số tiền 2.770.000 ₫.',
      severity: 'WARNING',
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'DEBT_DUE',
      title: 'Thẻ VCB đến hạn thanh toán ngày 20/05',
      message: 'Thẻ TD Vietcombank Platinum của bạn sẽ đến hạn thanh toán tối thiểu vào ngày 20/05.',
      severity: 'INFO',
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'MILESTONE',
      title: 'Bạn đã hoàn tất trả nợ SPayLater! 🎉',
      message: 'Chúc mừng bạn đã tất toán thành công khoản nợ SPayLater.',
      severity: 'SUCCESS',
      isRead: true,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'HEALTH_SCORE',
      title: 'Điểm sức khỏe tài chính giảm 15 điểm',
      message: 'Điểm sức khoẻ tài chính của bạn đã giảm do ghi nhận khoản phạt trễ hạn.',
      severity: 'WARNING',
      isRead: false,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'PENALTY',
      title: 'Khoản FE Credit bị phạt trễ hạn 85.000 ₫',
      message: 'Hệ thống ghi nhận khoản phạt 85.000 ₫ do thanh toán trễ hạn FE Credit.',
      severity: 'ERROR',
      isRead: true,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'SYSTEM',
      title: 'Báo cáo tháng 4/2026 đã sẵn sàng',
      message: 'Báo cáo tổng quan tình hình nợ và chi tiêu tháng 4/2026 của bạn đã được cập nhật.',
      severity: 'INFO',
      isRead: true,
    },
  });
  await prisma.notification.create({
    data: {
      userId,
      type: 'MILESTONE',
      title: 'Bạn đã trả được 50% khoản nợ Xe máy!',
      message: 'Tuyệt vời! Bạn đã hoàn thành 50% chặng đường trả nợ cho chiếc xe máy Honda Air Blade.',
      severity: 'SUCCESS',
      isRead: false,
    },
  });

  // --- 9. Debt Snapshots ---
  console.log('Creating Debt Snapshots...');
  let currentTotalDebt = 215000000;
  let currentEAR = 38.2;
  let currentDTI = 62.0;

  for (let i = 11; i >= 0; i--) {
    const snapDate = new Date();
    snapDate.setMonth(snapDate.getMonth() - i);
    snapDate.setDate(1); // 1st of month

    await prisma.debtSnapshot.create({
      data: {
        userId,
        totalDebt: currentTotalDebt,
        totalEAR: currentEAR,
        debtToIncome: currentDTI,
        createdAt: snapDate,
      },
    });

    // Decrease slightly for next month
    currentTotalDebt -= 5500000;
    currentEAR -= 0.6;
    currentDTI -= 1.5;
  }

  // --- 10. Health Score History ---
  console.log('Creating Health Score History...');
  await prisma.healthScoreHistory.create({
    data: {
      userId,
      changeAmount: -25,
      reason: 'Thêm khoản nợ FE Credit',
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    },
  });
  await prisma.healthScoreHistory.create({
    data: {
      userId,
      changeAmount: 10,
      reason: 'Thanh toán đúng hạn 2 khoản',
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 5)),
    },
  });
  await prisma.healthScoreHistory.create({
    data: {
      userId,
      changeAmount: -15,
      reason: 'Trễ hạn FE Credit',
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 4)),
    },
  });
  await prisma.healthScoreHistory.create({
    data: {
      userId,
      changeAmount: 20,
      reason: 'Tất toán SPayLater',
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    },
  });
  await prisma.healthScoreHistory.create({
    data: {
      userId,
      changeAmount: 5,
      reason: 'Thanh toán đúng hạn',
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 2)),
    },
  });
  await prisma.healthScoreHistory.create({
    data: {
      userId,
      changeAmount: 8,
      reason: 'Giảm tỷ lệ DTI',
      createdAt: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    },
  });

  // --- 11. Articles ---
  console.log('Creating Articles...');
  await prisma.article.deleteMany({}); // Clean up existing

  const articles = [
    {
      title: 'Phương pháp Avalanche: Trả nợ thông minh',
      category: 'GUIDE',
      date: '15/03/2026',
      author: 'FinSight Team',
      excerpt: 'Tìm hiểu cách phương pháp Avalanche giúp bạn tiết kiệm nhiều tiền lãi nhất và thoát nợ nhanh nhất.',
      content:
        'Phương pháp Avalanche (Tuyệt lở) tập trung vào việc trả khoản nợ có lãi suất cao nhất trước.\n\nBằng cách này, bạn sẽ tiết kiệm được nhiều tiền lãi nhất và thoát nợ nhanh nhất.\n\nTuy nhiên, nó đòi hỏi sự kiên nhẫn vì khoản nợ lãi cao thường là khoản lớn.',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Quy tắc 50/30/20 trong quản lý tài chính',
      category: 'GUIDE',
      date: '20/03/2026',
      author: 'FinSight Team',
      excerpt: 'Quy tắc 50/30/20 là nền tảng quản lý tài chính cá nhân đơn giản và hiệu quả nhất.',
      content:
        'Quy tắc 50/30/20 chia thu nhập của bạn thành 3 phần: 50% cho nhu cầu thiết yếu, 30% cho mong muốn, và 20% cho tiết kiệm/trả nợ.\n\nĐây là một quy tắc đơn giản và dễ áp dụng cho người mới bắt đầu quản lý tài chính.\n\nHãy theo dõi chi tiêu để đảm bảo bạn đi đúng hướng.',
      imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'DTI - Chỉ số quan trọng quyết định sức khỏe tài chính',
      category: 'GUIDE',
      date: '25/03/2026',
      author: 'FinSight Team',
      excerpt: 'DTI là thước đo sức khỏe tài chính. Hiểu đúng để kiểm soát nợ trước khi quá muộn.',
      content:
        'DTI (Debt-to-Income) là tỷ lệ nợ trên thu nhập. Nó cho biết bạn dùng bao nhiêu % thu nhập để trả nợ mỗi tháng.\n\nDTI lý tưởng nên dưới 36%. Nếu cao hơn 50%, bạn đang ở mức rủi ro cao.\n\nGiảm DTI bằng cách tăng thu nhập hoặc tích cực trả nợ.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Hiểu đúng về điểm tín dụng CIC',
      category: 'GUIDE',
      date: '01/04/2026',
      author: 'FinSight Team',
      excerpt: 'Điểm tín dụng CIC ảnh hưởng trực tiếp đến khả năng vay vốn và lãi suất bạn được hưởng.',
      content:
        'CIC (Credit Information Center) lưu trữ thông tin tín dụng của bạn tại Việt Nam.\n\nĐiểm CIC cao giúp bạn dễ dàng vay vốn với lãi suất thấp.\n\nĐừng bao giờ để rơi vào nợ xấu nhóm 3, 4, 5 vì bạn sẽ bị cấm vay từ 3-5 năm.',
      imageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Hành trình 2 năm thoát khối nợ 500 triệu',
      category: 'STORY',
      date: '05/04/2026',
      author: 'Trần Văn Hùng',
      excerpt: 'Từ 500 triệu nợ đầu tư chứng khoán thất bại, tôi đã thoát nợ trong 2 năm nhờ kiên nhẫn và kỷ luật.',
      content:
        'Tôi đã từng chìm trong khủng hoảng với số nợ 500 triệu do đầu tư chứng khoán thất bại.\n\nBằng việc cắt giảm chi tiêu tối đa và làm thêm 2 công việc, tôi đã trả dứt điểm trong 2 năm.\n\nBài học rút ra: Đừng bao giờ vay mượn để đầu tư khi chưa có kiến thức vững chắc.',
      imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Bẫy thẻ tín dụng: Thanh toán số dư tối thiểu',
      category: 'STORY',
      date: '10/04/2026',
      author: 'Nguyễn Thị Mai',
      excerpt: 'Nhiều người rơi vào bẫy nợ thẻ tín dụng chỉ vì không hiểu cơ chế tính lãi suất.',
      content:
        'Nhiều người nghĩ chỉ cần thanh toán số dư tối thiểu (thường là 5%) là an toàn.\n\nThực tế, 95% còn lại sẽ bị tính lãi suất lên tới 30-40%/năm.\n\nKhoản nợ 50 triệu có thể mất hơn 10 năm để trả hết nếu chỉ trả mức tối thiểu.',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Mua nhà khi đang có khoản vay cũ: Nên hay không?',
      category: 'STORY',
      date: '15/04/2026',
      author: 'Lê Minh Tuấn',
      excerpt: 'Kinh nghiệm thực tế của gia đình tôi khi vay mua nhà trong lúc còn đang trả nợ xe.',
      content:
        'Vợ chồng tôi có thu nhập 40 triệu, đang trả góp xe 5 triệu/tháng và muốn vay mua nhà.\n\nNgân hàng đã từ chối vì tỷ lệ DTI của chúng tôi vượt ngưỡng an toàn.\n\nChúng tôi phải dồn tiền tất toán xe trước khi nộp hồ sơ vay nhà lại.',
      imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Lãi suất tiết kiệm các ngân hàng giảm nhẹ trong tháng 5',
      category: 'NEWS',
      date: '01/05/2026',
      author: 'FinSight News',
      excerpt: 'Xu hướng lãi suất huy động tháng 5/2026 và ảnh hưởng đến người vay vốn.',
      content:
        'Theo khảo sát, lãi suất huy động của nhiều ngân hàng tiếp tục xu hướng giảm.\n\nMức cao nhất cho kỳ hạn 12 tháng hiện chỉ còn quanh mức 5.5 - 6%.\n\nĐây là tin tốt cho những người đang có ý định vay vốn sản xuất kinh doanh.',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60',
    },
    {
      title: 'Ngân hàng Nhà nước cảnh báo rủi ro vay qua app',
      category: 'NEWS',
      date: '03/05/2026',
      author: 'FinSight News',
      excerpt: 'Cảnh báo: Nhiều app cho vay lãi suất thực tế lên đến hàng trăm % mỗi năm.',
      content:
        'Gần đây, nhiều ứng dụng cho vay nặng lãi núp bóng tín dụng đen bùng phát.\n\nLãi suất thực tế có thể lên tới hàng trăm phần trăm một năm.\n\nNgười dân cần cảnh giác và chỉ nên vay vốn tại các tổ chức tín dụng hợp pháp.',
      imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=60',
    },
  ];

  for (const article of articles) {
    await prisma.article.create({ data: article });
  }

  // --- 12. Debt Goals ---
  console.log('Creating Debt Goal...');
  await prisma.debtGoal.create({
    data: {
      userId,
      targetDate: new Date('2028-12-31'),
      strategy: 'AVALANCHE',
    },
  });

  console.log('🎉 Seed data successfully created!');
  console.log('Login: demo@finsight.vn / demo_password_123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
