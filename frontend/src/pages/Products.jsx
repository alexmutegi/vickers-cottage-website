import { useState, useEffect, useCallback } from 'react'
import { ProductsAPI, CategoriesAPI } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'
import './Products.css'

const EMPTY_FORM = {
  name: '', sku: '', category_id: '', purchase_price: '', selling_price: '',
  stock_quantity: 0, reorder_level: 5,
}

export default function Products() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [limit] = useState(20)

  const [search, setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [lowStockOnly, setLowStockOnly]     = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await CategoriesAPI.getAll().then(d => ({ data: d.categories }))
      setCategories(data)
    } catch {
      setCategories([])
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await ProductsAPI.getAll({
        search: search || undefined,
        category_id: categoryFilter || undefined,
        low_stock: lowStockOnly ? 'true' : undefined,
        page, limit,
      })
      setProducts(result.products)
      setTotal(result.total)
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter, lowStockOnly, page, limit])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => {
    const t = setTimeout(fetchProducts, 300) // debounce search
    return () => clearTimeout(t)
  }, [fetchProducts])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditingId(p.id)
    setForm({
      name: p.name,
      sku: p.sku,
      category_id: p.category_id || '',
      purchase_price: p.purchase_price,
      selling_price: p.selling_price,
      stock_quantity: p.stock_quantity,
      reorder_level: p.reorder_level,
    })
    setFormError('')
    setShowModal(true)
  }

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        stock_quantity: Number(form.stock_quantity),
        reorder_level: Number(form.reorder_level),
      }
      if (editingId) {
        delete payload.stock_quantity // stock changes go through inventory transactions
        await ProductsAPI.update(editingId, payload)
        setSuccess('Product updated successfully')
      } else {
        await ProductsAPI.create(payload)
        setSuccess('Product created successfully')
      }
      setShowModal(false)
      fetchProducts()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product? It will be hidden from listings.')) return
    try {
      await ProductsAPI.remove(id)
      setSuccess('Product deactivated')
      fetchProducts()
    } catch {
      setError('Failed to delete product')
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Product Management</h1>
          <p className="page-subtitle">Manage your beverage inventory catalog</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="filter-input"
        />
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1) }} className="filter-select">
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.product_count})</option>
          ))}
        </select>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => { setLowStockOnly(e.target.checked); setPage(1) }}
          />
          ⚠️ Low stock only
        </label>
      </div>

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading products…</div>
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Stock</th>
                  <th>Reorder Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={8} className="empty-cell">No products found</td></tr>
                )}
                {products.map(p => {
                  const low = p.stock_quantity <= p.reorder_level
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><code>{p.sku}</code></td>
                      <td>{p.category_name || '—'}</td>
                      <td>KES {Number(p.purchase_price).toFixed(2)}</td>
                      <td>KES {Number(p.selling_price).toFixed(2)}</td>
                      <td>
                        <span className={`stock-pill ${low ? 'low' : 'ok'}`}>
                          {p.stock_quantity} {low && '⚠️'}
                        </span>
                      </td>
                      <td>{p.reorder_level}</td>
                      <td className="actions-cell">
                        <button className="btn-sm btn-edit" onClick={() => openEdit(p)}>Edit</button>
                        {isAdmin && (
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Remove</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm">← Prev</button>
            <span>Page {page} of {totalPages} · {total} products</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Next →</button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="modal-form">
              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="form-group">
                <label>Product Name</label>
                <input name="name" value={form.name} onChange={handle} required placeholder="e.g. Tusker Lager 500ml" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>SKU</label>
                  <input name="sku" value={form.sku} onChange={handle} required placeholder="e.g. BEER-TUSK-500" />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category_id" value={form.category_id} onChange={handle}>
                    <option value="">— None —</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Purchase Price (KES)</label>
                  <input name="purchase_price" type="number" step="0.01" min="0" value={form.purchase_price} onChange={handle} required />
                </div>
                <div className="form-group">
                  <label>Selling Price (KES)</label>
                  <input name="selling_price" type="number" step="0.01" min="0" value={form.selling_price} onChange={handle} required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Initial Stock {editingId && <span className="hint">(use Inventory page to adjust)</span>}</label>
                  <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={handle} disabled={!!editingId} />
                </div>
                <div className="form-group">
                  <label>Reorder Level</label>
                  <input name="reorder_level" type="number" min="0" value={form.reorder_level} onChange={handle} />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
