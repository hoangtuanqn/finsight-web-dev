import { useDebts } from '../../../hooks/useDebtQuery';
import { useMarketSentiment } from '../../../hooks/useMarketQuery';

export function useDashboardData() {
  const { data: debts, isLoading: debtsLoading } = useDebts();
  const { data: sentiment, isLoading: sentimentLoading } = useMarketSentiment();

  return {
    data: {
      debts,
      sentiment,
    },
    loading: debtsLoading || sentimentLoading,
  };
}
