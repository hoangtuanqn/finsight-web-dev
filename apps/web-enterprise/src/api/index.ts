import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token and trust token to requests
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('finsight_token');
  const trustToken = localStorage.getItem('finsight_trust_token');

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (trustToken && config.headers) {
    config.headers['x-trust-token'] = trustToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);

// AUTH
export const authAPI = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: Record<string, unknown>) => api.post('/auth/login', data),
  googleLogin: (data: Record<string, unknown>) => api.post('/auth/google', data),
  getGoogleConfig: () => api.get('/auth/google-config'),
  facebookLogin: (data: Record<string, unknown>) => api.post('/auth/facebook', data),
  getFacebookConfig: () => api.get('/auth/facebook-config'),
  setSocialPassword: (data: { tempToken: string; password: string }) => api.post('/auth/set-social-password', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  verifyPassword: (data: { password: string }) => api.post('/auth/verify-password', data),
  // 2FA
  setup2FA: () => api.get('/auth/2fa/setup'),
  enable2FA: (data: { token: string }) => api.post('/auth/2fa/enable', data),
  disable2FA: (data: { token: string }) => api.post('/auth/2fa/disable', data),
  verify2FA: (data: { tempToken: string; otpCode: string; trustDevice?: boolean }) =>
    api.post('/auth/2fa/verify', data),
  trustDevice: () => api.post('/auth/2fa/trust'),
};

export const qrAPI = {
  generate: () => api.get('/auth/qr/generate'),
  checkStatus: (token: string) => api.get(`/auth/qr/status/${token}`),
  markScanned: (data: Record<string, unknown>) => api.post('/auth/qr/scanned', data),
  confirm: (data: Record<string, unknown>) => api.post('/auth/qr/confirm', data),
};

// USER
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/profile', data),
  getNotifications: () => api.get('/users/notifications'),
  markRead: (id: string | number) => api.put(`/users/notifications/${id}/read`),
  markAllRead: () => api.delete('/users/notifications/read-all'),
};

// ENTERPRISE PARTIES
export const partiesAPI = {
  getAll: (params?: Record<string, unknown>) => api.get('/enterprise/parties', { params }),
  create: (data: Record<string, unknown>) => api.post('/enterprise/parties', data),
  getById: (id: string) => api.get(`/enterprise/parties/${id}`),
  update: (id: string, data: Record<string, unknown>) => api.put(`/enterprise/parties/${id}`, data),
  delete: (id: string) => api.delete(`/enterprise/parties/${id}`),
};

// ENTERPRISE REGISTRATION
export const enterpriseAuthAPI = {
  register: (data: Record<string, unknown>) => api.post('/enterprise/auth/register', data),
};

export default api;
