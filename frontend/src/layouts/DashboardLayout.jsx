import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './DashboardLayout.css'

const NAV_ITEMS = [
  { to: '/dashboard',           icon: '📊', label: 'Dashboard',   roles: ['admin','manager','cashier'] },
  { to: '/dashboard/products',  icon: '📦', label: 'Products',    roles: ['admin','manager'] },
  { to: '/dashboard/suppliers', icon: '🚚', label: 'Suppliers',   roles: ['admin','manager'] },
  { to: '/dashboard/purchases', icon: '🛒', label: 'Purchases',   roles: ['admin','manager'] },
  { to: '/dashboard/pos',       icon: '💰', label: 'Point of Sale', roles: ['admin','manager','cashier'] },
  { to: '/dashboard/inventory', icon: '📋', label: 'Inventory',   roles: ['admin','manager'] },
  { to: '/dashboard/reports',   icon: '📈', label: 'Reports',     roles: ['admin','manager'] },
  { to: '/dashboard/users',     icon: '👥', label: 'Users',       roles: ['admin'] },
]

const ROLE_BADGE = {
  admin:   { label: 'Administrator', color: '#c0392b' },
  manager: { label: 'Store Manager', color: '#1a7a4a' },
  cashier: { label: 'Cashier',       color: '#1e3a5f' },
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleLinks = NAV_ITEMS.filter(n => n.roles.includes(user?.role))
  const badge = ROLE_BADGE[user?.role] || {}

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🏪</span>
          <div>
            <div className="sidebar-title">Vickers Cottage</div>
            <div className="sidebar-subtitle">Management System</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleLinks.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.full_name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.full_name}</div>
              <span className="role-badge" style={{ background: badge.color }}>
                {badge.label}
              </span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>🚪 Sign Out</button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="main">
        <header className="topbar">
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
          <div className="topbar-right">
            <span className="topbar-user">👤 {user?.full_name}</span>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
