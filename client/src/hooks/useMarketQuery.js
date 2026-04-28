import { useQuery } from '@tanstack/react-query';
import { marketAPI } from '../api';
import { queryKeys } from '../api/queryKeys';

export function useMarketSentiment() {
  return useQuery({
    queryKey: queryKeys.MARKET.SENTIMENT,
    queryFn: async () => {
      const res = await marketAPI.getSentiment();
      return res.data.data.fearGreed;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
