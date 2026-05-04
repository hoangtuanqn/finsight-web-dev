import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ExpenseService {
  static async getAll(userId: string, filters: any) {
    const { startDate, endDate, categoryId, type, walletId } = filters || {};

    return prisma.expense.findMany({
      where: {
        userId,
        type: type || undefined,
        categoryId: categoryId || undefined,
        walletId: walletId || undefined,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined,
        },
      },
      include: {
        category: {
          include: { parent: true },
        },
        wallet: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  static async create(userId: string, data: any) {
    return prisma.expense.create({
      data: {
        userId,
        amount: data.amount,
        type: data.type || 'EXPENSE',
        categoryId: data.categoryId,
        walletId: data.walletId || null,
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
      },
      include: {
        category: { include: { parent: true } },
        wallet: true,
      },
    });
  }

  static async update(id: string, userId: string, data: any) {
    return prisma.expense.update({
      where: { id, userId },
      data: {
        amount: data.amount,
        type: data.type,
        categoryId: data.categoryId,
        walletId: data.walletId !== undefined ? data.walletId || null : undefined,
        description: data.description,
        date: data.date ? new Date(data.date) : undefined,
      },
      include: {
        category: { include: { parent: true } },
        wallet: true,
      },
    });
  }

  static async delete(id: string, userId: string) {
    return prisma.expense.delete({ where: { id, userId } });
  }

  /**
   * Returns all top-level categories with their children
   */
  static async getCategories(userId: string) {
    return prisma.expenseCategory.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        parentId: null, // only top-level groups
      },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  static async createCategory(userId: string, data: any) {
    return prisma.expenseCategory.create({
      data: {
        userId,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type || 'EXPENSE',
        parentId: data.parentId || null,
      },
    });
  }

  static async getStats(userId: string, filters: any) {
    const { startDate, endDate } = filters || {};
    const where = {
      userId,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: { include: { parent: true } } },
    });

    const totalIncome = expenses.filter((e) => e.type === 'INCOME').reduce((sum, e) => sum + e.amount, 0);
    const totalExpense = expenses.filter((e) => e.type === 'EXPENSE').reduce((sum, e) => sum + e.amount, 0);

    // Group by parent category name (top-level group)
    const groupByCat = (type: 'EXPENSE' | 'INCOME') => {
      return expenses
        .filter((e) => e.type === type)
        .reduce((acc: any, e) => {
          const cat = e.category;
          const groupName = cat?.parent?.name || cat?.name || 'Chưa phân loại';
          const groupIcon = cat?.parent?.icon || cat?.icon || '📦';
          const groupColor = cat?.parent?.color || cat?.color || '#64748b';

          if (!acc[groupName]) {
            acc[groupName] = { name: groupName, value: 0, color: groupColor, icon: groupIcon };
          }
          acc[groupName].value += e.amount;
          return acc;
        }, {});
    };

    const byCategoryExpense = groupByCat('EXPENSE');
    const byCategoryIncome = groupByCat('INCOME');

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      byCategory: Object.values(byCategoryExpense).sort((a: any, b: any) => b.value - a.value),
      byCategoryIncome: Object.values(byCategoryIncome).sort((a: any, b: any) => b.value - a.value),
    };
  }
}
