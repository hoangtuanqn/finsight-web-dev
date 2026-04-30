import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('finsight_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// AUTH
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  googleLogin: (data: any) => api.post('/auth/google', data),
  getGoogleConfig: () => api.get('/auth/google-config'),
  facebookLogin: (data: any) => api.post('/auth/facebook', data),
  getFacebookConfig: () => api.get('/auth/facebook-config'),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const qrAPI = {
  generate: () => api.get('/auth/qr/generate'),
  checkStatus: (token: string) => api.get(`/auth/qr/status/${token}`),
  markScanned: (data: any) => api.post('/auth/qr/scanned', data),
  confirm: (data: any) => api.post('/auth/qr/confirm', data),
};

// USER
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getNotifications: () => api.get('/users/notifications'),
  markRead: (id: string | number) => api.put(`/users/notifications/${id}/read`),
  markAllRead: () => api.delete('/users/notifications/read-all'),
};

// DEBTS
export const debtAPI = {
  getAllByStatus: (status: string) => api.get('/debts', { params: { status } }),
  getAll: (params?: any) => api.get('/debts', { params }),
  create: (data: any) => api.post('/debts', data),
  getById: (id: string | number) => api.get(`/debts/${id}`),
  update: (id: string | number, data: any) => api.put(`/debts/${id}`, data),
  delete: (id: string | number, data?: any) => api.delete(`/debts/${id}`, { data }),
  restore: (id: string | number) => api.post(`/debts/${id}/restore`),
  logPayment: (id: string | number, data: any) => api.post(`/debts/${id}/payments`, data),
  getRepaymentPlan: (params: any) => api.get('/debts/repayment-plan', { params }),
  getEarAnalysis: () => api.get('/debts/ear-analysis'),
  getDtiAnalysis: () => api.get('/debts/dti'),
};

// DEBT GOAL
export const debtGoalAPI = {
  get: () => api.get('/debts/goal'),
  upsert: (data: any) => api.post('/debts/goal', data),
  delete: () => api.delete('/debts/goal'),
};

// REPAYMENT PLANS
export const repaymentPlanAPI = {
  getAll: () => api.get('/repayment-plans'),
  create: (data: any) => api.post('/repayment-plans', data),
  getById: (id: string | number) => api.get(`/repayment-plans/${id}`),
  update: (id: string | number, data: any) => api.put(`/repayment-plans/${id}`, data),
  delete: (id: string | number) => api.delete(`/repayment-plans/${id}`),
  simulate: (data: any) => api.post('/repayment-plans/simulate', data),
};

// INVESTMENT
export const investmentAPI = {
  getProfile: () => api.get('/investment/profile'),
  createProfile: (data: any) => api.post('/investment/profile', data),
  updateProfile: (data: any) => api.put('/investment/profile', data),
  getAllocation: (params?: { mockSentiment?: number; excludedAssets?: string }) => api.get('/investment/allocation', { params }),
  getHistory: () => api.get('/investment/history'),
  submitRiskAssessment: (data: any) => api.post('/investment/risk-assessment', data),
  getCryptoPrices: () => api.get('/investment/crypto-prices'),
  getStockPrices: (params: any) => api.get('/investment/stock-prices', { params }),
  getAssetHistory: (params: any) => api.get('/investment/asset-history', { params }),
  getGoldPrices: () => api.get('/investment/gold-prices'),
  getSavingsRates: (params: any) => api.get('/investment/savings-rates', { params }),
  getBondsRates: (params: any) => api.get('/investment/bonds-rates', { params }),
  // ── AI Strategy & User Portfolio ──
  getStrategies: () => api.get('/investment/strategies'),
  generateStrategy: (excludedAssets?: string[]) => api.post('/investment/strategies/generate', { excludedAssets: excludedAssets ?? [] }),
  getPortfolio: () => api.get('/investment/portfolio'),
  upsertPortfolio: (data: any) => api.post('/investment/portfolio', data),
  updatePortfolio: (data: any) => api.put('/investment/portfolio', data),
};

// MARKET
export const marketAPI = {
  getSentiment: () => api.get('/market/sentiment'),
  getPrices: () => api.get('/market/prices'),
  getNews: () => api.get('/market/news'),
  getSummary: () => api.get('/market/summary'),
};

// AGENTIC AI
export const agenticAPI = {
  getSessions: () => api.get('/agentic/sessions'),
  getSession: (id: string | number) => api.get(`/agentic/sessions/${id}`),
  deleteSession: (id: string | number) => api.delete(`/agentic/sessions/${id}`),
};

// REPORTS
export const reportAPI = {
  exportReport: (format: string) => api.get('/reports/export', {
    params: { format },
    responseType: 'blob'
  }),
};

// SUBSCRIPTION
export const subscriptionAPI = {
  getMyPlan: () => api.get('/subscription/me'),
  getPlans: () => api.get('/subscription/plans'),
  createInvoice: (plan: any) => api.post('/subscription/invoice', { plan }),
  getInvoice: (id: string | number) => api.get(`/subscription/invoice/${id}`),
  checkStatus: (id: string | number) => api.get(`/subscription/invoice/${id}/status`),
  getTransactions: () => api.get('/subscription/transactions'),
  cancelInvoice: (id: string | number) => api.post(`/subscription/invoice/${id}/cancel`),
  verifyPayment: () => api.post('/subscription/verify'),
};

export const articleAPI = {
  getArticles: () => api.get('/articles'),
  seedArticles: () => api.post('/articles/seed'),
};

// EXPENSES
export const expenseAPI = {
  getAll: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.patch(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  getStats: (params?: any) => api.get('/expenses/stats', { params }),
  getCategories: () => api.get('/expenses/categories'),
  createCategory: (data: any) => api.post('/expenses/categories', data),
};

// WALLETS
export const walletAPI = {
  getAll: () => api.get('/wallets'),
  getBalance: () => api.get('/wallets/balance'),
  getById: (id: string) => api.get(`/wallets/${id}`),
  create: (data: any) => api.post('/wallets', data),
  update: (id: string, data: any) => api.patch(`/wallets/${id}`, data),
  delete: (id: string) => api.delete(`/wallets/${id}`),
};

// BANK SYNC
export const bankSyncAPI = {
  getPending: (params?: any) => api.get('/bank-sync/pending', { params }),
  fetch: (walletId: string) => api.post(`/bank-sync/fetch/${walletId}`),
  approve: (id: string, data: any) => api.post(`/bank-sync/approve/${id}`, data),
  reject: (id: string) => api.post(`/bank-sync/reject/${id}`),
  clear: () => api.delete('/bank-sync/clear'),
};

// REFERRAL
export const referralAPI = {
  trackClick: (code: string) => api.get(`/referral/click/${code}`),
  getStats: () => api.get('/referral/stats'),
};

export default api;
