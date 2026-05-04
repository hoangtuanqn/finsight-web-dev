import enterpriseDb from '../../prisma/enterprise.client';
import debtStatusService from './debtStatus.service';

export class TransactionService {
  /**
   * Ghi nhận thanh toán và phân bổ theo Waterfall (Penalty -> Interest -> Principal)
   */
  async createPayment(data: {
    orgId: string;
    userId: string;
    debtId: string;
    amount: number;
    paidAt: Date;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      // 1. Lấy thông tin khoản nợ và lịch thanh toán
      const debt = await tx.debtRecord.findUnique({
        where: { id: data.debtId, organizationId: data.orgId },
        include: {
          schedules: { orderBy: { period: 'asc' } },
        },
      });

      if (!debt) throw new Error('Không tìm thấy khoản nợ');
      if (!['ACTIVE', 'PARTIAL', 'OVERDUE', 'DISPUTED'].includes(debt.status)) {
        throw new Error(`Không thể thanh toán cho khoản nợ ở trạng thái ${debt.status}`);
      }

      // 2. Tính toán phân bổ (Waterfall)
      // Lưu ý: Trong Module 4, chúng ta giả định các khoản lãi/phạt đã được ghi nhận
      // bởi hệ thống hoặc người dùng. Hiện tại tập trung vào logic khấu trừ gốc.

      const currentOutstanding = await debtStatusService.getOutstandingBalance(debt.id);

      if (data.amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0');

      let remainingAmount = data.amount;
      let principalPaid = 0;
      let interestPaid = 0;
      let penaltyPaid = 0;

      // TODO: Sau này Module 5 sẽ cung cấp số liệu Lãi/Phạt cụ thể để trừ tại đây
      // Hiện tại: Ưu tiên trừ vào gốc (Principal)
      principalPaid = Math.min(remainingAmount, currentOutstanding);
      remainingAmount -= principalPaid;

      if (remainingAmount > 0) {
        throw new Error('Số tiền thanh toán vượt quá dư nợ hiện tại');
      }

      // 3. Cập nhật các kỳ thanh toán (Schedules)
      if (debt.schedules.length > 0) {
        let amountToDistribute = principalPaid;
        for (const schedule of debt.schedules) {
          if (amountToDistribute <= 0) break;
          if (schedule.status === 'PAID') continue;

          // Tính toán phần nợ gốc còn thiếu trong kỳ này
          const remainingPrincipalInSchedule = schedule.principalAmount - (schedule.paidPrincipal || 0);
          const payToThisSchedule = Math.min(amountToDistribute, remainingPrincipalInSchedule);

          const newPaidPrincipal = (schedule.paidPrincipal || 0) + payToThisSchedule;
          const isFullyPaid = newPaidPrincipal >= schedule.principalAmount;

          await tx.debtSchedule.update({
            where: { id: schedule.id },
            data: {
              paidPrincipal: newPaidPrincipal,
              status: isFullyPaid ? 'PAID' : 'PARTIAL',
            },
          });

          amountToDistribute -= payToThisSchedule;
        }
      }

      // 4. Tạo bản ghi giao dịch
      const newOutstanding = currentOutstanding - principalPaid;

      const transaction = await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'PAYMENT',
          amount: data.amount,
          principalPart: principalPaid,
          interestPart: interestPaid,
          penaltyPart: penaltyPaid,
          paidAt: data.paidAt,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          balanceSnapshot: newOutstanding,
        },
      });

      // 5. Cập nhật Outstanding trên DebtRecord
      await tx.debtRecord.update({
        where: { id: debt.id },
        data: { outstanding: newOutstanding },
      });

      // 6. Chuyển trạng thái khoản nợ
      let newStatus = debt.status;
      if (newOutstanding <= 0) {
        newStatus = 'PAID';
      } else if (debt.status === 'ACTIVE') {
        newStatus = 'PARTIAL';
      }

      if (newStatus !== debt.status) {
        await tx.debtRecord.update({
          where: { id: debt.id },
          data: { status: newStatus },
        });

        await tx.auditLog.create({
          data: {
            organizationId: data.orgId,
            userId: data.userId,
            action: 'UPDATE_STATUS',
            entityType: 'DEBT_RECORD',
            entityId: debt.id,
            oldValues: { status: debt.status },
            newValues: { status: newStatus, outstandingSnapshot: newOutstanding },
            reason: 'Tự động cập nhật sau thanh toán',
          },
        });
      }

      return transaction;
    });
  }

  /**
   * Đảo bút toán (Reversal)
   */
  async reverseTransaction(orgId: string, userId: string, transactionId: string, reason: string) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const originalTx = await tx.debtTransaction.findUnique({
        where: { id: transactionId },
        include: { debtRecord: true },
      });

      if (!originalTx) throw new Error('Không tìm thấy giao dịch gốc');
      if (originalTx.type === 'REVERSAL') throw new Error('Không thể đảo ngược một giao dịch đảo');

      // Kiểm tra xem đã bị đảo ngược chưa
      const existingReversal = await tx.debtTransaction.findFirst({
        where: { reversesTransactionId: transactionId },
      });
      if (existingReversal) throw new Error('Giao dịch này đã được đảo ngược trước đó');

      const debt = originalTx.debtRecord;
      if (debt.organizationId !== orgId) throw new Error('Không có quyền truy cập');

      // 1. Tạo giao dịch đảo (âm tiền)
      const reversalTx = await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'REVERSAL',
          amount: -originalTx.amount,
          principalPart: -originalTx.principalPart,
          interestPart: -originalTx.interestPart,
          penaltyPart: -originalTx.penaltyPart,
          paidAt: new Date(),
          notes: `Đảo ngược giao dịch ${originalTx.id}. Lý do: ${reason}`,
          reversesTransactionId: originalTx.id,
          balanceSnapshot: debt.outstanding + originalTx.principalPart,
        },
      });

      // 2. Hoàn trả Outstanding
      const restoredOutstanding = debt.outstanding + originalTx.principalPart;
      await tx.debtRecord.update({
        where: { id: debt.id },
        data: { outstanding: restoredOutstanding },
      });

      // 3. Hoàn trả Schedules (LIFO - đảo ngược từ kỳ cuối cùng có thanh toán)
      if (originalTx.principalPart > 0) {
        const schedules = await tx.debtSchedule.findMany({
          where: { debtRecordId: debt.id, paidPrincipal: { gt: 0 } },
          orderBy: { period: 'desc' },
        });

        let amountToRestore = originalTx.principalPart;
        for (const schedule of schedules) {
          if (amountToRestore <= 0) break;

          const restoreFromThis = Math.min(amountToRestore, schedule.paidPrincipal);
          const newPaidPrincipal = schedule.paidPrincipal - restoreFromThis;

          await tx.debtSchedule.update({
            where: { id: schedule.id },
            data: {
              paidPrincipal: newPaidPrincipal,
              status: newPaidPrincipal <= 0 ? 'PENDING' : 'PARTIAL',
            },
          });

          amountToRestore -= restoreFromThis;
        }
      }

      // 4. Khôi phục trạng thái khoản nợ nếu cần
      let restoredStatus = debt.status;
      if (restoredOutstanding > 0 && debt.status === 'PAID') {
        restoredStatus = 'PARTIAL';
      }

      if (restoredStatus !== debt.status) {
        await tx.debtRecord.update({
          where: { id: debt.id },
          data: { status: restoredStatus },
        });
      }

      return reversalTx;
    });
  }
}

export default new TransactionService();
