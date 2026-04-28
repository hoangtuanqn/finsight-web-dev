import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseAPI } from '../api';
import { queryKeys } from '../api/queryKeys';

export function useExpenseQuery(params?: any) {
  return useQuery({
    queryKey: queryKeys.EXPENSES.ALL(params),
    queryFn: async () => {
      const res = await expenseAPI.getAll(params);
      return res.data.data;
    },
  });
}

export function useExpenseStats(params?: any) {
  return useQuery({
    queryKey: queryKeys.EXPENSES.STATS(params),
    queryFn: async () => {
      const res = await expenseAPI.getStats(params);
      return res.data.data;
    },
  });
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: queryKeys.EXPENSES.CATEGORIES,
    queryFn: async () => {
      const res = await expenseAPI.getCategories();
      return res.data.data;
    },
  });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const createExpense = useMutation({
    mutationFn: (data: any) => expenseAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const updateExpense = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => expenseAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: (id: string) => expenseAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const createCategory = useMutation({
    mutationFn: (data: any) => expenseAPI.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.EXPENSES.CATEGORIES });
    },
  });

  return { createExpense, updateExpense, deleteExpense, createCategory };
}
