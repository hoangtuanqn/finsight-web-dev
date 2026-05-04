import enterpriseDb from '../../prisma/enterprise.client';
import { NotificationService } from './notification.service';

export class TransactionService {
  /**
   * Ghi nhận một giao dịch phạt (Penalty) tích lũy
   */
  async createPenaltyTransaction(data: { debtId: string; amount: number; notes?: string; paidAt?: Date }) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const debt = await tx.debtRecord.findUnique({
        where: { id: data.debtId },
      });

      if (!debt) throw new Error('Không tìm thấy khoản nợ');

      return await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'PENALTY',
          amount: data.amount,
          principalPart: 0,
          interestPart: 0,
          penaltyPart: data.amount,
          paidAt: data.paidAt || new Date(),
          notes: data.notes || 'Phạt tích lũy hệ thống',
          balanceSnapshot: debt.outstanding,
        },
      });
    });
  }

  /**
   * Ghi nhận thanh toán và phân bổ theo Waterfall
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
      const debt = await tx.debtRecord.findUnique({
        where: { id: data.debtId, organizationId: data.orgId },
        include: {
          schedules: { orderBy: { period: 'asc' } },
          transactions: true,
          party: { select: { name: true, personInChargeId: true } },
        },
      });

      if (!debt) throw new Error('Không tìm thấy khoản nợ');
      if (data.amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0');

      // Waterfall logic
      const totalPenaltyAccrued = debt.transactions
        .filter((t: any) => t.type === 'PENALTY')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalPenaltyPaid = debt.transactions
        .filter((t: any) => t.type === 'PAYMENT' || t.type === 'REVERSAL')
        .reduce((sum: number, t: any) => sum + (t.penaltyPart || 0), 0);

      const unpaidPenalty = Math.max(0, totalPenaltyAccrued - totalPenaltyPaid);

      let remainingAmount = data.amount;
      const penaltyToPay = Math.min(remainingAmount, unpaidPenalty);
      remainingAmount -= penaltyToPay;

      const principalToPay = Math.min(remainingAmount, debt.outstanding);
      remainingAmount -= principalToPay;

      const newOutstanding = Math.max(0, debt.outstanding - principalToPay);

      // Update Schedules
      if (principalToPay > 0) {
        let amountToDistribute = principalToPay;
        for (const schedule of debt.schedules) {
          if (amountToDistribute <= 0) break;
          if (schedule.status === 'PAID') continue;

          const remainingInSchedule = schedule.principalAmount - (schedule.paidPrincipal || 0);
          const payToThis = Math.min(amountToDistribute, remainingInSchedule);
          const newPaid = (schedule.paidPrincipal || 0) + payToThis;

          await tx.debtSchedule.update({
            where: { id: schedule.id },
            data: {
              paidPrincipal: newPaid,
              status: newPaid >= schedule.principalAmount ? 'PAID' : 'PARTIAL',
            },
          });
          amountToDistribute -= payToThis;
        }
      }

      const transaction = await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'PAYMENT',
          amount: data.amount,
          principalPart: principalToPay,
          penaltyPart: penaltyToPay,
          paidAt: data.paidAt,
          paymentMethod: data.paymentMethod,
          reference: data.reference,
          notes: data.notes,
          balanceSnapshot: newOutstanding,
        },
      });

      await tx.debtRecord.update({
        where: { id: debt.id },
        data: {
          outstanding: newOutstanding,
          status: newOutstanding <= 0 ? 'PAID' : 'PARTIAL',
        },
      });

      // Notify
      const recipientId = debt.personInChargeId || debt.party?.personInChargeId;
      if (recipientId) {
        await NotificationService.createNotification(
          {
            organizationId: data.orgId,
            targetUserId: recipientId,
            type: 'EVENT_BASED',
            category: 'PAYMENT',
            priority: 'NORMAL',
            title: `✅ Thanh toán được ghi nhận: ${data.amount.toLocaleString()}đ`,
            content: `Khoản nợ ${debt.internalCode} đã nhận thanh toán ${data.amount.toLocaleString()}đ (Gốc: ${principalToPay.toLocaleString()}đ, Phạt: ${penaltyToPay.toLocaleString()}đ). Dư nợ còn lại: ${newOutstanding.toLocaleString()}đ.`,
            debtRecordId: debt.id,
            data: { amount: data.amount, principalPart: principalToPay, penaltyPart: penaltyToPay, newOutstanding },
          },
          tx,
        );
      }

      return transaction;
    });
  }

  async reverseTransaction(orgId: string, userId: string, transactionId: string, reason: string) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const originalTx = await tx.debtTransaction.findUnique({
        where: { id: transactionId },
        include: { debtRecord: { include: { party: { select: { personInChargeId: true } } } } },
      });

      if (!originalTx) throw new Error('Không tìm thấy giao dịch gốc');
      const debt = originalTx.debtRecord;

      const reversalTx = await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'REVERSAL',
          amount: -originalTx.amount,
          principalPart: -originalTx.principalPart,
          penaltyPart: -originalTx.penaltyPart,
          paidAt: new Date(),
          notes: `Đảo ngược giao dịch ${originalTx.id}. Lý do: ${reason}`,
          reversesTransactionId: originalTx.id,
          balanceSnapshot: debt.outstanding + originalTx.principalPart,
        },
      });

      const restoredOutstanding = debt.outstanding + originalTx.principalPart;
      await tx.debtRecord.update({
        where: { id: debt.id },
        data: {
          outstanding: restoredOutstanding,
          status: restoredOutstanding > 0 ? (debt.status === 'PAID' ? 'PARTIAL' : debt.status) : debt.status,
        },
      });

      // Notify
      const recipientId = debt.personInChargeId || debt.party?.personInChargeId;
      if (recipientId) {
        await NotificationService.createNotification(
          {
            organizationId: orgId,
            targetUserId: recipientId,
            type: 'EVENT_BASED',
            category: 'PAYMENT',
            priority: 'IMPORTANT',
            title: `⚠️ Giao dịch bị ĐẢO NGƯỢC: ${originalTx.amount.toLocaleString()}đ`,
            content: `Giao dịch ${originalTx.id} của khoản nợ ${debt.internalCode} đã bị đảo ngược. Lý do: ${reason}. Dư nợ đã khôi phục về ${restoredOutstanding.toLocaleString()}đ.`,
            debtRecordId: debt.id,
          },
          tx,
        );
      }

      return reversalTx;
    });
  }
}

export default new TransactionService();
