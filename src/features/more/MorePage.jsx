import { Link } from 'react-router-dom'
import { ShoppingCart, Users, Truck, DollarSign, UsersRound, FileText, Settings, ClipboardList, UserCog } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function MorePage() {
  const { t } = useLanguage()
  const { can, isAdmin, staff } = useAuth()

  const links = [
    { to: '/orders', label: 'Orders', icon: ClipboardList, mod: 'orders' },
    { to: '/purchases', label: t('purchases'), icon: ShoppingCart, mod: 'purchases' },
    { to: '/customers', label: t('customers'), icon: Users, mod: 'customers' },
    { to: '/suppliers', label: t('suppliers'), icon: Truck, mod: 'suppliers' },
    { to: '/finance', label: t('finance'), icon: DollarSign, mod: 'finance' },
    { to: '/payroll', label: t('payroll'), icon: UsersRound, mod: 'payroll' },
    { to: '/reports', label: t('reports'), icon: FileText, mod: 'reports' },
    { to: '/staff', label: 'Staff', icon: UserCog, mod: 'staff' },
    { to: '/settings', label: t('settings'), icon: Settings, mod: 'settings' },
  ].filter((l) => can(l.mod))

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-2">{t('more')}</h1>
      {staff && (
        <p className="text-sm text-[#707070] mb-6">
          {staff.full_name} · <span className="capitalize">{staff.role}</span>
        </p>
      )}
      <div className="bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] last:border-0 hover:bg-[#F7F7F5]">
            <l.icon className="w-5 h-5 text-[#707070]" strokeWidth={1.75} />
            <span className="font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
      {!isAdmin && (
        <p className="text-xs text-[#707070] mt-4 text-center">
          Some areas are hidden by the owner&apos;s permissions.
        </p>
      )}
    </div>
  )
}
