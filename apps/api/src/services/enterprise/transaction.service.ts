import enterpriseDb from '../../prisma/enterprise.client';

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
          balanceSnapshot: debt.outstanding, // Penalty không làm giảm gốc
        },
      });
    });
  }

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
          transactions: true, // Lấy để tính penalty unpaid
        },
      });

      if (!debt) throw new Error('Không tìm thấy khoản nợ');
      if (!['ACTIVE', 'PARTIAL', 'OVERDUE', 'DISPUTED'].includes(debt.status)) {
        throw new Error(`Không thể thanh toán cho khoản nợ ở trạng thái ${debt.status}`);
      }

      if (data.amount <= 0) throw new Error('Số tiền thanh toán phải lớn hơn 0');

      // 2. Tính toán Penalty và Interest chưa trả (Waterfall foundation)
      // Tổng penalty tích lũy - Tổng penalty đã trả
      const totalPenaltyAccrued = debt.transactions
        .filter((t: any) => t.type === 'PENALTY')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const totalPenaltyPaid = debt.transactions
        .filter((t: any) => t.type === 'PAYMENT' || t.type === 'REVERSAL')
        .reduce((sum: number, t: any) => sum + (t.penaltyPart || 0), 0);

      const unpaidPenalty = Math.max(0, totalPenaltyAccrued - totalPenaltyPaid);

      // (Tương tự cho Interest nếu có logic tích lũy lãi riêng)
      const unpaidInterest = 0;

      let remainingAmount = data.amount;
      let penaltyToPay = 0;
      let interestToPay = 0;
      let principalToPay = 0;

      // ── WATERFALL STEP 1: Penalty ───────────────────────────────────
      penaltyToPay = Math.min(remainingAmount, unpaidPenalty);
      remainingAmount -= penaltyToPay;

      // ── WATERFALL STEP 2: Interest ──────────────────────────────────
      interestToPay = Math.min(remainingAmount, unpaidInterest);
      remainingAmount -= interestToPay;

      // ── WATERFALL STEP 3: Principal ─────────────────────────────────
      const currentOutstanding = debt.outstanding;
      principalToPay = Math.min(remainingAmount, currentOutstanding);
      remainingAmount -= principalToPay;

      if (remainingAmount > 0.01) {
        // Cho phép sai số nhỏ làm tròn
        throw new Error(
          `Số tiền thanh toán vượt quá tổng nghĩa vụ (Phạt: ${unpaidPenalty}, Lãi: ${unpaidInterest}, Gốc: ${currentOutstanding})`,
        );
      }

      // 3. Cập nhật các kỳ thanh toán (Schedules) - Chỉ áp dụng cho phần GỐC
      if (debt.schedules.length > 0 && principalToPay > 0) {
        let amountToDistribute = principalToPay;
        for (const schedule of debt.schedules) {
          if (amountToDistribute <= 0) break;
          if (schedule.status === 'PAID') continue;

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
      const newOutstanding = Math.max(0, currentOutstanding - principalToPay);

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

      // 5. Cập nhật Outstanding trên DebtRecord
      await tx.debtRecord.update({
        where: { id: debt.id },
        data: { outstanding: newOutstanding },
      });

      // 6. Chuyển trạng thái khoản nợ
      let newStatus = debt.status;
      if (newOutstanding <= 0) {
        // Kiểm tra xem còn penalty/interest chưa trả không?
        // Nếu còn thì vẫn là PARTIAL hoặc OVERDUE (tùy nghiệp vụ)
        // Ở đây giả định nếu hết gốc thì coi như PAID để giải phóng hạn mức
        newStatus = 'PAID';
      } else {
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
            reason: 'Tự động cập nhật sau thanh toán (Waterfall applied)',
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
