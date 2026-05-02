export const ASSET_TICKERS: Record<string, string | null> = {
  gold:      'GC=F',
  stocks:    'E1VFVN30.HM',
  bonds:     null,
  crypto:    'BTC-USD',
  gold: 'GC=F',
  stocks: 'E1VFVN30.HM',
  stocks_us: 'SPY',
  bonds: null,
  crypto: 'BTC-USD',
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
};

export const ASSET_ORDER = ['savings', 'gold', 'stocks', 'bonds', 'crypto'];
console.log('[assetTickers] ASSET_ORDER loaded:', ASSET_ORDER, 'from', import.meta.url);

export const HISTORY_CONFIG = {
  years: 5,
  interval: '1mo',
  cacheKeyPrefix: 'hist',
  cacheTTL: 86400,
};

export const FALLBACK_PARAMS: Record<string, { annualReturn: number, annualStdDev: number }> = {
  savings:   { annualReturn: 0.050, annualStdDev: 0.002 },
  gold:      { annualReturn: 0.065, annualStdDev: 0.180 },
  stocks:    { annualReturn: 0.100, annualStdDev: 0.220 },
  crypto:    { annualReturn: 0.200, annualStdDev: 0.800 },
  bonds:     { annualReturn: 0.042, annualStdDev: 0.040 },
export const FALLBACK_PARAMS: Record<string, { annualReturn: number; annualStdDev: number }> = {
  savings: { annualReturn: 0.05, annualStdDev: 0.002 },
  gold: { annualReturn: 0.065, annualStdDev: 0.18 },
  stocks: { annualReturn: 0.1, annualStdDev: 0.22 },
  stocks_us: { annualReturn: 0.105, annualStdDev: 0.16 },
  crypto: { annualReturn: 0.2, annualStdDev: 0.8 },
  bonds: { annualReturn: 0.042, annualStdDev: 0.04 },
>>>>>>> fe84c7e365e1a74416dcfbaf57225cc3c55bac85
};
