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
import POS from './pages/POS'
import Reports from './pages/Reports'
import './styles/global.css'
import './pages/Login.css'
import './layouts/DashboardLayout.css'
import './pages/Users.css'
import './pages/Products.css'
import './pages/Categories.css'
import './pages/Inventory.css'
import './pages/Suppliers.css'
import './pages/Purchases.css'
import './pages/POS.css'
import './components/Receipt.css'
import './components/BarcodeScanner.css'
import './components/MpesaModal.css'
import './pages/Reports.css'


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
              <Route path="/dashboard/pos" element={<POS />} />
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
              <Route path="/dashboard/reports"   element={<Reports />} />
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
