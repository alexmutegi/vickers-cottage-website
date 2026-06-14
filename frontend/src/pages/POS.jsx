import { useState, useEffect, useCallback } from 'react'
import { ProductsAPI, CategoriesAPI, SalesAPI } from '../services/inventoryApi'
import Receipt from '../components/Receipt'
import './POS.css'

const PAYMENT_METHODS = [
  { key: 'cash',         label: 'Cash',         icon: '💵' },
  { key: 'card',         label: 'Card',         icon: '💳' },
  { key: 'mobile_money', label: 'Mobile Money', icon: '📱' },
]

export default function POS() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [cart, setCart] = useState([]) // [{ product, quantity }]
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError] = useState('')

  const [receiptSale, setReceiptSale] = useState(null) // completed sale for receipt modal

  const fetchCategories = useCallback(async () => {
    try {
      const { categories } = await CategoriesAPI.getAll()
      setCategories(categories)
    } catch { /* ignore */ }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const result = await ProductsAPI.getAll({
        search: search || undefined,
        category_id: categoryFilter || undefined,
        limit: 60,
      })
      setProducts(result.products)
    } catch {
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, categoryFilter])

  useEffect(() => { fetchCategories() }, [fetchCategories])
  useEffect(() => {
    const t = setTimeout(fetchProducts, 250)
    return () => clearTimeout(t)
  }, [fetchProducts])

  const addToCart = (product) => {
    setError('')
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      if (product.stock_quantity <= 0) return prev
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev
      .map(c => {
        if (c.product.id !== productId) return c
        const newQty = c.quantity + delta
        if (newQty <= 0) return null
        if (newQty > c.product.stock_quantity) return c
        return { ...c, quantity: newQty }
      })
      .filter(Boolean)
    )
  }

  const removeFromCart = (productId) => setCart(prev => prev.filter(c => c.product.id !== productId))
  const clearCart = () => setCart([])

  const cartTotal = cart.reduce((sum, c) => sum + Number(c.product.selling_price) * c.quantity, 0)
  const cartUnits = cart.reduce((sum, c) => sum + c.quantity, 0)

  const checkout = async () => {
    if (cart.length === 0) return
    setCheckingOut(true)
    setError('')
    try {
      const result = await SalesAPI.create({
        payment_method: paymentMethod,
        items: cart.map(c => ({ product_id: c.product.id, quantity: c.quantity })),
      })
      setReceiptSale(result)
      setCart([])
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }

  return (
    <div className="pos-page">
      <div className="pos-products">
        <div className="page-header">
          <div>
            <h1>Point of Sale</h1>
            <p className="page-subtitle">Search products, add to cart, and process payment</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="filters-bar">
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="filter-input"
            autoFocus
          />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="filter-select">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-box"><div className="spinner" /> Loading products…</div>
        ) : (
          <div className="product-grid">
            {products.length === 0 && <p className="empty-cell">No products found</p>}
            {products.map(p => {
              const outOfStock = p.stock_quantity <= 0
              const inCart = cart.find(c => c.product.id === p.id)
              return (
                <button
                  key={p.id}
                  className={`product-tile ${outOfStock ? 'out-of-stock' : ''} ${inCart ? 'in-cart' : ''}`}
                  onClick={() => addToCart(p)}
                  disabled={outOfStock}
                >
                  <div className="tile-name">{p.name}</div>
                  <div className="tile-sku">{p.sku}</div>
                  <div className="tile-price">KES {Number(p.selling_price).toFixed(2)}</div>
                  <div className={`tile-stock ${outOfStock ? 'zero' : p.stock_quantity <= p.reorder_level ? 'low' : ''}`}>
                    {outOfStock ? 'Out of stock' : `${p.stock_quantity} in stock`}
                  </div>
                  {inCart && <div className="tile-qty-badge">{inCart.quantity}</div>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart sidebar */}
      <div className="pos-cart">
        <div className="cart-header">
          <h2>🛒 Cart</h2>
          {cart.length > 0 && <button className="btn-clear-cart" onClick={clearCart}>Clear</button>}
        </div>

        <div className="cart-items">
          {cart.length === 0 && <p className="cart-empty">Cart is empty — tap a product to add it</p>}
          {cart.map(c => (
            <div className="cart-item" key={c.product.id}>
              <div className="cart-item-info">
                <div className="cart-item-name">{c.product.name}</div>
                <div className="cart-item-price">KES {Number(c.product.selling_price).toFixed(2)} each</div>
              </div>
              <div className="cart-item-controls">
                <button onClick={() => updateQuantity(c.product.id, -1)}>−</button>
                <span>{c.quantity}</span>
                <button onClick={() => updateQuantity(c.product.id, 1)} disabled={c.quantity >= c.product.stock_quantity}>+</button>
              </div>
              <div className="cart-item-total">KES {(Number(c.product.selling_price) * c.quantity).toFixed(2)}</div>
              <button className="cart-item-remove" onClick={() => removeFromCart(c.product.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <div className="cart-summary-row">
            <span>Items</span>
            <span>{cartUnits}</span>
          </div>
          <div className="cart-summary-row total">
            <span>Total</span>
            <span>KES {cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="payment-methods">
          {PAYMENT_METHODS.map(pm => (
            <button
              key={pm.key}
              className={`payment-btn ${paymentMethod === pm.key ? 'active' : ''}`}
              onClick={() => setPaymentMethod(pm.key)}
            >
              {pm.icon} {pm.label}
            </button>
          ))}
        </div>

        <button className="btn-checkout" onClick={checkout} disabled={cart.length === 0 || checkingOut}>
          {checkingOut ? 'Processing…' : `Complete Sale — KES ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        </button>
      </div>

      {receiptSale && (
        <Receipt sale={receiptSale} onClose={() => setReceiptSale(null)} />
      )}
    </div>
  )
}
