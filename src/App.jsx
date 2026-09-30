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

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <div className="skeleton h-8 w-32" />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
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
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/new" element={<NewSaleFlow />} />
        <Route path="/purchases" element={<PurchasesPage />} />
        <Route path="/purchases/new" element={<NewPurchaseFlow />} />
        <Route path="/production" element={<ProductionPage />} />
        <Route path="/production/new" element={<NewProductionFlow />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/finance/expense" element={<ExpenseFlow />} />
        <Route path="/finance/payment" element={<PaymentFlow />} />
        <Route path="/payroll" element={<PayrollPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
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
