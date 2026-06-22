import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { ProductsAPI, CategoriesAPI, SalesAPI } from '../services/inventoryApi'
import MpesaModal from '../components/MpesaModal'
import Receipt from '../components/Receipt'
import './POS.css'

// Lazy-load the barcode scanner — ZXing is ~400KB so we only load it on demand
const BarcodeScanner = lazy(() => import('../components/BarcodeScanner'))

const PAYMENT_METHODS = [
  { key: 'cash',         label: 'Cash',         icon: '💵' },
  { key: 'card',         label: 'Card',         icon: '💳' },
  { key: 'mobile_money', label: 'M-Pesa',       icon: '📱' },
]

export default function POS() {
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch]         = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading]       = useState(true)

  const [cart, setCart]             = useState([])
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [checkingOut, setCheckingOut] = useState(false)
  const [error, setError]           = useState('')

  const [showScanner, setShowScanner] = useState(false)
  const [showMpesa, setShowMpesa]     = useState(false)
  const [receiptSale, setReceiptSale] = useState(null)

  // Mobile: toggle cart view on small screens
  const [cartOpen, setCartOpen] = useState(false)

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
    if (product.stock_quantity <= 0) return
    setError('')
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id)
      if (existing) {
        if (existing.quantity >= product.stock_quantity) return prev
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const handleBarcodeScan = async (text) => {
    setShowScanner(false)
    // Search by SKU
    try {
      const result = await ProductsAPI.getAll({ search: text, limit: 1 })
      const match = result.products.find(p => p.sku === text) || result.products[0]
      if (match) {
        addToCart(match)
        setSearch(text)
        setTimeout(() => setSearch(''), 1500)
      } else {
        setError(`No product found for barcode: ${text}`)
      }
    } catch {
      setError('Barcode lookup failed')
    }
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
  const clearCart = () => { setCart([]); setCartOpen(false) }

  const cartTotal  = cart.reduce((sum, c) => sum + Number(c.product.selling_price) * c.quantity, 0)
  const cartUnits  = cart.reduce((sum, c) => sum + c.quantity, 0)

  const completeSale = async () => {
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
      setCartOpen(false)
      fetchProducts()
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed')
    } finally {
      setCheckingOut(false)
    }
  }

  const handleCheckout = () => {
    if (paymentMethod === 'mobile_money') {
      setShowMpesa(true)
    } else {
      completeSale()
    }
  }

  const handleMpesaSuccess = () => {
    setShowMpesa(false)
    completeSale()
  }

  return (
    <div className="pos-page">
      {/* ── Product panel ──────────────────────────────────── */}
      <div className="pos-products">
        <div className="pos-topbar">
          <div className="pos-title-row">
            <h1>Point of Sale</h1>
            {/* Mobile cart button */}
            <button className="cart-toggle-btn" onClick={() => setCartOpen(true)}>
              🛒 Cart
              {cartUnits > 0 && <span className="cart-toggle-badge">{cartUnits}</span>}
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="pos-search-row">
            <input
              type="text"
              placeholder="Search by name or SKU…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="filter-input"
            />
            <button
              className="btn-scan"
              onClick={() => setShowScanner(true)}
              title="Scan barcode"
            >
              📷 Scan
            </button>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
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
                  {inCart && <div className="tile-qty-badge">{inCart.quantity}</div>}
                  <div className="tile-name">{p.name}</div>
                  <div className="tile-sku">{p.sku}</div>
                  <div className="tile-price">KES {Number(p.selling_price).toFixed(2)}</div>
                  <div className={`tile-stock ${outOfStock ? 'zero' : p.stock_quantity <= p.reorder_level ? 'low' : ''}`}>
                    {outOfStock ? 'Out of stock' : `${p.stock_quantity} left`}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Cart sidebar ───────────────────────────────────── */}
      <div className={`pos-cart ${cartOpen ? 'cart-open' : ''}`}>
        <div className="cart-header">
          <h2>🛒 Cart {cartUnits > 0 && <span className="cart-count">{cartUnits}</span>}</h2>
          <div className="cart-header-actions">
            {cart.length > 0 && <button className="btn-clear-cart" onClick={clearCart}>Clear</button>}
            <button className="cart-close-btn" onClick={() => setCartOpen(false)}>✕</button>
          </div>
        </div>

        <div className="cart-items">
          {cart.length === 0 && (
            <p className="cart-empty">Cart is empty — tap a product to add it</p>
          )}
          {cart.map(c => (
            <div className="cart-item" key={c.product.id}>
              <div className="cart-item-info">
                <div className="cart-item-name">{c.product.name}</div>
                <div className="cart-item-price">
                  KES {Number(c.product.selling_price).toFixed(2)} each
                </div>
              </div>
              <div className="cart-item-controls">
                <button onClick={() => updateQuantity(c.product.id, -1)}>−</button>
                <span>{c.quantity}</span>
                <button
                  onClick={() => updateQuantity(c.product.id, 1)}
                  disabled={c.quantity >= c.product.stock_quantity}
                >+</button>
              </div>
              <div className="cart-item-total">
                KES {(Number(c.product.selling_price) * c.quantity).toFixed(2)}
              </div>
              <button className="cart-item-remove" onClick={() => removeFromCart(c.product.id)}>✕</button>
            </div>
          ))}
        </div>

        <div className="cart-footer">
          <div className="cart-summary">
            <div className="cart-summary-row">
              <span>Items</span><span>{cartUnits}</span>
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

          <button
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0 || checkingOut}
          >
            {checkingOut
              ? 'Processing…'
              : paymentMethod === 'mobile_money'
                ? `📱 Send M-Pesa Request`
                : `Complete Sale — KES ${cartTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
            }
          </button>
        </div>
      </div>

      {/* Mobile cart overlay backdrop */}
      {cartOpen && <div className="cart-backdrop" onClick={() => setCartOpen(false)} />}

      {/* ── Modals ─────────────────────────────────────────── */}
      {showScanner && (
        <Suspense fallback={<div className="loading-box"><div className="spinner" /> Loading scanner…</div>}>
          <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}

      {showMpesa && (
        <MpesaModal
          amount={cartTotal}
          onSuccess={handleMpesaSuccess}
          onClose={() => setShowMpesa(false)}
        />
      )}

      {receiptSale && (
        <Receipt sale={receiptSale} onClose={() => setReceiptSale(null)} />
      )}
    </div>
  )
}
