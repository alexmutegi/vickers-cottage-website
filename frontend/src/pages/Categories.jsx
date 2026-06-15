import { useState, useEffect } from 'react'
import { CategoriesAPI } from '../services/inventoryApi'
import { useAuth } from '../context/AuthContext'
import './Categories.css'

export default function Categories() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')

  const [newName, setNewName]   = useState('')
  const [adding, setAdding]     = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName]   = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { categories } = await CategoriesAPI.getAll()
      setCategories(categories)
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    try {
      await CategoriesAPI.create(newName.trim())
      setSuccess('Category added')
      setNewName('')
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add category')
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditName(c.name)
    setError('')
  }

  const saveEdit = async () => {
    if (!editName.trim()) return
    try {
      await CategoriesAPI.update(editingId, editName.trim())
      setSuccess('Category updated')
      setEditingId(null)
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update category')
    }
  }

  const handleDelete = async (c) => {
    if (c.product_count > 0) {
      setError(`Cannot delete "${c.name}" — it has ${c.product_count} product(s) assigned.`)
      return
    }
    if (!window.confirm(`Delete category "${c.name}"?`)) return
    try {
      await CategoriesAPI.remove(c.id)
      setSuccess('Category deleted')
      fetchCategories()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category')
    }
  }

  return (
    <div className="categories-page">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p className="page-subtitle">Organize products into beverage categories</p>
        </div>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Add new category */}
      <form className="add-category-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="New category name (e.g. Cider)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button type="submit" className="btn-primary" disabled={adding || !newName.trim()}>
          {adding ? 'Adding…' : '+ Add Category'}
        </button>
      </form>

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading categories…</div>
      ) : (
        <div className="categories-grid">
          {categories.map(c => (
            <div key={c.id} className="category-card">
              {editingId === c.id ? (
                <div className="category-edit-row">
                  <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus />
                  <button className="btn-sm btn-success" onClick={saveEdit}>Save</button>
                  <button className="btn-sm btn-outline-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <>
                  <div className="category-info">
                    <div className="category-name">{c.name}</div>
                    <div className="category-count">{c.product_count} product{c.product_count !== 1 ? 's' : ''}</div>
                  </div>
                  <div className="category-actions">
                    <button className="btn-sm btn-edit" onClick={() => startEdit(c)}>Rename</button>
                    {isAdmin && (
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => handleDelete(c)}
                        disabled={c.product_count > 0}
                        title={c.product_count > 0 ? 'Remove products from this category first' : 'Delete category'}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
