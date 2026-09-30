import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatMoney } from '../../utils/format'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'

export default function PayrollPage() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(null)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    supabase.from('employees').select('*').eq('is_active', true).order('name')
      .then(({ data }) => { setEmployees(data || []); setLoading(false) })
  }, [])

  async function payEmployee(emp) {
    setPaying(emp.id)
    setMessage(null)
    try {
      const period = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })
      const { data: run, error: rErr } = await supabase.from('payroll_runs').insert({
        period_label: period,
        period_start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        period_end: new Date().toISOString().slice(0, 10),
        total_amount: emp.salary,
        status: 'paid',
        paid_at: new Date().toISOString(),
      }).select().single()
      if (rErr) throw rErr

      await supabase.from('payroll_items').insert({
        payroll_run_id: run.id,
        employee_id: emp.id,
        base_salary: emp.salary,
        status: 'paid',
      })

      await supabase.from('ledger_entries').insert({
        entry_type: 'payroll',
        amount: emp.salary,
        description: `Salary — ${emp.name} (${period})`,
        reference_type: 'payroll',
        reference_id: run.id,
        entry_date: new Date().toISOString().slice(0, 10),
      })

      setMessage(`Paid ${emp.name} ${formatMoney(emp.salary)}`)
    } catch (e) {
      setMessage(e.message)
    } finally {
      setPaying(null)
    }
  }

  const total = employees.reduce((s, e) => s + Number(e.salary || 0), 0)

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Payroll</h1>
        <p className="text-sm text-[#707070] mt-0.5">Employees and salary payments</p>
      </div>

      <Card className="mb-6">
        <p className="text-sm text-[#707070]">Monthly payroll total</p>
        <p className="text-2xl font-semibold tabular-nums mt-1">{formatMoney(total)}</p>
        <p className="text-xs text-[#707070] mt-1">{employees.length} active employees</p>
      </Card>

      {message && (
        <div className="mb-4 p-3 rounded-xl bg-[#3F8065]/10 text-[#3F8065] text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {message}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="skeleton h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {employees.map((e) => (
            <Card key={e.id} className="!p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">{e.name}</p>
                <p className="text-xs text-[#707070] mt-0.5">{e.role || 'Staff'}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold tabular-nums">{formatMoney(e.salary)}</p>
                <Button size="sm" loading={paying === e.id} onClick={() => payEmployee(e)}>
                  Pay
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
