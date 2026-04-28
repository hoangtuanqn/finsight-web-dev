import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtAPI, debtGoalAPI } from '../api';
import { queryKeys } from '../api/queryKeys';
import { toast } from 'sonner';

export function useDebts(filters?: any) {
  return useQuery({
    queryKey: [...queryKeys.DEBTS.ALL, filters],
    queryFn: async () => {
      const res = await debtAPI.getAll(filters);
      return res.data.data;
    }
  });
}

export function useDebt(id: string | number | undefined) {
  return useQuery({
    queryKey: queryKeys.DEBTS.DETAIL(id as any),
    queryFn: async () => {
      const res = await debtAPI.getById(id as any);
      return res.data.data;
    },
    enabled: !!id
  });
}

export function useDebtMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['debts'] });
  };

  const createMutation = useMutation({
    mutationFn: debtAPI.create,
    onSuccess: () => {
      invalidate();
      toast.success('Đã thêm khoản nợ mới');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => debtAPI.update(id, data),
    onSuccess: (res, variables) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.DEBTS.DETAIL(variables.id) });
      toast.success('Đã cập nhật khoản nợ');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data?: any }) => debtAPI.delete(id, data),
    onSuccess: () => {
      invalidate();
      toast.success('Đã chuyển khoản nợ vào thùng rác');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: debtAPI.restore,
    onSuccess: () => {
      invalidate();
      toast.success('Đã khôi phục khoản nợ');
    }
  });

  const logPaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) => debtAPI.logPayment(id, data),
    onSuccess: (res, variables) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: queryKeys.DEBTS.DETAIL(variables.id) });
      toast.success('Đã ghi nhận thanh toán');
    }
  });

  return {
    createDebt: createMutation.mutateAsync,
    updateDebt: updateMutation.mutateAsync,
    deleteDebt: deleteMutation.mutateAsync,
    restoreDebt: restoreMutation.mutateAsync,
    logPayment: logPaymentMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isRestoring: restoreMutation.isPending,
    isLogging: logPaymentMutation.isPending
  };
}

export function useRepaymentPlan(extraBudget: number | undefined) {
  return useQuery({
    queryKey: [...queryKeys.DEBTS.REPAYMENT, extraBudget],
    queryFn: async () => {
      const res = await debtAPI.getRepaymentPlan({ extraBudget });
      return res.data.data;
    },
    enabled: extraBudget !== undefined
  });
}

export function useEarAnalysis() {
  return useQuery({
    queryKey: queryKeys.DEBTS.EAR,
    queryFn: async () => {
      const res = await debtAPI.getEarAnalysis();
      return res.data.data;
    }
  });
}

export function useDtiAnalysis() {
  return useQuery({
    queryKey: queryKeys.DEBTS.DTI,
    queryFn: async () => {
      const res = await debtAPI.getDtiAnalysis();
      return res.data.data;
    }
  });
}

export function useDebtGoal() {
  return useQuery({
    queryKey: queryKeys.DEBTS.GOAL,
    queryFn: async () => {
      const res = await debtGoalAPI.get();
      return res.data.data;
    }
  });
}

export function useDebtGoalMutations() {
  const queryClient = useQueryClient();

  const upsertMutation = useMutation({
    mutationFn: debtGoalAPI.upsert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.DEBTS.GOAL });
      queryClient.invalidateQueries({ queryKey: queryKeys.DEBTS.REPAYMENT });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: debtGoalAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.DEBTS.GOAL });
      queryClient.invalidateQueries({ queryKey: queryKeys.DEBTS.REPAYMENT });
    }
  });

  return {
    upsertGoal: upsertMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    isUpserting: upsertMutation.isPending,
    isDeleting: deleteGoalMutation.isPending
  };
}
