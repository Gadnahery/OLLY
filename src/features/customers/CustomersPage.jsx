import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, ArrowLeft, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SelectionCard } from '../../components/ui/SelectionCard'
import { cn } from '../../utils/cn'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [activity, setActivity] = useState([])
  const [showPayment, setShowPayment] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    const { data: cust } = await supabase
      .from('customers')
      .select('id, name, phone, email, is_active')
      .eq('is_active', true)
      .order('name')
    const { data: bals } = await supabase.from('v_customer_balances').select('id, outstanding')
    const balMap = Object.fromEntries((bals || []).map((b) => [b.id, Number(b.outstanding || 0)]))
    setCustomers((cust || []).map((c) => ({ ...c, outstanding: balMap[c.id] || 0 })))
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function openDetail(c) {
    setSelected(c)
    setShowPayment(false)
    const [{ data: sales }, { data: payments }] = await Promise.all([
      supabase
        .from('sales')
        .select('id, sale_date, invoice_number, total_amount, paid_amount, payment_status')
        .eq('customer_id', c.id)
        .order('sale_date', { ascending: false })
        .limit(20),
      supabase
        .from('payments')
        .select('id, payment_date, amount, payment_method, direction')
        .eq('customer_id', c.id)
        .order('payment_date', { ascending: false })
        .limit(20),
    ])
    const items = [
      ...(sales || []).map((s) => ({
        date: s.sale_date,
        type: 'Sale',
        label: s.invoice_number,
        amount: Number(s.total_amount),
        sign: '+',
      })),
      ...(payments || []).map((p) => ({
        date: p.payment_date,
        type: 'Payment',
        label: p.payment_method,
        amount: Number(p.amount),
        sign: '-',
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1))
    setActivity(items)

    const totalSales = (sales || []).reduce((s, r) => s + Number(r.total_amount), 0)
    const totalPaid = (payments || []).reduce((s, r) => s + Number(r.amount), 0)
    setSelected((prev) => ({ ...prev, totalSales, totalPaid }))
  }

  async function recordPayment() {
    if (!selected || !payAmount) return
    setSaving(true)
    setError(null)
    try {
      const amount = Number(payAmount)
      const { error: err } = await supabase.from('payments').insert({
        direction: 'in',
        customer_id: selected.id,
        amount,
        payment_method: payMethod,
        payment_date: new Date().toISOString().slice(0, 10),
        notes: 'Customer payment',
      })
      if (err) throw err

      await supabase.from('ledger_entries').insert({
        entry_type: 'payment_in',
        amount,
        description: `Payment from ${selected.name}`,
        reference_type: 'customer',
        reference_id: selected.id,
        entry_date: new Date().toISOString().slice(0, 10),
      })

      // Apply to oldest unpaid/partial sales
      const { data: openSales } = await supabase
        .from('sales')
        .select('id, total_amount, paid_amount, payment_status')
        .eq('customer_id', selected.id)
        .neq('payment_status', 'paid')
        .order('sale_date', { ascending: true })

      let remaining = amount
      for (const sale of openSales || []) {
        if (remaining <= 0) break
        const due = Number(sale.total_amount) - Number(sale.paid_amount)
        const apply = Math.min(due, remaining)
        const newPaid = Number(sale.paid_amount) + apply
        const status = newPaid >= Number(sale.total_amount) ? 'paid' : 'partial'
        await supabase
          .from('sales')
          .update({ paid_amount: newPaid, payment_status: status })
          .eq('id', sale.id)
        remaining -= apply
      }

      setShowPayment(false)
      setPayAmount('')
      await load()
      const updated = customers.find((c) => c.id === selected.id)
      if (updated) await openDetail({ ...updated, outstanding: Math.max(0, (updated.outstanding || 0) - amount) })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function addCustomer() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const { data, error: err } = await supabase
        .from('customers')
        .insert({ name: newName.trim(), phone: newPhone.trim() || null })
        .select()
        .single()
      if (err) throw err
      setShowAdd(false)
      setNewName('')
      setNewPhone('')
      await load()
      if (data) openDetail({ ...data, outstanding: 0 })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // Detail panel
  if (selected) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-[#707070] mb-4 hover:text-[#181818]"
        >
          <ArrowLeft className="w-4 h-4" /> All customers
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{selected.name}</h1>
          {selected.phone && <p className="text-sm text-[#707070] mt-0.5">{selected.phone}</p>}
        </div>

        <Card className="mb-4">
          <p className="text-sm text-[#707070]">Outstanding</p>
          <p className={cn('text-3xl font-semibold tabular-nums mt-1', selected.outstanding > 0 ? 'text-[#B7833F]' : 'text-[#3F8065]')}>
            {formatMoney(selected.outstanding || 0)}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E8E8E5]">
            <div>
              <p className="text-xs text-[#707070]">Sales</p>
              <p className="font-medium tabular-nums">{formatMoney(selected.totalSales || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-[#707070]">Paid</p>
              <p className="font-medium tabular-nums">{formatMoney(selected.totalPaid || 0)}</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-2 mb-6">
          <Button onClick={() => setShowPayment(true)} className="flex-1">
            Record payment
          </Button>
          <Link to="/sales/new" className="flex-1">
            <Button variant="secondary" className="w-full">
              New sale
            </Button>
          </Link>
        </div>

        {showPayment && (
          <Card className="mb-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Record payment</h3>
              <button onClick={() => setShowPayment(false)}>
                <X className="w-5 h-5 text-[#707070]" />
              </button>
            </div>
            <div>
              <label className="text-sm text-[#707070]">Amount (TZS)</label>
              <input
                type="number"
                className="mt-1 w-full h-12 px-4 rounded-xl border border-[#E8E8E5] text-lg tabular-nums"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder={String(selected.outstanding || 0)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'mobile_money', 'bank'].map((m) => (
                <SelectionCard
                  key={m}
                  title={m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                  selected={payMethod === m}
                  onClick={() => setPayMethod(m)}
                />
              ))}
            </div>
            {error && <p className="text-sm text-[#B4534A]">{error}</p>}
            <Button className="w-full" loading={saving} onClick={recordPayment} disabled={!payAmount}>
              Save payment
            </Button>
          </Card>
        )}

        <h2 className="font-semibold mb-3">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-[#707070]">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-[#E8E8E5] last:border-0">
                <div>
                  <p className="text-sm font-medium">{a.type}</p>
                  <p className="text-xs text-[#707070]">
                    {a.date} · {a.label}
                  </p>
                </div>
                <p className={cn('text-sm tabular-nums font-medium', a.sign === '-' ? 'text-[#3F8065]' : '')}>
                  {a.sign} {formatMoney(a.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="text-sm text-[#707070] mt-0.5">Accounts, sales and outstanding balances</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add customer
        </Button>
      </div>

      {showAdd && (
        <Card className="mb-6 space-y-3">
          <h3 className="font-semibold">New customer</h3>
          <input
            className="w-full h-11 px-4 rounded-xl border border-[#E8E8E5]"
            placeholder="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <input
            className="w-full h-11 px-4 rounded-xl border border-[#E8E8E5]"
            placeholder="Phone (optional)"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={addCustomer} disabled={!newName.trim()}>
              Save
            </Button>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#707070] mb-4">No customers yet</p>
          <Button onClick={() => setShowAdd(true)}>Add first customer</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => openDetail(c)}
              className="w-full text-left bg-white border border-[#E8E8E5] rounded-2xl p-4 hover:border-[#C8C8C5] transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{c.name}</p>
                  {c.phone && <p className="text-xs text-[#707070] mt-0.5">{c.phone}</p>}
                </div>
                <div className="text-right">
                  <p className={cn('font-semibold tabular-nums', c.outstanding > 0 ? 'text-[#B7833F]' : 'text-[#707070]')}>
                    {formatMoney(c.outstanding)}
                  </p>
                  <p className="text-xs text-[#707070]">outstanding</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
