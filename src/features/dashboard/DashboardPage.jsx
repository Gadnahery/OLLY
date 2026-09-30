import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { KPICard, Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'
import { PeriodPicker, getPeriodRange } from '../../components/ui/PeriodPicker'
import { useLanguage } from '../../i18n/LanguageContext'

export default function DashboardPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    revenue: 0, cogs: 0, grossProfit: 0, netProfit: 0, toCollect: 0, toPay: 0,
  })
  const [production, setProduction] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [recentPayments, setRecentPayments] = useState([])
  const [chartData, setChartData] = useState([])
  const [chartPeriod, setChartPeriod] = useState('30d')
  // sync with main period picker when possible
  const [invSummary, setInvSummary] = useState({ raw: 0, packaging: 0, finished: 0 })
  const [period, setPeriod] = useState('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [{ data: profit }, { data: custBal }, { data: supBal }, { data: batches }, { data: inv }, { data: payments }] =
          await Promise.all([
            supabase.from('v_profit_summary').select('*').single(),
            supabase.from('v_customer_balances').select('outstanding'),
            supabase.from('v_supplier_balances').select('outstanding'),
            supabase.from('production_batches').select('id, batch_number, actual_quantity, planned_quantity, status, products(name)').order('created_at', { ascending: false }).limit(5),
            supabase.from('inventory_balances').select('quantity, products(id, name, type, reorder_level)'),
            supabase.from('payments').select('id, amount, direction, payment_date, customers(name), suppliers(name)').order('created_at', { ascending: false }).limit(5),
          ])

        const toCollect = (custBal || []).reduce((s, r) => s + Number(r.outstanding || 0), 0)
        const toPay = (supBal || []).reduce((s, r) => s + Number(r.outstanding || 0), 0)
        const low = (inv || []).filter((i) => i.products && Number(i.products.reorder_level || 0) > 0 && Number(i.quantity) <= Number(i.products.reorder_level))
        const summary = { raw: 0, packaging: 0, finished: 0 }
        for (const i of inv || []) {
          if (!i.products) continue
          if (i.products.type === 'raw_material') summary.raw++
          else if (i.products.type === 'packaging') summary.packaging++
          else if (i.products.type === 'finished_good') summary.finished++
        }

        setMetrics({
          revenue: Number(profit?.revenue || 0),
          cogs: Number(profit?.cogs || 0),
          grossProfit: Number(profit?.gross_profit || 0),
          netProfit: Number(profit?.net_profit || 0),
          toCollect, toPay,
        })
        setProduction(batches || [])
        setLowStock(low)
        setRecentPayments(payments || [])
        setInvSummary(summary)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])


  useEffect(() => {
    if (period === '7d' || period === '30d') setChartPeriod(period)
    else if (period === 'today' || period === 'yesterday') setChartPeriod('7d')
  }, [period])

  useEffect(() => {
    async function loadChart() {
      const days = chartPeriod === '7d' ? 7 : chartPeriod === '30d' ? 30 : chartPeriod === '3m' ? 90 : 365
      const from = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
      const { data } = await supabase
        .from('ledger_entries')
        .select('entry_type, amount, entry_date')
        .gte('entry_date', from)
        .in('entry_type', ['revenue', 'cogs', 'expense', 'payroll'])
        .order('entry_date')

      const byDate = {}
      for (const e of data || []) {
        if (!byDate[e.entry_date]) byDate[e.entry_date] = { date: e.entry_date, revenue: 0, profit: 0 }
        const a = Number(e.amount)
        if (e.entry_type === 'revenue') {
          byDate[e.entry_date].revenue += a
          byDate[e.entry_date].profit += a
        } else {
          byDate[e.entry_date].profit -= a
        }
      }
      setChartData(Object.values(byDate))
    }
    loadChart()
  }, [chartPeriod])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('greetingMorning') : hour < 17 ? t('greetingAfternoon') : t('greetingEvening')
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
        <div className="skeleton h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-28" />)}
        </div>
        <div className="skeleton h-64" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl md:text-[32px] font-semibold tracking-tight">{greeting}, Owner.</h1>
        <p className="text-[#707070] mt-1">{t('dashboardSubtitle')} · {today}</p>
      </div>

      <PeriodPicker
        value={period}
        onChange={setPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onCustomChange={(f, to) => { setCustomFrom(f); setCustomTo(to) }}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard label="Sales" value={formatMoney(metrics.revenue)} />
        <KPICard label="Net profit" value={formatMoney(metrics.netProfit)} />
        <KPICard label="Gross profit" value={formatMoney(metrics.grossProfit)} />
        <KPICard label="COGS" value={formatMoney(metrics.cogs)} />
      </div>

      {/* Revenue & Profit chart — desktop only */}
      <Card className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Revenue & Profit</h2>
          <div className="flex gap-1">
            {['7d', '30d', '3m', '1y'].map((p) => (
              <button key={p} onClick={() => setChartPeriod(p)}
                className={cn('px-3 py-1 rounded-full text-xs uppercase',
                  chartPeriod === p ? 'bg-[#181818] text-white' : 'text-[#707070] hover:bg-[#F7F7F5]')}>
                {p}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <p className="text-sm text-[#707070] py-12 text-center">No transactions in this period yet. Record a sale to see the chart.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#181818" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#181818" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="prof" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3F8065" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#3F8065" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E8E5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#707070' }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fontSize: 11, fill: '#707070' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E8E8E5', fontSize: 12 }}
                  formatter={(v, name) => [formatMoney(v), name === 'revenue' ? 'Revenue' : 'Profit']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#181818" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#3F8065" fill="url(#prof)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
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
                    <span className={cn('ml-2 text-xs', b.status === 'completed' ? 'text-[#3F8065]' : 'text-[#B7833F]')}>
                      {b.status?.replace('_', ' ')}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Inventory</h2>
            <Link to="/inventory" className="text-sm text-[#707070] hover:text-[#181818] flex items-center gap-1">
              View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center text-sm">
            <div><p className="text-lg font-semibold tabular-nums">{invSummary.raw}</p><p className="text-xs text-[#707070]">Raw</p></div>
            <div><p className="text-lg font-semibold tabular-nums">{invSummary.packaging}</p><p className="text-xs text-[#707070]">Packaging</p></div>
            <div><p className="text-lg font-semibold tabular-nums">{invSummary.finished}</p><p className="text-xs text-[#707070]">Finished</p></div>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-[#3F8065]">All stock levels healthy.</p>
          ) : (
            <>
              <p className="text-sm text-[#B7833F] mb-2">{lowStock.length} items need attention</p>
              <ul className="space-y-2">
                {lowStock.slice(0, 4).map((i) => (
                  <li key={i.products.id} className="flex justify-between text-sm">
                    <span>{i.products.name}</span>
                    <span className="text-[#B7833F]">Low stock</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

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
                  <span className={cn('tabular-nums', p.direction === 'in' ? 'text-[#3F8065]' : '')}>
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
