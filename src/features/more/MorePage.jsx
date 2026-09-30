import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Truck, DollarSign, UsersRound, FileText, Settings, ClipboardList } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'

export default function MorePage() {
  const { t } = useLanguage()
  const links = [
    { to: '/orders', label: 'Orders', icon: ClipboardList },
    { to: '/purchases', label: t('purchases'), icon: ShoppingCart },
    { to: '/customers', label: t('customers'), icon: Users },
    { to: '/suppliers', label: t('suppliers'), icon: Truck },
    { to: '/finance', label: t('finance'), icon: DollarSign },
    { to: '/payroll', label: t('payroll'), icon: UsersRound },
    { to: '/reports', label: t('reports'), icon: FileText },
    { to: '/settings', label: t('settings'), icon: Settings },
  ]

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6">{t('more')}</h1>
      <div className="bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] last:border-0 hover:bg-[#F7F7F5]">
            <l.icon className="w-5 h-5 text-[#707070]" strokeWidth={1.75} />
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
