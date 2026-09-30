import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './i18n/LanguageContext'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import SalesPage from './features/sales/SalesPage'
import NewSaleFlow from './features/sales/NewSaleFlow'
import PurchasesPage from './features/purchases/PurchasesPage'
import NewPurchaseFlow from './features/purchases/NewPurchaseFlow'
import ProductionPage from './features/production/ProductionPage'
import NewProductionFlow from './features/production/NewProductionFlow'
import InventoryPage from './features/inventory/InventoryPage'
import CustomersPage from './features/customers/CustomersPage'
import SuppliersPage from './features/suppliers/SuppliersPage'
import FinancePage from './features/finance/FinancePage'
import ExpenseFlow from './features/finance/ExpenseFlow'
import PaymentFlow from './features/finance/PaymentFlow'
import PayrollPage from './features/payroll/PayrollPage'
import ReportsPage from './features/reports/ReportsPage'
import SettingsPage from './features/settings/SettingsPage'
import MorePage from './features/more/MorePage'
import OrdersPage from './features/orders/OrdersPage'
import NewOrderFlow from './features/orders/NewOrderFlow'
import StaffPage from './features/staff/StaffPage'

function ProtectedRoute({ children }) {
  const { user, loading, staff } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="skeleton h-8 w-32" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (staff && staff.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <p className="text-[#B4534A]">Your account is disabled. Contact the owner.</p>
      </div>
    )
  }
  return children
}

function ModuleRoute({ module, children }) {
  const { can, loading } = useAuth()
  if (loading) return null
  if (!can(module)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <LanguageProvider>
              <AppShell />
            </LanguageProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/sales" element={<ModuleRoute module="sales"><SalesPage /></ModuleRoute>} />
        <Route path="/sales/new" element={<ModuleRoute module="sales"><NewSaleFlow /></ModuleRoute>} />
        <Route path="/orders" element={<ModuleRoute module="orders"><OrdersPage /></ModuleRoute>} />
        <Route path="/orders/new" element={<ModuleRoute module="orders"><NewOrderFlow /></ModuleRoute>} />
        <Route path="/purchases" element={<ModuleRoute module="purchases"><PurchasesPage /></ModuleRoute>} />
        <Route path="/purchases/new" element={<ModuleRoute module="purchases"><NewPurchaseFlow /></ModuleRoute>} />
        <Route path="/production" element={<ModuleRoute module="production"><ProductionPage /></ModuleRoute>} />
        <Route path="/production/new" element={<ModuleRoute module="production"><NewProductionFlow /></ModuleRoute>} />
        <Route path="/inventory" element={<ModuleRoute module="inventory"><InventoryPage /></ModuleRoute>} />
        <Route path="/customers" element={<ModuleRoute module="customers"><CustomersPage /></ModuleRoute>} />
        <Route path="/suppliers" element={<ModuleRoute module="suppliers"><SuppliersPage /></ModuleRoute>} />
        <Route path="/finance" element={<ModuleRoute module="finance"><FinancePage /></ModuleRoute>} />
        <Route path="/finance/expense" element={<ModuleRoute module="finance"><ExpenseFlow /></ModuleRoute>} />
        <Route path="/finance/payment" element={<ModuleRoute module="finance"><PaymentFlow /></ModuleRoute>} />
        <Route path="/payroll" element={<ModuleRoute module="payroll"><PayrollPage /></ModuleRoute>} />
        <Route path="/reports" element={<ModuleRoute module="reports"><ReportsPage /></ModuleRoute>} />
        <Route path="/settings" element={<ModuleRoute module="settings"><SettingsPage /></ModuleRoute>} />
        <Route path="/staff" element={<ModuleRoute module="staff"><StaffPage /></ModuleRoute>} />
        <Route path="/more" element={<MorePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
