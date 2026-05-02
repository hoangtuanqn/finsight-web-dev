import enterpriseDb from '../prisma/enterprise.client';

export const logAudit = async ({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  oldValues = null,
  newValues = null,
  reason = null,
}: {
  organizationId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  reason?: string | null;
}) => {
  try {
    await (enterpriseDb as any).auditLog.create({
      data: {
        organizationId,
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        reason,
      },
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};
