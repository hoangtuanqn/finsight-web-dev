import { PrismaClient } from '@prisma/enterprise';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedEnterprise(prisma) {
  console.log('🌱 Bắt đầu tạo dữ liệu Seed Enterprise (PHIÊN BẢN CHUYÊN GIA TÀI CHÍNH)...');

  // 0. Xóa dữ liệu cũ theo thứ tự ràng buộc
  console.log('🧹 Xóa dữ liệu cũ...');
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

  // ==========================================
  // 1. TỔ CHỨC: Công ty Cổ phần Alpha - Dữ liệu Tài chính thực tế
  // ==========================================
  const org = await prisma.organization.create({
    data: {
      taxCode: '0312345678',
      name: 'Công ty Cổ phần Sản xuất và Thương mại Alpha',
      shortName: 'Alpha Manufacturing JSC',
      businessType: 'Sản xuất linh kiện điện tử và thiết bị gia dụng',
      headquartersAddress: 'Lô E2a-9, Đường D8, Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh',
      equity: 350000000000, // 350 tỷ VND
      annualRevenue: 1250000000000, // 1,250 tỷ VND/năm
      maxDebtToEquity: 2.5, // Covenant tiêu chuẩn của ngân hàng VN
      minDSCR: 1.25, // DSCR tối thiểu để vay dài hạn
    },
  });

  // ==========================================
  // 2. NGƯỜI DÙNG: Cơ cấu Ban Tài chính
  // ==========================================
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
  const chiefAcc = await prisma.enterpriseUser.create({
    data: {
      email: 'thuy.le@alphamfg.vn',
      passwordHash,
      fullName: 'Lê Thị Thu Thủy',
      roleTitle: 'Kế toán trưởng',
      phoneNumber: '0987654321',
      organizationId: org.id,
    },
  });
  const treasurer = await prisma.enterpriseUser.create({
    data: {
      email: 'tri.pham@alphamfg.vn',
      passwordHash,
      fullName: 'Phạm Minh Trí',
      roleTitle: 'Trưởng phòng Nguồn vốn',
      phoneNumber: '0912345678',
      organizationId: org.id,
    },
  });

  // ==========================================
  // 3. ĐỐI TÁC: Các Ngân hàng, Nhà Cung Cấp, Cơ quan thực tế
  // ==========================================
  const bidv = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Ngân hàng TMCP Đầu tư và Phát triển VN - CN Đông Sài Gòn',
      shortName: 'BIDV Đông Sài Gòn',
      internalCode: 'BNK-BIDV-DSG',
      typeTags: ['BANK'],
      status: 'ACTIVE',
      contacts: {
        create: [
          {
            name: 'Nguyễn Hải Đăng',
            position: 'Giám đốc Chi nhánh',
            email: 'dangnh@bidv.com.vn',
            phone: '0909111222',
            isPrimary: true,
          },
        ],
      },
      bankAccounts: {
        create: [{ bankName: 'BIDV', accountNumber: '31410001234567', accountHolder: 'Alpha Manufacturing JSC' }],
      },
    },
  });

  const vcb = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Ngân hàng TMCP Ngoại thương VN - CN Thủ Đức',
      shortName: 'Vietcombank',
      internalCode: 'BNK-VCB-TD',
      typeTags: ['BANK'],
      status: 'ACTIVE',
      contacts: {
        create: [
          {
            name: 'Trương Ngọc Anh',
            position: 'Trưởng phòng KHDN',
            email: 'anh.tn@vietcombank.com.vn',
            phone: '0909333444',
            isPrimary: true,
          },
        ],
      },
      bankAccounts: {
        create: [{ bankName: 'Vietcombank', accountNumber: '0381001234567', accountHolder: 'Alpha Manufacturing JSC' }],
      },
    },
  });

  const tcb = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Ngân hàng TMCP Kỹ thương VN',
      shortName: 'Techcombank',
      internalCode: 'BNK-TCB',
      typeTags: ['BANK'],
      status: 'ACTIVE',
      contacts: {
        create: [
          {
            name: 'Lê Hoàng Minh',
            position: 'Chuyên viên QHKH',
            email: 'minhlh@techcombank.com.vn',
            phone: '0933123456',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const foxconn = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Foxconn Interconnect Technology (Bắc Giang)',
      shortName: 'Foxconn VN',
      internalCode: 'SUP-FOX-BG',
      typeTags: ['SUPPLIER'],
      status: 'ACTIVE',
      contacts: {
        create: [
          {
            name: 'Huang Wei',
            position: 'Sales Manager',
            email: 'huang.wei@foxconn.com',
            phone: '0919888999',
            isPrimary: true,
          },
        ],
      },
      bankAccounts: {
        create: [
          { bankName: 'CTBC Bank', accountNumber: '1234567890', accountHolder: 'Foxconn Interconnect Technology' },
        ],
      },
    },
  });

  const chairman = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Lê Hồng Minh',
      shortName: 'Chủ tịch HĐQT',
      internalCode: 'PER-MINH-BOD',
      typeTags: ['INTERNAL'],
      isRelatedParty: true,
    },
  });

  const delta = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Công ty Cổ phần Tập đoàn Xây dựng Hòa Bình',
      shortName: 'HBC',
      internalCode: 'SUP-HBC',
      typeTags: ['SUPPLIER'],
      status: 'ACTIVE',
      contacts: {
        create: [
          {
            name: 'Trần Nhật Thành',
            position: 'Chỉ huy trưởng công trình',
            email: 'thanh.tn@hbcg.vn',
            phone: '0988111222',
            isPrimary: true,
          },
        ],
      },
    },
  });

  const bondholders = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Trái chủ lô ALPH2326001',
      shortName: 'Trái chủ ALPH2326001',
      internalCode: 'BND-ALPH23',
      typeTags: ['OTHER'],
      status: 'ACTIVE',
    },
  });

  const taxDept = await prisma.party.create({
    data: {
      organizationId: org.id,
      name: 'Cục Thuế Thành phố Hồ Chí Minh',
      shortName: 'Cục Thuế TP.HCM',
      internalCode: 'TAX-HCM',
      typeTags: ['TAX_AUTHORITY', 'STATE'],
      status: 'ACTIVE',
      bankAccounts: {
        create: [
          {
            bankName: 'Kho bạc Nhà nước TP.HCM',
            accountNumber: '7111.1056456',
            accountHolder: 'Cục Thuế TP Hồ Chí Minh',
          },
        ],
      },
    },
  });

  // ==========================================
  // 4. HỒ SƠ NỢ: Đầy đủ các cấu trúc vay doanh nghiệp tại VN
  // ==========================================
  console.log('📝 Đang khởi tạo hồ sơ nợ với số liệu thực tế...');

  // 4.1. Vay dự án dài hạn (BIDV) - Logic REDUCING_BALANCE chuẩn
  await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: bidv.id,
      type: 'PAYABLE',
      origin: 'FINANCIAL',
      principal: 120000000000,
      outstanding: 90000000000,
      interestMethod: 'REDUCING_BALANCE',
      issueDate: dateOffset(-12),
      dueDate: dateOffset(48),
      status: 'ACTIVE',
      internalCode: 'HDTD-01/2024/BIDV-ALPHA',
      notes:
        'Vay dài hạn 5 năm tài trợ dự án Mở rộng nhà máy Giai đoạn 2. Giải ngân 120 tỷ, đã trả gốc 1 năm (30 tỷ). Tài sản đảm bảo: Máy móc SMT và Quyền sử dụng đất khu CNC.',
      personInChargeId: treasurer.id,
      interestRates: { create: [{ rate: 8.5, effectiveDate: dateOffset(-12), rateType: 'FIXED' }] },
      transactions: {
        create: [
          {
            type: 'PAYMENT',
            amount: 30000000000,
            principalPart: 30000000000,
            paymentMethod: 'BANK_TRANSFER',
            reference: 'LŨY KẾ TRẢ GỐC NĂM 1',
            paidAt: dateOffset(-1),
            balanceSnapshot: 90000000000,
          },
        ],
      },
      documents: {
        create: [
          {
            name: 'Hop_Dong_Tin_Dung_BIDV.pdf',
            fileUrl: 'https://docs.alphamfg.vn/fin/bidv-loan.pdf',
            fileType: 'application/pdf',
            fileSize: 4500000,
          },
          {
            name: 'Hop_Dong_The_Chap_Tai_San.pdf',
            fileUrl: 'https://docs.alphamfg.vn/fin/bidv-collateral.pdf',
            fileType: 'application/pdf',
            fileSize: 2100000,
          },
        ],
      },
      schedules: {
        create: [
          {
            period: 13,
            dueDate: dateOffset(0, 5),
            principalAmount: 2500000000,
            interestAmount: 637500000,
            totalAmount: 3137500000,
            remainingPrincipal: 87500000000,
            status: 'PENDING',
          },
        ],
      },
    },
  });

  // 4.2. Vay vốn lưu động ngắn hạn (VCB) - Logic Lãi suất thả nổi (REFERENCE)
  await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: vcb.id,
      type: 'PAYABLE',
      origin: 'FINANCIAL',
      principal: 45000000000,
      outstanding: 45000000000,
      interestMethod: 'REDUCING_BALANCE',
      issueDate: dateOffset(-2),
      dueDate: dateOffset(4),
      status: 'ACTIVE',
      internalCode: 'KUNN-05/2024/VCB-ALPHA',
      notes:
        'Khế ước nhận nợ (Hạn mức tín dụng). Mục đích: Thanh toán tiền mua nguyên vật liệu nhập khẩu (L/C). Lãi suất: Lãi suất cho vay cơ sở VCB + Biên độ 2.5%.',
      personInChargeId: treasurer.id,
      interestRates: {
        create: [
          {
            rate: 7.0,
            effectiveDate: dateOffset(-2),
            rateType: 'REFERENCE',
            referenceBase: 'Lãi suất cơ sở VCB',
            spread: 2.5,
          }, // Total effective: ~9.5%
        ],
      },
      schedules: {
        create: [
          {
            period: 3,
            dueDate: dateOffset(0, 10),
            principalAmount: 0,
            interestAmount: 356250000,
            totalAmount: 356250000,
            remainingPrincipal: 45000000000,
            status: 'PENDING',
          },
          {
            period: 6,
            dueDate: dateOffset(4),
            principalAmount: 45000000000,
            interestAmount: 356250000,
            totalAmount: 45356250000,
            remainingPrincipal: 0,
            status: 'PENDING',
          },
        ],
      },
    },
  });

  // 4.3. Trái phiếu phát hành riêng lẻ - Nợ quy mô lớn, Bullet payment
  const debtBond = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: bondholders.id,
      type: 'PAYABLE',
      origin: 'BOND',
      principal: 150000000000,
      outstanding: 150000000000,
      interestMethod: 'BULLET',
      issueDate: dateOffset(-12),
      dueDate: dateOffset(24),
      status: 'ACTIVE',
      internalCode: 'ALPH2326001',
      notes:
        'Trái phiếu không chuyển đổi, không kèm chứng quyền. Lãi suất cố định 11.5%/năm, trả lãi 6 tháng/lần. Covenants: Tỷ lệ Nợ/VCSH không vượt quá 2.5 lần.',
      personInChargeId: cfo.id,
      interestRates: { create: [{ rate: 11.5, effectiveDate: dateOffset(-12), rateType: 'FIXED' }] },
      schedules: {
        create: [
          {
            period: 3,
            dueDate: dateOffset(0, 15),
            principalAmount: 0,
            interestAmount: 8625000000,
            totalAmount: 8625000000,
            remainingPrincipal: 150000000000,
            status: 'PENDING',
          },
        ],
      },
    },
  });

  // 4.4. Nợ Thuế Truy Thu (Quá hạn, Phạt chậm nộp đúng luật VN: 0.03%/ngày)
  const debtTax = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: taxDept.id,
      type: 'PAYABLE',
      origin: 'TAX',
      principal: 6500000000,
      outstanding: 6500000000,
      interestMethod: 'NONE',
      issueDate: dateOffset(-3),
      dueDate: dateOffset(-1),
      status: 'OVERDUE',
      overdueSince: dateOffset(-1),
      penaltyRate: 0.03,
      internalCode: 'QĐ-1245/CCT-TTr',
      notes:
        'Truy thu thuế TNDN sau thanh tra. Phạt chậm nộp 0.03%/ngày theo khoản 2 Điều 59 Luật Quản lý thuế số 38/2019/QH14. Rủi ro bị cưỡng chế hóa đơn điện tử.',
      personInChargeId: chiefAcc.id,
      interestRates: { create: [{ rate: 10.95, effectiveDate: dateOffset(-1), rateType: 'FIXED' }] }, // 0.03 * 365 = 10.95%
      schedules: {
        create: [
          {
            period: 1,
            dueDate: dateOffset(-1),
            principalAmount: 6500000000,
            interestAmount: 0,
            totalAmount: 6500000000,
            remainingPrincipal: 6500000000,
            status: 'OVERDUE',
            isOverdue: true,
            overdueSince: dateOffset(-1),
          },
        ],
      },
    },
  });

  // 4.5. Vay Tín Chấp (TCB) - Bẫy nợ, có Bảo lãnh (Guarantor)
  const debtTCB = await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: tcb.id,
      guarantorId: chairman.id, // Chủ tịch bảo lãnh cá nhân
      type: 'PAYABLE',
      origin: 'FINANCIAL',
      principal: 10000000000,
      outstanding: 10000000000,
      interestMethod: 'EMI',
      issueDate: dateOffset(-6),
      dueDate: dateOffset(6),
      status: 'OVERDUE',
      overdueSince: dateOffset(-1, -15),
      penaltyRate: 0.05,
      internalCode: 'HD-TCB-UNSEC-01',
      notes:
        'Vay tín chấp, có bảo lãnh cá nhân của ông Lê Hồng Minh (Chủ tịch). Đã chậm thanh toán kỳ 5. Nguy cơ hệ thống CIC tự động hạ nhóm nợ (Nhóm 2 - Nợ cần chú ý).',
      personInChargeId: treasurer.id,
      interestRates: { create: [{ rate: 14.5, effectiveDate: dateOffset(-6), rateType: 'FIXED' }] },
      schedules: {
        create: [
          {
            period: 5,
            dueDate: dateOffset(-1, -15),
            principalAmount: 833333333,
            interestAmount: 120833333,
            totalAmount: 954166666,
            remainingPrincipal: 9166666667,
            status: 'OVERDUE',
            isOverdue: true,
            overdueSince: dateOffset(-1, -15),
          },
        ],
      },
    },
  });

  // 4.6. Công nợ Nhà thầu (Xây dựng) - Milestone based & Grace Period
  await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: delta.id,
      type: 'PAYABLE',
      origin: 'TRADE',
      principal: 35000000000,
      outstanding: 35000000000,
      interestMethod: 'NONE',
      issueDate: dateOffset(0),
      dueDate: dateOffset(6),
      status: 'ACTIVE',
      internalCode: 'PO-DELTA-PHASE2',
      gracePeriodDays: 15,
      notes:
        'Thanh toán đợt 2 Hợp đồng thi công M&E Nhà máy mới. Thanh toán dựa trên Biên bản nghiệm thu. Có thời gian ân hạn 15 ngày sau nghiệm thu.',
      personInChargeId: chiefAcc.id,
      schedules: {
        create: [
          {
            period: 1,
            dueDate: dateOffset(2),
            principalAmount: 35000000000,
            interestAmount: 0,
            totalAmount: 35000000000,
            remainingPrincipal: 35000000000,
            status: 'PENDING',
            triggerType: 'MILESTONE',
            triggerCondition: 'KÝ BIÊN BẢN NGHIỆM THU ĐÓNG ĐIỆN',
          },
        ],
      },
    },
  });

  // 4.7. Công nợ Nhà cung cấp (Foxconn) - Đã thanh toán 1 phần
  await prisma.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: foxconn.id,
      type: 'PAYABLE',
      origin: 'TRADE',
      principal: 12500000000,
      outstanding: 5000000000,
      interestMethod: 'NONE',
      issueDate: dateOffset(-2),
      dueDate: dateOffset(1),
      status: 'PARTIAL',
      internalCode: 'INV-FOX-2404',
      notes: 'Công nợ nhập linh kiện IC. Đã thanh toán đợt 1 (7.5 tỷ).',
      personInChargeId: chiefAcc.id,
      transactions: {
        create: [
          {
            type: 'PAYMENT',
            amount: 7500000000,
            principalPart: 7500000000,
            paymentMethod: 'BANK_TRANSFER',
            reference: 'UNC-VCB-98811',
            paidAt: dateOffset(-1),
            balanceSnapshot: 5000000000,
          },
        ],
      },
    },
  });

  // ==========================================
  // 5. KẾ HOẠCH TRẢ NỢ (REPAYMENT PLAN): Demo logic AI/Optimizer
  // ==========================================
  const plan = await prisma.enterpriseRepaymentPlan.create({
    data: {
      organizationId: org.id,
      userId: cfo.id,
      name: 'Kế hoạch Phân bổ Dòng tiền Cấp bách Tháng ' + (new Date().getMonth() + 1),
      budget: 20000000000, // 20 Tỷ
      strategy: 'COVENANT_RISK',
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      status: 'COMMITTED',
      notes:
        'Ngân sách tuần 1 chỉ có 20 tỷ. Bắt buộc thanh toán Nợ Thuế (tránh đóng băng hóa đơn) và khoản nợ TCB (tránh nhảy nhóm CIC). Tiền còn dư trả lãi Trái phiếu.',
      items: {
        create: [
          {
            debtRecordId: debtTax.id,
            priority: 1,
            plannedAmount: 6500000000,
            reason: 'Pháp lý: Xóa nợ thuế truy thu để mở lại hóa đơn VAT.',
          },
          {
            debtRecordId: debtTCB.id,
            priority: 2,
            plannedAmount: 954166666,
            reason: 'Tín dụng: Thanh toán ngay kỳ quá hạn TCB để cứu điểm CIC.',
          },
          {
            debtRecordId: debtBond.id,
            priority: 3,
            plannedAmount: 8625000000,
            reason: 'Cam kết: Trả lãi định kỳ trái phiếu ALPH2326001.',
          },
        ],
      },
    },
  });

  // ==========================================
  // 6. THÔNG BÁO VÀ LOGS
  // ==========================================
  await prisma.enterpriseNotification.create({
    data: {
      organizationId: org.id,
      targetUserId: cfo.id,
      type: 'EVENT_BASED',
      category: 'ESCALATION',
      priority: 'URGENT',
      title: 'CẢNH BÁO RỦI RO CIC',
      content:
        'Khoản vay HD-TCB-UNSEC-01 (Techcombank) đã quá hạn 15 ngày. Nguy cơ tự động nhảy xuống Nhóm 2 (Nợ cần chú ý).',
      data: { debtId: debtTCB.id },
      debtRecordId: debtTCB.id,
    },
  });

  await prisma.enterpriseNotification.create({
    data: {
      organizationId: org.id,
      targetUserId: chiefAcc.id,
      type: 'EVENT_BASED',
      category: 'OVERDUE',
      priority: 'URGENT',
      title: 'PHẠT THUẾ CHẬM NỘP',
      content:
        'Khoản truy thu thuế TNDN 6.5 tỷ đang bị tính phạt 0.03%/ngày. Số tiền phạt ước tính tăng thêm ~1.95 triệu VND mỗi ngày.',
      data: { debtId: debtTax.id },
      debtRecordId: debtTax.id,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId: org.id,
      userId: cfo.id,
      action: 'CREATE',
      entityType: 'ENTERPRISE_REPAYMENT_PLAN',
      entityId: plan.id,
      newValues: { budget: 20000000000, strategy: 'COVENANT_RISK' },
      reason: 'Duyệt kế hoạch dòng tiền khẩn cấp.',
    },
  });

  await prisma.jobLog.create({
    data: {
      organizationId: org.id,
      jobName: 'JOB_CALC_PENALTY_ACCRUAL',
      status: 'SUCCESS',
      runAt: new Date(),
      details: { processedRecords: 2, totalPenaltyAccrued: 29250000 },
    },
  });

  console.log('✅ BẢN SEED TÀI CHÍNH HOÀN HẢO ĐÃ ĐƯỢC TẠO!');
  console.log('🚀 Tài khoản demo: tin.tran@alphamfg.vn / admin123');
}
