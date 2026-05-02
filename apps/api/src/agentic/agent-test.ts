import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { runAgenticChat } from './agent';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();
const mockSessionId = 'test-session-' + Date.now();

const queries = ['DTI là gì hả bạn, giải thích tôi nghe coi?', 'Vay ngân hàng 10 triệu lãi 5% có ổn không?', 'Ngủ đi'];

async function runTest() {
  console.log('🚀 Bắt đầu test Agentic RAG Pipeline với FPT Cloud SaoLa4-medium...');

  const mockUser = await (prisma as any).user.create({
    data: {
      email: `test_${Date.now()}@test.com`,
      password: 'pass',
      fullName: 'Test User',
      monthlyIncome: 20000000,
    },
  });

  for (let query of queries) {
    console.log(`\n================================\n👤 User     : ${query}\n🤖 FinSight : `);

    await runAgenticChat(
      mockUser.id,
      query,
      mockSessionId,
      (token) => {
        process.stdout.write(token);
      },
      (status) => {
        if (status) console.log(`\n[Status]: ${status}`);
      },
    );
    console.log('\n');
  }

  console.log('✅ Hoàn thành chuỗi test mô phỏng.');
  process.exit();
}

runTest();
