import api from '../api'

export const ProductsAPI = {
  getAll: (params = {}) => api.get('/products', { params }).then(r => r.data),
  getOne: (id) => api.get(`/products/${id}`).then(r => r.data),
  create: (data) => api.post('/products', data).then(r => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/products/${id}`).then(r => r.data),
  getLowStock: () => api.get('/products/low-stock').then(r => r.data),
  getInventoryValue: () => api.get('/products/inventory-value').then(r => r.data),
}

export const CategoriesAPI = {
  getAll: () => api.get('/categories').then(r => r.data),
  create: (name) => api.post('/categories', { name }).then(r => r.data),
  update: (id, name) => api.put(`/categories/${id}`, { name }).then(r => r.data),
  remove: (id) => api.delete(`/categories/${id}`).then(r => r.data),
}

export const InventoryAPI = {
  getTransactions: (params = {}) => api.get('/inventory/transactions', { params }).then(r => r.data),
  recordTransaction: (data) => api.post('/inventory/transactions', data).then(r => r.data),
}
