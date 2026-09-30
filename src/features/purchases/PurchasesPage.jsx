import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { FilterChips } from '../../components/ui/FilterChips'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('purchases')
      .select('id, purchase_date, invoice_number, total_amount, paid_amount, payment_status, payment_method, suppliers(name)')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { setPurchases(data || []); setLoading(false) })
  }, [])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
          <p className="text-sm text-[#707070] mt-0.5">Buy raw materials and packaging</p>
        </div>
        <Link to="/purchases/new"><Button><Plus className="w-4 h-4" /> New purchase</Button></Link>
      </div>

      <FilterChips
        options={[
          { id: 'all', label: 'All' },
          { id: 'paid', label: 'Paid' },
          { id: 'pending', label: 'Unpaid / partial' },
        ]}
        value={filter}
        onChange={setFilter}
        className="mb-5"
      />

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : (filter === 'all' ? purchases : purchases.filter(p => filter === 'paid' ? p.payment_status === 'paid' : p.payment_status !== 'paid')).length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#707070] mb-4">No purchases yet</p>
          <Link to="/purchases/new"><Button>Record first purchase</Button></Link>
        </Card>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E8E5] text-left text-[#707070]">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Supplier</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(filter === 'all' ? purchases : purchases.filter(p => filter === 'paid' ? p.payment_status === 'paid' : p.payment_status !== 'paid')).map((p) => (
                  <tr key={p.id} className="border-b border-[#E8E8E5] last:border-0 hover:bg-[#F7F7F5]">
                    <td className="px-5 py-3.5">{p.purchase_date}</td>
                    <td className="px-5 py-3.5">{p.suppliers?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatMoney(p.total_amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        p.payment_status === 'paid' ? 'bg-[#3F8065]/10 text-[#3F8065]' :
                        p.payment_status === 'partial' ? 'bg-[#B7833F]/10 text-[#B7833F]' :
                        'bg-[#B4534A]/10 text-[#B4534A]'
                      }`}>{p.payment_status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {(filter === 'all' ? purchases : purchases.filter(p => filter === 'paid' ? p.payment_status === 'paid' : p.payment_status !== 'paid')).map((p) => (
              <Card key={p.id} className="!p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{p.suppliers?.name || '—'}</p>
                    <p className="text-xs text-[#707070] mt-0.5">{p.purchase_date}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatMoney(p.total_amount)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                  p.payment_status === 'paid' ? 'bg-[#3F8065]/10 text-[#3F8065]' : 'bg-[#B7833F]/10 text-[#B7833F]'
                }`}>{p.payment_status}</span>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
