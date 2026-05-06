import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { enterpriseAuthAPI } from '../api';

export const RepaymentStrategy = {
  AVALANCHE: 'AVALANCHE',
  SNOWBALL: 'SNOWBALL',
  OVERDUE_FIRST: 'OVERDUE_FIRST',
  COVENANT_RISK: 'COVENANT_RISK',
} as const;

export type RepaymentStrategy = (typeof RepaymentStrategy)[keyof typeof RepaymentStrategy];

export interface PlanItem {
  debtId: string;
  plannedAmount: number;
  priority: number;
  reason?: string;
}

export interface SimulationResult {
  debts: {
    debtId: string;
    debtName: string;
    partyName: string;
    internalCode: string;
    principal: number;
    interestRate: number;
    interestMethod: string;
    dueDate: string;
    outstanding: number;
    plannedAmount: number;
    remainingAfter: number;
    priority: number;
    reason: string;
    monthsToPayoff: number | 'NEVER';
    isDebtTrap: boolean;
  }[];
  summary: {
    totalBudget: number;
    totalAllocated: number;
    remainingBudget: number;
    fullyPaidCount: number;
    totalInterestSaved: number;
  };
  alerts: {
    type: 'DANGER' | 'WARNING' | 'INFO';
    message: string;
  }[];
  optimalPoints?: {
    budget: number;
    fullyPaidCount: number;
    impact: string;
  }[];
}

export const useRepaymentPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const simulate = useCallback(async (budget: number, strategy: RepaymentStrategy, excludeDebtIds: string[] = []) => {
    setLoading(true);
    try {
      const response = await enterpriseAuthAPI.simulateRepayment({ budget, strategy, excludeDebtIds });
      const data = response.data as SimulationResult;
      setResult(data);
      return data;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi tính toán mô phỏng');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const commitPlan = useCallback(
    async (name: string, budget: number, strategy: RepaymentStrategy, items: PlanItem[]) => {
      setCommitting(true);
      try {
        const response = await enterpriseAuthAPI.commitRepaymentPlan({ name, budget, strategy, items });
        toast.success('Đã lưu kế hoạch trả nợ thành công');
        return response.data;
      } catch (error: any) {
        toast.error(error.response?.data?.error || 'Lỗi khi lưu kế hoạch');
        return null;
      } finally {
        setCommitting(false);
      }
    },
    [],
  );

  return {
    simulate,
    commitPlan,
    loading,
    committing,
    result,
    setResult,
  };
};
