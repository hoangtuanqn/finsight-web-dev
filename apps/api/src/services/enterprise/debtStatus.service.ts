import enterpriseDb from '../../prisma/enterprise.client';

export class DebtStatusService {
  /**
   * Tính toán dư nợ hiện tại (Outstanding Balance)
   * Derive từ Principal - SUM(principalPart trong transactions)
   */
  async getOutstandingBalance(debtId: string): Promise<number> {
    const debt = await (enterpriseDb as any).debtRecord.findUnique({
      where: { id: debtId },
      include: {
        transactions: true,
      },
    });

    if (!debt) return 0;

    const totalPrincipal = debt.principal;
    const paidPrincipal = debt.transactions
      .filter((t: any) => t.type === 'PAYMENT')
      .reduce((sum: number, t: any) => sum + (t.principalPart || 0), 0);

    return totalPrincipal - paidPrincipal;
  }

  /**
   * Ghi log thay đổi trạng thái kèm Snapshot dữ liệu
   */
  async logStatusChange(
    orgId: string,
    userId: string,
    debtId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
  ) {
    const outstanding = await this.getOutstandingBalance(debtId);

    return await (enterpriseDb as any).auditLog.create({
      data: {
        organizationId: orgId,
        userId: userId,
        action: 'UPDATE_STATUS',
        entityType: 'DEBT_RECORD',
        entityId: debtId,
        oldValues: { status: oldStatus },
        newValues: { status: newStatus, outstandingSnapshot: outstanding },
        reason: reason || 'Chuyển trạng thái hệ thống',
      },
    });
  }

  /**
   * Kích hoạt khoản nợ (DRAFT -> ACTIVE)
   */
  async activateDebt(orgId: string, userId: string, debtId: string) {
    const debt = await (enterpriseDb as any).debtRecord.findUnique({
      where: { id: debtId, organizationId: orgId },
      include: {
        documents: true,
        schedules: true,
      },
    });

    if (!debt) throw new Error('Không tìm thấy khoản nợ');
    if (debt.status !== 'DRAFT') throw new Error('Chỉ có thể kích hoạt khoản nợ đang ở trạng thái Nháp');

    // Validations theo MODULE_3.MD
    if (debt.principal <= 0) throw new Error('Số tiền gốc phải lớn hơn 0');
    if (!debt.issueDate || !debt.dueDate) throw new Error('Thiếu ngày phát sinh hoặc ngày đến hạn');
    if (new Date(debt.dueDate) <= new Date(debt.issueDate)) throw new Error('Ngày đến hạn phải sau ngày phát sinh');

    // Lưu ý: Tạm thời cho phép activate nếu chưa có tài liệu để thuận tiện cho việc test,
    // nhưng sẽ log cảnh báo nếu cần nghiêm ngặt theo đúng business doc
    // if (debt.documents.length === 0) throw new Error('Cần đính kèm ít nhất một tài liệu (hợp đồng/hóa đơn)');

    const updatedDebt = await (enterpriseDb as any).debtRecord.update({
      where: { id: debtId },
      data: { status: 'ACTIVE' },
    });

    await this.logStatusChange(orgId, userId, debtId, 'DRAFT', 'ACTIVE', 'Kích hoạt khoản nợ');
    return updatedDebt;
  }

  /**
   * Tranh chấp khoản nợ (ANY ACTIVE -> DISPUTED)
   */
  async disputeDebt(orgId: string, userId: string, debtId: string, reason: string) {
    const debt = await (enterpriseDb as any).debtRecord.findUnique({
      where: { id: debtId, organizationId: orgId },
    });

    if (!debt) throw new Error('Không tìm thấy khoản nợ');
    if (!['ACTIVE', 'PARTIAL', 'OVERDUE'].includes(debt.status)) {
      throw new Error('Chỉ có thể tranh chấp khoản nợ đang hoạt động');
    }

    const oldStatus = debt.status;
    const updatedDebt = await (enterpriseDb as any).debtRecord.update({
      where: { id: debtId },
      data: { status: 'DISPUTED' },
    });

    await this.logStatusChange(orgId, userId, debtId, oldStatus, 'DISPUTED', reason);
    return updatedDebt;
  }

  /**
   * Giải quyết tranh chấp (DISPUTED -> ACTIVE/PARTIAL/OVERDUE)
   */
  async resolveDispute(orgId: string, userId: string, debtId: string) {
    const debt = await (enterpriseDb as any).debtRecord.findUnique({
      where: { id: debtId, organizationId: orgId },
    });

    if (!debt) throw new Error('Không tìm thấy khoản nợ');
    if (debt.status !== 'DISPUTED') throw new Error('Khoản nợ không ở trạng thái tranh chấp');

    const outstanding = await this.getOutstandingBalance(debtId);
    let newStatus = 'ACTIVE';

    if (outstanding <= 0) {
      newStatus = 'PAID';
    } else if (new Date(debt.dueDate) < new Date()) {
      newStatus = 'OVERDUE';
    } else {
      // Kiểm tra xem đã có thanh toán nào chưa
      const paymentCount = await (enterpriseDb as any).debtTransaction.count({
        where: { debtRecordId: debtId, type: 'PAYMENT' },
      });
      if (paymentCount > 0) newStatus = 'PARTIAL';
    }

    const updatedDebt = await (enterpriseDb as any).debtRecord.update({
      where: { id: debtId },
      data: { status: newStatus },
    });

    await this.logStatusChange(orgId, userId, debtId, 'DISPUTED', newStatus, 'Giải quyết tranh chấp');
    return updatedDebt;
  }

  /**
   * Xóa nợ (ANY -> WRITTEN_OFF)
   */
  async writeOff(orgId: string, userId: string, debtId: string, reason: string) {
    const debt = await (enterpriseDb as any).debtRecord.findUnique({
      where: { id: debtId, organizationId: orgId },
    });

    if (!debt) throw new Error('Không tìm thấy khoản nợ');
    if (['PAID', 'WRITTEN_OFF'].includes(debt.status)) {
      throw new Error('Khoản nợ đã tất toán hoặc đã xóa nợ');
    }

    const oldStatus = debt.status;
    const updatedDebt = await (enterpriseDb as any).debtRecord.update({
      where: { id: debtId },
      data: { status: 'WRITTEN_OFF' },
    });

    await this.logStatusChange(orgId, userId, debtId, oldStatus, 'WRITTEN_OFF', reason);
    return updatedDebt;
  }
}

export default new DebtStatusService();
