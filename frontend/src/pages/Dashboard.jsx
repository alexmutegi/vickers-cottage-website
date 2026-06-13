import { useAuth } from '../context/AuthContext'
import './Dashboard.css'

export default function Dashboard() {
  const { user } = useAuth()

  const PHASE1_ITEMS = [
    { icon: '✅', label: 'Project Setup',        done: true  },
    { icon: '✅', label: 'Database Schema',       done: true  },
    { icon: '✅', label: 'Authentication System', done: true  },
    { icon: '⏳', label: 'Product Management',    done: false },
    { icon: '⏳', label: 'Supplier Management',   done: false },
    { icon: '⏳', label: 'Purchase Management',   done: false },
    { icon: '⏳', label: 'Point of Sale',         done: false },
    { icon: '⏳', label: 'Reporting',             done: false },
  ]

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Vickers Cottage Inventory & POS — Phase 1: Foundation</p>
        </div>
        <div className="phase-badge">Phase 1</div>
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        {[
          { icon: '📦', label: 'Total Products',     value: '—', sub: 'Phase 2' },
          { icon: '💰', label: "Today's Sales",       value: '—', sub: 'Phase 4' },
          { icon: '📊', label: 'Current Stock Value', value: '—', sub: 'Phase 2' },
          { icon: '⚠️', label: 'Low Stock Alerts',    value: '—', sub: 'Phase 2' },
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

      {/* Phase progress */}
      <div className="section-card">
        <h2>Development Roadmap</h2>
        <div className="roadmap">
          {PHASE1_ITEMS.map((item, i) => (
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
              <tr><td>Phase</td><td><strong>Phase 1 — Foundation</strong></td></tr>
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
              { icon: '📦', label: 'Products',    path: '/dashboard/products',  phase: '2' },
              { icon: '🚚', label: 'Suppliers',   path: '/dashboard/suppliers', phase: '3' },
              { icon: '💰', label: 'Point of Sale', path: '/dashboard/pos',     phase: '4' },
              { icon: '📈', label: 'Reports',     path: '/dashboard/reports',   phase: '5' },
            ].map(l => (
              <div key={l.label} className="quick-link disabled">
                <span>{l.icon}</span>
                <span>{l.label}</span>
                <span className="ql-phase">Phase {l.phase}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
