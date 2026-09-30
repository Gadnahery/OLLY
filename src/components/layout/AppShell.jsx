import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Bell, Plus } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { ActionSheet } from './ActionSheet'
import { useNavigate } from 'react-router-dom'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const isNewFlow = location.pathname.includes('/new') || location.pathname.includes('/expense') || location.pathname.includes('/payment')

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F5]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        {!isNewFlow && (
          <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-[#E8E8E5] bg-white">
            <div />
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-[#F7F7F5] text-[#707070]">
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActionsOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#181818] text-white text-sm font-medium hover:bg-[#333]"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
          </header>
        )}

        {/* Mobile top bar */}
        {!isNewFlow && (
          <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-[#E8E8E5] bg-white">
            <span className="text-lg font-semibold">OLLY</span>
            <button className="p-2 text-[#707070]">
              <Bell className="w-5 h-5" />
            </button>
          </header>
        )}

        <main className={isNewFlow ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto pb-28 md:pb-6'}>
          <Outlet />
        </main>
      </div>

      {!isNewFlow && <MobileNav onOpenActions={() => setActionsOpen(true)} />}
      <ActionSheet open={actionsOpen} onClose={() => setActionsOpen(false)} />

      {/* Desktop action sheet as modal */}
      {actionsOpen && (
        <div className="hidden md:block fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setActionsOpen(false)} />
          <div className="absolute top-20 right-8 w-72 bg-white rounded-2xl shadow-xl border border-[#E8E8E5] p-2">
            {[
              { l: 'New sale', p: '/sales/new' },
              { l: 'New purchase', p: '/purchases/new' },
              { l: 'New production', p: '/production/new' },
              { l: 'Add expense', p: '/finance/expense' },
              { l: 'Record payment', p: '/finance/payment' },
            ].map((a) => (
              <button
                key={a.l}
                onClick={() => {
                  setActionsOpen(false)
                  navigate(a.p)
                }}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#F7F7F5] text-sm font-medium"
              >
                {a.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
