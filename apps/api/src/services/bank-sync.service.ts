import prisma from '../lib/prisma';

export class BankSyncService {
  /**
   * Lấy danh sách giao dịch đang chờ duyệt của user
   */
  static async getPendingTransactions(userId: string, walletId?: string) {
    return prisma.bankTransactionPending.findMany({
      where: {
        userId,
        status: 'PENDING',
        ...(walletId && { walletId }),
      },
      orderBy: { transactionDate: 'desc' },
      include: {
        wallet: {
          select: { name: true, icon: true, color: true }
        }
      }
    });
  }

  /**
   * Duyệt giao dịch: Chuyển từ PENDING sang APPROVED và tạo một bản ghi Expense
   */
  static async approveTransaction(userId: string, pendingId: string, data: { categoryId: string, description?: string, type?: 'INCOME' | 'EXPENSE' }) {
    const pending = await prisma.bankTransactionPending.findUnique({
      where: { id: pendingId, userId }
    });

    if (!pending || pending.status !== 'PENDING') {
      throw new Error('Giao dịch không tồn tại hoặc đã được xử lý');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Tạo Expense
      const expense = await tx.expense.create({
        data: {
          userId: pending.userId,
          walletId: pending.walletId,
          amount: pending.amount,
          type: data.type || (pending.type as 'INCOME' | 'EXPENSE'),
          categoryId: data.categoryId,
          date: pending.transactionDate,
          description: data.description || pending.description || 'Giao dịch ngân hàng',
        }
      });

      // 2. Cập nhật trạng thái bản ghi chờ
      await tx.bankTransactionPending.update({
        where: { id: pendingId },
        data: { status: 'APPROVED' }
      });

      return expense;
    });
  }

  /**
   * Từ chối giao dịch: Chuyển trạng thái sang REJECTED
   */
  static async rejectTransaction(userId: string, pendingId: string) {
    return prisma.bankTransactionPending.update({
      where: { id: pendingId, userId },
      data: { status: 'REJECTED' }
    });
  }

  /**
   * Xóa các giao dịch đã REJECTED hoặc APPROVED lâu ngày (Maintenance)
   */
  static async clearHistory(userId: string) {
    return prisma.bankTransactionPending.deleteMany({
      where: {
        userId,
        status: { in: ['APPROVED', 'REJECTED'] }
      }
    });
  }
}
