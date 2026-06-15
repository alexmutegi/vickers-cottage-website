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

export const SuppliersAPI = {
  getAll: (params = {}) => api.get('/suppliers', { params }).then(r => r.data),
  getOne: (id) => api.get(`/suppliers/${id}`).then(r => r.data),
  create: (data) => api.post('/suppliers', data).then(r => r.data),
  update: (id, data) => api.put(`/suppliers/${id}`, data).then(r => r.data),
  remove: (id) => api.delete(`/suppliers/${id}`).then(r => r.data),
}

export const PurchasesAPI = {
  getAll: (params = {}) => api.get('/purchases', { params }).then(r => r.data),
  getOne: (id) => api.get(`/purchases/${id}`).then(r => r.data),
  create: (data) => api.post('/purchases', data).then(r => r.data),
}

export const SalesAPI = {
  getAll: (params = {}) => api.get('/sales', { params }).then(r => r.data),
  getOne: (id) => api.get(`/sales/${id}`).then(r => r.data),
  create: (data) => api.post('/sales', data).then(r => r.data),
  getDashboardSummary: () => api.get('/sales/dashboard/summary').then(r => r.data),
}

export const ReportsAPI = {
  getDailySales:   (date) => api.get('/reports/daily-sales', { params: { date } }).then(r => r.data),
  getMonthlySales: (year, month) => api.get('/reports/monthly-sales', { params: { year, month } }).then(r => r.data),
  getInventory:    () => api.get('/reports/inventory').then(r => r.data),
  getLowStock:     () => api.get('/reports/low-stock').then(r => r.data),
  getProfit:       (start_date, end_date) => api.get('/reports/profit', { params: { start_date, end_date } }).then(r => r.data),
}
