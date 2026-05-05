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

      // Step 1: Penalty
      const penaltyToPay = Math.min(remainingAmount, unpaidPenalty);
      remainingAmount -= penaltyToPay;

      // Step 2: Interest — lấy từ schedule period chưa thanh toán đầu tiên
      const unpaidSchedules = debt.schedules.filter((s: any) => s.status !== 'PAID');
      const pendingInterest = unpaidSchedules.reduce(
        (sum: number, s: any) => sum + Math.max(0, (s.interestAmount || 0) - (s.paidInterest || 0)),
        0,
      );
      const interestToPay = Math.min(remainingAmount, pendingInterest);
      remainingAmount -= interestToPay;

      // Step 3: Principal
      const principalToPay = Math.min(remainingAmount, debt.outstanding);
      remainingAmount -= principalToPay;

      const newOutstanding = Math.max(0, debt.outstanding - principalToPay);

      // Update Schedules: phân bổ interest trước, sau đó principal
      let interestToDistribute = interestToPay;
      let principalToDistribute = principalToPay;
      for (const schedule of debt.schedules) {
        if (interestToDistribute <= 0 && principalToDistribute <= 0) break;
        if (schedule.status === 'PAID') continue;

        const scheduleInterestRemaining = Math.max(0, (schedule.interestAmount || 0) - (schedule.paidInterest || 0));
        const interestPayToThis = Math.min(interestToDistribute, scheduleInterestRemaining);
        const newPaidInterest = (schedule.paidInterest || 0) + interestPayToThis;
        interestToDistribute -= interestPayToThis;

        const schedulePrincipalRemaining = schedule.principalAmount - (schedule.paidPrincipal || 0);
        const principalPayToThis = Math.min(principalToDistribute, schedulePrincipalRemaining);
        const newPaidPrincipal = (schedule.paidPrincipal || 0) + principalPayToThis;
        principalToDistribute -= principalPayToThis;

        const isFullyPaid =
          newPaidPrincipal >= schedule.principalAmount && newPaidInterest >= (schedule.interestAmount || 0);

        await tx.debtSchedule.update({
          where: { id: schedule.id },
          data: {
            paidInterest: newPaidInterest,
            paidPrincipal: newPaidPrincipal,
            status: isFullyPaid ? 'PAID' : 'PARTIAL',
          },
        });
      }

      const transaction = await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'PAYMENT',
          amount: data.amount,
          principalPart: principalToPay,
          interestPart: interestToPay,
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
            content: `Khoản nợ ${debt.internalCode} đã nhận thanh toán ${data.amount.toLocaleString()}đ (Gốc: ${principalToPay.toLocaleString()}đ, Lãi: ${interestToPay.toLocaleString()}đ, Phạt: ${penaltyToPay.toLocaleString()}đ). Dư nợ còn lại: ${newOutstanding.toLocaleString()}đ.`,
            debtRecordId: debt.id,
            data: {
              amount: data.amount,
              principalPart: principalToPay,
              interestPart: interestToPay,
              penaltyPart: penaltyToPay,
              newOutstanding,
            },
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
        include: {
          debtRecord: { include: { party: { select: { personInChargeId: true } } } },
          reversedBy: { select: { id: true }, take: 1 },
        },
      });

      if (!originalTx) throw new Error('Không tìm thấy giao dịch gốc');
      const debt = originalTx.debtRecord;

      if (debt.organizationId !== orgId) throw new Error('Không có quyền đảo ngược giao dịch này');
      if (originalTx.reversedBy.length > 0) throw new Error('Giao dịch này đã được đảo ngược trước đó');

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
