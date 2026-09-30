import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatNumber, formatMoney } from '../../utils/format'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { cn } from '../../utils/cn'
import { FilterChips } from '../../components/ui/FilterChips'

export default function InventoryPage() {
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [movements, setMovements] = useState([])
  const [showAdjust, setShowAdjust] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [lotNumber, setLotNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, type, unit, reorder_level, cost_price, selling_price, lot_tracking, shelf_life_days, inventory_balances(quantity)')
      .eq('is_active', true)
      .order('type')
      .order('name')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function openDetail(item) {
    setSelected(item)
    const { data } = await supabase
      .from('inventory_movements')
      .select('id, movement_type, quantity, unit_cost, notes, created_at, lot_number, expiry_date')
      .eq('product_id', item.id)
      .order('created_at', { ascending: false })
      .limit(40)
    setMovements(data || [])
  }

  async function refreshSelected(id) {
    const { data } = await supabase
      .from('products')
      .select('id, name, type, unit, reorder_level, cost_price, selling_price, lot_tracking, shelf_life_days, inventory_balances(quantity)')
      .eq('id', id)
      .single()
    if (data) {
      setSelected(data)
      await openDetail(data)
    }
    await load()
  }

  async function saveAdjustment() {
    if (!selected || adjustQty === '' || Number(adjustQty) === 0) return
    setSaving(true)
    try {
      const { error } = await supabase.rpc('adjust_stock', {
        p_product_id: selected.id,
        p_quantity: Number(adjustQty),
        p_notes: adjustNote || (Number(adjustQty) > 0 ? 'Stock in' : 'Stock out / write-off'),
        p_lot_number: lotNumber || null,
        p_expiry_date: expiryDate || null,
      })
      if (error) throw error
      addToast('Stock updated')
      setShowAdjust(false)
      setAdjustQty('')
      setAdjustNote('')
      setLotNumber('')
      setExpiryDate('')
      await refreshSelected(selected.id)
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function saveProductEdit() {
    if (!selected) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editForm.name,
          cost_price: Number(editForm.cost_price) || 0,
          selling_price: Number(editForm.selling_price) || 0,
          reorder_level: Number(editForm.reorder_level) || 0,
          unit: editForm.unit || selected.unit,
          lot_tracking: !!editForm.lot_tracking,
          shelf_life_days: editForm.shelf_life_days ? Number(editForm.shelf_life_days) : null,
        })
        .eq('id', selected.id)
      if (error) throw error
      addToast('Product updated')
      setShowEdit(false)
      await refreshSelected(selected.id)
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  function startEdit() {
    setEditForm({
      name: selected.name,
      cost_price: selected.cost_price,
      selling_price: selected.selling_price,
      reorder_level: selected.reorder_level,
      unit: selected.unit,
      lot_tracking: selected.lot_tracking,
      shelf_life_days: selected.shelf_life_days || '',
    })
    setShowEdit(true)
  }

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'raw_material', label: 'Raw materials' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'finished_good', label: 'Finished goods' },
  ]

  if (selected) {
    const qty = Number(selected.inventory_balances?.[0]?.quantity || 0)
    const low = qty <= Number(selected.reorder_level || 0)
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-[#707070] mb-4 hover:text-[#181818]">
          <ArrowLeft className="w-4 h-4" /> Inventory
        </button>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selected.name}</h1>
            <p className="text-sm text-[#707070] capitalize mt-0.5">{selected.type.replace('_', ' ')}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={startEdit}>
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>

        <Card className="mt-4 mb-4">
          <p className="text-sm text-[#707070]">Current stock</p>
          <p className={cn('text-3xl font-semibold tabular-nums mt-1', low && 'text-[#B7833F]')}>
            {formatNumber(qty, qty % 1 ? 2 : 0)}{' '}
            <span className="text-base font-normal text-[#707070]">{selected.unit}</span>
          </p>
          {low && <p className="text-sm text-[#B7833F] mt-2">Below reorder level ({selected.reorder_level})</p>}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#E8E8E5] text-sm">
            <div>
              <p className="text-xs text-[#707070]">Cost price</p>
              <p className="font-medium tabular-nums">{formatMoney(selected.cost_price)}</p>
            </div>
            {selected.type === 'finished_good' && (
              <div>
                <p className="text-xs text-[#707070]">Selling price</p>
                <p className="font-medium tabular-nums">{formatMoney(selected.selling_price)}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex gap-2 mb-6">
          <Button className="flex-1" onClick={() => { setAdjustQty(''); setShowAdjust(true) }}>
            <Plus className="w-4 h-4" /> Adjust stock
          </Button>
        </div>

        <h2 className="font-semibold mb-3">Movement history</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-[#707070]">No movements yet</p>
        ) : (
          <div className="space-y-1">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between py-3 border-b border-[#E8E8E5] last:border-0 text-sm">
                <div>
                  <p className="font-medium capitalize">{m.movement_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[#707070]">
                    {new Date(m.created_at).toLocaleString()}
                    {m.lot_number ? ` · Lot ${m.lot_number}` : ''}
                    {m.expiry_date ? ` · Exp ${m.expiry_date}` : ''}
                  </p>
                  {m.notes && <p className="text-xs text-[#707070]">{m.notes}</p>}
                </div>
                <p className={cn('tabular-nums font-medium', Number(m.quantity) > 0 ? 'text-[#3F8065]' : '')}>
                  {Number(m.quantity) > 0 ? '+' : ''}
                  {formatNumber(m.quantity, 2)} {selected.unit}
                </p>
              </div>
            ))}
          </div>
        )}

        <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust stock">
          <div className="space-y-3">
            <p className="text-sm text-[#707070]">
              Use positive numbers to add stock, negative to remove (e.g. -5 for write-off).
            </p>
            <Input label={`Quantity (${selected.unit})`} type="number" step="any" value={adjustQty}
              onChange={(e) => setAdjustQty(e.target.value)} placeholder="e.g. 50 or -10" />
            <Input label="Note (optional)" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
              placeholder="Received, counted, damaged..." />
            <Input label="Lot / batch number (optional)" value={lotNumber} onChange={(e) => setLotNumber(e.target.value)} />
            <Input label="Expiry date (optional)" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            <Button className="w-full" loading={saving} disabled={!adjustQty || Number(adjustQty) === 0} onClick={saveAdjustment}>
              Save adjustment
            </Button>
          </div>
        </Modal>

        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit product">
          <div className="space-y-3">
            <Input label="Name" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Unit" value={editForm.unit || ''} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
            <Input label="Cost price (TZS)" type="number" value={editForm.cost_price ?? ''}
              onChange={(e) => setEditForm({ ...editForm, cost_price: e.target.value })} />
            {selected.type === 'finished_good' && (
              <Input label="Selling price (TZS)" type="number" value={editForm.selling_price ?? ''}
                onChange={(e) => setEditForm({ ...editForm, selling_price: e.target.value })} />
            )}
            <Input label="Reorder level" type="number" value={editForm.reorder_level ?? ''}
              onChange={(e) => setEditForm({ ...editForm, reorder_level: e.target.value })} />
            <Input label="Shelf life (days, optional)" type="number" value={editForm.shelf_life_days ?? ''}
              onChange={(e) => setEditForm({ ...editForm, shelf_life_days: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!editForm.lot_tracking}
                onChange={(e) => setEditForm({ ...editForm, lot_tracking: e.target.checked })} />
              Track lot / batch numbers
            </label>
            <Button className="w-full" loading={saving} onClick={saveProductEdit}>Save changes</Button>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Inventory</h1>
      <p className="text-sm text-[#707070] mb-6">Stock, prices, adjustments · tap an item to manage</p>

      <FilterChips options={tabs.map((x) => ({ id: x.id, label: x.label }))} value={filter} onChange={setFilter} className="mb-6" />

      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const qty = Number(item.inventory_balances?.[0]?.quantity || 0)
            const low = qty <= Number(item.reorder_level || 0)
            return (
              <button key={item.id} onClick={() => openDetail(item)} className="text-left">
                <Card className="!p-4 hover:border-[#C8C8C5] transition-colors h-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-[#707070] mt-0.5 capitalize">{item.type.replace('_', ' ')}</p>
                    </div>
                    {low && <span className="text-xs text-[#B7833F] bg-[#B7833F]/10 px-2 py-0.5 rounded-full">Low</span>}
                  </div>
                  <p className="text-xl font-semibold tabular-nums mt-3">
                    {formatNumber(qty, qty % 1 ? 2 : 0)}{' '}
                    <span className="text-sm font-normal text-[#707070]">{item.unit}</span>
                  </p>
                  <p className="text-xs text-[#707070] mt-1 tabular-nums">
                    Cost {formatMoney(item.cost_price)}
                    {item.type === 'finished_good' ? ` · Sell ${formatMoney(item.selling_price)}` : ''}
                  </p>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
