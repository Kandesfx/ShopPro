import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('posToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Products API
export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  getFeatured: (limit?: number) => api.get(`/products/featured?limit=${limit || 20}`),
};

// Orders API
export const ordersApi = {
  create: (data: any) => api.post('/orders', data),
};

// Customers API
export const customersApi = {
  getByPhone: (phone: string) => api.get(`/customers/phone/${phone}`),
  create: (data: any) => api.post('/customers', data),
};

// Auth API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
};

// Promotions API
export const promotionsApi = {
  validate: (code: string, amount: number) =>
    api.get(`/promotions/validate?code=${code}&order_amount=${amount}`),
};

export default api;
