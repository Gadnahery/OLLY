import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { SelectionCard } from '../../components/ui/SelectionCard'

export default function PaymentFlow() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(null) // 'in' | 'out'
  const [customers, setCustomers] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [partyId, setPartyId] = useState(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      supabase.from('customers').select('id, name').eq('is_active', true).order('name'),
      supabase.from('suppliers').select('id, name').eq('is_active', true).order('name'),
    ]).then(([c, s]) => {
      setCustomers(c.data || [])
      setSuppliers(s.data || [])
    })
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const amt = Number(amount)
      const payload = {
        direction,
        amount: amt,
        payment_method: method,
        payment_date: new Date().toISOString().slice(0, 10),
        customer_id: direction === 'in' ? partyId : null,
        supplier_id: direction === 'out' ? partyId : null,
      }
      const { error: err } = await supabase.from('payments').insert(payload)
      if (err) throw err

      await supabase.from('ledger_entries').insert({
        entry_type: direction === 'in' ? 'payment_in' : 'payment_out',
        amount: amt,
        description: direction === 'in' ? 'Customer payment' : 'Supplier payment',
        reference_type: direction === 'in' ? 'customer' : 'supplier',
        reference_id: partyId,
        entry_date: new Date().toISOString().slice(0, 10),
      })

      // Apply to open invoices
      if (direction === 'in') {
        const { data: open } = await supabase.from('sales')
          .select('id, total_amount, paid_amount')
          .eq('customer_id', partyId).neq('payment_status', 'paid')
          .order('sale_date', { ascending: true })
        let remaining = amt
        for (const s of open || []) {
          if (remaining <= 0) break
          const due = Number(s.total_amount) - Number(s.paid_amount)
          const apply = Math.min(due, remaining)
          const newPaid = Number(s.paid_amount) + apply
          await supabase.from('sales').update({
            paid_amount: newPaid,
            payment_status: newPaid >= Number(s.total_amount) ? 'paid' : 'partial',
          }).eq('id', s.id)
          remaining -= apply
        }
      } else {
        const { data: open } = await supabase.from('purchases')
          .select('id, total_amount, paid_amount')
          .eq('supplier_id', partyId).neq('payment_status', 'paid')
          .order('purchase_date', { ascending: true })
        let remaining = amt
        for (const p of open || []) {
          if (remaining <= 0) break
          const due = Number(p.total_amount) - Number(p.paid_amount)
          const apply = Math.min(due, remaining)
          const newPaid = Number(p.paid_amount) + apply
          await supabase.from('purchases').update({
            paid_amount: newPaid,
            payment_status: newPaid >= Number(p.total_amount) ? 'paid' : 'partial',
          }).eq('id', p.id)
          remaining -= apply
        }
      }

      setSuccess(true)
    } catch (e) {
      setError(e.message)
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
        <h1 className="text-xl font-semibold">Payment recorded</h1>
        <p className="text-[#707070] mt-1">{formatMoney(amount)}</p>
        <Button className="mt-8" onClick={() => navigate('/finance')}>Done</Button>
      </div>
    )
  }

  const parties = direction === 'in' ? customers : suppliers

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] bg-white sticky top-0">
        <button onClick={() => (step === 0 ? navigate(-1) : setStep((s) => s - 1))} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">Record payment</h1>
      </div>
      <div className="flex-1 p-4 pb-28 space-y-3">
        {step === 0 && (
          <>
            <h2 className="text-lg font-medium mb-4">What kind of payment?</h2>
            <SelectionCard title="From customer" subtitle="Money received" selected={direction === 'in'} onClick={() => setDirection('in')} />
            <SelectionCard title="To supplier" subtitle="Money paid out" selected={direction === 'out'} onClick={() => setDirection('out')} />
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="text-lg font-medium mb-4">{direction === 'in' ? 'Which customer?' : 'Which supplier?'}</h2>
            {parties.map((p) => (
              <SelectionCard key={p.id} title={p.name} selected={partyId === p.id} onClick={() => setPartyId(p.id)} />
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-lg font-medium mb-4">Amount & method</h2>
            <input type="number" className="w-full h-12 px-4 rounded-xl border border-[#E8E8E5] text-lg tabular-nums mb-4"
              placeholder="Amount TZS" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'mobile_money', 'bank'].map((m) => (
                <SelectionCard key={m} title={m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                  selected={method === m} onClick={() => setMethod(m)} />
              ))}
            </div>
            {error && <p className="text-sm text-[#B4534A] mt-3">{error}</p>}
          </>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 border-t border-[#E8E8E5] bg-white md:sticky md:inset-x-auto safe-area-pb">
        {step < 2 ? (
          <Button className="w-full" size="lg"
            disabled={(step === 0 && !direction) || (step === 1 && !partyId)}
            onClick={() => setStep((s) => s + 1)}>
            Continue
          </Button>
        ) : (
          <Button className="w-full" size="lg" loading={saving} disabled={!amount} onClick={save}>
            Save payment
          </Button>
        )}
      </div>
    </div>
  )
}
