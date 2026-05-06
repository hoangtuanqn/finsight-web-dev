import { getDb } from './config.js';

// ─── Types ───────────────────────────────────────────────────────────

export interface AgentUserProfile {
  id: string;
  fullName: string;
  monthlyIncome: number | null;
  extraBudget: number | null;
  strategyQuota: number;
  level: string;
  investorProfile: AgentInvestorProfile | null;
}

export interface AgentInvestorProfile {
  capital: number | null;
  riskLevel: string | null;
  goal: string | null;
  monthlyAdd: number | null;
}

export interface AgentDebtSummary {
  totalActive: number;
  totalBalance: number;
  totalMonthlyObligation: number;
  debts: AgentDebt[];
}

export interface AgentDebt {
  id: string;
  name: string;
  balance: number;
  originalAmount: number;
  apr: number;
  minPayment: number;
  dueDay: number;
  status: string;
}

export interface AgentDtiSnapshot {
  monthlyIncome: number | null;
  totalMonthlyObligation: number;
  dtiPercent: number | null;
  alertLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'UNKNOWN';
}

// ─── Repository helpers ──────────────────────────────────────────────

/**
 * Fetch user profile + investor profile for agent context.
 * Never returns password, socialId, 2FA secret, or backup codes.
 */
export async function getAgentUserProfile(userId: string): Promise<AgentUserProfile | null> {
  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      monthlyIncome: true,
      extraBudget: true,
      strategyQuota: true,
      level: true,
      investorProfile: {
        select: {
          capital: true,
          riskLevel: true,
          goal: true,
          monthlyAdd: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    monthlyIncome: user.monthlyIncome ?? null,
    extraBudget: user.extraBudget ?? null,
    strategyQuota: user.strategyQuota,
    level: user.level,
    investorProfile: user.investorProfile
      ? {
          capital: (user.investorProfile as any).capital ?? null,
          riskLevel: (user.investorProfile as any).riskLevel ?? null,
          goal: (user.investorProfile as any).goal ?? null,
          monthlyAdd: (user.investorProfile as any).monthlyAdd ?? null,
        }
      : null,
  };
}

/**
 * Get all active (non-deleted) debts for a user.
 * Uses the Prisma soft-delete extension — deletedAt: null is enforced automatically.
 */
export async function getAgentActiveDebts(userId: string): Promise<AgentDebtSummary> {
  const debts = await getDb().debt.findMany({
    where: { userId, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      balance: true,
      originalAmount: true,
      apr: true,
      minPayment: true,
      dueDay: true,
      status: true,
    },
    orderBy: { balance: 'desc' },
  });

  const totalBalance = debts.reduce((sum: number, d: any) => sum + (d.balance ?? 0), 0);
  const totalMonthlyObligation = debts.reduce((sum: number, d: any) => sum + (d.minPayment ?? 0), 0);

  return {
    totalActive: debts.length,
    totalBalance,
    totalMonthlyObligation,
    debts: debts.map((d: any) => ({
      id: d.id,
      name: d.name,
      balance: d.balance,
      originalAmount: d.originalAmount,
      apr: d.apr,
      minPayment: d.minPayment,
      dueDay: d.dueDay,
      status: d.status,
    })),
  };
}

/**
 * Calculate a quick DTI snapshot from live user income and active debts.
 * Returns `dtiPercent: null` when monthlyIncome is 0 or missing.
 */
export async function getAgentDtiSnapshot(userId: string): Promise<AgentDtiSnapshot> {
  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: { monthlyIncome: true },
  });

  const monthlyIncome = (user as any)?.monthlyIncome ?? null;

  const debtSummary = await getAgentActiveDebts(userId);
  const totalMonthlyObligation = debtSummary.totalMonthlyObligation;

  if (!monthlyIncome || monthlyIncome <= 0) {
    return {
      monthlyIncome: null,
      totalMonthlyObligation,
      dtiPercent: null,
      alertLevel: 'UNKNOWN',
    };
  }

  const dtiPercent = (totalMonthlyObligation / monthlyIncome) * 100;

  let alertLevel: AgentDtiSnapshot['alertLevel'] = 'SAFE';
  if (dtiPercent > 50) alertLevel = 'DANGER';
  else if (dtiPercent > 35) alertLevel = 'WARNING';

  return {
    monthlyIncome,
    totalMonthlyObligation,
    dtiPercent: parseFloat(dtiPercent.toFixed(2)),
    alertLevel,
  };
}
