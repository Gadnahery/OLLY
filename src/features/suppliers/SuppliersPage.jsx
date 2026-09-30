import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowLeft, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SelectionCard } from '../../components/ui/SelectionCard'
import { cn } from '../../utils/cn'

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([])
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
    const { data: list } = await supabase
      .from('suppliers')
      .select('id, name, phone, is_active')
      .eq('is_active', true)
      .order('name')
    const { data: bals } = await supabase.from('v_supplier_balances').select('id, outstanding')
    const balMap = Object.fromEntries((bals || []).map((b) => [b.id, Number(b.outstanding || 0)]))
    setSuppliers((list || []).map((s) => ({ ...s, outstanding: balMap[s.id] || 0 })))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function openDetail(s) {
    setSelected(s)
    setShowPayment(false)
    const [{ data: purchases }, { data: payments }] = await Promise.all([
      supabase.from('purchases').select('id, purchase_date, invoice_number, total_amount, paid_amount, payment_status').eq('supplier_id', s.id).order('purchase_date', { ascending: false }).limit(20),
      supabase.from('payments').select('id, payment_date, amount, payment_method').eq('supplier_id', s.id).order('payment_date', { ascending: false }).limit(20),
    ])
    const items = [
      ...(purchases || []).map((p) => ({ date: p.purchase_date, type: 'Purchase', label: p.invoice_number || '—', amount: Number(p.total_amount), sign: '+' })),
      ...(payments || []).map((p) => ({ date: p.payment_date, type: 'Payment', label: p.payment_method, amount: Number(p.amount), sign: '-' })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1))
    setActivity(items)
    setSelected((prev) => ({
      ...prev,
      totalPurchases: (purchases || []).reduce((sum, r) => sum + Number(r.total_amount), 0),
      totalPaid: (payments || []).reduce((sum, r) => sum + Number(r.amount), 0),
    }))
  }

  async function recordPayment() {
    if (!selected || !payAmount) return
    setSaving(true)
    setError(null)
    try {
      const amount = Number(payAmount)
      const { error: err } = await supabase.from('payments').insert({
        direction: 'out', supplier_id: selected.id, amount, payment_method: payMethod,
        payment_date: new Date().toISOString().slice(0, 10),
      })
      if (err) throw err
      await supabase.from('ledger_entries').insert({
        entry_type: 'payment_out', amount, description: `Payment to ${selected.name}`,
        reference_type: 'supplier', reference_id: selected.id, entry_date: new Date().toISOString().slice(0, 10),
      })
      const { data: open } = await supabase.from('purchases').select('id, total_amount, paid_amount')
        .eq('supplier_id', selected.id).neq('payment_status', 'paid').order('purchase_date', { ascending: true })
      let remaining = amount
      for (const p of open || []) {
        if (remaining <= 0) break
        const due = Number(p.total_amount) - Number(p.paid_amount)
        const apply = Math.min(due, remaining)
        const newPaid = Number(p.paid_amount) + apply
        await supabase.from('purchases').update({
          paid_amount: newPaid, payment_status: newPaid >= Number(p.total_amount) ? 'paid' : 'partial',
        }).eq('id', p.id)
        remaining -= apply
      }
      setShowPayment(false)
      setPayAmount('')
      await load()
      await openDetail({ ...selected, outstanding: Math.max(0, (selected.outstanding || 0) - amount) })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function addSupplier() {
    if (!newName.trim()) return
    setSaving(true)
    try {
      const { data, error: err } = await supabase.from('suppliers')
        .insert({ name: newName.trim(), phone: newPhone.trim() || null }).select().single()
      if (err) throw err
      setShowAdd(false); setNewName(''); setNewPhone('')
      await load()
      if (data) openDetail({ ...data, outstanding: 0 })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (selected) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-[#707070] mb-4 hover:text-[#181818]">
          <ArrowLeft className="w-4 h-4" /> All suppliers
        </button>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">{selected.name}</h1>
        {selected.phone && <p className="text-sm text-[#707070] mb-6">{selected.phone}</p>}
        <Card className="mb-4">
          <p className="text-sm text-[#707070]">To pay</p>
          <p className={cn('text-3xl font-semibold tabular-nums mt-1', selected.outstanding > 0 ? 'text-[#B7833F]' : 'text-[#3F8065]')}>
            {formatMoney(selected.outstanding || 0)}
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E8E8E5]">
            <div><p className="text-xs text-[#707070]">Purchases</p><p className="font-medium tabular-nums">{formatMoney(selected.totalPurchases || 0)}</p></div>
            <div><p className="text-xs text-[#707070]">Paid</p><p className="font-medium tabular-nums">{formatMoney(selected.totalPaid || 0)}</p></div>
          </div>
        </Card>
        <div className="flex gap-2 mb-6">
          <Button onClick={() => setShowPayment(true)} className="flex-1">Record payment</Button>
          <Link to="/purchases/new" className="flex-1"><Button variant="secondary" className="w-full">New purchase</Button></Link>
        </div>
        {showPayment && (
          <Card className="mb-6 space-y-4">
            <div className="flex justify-between"><h3 className="font-semibold">Pay supplier</h3>
              <button onClick={() => setShowPayment(false)}><X className="w-5 h-5 text-[#707070]" /></button></div>
            <input type="number" className="w-full h-12 px-4 rounded-xl border border-[#E8E8E5] text-lg tabular-nums"
              placeholder="Amount TZS" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'mobile_money', 'bank'].map((m) => (
                <SelectionCard key={m} title={m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                  selected={payMethod === m} onClick={() => setPayMethod(m)} />
              ))}
            </div>
            {error && <p className="text-sm text-[#B4534A]">{error}</p>}
            <Button className="w-full" loading={saving} onClick={recordPayment} disabled={!payAmount}>Save payment</Button>
          </Card>
        )}
        <h2 className="font-semibold mb-3">Recent activity</h2>
        {activity.length === 0 ? <p className="text-sm text-[#707070]">No activity yet</p> : (
          <div className="space-y-2">
            {activity.map((a, i) => (
              <div key={i} className="flex justify-between py-3 border-b border-[#E8E8E5] last:border-0">
                <div><p className="text-sm font-medium">{a.type}</p><p className="text-xs text-[#707070]">{a.date} · {a.label}</p></div>
                <p className="text-sm tabular-nums font-medium">{a.sign} {formatMoney(a.amount)}</p>
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
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-[#707070] mt-0.5">Purchases and payables</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add supplier</Button>
      </div>
      {showAdd && (
        <Card className="mb-6 space-y-3">
          <h3 className="font-semibold">New supplier</h3>
          <input className="w-full h-11 px-4 rounded-xl border border-[#E8E8E5]" placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <input className="w-full h-11 px-4 rounded-xl border border-[#E8E8E5]" placeholder="Phone (optional)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button loading={saving} onClick={addSupplier} disabled={!newName.trim()}>Save</Button>
          </div>
        </Card>
      )}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : suppliers.length === 0 ? (
        <Card className="text-center py-12"><p className="text-[#707070] mb-4">No suppliers yet</p>
          <Button onClick={() => setShowAdd(true)}>Add first supplier</Button></Card>
      ) : (
        <div className="space-y-2">
          {suppliers.map((s) => (
            <button key={s.id} onClick={() => openDetail(s)}
              className="w-full text-left bg-white border border-[#E8E8E5] rounded-2xl p-4 hover:border-[#C8C8C5]">
              <div className="flex justify-between">
                <div><p className="font-medium">{s.name}</p>{s.phone && <p className="text-xs text-[#707070] mt-0.5">{s.phone}</p>}</div>
                <div className="text-right">
                  <p className={cn('font-semibold tabular-nums', s.outstanding > 0 ? 'text-[#B7833F]' : 'text-[#707070]')}>{formatMoney(s.outstanding)}</p>
                  <p className="text-xs text-[#707070]">to pay</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
