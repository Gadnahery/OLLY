import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowLeft, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { useLanguage } from '../../i18n/LanguageContext'

export default function SalesPage() {
  const { t } = useLanguage()
  const { addToast } = useToast()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [items, setItems] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('sales')
      .select('id, invoice_number, sale_date, total_amount, paid_amount, payment_status, payment_method, cogs_amount, customers(name)')
      .neq('payment_status', 'cancelled')
      .order('created_at', { ascending: false })
      .limit(50)
    setSales(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function openDetail(s) {
    setSelected(s)
    const { data } = await supabase
      .from('sale_items')
      .select('quantity, unit_price, unit_cost, products(name)')
      .eq('sale_id', s.id)
    setItems(data || [])
  }

  async function handleDelete() {
    if (!selected) return
    setDeleting(true)
    try {
      const { error } = await supabase.rpc('delete_sale', { p_sale_id: selected.id })
      if (error) throw error
      addToast(t('saleDeleted'))
      setConfirmDelete(false)
      setSelected(null)
      await load()
    } catch (e) {
      addToast(e.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (selected) {
    const gross = Number(selected.total_amount) - Number(selected.cogs_amount || 0)
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-[#707070] mb-4 hover:text-[#181818]">
          <ArrowLeft className="w-4 h-4" /> {t('sales')}
        </button>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selected.invoice_number}</h1>
            <p className="text-sm text-[#707070] mt-0.5">{selected.sale_date} · {selected.customers?.name || t('walkIn')}</p>
          </div>
          <StatusBadge status={selected.payment_status} />
        </div>
        <Card className="mb-4 space-y-3">
          {items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{i.products?.name} × {i.quantity}</span>
              <span className="tabular-nums">{formatMoney(Number(i.quantity) * Number(i.unit_price))}</span>
            </div>
          ))}
          <div className="border-t border-[#E8E8E5] pt-3 flex justify-between font-semibold">
            <span>{t('total')}</span>
            <span className="tabular-nums">{formatMoney(selected.total_amount)}</span>
          </div>
          <div className="flex justify-between text-sm text-[#707070]">
            <span>COGS</span>
            <span className="tabular-nums">{formatMoney(selected.cogs_amount || 0)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium text-[#3F8065]">
            <span>{t('grossProfit')}</span>
            <span className="tabular-nums">{formatMoney(gross)}</span>
          </div>
        </Card>
        <Button variant="secondary" className="w-full text-[#B4534A]" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="w-4 h-4" /> {t('delete')}
        </Button>

        <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title={t('delete')}>
          <p className="text-sm text-[#707070] mb-4">{t('confirmDeleteSale')}</p>
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(false)}>{t('cancel')}</Button>
            <Button className="flex-1 !bg-[#B4534A]" loading={deleting} onClick={handleDelete}>{t('delete')}</Button>
          </div>
        </Modal>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('sales')}</h1>
          <p className="text-sm text-[#707070] mt-0.5">Record and track sales</p>
        </div>
        <Link to="/sales/new"><Button><Plus className="w-4 h-4" /> {t('newSale')}</Button></Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-20" />)}</div>
      ) : sales.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[#707070] mb-4">{t('noSales')}</p>
          <Link to="/sales/new"><Button>{t('recordFirstSale')}</Button></Link>
        </Card>
      ) : (
        <>
          <div className="hidden md:block bg-white border border-[#E8E8E5] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8E8E5] text-left text-[#707070]">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Invoice</th>
                  <th className="px-5 py-3 font-medium text-right">{t('total')}</th>
                  <th className="px-5 py-3 font-medium">{t('payment')}</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s.id} onClick={() => openDetail(s)} className="border-b border-[#E8E8E5] last:border-0 hover:bg-[#F7F7F5] cursor-pointer">
                    <td className="px-5 py-3.5">{s.sale_date}</td>
                    <td className="px-5 py-3.5">{s.customers?.name || t('walkIn')}</td>
                    <td className="px-5 py-3.5 text-[#707070]">{s.invoice_number}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums font-medium">{formatMoney(s.total_amount)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={s.payment_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {sales.map((s) => (
              <button key={s.id} onClick={() => openDetail(s)} className="w-full text-left">
                <Card className="!p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{s.customers?.name || t('walkIn')}</p>
                      <p className="text-xs text-[#707070] mt-0.5">{s.sale_date} · {s.invoice_number}</p>
                    </div>
                    <p className="font-semibold tabular-nums">{formatMoney(s.total_amount)}</p>
                  </div>
                  <div className="mt-2"><StatusBadge status={s.payment_status} /></div>
                </Card>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
