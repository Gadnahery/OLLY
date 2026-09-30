import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Tag, ShoppingCart, Factory, Package,
  Users, Truck, DollarSign, UsersRound, FileText, Settings, ChevronLeft
} from 'lucide-react'
import { cn } from '../../utils/cn'

const nav = [
  { section: null, items: [{ to: '/', label: 'Overview', icon: LayoutDashboard }] },
  {
    section: 'OPERATIONS',
    items: [
      { to: '/sales', label: 'Sales', icon: Tag },
      { to: '/purchases', label: 'Purchases', icon: ShoppingCart },
      { to: '/production', label: 'Production', icon: Factory },
      { to: '/inventory', label: 'Inventory', icon: Package },
    ],
  },
  {
    section: 'RELATIONSHIPS',
    items: [
      { to: '/customers', label: 'Customers', icon: Users },
      { to: '/suppliers', label: 'Suppliers', icon: Truck },
    ],
  },
  {
    section: 'FINANCE',
    items: [
      { to: '/finance', label: 'Finance', icon: DollarSign },
      { to: '/payroll', label: 'Payroll', icon: UsersRound },
    ],
  },
  {
    section: 'INSIGHTS',
    items: [{ to: '/reports', label: 'Reports', icon: FileText }],
  },
  {
    section: 'SYSTEM',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
]

export function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={cn(
        'h-screen flex flex-col bg-white border-r border-[#E8E8E5] flex-shrink-0 transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[240px]'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-[#E8E8E5]', collapsed ? 'justify-center' : 'justify-between')}>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight">OLLY</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-[#F7F7F5] text-[#707070]"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {nav.map((group, i) => (
          <div key={i}>
            {group.section && !collapsed && (
              <p className="px-3 mb-2 text-[11px] font-medium tracking-wider text-[#707070] uppercase">
                {group.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                        isActive
                          ? 'bg-[#181818] text-white'
                          : 'text-[#181818] hover:bg-[#F7F7F5]',
                        collapsed && 'justify-center px-0'
                      )
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
