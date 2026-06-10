import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

// Products API
export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getFeatured: (limit?: number) => api.get(`/products/featured?limit=${limit || 10}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories/categories'),
  getById: (id: number) => api.get(`/categories/categories/${id}`),
  create: (data: any) => api.post('/categories/categories', data),
  update: (id: number, data: any) => api.put(`/categories/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/categories/${id}`),
};

// Orders API
export const ordersApi = {
  getAll: (params?: any) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  updateStatus: (id: number, data: any) => api.put(`/orders/${id}/status`, data),
  getStats: () => api.get('/orders/stats'),
};

// Inventory API
export const inventoryApi = {
  getAll: (params?: any) => api.get('/inventory', { params }),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  getMovements: (params?: any) => api.get('/inventory/movements', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  getReport: () => api.get('/inventory/report'),
};

// Customers API
export const customersApi = {
  getAll: (params?: any) => api.get('/customers', { params }),
  getById: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  getStats: () => api.get('/customers/stats'),
  getTop: (params?: any) => api.get('/customers/top', { params }),
};

// Reports API
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getSales: (params?: any) => api.get('/reports/sales', { params }),
  getProducts: (params?: any) => api.get('/reports/products', { params }),
  getCustomers: (params?: any) => api.get('/reports/customers', { params }),
  getInventory: () => api.get('/reports/inventory'),
};

export default api;
