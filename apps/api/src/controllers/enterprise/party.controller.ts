import { Request, Response } from 'express';
import enterpriseDb from '../../prisma/enterprise.client';
import { logAudit } from '../../utils/audit';

/**
 * Helper to generate internal code based on role
 */
const generateInternalCode = async (organizationId: string, tags: string[]) => {
  let prefix = 'DT'; // Default: Đối tác
  if (tags.includes('CUSTOMER')) prefix = 'KH';
  if (tags.includes('SUPPLIER')) prefix = 'NCC';
  if (tags.includes('BANK')) prefix = 'NH';
  if (tags.includes('STATE')) prefix = 'CQ';
  if (tags.includes('INTERNAL')) prefix = 'NB';

  const count = await (enterpriseDb as any).party.count({
    where: { organizationId, internalCode: { startsWith: prefix } },
  });

  const nextNumber = (count + 1).toString().padStart(3, '0');
  return `${prefix}-${nextNumber}`;
};

export const createParty = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;
    const {
      taxCode,
      name,
      shortName,
      internalCode,
      typeTags,
      creditLimit,
      isRelatedParty,
      personInChargeId,
      contacts,
      bankAccounts,
    } = req.body;

    // 1. Validation: Tax Code uniqueness within organization
    if (taxCode) {
      const existing = await (enterpriseDb as any).party.findFirst({
        where: { organizationId: orgId, taxCode },
      });
      if (existing) {
        res.status(400).json({ success: false, error: 'Mã số thuế đã tồn tại trong tổ chức này' });
        return;
      }
    }

    // 2. Auto-generate internal code if not provided
    const finalInternalCode = internalCode || (await generateInternalCode(orgId, typeTags || []));

    // 3. Create Party with relations
    const party = await (enterpriseDb as any).party.create({
      data: {
        organizationId: orgId,
        taxCode,
        name,
        shortName,
        internalCode: finalInternalCode,
        typeTags: typeTags || [],
        creditLimit: creditLimit || 0,
        isRelatedParty: !!isRelatedParty,
        personInChargeId,
        status: 'ACTIVE',
        contacts: {
          create: contacts?.map((c: any) => ({
            name: c.name,
            position: c.position,
            email: c.email,
            phone: c.phone,
            isPrimary: !!c.isPrimary,
          })),
        },
        bankAccounts: {
          create: bankAccounts?.map((b: any) => ({
            bankName: b.bankName,
            accountNumber: b.accountNumber,
            accountHolder: b.accountHolder,
            branch: b.branch,
          })),
        },
      },
      include: {
        contacts: true,
        bankAccounts: true,
      },
    });

    // 4. Audit Log
    await logAudit({
      organizationId: orgId,
      userId,
      action: 'CREATE',
      entityType: 'PARTY',
      entityId: party.id,
      newValues: party,
    });

    res.status(201).json({ success: true, data: party });
  } catch (error: any) {
    console.error('Create Party Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getParties = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const { search, type, status, limit = 50, offset = 0 } = req.query;

    const where: any = { organizationId: orgId };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { taxCode: { contains: search as string, mode: 'insensitive' } },
        { internalCode: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.typeTags = { has: type as string };
    }

    if (status) {
      where.status = status as string;
    }

    const [parties, total] = await Promise.all([
      (enterpriseDb as any).party.findMany({
        where,
        include: {
          personInCharge: {
            select: { id: true, fullName: true },
          },
          _count: {
            select: { contacts: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      (enterpriseDb as any).party.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: parties,
      pagination: { total, limit: Number(limit), offset: Number(offset) },
    });
  } catch (error: any) {
    console.error('Get Parties Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getParty = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const { id } = req.params;

    const party = await (enterpriseDb as any).party.findFirst({
      where: { id, organizationId: orgId },
      include: {
        contacts: true,
        bankAccounts: true,
        personInCharge: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!party) {
      res.status(404).json({ success: false, error: 'Không tìm thấy đối tác' });
      return;
    }

    res.status(200).json({ success: true, data: party });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateParty = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { contacts, bankAccounts, ...updateData } = req.body;

    // 1. Get old values for audit log
    const oldParty = await (enterpriseDb as any).party.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!oldParty) {
      res.status(404).json({ success: false, error: 'Không tìm thấy đối tác' });
      return;
    }

    // 2. Perform Update
    const party = await (enterpriseDb as any).party.update({
      where: { id },
      data: {
        ...updateData,
        ...(contacts !== undefined && {
          contacts: {
            deleteMany: {},
            create: contacts.map((c: any) => ({
              name: c.name,
              position: c.position,
              email: c.email,
              phone: c.phone,
              isPrimary: !!c.isPrimary,
            })),
          },
        }),
        ...(bankAccounts !== undefined && {
          bankAccounts: {
            deleteMany: {},
            create: bankAccounts.map((b: any) => ({
              bankName: b.bankName,
              accountNumber: b.accountNumber,
              accountHolder: b.accountHolder,
              branch: b.branch,
            })),
          },
        }),
      },
      include: {
        contacts: true,
        bankAccounts: true,
        personInCharge: { select: { id: true, fullName: true, email: true } },
      },
    });

    // 3. Audit Log
    await logAudit({
      organizationId: orgId,
      userId,
      action: 'UPDATE',
      entityType: 'PARTY',
      entityId: id,
      oldValues: oldParty,
      newValues: party,
    });

    res.status(200).json({ success: true, data: party });
  } catch (error: any) {
    console.error('Update Party Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleStatus = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const userId = (req as any).userId;
    const { id } = req.params;
    const { status, reason } = req.body; // reason is mandatory for Blacklist

    if (!['ACTIVE', 'INACTIVE', 'BLACKLIST'].includes(status)) {
      res.status(400).json({ success: false, error: 'Trạng thái không hợp lệ' });
      return;
    }

    const oldParty = await (enterpriseDb as any).party.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!oldParty) {
      res.status(404).json({ success: false, error: 'Không tìm thấy đối tác' });
      return;
    }

    const party = await (enterpriseDb as any).party.update({
      where: { id },
      data: { status },
    });

    await logAudit({
      organizationId: orgId,
      userId,
      action: 'TOGGLE_STATUS',
      entityType: 'PARTY',
      entityId: id,
      oldValues: { status: oldParty.status },
      newValues: { status },
      reason,
    });

    res.status(200).json({ success: true, data: party });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const { id } = req.params;

    const logs = await (enterpriseDb as any).auditLog.findMany({
      where: { organizationId: orgId, entityId: id },
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).organizationId;
    const users = await (enterpriseDb as any).user.findMany({
      where: { organizationId: orgId },
      select: { id: true, fullName: true, email: true, roleTitle: true },
      orderBy: { fullName: 'asc' },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
