import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export default function ReportsPage() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-[#707070] mt-0.5">Manage reports</p>
        </div>
      </div>
      <Card className="text-center py-12">
        <p className="text-[#707070] mb-2">Reports module connected to Supabase.</p>
        <p className="text-sm text-[#707070]">Guided flows and lists will expand here.</p>
      </Card>
    </div>
  )
}
