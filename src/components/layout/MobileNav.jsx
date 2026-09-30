import { NavLink } from 'react-router-dom'
import { Home, Tag, Package, MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useLanguage } from '../../i18n/LanguageContext'

export function MobileNav({ onOpenActions }) {
  const { t } = useLanguage()
  const items = [
    { to: '/', label: t('home'), icon: Home },
    { to: '/sales', label: t('sales'), icon: Tag },
    { to: null, label: '+', icon: Plus, action: true },
    { to: '/inventory', label: t('stock'), icon: Package },
    { to: '/more', label: t('more'), icon: MoreHorizontal },
  ]

  return (
    <nav className="fixed bottom-4 inset-x-4 z-40 md:hidden pointer-events-none">
      {/* iOS-style floating frosted bar */}
      <div
        className="pointer-events-auto relative flex items-center justify-around h-[64px] px-2 rounded-[28px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
        style={{
          background: 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        {items.map((item) =>
          item.action ? (
            <button
              key="plus"
              onClick={onOpenActions}
              className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-[#181818] text-white shadow-[0_6px_20px_rgba(24,24,24,0.35)] active:scale-95 transition-transform"
              aria-label="Quick actions"
            >
              <Plus className="w-6 h-6" strokeWidth={2.25} />
            </button>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium rounded-2xl transition-colors min-w-[52px]',
                  isActive ? 'text-[#181818]' : 'text-[#707070]'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn('w-5 h-5 transition-transform', isActive && 'scale-105')}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}
