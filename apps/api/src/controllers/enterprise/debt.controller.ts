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
        })) || [],
    };

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
    const { id } = req.params;

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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
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
    const { id } = req.params;
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
