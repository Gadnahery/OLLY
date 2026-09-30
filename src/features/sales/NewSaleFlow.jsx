import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { SelectionCard } from '../../components/ui/SelectionCard'
import { cn } from '../../utils/cn'

const STEPS = ['customer', 'products', 'payment', 'review']

export default function NewSaleFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [customerType, setCustomerType] = useState(null) // 'walkin' | 'existing'
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [cart, setCart] = useState({}) // productId -> qty
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('customers').select('id, name, phone').eq('is_active', true).order('name')
      const { data: p } = await supabase
        .from('products')
        .select('id, name, selling_price, unit, inventory_balances(quantity)')
        .eq('type', 'finished_good')
        .eq('is_active', true)
        .order('name')
      setCustomers(c || [])
      setProducts(p || [])
    }
    load()
  }, [])

  const cartItems = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const prod = products.find((p) => p.id === id)
      return { ...prod, qty, lineTotal: qty * Number(prod?.selling_price || 0) }
    })
  const total = cartItems.reduce((s, i) => s + i.lineTotal, 0)

  function addToCart(id) {
    setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  }
  function setQty(id, qty) {
    setCart((c) => {
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  async function saveSale() {
    setSaving(true)
    setError(null)
    try {
      const items = cartItems.map((i) => ({
        product_id: i.id,
        quantity: i.qty,
        unit_price: Number(i.selling_price),
      }))
      const { data, error: err } = await supabase.rpc('record_sale', {
        p_customer_id: customerType === 'existing' ? selectedCustomer : null,
        p_items: items,
        p_payment_method: paymentMethod,
        p_paid_amount: paymentMethod === 'credit' ? 0 : total,
      })
      if (err) throw err
      setSuccess(data)
    } catch (e) {
      setError(e.message || 'Failed to save sale')
    } finally {
      setSaving(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 flow-enter">
        <div className="w-16 h-16 rounded-full bg-[#3F8065]/10 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-[#3F8065]" />
        </div>
        <h1 className="text-xl font-semibold mb-1">Sale completed</h1>
        <p className="text-[#707070] text-sm mb-6">{formatMoney(success.total)}</p>
        <div className="bg-white border border-[#E8E8E5] rounded-2xl p-4 w-full max-w-sm space-y-2 text-sm mb-8">
          <div className="flex justify-between"><span className="text-[#707070]">Invoice</span><span>{success.invoice_number}</span></div>
          <div className="flex justify-between"><span className="text-[#707070]">Gross profit</span><span className="text-[#3F8065]">{formatMoney(success.gross_profit)}</span></div>
          <div className="text-[#707070] text-xs pt-2 border-t border-[#E8E8E5]">Inventory updated · Customer balance updated</div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate('/sales')}>View sales</Button>
          <Button onClick={() => navigate('/')}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] bg-white sticky top-0 z-10">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold">New sale</h1>
          <p className="text-xs text-[#707070]">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <div className="flex-1 p-4 flow-enter">
        {/* Step: Customer */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">Who is buying?</h2>
            <SelectionCard
              title="Walk-in customer"
              selected={customerType === 'walkin'}
              onClick={() => { setCustomerType('walkin'); setSelectedCustomer(null) }}
            />
            <SelectionCard
              title="Existing customer"
              selected={customerType === 'existing'}
              onClick={() => setCustomerType('existing')}
            />
            {customerType === 'existing' && (
              <div className="mt-4 space-y-2">
                {customers.map((c) => (
                  <SelectionCard
                    key={c.id}
                    title={c.name}
                    subtitle={c.phone}
                    selected={selectedCustomer === c.id}
                    onClick={() => setSelectedCustomer(c.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Products */}
        {step === 1 && (
          <div className="space-y-3 pb-24">
            <h2 className="text-lg font-medium mb-4">What are they buying?</h2>
            {products.map((p) => {
              const qty = cart[p.id] || 0
              const stock = Number(p.inventory_balances?.[0]?.quantity || 0)
              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-2xl border-2 bg-white',
                    qty > 0 ? 'border-[#181818]' : 'border-[#E8E8E5]'
                  )}
                >
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-sm text-[#707070] tabular-nums">{formatMoney(p.selling_price)} · {stock} in stock</div>
                  </div>
                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(p.id)}
                      className="w-10 h-10 rounded-xl bg-[#181818] text-white flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button onClick={() => setQty(p.id, qty - 1)} className="w-9 h-9 rounded-lg border border-[#E8E8E5] flex items-center justify-center">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium tabular-nums">{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)} className="w-9 h-9 rounded-lg border border-[#E8E8E5] flex items-center justify-center" disabled={qty >= stock}>
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Step: Payment */}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">How are they paying?</h2>
            {['cash', 'mobile_money', 'bank', 'credit'].map((m) => (
              <SelectionCard
                key={m}
                title={m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                selected={paymentMethod === m}
                onClick={() => setPaymentMethod(m)}
              />
            ))}
          </div>
        )}

        {/* Step: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium mb-2">Sale summary</h2>
            <div className="bg-white border border-[#E8E8E5] rounded-2xl p-4 space-y-3">
              {cartItems.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.name} × {i.qty}</span>
                  <span className="tabular-nums">{formatMoney(i.lineTotal)}</span>
                </div>
              ))}
              <div className="border-t border-[#E8E8E5] pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatMoney(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#707070]">
                <span>Payment</span>
                <span className="capitalize">{paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-sm text-[#707070]">
                <span>Customer</span>
                <span>{customerType === 'walkin' ? 'Walk-in' : customers.find((c) => c.id === selectedCustomer)?.name}</span>
              </div>
            </div>
            {error && (
              <div className="p-3 rounded-xl bg-[#B4534A]/10 text-[#B4534A] text-sm">{error}</div>
            )}
          </div>
        )}
      </div>

      {/* Sticky bottom */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-[#E8E8E5]">
        {step === 1 && cartItems.length > 0 && (
          <p className="text-sm text-[#707070] mb-2 tabular-nums">
            {cartItems.reduce((s, i) => s + i.qty, 0)} items · {formatMoney(total)}
          </p>
        )}
        {step < 3 ? (
          <Button
            className="w-full"
            size="lg"
            disabled={
              (step === 0 && (!customerType || (customerType === 'existing' && !selectedCustomer))) ||
              (step === 1 && cartItems.length === 0)
            }
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button className="w-full" size="lg" loading={saving} onClick={saveSale}>
            Save sale
          </Button>
        )}
      </div>
    </div>
  )
}
