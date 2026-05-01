import { PrismaClient } from '@prisma/client';
import { PrismaClient as EnterpriseClient } from '@prisma/enterprise';
import { seedDemo } from './demo_seed.js';
import { seedEnterprise } from './enterprise_seed.js';
import { seedMaster } from './master_seed.js';

const prisma = new PrismaClient();
const enterprisePrisma = new EnterpriseClient();

// --- GLOBAL CATEGORIES ---
const HIERARCHICAL_CATEGORIES = [
  {
    name: 'Ăn uống',
    icon: '🍜',
    color: '#f59e0b',
    type: 'EXPENSE',
    sortOrder: 0,
    children: [
      { name: 'Ăn sáng', icon: '🥐', sortOrder: 0 },
      { name: 'Ăn trưa', icon: '🍱', sortOrder: 1 },
      { name: 'Ăn tối', icon: '🍽️', sortOrder: 2 },
      { name: 'Cà phê', icon: '☕', sortOrder: 3 },
      { name: 'Đồ ăn vặt', icon: '🍿', sortOrder: 4 },
      { name: 'Ăn ngoài', icon: '🍔', sortOrder: 5 },
    ],
  },
  {
    name: 'Di chuyển',
    icon: '🚗',
    color: '#3b82f6',
    type: 'EXPENSE',
    sortOrder: 1,
    children: [
      { name: 'Xăng xe', icon: '⛽', sortOrder: 0 },
      { name: 'Taxi / Grab', icon: '🚕', sortOrder: 1 },
      { name: 'Xe buýt', icon: '🚌', sortOrder: 2 },
      { name: 'Gửi xe', icon: '🅿️', sortOrder: 3 },
      { name: 'Bảo dưỡng xe', icon: '🔧', sortOrder: 4 },
    ],
  },
  {
    name: 'Nhà cửa',
    icon: '🏠',
    color: '#8b5cf6',
    type: 'EXPENSE',
    sortOrder: 2,
    children: [
      { name: 'Tiền thuê nhà', icon: '🏡', sortOrder: 0 },
      { name: 'Điện', icon: '⚡', sortOrder: 1 },
      { name: 'Nước', icon: '💧', sortOrder: 2 },
      { name: 'Internet', icon: '📡', sortOrder: 3 },
      { name: 'Đồ dùng nhà', icon: '🛋️', sortOrder: 4 },
    ],
  },
  {
    name: 'Mua sắm',
    icon: '🛍️',
    color: '#ec4899',
    type: 'EXPENSE',
    sortOrder: 3,
    children: [
      { name: 'Quần áo', icon: '👕', sortOrder: 0 },
      { name: 'Giày dép', icon: '👟', sortOrder: 1 },
      { name: 'Điện tử', icon: '📱', sortOrder: 2 },
      { name: 'Mỹ phẩm', icon: '💄', sortOrder: 3 },
      { name: 'Tạp hóa', icon: '🛒', sortOrder: 4 },
    ],
  },
  {
    name: 'Sức khỏe',
    icon: '💊',
    color: '#10b981',
    type: 'EXPENSE',
    sortOrder: 4,
    children: [
      { name: 'Khám bệnh', icon: '🏥', sortOrder: 0 },
      { name: 'Thuốc', icon: '💊', sortOrder: 1 },
      { name: 'Tập gym', icon: '🏋️', sortOrder: 2 },
      { name: 'Chăm sóc sức khỏe', icon: '🧘', sortOrder: 3 },
    ],
  },
  {
    name: 'Giải trí',
    icon: '🎮',
    color: '#06b6d4',
    type: 'EXPENSE',
    sortOrder: 5,
    children: [
      { name: 'Phim ảnh', icon: '🎬', sortOrder: 0 },
      { name: 'Du lịch', icon: '✈️', sortOrder: 1 },
      { name: 'Sách', icon: '📚', sortOrder: 2 },
      { name: 'Game', icon: '🎮', sortOrder: 3 },
      { name: 'Âm nhạc', icon: '🎵', sortOrder: 4 },
    ],
  },
  {
    name: 'Học tập',
    icon: '📚',
    color: '#f97316',
    type: 'EXPENSE',
    sortOrder: 6,
    children: [
      { name: 'Học phí', icon: '🎓', sortOrder: 0 },
      { name: 'Sách vở', icon: '📖', sortOrder: 1 },
      { name: 'Khóa học', icon: '💻', sortOrder: 2 },
    ],
  },
  {
    name: 'Hóa đơn',
    icon: '📄',
    color: '#64748b',
    type: 'EXPENSE',
    sortOrder: 7,
    children: [
      { name: 'Điện thoại', icon: '📞', sortOrder: 0 },
      { name: 'Bảo hiểm', icon: '🛡️', sortOrder: 1 },
      { name: 'Thuế', icon: '📋', sortOrder: 2 },
    ],
  },
  {
    name: 'Khác (Chi)',
    icon: '💸',
    color: '#6b7280',
    type: 'EXPENSE',
    sortOrder: 8,
    children: [
      { name: 'Quà tặng', icon: '🎁', sortOrder: 0 },
      { name: 'Từ thiện', icon: '❤️', sortOrder: 1 },
      { name: 'Chi tiêu khác', icon: '💰', sortOrder: 2 },
    ],
  },
  {
    name: 'Lương',
    icon: '💼',
    color: '#22c55e',
    type: 'INCOME',
    sortOrder: 0,
    children: [
      { name: 'Lương cơ bản', icon: '💵', sortOrder: 0 },
      { name: 'Thưởng', icon: '🏆', sortOrder: 1 },
      { name: 'Làm thêm', icon: '⏰', sortOrder: 2 },
    ],
  },
  {
    name: 'Đầu tư',
    icon: '📈',
    color: '#3b82f6',
    type: 'INCOME',
    sortOrder: 1,
    children: [
      { name: 'Cổ tức', icon: '📊', sortOrder: 0 },
      { name: 'Lãi tiết kiệm', icon: '🏦', sortOrder: 1 },
      { name: 'Crypto', icon: '🪙', sortOrder: 2 },
    ],
  },
  {
    name: 'Kinh doanh',
    icon: '🏪',
    color: '#f59e0b',
    type: 'INCOME',
    sortOrder: 2,
    children: [
      { name: 'Bán hàng', icon: '🛍️', sortOrder: 0 },
      { name: 'Dịch vụ', icon: '🔧', sortOrder: 1 },
      { name: 'Freelance', icon: '💻', sortOrder: 2 },
    ],
  },
  {
    name: 'Khác (Thu)',
    icon: '💰',
    color: '#10b981',
    type: 'INCOME',
    sortOrder: 3,
    children: [
      { name: 'Quà nhận', icon: '🎁', sortOrder: 0 },
      { name: 'Hoàn tiền', icon: '↩️', sortOrder: 1 },
      { name: 'Thu nhập khác', icon: '💰', sortOrder: 2 },
    ],
  },
];

async function seedCategories() {
  console.log('🌱 Seeding hierarchical categories...');
  // Cascade delete logic
  await prisma.expense.deleteMany({});
  await prisma.expenseCategory.deleteMany({});

  for (const group of HIERARCHICAL_CATEGORIES) {
    const { children, ...groupData } = group;
    const parent = await prisma.expenseCategory.create({
      data: { ...groupData, userId: null },
    });
    for (const child of children) {
      await prisma.expenseCategory.create({
        data: {
          ...child,
          type: groupData.type,
          color: groupData.color,
          parentId: parent.id,
          userId: null,
        },
      });
    }
  }
}

async function main() {
  console.log('\n🚀 Starting FinSight ROOT SEED (Orchestrator)...\n');

  // 1. Seed Global Categories
  await seedCategories();

  // 2. Seed Master User (Hoàng Minh Tuấn)
  console.log('\n--- Seeding Master User ---');
  await seedMaster(prisma);

  // 3. Seed Demo User (Nguyễn Minh Khải)
  console.log('\n--- Seeding Demo User ---');
  await seedDemo(prisma);

  // 4. Seed Enterprise Data
  console.log('\n--- Seeding Enterprise Data ---');
  await seedEnterprise(enterprisePrisma);

  console.log('\n✅ ALL SEEDS COMPLETED SUCCESSFULLY!\n');
}

main()
  .catch((e) => {
    console.error('❌ Root Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await enterprisePrisma.$disconnect();
  });
