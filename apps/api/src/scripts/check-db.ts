import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPending() {
  console.log('🔍 Đang kiểm tra dữ liệu trong bảng BankTransactionPending...');
  
  const all = await prisma.bankTransactionPending.findMany({
    include: {
      wallet: { select: { name: true } }
    }
  });

  console.log(`📊 Tổng cộng: ${all.length} bản ghi`);
  
  if (all.length > 0) {
    all.forEach(tx => {
      console.log(`- [${tx.status}] Wallet: ${tx.wallet.name} | ID: ${tx.sepayTxId} | Số tiền: ${tx.amount} | Ngày: ${tx.transactionDate}`);
    });
  } else {
    console.log('❌ Không tìm thấy bản ghi nào trong bảng bank_transactions_pending.');
  }

  // Kiểm tra trạng thái đồng bộ của ví
  const wallets = await prisma.wallet.findMany({
    where: { sepayToken: { not: null } }
  });
  
  console.log('\n💳 Trạng thái ví:');
  wallets.forEach(w => {
    console.log(`- ${w.name}: lastSyncedTxId = ${w.lastSyncedTxId}, sepayLinkedAt = ${w.sepayLinkedAt}`);
  });
}

checkPending()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
