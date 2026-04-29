import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const usersWithoutCode = await prisma.user.findMany({
    where: {
      OR: [
        { referralCode: null },
        { referralCode: '' }
      ]
    },
    select: { id: true, fullName: true }
  });

  console.log(`Found ${usersWithoutCode.length} users without referral code.`);

  for (const user of usersWithoutCode) {
    const base = user.fullName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(' ')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') || 'user';
    
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `${base}${randomSuffix}`;

    await prisma.user.update({
      where: { id: user.id },
      data: { referralCode: code }
    });
    
    console.log(`Generated code ${code} for ${user.fullName}`);
  }

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
