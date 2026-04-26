import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finsight_token');
  if (token) {
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
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleLogin: (data) => api.post('/auth/google', data),
  getGoogleConfig: () => api.get('/auth/google-config'),
  facebookLogin: (data) => api.post('/auth/facebook', data),
  getFacebookConfig: () => api.get('/auth/facebook-config'),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const qrAPI = {
  generate: () => api.get('/auth/qr/generate'),
  checkStatus: (token) => api.get(`/auth/qr/status/${token}`),
  markScanned: (data) => api.post('/auth/qr/scanned', data),
  confirm: (data) => api.post('/auth/qr/confirm', data),
};

// USER
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getNotifications: () => api.get('/users/notifications'),
  markRead: (id) => api.put(`/users/notifications/${id}/read`),
  markAllRead: () => api.delete('/users/notifications/read-all'),
};

// DEBTS
export const debtAPI = {
  getAll: (status) => api.get('/debts', { params: { status } }),
  getAll: (params) => api.get('/debts', { params }),
  create: (data) => api.post('/debts', data),
  getById: (id) => api.get(`/debts/${id}`),
  update: (id, data) => api.put(`/debts/${id}`, data),
  delete: (id, data) => api.delete(`/debts/${id}`, { data }),
  restore: (id) => api.post(`/debts/${id}/restore`),
  logPayment: (id, data) => api.post(`/debts/${id}/payments`, data),
  getRepaymentPlan: (params) => api.get('/debts/repayment-plan', { params }),
  getEarAnalysis: () => api.get('/debts/ear-analysis'),
  getDtiAnalysis: () => api.get('/debts/dti'),
};

// DEBT GOAL
export const debtGoalAPI = {
  get: () => api.get('/debts/goal'),
  upsert: (data) => api.post('/debts/goal', data),
  delete: () => api.delete('/debts/goal'),
};

// INVESTMENT
export const investmentAPI = {
  getProfile: () => api.get('/investment/profile'),
  createProfile: (data) => api.post('/investment/profile', data),
  updateProfile: (data) => api.put('/investment/profile', data),
  getAllocation: (params) => api.get('/investment/allocation', { params }),
  getHistory: () => api.get('/investment/history'),
  submitRiskAssessment: (data) => api.post('/investment/risk-assessment', data),
  getCryptoPrices: () => api.get('/investment/crypto-prices'),
  getStockPrices: (params) => api.get('/investment/stock-prices', { params }),
  getAssetHistory: (params) => api.get('/investment/asset-history', { params }),
  getGoldPrices: () => api.get('/investment/gold-prices'),
  getSavingsRates: (params) => api.get('/investment/savings-rates', { params }),
  getBondsRates: (params) => api.get('/investment/bonds-rates', { params }),
  // ── AI Strategy & User Portfolio ──
  getStrategies: () => api.get('/investment/strategies'),
  generateStrategy: () => api.post('/investment/strategies/generate'),
  getPortfolio: () => api.get('/investment/portfolio'),
  upsertPortfolio: (data) => api.post('/investment/portfolio', data),
  updatePortfolio: (data) => api.put('/investment/portfolio', data),
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
  getSession: (id) => api.get(`/agentic/sessions/${id}`),
  deleteSession: (id) => api.delete(`/agentic/sessions/${id}`),
};

// REPORTS
export const reportAPI = {
  exportReport: (format) => api.get('/reports/export', {
    params: { format },
    responseType: 'blob'
  }),
};

// SUBSCRIPTION
export const subscriptionAPI = {
  getMyPlan: () => api.get('/subscription/me'),
  getPlans: () => api.get('/subscription/plans'),
  createInvoice: (plan) => api.post('/subscription/invoice', { plan }),
  getInvoice: (id) => api.get(`/subscription/invoice/${id}`),
  checkStatus: (id) => api.get(`/subscription/invoice/${id}/status`),
  getTransactions: () => api.get('/subscription/transactions'),
  cancelInvoice: (id) => api.post(`/subscription/invoice/${id}/cancel`),
  verifyPayment: () => api.post('/subscription/verify'),
};

export const articleAPI = {
  getArticles: () => api.get('/articles'),
  seedArticles: () => api.post('/articles/seed'),
};

export default api;
