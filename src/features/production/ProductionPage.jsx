import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function ProductionPage() {
  const [batches, setBatches] = useState([])
  useEffect(() => {
    supabase.from('production_batches')
      .select('id, batch_number, planned_quantity, actual_quantity, status, products(name)')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => setBatches(data || []))
  }, [])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Production</h1>
          <p className="text-sm text-[#707070] mt-0.5">Batches, materials, output and waste</p>
        </div>
        <Link to="/production/new"><Button><Plus className="w-4 h-4" /> New production</Button></Link>
      </div>
      {batches.length === 0 ? (
        <Card className="text-center py-12"><p className="text-[#707070]">No batches yet</p></Card>
      ) : (
        <div className="space-y-3">
          {batches.map((b) => (
            <Card key={b.id} className="!p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{b.products?.name}</p>
                <p className="text-xs text-[#707070]">{b.batch_number}</p>
              </div>
              <div className="text-right">
                <p className="tabular-nums font-medium">{b.actual_quantity ?? b.planned_quantity} units</p>
                <span className={`text-xs ${b.status === 'completed' ? 'text-[#3F8065]' : 'text-[#B7833F]'}`}>{b.status}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
