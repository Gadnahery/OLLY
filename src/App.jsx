import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
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
import PayrollPage from './features/payroll/PayrollPage'
import ReportsPage from './features/reports/ReportsPage'
import SettingsPage from './features/settings/SettingsPage'
import MorePage from './features/more/MorePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
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
          <Route path="/finance/payment" element={<FinancePage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/more" element={<MorePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
