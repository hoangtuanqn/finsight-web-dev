import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI, userAPI } from '../api';
import { queryKeys } from '../api/queryKeys';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.AUTH.ME,
    queryFn: async () => {
      const res = await authAPI.me();
      return res.data.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (res) => {
      queryClient.setQueryData(queryKeys.AUTH.ME, res.data.data || res.data.user);
      queryClient.invalidateQueries({ queryKey: queryKeys.AUTH.ME });
    },
  });
}

export function useAuthMutations() {
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (res) => {
      localStorage.setItem('finsight_token', res.data.token);
      queryClient.setQueryData(queryKeys.AUTH.ME, res.data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authAPI.logout,
    onSuccess: () => {
      localStorage.removeItem('finsight_token');
      queryClient.setQueryData(queryKeys.AUTH.ME, null);
      queryClient.clear();
    },
  });

  return {
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
