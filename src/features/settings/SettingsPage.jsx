import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { formatMoney, formatNumber } from '../../utils/format'
import { Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'

export default function SettingsPage() {
  const [products, setProducts] = useState([])
  const [tab, setTab] = useState('products')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('products').select('id, name, type, unit, selling_price, cost_price, reorder_level, is_active')
      .order('type').order('name')
      .then(({ data }) => { setProducts(data || []); setLoading(false) })
  }, [])

  const tabs = [
    { id: 'products', label: 'Products' },
    { id: 'business', label: 'Business' },
  ]

  const byType = {
    raw_material: products.filter((p) => p.type === 'raw_material'),
    packaging: products.filter((p) => p.type === 'packaging'),
    finished_good: products.filter((p) => p.type === 'finished_good'),
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[#707070] mt-0.5">Products, recipes and business config</p>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('px-4 py-2 rounded-full text-sm',
              tab === t.id ? 'bg-[#181818] text-white' : 'bg-white border border-[#E8E8E5]')}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'business' && (
        <Card>
          <h3 className="font-semibold mb-2">OLLY</h3>
          <p className="text-sm text-[#707070]">Food-processing ERP · Connected to Supabase</p>
          <p className="text-sm text-[#707070] mt-4">Currency: TZS</p>
          <p className="text-sm text-[#707070]">Business: Peanut butter & tahini production</p>
        </Card>
      )}

      {tab === 'products' && (
        loading ? (
          <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
        ) : (
          <div className="space-y-6">
            {[
              { key: 'finished_good', label: 'Finished goods' },
              { key: 'raw_material', label: 'Raw materials' },
              { key: 'packaging', label: 'Packaging' },
            ].map((section) => (
              <div key={section.key}>
                <h3 className="text-sm font-medium text-[#707070] mb-2 uppercase tracking-wider">{section.label}</h3>
                <div className="space-y-2">
                  {byType[section.key].map((p) => (
                    <Card key={p.id} className="!p-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-[#707070] mt-0.5">Unit: {p.unit} · Reorder at {formatNumber(p.reorder_level)}</p>
                      </div>
                      <div className="text-right text-sm">
                        {p.type === 'finished_good' && (
                          <p className="tabular-nums font-medium">{formatMoney(p.selling_price)}</p>
                        )}
                        <p className="text-xs text-[#707070] tabular-nums">Cost {formatMoney(p.cost_price)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
