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
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
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
  getAll: () => api.get('/debts'),
  create: (data) => api.post('/debts', data),
  getById: (id) => api.get(`/debts/${id}`),
  update: (id, data) => api.put(`/debts/${id}`, data),
  delete: (id) => api.delete(`/debts/${id}`),
  logPayment: (id, data) => api.post(`/debts/${id}/payments`, data),
  getRepaymentPlan: (params) => api.get('/debts/repayment-plan', { params }),
  getEarAnalysis: () => api.get('/debts/ear-analysis'),
};

// INVESTMENT
export const investmentAPI = {
  getProfile: () => api.get('/investment/profile'),
  createProfile: (data) => api.post('/investment/profile', data),
  updateProfile: (data) => api.put('/investment/profile', data),
  getAllocation: (params) => api.get('/investment/allocation', { params }),
  getHistory: () => api.get('/investment/history'),
  submitRiskAssessment: (data) => api.post('/investment/risk-assessment', data),
};

// MARKET
export const marketAPI = {
  getSentiment: () => api.get('/market/sentiment'),
  getPrices: () => api.get('/market/prices'),
  getNews: () => api.get('/market/news'),
  getSummary: () => api.get('/market/summary'),
};

export default api;
