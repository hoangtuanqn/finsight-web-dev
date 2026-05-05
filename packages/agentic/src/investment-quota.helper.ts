import { getDb } from './config.js';

// ─── Quota snapshot type ──────────────────────────────────────────────

export interface InvestmentQuotaSnapshot {
  strategyQuota: number;
  monthlyIncome: number | null;
  capital: number | null;
  riskLevel: string | null;
  /**
   * True when the agent guardrail must refuse investment-related popups.
   * quota <= 0 means no remaining strategy generations.
   */
  isQuotaExhausted: boolean;
}

// ─── Helper ───────────────────────────────────────────────────────────

/**
 * Read quota and investment profile fields for the Investment Worker.
 *
 * Rules:
 * - Fields missing in DB are returned as `null`, NOT auto-filled with defaults.
 * - `strategyQuota` of 0 is distinct from `null` — quota exhausted.
 * - Does NOT decrement quota; consumption is handled by the generate-strategy endpoint.
 * - Never exposes password, 2FA secret, socialId, or tokens.
 */
export async function getInvestmentQuotaSnapshot(userId: string): Promise<InvestmentQuotaSnapshot | null> {
  const user = await getDb().user.findUnique({
    where: { id: userId },
    select: {
      strategyQuota: true,
      monthlyIncome: true,
      investorProfile: {
        select: {
          capital: true,
          riskLevel: true,
        },
      },
    },
  });

  if (!user) return null;

  // Explicit null coercion: 0 remains 0, undefined/null becomes null
  const monthlyIncome = (user as any).monthlyIncome != null ? (user as any).monthlyIncome : null;
  const capital = (user as any).investorProfile?.capital != null ? (user as any).investorProfile.capital : null;
  const riskLevel = (user as any).investorProfile?.riskLevel != null ? (user as any).investorProfile.riskLevel : null;
  const strategyQuota: number = (user as any).strategyQuota ?? 0;

  return {
    strategyQuota,
    monthlyIncome,
    capital,
    riskLevel,
    isQuotaExhausted: strategyQuota <= 0,
  };
}
