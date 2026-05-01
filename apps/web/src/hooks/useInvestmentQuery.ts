import { useQuery } from "@tanstack/react-query";
import { investmentAPI } from "../api";
import { queryKeys } from "../api/queryKeys";

const ASSET_PRICE_STALE_TIME = 10 * 60 * 1000;
const ASSET_PRICE_GC_TIME    = 10 * 60 * 1000;

export function useCryptoPrices(riskLevel = "MEDIUM") {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.CRYPTO_PRICES(riskLevel),
    queryFn: async () => {
      const res = await investmentAPI.getCryptoPrices();
      return res.data.data;
    },
    staleTime: ASSET_PRICE_STALE_TIME,
    gcTime: ASSET_PRICE_GC_TIME,
  });
}

export function useStockPrices(riskLevel = "MEDIUM") {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.STOCK_PRICES(riskLevel),
    queryFn: async () => {
      const res = await investmentAPI.getStockPrices({ riskLevel });
      return res.data.data;
    },
    staleTime: ASSET_PRICE_STALE_TIME,
    gcTime: ASSET_PRICE_GC_TIME,
  });
}

export function useGoldPrices() {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.GOLD_PRICES(),
    queryFn: async () => {
      const res = await investmentAPI.getGoldPrices();
      return res.data.data;
    },
    staleTime: ASSET_PRICE_STALE_TIME,
    gcTime: ASSET_PRICE_GC_TIME,
  });
}

export function useSavingsRates(riskLevel = "MEDIUM") {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.SAVINGS_RATES(riskLevel),
    queryFn: async () => {
      const res = await investmentAPI.getSavingsRates({ riskLevel });
      return res.data.data;
    },
    staleTime: ASSET_PRICE_STALE_TIME,
    gcTime: ASSET_PRICE_GC_TIME,
  });
}

export function useBondsRates(riskLevel = "MEDIUM") {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.BONDS_RATES(riskLevel),
    queryFn: async () => {
      const res = await investmentAPI.getBondsRates({ riskLevel });
      return res.data.data;
    },
    staleTime: ASSET_PRICE_STALE_TIME,
    gcTime: ASSET_PRICE_GC_TIME,
  });
}

export function useAssetMonthlyHistory({
  months,
  days,
  enabled = false,
  ...requestParams
}: any = {}) {
  const hasSource = Boolean(
    requestParams.ticker ||
    requestParams.symbol ||
    requestParams.source ||
    requestParams.bankId,
  );
  const apiParams = { ...requestParams };
  delete apiParams.rangeOptions;
  delete apiParams.defaultRange;
  const rangeParams = days ? { days } : { months: months ?? 12 };
  const params = { ...apiParams, ...rangeParams };

  return useQuery({
    queryKey: queryKeys.INVESTMENT.ASSET_HISTORY(params),
    queryFn: async () => {
      const res = await investmentAPI.getAssetHistory(params);
      return res.data.data;
    },
    enabled: Boolean(enabled && requestParams.asset && hasSource),
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useInvestmentStrategies() {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.STRATEGIES,
    queryFn: async () => {
      const res = await investmentAPI.getStrategies();
      return res.data.data ?? [];
    },
    staleTime: 5 * 60 * 1000, // 5 phút
  });
}

export function useInvestmentPortfolio() {
  return useQuery({
    queryKey: queryKeys.INVESTMENT.PORTFOLIO,
    queryFn: async () => {
      const res = await investmentAPI.getPortfolio();
      return res.data.data ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });
}
