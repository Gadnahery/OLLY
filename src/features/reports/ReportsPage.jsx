import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'

export default function ReportsPage() {
  const [period, setPeriod] = useState('all')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    revenue: 0, cogs: 0, gross: 0, expenses: 0, payroll: 0, net: 0,
    salesCount: 0, productionCount: 0,
  })

  useEffect(() => {
    async function load() {
      setLoading(true)
      let from = null
      const now = new Date()
      if (period === '7d') from = new Date(now - 7 * 86400000).toISOString().slice(0, 10)
      if (period === '30d') from = new Date(now - 30 * 86400000).toISOString().slice(0, 10)
      if (period === '3m') from = new Date(now - 90 * 86400000).toISOString().slice(0, 10)
      if (period === '1y') from = new Date(now - 365 * 86400000).toISOString().slice(0, 10)

      let q = supabase.from('ledger_entries').select('entry_type, amount, entry_date')
      if (from) q = q.gte('entry_date', from)
      const { data: entries } = await q

      let revenue = 0, cogs = 0, expenses = 0, payroll = 0
      for (const e of entries || []) {
        const a = Number(e.amount)
        if (e.entry_type === 'revenue') revenue += a
        else if (e.entry_type === 'cogs') cogs += a
        else if (e.entry_type === 'expense') expenses += a
        else if (e.entry_type === 'payroll') payroll += a
      }

      let salesQ = supabase.from('sales').select('id', { count: 'exact', head: true })
      let prodQ = supabase.from('production_batches').select('id', { count: 'exact', head: true }).eq('status', 'completed')
      if (from) {
        salesQ = salesQ.gte('sale_date', from)
        prodQ = prodQ.gte('completed_at', from)
      }
      const [{ count: salesCount }, { count: productionCount }] = await Promise.all([salesQ, prodQ])

      setSummary({
        revenue, cogs, gross: revenue - cogs,
        expenses, payroll,
        net: revenue - cogs - expenses - payroll,
        salesCount: salesCount || 0,
        productionCount: productionCount || 0,
      })
      setLoading(false)
    }
    load()
  }, [period])

  const periods = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '3m', label: '3M' },
    { id: '1y', label: '1Y' },
    { id: 'all', label: 'All' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-sm text-[#707070] mt-0.5">Operational and financial summary</p>
      </div>

      <div className="flex gap-2 mb-6">
        {periods.map((p) => (
          <button key={p.id} onClick={() => setPeriod(p.id)}
            className={cn('px-4 py-2 rounded-full text-sm',
              period === p.id ? 'bg-[#181818] text-white' : 'bg-white border border-[#E8E8E5]')}>
            {p.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="skeleton h-64" />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <p className="text-sm text-[#707070]">Sales</p>
              <p className="text-xl font-semibold tabular-nums mt-1">{summary.salesCount}</p>
            </Card>
            <Card>
              <p className="text-sm text-[#707070]">Production batches</p>
              <p className="text-xl font-semibold tabular-nums mt-1">{summary.productionCount}</p>
            </Card>
          </div>

          <Card>
            <h3 className="font-semibold mb-4">Financial summary</h3>
            <div className="space-y-3 text-sm">
              <Row label="Revenue" value={summary.revenue} />
              <Row label="Cost of goods sold" value={summary.cogs} muted />
              <Row label="Gross profit" value={summary.gross} bold green />
              <Row label="Operating expenses" value={summary.expenses} muted />
              <Row label="Payroll" value={summary.payroll} muted />
              <div className={cn('flex justify-between border-t border-[#E8E8E5] pt-3 text-base font-semibold',
                summary.net >= 0 ? 'text-[#3F8065]' : 'text-[#B4534A]')}>
                <span>{summary.net >= 0 ? 'Net profit' : 'Net loss'}</span>
                <span className="tabular-nums">{formatMoney(Math.abs(summary.net))}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, muted, bold, green }) {
  return (
    <div className={cn('flex justify-between', bold && 'font-semibold border-t border-[#E8E8E5] pt-3')}>
      <span className={muted ? 'text-[#707070]' : ''}>{label}</span>
      <span className={cn('tabular-nums', green && 'text-[#3F8065]')}>{formatMoney(value)}</span>
    </div>
  )
}
