import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatNumber } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { SelectionCard } from '../../components/ui/SelectionCard'

export default function NewProductionFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [products, setProducts] = useState([])
  const [recipes, setRecipes] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [qty, setQty] = useState(100)
  const [materials, setMaterials] = useState([])
  const [actualQty, setActualQty] = useState(null)
  const [wasteQty, setWasteQty] = useState(0)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)
  const [batchId, setBatchId] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: p } = await supabase.from('products').select('id, name').eq('type', 'finished_good').eq('is_active', true)
      const { data: r } = await supabase.from('recipes').select('id, product_id, yield_quantity, recipe_items(product_id, quantity, products(id, name, unit, cost_price, type, inventory_balances(quantity)))')
      setProducts(p || [])
      setRecipes(r || [])
    }
    load()
  }, [])

  function selectProduct(id) {
    setSelectedProduct(id)
    const recipe = recipes.find((r) => r.product_id === id)
    if (recipe) {
      const mats = (recipe.recipe_items || []).map((ri) => ({
        ...ri,
        required: Number(ri.quantity) * qty,
        available: Number(ri.products?.inventory_balances?.[0]?.quantity || 0),
      }))
      setMaterials(mats)
    }
  }

  useEffect(() => {
    if (selectedProduct) selectProduct(selectedProduct)
  }, [qty])

  async function startAndComplete() {
    setSaving(true)
    setError(null)
    try {
      const recipe = recipes.find((r) => r.product_id === selectedProduct)
      const batchNumber = `PB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      const { data: batch, error: bErr } = await supabase
        .from('production_batches')
        .insert({
          batch_number: batchNumber,
          product_id: selectedProduct,
          recipe_id: recipe?.id,
          planned_quantity: qty,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select()
        .single()
      if (bErr) throw bErr

      // Insert consumptions
      const consumptions = materials.map((m) => ({
        batch_id: batch.id,
        product_id: m.product_id,
        quantity: m.required,
        unit_cost: Number(m.products?.cost_price || 0),
      }))
      await supabase.from('production_consumptions').insert(consumptions)

      const actual = actualQty ?? qty
      const { data, error: cErr } = await supabase.rpc('complete_production_batch', {
        p_batch_id: batch.id,
        p_actual_qty: actual,
        p_waste_qty: wasteQty,
        p_waste_reason: wasteQty > 0 ? 'Processing loss' : null,
      })
      if (cErr) throw cErr
      setSuccess({ ...data, batch_number: batchNumber, product: products.find((p) => p.id === selectedProduct)?.name })
    } catch (e) {
      setError(e.message || 'Production failed')
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
        <h1 className="text-xl font-semibold">Production completed</h1>
        <p className="text-[#707070] text-sm mt-1">{success.product} · {success.batch_number}</p>
        <div className="bg-white border border-[#E8E8E5] rounded-2xl p-4 w-full max-w-sm mt-6 text-sm space-y-2">
          <div className="flex justify-between"><span className="text-[#707070]">Unit cost</span><span className="tabular-nums">TZS {Number(success.unit_cost).toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-[#707070]">Total cost</span><span className="tabular-nums">TZS {Number(success.total_cost).toLocaleString()}</span></div>
        </div>
        <Button className="mt-8" onClick={() => navigate('/production')}>Done</Button>
      </div>
    )
  }

  const allAvailable = materials.every((m) => m.available >= m.required)

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] bg-white sticky top-0">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-semibold">New production</h1>
          <p className="text-xs text-[#707070]">Step {step + 1} of 3</p>
        </div>
      </div>

      <div className="flex-1 p-4">
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-medium mb-4">What are you making?</h2>
            {products.map((p) => (
              <SelectionCard
                key={p.id}
                title={p.name}
                selected={selectedProduct === p.id}
                onClick={() => selectProduct(p.id)}
              />
            ))}
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-lg font-medium mb-4">How many units?</h2>
            <div className="flex items-center justify-center gap-6 py-8">
              <button onClick={() => setQty(Math.max(1, qty - 10))} className="w-12 h-12 rounded-xl border border-[#E8E8E5] flex items-center justify-center">
                <Minus className="w-5 h-5" />
              </button>
              <span className="text-4xl font-semibold tabular-nums w-24 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 10)} className="w-12 h-12 rounded-xl border border-[#E8E8E5] flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-medium mb-3">Materials required</h3>
            <div className="space-y-2">
              {materials.map((m) => {
                const ok = m.available >= m.required
                return (
                  <div key={m.product_id} className="flex justify-between text-sm p-3 rounded-xl bg-white border border-[#E8E8E5]">
                    <span>{m.products?.name}</span>
                    <span className={ok ? 'text-[#707070]' : 'text-[#B4534A]'}>
                      {formatNumber(m.required, 2)} {m.products?.unit}
                      {!ok && ` (need ${formatNumber(m.required - m.available, 2)} more)`}
                    </span>
                  </div>
                )
              })}
            </div>
            {!allAvailable && (
              <p className="text-sm text-[#B4534A] mt-4">Not enough stock for this batch. Adjust quantity or restock.</p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Production result</h2>
            <div>
              <label className="text-sm text-[#707070]">Actual good output</label>
              <input
                type="number"
                className="mt-1 w-full h-12 px-4 rounded-xl border border-[#E8E8E5] text-lg tabular-nums"
                value={actualQty ?? qty}
                onChange={(e) => setActualQty(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-[#707070]">Waste / loss</label>
              <input
                type="number"
                className="mt-1 w-full h-12 px-4 rounded-xl border border-[#E8E8E5] text-lg tabular-nums"
                value={wasteQty}
                onChange={(e) => setWasteQty(Number(e.target.value))}
              />
            </div>
            {error && <div className="p-3 rounded-xl bg-[#B4534A]/10 text-[#B4534A] text-sm">{error}</div>}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#E8E8E5] bg-white">
        {step < 2 ? (
          <Button
            className="w-full"
            size="lg"
            disabled={(step === 0 && !selectedProduct) || (step === 1 && !allAvailable)}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button className="w-full" size="lg" loading={saving} onClick={startAndComplete}>
            Complete production
          </Button>
        )}
      </div>
    </div>
  )
}
