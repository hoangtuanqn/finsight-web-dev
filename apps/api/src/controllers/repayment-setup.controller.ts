import { Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthenticatedRequest } from '../types';
import { error, success } from '../utils/apiResponse';

// ─── Validation schema ────────────────────────────────────────────────────────

const RepaymentSetupSchema = z.object({
  extraBudget: z.number().positive('extraBudget phải lớn hơn 0'),
  targetDate: z
    .string()
    .nullable()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), { message: 'targetDate không hợp lệ (YYYY-MM-DD)' }),
  strategy: z.enum(['AVALANCHE', 'SNOWBALL', 'CUSTOM']).nullable().optional(),
});

// ─── Controller ───────────────────────────────────────────────────────────────

/**
 * Task 3.4 — Repayment setup confirmation endpoint.
 *
 * Updates:
 *   - User.extraBudget (required)
 *   - DebtGoal.targetDate (optional upsert when targetDate provided)
 *
 * Returns suggested redirect route for the frontend.
 */
export async function repaymentSetup(req: AuthenticatedRequest, res: Response) {
  const parsed = RepaymentSetupSchema.safeParse(req.body);
  if (!parsed.success) {
    return error(res, parsed.error.issues.map((e) => e.message).join('; '), 400);
  }

  const { extraBudget, targetDate } = parsed.data;
  const userId = req.userId as string;

  try {
    // 1. Update User.extraBudget
    await (prisma as any).user.update({
      where: { id: userId },
      data: { extraBudget: extraBudget },
    });

    // 2. Optionally upsert DebtGoal.targetDate
    if (targetDate) {
      await (prisma as any).debtGoal.upsert({
        where: { userId },
        update: { targetDate: new Date(targetDate) },
        create: {
          userId,
          targetDate: new Date(targetDate),
          strategy: parsed.data.strategy ?? 'AVALANCHE',
        },
      });
    }

    return success(res, {
      extraBudget,
      targetDate: targetDate ?? null,
      redirectRoute: '/debts/repayment',
    });
  } catch (err: any) {
    console.error('[repaymentSetup] error:', err.message);
    return error(res, 'Không thể lưu cài đặt kế hoạch trả nợ. Vui lòng thử lại.');
  }
}
