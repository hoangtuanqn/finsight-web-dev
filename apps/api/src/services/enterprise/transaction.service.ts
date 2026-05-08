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
      const pendingInterest =
        Math.round(
          unpaidSchedules.reduce(
            (sum: number, s: any) => sum + Math.max(0, (s.interestAmount || 0) - (s.paidInterest || 0)),
            0,
          ) * 100,
        ) / 100;
      const interestToPay = Math.round(Math.min(remainingAmount, pendingInterest) * 100) / 100;
      remainingAmount = Math.round((remainingAmount - interestToPay) * 100) / 100;

      // Step 3: Principal
      const principalToPay = Math.round(Math.min(remainingAmount, debt.outstanding) * 100) / 100;
      remainingAmount = Math.round((remainingAmount - principalToPay) * 100) / 100;

      const newOutstanding = Math.max(0, Math.round((debt.outstanding - principalToPay) * 100) / 100);

      // Update Schedules: phân bổ interest trước, sau đó principal
      let interestToDistribute = interestToPay;
      let principalToDistribute = principalToPay;
      for (const schedule of debt.schedules) {
        if (interestToDistribute <= 0 && principalToDistribute <= 0) break;
        if (schedule.status === 'PAID') continue;

        const scheduleInterestRemaining = Math.max(0, (schedule.interestAmount || 0) - (schedule.paidInterest || 0));
        const interestPayToThis = Math.round(Math.min(interestToDistribute, scheduleInterestRemaining) * 100) / 100;
        const newPaidInterest = Math.round(((schedule.paidInterest || 0) + interestPayToThis) * 100) / 100;
        interestToDistribute = Math.round((interestToDistribute - interestPayToThis) * 100) / 100;

        const schedulePrincipalRemaining = Math.max(0, (schedule.principalAmount || 0) - (schedule.paidPrincipal || 0));
        const principalPayToThis = Math.round(Math.min(principalToDistribute, schedulePrincipalRemaining) * 100) / 100;
        const newPaidPrincipal = Math.round(((schedule.paidPrincipal || 0) + principalPayToThis) * 100) / 100;
        principalToDistribute = Math.round((principalToDistribute - principalPayToThis) * 100) / 100;

        // Use epsilon (1.0) to handle rounding differences and fractional remainders (especially for VND)
        const isFullyPaid =
          newPaidPrincipal >= schedule.principalAmount - 1.0 && newPaidInterest >= (schedule.interestAmount || 0) - 1.0;

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
          debtRecord: {
            include: {
              party: { select: { personInChargeId: true } },
              schedules: { orderBy: { period: 'desc' } }, // Lấy lịch trình sắp xếp ngược để hoàn tác từ kỳ muộn nhất
            },
          },
          reversedBy: { select: { id: true }, take: 1 },
        },
      });

      if (!originalTx) throw new Error('Không tìm thấy giao dịch gốc');
      const debt = originalTx.debtRecord;

      if (debt.organizationId !== orgId) throw new Error('Không có quyền đảo ngược giao dịch này');
      if (originalTx.reversedBy.length > 0) throw new Error('Giao dịch này đã được đảo ngược trước đó');

      // 1. Hoàn tác Lịch trình thanh toán (Schedules)
      let principalToRecover = originalTx.principalPart;
      let interestToRecover = originalTx.interestPart || 0;
      for (const schedule of debt.schedules) {
        if (principalToRecover <= 0 && interestToRecover <= 0) break;

        const recoverPrincipal = Math.min(principalToRecover, schedule.paidPrincipal || 0);
        const recoverInterest = Math.min(interestToRecover, schedule.paidInterest || 0);

        if (recoverPrincipal <= 0 && recoverInterest <= 0) continue;

        const newPaidPrincipal = (schedule.paidPrincipal || 0) - recoverPrincipal;
        const newPaidInterest = (schedule.paidInterest || 0) - recoverInterest;

        await tx.debtSchedule.update({
          where: { id: schedule.id },
          data: {
            paidPrincipal: newPaidPrincipal,
            paidInterest: newPaidInterest,
            status: newPaidPrincipal <= 0 && newPaidInterest <= 0 ? 'PENDING' : 'PARTIAL',
          },
        });
        principalToRecover -= recoverPrincipal;
        interestToRecover -= recoverInterest;
      }

      // 2. Tạo giao dịch đảo ngược
      const reversalTx = await tx.debtTransaction.create({
        data: {
          debtRecordId: debt.id,
          type: 'REVERSAL',
          amount: -originalTx.amount,
          principalPart: -originalTx.principalPart,
          interestPart: -(originalTx.interestPart || 0),
          penaltyPart: -originalTx.penaltyPart,
          paidAt: new Date(),
          notes: `Đảo ngược giao dịch ${originalTx.id}. Lý do: ${reason}`,
          reversesTransactionId: originalTx.id,
          balanceSnapshot: debt.outstanding + originalTx.principalPart,
        },
      });

      // 3. Khôi phục dư nợ trên hồ sơ gốc
      const restoredOutstanding = debt.outstanding + originalTx.principalPart;
      await tx.debtRecord.update({
        where: { id: debt.id },
        data: {
          outstanding: restoredOutstanding,
          status: restoredOutstanding > 0 ? (debt.status === 'PAID' ? 'PARTIAL' : debt.status) : debt.status,
        },
      });

      // 4. Thông báo
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
