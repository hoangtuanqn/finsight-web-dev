export const HIERARCHICAL_CATEGORIES = [
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
];

export async function seedCategories(prisma) {
  console.log('🌱 Seeding hierarchical categories...');
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
