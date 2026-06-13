import { useState, useEffect } from 'react'
import api from '../api'
import './Users.css'

const ROLES = ['admin', 'manager', 'cashier']
const ROLE_COLORS = { admin: '#c0392b', manager: '#1a7a4a', cashier: '#1e3a5f' }

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'cashier' }

export default function Users() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users')
      setUsers(data.users)
    } catch (err) {
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const createUser = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await api.post('/users', form)
      setSuccess('User created successfully')
      setShowModal(false)
      setForm(EMPTY_FORM)
      fetchUsers()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleActive = async (id, is_active) => {
    try {
      await api.put(`/users/${id}`, { is_active: !is_active })
      fetchUsers()
    } catch {
      setError('Failed to update user')
    }
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p className="page-subtitle">Manage staff accounts and permissions</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowModal(true); setError('') }}>
          + Add User
        </button>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading users…</div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.full_name}</strong></td>
                  <td>{u.email}</td>
                  <td>
                    <span className="role-pill" style={{ background: ROLE_COLORS[u.role] }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${u.is_active ? 'active' : 'inactive'}`}>
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`btn-sm ${u.is_active ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleActive(u.id, u.is_active)}
                    >
                      {u.is_active ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={createUser} className="modal-form">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group">
                <label>Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handle} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input name="email" type="email" value={form.email} onChange={handle} required placeholder="john@vickerscottage.com" />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input name="password" type="password" value={form.password} onChange={handle} required placeholder="Min 8 chars, 1 uppercase, 1 number" />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={form.role} onChange={handle}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
