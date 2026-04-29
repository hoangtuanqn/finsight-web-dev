import { useQuery } from '@tanstack/react-query';
import { referralAPI } from '../api/index';

export const useAffiliateQuery = () => {
  return useQuery({
    queryKey: ['affiliate-stats-v2'],
    queryFn: async () => {
      console.log('[AffiliateQuery] Fetching stats...');
      
      const { data } = await referralAPI.getStats();
      
      console.log('[AffiliateQuery] Received data:', data);
      return data.data;
    },
    retry: 1,
    staleTime: 0
  });
};
