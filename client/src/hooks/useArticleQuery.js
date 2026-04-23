import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { articleAPI } from '../api';

export function useArticles() {
  return useQuery({
    queryKey: ['articles'],
    queryFn: async () => {
      const res = await articleAPI.getArticles();
      return res.data.data.articles;
    }
  });
}

export function useSeedArticles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: articleAPI.seedArticles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    }
  });
}
