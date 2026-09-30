import { Tag, ShoppingCart, Factory, DollarSign, CreditCard, UserPlus, Package, ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export function ActionSheet({ open, onClose }) {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  const { can } = useAuth()
  if (!open) return null

  const actions = [
    { label: t('newSale'), icon: Tag, path: '/sales/new', mod: 'sales' },
    { label: 'New order', icon: ClipboardList, path: '/orders/new', mod: 'orders' },
    { label: t('newPurchase'), icon: ShoppingCart, path: '/purchases/new', mod: 'purchases' },
    { label: t('newProduction'), icon: Factory, path: '/production/new', mod: 'production' },
    { label: t('recordPayment'), icon: CreditCard, path: '/finance/payment', mod: 'finance' },
    { label: t('addExpense'), icon: DollarSign, path: '/finance/expense', mod: 'finance' },
    { label: t('addCustomer'), icon: UserPlus, path: '/customers', mod: 'customers' },
    { label: t('adjustStock'), icon: Package, path: '/inventory', mod: 'inventory' },
  ].filter((a) => can(a.mod))

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/45 animate-[fadeIn_200ms_ease-out]" onClick={onClose} />
      <div
        className="absolute bottom-0 inset-x-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] px-4 shadow-2xl animate-[slideUp_250ms_ease-out]"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >
        <div className="w-12 h-1.5 bg-[#E0E0DC] rounded-full mx-auto mb-5" />
        <h2 className="text-xl font-semibold mb-4 px-1">
          {lang === 'sw' ? 'Unataka kufanya nini?' : 'What do you want to do?'}
        </h2>
        <div className="space-y-1.5 pb-2">
          {actions.map((a) => (
            <button
              key={a.path + a.label}
              onClick={() => { onClose(); navigate(a.path) }}
              className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-[#F7F7F5] active:scale-[0.98] transition-transform text-left"
            >
              <span className="w-12 h-12 rounded-2xl bg-[#F0F0ED] flex items-center justify-center shrink-0">
                <a.icon className="w-6 h-6 text-[#181818]" strokeWidth={1.75} />
              </span>
              <span className="font-medium text-base">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
