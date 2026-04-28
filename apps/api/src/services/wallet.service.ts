import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WalletService {
  static async getAll(userId: string) {
    return prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  static async create(userId: string, data: any) {
    return prisma.wallet.create({
      data: {
        userId,
        name: data.name,
        type: data.type || 'CASH',
        icon: data.icon,
        color: data.color || '#3b82f6',
        balance: parseFloat(data.balance) || 0,
        isDefault: data.isDefault || false,
      },
    });
  }

  static async update(id: string, userId: string, data: any) {
    return prisma.wallet.update({
      where: { id, userId },
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        balance: data.balance !== undefined ? parseFloat(data.balance) : undefined,
        isDefault: data.isDefault,
      },
    });
  }

  static async delete(id: string, userId: string) {
    // Set expenses referencing this wallet to null before deleting
    await prisma.expense.updateMany({
      where: { walletId: id, userId },
      data: { walletId: null },
    });
    return prisma.wallet.delete({ where: { id, userId } });
  }

  static async getTotalBalance(userId: string) {
    const wallets = await prisma.wallet.findMany({ where: { userId } });
    const total = wallets.reduce((sum, w) => sum + w.balance, 0);
    return { total, wallets };
  }
}
