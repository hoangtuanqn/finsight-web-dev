import { Request, Response } from 'express';
import * as debtService from '../../services/enterprise/debt.service';
import { logAudit } from '../../utils/audit';

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
