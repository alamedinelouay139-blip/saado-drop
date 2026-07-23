/**
 * SAADO DROP API Client Service
 * Connects to the Express backend at http://localhost:5000/api
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with clean error handling.
 */
async function request(endpoint, options = {}) {
  const { headers = {}, ...rest } = options;
  const config = {
    headers: {
      ...headers,
    },
    ...rest,
  };

  // If payload is not FormData, default to application/json
  if (config.body && !(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.message || 'An error occurred while communicating with the server';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.errors = data.errors || [];
    throw err;
  }

  return data;
}

export const api = {
  // Public Endpoints
  getHealth: () => request('/health'),
  getCategories: () => request('/categories'),
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.category_id) query.append('category_id', params.category_id);
    if (params.search) query.append('search', params.search);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/products${queryString}`);
  },
  getProductById: (id) => request(`/products/${id}`),
  createOrder: (orderData) => request('/orders', { method: 'POST', body: orderData }),
  getShopSettings: () => request('/shop-settings'),

  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  getProfile: (token) => request('/auth/profile', { headers: { Authorization: `Bearer ${token}` } }),
  changeAdminPassword: (payload, token) => request('/auth/password', { method: 'PATCH', body: payload, headers: { Authorization: `Bearer ${token}` } }),

  // Admin Products
  getAdminProducts: (token, status = 'active') => request(`/products/admin/all?status=${status}`, { headers: { Authorization: `Bearer ${token}` } }),
  createProduct: (formData, token) => request('/products', { method: 'POST', body: formData, headers: { Authorization: `Bearer ${token}` } }),
  updateProduct: (id, formData, token) => request(`/products/${id}`, { method: 'PATCH', body: formData, headers: { Authorization: `Bearer ${token}` } }),
  archiveProduct: (id, token) => request(`/products/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  restoreProduct: (id, token) => request(`/products/${id}/restore`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }),
  permanentlyDeleteProduct: (id, token) => request(`/products/${id}/permanent`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),

  // Admin Categories
  createCategory: (categoryData, token) => request('/categories', { method: 'POST', body: categoryData, headers: { Authorization: `Bearer ${token}` } }),
  updateCategory: (id, categoryData, token) => request(`/categories/${id}`, { method: 'PATCH', body: categoryData, headers: { Authorization: `Bearer ${token}` } }),
  deleteCategory: (id, token) => request(`/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),

  // Admin Orders
  getAdminOrders: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.order_type) query.append('order_type', params.order_type);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/admin/orders${queryString}`, { headers: { Authorization: `Bearer ${token}` } });
  },
  getOrderDetails: (id, token) => request(`/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
  updateOrderStatus: (id, status, token) => request(`/admin/orders/${id}/status`, { method: 'PATCH', body: { status }, headers: { Authorization: `Bearer ${token}` } }),
  getWhatsAppMessage: (id, token) => request(`/admin/orders/${id}/whatsapp-message`, { headers: { Authorization: `Bearer ${token}` } }),
  exportOrders: (token) => {
    return fetch(`${BASE_URL}/admin/orders/export`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (!res.ok) throw new Error('Export failed');
      return res.blob();
    });
  },
  deleteOrder: (id, token) => request(`/admin/orders/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
  deleteAllOrders: (payload, token) => request(`/admin/orders`, { method: 'DELETE', body: payload, headers: { Authorization: `Bearer ${token}` } }),

  // Admin Settings
  updateShopSettings: (settingsData, token) => request('/shop-settings', { method: 'PATCH', body: settingsData, headers: { Authorization: `Bearer ${token}` } }),
};
