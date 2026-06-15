import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './layouts/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Products from './pages/Products'
import Categories from './pages/Categories'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import Purchases from './pages/Purchases'
import './pages/Login.css'
import './layouts/DashboardLayout.css'
import './pages/Users.css'
import './pages/Products.css'
import './pages/Categories.css'
import './pages/Inventory.css'
import './pages/Suppliers.css'
import './pages/Purchases.css'

// Placeholder pages for phases 3-5
const ComingSoon = ({ title }) => (
  <div style={{ padding: 40, textAlign: 'center', color: '#6b7c8d' }}>
    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚧</div>
    <h2 style={{ color: '#1e3a5f', marginBottom: 8 }}>{title}</h2>
    <p>This feature will be available in the next development phase.</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* All roles */}
          <Route element={<ProtectedRoute roles={['admin','manager','cashier']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/pos" element={<ComingSoon title="Point of Sale — Phase 4" />} />
            </Route>
          </Route>

          {/* Admin + Manager */}
          <Route element={<ProtectedRoute roles={['admin','manager']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/products"  element={<Products />} />
              <Route path="/dashboard/categories" element={<Categories />} />
              <Route path="/dashboard/inventory" element={<Inventory />} />
              <Route path="/dashboard/suppliers" element={<Suppliers />} />
              <Route path="/dashboard/purchases" element={<Purchases />} />
              <Route path="/dashboard/reports"   element={<ComingSoon title="Reports & Analytics — Phase 5" />} />
            </Route>
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard/users" element={<Users />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
