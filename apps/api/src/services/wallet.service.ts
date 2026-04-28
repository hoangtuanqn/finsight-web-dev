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
    const now = new Date();
    return prisma.wallet.create({
      data: {
        userId,
        name: data.name,
        type: data.type || 'CASH',
        icon: data.icon,
        color: data.color || '#3b82f6',
        balance: parseFloat(data.balance) || 0,
        isDefault: data.isDefault || false,
        // Bank & SePay fields
        bankName: data.bankName || null,
        bankAccountNumber: data.bankAccountNumber || null,
        sepayToken: data.sepayToken || null,
        // Ghi nhận thời điểm liên kết để chỉ lấy GD từ lúc này trở đi
        sepayLinkedAt: data.sepayToken ? now : null,
      },
    });
  }

  static async update(id: string, userId: string, data: any) {
    const existing = await prisma.wallet.findUnique({ where: { id, userId } });
    const isNewToken = data.sepayToken && data.sepayToken !== existing?.sepayToken;

    return prisma.wallet.update({
      where: { id, userId },
      data: {
        name: data.name,
        type: data.type,
        icon: data.icon,
        color: data.color,
        balance: data.balance !== undefined ? parseFloat(data.balance) : undefined,
        isDefault: data.isDefault,
        bankName: data.bankName !== undefined ? data.bankName : undefined,
        bankAccountNumber: data.bankAccountNumber !== undefined ? data.bankAccountNumber : undefined,
        sepayToken: data.sepayToken !== undefined ? (data.sepayToken || null) : undefined,
        // Reset thời điểm liên kết nếu token mới được thêm
        ...(isNewToken && { sepayLinkedAt: new Date() }),
        // Xóa liên kết nếu token bị remove
        ...(data.sepayToken === '' && { sepayLinkedAt: null }),
      },
    });
  }

  static async delete(id: string, userId: string) {
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
