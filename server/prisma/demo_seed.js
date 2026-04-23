import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main() {
  const email = 'demo@finsight.vn';
  const rawPassword = 'demo_password_123';
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  // Clean up existing demo user
  await prisma.user.deleteMany({ where: { email } });

  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'Khách Hàng Demo',
      monthlyIncome: 25000000,
      password: hashedPassword,
      level: 'PROMAX',
      debts: {
        create: [
          {
            name: 'Thẻ tín dụng VIB Online Plus',
            platform: 'VIB',
            originalAmount: 20000000,
            balance: 15000000,
            apr: 36,
            minPayment: 750000,
            dueDay: 15,
            termMonths: 12,
            remainingTerms: 12,
          },
          {
            name: 'Thẻ tín dụng HSBC',
            platform: 'HSBC',
            originalAmount: 30000000,
            balance: 20000000,
            apr: 32,
            minPayment: 1000000,
            dueDay: 20,
            termMonths: 12,
            remainingTerms: 12,
          },
          {
            name: 'Vay tiêu dùng FE Credit',
            platform: 'FE Credit',
            originalAmount: 50000000,
            balance: 35000000,
            apr: 45,
            minPayment: 2500000,
            dueDay: 5,
            termMonths: 24,
            remainingTerms: 15,
          },
          {
            name: 'Vay mua xe máy Home Credit',
            platform: 'Home Credit',
            originalAmount: 25000000,
            balance: 12000000,
            apr: 38,
            minPayment: 1200000,
            dueDay: 10,
            termMonths: 18,
            remainingTerms: 8,
          },
          {
            name: 'Vay trả góp Thế Giới Di Động',
            platform: 'Mcredit',
            originalAmount: 15000000,
            balance: 8000000,
            apr: 28,
            minPayment: 950000,
            dueDay: 12,
            termMonths: 12,
            remainingTerms: 6,
          },
          {
            name: 'Vay app Crezu',
            platform: 'Crezu',
            originalAmount: 5000000,
            balance: 5000000,
            apr: 60,
            minPayment: 5500000, // One-time heavy payment simulation
            dueDay: 25,
            termMonths: 1,
            remainingTerms: 1,
          },
          {
            name: 'Thẻ tín dụng Techcombank',
            platform: 'Techcombank',
            originalAmount: 60000000,
            balance: 50000000,
            apr: 24,
            minPayment: 2500000,
            dueDay: 18,
            termMonths: 12,
            remainingTerms: 12,
          },
          {
            name: 'Vay thấu chi TPBank',
            platform: 'TPBank',
            originalAmount: 10000000,
            balance: 10000000,
            apr: 18,
            minPayment: 500000,
            dueDay: 28,
            termMonths: 12,
            remainingTerms: 12,
          },
          {
            name: 'Vay mua Laptop FPT Shop',
            platform: 'HD Saison',
            originalAmount: 22000000,
            balance: 18000000,
            apr: 34,
            minPayment: 1800000,
            dueDay: 7,
            termMonths: 12,
            remainingTerms: 10,
          },
          {
            name: 'Vay qua người thân',
            platform: 'Cá nhân',
            originalAmount: 40000000,
            balance: 40000000,
            apr: 0,
            minPayment: 2000000,
            dueDay: 30,
            termMonths: 20,
            remainingTerms: 20,
          }
        ]
      }
    }
  });

  console.log('Demo user created:', user.email);
  console.log('User ID:', user.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
