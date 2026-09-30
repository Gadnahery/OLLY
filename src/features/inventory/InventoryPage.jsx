import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatNumber } from '../../utils/format'
import { Card } from '../../components/ui/Card'

export default function InventoryPage() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name, type, unit, reorder_level, inventory_balances(quantity)')
        .eq('is_active', true)
        .order('type')
        .order('name')
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter)
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'raw_material', label: 'Raw materials' },
    { id: 'packaging', label: 'Packaging' },
    { id: 'finished_good', label: 'Finished goods' },
  ]

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Inventory</h1>
      <p className="text-sm text-[#707070] mb-6">Stock levels by category</p>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
              filter === t.id ? 'bg-[#181818] text-white' : 'bg-white border border-[#E8E8E5] text-[#181818]'
            }`}
          >
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
              <Card key={item.id} className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-[#707070] mt-0.5 capitalize">{item.type.replace('_', ' ')}</p>
                  </div>
                  {low && <span className="text-xs text-[#B7833F] bg-[#B7833F]/10 px-2 py-0.5 rounded-full">Low</span>}
                </div>
                <p className="text-xl font-semibold tabular-nums mt-3">
                  {formatNumber(qty, qty % 1 ? 2 : 0)} <span className="text-sm font-normal text-[#707070]">{item.unit}</span>
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
