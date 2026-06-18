import { useState, useEffect, useCallback } from 'react'
import { ReportsAPI } from '../services/inventoryApi'
import './Reports.css'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Build an authenticated download URL by triggering a token-bearing fetch
const downloadExport = async (path) => {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Export failed')
  const disposition = res.headers.get('Content-Disposition') || ''
  const filename = disposition.match(/filename="(.+?)"/)?.[1] || 'export'
  const blob = await res.blob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function ExportButtons({ path }) {
  const [busy, setBusy] = useState(false)
  const doExport = async (fmt) => {
    setBusy(true)
    try { await downloadExport(`${path}?format=${fmt}`) }
    catch { alert('Export failed. Make sure you are online.') }
    finally { setBusy(false) }
  }
  return (
    <div className="export-buttons">
      <button className="btn-export" onClick={() => doExport('csv')} disabled={busy}>
        ⬇ CSV
      </button>
      <button className="btn-export btn-export-xlsx" onClick={() => doExport('xlsx')} disabled={busy}>
        📊 Excel
      </button>
    </div>
  )
}

const TABS = [
  { key: 'daily',    label: 'Daily Sales',    icon: '📅' },
  { key: 'monthly',  label: 'Monthly Sales',  icon: '📆' },
  { key: 'profit',   label: 'Profit',         icon: '📈' },
  { key: 'inventory', label: 'Inventory',     icon: '📦' },
  { key: 'lowstock', label: 'Low Stock',      icon: '⚠️' },
]

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

const fmt = (n) => `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const todayISO = () => new Date().toISOString().slice(0, 10)

export default function Reports() {
  const [tab, setTab] = useState('daily')

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="page-subtitle">Sales, profit, and inventory insights</p>
        </div>
      </div>

      <div className="report-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`report-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'daily'    && <DailySalesReport />}
      {tab === 'monthly'  && <MonthlySalesReport />}
      {tab === 'profit'   && <ProfitReport />}
      {tab === 'inventory' && <InventoryReport />}
      {tab === 'lowstock' && <LowStockReport />}
    </div>
  )
}

// ── Daily Sales ────────────────────────────────────────────────
function DailySalesReport() {
  const [date, setDate] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await ReportsAPI.getDailySales(date)
      setData(result)
    } catch {
      setError('Failed to load daily sales report')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchReport() }, [fetchReport])

  return (
    <div className="report-section">
      <div className="report-controls">
        <label>Date</label>
        <input type="date" value={date} max={todayISO()} onChange={e => setDate(e.target.value)} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading report…</div>
      ) : data && (
        <>
          <div className="stats-grid">
            <ReportCard icon="🧾" label="Transactions" value={data.transaction_count} />
            <ReportCard icon="💰" label="Total Sales" value={fmt(data.total_sales)} />
            <ReportCard icon="📈" label="Profit" value={fmt(data.total_profit)} positive={data.total_profit >= 0} />
            <ReportCard icon="📦" label="Items Sold" value={data.items_sold} />
          </div>

          <div className="section-card">
            <h2>Sales by Payment Method</h2>
            {data.by_payment_method.length === 0 ? (
              <p className="empty-cell">No sales recorded on this date</p>
            ) : (
              <table className="data-table">
                <thead><tr><th>Payment Method</th><th>Transactions</th><th>Total</th></tr></thead>
                <tbody>
                  {data.by_payment_method.map(pm => (
                    <tr key={pm.payment_method}>
                      <td className="capitalize">{pm.payment_method.replace('_', ' ')}</td>
                      <td>{pm.count}</td>
                      <td>{fmt(pm.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Monthly Sales ──────────────────────────────────────────────
function MonthlySalesReport() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await ReportsAPI.getMonthlySales(year, month)
      setData(result)
    } catch {
      setError('Failed to load monthly sales report')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { fetchReport() }, [fetchReport])

  const maxRevenue = data ? Math.max(1, ...data.daily.map(d => Number(d.revenue))) : 1
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="report-section">
      <div className="report-controls">
        <label>Month</label>
        <select value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <label>Year</label>
        <select value={year} onChange={e => setYear(Number(e.target.value))}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading report…</div>
      ) : data && (
        <>
          <div className="stats-grid">
            <ReportCard icon="🧾" label="Transactions" value={data.totals.transaction_count} />
            <ReportCard icon="💰" label="Revenue" value={fmt(data.totals.revenue)} />
            <ReportCard icon="💸" label="Cost" value={fmt(data.totals.cost)} />
            <ReportCard icon="📈" label="Profit" value={fmt(data.totals.profit)} positive={data.totals.profit >= 0} />
          </div>

          <div className="section-card">
            <h2>Daily Revenue — {MONTH_NAMES[month - 1]} {year}</h2>
            {data.totals.revenue === 0 ? (
              <p className="empty-cell">No sales recorded this month</p>
            ) : (
              <div className="bar-chart">
                {data.daily.map(d => {
                  const height = Math.max(2, (Number(d.revenue) / maxRevenue) * 100)
                  const dayNum = new Date(d.day).getDate()
                  return (
                    <div className="bar-wrapper" key={d.day} title={`${d.day}: ${fmt(d.revenue)}`}>
                      <div className="bar" style={{ height: `${height}%` }} />
                      <span className="bar-label">{dayNum}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="section-card">
            <h2>Daily Breakdown</h2>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Date</th><th>Transactions</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr></thead>
                <tbody>
                  {data.daily.filter(d => Number(d.revenue) > 0 || d.transaction_count > 0).length === 0 && (
                    <tr><td colSpan={5} className="empty-cell">No sales recorded this month</td></tr>
                  )}
                  {data.daily.filter(d => Number(d.revenue) > 0 || d.transaction_count > 0).map(d => (
                    <tr key={d.day}>
                      <td>{new Date(d.day).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</td>
                      <td>{d.transaction_count}</td>
                      <td>{fmt(d.revenue)}</td>
                      <td>{fmt(d.cost)}</td>
                      <td className={Number(d.profit) >= 0 ? 'text-positive' : 'text-negative'}>{fmt(d.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Profit Report ──────────────────────────────────────────────
function ProfitReport() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(todayISO())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await ReportsAPI.getProfit(startDate, endDate)
      setData(result)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profit report')
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

  useEffect(() => { fetchReport() }, [fetchReport])

  const margin = data && Number(data.summary.revenue) > 0
    ? (Number(data.summary.profit) / Number(data.summary.revenue)) * 100
    : 0

  return (
    <div className="report-section">
      <div className="report-controls">
        <label>From</label>
        <input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} />
        <label>To</label>
        <input type="date" value={endDate} max={todayISO()} min={startDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading report…</div>
      ) : data && (
        <>
          <div className="stats-grid">
            <ReportCard icon="🧾" label="Transactions" value={data.summary.transaction_count} />
            <ReportCard icon="💰" label="Revenue" value={fmt(data.summary.revenue)} />
            <ReportCard icon="💸" label="Cost" value={fmt(data.summary.cost)} />
            <ReportCard icon="📈" label="Profit" value={fmt(data.summary.profit)} positive={data.summary.profit >= 0} />
          </div>

          <div className="section-card">
            <h2>Profit Margin</h2>
            <div className="margin-display">
              <div className="margin-value" style={{ color: margin >= 0 ? '#1a7a4a' : '#c0392b' }}>
                {margin.toFixed(1)}%
              </div>
              <p className="margin-note">
                {margin >= 0
                  ? `For every KES 100 in sales, about KES ${margin.toFixed(0)} is profit.`
                  : 'Costs exceeded revenue for this period.'}
              </p>
            </div>
          </div>

          <div className="section-card">
            <div className="section-card-header">
              <h2>Profit by Product</h2>
              <ExportButtons path={`/exports/sales?start_date=${startDate}&end_date=${endDate}`} />
            </div>
            {data.by_product.length === 0 ? (
              <p className="empty-cell">No sales recorded in this date range</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table">
                  <thead><tr><th>Product</th><th>SKU</th><th>Units Sold</th><th>Revenue</th><th>Cost</th><th>Profit</th></tr></thead>
                  <tbody>
                    {data.by_product.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td><code>{p.sku}</code></td>
                        <td>{p.units_sold}</td>
                        <td>{fmt(p.revenue)}</td>
                        <td>{fmt(p.cost)}</td>
                        <td className={Number(p.profit) >= 0 ? 'text-positive' : 'text-negative'}>{fmt(p.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Inventory Report ───────────────────────────────────────────
function InventoryReport() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ReportsAPI.getInventory()
      .then(setData)
      .catch(() => setError('Failed to load inventory report'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="report-section">
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading report…</div>
      ) : data && (
        <>
          <div className="stats-grid">
            <ReportCard icon="📦" label="Total Products" value={data.overall.total_products} />
            <ReportCard icon="🧮" label="Total Units" value={data.overall.total_units} />
            <ReportCard icon="💸" label="Cost Value" value={fmt(data.overall.cost_value)} />
            <ReportCard icon="🏷️" label="Retail Value" value={fmt(data.overall.retail_value)} />
          </div>

          <div className="section-card">
            <div className="section-card-header">
              <h2>Inventory by Category</h2>
              <ExportButtons path="/exports/inventory" />
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Category</th><th>Products</th><th>Units in Stock</th><th>Cost Value</th><th>Retail Value</th><th>Potential Profit</th></tr></thead>
                <tbody>
                  {data.by_category.map(c => (
                    <tr key={c.category_name}>
                      <td><strong>{c.category_name}</strong></td>
                      <td>{c.product_count}</td>
                      <td>{c.total_units}</td>
                      <td>{fmt(c.cost_value)}</td>
                      <td>{fmt(c.retail_value)}</td>
                      <td className="text-positive">{fmt(Number(c.retail_value) - Number(c.cost_value))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Low Stock Report ───────────────────────────────────────────
function LowStockReport() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ReportsAPI.getLowStock()
      .then(d => setProducts(d.products))
      .catch(() => setError('Failed to load low stock report'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="report-section">
      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading-box"><div className="spinner" /> Loading report…</div>
      ) : (
        <div className="section-card">
          <div className="section-card-header">
            <h2>Products Below Reorder Level ({products.length})</h2>
            {products.length > 0 && <ExportButtons path="/exports/low-stock" />}
          </div>
          {products.length === 0 ? (
            <p className="empty-cell">🎉 All products are above their reorder level</p>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Shortfall</th></tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.name}</strong></td>
                      <td><code>{p.sku}</code></td>
                      <td>{p.category_name || '—'}</td>
                      <td className="text-negative">{p.stock_quantity}</td>
                      <td>{p.reorder_level}</td>
                      <td className="text-negative">{Math.max(0, p.reorder_level - p.stock_quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Shared card component ──────────────────────────────────────
function ReportCard({ icon, label, value, positive }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className={`stat-value ${positive === false ? 'text-negative' : positive === true ? 'text-positive' : ''}`}>
          {value}
        </div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
