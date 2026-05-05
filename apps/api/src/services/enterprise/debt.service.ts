import { type DebtScheduleInput, generateSchedule } from '@repo/financial-core';
import enterpriseDb from '../../prisma/enterprise.client';
import { NotificationService } from './notification.service';

export const createDebtRecord = async (data: {
  organizationId: string;
  partyId: string;
  guarantorId?: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  origin: 'TRADE' | 'FINANCIAL' | 'TAX' | 'BOND' | 'INTERNAL';
  principal: number;
  interestMethod: 'REDUCING_BALANCE' | 'EMI' | 'BULLET' | 'NONE';
  issueDate: Date;
  termMonths: number;
  interestRates: { rate: number; effectiveDate: Date }[];
  internalCode?: string;
  notes?: string;
  personInChargeId?: string;
  penaltyRate?: number;
  gracePeriodDays?: number;
}) => {
  return await (enterpriseDb as any).$transaction(async (tx: any) => {
    // 1. Credit Limit Validation for RECEIVABLE
    if (data.type === 'RECEIVABLE') {
      const party = await tx.party.findUnique({
        where: { id: data.partyId },
        select: { creditLimit: true, name: true },
      });

      if (party) {
        // Calculate current outstanding (Total originalAmount - Total Principal paid)
        const debts = await tx.debtRecord.findMany({
          where: { partyId: data.partyId, type: 'RECEIVABLE', status: { notIn: ['PAID', 'WRITTEN_OFF'] } },
          include: { transactions: { where: { type: 'PAYMENT' } } },
        });

        let currentOutstanding = 0;
        for (const d of debts) {
          const paidPrincipal = d.transactions.reduce((sum: number, t: any) => sum + t.principalPart, 0);
          currentOutstanding += d.principal - paidPrincipal;
        }

        if (currentOutstanding + data.principal > party.creditLimit) {
          throw new Error(
            `Vượt hạn mức tín dụng của đối tác ${party.name}. (Hiện tại: ${currentOutstanding.toLocaleString()}, Hạn mức: ${party.creditLimit.toLocaleString()})`,
          );
        }
      }
    }

    // 2. Create Debt Record
    const debt = await tx.debtRecord.create({
      data: {
        organizationId: data.organizationId,
        partyId: data.partyId,
        guarantorId: data.guarantorId || null,
        type: data.type,
        origin: data.origin,
        principal: data.principal,
        outstanding: data.principal,
        interestMethod: data.interestMethod,
        issueDate: data.issueDate,
        dueDate: new Date(new Date(data.issueDate).setMonth(data.issueDate.getMonth() + data.termMonths)),
        internalCode: data.internalCode || null,
        notes: data.notes || null,
        status: 'DRAFT',
        personInChargeId: data.personInChargeId || null,
        penaltyRate: data.penaltyRate || 0,
        gracePeriodDays: data.gracePeriodDays || 0,
        interestRates: {
          create: data.interestRates.map((r) => ({
            rate: r.rate,
            effectiveDate: r.effectiveDate,
          })),
        },
      },
      include: {
        interestRates: true,
        party: { select: { name: true, personInChargeId: true } },
      },
    });

    // 3. Generate and Save Schedules
    const scheduleInput: DebtScheduleInput = {
      principal: data.principal,
      issueDate: data.issueDate,
      termMonths: data.termMonths,
      interestMethod: data.interestMethod,
      interestRates: data.interestRates.map((r) => ({ rate: r.rate, effectiveDate: r.effectiveDate })),
    };

    const generatedPeriods = generateSchedule(scheduleInput);

    await tx.debtSchedule.createMany({
      data: generatedPeriods.map((p) => ({
        debtRecordId: debt.id,
        period: p.period,
        dueDate: p.dueDate,
        principalAmount: p.principalAmount,
        interestAmount: p.interestAmount,
        totalAmount: p.totalAmount,
        remainingPrincipal: p.remainingPrincipal,
        status: 'PENDING',
        triggerType: 'DATE',
        isActivated: true,
      })),
    });

    // 4. Gửi thông báo sự kiện
    const recipientId = debt.personInChargeId || debt.party?.personInChargeId;
    if (recipientId) {
      await NotificationService.createNotification(
        {
          organizationId: debt.organizationId,
          targetUserId: recipientId,
          type: 'EVENT_BASED',
          category: 'NEW_DEBT',
          priority: 'IMPORTANT',
          title: `📄 Khoản nợ mới được kích hoạt: ${debt.party?.name}`,
          content: `Khoản nợ ${debt.internalCode} trị giá ${debt.principal.toLocaleString()}đ đã được tạo và kích hoạt. Ngày đến hạn cuối cùng: ${debt.dueDate.toLocaleDateString()}.`,
          debtRecordId: debt.id,
        },
        tx,
      );
    }

    return debt;
  });
};

export const getDebtRecords = async (
  orgId: string,
  filters: {
    type?: string;
    origin?: string;
    status?: string;
    partyId?: string;
  },
) => {
  const where: any = { organizationId: orgId };
  if (filters.type) where.type = filters.type;
  if (filters.origin) where.origin = filters.origin;
  if (filters.status) where.status = filters.status;
  if (filters.partyId) where.partyId = filters.partyId;

  return await (enterpriseDb as any).debtRecord.findMany({
    where,
    include: {
      party: { select: { name: true, internalCode: true } },
      _count: { select: { schedules: true, transactions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const getDebtDetail = async (id: string, orgId: string) => {
  const debt = await (enterpriseDb as any).debtRecord.findFirst({
    where: { id, organizationId: orgId },
    include: {
      party: true,
      guarantor: true,
      interestRates: { orderBy: { effectiveDate: 'asc' } },
      schedules: { orderBy: { period: 'asc' } },
      transactions: { orderBy: { paidAt: 'desc' } },
      documents: true,
    },
  });

  if (!debt) return null;

  // Calculate real-time outstanding
  const paymentRelated = debt.transactions.filter((t: any) => t.type === 'PAYMENT' || t.type === 'REVERSAL');

  const paidPrincipal = paymentRelated.reduce((sum: number, t: any) => sum + t.principalPart, 0);

  const totalPenaltyAccrued = debt.transactions
    .filter((t: any) => t.type === 'PENALTY')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalPenaltyPaid = paymentRelated.reduce((sum: number, t: any) => sum + (t.penaltyPart || 0), 0);

  return {
    ...debt,
    outstanding: Math.max(0, debt.principal - paidPrincipal),
    totalPenaltyAccrued,
    totalPenaltyPaid,
    unpaidPenalty: Math.max(0, totalPenaltyAccrued - totalPenaltyPaid),
  };
};
