import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { KPICard, Card } from '../../components/ui/Card'
import { ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0,
    toCollect: 0, toPay: 0,
  })
  const [production, setProduction] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentPayments, setRecentPayments] = useState([])

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const { data: profit } = await supabase.from('v_profit_summary').select('*').single()
        const { data: custBal } = await supabase.from('v_customer_balances').select('outstanding')
        const { data: supBal } = await supabase.from('v_supplier_balances').select('outstanding')
        const { data: batches } = await supabase
          .from('production_batches')
          .select('id, batch_number, product_id, actual_quantity, planned_quantity, status, products(name)')
          .order('created_at', { ascending: false })
          .limit(5)
        const { data: inv } = await supabase
          .from('inventory_balances')
          .select('quantity, products(id, name, type, reorder_level)')
        const { data: payments } = await supabase
          .from('payments')
          .select('id, amount, direction, payment_date, customers(name), suppliers(name)')
          .order('created_at', { ascending: false })
          .limit(5)

        const toCollect = (custBal || []).reduce((s, r) => s + Number(r.outstanding || 0), 0)
        const toPay = (supBal || []).reduce((s, r) => s + Number(r.outstanding || 0), 0)
        const low = (inv || []).filter(
          (i) => i.products && Number(i.quantity) <= Number(i.products.reorder_level || 0)
        )

        setMetrics({
          revenue: Number(profit?.revenue || 0),
          cogs: Number(profit?.cogs || 0),
          grossProfit: Number(profit?.gross_profit || 0),
          netProfit: Number(profit?.net_profit || 0),
          toCollect,
          toPay,
        })
        setProduction(batches || [])
        setLowStock(low)
        setRecentPayments(payments || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-[32px] font-semibold tracking-tight">
          {greeting}, Owner.
        </h1>
        <p className="text-[#707070] mt-1">Here&apos;s what is happening in your business · {today}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard label="Sales" value={formatMoney(metrics.revenue)} />
        <KPICard label="Net profit" value={formatMoney(metrics.netProfit)} />
        <KPICard label="Gross profit" value={formatMoney(metrics.grossProfit)} />
        <KPICard label="COGS" value={formatMoney(metrics.cogs)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Production */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Production</h2>
            <Link to="/production" className="text-sm text-[#707070] hover:text-[#181818] flex items-center gap-1">
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {production.length === 0 ? (
            <p className="text-sm text-[#707070]">No recent production batches.</p>
          ) : (
            <ul className="space-y-3">
              {production.map((b) => (
                <li key={b.id} className="flex justify-between text-sm">
                  <span>{b.products?.name || 'Product'}</span>
                  <span className="tabular-nums text-[#707070]">
                    {b.actual_quantity ?? b.planned_quantity} units
                    <span className={`ml-2 text-xs ${b.status === 'completed' ? 'text-[#3F8065]' : 'text-[#B7833F]'}`}>
                      {b.status}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Inventory health */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Inventory</h2>
            <Link to="/inventory" className="text-sm text-[#707070] hover:text-[#181818] flex items-center gap-1">
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[#3F8065]">All stock levels healthy.</p>
          ) : (
            <>
              <p className="text-sm text-[#B7833F] mb-3">{lowStock.length} items need attention</p>
              <ul className="space-y-2">
                {lowStock.slice(0, 4).map((i) => (
                  <li key={i.products.id} className="flex justify-between text-sm">
                    <span>{i.products.name}</span>
                    <span className="text-[#B7833F] tabular-nums">Low stock</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      {/* Money */}
      <Card>
        <h2 className="font-semibold mb-4">Money</h2>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-[#707070]">To collect</p>
            <p className="text-xl font-semibold tabular-nums mt-0.5">{formatMoney(metrics.toCollect)}</p>
          </div>
          <div>
            <p className="text-sm text-[#707070]">To pay</p>
            <p className="text-xl font-semibold tabular-nums mt-0.5">{formatMoney(metrics.toPay)}</p>
          </div>
        </div>
        {recentPayments.length > 0 && (
          <>
            <p className="text-sm text-[#707070] mb-2">Recent payments</p>
            <ul className="space-y-2">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <span>{p.customers?.name || p.suppliers?.name || '—'}</span>
                  <span className={`tabular-nums ${p.direction === 'in' ? 'text-[#3F8065]' : 'text-[#181818]'}`}>
                    {p.direction === 'in' ? '+' : '−'} {formatMoney(p.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
