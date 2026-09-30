import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { SelectionCard } from '../../components/ui/SelectionCard'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { FlowShell, FlowContinue } from '../../components/layout/FlowShell'
import { cn } from '../../utils/cn'

export default function NewOrderFlow() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [step, setStep] = useState(0)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerId, setCustomerId] = useState(null)
  const [walkInName, setWalkInName] = useState('')
  const [cart, setCart] = useState({})
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('id, name, phone').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, selling_price').eq('type', 'finished_good').eq('is_active', true).order('name'),
    ]).then(([c, p]) => {
      setCustomers(c.data || [])
      setProducts(p.data || [])
    })
  }, [])

  const cartItems = Object.entries(cart).filter(([, q]) => q > 0).map(([id, qty]) => {
    const prod = products.find((p) => p.id === id)
    return { ...prod, qty, lineTotal: qty * Number(prod?.selling_price || 0) }
  })
  const total = cartItems.reduce((s, i) => s + i.lineTotal, 0)

  async function save() {
    setSaving(true)
    try {
      const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      const cust = customers.find((c) => c.id === customerId)
      const { data: order, error } = await supabase.from('orders').insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: cust?.name || walkInName || 'Customer',
        status: 'pending',
        due_date: dueDate || null,
        notes: notes || null,
        total_amount: total,
      }).select().single()
      if (error) throw error
      await supabase.from('order_items').insert(
        cartItems.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          quantity: i.qty,
          unit_price: Number(i.selling_price),
        }))
      )
      setSuccess(order)
      addToast('Order created')
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-full bg-[#3F8065]/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-[#3F8065]" />
        </div>
        <h1 className="text-xl font-semibold">Order saved</h1>
        <p className="text-[#707070] mt-1">{success.order_number}</p>
        <button className="mt-8 h-11 px-6 rounded-xl bg-[#181818] text-white font-medium" onClick={() => navigate('/orders')}>
          Done
        </button>
      </div>
    )
  }

  return (
    <FlowShell
      title="New order"
      stepLabel={`Step ${step + 1} of 3`}
      onBack={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))}
      footer={
        step < 2 ? (
          <FlowContinue
            disabled={(step === 0 && !customerId && !walkInName.trim()) || (step === 1 && cartItems.length === 0)}
            onClick={() => setStep((s) => s + 1)}
          />
        ) : (
          <FlowContinue label="Save order" loading={saving} onClick={save} />
        )
      }
    >
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium mb-4">Who ordered?</h2>
          {customers.map((c) => (
            <SelectionCard key={c.id} title={c.name} subtitle={c.phone} selected={customerId === c.id}
              onClick={() => { setCustomerId(c.id); setWalkInName('') }} />
          ))}
          <div className="pt-2">
            <Input label="Or type a name (no account yet)" value={walkInName}
              onChange={(e) => { setWalkInName(e.target.value); setCustomerId(null) }}
              placeholder="Customer name" />
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium mb-4">What do they need?</h2>
          {products.map((p) => {
            const qty = cart[p.id] || 0
            return (
              <div key={p.id} className={cn('p-4 rounded-2xl border-2 bg-white flex justify-between items-center', qty > 0 ? 'border-[#181818]' : 'border-[#E8E8E5]')}>
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-[#707070]">{formatMoney(p.selling_price)}</p>
                </div>
                {qty === 0 ? (
                  <button type="button" onClick={() => setCart((c) => ({ ...c, [p.id]: 1 }))}
                    className="w-10 h-10 rounded-xl bg-[#181818] text-white flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setCart((c) => ({ ...c, [p.id]: qty - 1 }))} className="w-9 h-9 rounded-lg border border-[#E8E8E5] flex items-center justify-center">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setCart((c) => ({ ...c, [p.id]: qty + 1 }))} className="w-9 h-9 rounded-lg border border-[#E8E8E5] flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Due date & notes</h2>
          <Input label="Due date (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Delivery notes..." />
          <div className="bg-white border border-[#E8E8E5] rounded-2xl p-4 space-y-2 text-sm">
            {cartItems.map((i) => (
              <div key={i.id} className="flex justify-between">
                <span>{i.name} × {i.qty}</span>
                <span className="tabular-nums">{formatMoney(i.lineTotal)}</span>
              </div>
            ))}
            <div className="border-t border-[#E8E8E5] pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>
        </div>
      )}
    </FlowShell>
  )
}
