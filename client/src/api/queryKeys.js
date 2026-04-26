export const queryKeys = {
  AUTH: {
    ME: ['auth', 'me'],
  },
  DEBTS: {
    ALL: ['debts', 'all'],
    DETAIL: (id) => ['debts', 'detail', id],
    EAR: ['debts', 'ear'],
    DTI: ['debts', 'dti'],
    REPAYMENT: ['debts', 'repayment'],
    GOAL: ['debts', 'goal'],
  },
  MARKET: {
    SENTIMENT: ['market', 'sentiment'],
    SUMMARY: ['market', 'summary'],
  },
  INVESTMENT: {
    PROFILE: ['investment', 'profile'],
    ALLOCATION: ['investment', 'allocation'],
    HISTORY: ['investment', 'history'],
    STRATEGIES: ['investment', 'strategies'],
    PORTFOLIO: ['investment', 'portfolio'],
    // Asset prices — include riskLevel in key so each level caches separately
    CRYPTO_PRICES:   (riskLevel) => ['investment', 'prices', 'crypto',   riskLevel],
    STOCK_PRICES:    (riskLevel) => ['investment', 'prices', 'stocks',   riskLevel],
    ASSET_HISTORY:   (params)     => ['investment', 'asset-history', params],
    GOLD_PRICES:     ()          => ['investment', 'prices', 'gold'],
    SAVINGS_RATES:   (riskLevel) => ['investment', 'prices', 'savings',  riskLevel],
    BONDS_RATES:     (riskLevel) => ['investment', 'prices', 'bonds',    riskLevel],
  }
};
