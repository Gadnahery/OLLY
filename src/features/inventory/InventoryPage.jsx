import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatNumber, formatMoney } from '../../utils/format'
import { Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [movements, setMovements] = useState([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name, type, unit, reorder_level, cost_price, selling_price, inventory_balances(quantity)')
        .eq('is_active', true)
        .order('type')
        .order('name')
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function openDetail(item) {
    setSelected(item)
    const { data } = await supabase
      .from('inventory_movements')
      .select('id, movement_type, quantity, unit_cost, notes, created_at, reference_type')
      .eq('product_id', item.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setMovements(data || [])
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
        <h1 className="text-2xl font-semibold tracking-tight">{selected.name}</h1>
        <p className="text-sm text-[#707070] capitalize mt-0.5">{selected.type.replace('_', ' ')}</p>

        <Card className="mt-6 mb-6">
          <p className="text-sm text-[#707070]">Current stock</p>
          <p className={cn('text-3xl font-semibold tabular-nums mt-1', low && 'text-[#B7833F]')}>
            {formatNumber(qty, qty % 1 ? 2 : 0)} <span className="text-base font-normal text-[#707070]">{selected.unit}</span>
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

        <h2 className="font-semibold mb-3">Movement history</h2>
        {movements.length === 0 ? (
          <p className="text-sm text-[#707070]">No movements yet</p>
        ) : (
          <div className="space-y-1">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between py-3 border-b border-[#E8E8E5] last:border-0 text-sm">
                <div>
                  <p className="font-medium capitalize">{m.movement_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[#707070]">{new Date(m.created_at).toLocaleString()}</p>
                </div>
                <p className={cn('tabular-nums font-medium', Number(m.quantity) > 0 ? 'text-[#3F8065]' : 'text-[#181818]')}>
                  {Number(m.quantity) > 0 ? '+' : ''}{formatNumber(m.quantity, 2)} {selected.unit}
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
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Inventory</h1>
      <p className="text-sm text-[#707070] mb-6">Stock levels by category · tap for movement history</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setFilter(t.id)}
            className={cn('px-4 py-2 rounded-full text-sm whitespace-nowrap',
              filter === t.id ? 'bg-[#181818] text-white' : 'bg-white border border-[#E8E8E5]')}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="skeleton h-16" />)}</div>
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
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
