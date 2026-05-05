import { PrismaClient } from '@prisma/enterprise';
import { runNotificationJob } from './jobs/notification.job.js';
import { runOverdueJob } from './jobs/overdue.job.js';
import { runPenaltyJob } from './jobs/penalty.job.js';

const db = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU TEST MODULE 6 ---');

  // 1. Tìm hoặc tạo một Organization và User
  let org = await db.organization.findFirst();
  if (!org) {
    org = await db.organization.create({
      data: {
        taxCode: 'TEST-' + Date.now(),
        name: 'Công ty Test Job',
        businessType: 'Tech',
        headquartersAddress: 'HCM',
      },
    });
  }

  let user = await db.enterpriseUser.findFirst({ where: { organizationId: org.id } });
  if (!user) {
    user = await db.enterpriseUser.create({
      data: {
        email: 'testjob' + Date.now() + '@test.com',
        passwordHash: 'hash',
        fullName: 'Test User',
        roleTitle: 'CEO',
        phoneNumber: '0123456789',
        organizationId: org.id,
      },
    });
  }

  let party = await db.party.findFirst({ where: { organizationId: org.id } });
  if (!party) {
    party = await db.party.create({
      data: {
        name: 'Khách hàng A',
        internalCode: 'KH-A-' + Date.now(),
        organizationId: org.id,
        typeTags: ['CUSTOMER'],
        personInChargeId: user.id,
      },
    });
  }

  // 2. Tạo một khoản nợ cố ý bị quá hạn (issueDate = 2 tháng trước, term = 1 tháng => dueDate = 1 tháng trước)
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const debt = await db.debtRecord.create({
    data: {
      organizationId: org.id,
      partyId: party.id,
      type: 'RECEIVABLE',
      origin: 'TRADE',
      principal: 100000000, // 100 triệu
      outstanding: 100000000,
      interestMethod: 'NONE',
      issueDate: twoMonthsAgo,
      dueDate: new Date(new Date(twoMonthsAgo).setMonth(twoMonthsAgo.getMonth() + 1)), // Quá hạn 1 tháng
      status: 'ACTIVE', // Trạng thái bình thường
      penaltyRate: 0.001, // 0.1% / ngày
      personInChargeId: user.id,
    },
  });

  console.log(`\n[1] Đã tạo khoản nợ giả lập (ID: ${debt.id})`);
  console.log(`    - Số tiền: ${debt.principal}`);
  console.log(`    - Trạng thái ban đầu: ${debt.status}`);
  console.log(`    - Hạn chót: ${debt.dueDate.toLocaleDateString()}`);

  // 3. Chạy Job Overdue
  console.log('\n[2] Đang chạy Job Overdue...');
  const overdueResult = await runOverdueJob(org.id);
  console.log('    Kết quả:', overdueResult);

  const check1 = await db.debtRecord.findUnique({ where: { id: debt.id } });
  console.log(`    -> Trạng thái mới của nợ: ${check1?.status} (Kỳ vọng: OVERDUE)`);

  // 4. Chạy Job Penalty
  console.log('\n[3] Đang chạy Job Penalty...');
  const penaltyResult = await runPenaltyJob(org.id);
  console.log('    Kết quả:', penaltyResult);

  const check2 = await db.debtRecord.findUnique({ where: { id: debt.id } });
  const transactions = await db.debtTransaction.findMany({ where: { debtRecordId: debt.id, type: 'PENALTY' } });
  const totalPenalty = transactions.reduce((sum, t) => sum + t.amount, 0);
  console.log(`    -> Dư nợ mới: ${check2?.outstanding} (Đã tăng thêm tiền phạt chưa trả)`);
  console.log(`    -> Số tiền phạt sinh ra: ${totalPenalty}`);

  // 5. Chạy Job Notify
  console.log('\n[4] Đang chạy Job Notify...');
  const notifyResult = await runNotificationJob(org.id);
  console.log('    Kết quả:', notifyResult);

  const notifs = await db.enterpriseNotification.findMany({ where: { debtRecordId: debt.id } });
  console.log(`    -> Số thông báo đã sinh ra: ${notifs.length}`);
  if (notifs.length > 0) {
    console.log(`    -> Tiêu đề thông báo gần nhất: "${notifs[0].title}"`);
  }

  // Cleanup dữ liệu test
  await db.debtTransaction.deleteMany({ where: { debtRecordId: debt.id } });
  await db.enterpriseNotification.deleteMany({ where: { debtRecordId: debt.id } });
  await db.auditLog.deleteMany({ where: { entityId: debt.id } });
  await db.debtRecord.delete({ where: { id: debt.id } });

  console.log('\n--- KẾT THÚC TEST ---');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
