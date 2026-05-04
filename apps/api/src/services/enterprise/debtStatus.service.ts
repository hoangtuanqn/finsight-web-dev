import enterpriseDb from '../../prisma/enterprise.client';
import { NotificationService } from './notification.service';

export class DebtStatusService {
  async getOutstandingBalance(debtId: string, tx?: any): Promise<number> {
    const db = tx || enterpriseDb;
    const debt = await (db as any).debtRecord.findUnique({
      where: { id: debtId },
      include: { transactions: true },
    });
    if (!debt) return 0;
    const paidPrincipal = debt.transactions
      .filter((t: any) => t.type === 'PAYMENT' || t.type === 'REVERSAL')
      .reduce((sum: number, t: any) => sum + (t.principalPart || 0), 0);
    return debt.principal - paidPrincipal;
  }

  async logStatusChange(
    orgId: string,
    userId: string,
    debtId: string,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    tx?: any,
  ) {
    const db = tx || enterpriseDb;
    const outstanding = await this.getOutstandingBalance(debtId, tx);
    return await (db as any).auditLog.create({
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

  async activateDebt(orgId: string, userId: string, debtId: string) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const debt = await tx.debtRecord.findUnique({ where: { id: debtId, organizationId: orgId } });
      if (!debt || debt.status !== 'DRAFT') throw new Error('Không hợp lệ');
      const updated = await tx.debtRecord.update({ where: { id: debtId }, data: { status: 'ACTIVE' } });
      await this.logStatusChange(orgId, userId, debtId, 'DRAFT', 'ACTIVE', 'Kích hoạt', tx);
      return updated;
    });
  }

  async disputeDebt(orgId: string, userId: string, debtId: string, reason: string) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const debt = await tx.debtRecord.findUnique({
        where: { id: debtId, organizationId: orgId },
        include: { party: { select: { name: true, personInChargeId: true } } },
      });
      if (!debt) throw new Error('Không tìm thấy');
      const oldStatus = debt.status;
      const updated = await tx.debtRecord.update({ where: { id: debtId }, data: { status: 'DISPUTED' } });
      await this.logStatusChange(orgId, userId, debtId, oldStatus, 'DISPUTED', reason, tx);

      const recipientId = debt.personInChargeId || debt.party?.personInChargeId;
      if (recipientId) {
        await NotificationService.createNotification(
          {
            organizationId: orgId,
            targetUserId: recipientId,
            type: 'EVENT_BASED',
            category: 'ESCALATION',
            priority: 'IMPORTANT',
            title: `⚖️ Khoản nợ bị TRANH CHẤP: ${debt.party?.name}`,
            content: `Khoản nợ ${debt.internalCode} đã được chuyển sang trạng thái Tranh chấp. Lý do: ${reason}.`,
            debtRecordId: debtId,
          },
          tx,
        );
      }
      return updated;
    });
  }

  async resolveDispute(orgId: string, userId: string, debtId: string) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const debt = await tx.debtRecord.findUnique({
        where: { id: debtId, organizationId: orgId },
        include: { party: { select: { name: true, personInChargeId: true } } },
      });
      if (!debt || debt.status !== 'DISPUTED') throw new Error('Không hợp lệ');

      const outstanding = await this.getOutstandingBalance(debtId, tx);
      const newStatus = outstanding <= 0 ? 'PAID' : new Date(debt.dueDate) < new Date() ? 'OVERDUE' : 'PARTIAL';

      const updated = await tx.debtRecord.update({ where: { id: debtId }, data: { status: newStatus } });
      await this.logStatusChange(orgId, userId, debtId, 'DISPUTED', newStatus, 'Giải quyết tranh chấp', tx);

      const recipientId = debt.personInChargeId || debt.party?.personInChargeId;
      if (recipientId) {
        await NotificationService.createNotification(
          {
            organizationId: orgId,
            targetUserId: recipientId,
            type: 'EVENT_BASED',
            category: 'PAYMENT',
            priority: 'IMPORTANT',
            title: `✅ Tranh chấp đã GIẢI QUYẾT: ${debt.party?.name}`,
            content: `Khoản nợ ${debt.internalCode} đã được giải quyết tranh chấp và chuyển về trạng thái ${newStatus}.`,
            debtRecordId: debtId,
          },
          tx,
        );
      }
      return updated;
    });
  }

  async writeOff(orgId: string, userId: string, debtId: string, reason: string) {
    return await (enterpriseDb as any).$transaction(async (tx: any) => {
      const debt = await tx.debtRecord.findUnique({
        where: { id: debtId, organizationId: orgId },
        include: { party: { select: { name: true, personInChargeId: true } } },
      });
      if (!debt) throw new Error('Không tìm thấy');
      const oldStatus = debt.status;
      const updated = await tx.debtRecord.update({ where: { id: debtId }, data: { status: 'WRITTEN_OFF' } });
      await this.logStatusChange(orgId, userId, debtId, oldStatus, 'WRITTEN_OFF', reason, tx);

      const recipientId = debt.personInChargeId || debt.party?.personInChargeId;
      if (recipientId) {
        await NotificationService.createNotification(
          {
            organizationId: orgId,
            targetUserId: recipientId,
            type: 'EVENT_BASED',
            category: 'ESCALATION',
            priority: 'URGENT',
            title: `🗑️ XÓA NỢ: ${debt.party?.name}`,
            content: `Khoản nợ ${debt.internalCode} trị giá ${debt.outstanding.toLocaleString()}đ đã được Xóa nợ (Write-off). Lý do: ${reason}.`,
            debtRecordId: debtId,
          },
          tx,
        );
      }
      return updated;
    });
  }
}

export default new DebtStatusService();
