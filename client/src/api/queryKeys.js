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
  }
};
