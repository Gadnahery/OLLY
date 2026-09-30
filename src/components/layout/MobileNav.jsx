import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Tag, Package, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'

export function MobileNav({ onOpenActions }) {
  const items = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/sales', label: 'Sales', icon: Tag },
    { to: null, label: '+', icon: Plus, action: true },
    { to: '/inventory', label: 'Stock', icon: Package },
    { to: '/more', label: 'More', icon: MoreHorizontal },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-[#E8E8E5] safe-area-pb md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) =>
          item.action ? (
            <button
              key="plus"
              onClick={onOpenActions}
              className="flex flex-col items-center justify-center w-14 h-14 -mt-5 rounded-full bg-[#181818] text-white shadow-lg"
            >
              <Plus className="w-6 h-6" strokeWidth={2} />
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1 text-[11px]',
                  isActive ? 'text-[#181818]' : 'text-[#707070]'
                )
              }
            >
              <item.icon className="w-5 h-5" strokeWidth={1.75} />
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}
