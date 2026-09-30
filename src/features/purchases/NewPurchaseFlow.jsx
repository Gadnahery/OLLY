import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { SelectionCard } from '../../components/ui/SelectionCard'

export default function NewPurchaseFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [qty, setQty] = useState(100)
  const [unitCost, setUnitCost] = useState(0)
  const [supplierId, setSupplierId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [paidAmount, setPaidAmount] = useState(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('id, name, unit, cost_price, type').in('type', ['raw_material', 'packaging']).eq('is_active', true),
      supabase.from('suppliers').select('id, name').eq('is_active', true),
    ]).then(([p, s]) => {
      setProducts(p.data || [])
      setSuppliers(s.data || [])
    })
  }, [])

  const total = qty * unitCost

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const { data, error: err } = await supabase.rpc('record_purchase', {
        p_supplier_id: supplierId,
        p_items: [{ product_id: selectedProduct, quantity: qty, unit_cost: unitCost }],
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
        <Button className="mt-8" onClick={() => navigate('/purchases')}>Done</Button>
      </div>
    )
  }

  const prod = products.find((p) => p.id === selectedProduct)

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] bg-white sticky top-0">
        <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">New purchase</h1>
      </div>
      <div className="flex-1 p-4">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">What are you buying?</h2>
            {products.map((p) => (
              <SelectionCard key={p.id} title={p.name} subtitle={p.type.replace('_', ' ')}
                selected={selectedProduct === p.id}
                onClick={() => { setSelectedProduct(p.id); setUnitCost(Number(p.cost_price) || 0) }} />
            ))}
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">How much?</h2>
            <p className="font-medium">{prod?.name}</p>
            <div>
              <label className="text-sm text-[#707070]">Quantity ({prod?.unit})</label>
              <input type="number" className="mt-1 w-full h-12 px-4 rounded-xl border border-[#E8E8E5] tabular-nums"
                value={qty} onChange={(e) => setQty(Number(e.target.value))} />
            </div>
            <div>
              <label className="text-sm text-[#707070]">Unit cost (TZS)</label>
              <input type="number" className="mt-1 w-full h-12 px-4 rounded-xl border border-[#E8E8E5] tabular-nums"
                value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
            </div>
            <p className="text-lg font-semibold tabular-nums">Total: {formatMoney(total)}</p>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">Who supplied it?</h2>
            {suppliers.map((s) => (
              <SelectionCard key={s.id} title={s.name} selected={supplierId === s.id} onClick={() => setSupplierId(s.id)} />
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">Payment</h2>
            <p className="text-2xl font-semibold tabular-nums mb-4">{formatMoney(total)}</p>
            {['cash', 'mobile_money', 'bank', 'credit'].map((m) => (
              <SelectionCard key={m} title={m.replace('_', ' ')} selected={paymentMethod === m}
                onClick={() => setPaymentMethod(m)} />
            ))}
            {error && <div className="p-3 rounded-xl bg-[#B4534A]/10 text-[#B4534A] text-sm">{error}</div>}
          </div>
        )}
      </div>
      <div className="p-4 border-t border-[#E8E8E5] bg-white">
        {step < 3 ? (
          <Button className="w-full" size="lg"
            disabled={(step === 0 && !selectedProduct) || (step === 2 && !supplierId)}
            onClick={() => setStep(s => s + 1)}>Continue</Button>
        ) : (
          <Button className="w-full" size="lg" loading={saving} onClick={save}>Save purchase</Button>
        )}
      </div>
    </div>
  )
}
