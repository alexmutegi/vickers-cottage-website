import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import './Status.css'

const REFRESH_INTERVAL = 30_000 // auto-refresh every 30s

export default function Status() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [lastChecked, setLastChecked] = useState(null)
  const [refreshing, setRefreshing]   = useState(false)

  const fetchStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const result = await api.get('/status')
      setData(result.data)
      setLastChecked(new Date())
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reach the API server')
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => fetchStatus(true), REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const statusColor = (ok) => ok ? '#1a7a4a' : '#c0392b'
  const statusLabel = (ok) => ok ? '● Operational' : '● Degraded'

  return (
    <div className="status-page">
      <div className="page-header">
        <div>
          <h1>System Status</h1>
          <p className="page-subtitle">Live API and database health monitoring</p>
        </div>
        <button
          className="btn-outline"
          onClick={() => fetchStatus(true)}
          disabled={refreshing || loading}
        >
          {refreshing ? '⟳ Checking…' : '⟳ Refresh'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
          <span className="error-hint"> — The API server may be starting up (Render free tier sleeps after 15 min).</span>
        </div>
      )}

      {loading && !data ? (
        <div className="loading-box"><div className="spinner" /> Checking system status…</div>
      ) : data && (
        <>
          {/* Overall status banner */}
          <div className={`status-banner ${data.status === 'healthy' ? 'healthy' : 'degraded'}`}>
            <span className="status-dot" />
            <span className="status-text">
              {data.status === 'healthy' ? 'All systems operational' : 'Partial system degradation'}
            </span>
            {lastChecked && (
              <span className="status-time">
                Last checked {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Service cards */}
          <div className="status-grid">
            <StatusCard
              title="API Server"
              icon="🚀"
              ok={true}
              detail={`v${data.version} · Node ${data.node_version}`}
              sub={data.environment}
            />
            <StatusCard
              title="Database"
              icon="🗄️"
              ok={data.database.ok}
              detail={data.database.ok ? 'PostgreSQL connected' : data.database.error}
              sub={data.database.ok ? `DB time: ${new Date(data.database.db_time).toLocaleTimeString()}` : 'Connection failed'}
            />
            <StatusCard
              title="Uptime"
              icon="⏱️"
              ok={true}
              detail={data.uptime_human}
              sub={`Started ${Math.floor(data.uptime_seconds / 3600)}h ago`}
            />
            <StatusCard
              title="Memory"
              icon="💾"
              ok={parseFloat(data.memory.heap_used_mb) < 400}
              detail={`${data.memory.heap_used_mb} MB used`}
              sub={`of ${data.memory.heap_total_mb} MB heap`}
            />
          </div>

          {/* DB pool */}
          <div className="section-card">
            <h2>Database Connection Pool</h2>
            <div className="pool-grid">
              <PoolStat label="Total"   value={data.database.pool.total}   color="var(--primary)" />
              <PoolStat label="Idle"    value={data.database.pool.idle}    color="#1a7a4a" />
              <PoolStat label="Waiting" value={data.database.pool.waiting} color={data.database.pool.waiting > 0 ? '#c0392b' : 'var(--text-muted)'} />
            </div>
          </div>

          {/* Version info */}
          <div className="section-card">
            <h2>Version Information</h2>
            <table className="info-table">
              <tbody>
                <tr><td>Application</td><td>Vickers Cottage Inventory & POS</td></tr>
                <tr><td>Version</td><td><strong>v{data.version}</strong></td></tr>
                <tr><td>Phase</td><td>Phase 7 — Production Hardening</td></tr>
                <tr><td>Environment</td><td><strong className="role-text">{data.environment}</strong></td></tr>
                <tr><td>Node.js</td><td>{data.node_version}</td></tr>
                <tr><td>API Timestamp</td><td>{new Date(data.timestamp).toLocaleString()}</td></tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function StatusCard({ title, icon, ok, detail, sub }) {
  return (
    <div className={`status-card ${ok ? 'ok' : 'degraded'}`}>
      <div className="status-card-icon">{icon}</div>
      <div className="status-card-body">
        <div className="status-card-title">{title}</div>
        <div className="status-card-indicator" style={{ color: ok ? '#1a7a4a' : '#c0392b' }}>
          {ok ? '● Operational' : '● Degraded'}
        </div>
        <div className="status-card-detail">{detail}</div>
        <div className="status-card-sub">{sub}</div>
      </div>
    </div>
  )
}

function PoolStat({ label, value, color }) {
  return (
    <div className="pool-stat">
      <div className="pool-stat-value" style={{ color }}>{value}</div>
      <div className="pool-stat-label">{label}</div>
    </div>
  )
}
