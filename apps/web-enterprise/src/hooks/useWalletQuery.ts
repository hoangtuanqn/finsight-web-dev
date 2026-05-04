import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../api';
import { queryKeys } from '../api/queryKeys';

export function useWallets() {
  return useQuery({
    queryKey: queryKeys.WALLETS.ALL,
    queryFn: async () => {
      const res = await walletAPI.getAll();
      return res.data.data;
    },
  });
}

export function useWalletDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['wallet', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await walletAPI.getById(id);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.WALLETS.BALANCE,
    queryFn: async () => {
      const res = await walletAPI.getBalance();
      return res.data.data;
    },
  });
}

export function useWalletMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.WALLETS.ALL });
    queryClient.invalidateQueries({ queryKey: queryKeys.WALLETS.BALANCE });
  };

  const createWallet = useMutation({
    mutationFn: (data: any) => walletAPI.create(data),
    onSuccess: invalidate,
  });

  const updateWallet = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => walletAPI.update(id, data),
    onSuccess: invalidate,
  });

  const deleteWallet = useMutation({
    mutationFn: (id: string) => walletAPI.delete(id),
    onSuccess: invalidate,
  });

  return { createWallet, updateWallet, deleteWallet };
}
