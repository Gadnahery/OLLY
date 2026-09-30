import { Tag, ShoppingCart, Factory, DollarSign, CreditCard, UserPlus, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const actions = [
  { label: 'New sale', icon: Tag, path: '/sales/new' },
  { label: 'New purchase', icon: ShoppingCart, path: '/purchases/new' },
  { label: 'New production', icon: Factory, path: '/production/new' },
  { label: 'Record payment', icon: CreditCard, path: '/finance/payment' },
  { label: 'Add expense', icon: DollarSign, path: '/finance/expense' },
  { label: 'Add customer', icon: UserPlus, path: '/customers/new' },
  { label: 'Add inventory', icon: Package, path: '/inventory' },
]

export function ActionSheet({ open, onClose }) {
  const navigate = useNavigate()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl p-5 pb-8 animate-[flowIn_250ms_ease-out]">
        <div className="w-10 h-1 bg-[#E8E8E5] rounded-full mx-auto mb-5" />
        <h2 className="text-lg font-semibold mb-4">What do you want to do?</h2>
        <div className="space-y-1">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                onClose()
                navigate(a.path)
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-[#F7F7F5] text-left"
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
