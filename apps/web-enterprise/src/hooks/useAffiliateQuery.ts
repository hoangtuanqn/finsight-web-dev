import { useQuery } from '@tanstack/react-query';
import { referralAPI } from '../api/index';

export const useAffiliateQuery = () => {
  return useQuery({
    queryKey: ['affiliate-stats-v2'],
    queryFn: async () => {
      const { data } = await referralAPI.getStats();
      return data.data;
    },
    retry: 1,
    staleTime: 30_000,
  });
};
