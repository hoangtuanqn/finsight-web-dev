import { useDebts } from '../../../hooks/useDebtQuery';
import { useMarketSentiment } from '../../../hooks/useMarketQuery';

export function useDashboardData() {
  const { data: debts, isLoading: debtsLoading } = useDebts() as { data: any; isLoading: boolean };
  const { data: sentiment, isLoading: sentimentLoading } = useMarketSentiment() as { data: any; isLoading: boolean };

  return {
    data: {
      debts,
      sentiment,
    },
    loading: debtsLoading || sentimentLoading,
  };
}
