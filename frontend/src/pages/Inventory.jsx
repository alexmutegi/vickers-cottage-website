import { useState, useEffect, useCallback } from 'react'
import { InventoryAPI, ProductsAPI } from '../services/inventoryApi'
import './Inventory.css'

const TYPE_LABELS = {
  stock_in:  { label: 'Stock In',  icon: '📥', color: '#1a7a4a', sign: '+' },
  stock_out: { label: 'Stock Out', icon: '📤', color: '#c0392b', sign: '−' },
  damaged:   { label: 'Damaged',   icon: '💔', color: '#e8a020', sign: '−' },
  returned:  { label: 'Returned',  icon: '↩️', color: '#1e3a5f', sign: '+' },
}

const EMPTY_FORM = { product_id: '', transaction_type: 'stock_in', quantity: '', notes: '' }

export default function Inventory() {
  const [transactions, setTransactions] = useState([])
  const [total, setTotal]   = useState(0)
  const [page, setPage]     = useState(1)
  const [limit] = useState(20)
  const [typeFilter, setTypeFilter] = useState('')

  const [products, setProducts] = useState([])
  const [productSearch, setProductSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await InventoryAPI.getTransactions({
        transaction_type: typeFilter || undefined,
        page, limit,
      })
      setTransactions(result.transactions)
      setTotal(result.total)
    } catch {
      setError('Failed to load transaction history')
    } finally {
      setLoading(false)
    }
  }, [typeFilter, page, limit])

  const fetchProducts = useCallback(async (search) => {
    try {
      const result = await ProductsAPI.getAll({ search: search || undefined, limit: 20 })
      setProducts(result.products)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(productSearch), 250)
    return () => clearTimeout(t)
  }, [productSearch, fetchProducts])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError('')
    try {
      const result = await InventoryAPI.recordTransaction({
        product_id: form.product_id,
        transaction_type: form.transaction_type,
        quantity: Number(form.quantity),
        notes: form.notes || undefined,
      })
      setSuccess(`${TYPE_LABELS[form.transaction_type].label} recorded — ${result.product.name} now has ${result.product.stock_quantity} units`)
      setForm(EMPTY_FORM)
      setPage(1)
      fetchTransactions()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div>
          <h1>Inventory Tracking</h1>
          <p className="page-subtitle">Record stock movements and view transaction history</p>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="inventory-layout">
        {/* New transaction form */}
        <div className="section-card">
          <h2>Record Stock Movement</h2>
          <form onSubmit={submit} className="inv-form">
            {formError && <div className="alert alert-error">{formError}</div>}

            <div className="form-group">
              <label>Product</label>
              <input
                type="text"
                placeholder="Search product by name or SKU..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
              />
              <select name="product_id" value={form.product_id} onChange={handle} required>
                <option value="">— Select product —</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.stock_quantity} in stock
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Transaction Type</label>
              <div className="type-buttons">
                {Object.entries(TYPE_LABELS).map(([key, { label, icon, color }]) => (
                  <button
                    key={key}
                    type="button"
                    className={`type-btn ${form.transaction_type === key ? 'active' : ''}`}
                    style={form.transaction_type === key ? { borderColor: color, color, background: `${color}11` } : {}}
                    onClick={() => setForm({ ...form, transaction_type: key })}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Quantity</label>
              <input name="quantity" type="number" min="1" value={form.quantity} onChange={handle} required placeholder="e.g. 24" />
            </div>

            <div className="form-group">
              <label>Notes (optional)</label>
              <input name="notes" value={form.notes} onChange={handle} placeholder="e.g. Delivery from supplier, breakage during transport..." />
            </div>

            <button type="submit" className="btn-primary" disabled={submitting || !form.product_id || !form.quantity}>
              {submitting ? 'Recording…' : 'Record Transaction'}
            </button>
          </form>
        </div>

        {/* Transaction history */}
        <div className="section-card">
          <div className="history-header">
            <h2>Transaction History</h2>
            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }} className="filter-select">
              <option value="">All Types</option>
              {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading-box"><div className="spinner" /> Loading history…</div>
          ) : (
            <>
              <div className="history-list">
                {transactions.length === 0 && <p className="empty-cell">No transactions yet</p>}
                {transactions.map(t => {
                  const info = TYPE_LABELS[t.transaction_type]
                  return (
                    <div key={t.id} className="history-item">
                      <span className="history-icon" style={{ background: `${info.color}1a`, color: info.color }}>
                        {info.icon}
                      </span>
                      <div className="history-body">
                        <div className="history-top">
                          <strong>{t.product_name}</strong>
                          <span className="history-qty" style={{ color: info.color }}>
                            {info.sign}{t.quantity}
                          </span>
                        </div>
                        <div className="history-meta">
                          <span className="history-type">{info.label}</span>
                          <span>·</span>
                          <span>{t.sku}</span>
                          {t.created_by_name && <><span>·</span><span>{t.created_by_name}</span></>}
                          <span>·</span>
                          <span>{new Date(t.created_at).toLocaleString()}</span>
                        </div>
                        {t.notes && <div className="history-notes">{t.notes}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm">← Prev</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Next →</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
