import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { ProductsAPI, SalesAPI } from '../services/inventoryApi'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()
  const canViewInventory = user?.role === 'admin' || user?.role === 'manager'

  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [salesSummary, setSalesSummary] = useState(null)
  const [loading, setLoading] = useState(canViewInventory)

  useEffect(() => {
    if (!canViewInventory) return
    Promise.all([
      ProductsAPI.getInventoryValue(),
      ProductsAPI.getLowStock(),
      SalesAPI.getDashboardSummary(),
    ])
      .then(([value, low, sales]) => {
        setStats(value)
        setLowStock(low.products)
        setSalesSummary(sales)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [canViewInventory])

  const PHASE_ITEMS = [
    { icon: '✅', label: 'Project Setup',        done: true  },
    { icon: '✅', label: 'Database Schema',       done: true  },
    { icon: '✅', label: 'Authentication System', done: true  },
    { icon: '✅', label: 'Product Management',    done: true  },
    { icon: '✅', label: 'Categories',            done: true  },
    { icon: '✅', label: 'Inventory Tracking',    done: true  },
    { icon: '✅', label: 'Supplier Management',   done: true  },
    { icon: '✅', label: 'Purchase Management',   done: true  },
    { icon: '✅', label: 'Point of Sale',         done: true  },
    { icon: '✅', label: 'Reporting',             done: true  },
    { icon: '✅', label: 'Mobile Optimisation',   done: true  },
    { icon: '✅', label: 'Barcode Scanner',        done: true  },
    { icon: '✅', label: 'M-Pesa Integration',     done: true  },
    { icon: '✅', label: 'CSV / Excel Exports',    done: true  },
  ]

  const fmt = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Vickers Cottage Inventory & POS — Phase 6: Advanced Features</p>
        </div>
        <div className="phase-badge">Phase 6</div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        {[
          { icon: '💰', label: "Today's Sales",       value: loading ? '…' : (canViewInventory ? fmt(salesSummary?.today?.total_sales) : '—'), sub: canViewInventory ? 'Live' : 'Phase 4' },
          { icon: '📈', label: "Today's Profit",      value: loading ? '…' : (canViewInventory ? fmt(salesSummary?.today?.total_profit) : '—'), sub: canViewInventory ? 'Live' : 'Phase 4' },
          { icon: '📊', label: 'Inventory Value (Cost)', value: loading ? '…' : (canViewInventory ? fmt(stats?.total_cost_value) : '—'), sub: canViewInventory ? 'Live' : 'Phase 2' },
          { icon: '⚠️', label: 'Low Stock Alerts',    value: loading ? '…' : (canViewInventory ? lowStock.length : '—'), sub: canViewInventory ? 'Live' : 'Phase 2' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-body">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-phase">{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Low stock alert banner */}
      {canViewInventory && !loading && lowStock.length > 0 && (
        <div className="section-card low-stock-banner">
          <h2>⚠️ Low Stock Alerts ({lowStock.length})</h2>
          <div className="low-stock-list">
            {lowStock.slice(0, 6).map(p => (
              <div key={p.id} className="low-stock-item">
                <span className="low-stock-name">{p.name}</span>
                <span className="low-stock-qty">{p.stock_quantity} / {p.reorder_level} reorder</span>
              </div>
            ))}
          </div>
          {lowStock.length > 6 && (
            <p className="low-stock-more">+ {lowStock.length - 6} more — view full list on the Products page</p>
          )}
        </div>
      )}

      {/* Sales insights */}
      {canViewInventory && !loading && salesSummary && (
        <div className="info-grid">
          <div className="section-card">
            <h2>🏆 Top-Selling Products (30 days)</h2>
            {salesSummary.topProducts.length === 0 ? (
              <p className="empty-cell">No sales recorded yet</p>
            ) : (
              <div className="top-products-list">
                {salesSummary.topProducts.map((p, i) => (
                  <div key={p.id} className="top-product-item">
                    <span className="top-product-rank">#{i + 1}</span>
                    <div className="top-product-info">
                      <div className="top-product-name">{p.name}</div>
                      <div className="top-product-sku">{p.sku}</div>
                    </div>
                    <div className="top-product-stats">
                      <div className="top-product-units">{p.units_sold} sold</div>
                      <div className="top-product-revenue">{fmt(p.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section-card">
            <h2>🧾 Recent Sales</h2>
            {salesSummary.recentSales.length === 0 ? (
              <p className="empty-cell">No sales recorded yet</p>
            ) : (
              <div className="recent-sales-list">
                {salesSummary.recentSales.map(s => (
                  <div key={s.id} className="recent-sale-item">
                    <div className="recent-sale-info">
                      <div className="recent-sale-amount">{fmt(s.total_amount)}</div>
                      <div className="recent-sale-meta">
                        {s.item_count} item{s.item_count !== 1 ? 's' : ''} · {s.cashier_name || '—'}
                      </div>
                    </div>
                    <div className="recent-sale-right">
                      <span className={`payment-pill payment-${s.payment_method}`}>
                        {s.payment_method.replace('_', ' ')}
                      </span>
                      <div className="recent-sale-time">{new Date(s.sale_date).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase progress */}
      <div className="section-card">
        <h2>Development Roadmap</h2>
        <div className="roadmap">
          {PHASE_ITEMS.map((item, i) => (
            <div key={i} className={`roadmap-item ${item.done ? 'done' : 'pending'}`}>
              <span className="roadmap-icon">{item.icon}</span>
              <span className="roadmap-label">{item.label}</span>
              <span className="roadmap-status">{item.done ? 'Complete' : 'Upcoming'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="info-grid">
        <div className="section-card">
          <h2>System Information</h2>
          <table className="info-table">
            <tbody>
              <tr><td>Project</td><td>Vickers Cottage Inventory & POS</td></tr>
              <tr><td>Phase</td><td><strong>Phase 6 — Advanced Features</strong></td></tr>
              <tr><td>Frontend</td><td>React + Vite</td></tr>
              <tr><td>Backend</td><td>Node.js + Express</td></tr>
              <tr><td>Database</td><td>PostgreSQL (Supabase)</td></tr>
              <tr><td>Auth</td><td>JWT + bcrypt</td></tr>
              <tr><td>Your Role</td><td><strong className="role-text">{user?.role}</strong></td></tr>
            </tbody>
          </table>
        </div>

        <div className="section-card">
          <h2>Quick Access</h2>
          <div className="quick-links">
            {[
              { icon: '💰', label: 'Point of Sale', path: '/dashboard/pos',       active: true },
              { icon: '📦', label: 'Products',    path: '/dashboard/products',  active: true },
              { icon: '🏷️', label: 'Categories',  path: '/dashboard/categories', active: true },
              { icon: '📋', label: 'Inventory',   path: '/dashboard/inventory',  active: true },
              { icon: '🚚', label: 'Suppliers',   path: '/dashboard/suppliers', active: true },
              { icon: '🛒', label: 'Purchases',   path: '/dashboard/purchases', active: true },
              { icon: '📈', label: 'Reports',     path: '/dashboard/reports',   active: true },
            ].map(l => (
              l.active ? (
                <a key={l.label} href={l.path} className="quick-link">
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                  <span className="ql-phase ql-live">Live</span>
                </a>
              ) : (
                <div key={l.label} className="quick-link disabled">
                  <span>{l.icon}</span>
                  <span>{l.label}</span>
                  <span className="ql-phase">Phase {l.phase}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
