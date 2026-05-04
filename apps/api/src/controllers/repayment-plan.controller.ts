import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';
import {
  resolveRepaymentExtraBudget,
  simulateCustomRepaymentWithExtraBudget,
  simulateRepaymentWithExtraBudget,
} from '../utils/calculations';

const DEFAULT_PLAN_NAME = 'Kế hoạch trả nợ riêng';
const MAX_CHART_MONTHS = 361;

function uniqueDebtIds(debtIds: unknown): string[] {
  if (!Array.isArray(debtIds)) return [];
  const seen = new Set<string>();
  const result: string[] = [];

  debtIds.forEach((id) => {
    const normalized = String(id || '').trim();
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

async function getOwnedActiveDebts(userId: string, debtIds: string[]) {
  if (debtIds.length === 0) return [];

  const debts = await (prisma as any).debt.findMany({
    where: {
      id: { in: debtIds },
      userId,
      status: 'ACTIVE',
    },
  });

  const orderMap = new Map(debtIds.map((id, index) => [id, index]));
  return debts.sort(
    (a: any, b: any) =>
      (orderMap.get(String(a.id)) ?? Number.MAX_SAFE_INTEGER) - (orderMap.get(String(b.id)) ?? Number.MAX_SAFE_INTEGER),
  );
}

function formatPlan(plan: any) {
  if (!plan) return null;
  const sortedItems = [...(plan.items || [])].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
  const selectedDebts = sortedItems
    .map((item: any) => item.debt)
    .filter((debt: any) => debt?.status === 'ACTIVE' && !debt?.deletedAt);

  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    strategy: plan.strategy,
    extraBudget: plan.extraBudget,
    isActive: plan.isActive,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    items: sortedItems,
    selectedDebts,
    summary: {
      debtCount: selectedDebts.length,
      totalBalance: selectedDebts.reduce((sum: number, debt: any) => sum + debt.balance, 0),
      totalMinPayment: selectedDebts.reduce((sum: number, debt: any) => sum + debt.minPayment, 0),
    },
  };
}

function formatSimulation(simulation: any) {
  if (!simulation) return null;

  return {
    months: simulation.months,
    initialBalance: simulation.initialBalance,
    minimumBudget: simulation.minimumBudget,
    extraBudgetUsed: simulation.extraBudgetUsed,
    totalMonthlyBudget: simulation.totalMonthlyBudget,
    totalInterest: simulation.totalInterest,
    isCompleted: simulation.isCompleted,
    termBreach: simulation.termBreach,
    warnings: simulation.warnings,
    isScheduleTruncated: simulation.schedule.length > MAX_CHART_MONTHS,
    schedule: simulation.schedule.slice(0, MAX_CHART_MONTHS),
  };
}

async function replacePlanItems(tx: any, planId: string, debtIds: string[]) {
  await tx.repaymentPlanItem.deleteMany({ where: { planId } });

  if (debtIds.length === 0) return;

  await tx.repaymentPlanItem.createMany({
    data: debtIds.map((debtId, index) => ({
      planId,
      debtId,
      sortOrder: index,
    })),
    skipDuplicates: true,
  });
}

export async function getRepaymentPlans(req: AuthenticatedRequest, res: Response) {
  try {
    const plans = await (prisma as any).repaymentPlan.findMany({
      where: { userId: req.userId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { debt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return success(res, { plans: plans.map(formatPlan) });
  } catch (err) {
    console.error('getRepaymentPlans error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createRepaymentPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId as string;
    const debtIds = uniqueDebtIds(req.body?.debtIds);
    const debts = await getOwnedActiveDebts(userId, debtIds);

    if (debtIds.length > 0 && debts.length !== debtIds.length) {
      return error(res, 'Một số khoản nợ không hợp lệ hoặc không thuộc tài khoản này.', 400);
    }

    const plan = await (prisma as any).$transaction(async (tx: any) => {
      const created = await tx.repaymentPlan.create({
        data: {
          userId,
          name: String(req.body?.name || DEFAULT_PLAN_NAME).trim(),
          description: req.body?.description ? String(req.body.description).trim() : null,
          strategy: 'CUSTOM',
          extraBudget: resolveRepaymentExtraBudget(req.body?.extraBudget, 0),
        },
      });

      await replacePlanItems(
        tx,
        created.id,
        debts.map((debt: any) => debt.id),
      );

      return tx.repaymentPlan.findUnique({
        where: { id: created.id },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: { debt: true },
          },
        },
      });
    });

    return success(res, { plan: formatPlan(plan) }, 201);
  } catch (err) {
    console.error('createRepaymentPlan error:', err);
    return error(res, 'Internal server error');
  }
}

export async function getRepaymentPlanById(req: AuthenticatedRequest, res: Response) {
  try {
    const plan = await (prisma as any).repaymentPlan.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: { debt: true },
        },
      },
    });

    if (!plan) return error(res, 'Repayment plan not found', 404);
    return success(res, { plan: formatPlan(plan) });
  } catch (err) {
    console.error('getRepaymentPlanById error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateRepaymentPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId as string;
    const existing = await (prisma as any).repaymentPlan.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) return error(res, 'Repayment plan not found', 404);

    const hasDebtIds = Array.isArray(req.body?.debtIds);
    const debtIds = hasDebtIds ? uniqueDebtIds(req.body.debtIds) : [];
    const debts = hasDebtIds ? await getOwnedActiveDebts(userId, debtIds) : [];

    if (hasDebtIds && debts.length !== debtIds.length) {
      return error(res, 'Một số khoản nợ không hợp lệ hoặc không thuộc tài khoản này.', 400);
    }

    const updated = await (prisma as any).$transaction(async (tx: any) => {
      await tx.repaymentPlan.update({
        where: { id: existing.id },
        data: {
          ...(req.body?.name !== undefined && {
            name: String(req.body.name || DEFAULT_PLAN_NAME).trim(),
          }),
          ...(req.body?.description !== undefined && {
            description: req.body.description ? String(req.body.description).trim() : null,
          }),
          ...(req.body?.strategy !== undefined && {
            strategy: String(req.body.strategy || 'CUSTOM').trim(),
          }),
          ...(req.body?.extraBudget !== undefined && {
            extraBudget: resolveRepaymentExtraBudget(req.body.extraBudget, existing.extraBudget),
          }),
        },
      });

      if (hasDebtIds) {
        await replacePlanItems(
          tx,
          existing.id,
          debts.map((debt: any) => debt.id),
        );
      }

      return tx.repaymentPlan.findUnique({
        where: { id: existing.id },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: { debt: true },
          },
        },
      });
    });

    return success(res, { plan: formatPlan(updated) });
  } catch (err) {
    console.error('updateRepaymentPlan error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteRepaymentPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const result = await (prisma as any).repaymentPlan.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });

    if (result.count === 0) return error(res, 'Repayment plan not found', 404);
    return success(res, { message: 'Đã xóa bản kế hoạch trả nợ.' });
  } catch (err) {
    console.error('deleteRepaymentPlan error:', err);
    return error(res, 'Internal server error');
  }
}

export async function simulateRepaymentPlan(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.userId as string;
    const debtIds = uniqueDebtIds(req.body?.debtIds);

    if (debtIds.length === 0) {
      return error(res, 'Cần chọn ít nhất một khoản nợ để mô phỏng.', 400);
    }

    const debts = await getOwnedActiveDebts(userId, debtIds);
    if (debts.length !== debtIds.length) {
      return error(res, 'Một số khoản nợ không hợp lệ hoặc không thuộc tài khoản này.', 400);
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { monthlyIncome: true, extraBudget: true },
    });
    const extraBudget = resolveRepaymentExtraBudget(req.body?.extraBudget, user?.extraBudget);
    const options = { monthlyIncome: user?.monthlyIncome || 0, stopOnTermBreach: true };

    const custom = simulateCustomRepaymentWithExtraBudget(debts, extraBudget, debtIds, options);
    const avalanche = simulateRepaymentWithExtraBudget(debts, extraBudget, 'AVALANCHE', options);
    const snowball = simulateRepaymentWithExtraBudget(debts, extraBudget, 'SNOWBALL', options);

    return success(res, {
      debtIds,
      monthlyIncome: user?.monthlyIncome || 0,
      extraBudget,
      custom: formatSimulation(custom),
      avalanche: formatSimulation(avalanche),
      snowball: formatSimulation(snowball),
      comparison: {
        customVsAvalanche: {
          interestDelta: custom.totalInterest - avalanche.totalInterest,
          monthsDelta: custom.months - avalanche.months,
        },
        customVsSnowball: {
          interestDelta: custom.totalInterest - snowball.totalInterest,
          monthsDelta: custom.months - snowball.months,
        },
      },
    });
  } catch (err) {
    console.error('simulateRepaymentPlan error:', err);
    return error(res, 'Internal server error');
  }
}
