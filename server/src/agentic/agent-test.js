import { runAgenticChat } from './agent.js';
import dotenv from 'dotenv';
import path from 'path';

// Trỏ tới file .env của hệ thống
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const mockSessionId = "test-session-" + Date.now();

const queries = [
  "DTI là gì hả bạn, giải thích tôi nghe coi?", // Knowledge (Cacheable)
  "Vay ngân hàng 10 triệu lãi 5% có ổn không?", // Personal Wait/If
  "Ngủ đi", // Off-Topic
];

async function runTest() {
  console.log("🚀 Bắt đầu test Agentic RAG Pipeline với FPT Cloud SaoLa4-medium...");
  
  // Tạo user giả lập để khỏi dính lỗi foreign key
  const mockUser = await prisma.user.create({
    data: {
      email: `test_${Date.now()}@test.com`,
      password: "pass",
      fullName: "Test User",
      monthlyIncome: 20000000,
    }
  });

  for (let query of queries) {
    console.log(`\n================================\n👤 User     : ${query}\n🤖 FinSight : `);
    
    await runAgenticChat(mockUser.id, query, mockSessionId, (token) => {
      process.stdout.write(token);
    });
    console.log("\n");
  }
  
  console.log("✅ Hoàn thành chuỗi test mô phỏng.");
  process.exit();
}

runTest();
