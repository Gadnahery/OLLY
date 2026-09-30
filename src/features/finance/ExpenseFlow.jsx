import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { SelectionCard } from '../../components/ui/SelectionCard'

const CATEGORIES = ['Transport', 'Electricity', 'Water', 'Security', 'Rent', 'Maintenance', 'Other']

export default function ExpenseFlow() {
  const navigate = useNavigate()
  const [category, setCategory] = useState(null)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  async function save() {
    if (!category || !amount) return
    setSaving(true)
    setError(null)
    try {
      const amt = Number(amount)
      const { error: err } = await supabase.from('expenses').insert({
        category: category.toLowerCase(),
        description: description || null,
        amount: amt,
        payment_method: method,
        expense_date: new Date().toISOString().slice(0, 10),
      })
      if (err) throw err
      await supabase.from('ledger_entries').insert({
        entry_type: 'expense',
        amount: amt,
        description: `${category}${description ? `: ${description}` : ''}`,
        reference_type: 'expense',
        entry_date: new Date().toISOString().slice(0, 10),
      })
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
        <h1 className="text-xl font-semibold">Expense recorded</h1>
        <p className="text-[#707070] mt-1">{formatMoney(amount)} · {category}</p>
        <Button className="mt-8" onClick={() => navigate('/finance')}>Done</Button>
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[#E8E8E5] bg-white sticky top-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-[#F7F7F5]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-semibold">New expense</h1>
      </div>
      <div className="flex-1 p-4 pb-28 space-y-5">
        <div>
          <h2 className="text-sm font-medium text-[#707070] mb-2">What was it for?</h2>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <SelectionCard key={c} title={c} selected={category === c} onClick={() => setCategory(c)} />
            ))}
          </div>
        </div>
        <div>
          <label className="text-sm text-[#707070]">Amount (TZS)</label>
          <input type="number" className="mt-1 w-full h-12 px-4 rounded-xl border border-[#E8E8E5] text-lg tabular-nums"
            value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" />
        </div>
        <div>
          <label className="text-sm text-[#707070]">Note (optional)</label>
          <input className="mt-1 w-full h-11 px-4 rounded-xl border border-[#E8E8E5]"
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <h2 className="text-sm font-medium text-[#707070] mb-2">Payment method</h2>
          <div className="grid grid-cols-2 gap-2">
            {['cash', 'mobile_money', 'bank'].map((m) => (
              <SelectionCard key={m} title={m === 'mobile_money' ? 'Mobile Money' : m.charAt(0).toUpperCase() + m.slice(1)}
                selected={method === m} onClick={() => setMethod(m)} />
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-[#B4534A]">{error}</p>}
      </div>
      <div className="fixed bottom-0 inset-x-0 z-20 p-4 border-t border-[#E8E8E5] bg-white md:sticky md:inset-x-auto safe-area-pb">
        <Button className="w-full" size="lg" loading={saving} disabled={!category || !amount} onClick={save}>
          Save expense
        </Button>
      </div>
    </div>
  )
}
