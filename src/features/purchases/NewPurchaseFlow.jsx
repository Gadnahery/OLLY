import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { SelectionCard } from '../../components/ui/SelectionCard'
import { cn } from '../../utils/cn'

export default function NewPurchaseFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  // cart: { [productId]: { qty, unitCost } }
  const [cart, setCart] = useState({})
  const [editingCost, setEditingCost] = useState(null)
  const [supplierId, setSupplierId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, name, unit, cost_price, type').in('type', ['raw_material', 'packaging']).eq('is_active', true).order('name'),
      supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
    ]).then(([p, s]) => {
      setProducts(p.data || [])
      setSuppliers(s.data || [])
    })
  }, [])

  const cartItems = Object.entries(cart)
    .filter(([, v]) => v.qty > 0)
    .map(([id, v]) => {
      const prod = products.find((p) => p.id === id)
      return { ...prod, qty: v.qty, unitCost: v.unitCost, lineTotal: v.qty * v.unitCost }
    })
  const total = cartItems.reduce((s, i) => s + i.lineTotal, 0)

  function addProduct(id) {
    const prod = products.find((p) => p.id === id)
    setCart((c) => ({
      ...c,
      [id]: c[id] || { qty: 1, unitCost: Number(prod?.cost_price || 0) },
    }))
  }
  function setQty(id, qty) {
    setCart((c) => {
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = { ...next[id], qty }
      return next
    })
  }
  function setCost(id, unitCost) {
    setCart((c) => ({ ...c, [id]: { ...c[id], unitCost: Number(unitCost) || 0 } }))
  }

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const items = cartItems.map((i) => ({
        product_id: i.id,
        quantity: i.qty,
        unit_cost: i.unitCost,
      }))
      const { data, error: err } = await supabase.rpc('record_purchase', {
        p_supplier_id: supplierId,
        p_items: items,
        p_payment_method: paymentMethod,
        p_paid_amount: paidAmount ?? (paymentMethod === 'credit' ? 0 : total),
      })
      if (err) throw err
      setSuccess(data)
    } catch (e) {
      setError(e.message)
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
        <h1 className="text-xl font-semibold">Purchase saved</h1>
        <p className="text-[#707070] mt-1">{formatMoney(success.total)}</p>
        <p className="text-xs text-[#707070] mt-2">Inventory updated · Supplier balance updated</p>
        <Button className="mt-8" onClick={() => navigate('/purchases')}>Done</Button>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] bg-white sticky top-0 z-10">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold">New purchase</h1>
          <p className="text-xs text-[#707070]">Step {step + 1} of 4</p>
        </div>
      </div>

      <div className="flex-1 p-4 flow-enter">
        {step === 0 && (
          <div className="space-y-3 pb-24">
            <h2 className="text-lg font-medium mb-4">What are you buying?</h2>
            {products.map((p) => {
              const item = cart[p.id]
              return (
                <div key={p.id} className={cn('p-4 rounded-2xl border-2 bg-white', item ? 'border-[#181818]' : 'border-[#E8E8E5]')}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-sm text-[#707070] capitalize">{p.type.replace('_', ' ')} · {p.unit}</div>
                    </div>
                    {!item ? (
                      <button onClick={() => addProduct(p.id)} className="w-10 h-10 rounded-xl bg-[#181818] text-white flex items-center justify-center">
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(p.id, item.qty - 1)} className="w-8 h-8 rounded-lg border border-[#E8E8E5] flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center tabular-nums font-medium">{item.qty}</span>
                        <button onClick={() => setQty(p.id, item.qty + 1)} className="w-8 h-8 rounded-lg border border-[#E8E8E5] flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {item && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs text-[#707070]">Unit cost</span>
                      <input
                        type="number"
                        className="h-9 w-28 px-2 rounded-lg border border-[#E8E8E5] text-sm tabular-nums"
                        value={item.unitCost}
                        onChange={(e) => setCost(p.id, e.target.value)}
                      />
                      <span className="text-xs text-[#707070] ml-auto tabular-nums">{formatMoney(item.qty * item.unitCost)}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">Who supplied it?</h2>
            {suppliers.map((s) => (
              <SelectionCard key={s.id} title={s.name} selected={supplierId === s.id} onClick={() => setSupplierId(s.id)} />
            ))}
            {suppliers.length === 0 && <p className="text-sm text-[#707070]">No suppliers. Add one in Suppliers first.</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">Payment</h2>
            <p className="text-2xl font-semibold tabular-nums mb-4">{formatMoney(total)}</p>
            {['cash', 'mobile_money', 'bank', 'credit'].map((m) => (
              <SelectionCard
                key={m}
                title={m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                selected={paymentMethod === m}
                onClick={() => setPaymentMethod(m)}
              />
            ))}
            {paymentMethod !== 'credit' && (
              <div className="mt-4">
                <label className="text-sm text-[#707070]">Paid now (leave blank for full)</label>
                <input type="number" className="mt-1 w-full h-11 px-4 rounded-xl border border-[#E8E8E5] tabular-nums"
                  value={paidAmount ?? ''} onChange={(e) => setPaidAmount(e.target.value === '' ? null : Number(e.target.value))}
                  placeholder={String(total)} />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Purchase summary</h2>
            <div className="bg-white border border-[#E8E8E5] rounded-2xl p-4 space-y-3">
              {cartItems.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.name} × {i.qty} {i.unit}</span>
                  <span className="tabular-nums">{formatMoney(i.lineTotal)}</span>
                </div>
              ))}
              <div className="border-t border-[#E8E8E5] pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#707070]">
                <span>Supplier</span>
                <span>{suppliers.find((s) => s.id === supplierId)?.name}</span>
              </div>
              <div className="flex justify-between text-sm text-[#707070]">
                <span>Payment</span>
                <span className="capitalize">{paymentMethod.replace('_', ' ')}</span>
              </div>
            </div>
            {error && <div className="p-3 rounded-xl bg-[#B4534A]/10 text-[#B4534A] text-sm">{error}</div>}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 p-4 bg-white border-t border-[#E8E8E5]">
        {step === 0 && cartItems.length > 0 && (
          <p className="text-sm text-[#707070] mb-2 tabular-nums">{cartItems.length} items · {formatMoney(total)}</p>
        )}
        {step < 3 ? (
          <Button className="w-full" size="lg"
            disabled={(step === 0 && cartItems.length === 0) || (step === 1 && !supplierId)}
            onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button className="w-full" size="lg" loading={saving} onClick={save}>Save purchase</Button>
        )}
      </div>
    </div>
  )
}
