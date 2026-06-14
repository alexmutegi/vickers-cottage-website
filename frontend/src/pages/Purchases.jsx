import { useState, useEffect, useCallback, Fragment } from 'react'
import { PurchasesAPI, SuppliersAPI, ProductsAPI } from '../services/inventoryApi'
import './Purchases.css'

const EMPTY_ITEM = { product_id: '', product_label: '', quantity: '', cost: '' }

export default function Purchases() {
  const [purchases, setPurchases] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [limit] = useState(20)

  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  const [productResults, setProductResults] = useState({}) // { rowIndex: [products] }
  const [productSearch, setProductSearch] = useState({})    // { rowIndex: searchText }

  // Expanded purchase detail
  const [expandedId, setExpandedId] = useState(null)
  const [expandedData, setExpandedData] = useState(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

  const fetchPurchases = useCallback(async () => {
    setLoading(true)
    try {
      const result = await PurchasesAPI.getAll({ page, limit })
      setPurchases(result.purchases)
      setTotal(result.total)
    } catch {
      setError('Failed to load purchases')
    } finally {
      setLoading(false)
    }
  }, [page, limit])

  const fetchSuppliers = useCallback(async () => {
    try {
      const { suppliers } = await SuppliersAPI.getAll({ limit: 100 })
      setSuppliers(suppliers)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchPurchases() }, [fetchPurchases])
  useEffect(() => { fetchSuppliers() }, [fetchSuppliers])

  const openCreate = () => {
    setSupplierId('')
    setPurchaseDate(new Date().toISOString().slice(0, 10))
    setNotes('')
    setItems([{ ...EMPTY_ITEM }])
    setProductResults({})
    setProductSearch({})
    setFormError('')
    setShowModal(true)
  }

  const searchProducts = async (rowIndex, query) => {
    setProductSearch(prev => ({ ...prev, [rowIndex]: query }))
    if (!query) {
      setProductResults(prev => ({ ...prev, [rowIndex]: [] }))
      return
    }
    try {
      const result = await ProductsAPI.getAll({ search: query, limit: 8 })
      setProductResults(prev => ({ ...prev, [rowIndex]: result.products }))
    } catch { /* ignore */ }
  }

  const selectProduct = (rowIndex, product) => {
    const newItems = [...items]
    newItems[rowIndex] = {
      ...newItems[rowIndex],
      product_id: product.id,
      product_label: `${product.name} (${product.sku})`,
      cost: newItems[rowIndex].cost || product.purchase_price,
    }
    setItems(newItems)
    setProductResults(prev => ({ ...prev, [rowIndex]: [] }))
    setProductSearch(prev => ({ ...prev, [rowIndex]: '' }))
  }

  const updateItem = (rowIndex, field, value) => {
    const newItems = [...items]
    newItems[rowIndex] = { ...newItems[rowIndex], [field]: value }
    setItems(newItems)
  }

  const addRow = () => setItems([...items, { ...EMPTY_ITEM }])
  const removeRow = (rowIndex) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== rowIndex))
  }

  const totalCost = items.reduce((sum, it) => {
    const q = Number(it.quantity) || 0
    const c = Number(it.cost) || 0
    return sum + q * c
  }, 0)

  const submit = async (e) => {
    e.preventDefault()
    setFormError('')

    const validItems = items.filter(it => it.product_id && it.quantity && it.cost !== '')
    if (validItems.length === 0) {
      setFormError('Add at least one valid product line item')
      return
    }

    setSubmitting(true)
    try {
      await PurchasesAPI.create({
        supplier_id: supplierId || null,
        purchase_date: purchaseDate,
        notes: notes || undefined,
        items: validItems.map(it => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          cost: Number(it.cost),
        })),
      })
      setSuccess('Purchase recorded — inventory updated')
      setShowModal(false)
      setPage(1)
      fetchPurchases()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to record purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleExpand = async (p) => {
    if (expandedId === p.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(p.id)
    setExpandedLoading(true)
    try {
      const { purchase } = await PurchasesAPI.getOne(p.id)
      setExpandedData(purchase)
    } catch {
      setExpandedData(null)
    } finally {
      setExpandedLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="purchases-page">
      <div className="page-header">
        <div>
          <h1>Purchase Management</h1>
          <p className="page-subtitle">Record stock purchases from suppliers — inventory updates automatically</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Record Purchase</button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading purchases…</div>
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total Cost</th>
                  <th>Recorded By</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 && (
                  <tr><td colSpan={6} className="empty-cell">No purchases recorded yet</td></tr>
                )}
                {purchases.map(p => (
                  <Fragment key={p.id}>
                    <tr className="clickable-row" onClick={() => toggleExpand(p)}>
                      <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                      <td>{p.supplier_name || <span className="muted">No supplier</span>}</td>
                      <td>{p.item_count} item{p.item_count !== 1 ? 's' : ''}</td>
                      <td><strong>KES {Number(p.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong></td>
                      <td>{p.created_by_name || '—'}</td>
                      <td className="expand-cell">{expandedId === p.id ? '▲' : '▼'}</td>
                    </tr>
                    {expandedId === p.id && (
                      <tr className="detail-row">
                        <td colSpan={6}>
                          {expandedLoading ? (
                            <div className="loading-box"><div className="spinner" /> Loading details…</div>
                          ) : expandedData ? (
                            <div className="purchase-detail">
                              {expandedData.notes && <p className="detail-notes"><strong>Notes:</strong> {expandedData.notes}</p>}
                              <table className="sub-table">
                                <thead>
                                  <tr>
                                    <th>Product</th>
                                    <th>SKU</th>
                                    <th>Quantity</th>
                                    <th>Unit Cost</th>
                                    <th>Line Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {expandedData.items.map(item => (
                                    <tr key={item.id}>
                                      <td>{item.product_name}</td>
                                      <td><code>{item.sku}</code></td>
                                      <td>{item.quantity}</td>
                                      <td>KES {Number(item.cost).toFixed(2)}</td>
                                      <td>KES {(Number(item.cost) * item.quantity).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="empty-cell">Failed to load details</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-outline btn-sm">← Prev</button>
            <span>Page {page} of {totalPages} · {total} purchases</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Next →</button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record New Purchase</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="modal-form">
              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Supplier (optional)</label>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                    <option value="">— None —</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Purchase Date</label>
                  <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label>Notes (optional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Invoice #INV-2026-104" />
              </div>

              <div className="form-group">
                <label>Items</label>
                <div className="items-table">
                  <div className="items-header">
                    <span>Product</span>
                    <span>Quantity</span>
                    <span>Unit Cost (KES)</span>
                    <span>Line Total</span>
                    <span></span>
                  </div>
                  {items.map((item, idx) => (
                    <div className="item-row" key={idx}>
                      <div className="product-search-wrapper">
                        <input
                          type="text"
                          placeholder={item.product_label || 'Search product...'}
                          value={productSearch[idx] || ''}
                          onChange={e => searchProducts(idx, e.target.value)}
                        />
                        {item.product_label && !productSearch[idx] && (
                          <div className="selected-product">{item.product_label}</div>
                        )}
                        {productResults[idx]?.length > 0 && (
                          <div className="product-dropdown">
                            {productResults[idx].map(p => (
                              <div key={p.id} className="product-option" onClick={() => selectProduct(idx, p)}>
                                {p.name} <span className="muted">({p.sku})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="number" min="1" placeholder="0"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', e.target.value)}
                      />
                      <input
                        type="number" min="0" step="0.01" placeholder="0.00"
                        value={item.cost}
                        onChange={e => updateItem(idx, 'cost', e.target.value)}
                      />
                      <div className="line-total">
                        {((Number(item.quantity) || 0) * (Number(item.cost) || 0)).toFixed(2)}
                      </div>
                      <button type="button" className="btn-remove-row" onClick={() => removeRow(idx)} disabled={items.length === 1}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="btn-outline-sm btn-add-row" onClick={addRow}>+ Add Item</button>
              </div>

              <div className="purchase-total">
                Total: <strong>KES {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Recording…' : 'Record Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
