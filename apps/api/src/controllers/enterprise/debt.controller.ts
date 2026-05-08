import { generateSchedule, type DebtScheduleInput } from '@repo/financial-core';
import { Request, Response } from 'express';
import enterpriseDb from '../../prisma/enterprise.client.js';
import * as debtService from '../../services/enterprise/debt.service.js';
import * as debtStatusService from '../../services/enterprise/debtStatus.service.js';
import transactionService from '../../services/enterprise/transaction.service.js';
import { logAudit } from '../../utils/audit.js';

export const createDebt = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;
    const data = {
      ...req.body,
      organizationId: orgId,
      issueDate: new Date(req.body.issueDate),
      interestRates:
        req.body.interestRates?.map((r: any) => ({
          rate: Number(r.rate),
          effectiveDate: new Date(r.effectiveDate),
          rateType: r.rateType || 'FIXED',
          referenceBase: r.referenceBase || null,
          spread: r.spread != null ? Number(r.spread) : null,
        })) || [],
    };

    if (!data.principal || data.principal <= 0) {
      throw new Error('Số tiền gốc phải lớn hơn 0');
    }

    if (!data.termMonths || data.termMonths <= 0) {
      throw new Error('Thời hạn (số tháng) phải lớn hơn 0 để tính ngày đến hạn hợp lệ');
    }

    if (data.interestMethod === 'NONE' && data.interestRates.some((r: any) => r.rate > 0)) {
      throw new Error('Nếu có nhập lãi suất, phương thức tính lãi không được là "Không tính lãi"');
    }

    const debt = await debtService.createDebtRecord(data);

    await logAudit({
      organizationId: orgId,
      userId,
      action: 'CREATE',
      entityType: 'DEBT_RECORD',
      entityId: debt.id,
      newValues: debt,
    });

    res.status(201).json({ success: true, data: debt });
  } catch (error: any) {
    console.error('Create Debt Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getDebts = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const { type, origin, status, partyId } = req.query;

    console.log(`[DebtController] Fetching debts for orgId: ${orgId}`, { type, origin, status, partyId });

    if (!orgId) {
      console.warn('[DebtController] No organizationId found in request');
      return res.status(403).json({ success: false, error: 'Quyền truy cập không hợp lệ. Vui lòng đăng nhập lại.' });
    }

    const debts = await debtService.getDebtRecords(orgId, {
      type: type as string,
      origin: origin as string,
      status: status as string,
      partyId: partyId as string,
    });

    res.status(200).json({ success: true, data: debts });
  } catch (error: any) {
    console.error('[DebtController] Error in getDebts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDebt = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const id = req.params.id as string;

    const debt = await debtService.getDebtDetail(id as string, orgId as string);

    if (!debt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy khoản nợ' });
      return;
    }

    res.status(200).json({ success: true, data: debt });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const activateDebt = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;

    const debt = await (debtStatusService as any).default.activateDebt(orgId, userId, id);
    res.status(200).json({ success: true, data: debt });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const disputeDebt = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;

    if (!reason) throw new Error('Cần cung cấp lý do tranh chấp');

    const debt = await (debtStatusService as any).default.disputeDebt(orgId, userId, id, reason);
    res.status(200).json({ success: true, data: debt });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;

    const debt = await (debtStatusService as any).default.resolveDispute(orgId, userId, id);
    res.status(200).json({ success: true, data: debt });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const writeOffDebt = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;

    if (!reason) throw new Error('Cần cung cấp lý do xóa nợ');

    const debt = await (debtStatusService as any).default.writeOff(orgId, userId, id, reason);
    res.status(200).json({ success: true, data: debt });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const getDebtAuditLogs = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const orgId = (req as any).organizationId;

    const logs = await (enterpriseDb as any).auditLog.findMany({
      where: {
        organizationId: orgId,
        entityType: 'DEBT_RECORD',
        entityId: id,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const recordPayment = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;

    const transaction = await transactionService.createPayment({
      ...req.body,
      debtId: id,
      orgId,
      userId,
      paidAt: new Date(req.body.paidAt || new Date()),
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};

export const updateDebt = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;
    const id = req.params.id as string;

    const oldDebt = await (enterpriseDb as any).debtRecord.findFirst({
      where: { id, organizationId: orgId },
      include: { interestRates: { orderBy: { effectiveDate: 'asc' } } },
    });

    if (!oldDebt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy khoản nợ' });
      return;
    }

    const {
      notes,
      penaltyRate,
      gracePeriodDays,
      personInChargeId,
      internalCode,
      guarantorId,
      type,
      origin,
      partyId,
      principal,
      interestMethod,
      termMonths,
      issueDate,
      interestRates,
    } = req.body;

    const updateData: any = {};
    if (notes !== undefined) updateData.notes = notes;
    if (penaltyRate !== undefined) updateData.penaltyRate = Number(penaltyRate);
    if (gracePeriodDays !== undefined) updateData.gracePeriodDays = Number(gracePeriodDays);
    if (personInChargeId !== undefined) updateData.personInChargeId = personInChargeId || null;
    if (internalCode !== undefined) updateData.internalCode = internalCode;
    if (guarantorId !== undefined) updateData.guarantorId = guarantorId || null;
    if (type !== undefined) updateData.type = type;
    if (origin !== undefined) updateData.origin = origin;
    if (partyId !== undefined) updateData.partyId = partyId;

    if (principal !== undefined) {
      updateData.principal = Number(principal);
      // Only update outstanding if it was equal to principal (no payments yet) or if explicitly desired
      // For simplicity, let's keep it flexible as requested
      if (oldDebt.status === 'DRAFT') updateData.outstanding = Number(principal);
    }
    if (interestMethod !== undefined) updateData.interestMethod = interestMethod;
    const baseIssueDate = issueDate ? new Date(issueDate) : new Date(oldDebt.issueDate);
    if (termMonths !== undefined) {
      updateData.dueDate = new Date(new Date(baseIssueDate).setMonth(baseIssueDate.getMonth() + Number(termMonths)));
    }
    if (issueDate !== undefined) updateData.issueDate = new Date(issueDate);

    await (enterpriseDb as any).$transaction(async (tx: any) => {
      // Update main record
      await tx.debtRecord.update({ where: { id }, data: updateData });

      // Replace interest rates if provided
      if (interestRates !== undefined) {
        await tx.debtInterestRate.deleteMany({ where: { debtRecordId: id } });
        await tx.debtInterestRate.createMany({
          data: interestRates.map((r: any) => ({
            debtRecordId: id,
            rate: Number(r.rate),
            effectiveDate: new Date(r.effectiveDate),
            rateType: r.rateType || 'FIXED',
            referenceBase: r.referenceBase || null,
            spread: r.spread != null ? Number(r.spread) : null,
          })),
        });

        // Rebuild schedule
        const finalPrincipal = principal !== undefined ? Number(principal) : oldDebt.principal;
        const finalMethod = interestMethod || oldDebt.interestMethod;
        const finalTermMonths =
          termMonths !== undefined
            ? Number(termMonths)
            : Math.round(
                (new Date(oldDebt.dueDate).getTime() - new Date(oldDebt.issueDate).getTime()) /
                  (1000 * 60 * 60 * 24 * 30),
              );
        const finalIssueDate = issueDate ? new Date(issueDate) : new Date(oldDebt.issueDate);

        const scheduleInput: DebtScheduleInput = {
          principal: finalPrincipal,
          issueDate: finalIssueDate,
          termMonths: finalTermMonths,
          interestMethod: finalMethod,
          interestRates: interestRates.map((r: any) => ({
            rate: Number(r.rate),
            effectiveDate: new Date(r.effectiveDate),
          })),
        };
        const periods = generateSchedule(scheduleInput);
        await tx.debtSchedule.deleteMany({ where: { debtRecordId: id } });
        await tx.debtSchedule.createMany({
          data: periods.map((p) => ({
            debtRecordId: id,
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
      }
    });

    const updatedDebt = await (enterpriseDb as any).debtRecord.findFirst({
      where: { id },
      include: {
        interestRates: { orderBy: { effectiveDate: 'asc' } },
        schedules: { orderBy: { period: 'asc' } },
        party: { select: { name: true } },
      },
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: 'UPDATE',
      entityType: 'DEBT_RECORD',
      entityId: id as string,
      oldValues: oldDebt,
      newValues: updatedDebt,
    });

    res.status(200).json({ success: true, data: updatedDebt });
  } catch (error: any) {
    console.error('Update Debt Error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

export const reverseTransaction = async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;

    if (!reason) throw new Error('Cần cung cấp lý do đảo ngược giao dịch');

    const transaction = await transactionService.reverseTransaction(
      orgId as string,
      userId as string,
      transactionId as string,
      reason,
    );
    res.status(200).json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
};
