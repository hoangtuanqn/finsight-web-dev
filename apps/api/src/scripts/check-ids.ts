import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkUserIds() {
  const pending = await prisma.bankTransactionPending.findMany({ select: { id: true, userId: true } });
  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  
  console.log('📝 Pending Transactions User IDs:');
  pending.forEach(p => console.log(`- Tx: ${p.id} | UserID: ${p.userId}`));
  
  console.log('\n👤 System Users:');
  users.forEach(u => console.log(`- ${u.email}: ${u.id}`));
}

checkUserIds().finally(() => prisma.$disconnect());
