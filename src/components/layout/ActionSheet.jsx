import { Tag, ShoppingCart, Factory, DollarSign, CreditCard, UserPlus, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'

export function ActionSheet({ open, onClose }) {
  const navigate = useNavigate()
  const { t, lang } = useLanguage()
  if (!open) return null

  const actions = [
    { label: t('newSale'), icon: Tag, path: '/sales/new' },
    { label: t('newPurchase'), icon: ShoppingCart, path: '/purchases/new' },
    { label: t('newProduction'), icon: Factory, path: '/production/new' },
    { label: t('recordPayment'), icon: CreditCard, path: '/finance/payment' },
    { label: t('addExpense'), icon: DollarSign, path: '/finance/expense' },
    { label: t('addCustomer'), icon: UserPlus, path: '/customers' },
    { label: t('adjustStock'), icon: Package, path: '/inventory' },
  ]

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40 animate-[fadeIn_200ms_ease-out]" onClick={onClose} />
      <div
        className="absolute bottom-4 inset-x-4 rounded-[28px] p-5 pb-6 shadow-2xl animate-[slideUp_250ms_ease-out] border border-white/50"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        <div className="w-10 h-1 bg-[#E8E8E5] rounded-full mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-3">
          {lang === 'sw' ? 'Unataka kufanya nini?' : 'What do you want to do?'}
        </h2>
        <div className="space-y-0.5">
          {actions.map((a) => (
            <button
              key={a.path + a.label}
              onClick={() => { onClose(); navigate(a.path) }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-[#F7F7F5]/80 text-left active:scale-[0.98] transition-transform"
            >
              <a.icon className="w-5 h-5 text-[#707070]" strokeWidth={1.75} />
              <span className="font-medium">{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
