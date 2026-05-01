import { PrismaClient } from '@prisma/client';
import { PrismaClient as EnterpriseClient } from '@prisma/enterprise';
import { seedArticles } from './seeds/articles.js';
import { seedCategories } from './seeds/categories.js';
import { seedEnterprise } from './seeds/enterprise.js';
import { seedUsers } from './seeds/users.js';

const prisma = new PrismaClient();
const enterprisePrisma = new EnterpriseClient();

async function main() {
  console.log('\n🚀 Starting FinSight Consolidated MODULAR Seed...\n');

  // 1. Core Platform Config
  await seedCategories(prisma);
  await seedArticles(prisma);

  // 2. User Data (Master Accounts + Synchronized Rich Data)
  // This replaces the old master_seed.js logic
  await seedUsers(prisma);

  // 3. Enterprise Data
  await seedEnterprise(enterprisePrisma);

  console.log('\n✅ ALL MODULAR SEEDS COMPLETED SUCCESSFULLY!\n');
}

main()
  .catch((e) => {
    console.error('❌ Modular Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await enterprisePrisma.$disconnect();
  });
