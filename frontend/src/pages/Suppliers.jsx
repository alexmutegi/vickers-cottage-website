import { useState, useEffect, useCallback, Fragment } from 'react'
import { SuppliersAPI } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'
import './Suppliers.css'

const EMPTY_FORM = { supplier_name: '', phone: '', email: '', address: '' }

export default function Suppliers() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [suppliers, setSuppliers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage]   = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')

  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError]   = useState('')

  // History panel
  const [historyFor, setHistoryFor] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchSuppliers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await SuppliersAPI.getAll({ search: search || undefined, page, limit })
      setSuppliers(result.suppliers)
      setTotal(result.total)
    } catch {
      setError('Failed to load suppliers')
    } finally {
      setLoading(false)
    }
  }, [search, page, limit])

  useEffect(() => {
    const t = setTimeout(fetchSuppliers, 300)
    return () => clearTimeout(t)
  }, [fetchSuppliers])

  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowModal(true)
  }

  const openEdit = (s) => {
    setEditingId(s.id)
    setForm({
      supplier_name: s.supplier_name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
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
      if (editingId) {
        await SuppliersAPI.update(editingId, form)
        setSuccess('Supplier updated')
      } else {
        await SuppliersAPI.create(form)
        setSuccess('Supplier added')
      }
      setShowModal(false)
      fetchSuppliers()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save supplier')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this supplier?')) return
    try {
      await SuppliersAPI.remove(id)
      setSuccess('Supplier deactivated')
      fetchSuppliers()
    } catch {
      setError('Failed to delete supplier')
    }
  }

  const toggleHistory = async (s) => {
    if (historyFor === s.id) {
      setHistoryFor(null)
      return
    }
    setHistoryFor(s.id)
    setHistoryLoading(true)
    try {
      const { history } = await SuppliersAPI.getOne(s.id)
      setHistory(history)
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <div>
          <h1>Suppliers</h1>
          <p className="page-subtitle">Manage beverage suppliers and view purchase history</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Supplier</button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="filter-input"
        />
      </div>

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading suppliers…</div>
      ) : (
        <>
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Purchases</th>
                  <th>Total Spent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 && (
                  <tr><td colSpan={6} className="empty-cell">No suppliers found</td></tr>
                )}
                {suppliers.map(s => (
                  <Fragment key={s.id}>
                    <tr>
                      <td><strong>{s.supplier_name}</strong></td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.email || '—'}</td>
                      <td>{s.purchase_count}</td>
                      <td>KES {Number(s.total_purchased).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="actions-cell">
                        <button className="btn-sm btn-edit" onClick={() => openEdit(s)}>Edit</button>
                        <button className="btn-sm btn-outline-sm" onClick={() => toggleHistory(s)}>
                          {historyFor === s.id ? 'Hide' : 'History'}
                        </button>
                        {isAdmin && (
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(s.id)}>Remove</button>
                        )}
                      </td>
                    </tr>
                    {historyFor === s.id && (
                      <tr className="history-row">
                        <td colSpan={6}>
                          {historyLoading ? (
                            <div className="loading-box"><div className="spinner" /> Loading history…</div>
                          ) : history.length === 0 ? (
                            <p className="empty-cell">No purchases recorded from this supplier yet</p>
                          ) : (
                            <table className="sub-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Items</th>
                                  <th>Total Cost</th>
                                  <th>Recorded By</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {history.map(h => (
                                  <tr key={h.id}>
                                    <td>{new Date(h.purchase_date).toLocaleDateString()}</td>
                                    <td>{h.item_count}</td>
                                    <td>KES {Number(h.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    <td>{h.created_by_name || '—'}</td>
                                    <td>{h.notes || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
            <span>Page {page} of {totalPages} · {total} suppliers</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="btn-outline btn-sm">Next →</button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={submit} className="modal-form">
              {formError && <div className="alert alert-error">{formError}</div>}

              <div className="form-group">
                <label>Supplier Name</label>
                <input name="supplier_name" value={form.supplier_name} onChange={handle} required placeholder="e.g. EABL Distributors Ltd" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input name="phone" value={form.phone} onChange={handle} placeholder="e.g. 0712 345 678" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handle} placeholder="e.g. orders@supplier.com" />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input name="address" value={form.address} onChange={handle} placeholder="e.g. Industrial Area, Nairobi" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving…' : editingId ? 'Update Supplier' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
