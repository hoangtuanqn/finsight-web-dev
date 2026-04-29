import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankSyncAPI } from '../api';
import { toast } from 'sonner';

export const useBankSyncQuery = (walletId?: string) => {
  return useQuery({
    queryKey: ['bank-sync-pending', walletId],
    queryFn: async () => {
      try {
        const res = await bankSyncAPI.getPending({ walletId });
        // Theo chuẩn project: axios trả về res.data, trong đó có { success, data }
        return res.data?.data || [];
      } catch (err: any) {
        console.error('[BankSync] API Error:', err.response?.data || err.message);
        return []; // Trả về mảng rỗng để không crash UI
      }
    },
    refetchInterval: 30000,
  });
};

export const useBankSyncMutations = () => {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ id, categoryId, description, type }: { id: string, categoryId: string, description?: string, type?: string }) => {
      const res = await bankSyncAPI.approve(id, { categoryId, description, type });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-sync-pending'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Đã duyệt giao dịch vào sổ thu chi!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Không thể duyệt giao dịch');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await bankSyncAPI.reject(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-sync-pending'] });
      toast.success('Đã bỏ qua giao dịch');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  });

  const fetchMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const res = await bankSyncAPI.fetch(walletId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-sync-pending'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Đồng bộ giao dịch mới nhất thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Lỗi khi đồng bộ giao dịch');
    }
  });

  return {
    approve: approveMutation,
    reject: rejectMutation,
    fetch: fetchMutation,
  };
};
