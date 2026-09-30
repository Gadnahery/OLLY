import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney, formatNumber } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { cn } from '../../utils/cn'
import { FilterChips } from '../../components/ui/FilterChips'

export default function ProductionPage() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [consumptions, setConsumptions] = useState([])
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    supabase.from('production_batches')
      .select('id, batch_number, planned_quantity, actual_quantity, waste_quantity, waste_reason, status, material_cost, packaging_cost, labor_cost, overhead_cost, total_cost, unit_cost, started_at, completed_at, products(name)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setBatches(data || []); setLoading(false) })
  }, [])

  async function openDetail(b) {
    setSelected(b)
    const { data } = await supabase
      .from('production_consumptions')
      .select('quantity, unit_cost, products(name, unit, type)')
      .eq('batch_id', b.id)
    setConsumptions(data || [])
  }

  if (selected) {
    return (
      <div className="p-4 md:p-8 max-w-2xl md:max-w-4xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-[#707070] mb-4 hover:text-[#181818]">
          <ArrowLeft className="w-4 h-4" /> Production
        </button>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selected.products?.name}</h1>
            <p className="text-sm text-[#707070] mt-0.5">{selected.batch_number}</p>
          </div>
          <StatusBadge status={selected.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="!p-4">
            <p className="text-xs text-[#707070]">Planned</p>
            <p className="text-xl font-semibold tabular-nums">{formatNumber(selected.planned_quantity)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-[#707070]">Good output</p>
            <p className="text-xl font-semibold tabular-nums text-[#3F8065]">{formatNumber(selected.actual_quantity || 0)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-[#707070]">Waste</p>
            <p className="text-xl font-semibold tabular-nums">{formatNumber(selected.waste_quantity || 0)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-[#707070]">Unit cost</p>
            <p className="text-xl font-semibold tabular-nums">{formatMoney(selected.unit_cost || 0)}</p>
          </Card>
        </div>

        {/* Desktop: 2-column workspace; Mobile: stacked */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <h3 className="font-semibold mb-3">Materials consumed</h3>
            {consumptions.length === 0 ? (
              <p className="text-sm text-[#707070]">No consumption data</p>
            ) : (
              <div className="space-y-2 text-sm">
                {consumptions.map((c, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{c.products?.name}</span>
                    <span className="tabular-nums text-[#707070]">
                      {formatNumber(c.quantity, 2)} {c.products?.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <h3 className="font-semibold mb-3">Cost breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#707070]">Materials</span><span className="tabular-nums">{formatMoney(selected.material_cost || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#707070]">Packaging</span><span className="tabular-nums">{formatMoney(selected.packaging_cost || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#707070]">Labor</span><span className="tabular-nums">{formatMoney(selected.labor_cost || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#707070]">Overhead</span><span className="tabular-nums">{formatMoney(selected.overhead_cost || 0)}</span></div>
              <div className="flex justify-between border-t border-[#E8E8E5] pt-2 font-semibold">
                <span>Total</span><span className="tabular-nums">{formatMoney(selected.total_cost || 0)}</span>
              </div>
            </div>
            {selected.waste_reason && (
              <p className="text-xs text-[#707070] mt-4">Waste reason: {selected.waste_reason}</p>
            )}
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production</h1>
          <p className="text-sm text-[#707070] mt-0.5">Batches, materials, output and waste</p>
        </div>
        <Link to="/production/new"><Button><Plus className="w-4 h-4" /> New production</Button></Link>
      </div>

      <FilterChips
        options={[
          { id: 'all', label: 'All' },
          { id: 'in_progress', label: 'In progress' },
          { id: 'completed', label: 'Completed' },
        ]}
        value={statusFilter}
        onChange={setStatusFilter}
        className="mb-5"
      />

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : batches.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#707070] mb-4">No batches yet</p>
          <Link to="/production/new"><Button>Start first production</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {(statusFilter === 'all' ? batches : batches.filter(b => b.status === statusFilter)).map((b) => (
            <button key={b.id} onClick={() => openDetail(b)} className="w-full text-left">
              <Card className="!p-4 flex justify-between items-center hover:border-[#C8C8C5] transition-colors">
                <div>
                  <p className="font-medium">{b.products?.name}</p>
                  <p className="text-xs text-[#707070] mt-0.5">{b.batch_number}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums font-medium">
                    {b.actual_quantity ?? b.planned_quantity} units
                  </p>
                  <div className="mt-1"><StatusBadge status={b.status} /></div>
                </div>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
