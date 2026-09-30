import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function SalesPage() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sales')
        .select('id, invoice_number, sale_date, total_amount, paid_amount, payment_status, payment_method, customers(name)')
        .order('created_at', { ascending: false })
        .limit(50)
      setSales(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-[#707070] mt-0.5">Record and track sales</p>
        </div>
        <Link to="/sales/new">
          <Button><Plus className="w-4 h-4" /> New sale</Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : sales.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#707070] mb-4">No sales yet</p>
          <Link to="/sales/new"><Button>Record first sale</Button></Link>
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E8E5] text-left text-[#707070]">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium text-right">Total</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} className="border-b border-[#E8E8E5] last:border-0 hover:bg-[#F7F7F5]">
                    <td className="px-5 py-3.5">{s.sale_date}</td>
                    <td className="px-5 py-3.5">{s.customers?.name || 'Walk-in'}</td>
                    <td className="px-5 py-3.5 text-[#707070]">{s.invoice_number}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatMoney(s.total_amount)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        s.payment_status === 'paid' ? 'bg-[#3F8065]/10 text-[#3F8065]' :
                        s.payment_status === 'partial' ? 'bg-[#B7833F]/10 text-[#B7833F]' :
                        'bg-[#B4534A]/10 text-[#B4534A]'
                      }`}>
                        {s.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sales.map((s) => (
              <Card key={s.id} className="!p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{s.customers?.name || 'Walk-in'}</p>
                    <p className="text-xs text-[#707070] mt-0.5">{s.sale_date} · {s.invoice_number}</p>
                  </div>
                  <p className="font-semibold tabular-nums">{formatMoney(s.total_amount)}</p>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    s.payment_status === 'paid' ? 'bg-[#3F8065]/10 text-[#3F8065]' : 'bg-[#B7833F]/10 text-[#B7833F]'
                  }`}>{s.payment_status}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
